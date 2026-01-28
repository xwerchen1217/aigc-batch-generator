/**
 * 数据同步模块
 * 处理本地 IndexedDB 与飞书多维表格之间的同步
 */

import { WordEntry } from '@/types';
import { wordDb } from './db';
import { queryRecords, appendRecords, updateRecord } from './feishu';

// 本地存储的配置
const SYNC_CONFIG_KEY = 'vocab_sync_config';

export interface SyncConfig {
  userId: string;
  deviceId: string;
  appToken: string;
  usersTableId: string;
  wordsTableId: string;
  lastSyncTime: number;
}

/**
 * 生成设备ID
 */
export function generateDeviceId(): string {
  let deviceId = localStorage.getItem('vocab_device_id');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('vocab_device_id', deviceId);
  }
  return deviceId;
}

/**
 * 获取当前同步配置
 */
export function getSyncConfig(): SyncConfig | null {
  const config = localStorage.getItem(SYNC_CONFIG_KEY);
  return config ? JSON.parse(config) : null;
}

/**
 * 保存同步配置
 */
export function saveSyncConfig(config: SyncConfig): void {
  localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(config));
}

/**
 * 初始化飞书表格
 * 第一次使用时创建用户专属的多维表格
 */
export async function initializeFeishuTables(userId: string): Promise<SyncConfig> {
  // 检查是否已存在配置
  const existing = getSyncConfig();
  if (existing) {
    return existing;
  }

  // TODO: 这里需要先创建应用或使用已有应用的 app_token
  // 暂时使用占位符，需要用户提供
  throw new Error('请先在飞书创建多维表格，并填写 app_token');
}

/**
 * 上传本地数据到飞书
 */
export async function uploadToFeishu(config: SyncConfig): Promise<void> {
  const words = await wordDb.getAll();

  if (words.length === 0) {
    return;
  }

  // 构建记录数据
  const records = words.map(word => ({
    user_id: config.userId,
    word: word.word,
    phonetic: word.phonetic,
    partOfSpeech: word.partOfSpeech,
    definitionEn: word.definitionEn,
    definitionZh: word.definitionZh,
    example: word.example,
    interval: word.interval,
    easeFactor: word.easeFactor,
    nextReviewAt: word.nextReviewAt,
    reviewCount: word.reviewCount,
    lastReviewAt: word.lastReviewAt || '',
    createdAt: word.createdAt,
    local_id: word.id, // 本地ID，用于关联
  }));

  await appendRecords(config.appToken, config.wordsTableId, records);

  // 更新同步时间
  config.lastSyncTime = Date.now();
  saveSyncConfig(config);
}

/**
 * 从飞书下载数据
 */
export async function downloadFromFeishu(config: SyncConfig): Promise<number> {
  // 查询该用户的所有单词（使用正确的 filter 格式）
  const records = await queryRecords(
    config.appToken,
    config.wordsTableId,
    `filter[AND][user_id][eq][${config.userId}]`
  );

  let syncCount = 0;

  for (const record of records) {
    const fields = record.fields as Record<string, unknown>;

    // 检查是否已存在
    const existing = await wordDb.getById(fields.local_id as string);

    if (!existing) {
      // 不存在则添加（保留 SM-2 状态）
      await wordDb.addWithSM2({
        word: fields.word as string,
        phonetic: fields.phonetic as string,
        partOfSpeech: fields.partOfSpeech as string,
        definitionEn: fields.definitionEn as string,
        definitionZh: fields.definitionZh as string,
        example: fields.example as string,
        interval: (fields.interval as number) ?? 0,
        easeFactor: (fields.easeFactor as number) ?? 2.5,
        nextReviewAt: (fields.nextReviewAt as number) ?? Date.now(),
        reviewCount: (fields.reviewCount as number) ?? 0,
        lastReviewAt: (fields.lastReviewAt as number) ?? null,
        createdAt: (fields.createdAt as number) ?? Date.now(),
      });
      syncCount++;
    } else {
      // 存在则检查是否需要更新（以云端为准）
      const cloudTime = fields.updated_at ? Date.parse(fields.updated_at as string) : 0;
      const localTime = existing.lastReviewAt || 0;

      if (cloudTime > localTime) {
        await wordDb.updateSM2(existing.id, 'medium'); // 保持复习进度
        syncCount++;
      }
    }
  }

  // 更新同步时间
  config.lastSyncTime = Date.now();
  saveSyncConfig(config);

  return syncCount;
}

/**
 * 智能同步
 * 自动判断是上传还是下载，或双向合并
 */
export async function smartSync(config: SyncConfig): Promise<{
  uploaded: number;
  downloaded: number;
}> {
  // 获取本地和云端的数据
  const localWords = await wordDb.getAll();
  const cloudRecords = await queryRecords(
    config.appToken,
    config.wordsTableId,
    `filter[AND][user_id][eq][${config.userId}]`
  );

  // 以云端为源头，下载所有数据
  const downloaded = await downloadFromFeishu(config);

  // 本地有但云端没有的，上传
  const cloudLocalIds = new Set(
    cloudRecords.map((r: { fields: Record<string, unknown> }) => r.fields.local_id as string)
  );

  const toUpload = localWords.filter(w => !cloudLocalIds.has(w.id));
  if (toUpload.length > 0) {
    const records = toUpload.map(word => ({
      user_id: config.userId,
      word: word.word,
      phonetic: word.phonetic,
      partOfSpeech: word.partOfSpeech,
      definitionEn: word.definitionEn,
      definitionZh: word.definitionZh,
      example: word.example,
      interval: word.interval,
      easeFactor: word.easeFactor,
      nextReviewAt: word.nextReviewAt,
      reviewCount: word.reviewCount,
      lastReviewAt: word.lastReviewAt || '',
      createdAt: word.createdAt,
      local_id: word.id,
    }));

    await appendRecords(config.appToken, config.wordsTableId, records);
  }

  // 更新同步时间
  config.lastSyncTime = Date.now();
  saveSyncConfig(config);

  return {
    downloaded,
    uploaded: toUpload.length,
  };
}

/**
 * 检查是否需要同步
 */
export function shouldSync(config: SyncConfig | null): boolean {
  if (!config) {
    return false;
  }

  // 超过5分钟就同步
  return Date.now() - config.lastSyncTime > 5 * 60 * 1000;
}

/**
 * 清除同步配置（登出）
 */
export function clearSyncConfig(): void {
  localStorage.removeItem(SYNC_CONFIG_KEY);
}

/**
 * 生成用户ID
 */
export function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

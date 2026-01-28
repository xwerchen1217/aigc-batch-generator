import Dexie, { Table } from 'dexie';
import { WordEntry } from '@/types';
import { calculateNextReview, Rating } from './sm2';

export class VocabDatabase extends Dexie {
  words!: Table<WordEntry>;

  constructor() {
    super('VocabDatabase');
    this.version(1).stores({
      words: 'id, word, createdAt, lastReviewAt, partOfSpeech',
    });
    // Version 2: 添加 SM-2 算法支持
    this.version(2).stores({
      words: 'id, word, createdAt, lastReviewAt, partOfSpeech, nextReviewAt',
    }).upgrade(tx => {
      // 数据迁移：为现有单词添加 SM-2 字段默认值
      return tx.table('words').toCollection().modify(word => {
        word.interval = 0;
        word.easeFactor = 2.5;
        word.nextReviewAt = Date.now();
      });
    });
  }
}

export const db = new VocabDatabase();

// Word CRUD operations
export const wordDb = {
  async add(word: Omit<WordEntry, 'id' | 'createdAt' | 'reviewCount' | 'interval' | 'easeFactor' | 'nextReviewAt'>) {
    const id = `${word.word}-${word.partOfSpeech}`;
    const existing = await db.words.get(id);
    if (existing) {
      return existing;
    }
    const newWord: WordEntry = {
      ...word,
      id,
      createdAt: Date.now(),
      reviewCount: 0,
      interval: 0,
      easeFactor: 2.5,
      nextReviewAt: Date.now(),
    };
    await db.words.add(newWord);
    return newWord;
  },

  async getAll() {
    return await db.words.orderBy('createdAt').reverse().toArray();
  },

  async getById(id: string) {
    return await db.words.get(id);
  },

  async getByWord(word: string) {
    return await db.words.where('word').equals(word.toLowerCase()).toArray();
  },

  async updateReview(id: string) {
    const word = await db.words.get(id);
    if (word) {
      await db.words.update(id, {
        reviewCount: word.reviewCount + 1,
        lastReviewAt: Date.now(),
      });
    }
  },

  async delete(id: string) {
    await db.words.delete(id);
  },

  async clear() {
    await db.words.clear();
  },

  /**
   * 添加单词（保留 SM-2 状态）
   * 用于从云端同步数据时恢复完整的复习进度
   */
  async addWithSM2(word: Omit<WordEntry, 'id'>) {
    const id = `${word.word}-${word.partOfSpeech}`;
    const existing = await db.words.get(id);
    if (existing) {
      return existing;
    }
    const newWord: WordEntry = {
      ...word,
      id,
      createdAt: word.createdAt ?? Date.now(),
    };
    await db.words.add(newWord);
    return newWord;
  },

  // SM-2 相关方法

  /**
   * 获取待复习单词（到期 + 新词）
   * 优先级：到期单词 > 新词
   */
  async getDueWords(): Promise<WordEntry[]> {
    const now = Date.now();
    const allWords = await db.words.toArray();

    // 分类
    const dueWords = allWords.filter(w => w.nextReviewAt <= now && w.reviewCount > 0);
    const newWords = allWords.filter(w => w.reviewCount === 0);

    // 按到期时间排序（最紧急的在前）
    dueWords.sort((a, b) => a.nextReviewAt - b.nextReviewAt);

    // 新词按创建时间排序（最新的在前）
    newWords.sort((a, b) => b.createdAt - a.createdAt);

    return [...dueWords, ...newWords];
  },

  /**
   * 按下次复习时间获取所有单词
   */
  async getAllWordsOrdered(): Promise<WordEntry[]> {
    return await db.words.orderBy('nextReviewAt').toArray();
  },

  /**
   * 更新 SM-2 状态
   * @param id 单词ID
   * @param rating 用户评分
   */
  async updateSM2(id: string, rating: Rating): Promise<void> {
    const word = await db.words.get(id);
    if (!word) return;

    const newState = calculateNextReview(
      {
        interval: word.interval,
        easeFactor: word.easeFactor,
        nextReviewAt: word.nextReviewAt,
      },
      rating
    );

    await db.words.update(id, {
      interval: newState.interval,
      easeFactor: newState.easeFactor,
      nextReviewAt: newState.nextReviewAt,
      reviewCount: word.reviewCount + 1,
      lastReviewAt: Date.now(),
    });
  },

  /**
   * 获取统计信息
   */
  async getStats(): Promise<{
    due: number;
    new: number;
    total: number;
  }> {
    const allWords = await db.words.toArray();
    const now = Date.now();

    const due = allWords.filter(w => w.nextReviewAt <= now && w.reviewCount > 0).length;
    const newWords = allWords.filter(w => w.reviewCount === 0).length;
    const total = allWords.length;

    return { due, new: newWords, total };
  },
};

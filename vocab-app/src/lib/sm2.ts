/**
 * SM-2 (SuperMemo 2) 间隔重复算法实现
 * 用于计算单词复习间隔和下次复习时间
 */

export type Rating = 'hard' | 'medium' | 'easy';

export interface SM2State {
  interval: number;      // 复习间隔（天）
  easeFactor: number;    // 容易度因子
  nextReviewAt: number;  // 下次复习时间戳
}

export interface MasteryLevel {
  level: 'new' | 'learning' | 'reviewing' | 'mastered';
  label: string;
  icon: string;
  color: string;
}

// SM-2 算法常量
const MIN_EASE_FACTOR = 1.3;
const DEFAULT_EASE_FACTOR = 2.5;

/**
 * 计算新的 SM-2 状态
 * @param current 当前状态
 * @param rating 用户评分
 * @returns 新的状态
 */
export function calculateNextReview(
  current: SM2State,
  rating: Rating
): SM2State {
  const now = Date.now();
  let { interval, easeFactor } = current;

  // 首次复习（interval === 0）
  if (interval === 0) {
    return {
      interval: 1,
      easeFactor: DEFAULT_EASE_FACTOR,
      nextReviewAt: now + 24 * 60 * 60 * 1000, // 1天后
    };
  }

  // 根据评分调整容易度因子和间隔
  switch (rating) {
    case 'hard':
      // 不认识：间隔减半，难度增加
      easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor - 0.2);
      interval = Math.max(1, Math.floor(interval * 0.5));
      break;

    case 'medium':
      // 模糊：间隔按 easeFactor 计算
      interval = Math.max(1, Math.floor(interval * easeFactor));
      // easeFactor 不变
      break;

    case 'easy':
      // 认识：间隔增加 1.3 倍，难度降低
      easeFactor += 0.1;
      interval = Math.floor(interval * easeFactor * 1.3);
      break;
  }

  // 确保至少间隔1天
  interval = Math.max(1, interval);

  return {
    interval,
    easeFactor,
    nextReviewAt: now + interval * 24 * 60 * 60 * 1000,
  };
}

/**
 * 获取掌握程度
 * @param interval 当前复习间隔
 * @param reviewCount 复习次数
 */
export function getMasteryLevel(interval: number, reviewCount: number): MasteryLevel {
  if (reviewCount === 0) {
    return {
      level: 'new',
      label: '新词',
      icon: '📝',
      color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    };
  }

  if (interval < 7) {
    return {
      level: 'learning',
      label: '学习中',
      icon: '📚',
      color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    };
  }

  if (interval < 21) {
    return {
      level: 'reviewing',
      label: '复习中',
      icon: '🔄',
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    };
  }

  return {
    level: 'mastered',
    label: '已掌握',
    icon: '✅',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  };
}

/**
 * 检查单词是否到期需要复习
 * @param nextReviewAt 下次复习时间
 */
export function isDue(nextReviewAt: number): boolean {
  return nextReviewAt <= Date.now();
}

/**
 * 格式化下次复习时间
 * @param nextReviewAt 下次复习时间戳
 */
export function formatNextReview(nextReviewAt: number): string {
  const now = Date.now();
  const diff = nextReviewAt - now;

  if (diff <= 0) {
    return '现在';
  }

  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

  if (days > 0) {
    return `${days}天后`;
  }

  if (hours > 0) {
    return `${hours}小时后`;
  }

  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  return `${minutes}分钟后`;
}

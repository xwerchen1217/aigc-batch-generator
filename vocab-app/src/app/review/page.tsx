'use client';

import { useState, useEffect } from 'react';
import { Flashcard } from '@/components/Flashcard';
import { useWordStore } from '@/store/useWordStore';
import { wordDb } from '@/lib/db';

type ReviewMode = 'due' | 'all';

export default function ReviewPage() {
  const { dueWords, loadDueWords, reviewMode, setReviewMode } = useWordStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [stats, setStats] = useState({ due: 0, new: 0, total: 0 });
  const [reviewQueue, setReviewQueue] = useState<typeof dueWords>([]);

  // Load stats on mount
  useEffect(() => {
    wordDb.getStats().then(setStats);
  }, []);

  // Load review queue based on mode
  useEffect(() => {
    if (reviewMode === 'due') {
      loadDueWords().then(() => {
        setShowCompletion(false);
        setCurrentIndex(0);
      });
    } else {
      // All words mode - load all words ordered
      wordDb.getAllWordsOrdered().then((words) => {
        setReviewQueue(words);
        setShowCompletion(false);
        setCurrentIndex(0);
      });
    }
  }, [reviewMode, loadDueWords]);

  // Use the appropriate word list
  const currentList = reviewMode === 'due' ? dueWords : reviewQueue;

  const handleRating = async (rating: 'hard' | 'medium' | 'easy') => {
    const currentWord = currentList[currentIndex];
    if (!currentWord) return;

    // Update SM-2 state
    await wordDb.updateSM2(currentWord.id, rating);

    // Move to next card or show completion
    if (currentIndex < currentList.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Review complete
      setShowCompletion(true);
      // Refresh stats
      wordDb.getStats().then(setStats);
    }
  };

  const handleContinueAll = async () => {
    // Load all words for continued review
    const allWords = await wordDb.getAllWordsOrdered();
    setReviewQueue(allWords);
    setReviewMode('all');
    setCurrentIndex(0);
    setShowCompletion(false);
  };

  const handleReset = () => {
    setShowCompletion(false);
    setCurrentIndex(0);
    loadDueWords();
  };

  // Empty state
  if (stats.total === 0) {
    return (
      <div className="pt-6">
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📭</div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
            没有复习单词
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            搜索并添加单词到复习列表
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
          >
            去查词
          </a>
        </div>
      </div>
    );
  }

  // Completion state for due mode
  if (showCompletion && reviewMode === 'due') {
    return (
      <div className="pt-6">
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
            今日复习完成！
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            已复习 {currentList.length} 个单词
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleContinueAll}
              className="px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors"
            >
              继续复习未到期单词
            </button>
            <a
              href="/"
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
            >
              返回首页
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Completion state for all mode
  if (showCompletion && reviewMode === 'all') {
    return (
      <div className="pt-6">
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🎊</div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
            全部复习完成！
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            已复习 {currentList.length} 个单词
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
            >
              重新复习
            </button>
            <a
              href="/"
              className="px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors"
            >
              返回首页
            </a>
          </div>
        </div>
      </div>
    );
  }

  // No due words but has new words or total words
  if (currentList.length === 0 && stats.total > 0) {
    return (
      <div className="pt-6">
        <div className="text-center py-16">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
            暂无待复习单词
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            所有单词都已安排到未来复习
          </p>
          <button
            onClick={handleContinueAll}
            className="px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors"
          >
            复习所有单词
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-6">
      {/* Stats Bar */}
      <div className="mb-4 px-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-4 text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              今日: <span className="font-semibold text-gray-800 dark:text-gray-200">{stats.due}</span>
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              新词: <span className="font-semibold text-gray-800 dark:text-gray-200">{stats.new}</span>
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              总: <span className="font-semibold text-gray-800 dark:text-gray-200">{stats.total}</span>
            </span>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setReviewMode('due')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              reviewMode === 'due'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            只复习到期
          </button>
          <button
            onClick={() => setReviewMode('all')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              reviewMode === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            全部复习
          </button>
        </div>
      </div>

      <Flashcard
        word={currentList[currentIndex]}
        onRating={handleRating}
        currentIndex={currentIndex}
        total={currentList.length}
      />
    </div>
  );
}

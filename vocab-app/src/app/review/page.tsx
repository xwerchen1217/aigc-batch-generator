'use client';

import { useState, useEffect } from 'react';
import { Flashcard } from '@/components/Flashcard';
import { useWordStore } from '@/store/useWordStore';
import { wordDb } from '@/lib/db';

export default function ReviewPage() {
  const { savedWords, setSavedWords, removeSavedWord } = useWordStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEmpty, setIsEmpty] = useState(false);

  useEffect(() => {
    // Load saved words
    wordDb.getAll().then((words) => {
      setSavedWords(words);
      setIsEmpty(words.length === 0);
    });
  }, [setSavedWords]);

  const handleRating = async (rating: 'hard' | 'medium' | 'easy') => {
    const currentWord = savedWords[currentIndex];
    if (!currentWord) return;

    // Update review count
    await wordDb.updateReview(currentWord.id);

    // Move to next card or show completion
    if (currentIndex < savedWords.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Review complete - show completion state
      setIsEmpty(true);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsEmpty(false);
  };

  // Empty state
  if (savedWords.length === 0) {
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

  // Completion state
  if (isEmpty) {
    return (
      <div className="pt-6">
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
            复习完成！
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            已复习 {savedWords.length} 个单词
          </p>
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
          >
            重新复习
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-6">
      <Flashcard
        word={savedWords[currentIndex]}
        onRating={handleRating}
        currentIndex={currentIndex}
        total={savedWords.length}
      />
    </div>
  );
}

'use client';

import { useState } from 'react';
import { WordEntry } from '@/types';
import { SpeakButton } from './SpeakButton';
import { MasteryBadge } from './MasteryBadge';

interface FlashcardProps {
  word: WordEntry;
  onRating: (rating: 'hard' | 'medium' | 'easy') => void;
  currentIndex: number;
  total: number;
}

export function Flashcard({ word, onRating, currentIndex, total }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  const handleRating = (rating: 'hard' | 'medium' | 'easy') => {
    onRating(rating);
    setIsFlipped(false);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Progress */}
      <div className="mb-4 text-center">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          复习闪卡 · {currentIndex + 1}/{total}
        </span>
        <div className="w-48 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-2 overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Card Container */}
      <div className="relative w-full max-w-sm h-80 perspective-1000">
        <div
          className={`relative w-full h-full transition-transform duration-500 transform-style-3d cursor-pointer ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          onClick={handleCardClick}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front */}
          <div
            className="absolute w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-xl flex flex-col items-center justify-center text-white backface-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* Mastery Badge */}
            <div className="absolute top-4">
              <MasteryBadge interval={word.interval} reviewCount={word.reviewCount} showLabel={false} />
            </div>

            <h2 className="text-4xl font-bold capitalize mb-4">{word.word}</h2>
            <p className="text-white/80 text-sm mb-4">{word.phonetic}</p>
            <SpeakButton word={word.word} size="lg" className="bg-white/20 hover:bg-white/30 text-white" />
            <p className="text-white/60 text-xs mt-8">(点击翻转查看释义)</p>
          </div>

          {/* Back */}
          <div
            className="absolute w-full h-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 overflow-y-auto backface-hidden"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="text-center mb-4">
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm rounded-full">
                {word.partOfSpeech}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400 mb-1">📖 English</p>
                <p className="text-gray-800 dark:text-gray-200">{word.definitionEn}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 mb-1">📗 中文</p>
                <p className="text-gray-800 dark:text-gray-200">{word.definitionZh}</p>
              </div>
              {word.example && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <p className="text-gray-500 dark:text-gray-400 mb-1 text-xs">💬 例句</p>
                  <p className="text-gray-700 dark:text-gray-300 italic text-sm leading-relaxed">
                    &ldquo;{word.example}&rdquo;
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsFlipped(false);
              }}
              className="mt-4 w-full py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300"
            >
              ← 返回正面
            </button>
          </div>
        </div>
      </div>

      {/* Rating Buttons - Show when flipped */}
      <div
        className={`flex gap-3 mt-6 transition-all duration-300 ${
          isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <button
          onClick={() => handleRating('hard')}
          className="px-6 py-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-xl font-medium hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
        >
          😞 不认识
        </button>
        <button
          onClick={() => handleRating('medium')}
          className="px-6 py-3 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded-xl font-medium hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors"
        >
          🤔 模糊
        </button>
        <button
          onClick={() => handleRating('easy')}
          className="px-6 py-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-xl font-medium hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
        >
          😊 认识
        </button>
      </div>
    </div>
  );
}

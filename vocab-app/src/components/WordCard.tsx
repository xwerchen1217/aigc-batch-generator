'use client';

import { WordEntry } from '@/types';
import { SpeakButton } from './SpeakButton';
import { useWordStore } from '@/store/useWordStore';
import { wordDb } from '@/lib/db';

interface WordCardProps {
  word: WordEntry;
  synonyms?: string[];
}

export function WordCard({ word, synonyms = [] }: WordCardProps) {
  const { addSavedWord, isWordSaved } = useWordStore();
  const saved = isWordSaved(word.word, word.partOfSpeech);

  const handleSave = async () => {
    if (!saved) {
      await wordDb.add(word);
      addSavedWord(word);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold capitalize">{word.word}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-gray-500 text-sm">{word.phonetic || 'N/A'}</span>
              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                {word.partOfSpeech}
              </span>
            </div>
          </div>
          <SpeakButton word={word.word} size="lg" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* English Definition */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
            📖 English Definition
          </h3>
          <p className="text-gray-800 dark:text-gray-200">{word.definitionEn}</p>
        </div>

        {/* Chinese Definition */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
            📗 中文释义
          </h3>
          <p className="text-gray-800 dark:text-gray-200">{word.definitionZh}</p>
        </div>

        {/* Example */}
        {word.example && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
              💬 Example
            </h3>
            <p className="text-gray-600 dark:text-gray-300 italic">
              &ldquo;{word.example}&rdquo;
            </p>
          </div>
        )}

        {/* Similar Words */}
        {synonyms.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
              📚 Similar ({word.partOfSpeech})
            </h3>
            <div className="flex flex-wrap gap-2">
              {synonyms.map((synonym) => (
                <span
                  key={synonym}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => {
                    // Could trigger search for synonym
                    window.location.href = `/?q=${synonym}`;
                  }}
                >
                  {synonym}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saved}
          className={`w-full py-3 rounded-xl font-semibold transition-all ${
            saved
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg'
          }`}
        >
          {saved ? '✓ 已加入复习' : '⭐ 加入复习'}
        </button>
      </div>
    </div>
  );
}

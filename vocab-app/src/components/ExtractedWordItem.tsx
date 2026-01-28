'use client';

import { useState } from 'react';
import { ExtractedWord } from '@/lib/sentence';
import { SpeakButton } from './SpeakButton';
import { useWordStore } from '@/store/useWordStore';

interface ExtractedWordItemProps {
  word: ExtractedWord;
  isSelected: boolean;
  onToggle: (id: string) => void;
  showDetail?: boolean;
  onToggleDetail?: () => void;
}

export function ExtractedWordItem({
  word,
  isSelected,
  onToggle,
  showDetail = false,
  onToggleDetail,
}: ExtractedWordItemProps) {
  const { isWordSaved } = useWordStore();
  const isSaved = isWordSaved(word.word, word.partOfSpeech);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (isSaved || saving) return;
    setSaving(true);
    try {
      // 这里需要导入 wordDb，为了避免循环依赖，我们通过事件处理
      // 实际保存逻辑会在父组件中处理
      onToggleDetail?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl p-4 border-2 transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      {/* Header - Checkbox and Word */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(word.id)}
          className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500 cursor-pointer"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 capitalize">
              {word.word}
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {word.phonetic}
            </span>
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full">
              {word.partOfSpeech}
            </span>
            <SpeakButton word={word.word} size="sm" />
          </div>

          {/* Definition */}
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {word.definitionEn}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {word.definitionZh}
            </p>
          </div>

          {/* Actions */}
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleDetail?.();
              }}
              className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {showDetail ? '收起详情' : '查看详情'}
            </button>
            {isSaved && (
              <span className="text-sm text-green-500 dark:text-green-400">
                ✓ 已保存
              </span>
          )}
          </div>
        </div>
      </div>

      {/* Detail Section */}
      {showDetail && word.example && (
        <div className="mt-3 ml-8 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">💬 例句</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 italic">
            &ldquo;{word.example}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { SentenceResult, ExtractedWord, loadChineseTranslations, loadSentenceTranslation } from '@/lib/sentence';
import { ExtractedWordItem } from './ExtractedWordItem';
import { wordDb } from '@/lib/db';
import { WordEntry } from '@/types';

interface SentenceCardProps {
  result: SentenceResult;
}

export function SentenceCard({ result }: SentenceCardProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [words, setWords] = useState<ExtractedWord[]>(result.words);
  const [translation, setTranslation] = useState<string>(result.translation);
  const [saving, setSaving] = useState(false);

  // 异步加载句子翻译
  useEffect(() => {
    loadSentenceTranslation(result.original).then((zh) => {
      setTranslation(zh);
    });
  }, [result.original]);

  // 异步加载单词的中文翻译
  useEffect(() => {
    loadChineseTranslations(words).then(() => {
      setWords([...words]); // 触发更新
    });
  }, []);

  const handleToggle = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === words.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(words.map(w => w.id)));
    }
  };

  const handleClear = () => {
    setSelectedIds(new Set());
  };

  const handleSaveSelected = async () => {
    if (selectedIds.size === 0 || saving) return;

    setSaving(true);
    try {
      const selectedWords = words.filter(w => selectedIds.has(w.id));

      for (const word of selectedWords) {
        await wordDb.add({
          word: word.word,
          phonetic: word.phonetic,
          partOfSpeech: word.partOfSpeech,
          definitionEn: word.definitionEn,
          definitionZh: word.definitionZh,
          example: word.example,
        });
      }

      alert(`已保存 ${selectedWords.length} 个单词到复习列表`);
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Save error:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  if (words.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            原句
          </h3>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            &ldquo;{result.original}&rdquo;
          </p>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">📗 中文翻译</p>
            <p className="text-gray-700 dark:text-gray-300">
              {translation}
            </p>
          </div>
          <div className="mt-6 text-center py-8 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <p className="text-amber-700 dark:text-amber-400">
              未找到可学习的单词
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-500 mt-1">
              句子中的词太简单或已被过滤
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sentence Display */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            原句
          </h3>
          <p className="text-gray-700 dark:text-gray-300 mb-4 text-lg leading-relaxed">
            &ldquo;{result.original}&rdquo;
          </p>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">📗 中文翻译</p>
            <p className="text-gray-700 dark:text-gray-300">
              {translation}
            </p>
          </div>
        </div>
      </div>

      {/* Words List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              📝 提取的单词 ({words.length})
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400"
              >
                {selectedIds.size === words.length ? '清空全选' : '全选'}
              </button>
              {selectedIds.size > 0 && (
                <button
                  onClick={handleClear}
                  className="text-sm text-gray-500 hover:text-gray-600 dark:text-gray-400"
                >
                  清空选择
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {words.map(word => (
            <ExtractedWordItem
              key={word.id}
              word={word}
              isSelected={selectedIds.has(word.id)}
              onToggle={handleToggle}
              showDetail={expandedId === word.id}
              onToggleDetail={() => setExpandedId(expandedId === word.id ? null : word.id)}
            />
          ))}
        </div>

        {/* Save Button */}
        {selectedIds.size > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSaveSelected}
              disabled={saving}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-xl font-semibold transition-colors"
            >
              {saving ? '保存中...' : `保存选中的单词(${selectedIds.size})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

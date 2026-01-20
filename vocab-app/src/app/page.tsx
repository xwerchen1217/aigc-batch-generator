'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SearchBar } from '@/components/SearchBar';
import { WordCard } from '@/components/WordCard';
import { useWordStore } from '@/store/useWordStore';
import { getWordWithTranslation } from '@/lib/api';
import { wordDb } from '@/lib/db';
import { WordEntry } from '@/types';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  const { currentWord, setCurrentWord, isLoading, setIsLoading, setSavedWords } = useWordStore();
  const [synonyms, setSynonyms] = useState<string[]>([]);

  // Load saved words on mount
  useEffect(() => {
    wordDb.getAll().then((words) => {
      setSavedWords(words);
    });
  }, [setSavedWords]);

  // Handle search
  const handleSearch = async (word: string) => {
    setIsLoading(true);
    try {
      const result = await getWordWithTranslation(word);
      if (result) {
        const wordEntry: WordEntry = {
          id: `${result.word}-${result.partOfSpeech}`,
          word: result.word,
          phonetic: result.phonetic,
          partOfSpeech: result.partOfSpeech,
          definitionEn: result.definitionEn,
          definitionZh: result.definitionZh,
          example: result.example,
          createdAt: Date.now(),
          reviewCount: 0,
        };
        setCurrentWord(wordEntry);
        setSynonyms(result.synonyms);
      } else {
        alert(`找不到单词 "${word}"`);
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('搜索出错，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle URL query param
  useEffect(() => {
    if (query && query !== currentWord?.word) {
      handleSearch(query);
    }
  }, [query]);

  return (
    <div className="pt-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          🔤 Vocab App
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          查词、复习、记忆
        </p>
      </div>

      {/* Search Bar */}
      <SearchBar onSearch={handleSearch} isLoading={isLoading} />

      {/* Word Card */}
      {currentWord && <WordCard word={currentWord} synonyms={synonyms} />}

      {/* Empty State */}
      {!currentWord && !isLoading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <p className="text-gray-500 dark:text-gray-400">
            输入单词开始学习
          </p>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="pt-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            🔤 Vocab App
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            查词、复习、记忆
          </p>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SearchBar } from '@/components/SearchBar';
import { WordCard } from '@/components/WordCard';
import { SentenceCard } from '@/components/SentenceCard';
import { SyncStatus } from '@/components/SyncStatus';
import { useWordStore } from '@/store/useWordStore';
import { getWordWithTranslation, getChineseTranslation } from '@/lib/api';
import { processSentence } from '@/lib/sentence';
import { isSentenceInput, isSentenceTooLong } from '@/lib/wordExtractor';
import { wordDb } from '@/lib/db';
import { WordEntry } from '@/types';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  const { currentWord, setCurrentWord, isLoading, setIsLoading, setSavedWords, loadSyncConfig, autoSync } = useWordStore();
  const [synonyms, setSynonyms] = useState<string[]>([]);
  const [sentenceResult, setSentenceResult] = useState<Awaited<ReturnType<typeof processSentence>> | null>(null);

  // Load saved words and sync config on mount
  useEffect(() => {
    wordDb.getAll().then((words) => {
      setSavedWords(words);
    });
    // Load sync config on client side
    loadSyncConfig();
    // Trigger auto-sync
    autoSync();
  }, [setSavedWords, loadSyncConfig, autoSync]);

  // Handle search - detect input type
  const handleSearch = async (input: string) => {
    setIsLoading(true);
    // Clear previous results
    setCurrentWord(null);
    setSentenceResult(null);
    setSynonyms([]);

    try {
      // Check if input is a sentence
      if (isSentenceInput(input)) {
        // Check if sentence is too long
        if (isSentenceTooLong(input)) {
          alert('句子过长，建议分段查询（最多200词）');
          setIsLoading(false);
          return;
        }

        // Process sentence
        const result = await processSentence(input);
        setSentenceResult(result);
      } else {
        // Process as word
        const result = await getWordWithTranslation(input);
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
            interval: 0,
            easeFactor: 2.5,
            nextReviewAt: Date.now(),
          };
          setCurrentWord(wordEntry);
          setSynonyms(result.synonyms);

          // 异步加载中文翻译
          getChineseTranslation(result.definitionEn).then((zh) => {
            const { currentWord: current } = useWordStore.getState();
            if (current && current.word === result.word) {
              setCurrentWord({ ...current, definitionZh: zh });
            }
          }).catch(() => {
            const { currentWord: current } = useWordStore.getState();
            if (current && current.word === result.word) {
              setCurrentWord({ ...current, definitionZh: result.definitionEn });
            }
          });
        } else {
          alert(`找不到单词 "${input}"`);
        }
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
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            🔤 Vocab App
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            查词、复习、记忆
          </p>
        </div>
        <SyncStatus />
      </div>

      {/* Search Bar */}
      <SearchBar onSearch={handleSearch} isLoading={isLoading} />

      {/* Result Cards - Conditional Rendering */}
      {currentWord && <WordCard word={currentWord} synonyms={synonyms} />}
      {sentenceResult && <SentenceCard result={sentenceResult} />}

      {/* Empty State */}
      {!currentWord && !sentenceResult && !isLoading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <p className="text-gray-500 dark:text-gray-400">
            输入单词或句子开始学习
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            支持单词查询和句子解析
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

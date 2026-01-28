/**
 * 句子处理模块
 * 处理句子翻译和单词查询
 */

import { translateText, lookupWord } from './api';
import { DictionaryResponse } from '@/types';
import { extractWords } from './wordExtractor';

export interface ExtractedWord {
  id: string;           // word-partOfSpeech
  word: string;
  phonetic: string;
  partOfSpeech: string;
  definitionEn: string;
  definitionZh: string;
  example: string;
}

export interface SentenceResult {
  original: string;
  translation: string;
  words: ExtractedWord[];
}

/**
 * 处理句子输入（立即返回，不等待翻译）
 * @param sentence 用户输入的句子
 * @returns 包含翻译和提取单词的结果
 */
export async function processSentence(sentence: string): Promise<SentenceResult | null> {
  // 1. 启动翻译但不等待 - 异步加载
  translateText(sentence).catch(() => {});

  // 2. 提取单词
  const extractedWordStrings = extractWords(sentence);

  if (extractedWordStrings.length === 0) {
    return {
      original: sentence,
      translation: '加载中...', // 占位符，异步加载
      words: [],
    };
  }

  // 3. 并行查询所有单词的详情（使用 allSettled 部分失败不影响整体）
  const wordPromises = extractedWordStrings.map(async (word) => {
    try {
      const result = await lookupWord(word);
      if (!result) return null;

      const firstMeaning = result.meanings?.[0];
      const firstDefinition = firstMeaning?.definitions?.[0];

      if (!firstDefinition) return null;

      // 查找例句
      let example = firstDefinition.example || '';
      if (!example && firstMeaning.definitions) {
        for (const def of firstMeaning.definitions) {
          if (def.example) {
            example = def.example;
            break;
          }
        }
      }
      if (!example && result.meanings) {
        for (const meaning of result.meanings) {
          for (const def of meaning.definitions || []) {
            if (def.example) {
              example = def.example;
              break;
            }
          }
          if (example) break;
        }
      }

      return {
        id: `${result.word}-${firstMeaning.partOfSpeech}`,
        word: result.word,
        phonetic: result.phonetic || result.phonetics?.[0]?.text || '',
        partOfSpeech: firstMeaning.partOfSpeech,
        definitionEn: firstDefinition.definition,
        definitionZh: '加载中...', // 异步加载
        example,
      };
    } catch (error) {
      console.error(`Error looking up word "${word}":`, error);
      return null;
    }
  });

  const settled = await Promise.allSettled(wordPromises);
  const words: ExtractedWord[] = settled
    .filter((result): result is PromiseFulfilledResult<ExtractedWord | null> =>
      result.status === 'fulfilled' && result.value !== null
    )
    .map(result => result.value!);

  return {
    original: sentence,
    translation: '加载中...', // 占位符，异步加载
    words,
  };
}

/**
 * 异步加载句子翻译
 */
export async function loadSentenceTranslation(sentence: string): Promise<string> {
  try {
    return await translateText(sentence);
  } catch (error) {
    console.error('Translation error:', error);
    return '翻译失败';
  }
}

/**
 * 异步加载中文翻译
 */
export async function loadChineseTranslations(words: ExtractedWord[]): Promise<void> {
  const translationPromises = words.map(async (word) => {
    try {
      const zh = await translateText(word.definitionEn);
      word.definitionZh = zh;
    } catch (error) {
      word.definitionZh = word.definitionEn; // 失败时使用英文
    }
  });

  await Promise.allSettled(translationPromises);
}

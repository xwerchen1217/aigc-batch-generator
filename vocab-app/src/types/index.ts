export interface WordEntry {
  id: string;
  word: string;
  phonetic: string;
  partOfSpeech: string;
  definitionEn: string;
  definitionZh: string;
  example: string;
  createdAt: number;
  reviewCount: number;
  lastReviewAt?: number;
  // SM-2 算法字段
  interval: number;      // 复习间隔（天）
  easeFactor: number;    // 容易度因子
  nextReviewAt: number;  // 下次复习时间戳
}

export interface DictionaryResponse {
  word: string;
  phonetic?: string;
  phonetics: Array<{
    text?: string;
    audio?: string;
  }>;
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      example?: string;
    }>;
    synonyms?: string[];
  }>;
}

export interface TranslateResponse {
  responseData: {
    translatedText: string;
  };
}

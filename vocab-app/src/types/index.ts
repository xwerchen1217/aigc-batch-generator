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

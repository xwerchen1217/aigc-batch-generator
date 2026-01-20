import Dexie, { Table } from 'dexie';
import { WordEntry } from '@/types';

export class VocabDatabase extends Dexie {
  words!: Table<WordEntry>;

  constructor() {
    super('VocabDatabase');
    this.version(1).stores({
      words: 'id, word, createdAt, lastReviewAt, partOfSpeech',
    });
  }
}

export const db = new VocabDatabase();

// Word CRUD operations
export const wordDb = {
  async add(word: Omit<WordEntry, 'id' | 'createdAt' | 'reviewCount'>) {
    const id = `${word.word}-${word.partOfSpeech}`;
    const existing = await db.words.get(id);
    if (existing) {
      return existing;
    }
    const newWord: WordEntry = {
      ...word,
      id,
      createdAt: Date.now(),
      reviewCount: 0,
    };
    await db.words.add(newWord);
    return newWord;
  },

  async getAll() {
    return await db.words.orderBy('createdAt').reverse().toArray();
  },

  async getById(id: string) {
    return await db.words.get(id);
  },

  async getByWord(word: string) {
    return await db.words.where('word').equals(word.toLowerCase()).toArray();
  },

  async updateReview(id: string) {
    const word = await db.words.get(id);
    if (word) {
      await db.words.update(id, {
        reviewCount: word.reviewCount + 1,
        lastReviewAt: Date.now(),
      });
    }
  },

  async delete(id: string) {
    await db.words.delete(id);
  },

  async clear() {
    await db.words.clear();
  },
};

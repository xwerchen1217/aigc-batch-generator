import { create } from 'zustand';
import { WordEntry } from '@/types';

interface WordStore {
  // Current word being viewed
  currentWord: WordEntry | null;
  setCurrentWord: (word: WordEntry | null) => void;

  // Saved words for review
  savedWords: WordEntry[];
  setSavedWords: (words: WordEntry[]) => void;
  addSavedWord: (word: WordEntry) => void;
  removeSavedWord: (id: string) => void;
  isWordSaved: (word: string, partOfSpeech: string) => boolean;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export const useWordStore = create<WordStore>((set, get) => ({
  currentWord: null,
  setCurrentWord: (word) => set({ currentWord: word }),

  savedWords: [],
  setSavedWords: (words) => set({ savedWords: words }),
  addSavedWord: (word) => {
    const { savedWords } = get();
    const exists = savedWords.some((w) => w.id === word.id);
    if (!exists) {
      set({ savedWords: [...savedWords, word] });
    }
  },
  removeSavedWord: (id) => {
    const { savedWords } = get();
    set({ savedWords: savedWords.filter((w) => w.id !== id) });
  },
  isWordSaved: (word, partOfSpeech) => {
    const { savedWords } = get();
    const id = `${word}-${partOfSpeech}`;
    return savedWords.some((w) => w.id === id);
  },

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  error: null,
  setError: (error) => set({ error }),
}));

import { create } from 'zustand';
import { WordEntry } from '@/types';
import { wordDb } from '@/lib/db';
import {
  SyncConfig,
  getSyncConfig,
  saveSyncConfig,
  smartSync,
  shouldSync,
  clearSyncConfig,
} from '@/lib/sync';

type ReviewMode = 'due' | 'all';

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

  // SM-2 Review state
  dueWords: WordEntry[];
  reviewMode: ReviewMode;
  loadDueWords: () => Promise<void>;
  setReviewMode: (mode: ReviewMode) => void;

  // Sync state
  syncConfig: SyncConfig | null;
  isLoggedIn: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  setSyncConfig: (config: SyncConfig | null) => void;
  loadSyncConfig: () => void;
  login: (config: SyncConfig) => void;
  logout: () => void;
  triggerSync: () => Promise<{ uploaded: number; downloaded: number }>;
  autoSync: () => Promise<void>;

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

  // SM-2 Review state
  dueWords: [],
  reviewMode: 'due',
  loadDueWords: async () => {
    const words = await wordDb.getDueWords();
    set({ dueWords: words });
  },
  setReviewMode: (mode) => set({ reviewMode: mode }),

  // Sync state (initialize with null to avoid SSR localStorage access)
  syncConfig: null,
  isLoggedIn: false,
  isSyncing: false,
  lastSyncTime: null,
  setSyncConfig: (config) => {
    if (config) {
      saveSyncConfig(config);
    }
    set({
      syncConfig: config,
      isLoggedIn: !!config,
      lastSyncTime: config?.lastSyncTime || null
    });
  },
  loadSyncConfig: () => {
    const config = getSyncConfig();
    if (config) {
      set({
        syncConfig: config,
        isLoggedIn: true,
        lastSyncTime: config.lastSyncTime || null
      });
    }
  },
  login: (config) => {
    saveSyncConfig(config);
    set({
      syncConfig: config,
      isLoggedIn: true,
      lastSyncTime: config.lastSyncTime || null
    });
  },
  logout: () => {
    clearSyncConfig();
    set({
      syncConfig: null,
      isLoggedIn: false,
      lastSyncTime: null
    });
  },
  triggerSync: async () => {
    const { syncConfig: config } = get();
    if (!config) {
      throw new Error('未登录');
    }

    set({ isSyncing: true });
    try {
      const result = await smartSync(config);
      set({ lastSyncTime: Date.now() });

      // 刷新本地数据
      const words = await wordDb.getAll();
      set({ savedWords: words });

      return result;
    } finally {
      set({ isSyncing: false });
    }
  },
  autoSync: async () => {
    const { syncConfig: config } = get();
    if (!config || !shouldSync(config)) {
      return;
    }

    try {
      await smartSync(config);
      set({ lastSyncTime: Date.now() });

      // 刷新本地数据
      const words = await wordDb.getAll();
      set({ savedWords: words });
    } catch (error) {
      console.error('Auto sync error:', error);
    }
  },

  // Loading states
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  error: null,
  setError: (error) => set({ error }),
}));

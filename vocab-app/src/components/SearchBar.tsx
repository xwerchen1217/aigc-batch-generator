'use client';

import { useState, FormEvent } from 'react';

interface SearchBarProps {
  onSearch: (word: string) => void;
  isLoading?: boolean;
}

export function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed) {
      onSearch(trimmed);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="搜索单词..."
        disabled={isLoading}
        className="w-full px-4 py-3 pl-12 text-lg bg-gray-100 dark:bg-gray-800 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        autoComplete="off"
      />
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
        🔍
      </span>
      {isLoading && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2">
          <span className="animate-spin inline-block">⏳</span>
        </span>
      )}
    </form>
  );
}

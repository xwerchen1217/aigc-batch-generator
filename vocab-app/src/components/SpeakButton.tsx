'use client';

import { speak } from '@/lib/speech';

interface SpeakButtonProps {
  word: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SpeakButton({ word, size = 'md', className = '' }: SpeakButtonProps) {
  const handleClick = () => {
    speak(word);
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  };

  return (
    <button
      onClick={handleClick}
      className={`${sizeClasses[size]} rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors flex items-center justify-center ${className}`}
      aria-label={`Pronounce ${word}`}
    >
      🔊
    </button>
  );
}

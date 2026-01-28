'use client';

import { useWordStore } from '@/store/useWordStore';
import { useState } from 'react';
import { LoginModal } from './LoginModal';

export function SyncStatus() {
  const { isLoggedIn, isSyncing, lastSyncTime, triggerSync, logout, loadSyncConfig } = useWordStore();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // 加载配置（客户端）
  const handleClick = () => {
    if (!isLoggedIn) {
      loadSyncConfig();
      if (!isLoggedIn) {
        setShowLoginModal(true);
      }
    }
  };

  const formatLastSyncTime = () => {
    if (!lastSyncTime) return '从未同步';
    const diff = Date.now() - lastSyncTime;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} 小时前`;
    const days = Math.floor(hours / 24);
    return `${days} 天前`;
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {isLoggedIn ? (
          <>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
              <span>{formatLastSyncTime()}</span>
            </div>
            <button
              onClick={triggerSync}
              disabled={isSyncing}
              className="text-sm px-3 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              {isSyncing ? '同步中...' : '同步'}
            </button>
            <button
              onClick={logout}
              className="text-sm px-3 py-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              登出
            </button>
          </>
        ) : (
          <button
            onClick={handleClick}
            className="text-sm px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            云同步登录
          </button>
        )}
      </div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
}

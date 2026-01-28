'use client';

import { useState } from 'react';
import { useWordStore } from '@/store/useWordStore';
import { generateUserId, generateDeviceId, SyncConfig } from '@/lib/sync';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { login } = useWordStore();
  const [step, setStep] = useState<'input' | 'guide'>('guide');
  const [appToken, setAppToken] = useState('');
  const [usersTableId, setUsersTableId] = useState('');
  const [wordsTableId, setWordsTableId] = useState('');

  if (!isOpen) return null;

  const handleLogin = () => {
    if (!appToken || !wordsTableId) {
      alert('请填写完整信息');
      return;
    }

    const config: SyncConfig = {
      userId: generateUserId(),
      deviceId: generateDeviceId(),
      appToken,
      usersTableId: usersTableId || 'tbl', // 可选，暂未使用
      wordsTableId,
      lastSyncTime: 0,
    };

    login(config);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {step === 'guide' ? '云同步设置指南' : '登录飞书云同步'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'guide' ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                  📝 设置步骤
                </h3>
                <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-2 list-decimal list-inside">
                  <li>登录飞书开放平台 (open.feishu.cn)</li>
                  <li>创建或选择一个应用，获取 App ID 和 App Secret</li>
                  <li>创建多维表格，添加两个表格：用户表和单词表</li>
                  <li>在表格设置中获取 app_token 和 table_id</li>
                  <li>将信息填入下方表单</li>
                </ol>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <h3 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">
                  ⚠️ 注意事项
                </h3>
                <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                  <li>• 单词表需要包含字段：user_id, word, phonetic, partOfSpeech, definitionEn, definitionZh, example, interval, easeFactor, nextReviewAt, reviewCount, lastReviewAt, createdAt, local_id</li>
                  <li>• app_token 从多维表格的 URL 中获取</li>
                  <li>• table_id 从表格的开发者选项中获取</li>
                </ul>
              </div>

              <button
                onClick={() => setStep('input')}
                className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors"
              >
                我已了解，继续填写
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  App Token *
                </label>
                <input
                  type="text"
                  value={appToken}
                  onChange={(e) => setAppToken(e.target.value)}
                  placeholder="从多维表格 URL 中获取"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  例如: https://xxx.feishu.cn/base/APP_TOKEN/...
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  单词表 Table ID *
                </label>
                <input
                  type="text"
                  value={wordsTableId}
                  onChange={(e) => setWordsTableId(e.target.value)}
                  placeholder="从表格开发者选项中获取"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  例如: tblxxxxxx
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  用户表 Table ID (可选)
                </label>
                <input
                  type="text"
                  value={usersTableId}
                  onChange={(e) => setUsersTableId(e.target.value)}
                  placeholder="暂未使用，可留空"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('guide')}
                  className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  返回指南
                </button>
                <button
                  onClick={handleLogin}
                  className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors"
                >
                  保存并登录
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

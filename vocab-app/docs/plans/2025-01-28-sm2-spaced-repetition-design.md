# SM-2 间隔重复算法功能设计文档

**日期**: 2025-01-28
**状态**: 设计已完成，待实现
**功能**: 为词汇学习应用添加科学的间隔重复复习系统

---

## 一、概述

当前复习系统存在的问题：
- 用户评分（不认识/模糊/认识）被忽略
- 所有单词每次都会被复习
- 没有基于记忆科学的复习调度

本功能将实现 **SM-2（SuperMemo 2）间隔重复算法**，根据用户的记忆表现动态调整每个单词的复习间隔。

---

## 二、核心算法设计

### SM-2 算法参数

每个单词将跟踪以下状态：

| 参数 | 类型 | 初始值 | 说明 |
|------|------|--------|------|
| `interval` | number | 0 | 下次复习间隔（天） |
| `easeFactor` | number | 2.5 | 容易度因子，用于计算间隔 |
| `nextReviewAt` | number | now | 下次复习时间戳 |

### 评分逻辑

| 评分 | 间隔计算 | 容易度因子变化 |
|------|----------|----------------|
| 不认识 (😞) | `max(1, interval × 0.5)` | `easeFactor - 0.2` |
| 模糊 (🤔) | `interval × easeFactor` | 不变 |
| 认识 (😊) | `interval × easeFactor × 1.3` | `easeFactor + 0.1` |

**保护机制**：
- `easeFactor` 最低值：1.3
- 新词首次复习后：`interval = 1` 天

### 复习进度示例

```
第1天: 新词 → 认识 → 1天后复习
第2天: 复习 → 认识 → 3.4天后复习
第6天: 复习 → 认识 → 12天后复习
第18天: 复习 → 认识 → 44天后复习 → [已掌握]
```

---

## 三、掌握程度分级

| 级别 | 图标 | 条件 | 说明 |
|------|------|------|------|
| 新词 | 📝 | `reviewCount === 0` | 从未复习过 |
| 学习中 | 📚 | `interval < 7` | 短期记忆阶段 |
| 复习中 | 🔄 | `7 ≤ interval < 21` | 中期记忆巩固 |
| 已掌握 | ✅ | `interval ≥ 21` | 长期记忆形成 |

---

## 四、复习队列设计（混合模式）

### 队列优先级

1. **已到期单词**（`nextReviewAt ≤ now`）- 最高优先级
2. **新词**（`reviewCount === 0`）- 次优先
3. **未到期单词**（`nextReviewAt > now`）- 可选

### 用户可选模式

- **只复习到期**：仅显示到期单词 + 新词
- **全部复习**：包含所有未到期单词（带"提前复习"标记）

### 完成状态

- 复习完所有到期单词后显示："今日复习完成！"
- 可选择"继续复习未到期单词"或"完成"

### 顶部状态栏

```
今日: 15  新词: 3  总: 48
```

---

## 五、数据模型变更

### WordEntry 类型扩展

```typescript
interface WordEntry {
  // 现有字段
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

  // 新增字段
  interval: number;      // 复习间隔（天）
  easeFactor: number;    // 容易度因子
  nextReviewAt: number;  // 下次复习时间
}
```

### IndexedDB Schema 更新

```typescript
this.version(2).stores({
  words: 'id, word, createdAt, lastReviewAt, partOfSpeech, nextReviewAt'
});
```

---

## 六、技术架构

### 新增模块

| 文件 | 职责 |
|------|------|
| `lib/sm2.ts` | SM-2 算法核心逻辑 |
| `components/MasteryBadge.tsx` | 掌握程度标签组件 |

### 数据库层新增方法

```typescript
// lib/db.ts

// 获取待复习单词（到期 + 新词）
async getDueWords(): Promise<WordEntry[]>

// 按到期时间获取所有单词
async getAllWordsOrdered(): Promise<WordEntry[]>

// 更新 SM-2 参数
async updateSM2(id: string, rating: 'hard' | 'medium' | 'easy'): Promise<void>
```

### 状态管理扩展

```typescript
// store/useWordStore.ts

interface WordStore {
  // 新增状态
  dueWords: WordEntry[];
  reviewMode: 'due' | 'all';

  // 新增方法
  loadDueWords: () => Promise<void>;
  setReviewMode: (mode: 'due' | 'all') => void;
}
```

---

## 七、UI 设计

### 单词卡片（正面）

```
┌────────────────────────┐
│     📚 学习中          │ ← 掌握程度标签
│                        │
│       "ephemeral"      │
│     /ɪˈfem(ə)rəl/     │
│                        │
│    🔊 发音             │
└────────────────────────┘
```

### 掌握程度样式

| 级别 | 颜色 | 标签 |
|------|------|------|
| 新词 | 灰色 | 📝 新词 |
| 学习中 | 橙色 | 📚 学习中 |
| 复习中 | 蓝色 | 🔄 复习中 |
| 已掌握 | 绿色 | ✅ 已掌握 |

### 复习页面

```
┌──────────────────────────────┐
│  今日: 15  新词: 3  总: 48    │
│  [只复习到期] [全部复习]      │
└──────────────────────────────┘

│        [ 单词卡片 ]          │

│  1 / 15                      │
└──────────────────────────────┘
```

---

## 八、边界情况处理

| 场景 | 处理方式 |
|------|----------|
| 首次复习（新词） | `interval` 从 0 → 1，`easeFactor` = 2.5 |
| EaseFactor 过低 | 最低保护值：1.3 |
| 现有数据迁移 | 默认 `interval=0`, `easeFactor=2.5`, `nextReviewAt=now` |
| 过期未复习 | 仍显示为"已到期"，立即复习 |
| 无到期单词 | 显示"今日复习完成！" |
| 数据保存失败 | 显示错误提示，提供重试 |

---

## 九、实现步骤

### 阶段一：数据层
1. [ ] 更新 `WordEntry` 类型定义
2. [ ] 更新 IndexedDB schema（version 2）
3. [ ] 创建 `lib/sm2.ts` 算法模块
4. [ ] 更新 `lib/db.ts` 添加新方法
5. [ ] 实现数据迁移逻辑

### 阶段二：状态管理
6. [ ] 更新 `useWordStore.ts`
7. [ ] 添加 `dueWords` 和 `reviewMode` 状态

### 阶段三：UI 组件
8. [ ] 创建 `MasteryBadge.tsx` 组件
9. [ ] 更新 `Flashcard.tsx`
10. [ ] 更新 `review/page.tsx` 实现混合模式
11. [ ] 添加复习模式切换按钮

### 阶段四：测试
12. [ ] SM-2 算法单元测试
13. [ ] 数据迁移测试
14. [ ] 边界情况测试
15. [ ] 端到端测试

---

## 十、技术栈

- **算法**: SM-2 (SuperMemo 2)
- **存储**: IndexedDB (Dexie.js)
- **状态管理**: Zustand
- **框架**: Next.js 16 + React 19 + TypeScript

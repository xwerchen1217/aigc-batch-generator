# 句子查询与单词提取功能设计文档

**日期**: 2026-01-28
**状态**: 设计已完成，待实现
**功能**: 支持句子输入查询，智能提取生词，选择性保存到复习列表

---

## 一、概述

### 使用场景
用户在阅读英文文章时遇到复杂句子，复制进来查询，学习其中的生词。

### 核心价值
- 提高阅读效率，快速理解长难句
- 自动提取有价值的生词，无需手动逐个查询
- 支持选择性保存，避免收藏不认识的简单词

---

## 二、功能流程

```
用户输入 → 自动识别类型
                    ↓
         单词          →  显示单词卡片（现有功能）
         句子          →  翻译句子 → 提取单词 → 显示列表 → 选择保存
```

### 类型识别规则
- **单词**: 2个词以内 或 包含空格但全部是简单词
- **句子**: 3个词及以上

---

## 三、UI 设计

### 3.1 查词页面改造

搜索框保持不变，自动识别输入类型：
- 输入 `hello` → 显示单词卡片
- 输入 `The ephemeral beauty of sunset` → 显示句子解析页面

### 3.2 句子解析页面布局

```
┌─────────────────────────────────────────────────────┐
│  🔤 Vocab App                                       │
│  查词、复习、记忆                                    │
├─────────────────────────────────────────────────────┤
│  [搜索框 - The ephemeral beauty of sunset]          │
├─────────────────────────────────────────────────────┤
│  ╔═════════════════════════════════════════════════╗│
│  ║  原句：                                          ║│
│  ║  "The ephemeral beauty of sunset amazes me."    ║│
│  ║                                                  ║│
│  ║  📗 中文翻译：                                   ║│
│  ║  日落短暂的美让我惊叹。                          ║│
│  ╚═════════════════════════════════════════════════╝│
│                                                     │
│  📝 提取的单词 (3)                                  │
│  ┌───────────────────────────────────────────────┐ │
│  │ ☐ ephemeral  /ɪˈfem(ə)rəl/                   │ │
│  │   adj. 短暂的，瞬息的                         │ │
│  │   [查看详情] [保存]                            │ │
│  ├───────────────────────────────────────────────┤ │
│  │ ☐ sunset     /ˈsʌnset/                       │ │
│  │   n. 日落，傍晚                                │ │
│  │   [查看详情] [保存]                            │ │
│  ├───────────────────────────────────────────────┤ │
│  │ ☐ amaze      /əˈmeɪz/                        │ │
│  │   v. 使吃惊，惊叹                              │ │
│  │   [查看详情] [保存]                            │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  [保存选中的单词(0)]  [全选]  [清空选择]           │
└─────────────────────────────────────────────────────┘
```

---

## 四、技术实现

### 4.1 新增模块

| 文件 | 职责 |
|------|------|
| `lib/sentence.ts` | 句子翻译、类型识别 |
| `lib/wordExtractor.ts` | 智能单词提取、停用词过滤 |
| `components/SentenceCard.tsx` | 句子卡片组件 |
| `components/ExtractedWordItem.tsx` | 提取的单词列表项 |
| `components/WordDetailModal.tsx` | 单词详情弹窗 |

### 4.2 停用词列表

过滤掉以下无学习价值的词：

```typescript
const STOP_WORDS = new Set([
  // 冠词
  'the', 'a', 'an',
  // 连词
  'and', 'or', 'but', 'yet', 'for', 'nor', 'so',
  // 动词（系动词/助动词）
  'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can',
  // 介词
  'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'as',
  'into', 'through', 'during', 'before', 'after', 'above', 'below',
  // 代词
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her',
  'my', 'your', 'his', 'its', 'our', 'their',
  'this', 'that', 'these', 'those',
  // 疑问词
  'what', 'which', 'who', 'whom', 'when', 'where', 'why', 'how',
  // 其他
  'not', 'no', 'yes', 'very', 'just', 'also', 'too', 'much'
]);
```

### 4.3 单词提取逻辑

```typescript
function extractWords(sentence: string): string[] {
  // 1. 分词
  const words = sentence.split(/\s+/);

  // 2. 清理（去除标点、转小写）
  const cleaned = words.map(w =>
    w.replace(/[^\w]/g, '').toLowerCase()
  ).filter(w => w.length > 1);

  // 3. 去重
  const unique = [...new Set(cleaned)];

  // 4. 过滤停用词
  const filtered = unique.filter(w => !STOP_WORDS.has(w));

  // 5. 按出现顺序返回（保持原句中的顺序）
  return filtered;
}
```

### 4.4 数据流程

```typescript
// 1. 用户输入句子
const input = "The ephemeral beauty of sunset amazes me.";

// 2. 识别类型
const isSentence = input.split(/\s+/).length >= 3;

// 3. 翻译句子
const translation = await translateText(input);

// 4. 提取单词
const words = extractWords(input); // ['ephemeral', 'beauty', 'sunset', 'amazes']

// 5. 查询每个单词的详情
const wordDetails = await Promise.all(
  words.map(w => lookupWord(w))
);

// 6. 显示列表，用户选择保存
// 点击保存时调用现有的 wordDb.add()
```

### 4.5 API 调用

**句子翻译：** 复用现有的 `translateText()` 函数

**单词查询：** 复用现有的 `lookupWord()` 函数，批量并行调用

---

## 五、数据模型

### 5.1 状态管理扩展

```typescript
// store/useWordStore.ts

interface WordStore {
  // 现有字段...

  // 句子解析状态
  sentenceInput: string | null;
  sentenceTranslation: string | null;
  extractedWords: ExtractedWord[];
  selectedWordIds: Set<string>;
  setSentenceInput: (input: string) => void;
  setSelectedWordIds: (ids: Set<string>) => void;
  saveSelectedWords: () => Promise<void>;
}

interface ExtractedWord {
  id: string;           // word-partOfSpeech
  word: string;
  phonetic: string;
  partOfSpeech: string;
  definitionEn: string;
  definitionZh: string;
  example: string;
}
```

### 5.2 数据库

**无需修改** - 句子本身不保存，只保存用户选择的单词到现有的 `WordEntry` 表。

---

## 六、实现步骤

### 阶段一：基础功能
1. [ ] 创建 `lib/wordExtractor.ts` - 单词提取模块
2. [ ] 创建 `lib/sentence.ts` - 句子翻译模块
3. [ ] 创建 `components/SentenceCard.tsx` - 句子卡片组件
4. [ ] 创建 `components/ExtractedWordItem.tsx` - 单词列表项组件

### 阶段二：状态管理
5. [ ] 更新 `useWordStore.ts` - 添加句子相关状态
6. [ ] 实现多选逻辑和批量保存

### 阶段三：页面集成
7. [ ] 更新 `app/page.tsx` - 添加输入类型识别
8. [ ] 实现 WordCard/SentenceCard 条件渲染
9. [ ] 添加详情弹窗组件

### 阶段四：测试
10. [ ] 单词提取测试
11. [ ] 停用词过滤测试
12. [ ] 批量保存测试
13. [ ] 端到端测试

---

## 七、边界情况处理

| 场景 | 处理方式 |
|------|----------|
| 句子太长（>200词） | 提示句子过长，建议分段 |
| 无法提取单词 | 显示"未找到可学习的单词" |
| 某个单词查询失败 | 显示"查询失败"，但仍可保存其他词 |
| 用户选择已保存的词 | 提示"该单词已在复习列表中" |
| 翻译失败 | 显示英文原文，提示翻译失败 |

---

## 八、优化建议

### 性能优化
- 单词查询使用 `Promise.allSettled()`，部分失败不影响整体
- 对已查询过的单词进行缓存（可选）

### UX 优化
- 提取的单词按难度排序（可选）
- 显示单词数量统计："提取了 5 个生词"
- 支持一键全选/清空选择

### 未来扩展
- 保存句子到收藏夹（新增 SentenceEntry 表）
- 查看某个句子提取过的单词历史
- 支持导入文章，整篇分析

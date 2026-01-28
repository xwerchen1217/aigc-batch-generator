/**
 * 单词提取模块
 * 从句子中智能提取有学习价值的单词
 */

// 停用词列表 - 无学习价值的常见词
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
  'not', 'no', 'yes', 'very', 'just', 'also', 'too', 'much',
  'there', 'here', 'when', 'where', 'why', 'how'
]);

/**
 * 从句子中提取有意义的单词
 * @param sentence 输入的句子
 * @returns 提取出的单词列表（按在原句中出现顺序）
 */
export function extractWords(sentence: string): string[] {
  // 1. 分词
  const words = sentence.split(/\s+/);

  // 2. 清理（去除标点、转小写）
  const cleaned = words.map(w =>
    w.replace(/[^\w]/g, '').toLowerCase()
  ).filter(w => w.length > 1); // 过滤单字符

  // 3. 去重但保持顺序
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const word of cleaned) {
    if (!seen.has(word)) {
      seen.add(word);
      unique.push(word);
    }
  }

  // 4. 过滤停用词
  const filtered = unique.filter(w => !STOP_WORDS.has(w));

  return filtered;
}

/**
 * 判断输入是单词还是句子
 * @param input 用户输入
 * @returns true 表示是句子，false 表示是单词
 */
export function isSentenceInput(input: string): boolean {
  const wordCount = input.trim().split(/\s+/).length;
  return wordCount >= 3;
}

/**
 * 检查句子是否过长
 * @param sentence 输入的句子
 * @param maxLength 最大词数（默认200）
 */
export function isSentenceTooLong(sentence: string, maxLength: number = 200): boolean {
  const wordCount = sentence.trim().split(/\s+/).length;
  return wordCount > maxLength;
}

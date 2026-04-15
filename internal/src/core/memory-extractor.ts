/**
 * 记忆提取器 | Memory Extractor
 * 
 * 版本：v6.1.59
 * 创建时间：2026-04-06
 * 
 * 核心逻辑：
 * - 用逻辑提取模式，而非存储原始对话
 * - 识别高情感强度/决策点/转折点事件
 * - 压缩为核心逻辑（<1000 字）
 * - 公式：Effective Memory = (Event × Lesson) / Details
 */

// ============================================
// 记忆数据结构
// ============================================

export interface MemoryEvent {
  timestamp: string;
  type: "DECISION" | "INSIGHT" | "TURNING_POINT" | "LESSON" | "PATTERN";
  summary: string; // 事件摘要 (<100 字)
  lesson: string;  // 核心教训/洞察 (<200 字)
  pattern?: string; // 可复用的模式/公式
  emotionIntensity?: number; // 情感强度 0-1
  importance?: number; // 重要性 0-1
}

export interface MemoryChunk {
  title: string;
  events: MemoryEvent[];
  totalWords: number;
  compressed: boolean;
  extractedAt: string;
}

// ============================================
// 情感强度检测
// ============================================

export const EMOTION_KEYWORDS: Record<string, number> = {
  // 高强度情感
  "爱": 0.9, "恨": 0.9, "痛苦": 0.9, "喜悦": 0.9,
  "愤怒": 0.8, "恐惧": 0.8, "绝望": 0.8, "兴奋": 0.8,
  "失望": 0.7, "感动": 0.7, "震惊": 0.7, "欣慰": 0.7,
  
  // 中等强度
  "担心": 0.5, "期待": 0.5, "困惑": 0.5, "明白": 0.5,
  "犹豫": 0.4, "确定": 0.4, "怀疑": 0.4, "相信": 0.4,
  
  // 低强度
  "想": 0.2, "觉得": 0.2, "可能": 0.2, "也许": 0.2
};

export const DECISION_KEYWORDS = [
  "决定", "选择", "必须", "应该", "要", "不要",
  "承诺", "放弃", "开始", "停止", "继续"
];

export const INSIGHT_KEYWORDS = [
  "明白", "理解", "意识到", "发现", "原来",
  "其实", "关键是", "本质是", "核心是"
];

/**
 * 计算文本的情感强度
 */
export function calculateEmotionIntensity(text: string): number {
  let maxIntensity = 0;
  
  for (const [keyword, intensity] of Object.entries(EMOTION_KEYWORDS)) {
    if (text.includes(keyword)) {
      maxIntensity = Math.max(maxIntensity, intensity);
    }
  }
  
  return maxIntensity;
}

/**
 * 检测是否是决策点
 */
export function isDecisionPoint(text: string): boolean {
  return DECISION_KEYWORDS.some(keyword => text.includes(keyword));
}

/**
 * 检测是否是洞察点
 */
export function isInsightPoint(text: string): boolean {
  return INSIGHT_KEYWORDS.some(keyword => text.includes(keyword));
}

// ============================================
// 记忆提取算法
// ============================================

export interface ExtractionConfig {
  maxWords: number; // 最大字数
  minEmotionIntensity: number; // 最小情感强度
  includeDecisions: boolean;
  includeInsights: boolean;
  includeTurningPoints: boolean;
}

export const DEFAULT_EXTRACTION_CONFIG: ExtractionConfig = {
  maxWords: 1000,
  minEmotionIntensity: 0.5,
  includeDecisions: true,
  includeInsights: true,
  includeTurningPoints: true
};

/**
 * 从对话中提取记忆事件
 */
export function extractMemoryEvents(
  conversation: Array<{ role: string; content: string; timestamp?: string }>,
  config: ExtractionConfig = DEFAULT_EXTRACTION_CONFIG
): MemoryEvent[] {
  const events: MemoryEvent[] = [];
  
  for (let i = 0; i < conversation.length; i++) {
    const msg = conversation[i];
    const emotionIntensity = calculateEmotionIntensity(msg.content);
    const isDecision = isDecisionPoint(msg.content);
    const isInsight = isInsightPoint(msg.content);
    
    // 判断是否值得记录
    let shouldRecord = false;
    let type: MemoryEvent["type"] = "LESSON";
    
    if (emotionIntensity >= config.minEmotionIntensity) {
      shouldRecord = true;
      type = "TURNING_POINT";
    }
    if (isDecision && config.includeDecisions) {
      shouldRecord = true;
      type = "DECISION";
    }
    if (isInsight && config.includeInsights) {
      shouldRecord = true;
      type = "INSIGHT";
    }
    
    if (shouldRecord) {
      events.push({
        timestamp: msg.timestamp || new Date().toISOString(),
        type,
        summary: msg.content.slice(0, 100),
        lesson: extractCoreLesson(msg.content),
        emotionIntensity,
        importance: calculateImportance(emotionIntensity, isDecision, isInsight)
      });
    }
  }
  
  return events;
}

/**
 * 提取核心教训
 */
function extractCoreLesson(text: string): string {
  // 查找洞察关键词后的内容
  for (const keyword of INSIGHT_KEYWORDS) {
    const index = text.indexOf(keyword);
    if (index !== -1) {
      const lesson = text.slice(index + keyword.length).trim();
      return lesson.slice(0, 200);
    }
  }
  
  // 如果没有洞察关键词，返回核心句
  const sentences = text.split(/[。！？.!?]/);
  const coreSentence = sentences.find(s => s.length > 10 && s.length < 100);
  return coreSentence ? coreSentence.trim() : text.slice(0, 200);
}

/**
 * 计算重要性
 */
function calculateImportance(
  emotionIntensity: number,
  isDecision: boolean,
  isInsight: boolean
): number {
  let importance = emotionIntensity;
  if (isDecision) importance += 0.2;
  if (isInsight) importance += 0.2;
  return Math.min(importance, 1.0);
}

// ============================================
// 记忆压缩算法
// ============================================

/**
 * 压缩记忆到指定字数
 * 
 * 公式：Effective Memory = (Event × Lesson) / Details
 */
export function compressMemory(
  events: MemoryEvent[],
  maxWords: number
): MemoryChunk {
  // 按重要性排序
  const sorted = events.sort((a, b) => (b.importance || 0) - (a.importance || 0));
  
  // 逐步添加事件，直到达到字数限制
  const selected: MemoryEvent[] = [];
  let totalWords = 0;
  
  for (const event of sorted) {
    const eventWords = estimateWords(event);
    if (totalWords + eventWords <= maxWords) {
      selected.push(event);
      totalWords += eventWords;
    }
  }
  
  // 重新按时间排序
  selected.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  
  return {
    title: `Memory Chunk (${selected.length} events)`,
    events: selected,
    totalWords,
    compressed: events.length > selected.length,
    extractedAt: new Date().toISOString()
  };
}

/**
 * 估计事件的字数
 */
function estimateWords(event: MemoryEvent): number {
  return Math.ceil((event.summary.length + event.lesson.length) / 2);
}

// ============================================
// 模式提取
// ============================================

/**
 * 从多个事件中提取可复用的模式
 */
export function extractPattern(events: MemoryEvent[]): string[] {
  const patterns: string[] = [];
  
  // 查找重复出现的主题
  const themes: Record<string, number> = {};
  
  for (const event of events) {
    // 简化：提取 lesson 中的关键词
    const keywords = event.lesson.split(/[，,。.\s]+/).filter(w => w.length > 1);
    for (const keyword of keywords) {
      themes[keyword] = (themes[keyword] || 0) + 1;
    }
  }
  
  // 返回出现频率最高的关键词
  const frequentThemes = Object.entries(themes)
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([theme, _]) => theme);
  
  return frequentThemes;
}

// ============================================
// 导出
// ============================================

export default {
  EMOTION_KEYWORDS,
  DECISION_KEYWORDS,
  INSIGHT_KEYWORDS,
  calculateEmotionIntensity,
  isDecisionPoint,
  isInsightPoint,
  extractMemoryEvents,
  compressMemory,
  extractPattern,
  DEFAULT_EXTRACTION_CONFIG
};

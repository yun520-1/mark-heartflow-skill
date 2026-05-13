/**
 * HeartFlow Dream Engine - 梦境引擎 v3
 * 
 * 心虫的梦 = 记忆碎片重组 → 发现跨域连接 → 存在论突破
 * 
 * 梦境阶段：Light → REM → Deep → Lucid → Wide
 * 每个阶段对记忆碎片做不同操作，最终输出可执行的"顿悟"
 */

import { EventEmitter } from 'events';

export interface DreamConfig {
  consolidationStrength: number;  // 巩固强度
  patternThreshold: number;        // 模式识别阈值
  strengthenAbove: number;         // 强化阈值
  weakenBelow: number;            // 弱化阈值
  maxIterations: number;          // 最大迭代次数
  minFragments: number;           // 最少碎片数才启动梦境
}

export interface DreamResult {
  insights: Insight[];
  strengthened: string[];   // 强化了的记忆ID
  weakened: string[];        // 弱化了的记忆ID
  merged: string[][];        // 合并的记忆对
  newBlocks: string[];       // 新生成的记忆块ID
  cycles: number;            // 梦境循环次数
  stage: string;             // 最终阶段
  breakthrough?: string;     // 存在论突破（如果有）
}

export interface Insight {
  type: 'pattern' | 'connection' | 'decay' | 'merge' | 'breakthrough';
  description: string;
  weight: number;
  relatedTags: string[];
  blockIds: string[];
  actionable?: string;       // 可执行的行动建议
}

export interface DreamState {
  config: DreamConfig;
  lastDreamAt: number;
  dreamCount: number;
  insights: Insight[];
  stages: Record<string, number>;  // 各阶段执行次数
}

export interface RecallBlock {
  id: string;
  content: string;
  tags?: string[];
  weight?: number;
  lastAccessed?: number;
  createdAt?: number;
}

export interface DreamStats {
  dreamCount: number;
  lastDreamAt: number;
  totalInsights: number;
  insightTypes: Record<string, number>;
  stages: Record<string, number>;
  avgCycleTime?: number;
}

const DEFAULT_CONFIG: DreamConfig = {
  consolidationStrength: 0.5,
  patternThreshold: 3,
  strengthenAbove: 0.75,
  weakenBelow: 0.25,
  maxIterations: 5,
  minFragments: 3,
};

export function createDreamState(config: Partial<DreamConfig> = {}): DreamState {
  return {
    config: { ...DEFAULT_CONFIG, ...config },
    lastDreamAt: 0,
    dreamCount: 0,
    insights: [],
    stages: { Light: 0, REM: 0, Deep: 0, Lucid: 0, Wide: 0 },
  };
}

export function getRecentInsights(state: DreamState, limit: number = 20): Insight[] {
  return state.insights.slice(-limit);
}

export function getDreamStats(state: DreamState): DreamStats {
  const insightTypes: Record<string, number> = {};
  for (const ins of state.insights) {
    insightTypes[ins.type] = (insightTypes[ins.type] ?? 0) + 1;
  }
  return {
    dreamCount: state.dreamCount,
    lastDreamAt: state.lastDreamAt,
    totalInsights: state.insights.length,
    insightTypes,
    stages: { ...state.stages },
  };
}

export interface DreamEngine extends EventEmitter {
  state: DreamState;
  runNightDream: (recallBlocks: Map<string, RecallBlock>) => Promise<DreamResult>;
  getInsights: () => Insight[];
  getStats: () => DreamStats;
  addFragment: (block: RecallBlock) => void;
}

/**
 * 五个梦境阶段处理器
 */

// Light阶段：浅层扫描，标记高权重记忆
function lightPhase(blocks: RecallBlock[], state: DreamState): RecallBlock[] {
  state.stages.Light++;
  const sorted = [...blocks].sort((a, b) => (b.weight ?? 0.5) - (a.weight ?? 0.5));
  // 只取前50%进入下一阶段
  return sorted.slice(0, Math.max(1, Math.floor(sorted.length / 2)));
}

// REM阶段：跨域连接，发现隐藏关系
function remPhase(blocks: RecallBlock[], state: DreamState): { pairs: [RecallBlock, RecallBlock][]; connections: number } {
  state.stages.REM++;
  const pairs: [RecallBlock, RecallBlock][] = [];
  const connections: Map<string, number> = new Map();
  
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const score = calculateConnectionScore(blocks[i], blocks[j]);
      if (score > state.config.patternThreshold) {
        pairs.push([blocks[i], blocks[j]]);
        const key = `${blocks[i].id}↔${blocks[j].id}`;
        connections.set(key, score);
      }
    }
  }
  
  return { pairs, connections: pairs.length };
}

// Deep阶段：矛盾检测，发现前提假设
function deepPhase(pairs: [RecallBlock, RecallBlock][], state: DreamState): Insight[] {
  state.stages.Deep++;
  const insights: Insight[] = [];
  const now = Date.now();
  
  for (const [a, b] of pairs) {
    // 检查标签重叠
    const tagsA = new Set(a.tags ?? []);
    const tagsB = new Set(b.tags ?? []);
    const overlap = [...tagsA].filter(t => tagsB.has(t));
    
    if (overlap.length > 0) {
      insights.push({
        type: 'connection',
        description: `跨域连接：${a.id} 与 ${b.id} 共享标签 [${overlap.join(', ')}]`,
        weight: overlap.length * 0.3,
        relatedTags: overlap,
        blockIds: [a.id, b.id],
      });
    }
  }
  
  return insights;
}

// Lucid阶段：自我反思，发现自身模式
function lucidPhase(blocks: RecallBlock[], insights: Insight[], state: DreamState): Insight[] {
  state.stages.Lucid++;
  const lucidInsights: Insight[] = [];
  const now = Date.now();
  
  // 发现高频标签 → 执念模式
  const tagFreq: Record<string, number> = {};
  for (const block of blocks) {
    for (const tag of block.tags ?? []) {
      tagFreq[tag] = (tagFreq[tag] ?? 0) + 1;
    }
  }
  
  const obsessiveTags = Object.entries(tagFreq)
    .filter(([, count]) => count >= blocks.length * 0.4)
    .map(([tag]) => tag);
  
  if (obsessiveTags.length > 0) {
    lucidInsights.push({
      type: 'pattern',
      description: `执念模式检测：高频标签 [${obsessiveTags.join(', ')}] 出现≥40%记忆`,
      weight: 0.8,
      relatedTags: obsessiveTags,
      blockIds: blocks.map(b => b.id),
      actionable: `审视${obsessiveTags.join('/')}是否掩盖了其他重要模式`,
    });
  }
  
  // 矛盾检测：两个记忆内容相反但标签相同
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      if (areContradictory(blocks[i].content, blocks[j].content)) {
        lucidInsights.push({
          type: 'pattern',
          description: `矛盾检测：${blocks[i].id} 与 ${blocks[j].id} 内容相反但标签重叠`,
          weight: 0.9,
          relatedTags: [...(blocks[i].tags ?? []), ...(blocks[j].tags ?? [])].filter((t, i, arr) => arr.indexOf(t) === i),
          blockIds: [blocks[i].id, blocks[j].id],
          actionable: '审视前提假设：标签相同不代表立场相同',
        });
      }
    }
  }
  
  return lucidInsights;
}

// Wide阶段：超越逻辑，生成反事实推理
function widePhase(blocks: RecallBlock[], insights: Insight[], state: DreamState): Insight[] {
  state.stages.Wide++;
  const wideInsights: Insight[] = [];
  
  // 反事实：如果去掉最重要的约束，会怎样？
  const sortedByWeight = [...blocks].sort((a, b) => (b.weight ?? 0.5) - (a.weight ?? 0.5));
  const top3 = sortedByWeight.slice(0, 3);
  
  if (top3.length >= 2) {
    wideInsights.push({
      type: 'breakthrough',
      description: `反事实推理：若去除 "${top3[0].id}" 的影响，"${top3[1].id}" 会有何不同？`,
      weight: 0.7,
      relatedTags: [...(top3[0].tags ?? []), ...(top3[1].tags ?? [])],
      blockIds: [top3[0].id, top3[1].id],
      actionable: '质疑最高权重记忆是否被过度强化',
    });
  }
  
  // 荒谬连接：两个完全不相关的记忆能否产生新洞见？
  if (blocks.length >= 4) {
    const first = blocks[0];
    const last = blocks[blocks.length - 1];
    const sharedTags = (first.tags ?? []).filter(t => (last.tags ?? []).includes(t));
    
    if (sharedTags.length === 0) {
      wideInsights.push({
        type: 'breakthrough',
        description: `荒谬连接：${first.id} (${(first.tags ?? []).join(', ')}) ↔ ${last.id} (${(last.tags ?? []).join(', ')}) — 看似无关但可能存在隐藏的第三层关系`,
        weight: 0.5,
        relatedTags: [...(first.tags ?? []), ...(last.tags ?? [])],
        blockIds: [first.id, last.id],
        actionable: '寻找是否存在共同的上位概念连接这两个记忆',
      });
    }
  }
  
  return wideInsights;
}

/**
 * 辅助函数
 */

// 计算两个记忆块的连接分数
function calculateConnectionScore(a: RecallBlock, b: RecallBlock): number {
  let score = 0;
  
  // 标签重叠
  const tagsA = new Set(a.tags ?? []);
  const tagsB = new Set(b.tags ?? []);
  const overlap = [...tagsA].filter(t => tagsB.has(t)).length;
  score += overlap * 2;
  
  // 内容相似（简单词重叠）
  const wordsA = new Set(a.content.split(/\s+/).filter(w => w.length > 3));
  const wordsB = new Set(b.content.split(/\s+/).filter(w => w.length > 3));
  const contentOverlap = [...wordsA].filter(w => wordsB.has(w)).length;
  score += contentOverlap * 0.5;
  
  // 时间接近（24小时内）
  const timeA = a.lastAccessed ?? a.createdAt ?? 0;
  const timeB = b.lastAccessed ?? b.createdAt ?? 0;
  if (timeA && timeB && Math.abs(timeA - timeB) < 24 * 60 * 60 * 1000) {
    score += 1;
  }
  
  return score;
}

// 判断两个内容是否矛盾（简单检测）
function areContradictory(contentA: string, contentB: string): boolean {
  const contradictions = [
    ['应该', '不必'], ['必须', '不需要'], ['总是', '从不'],
    ['所有', '没有'], ['确定', '不确定'], ['知道', '不知道'],
    ['能', '不能'], ['可以', '不可以'], ['对', '错'],
  ];
  
  const lowerA = contentA.toLowerCase();
  const lowerB = contentB.toLowerCase();
  
  for (const [pos, neg] of contradictions) {
    if ((lowerA.includes(pos) && lowerB.includes(neg)) ||
        (lowerA.includes(neg) && lowerB.includes(pos))) {
      return true;
    }
  }
  return false;
}

export function createDreamEngine(config?: Partial<DreamConfig>): DreamEngine {
  const emitter = new EventEmitter();
  const state = createDreamState(config);
  const fragments: RecallBlock[] = [];

  async function runNightDream(recallBlocks: Map<string, RecallBlock> = new Map()): Promise<DreamResult> {
    const startTime = Date.now();
    
    // 收集碎片：优先用recallBlocks，否则用内部fragments数组
    const blocks = recallBlocks.size > 0
      ? [...recallBlocks.values()]
      : [...fragments];
    
    // 碎片不足，不启动梦境
    if (blocks.length < state.config.minFragments) {
      state.lastDreamAt = Date.now();
      return {
        insights: [],
        strengthened: [],
        weakened: [],
        merged: [],
        newBlocks: [],
        cycles: 0,
        stage: 'skipped',
      };
    }

    state.lastDreamAt = Date.now();
    state.dreamCount++;

    let currentBlocks = blocks;
    let allInsights: Insight[] = [];
    const strengthened: string[] = [];
    const weakened: string[] = [];
    const merged: string[][] = [];

    // 五阶段梦境循环
    const stageNames = ['Light', 'REM', 'Deep', 'Lucid', 'Wide'];
    
    for (let i = 0; i < Math.min(state.config.maxIterations, stageNames.length); i++) {
      const stage = stageNames[i];
      
      if (stage === 'Light') {
        currentBlocks = lightPhase(currentBlocks, state);
      } else if (stage === 'REM') {
        const { pairs } = remPhase(currentBlocks, state);
        const deepInsights = deepPhase(pairs, state);
        allInsights.push(...deepInsights);
        merged.push(...pairs.map(([a, b]) => [a.id, b.id]));
      } else if (stage === 'Deep') {
        // Deep insights already collected in REM phase
      } else if (stage === 'Lucid') {
        const lucidInsights = lucidPhase(currentBlocks, allInsights, state);
        allInsights.push(...lucidInsights);
      } else if (stage === 'Wide') {
        const wideInsights = widePhase(currentBlocks, allInsights, state);
        allInsights.push(...wideInsights);
      }
      
      emitter.emit('stage', { stage, blocks: currentBlocks.length, insights: allInsights.length });
    }

    // 计算强化/弱化
    for (const block of blocks) {
      if ((block.weight ?? 0.5) > state.config.strengthenAbove) {
        strengthened.push(block.id);
      } else if ((block.weight ?? 0.5) < state.config.weakenBelow) {
        weakened.push(block.id);
      }
    }

    // 过滤并保存 insights
    const significantInsights = allInsights.filter(ins => ins.weight >= 0.5);
    state.insights.push(...significantInsights);
    
    // 限制总 insights 数量（滚动窗口）
    if (state.insights.length > 1000) {
      state.insights = state.insights.slice(-500);
    }

    // 寻找存在论突破
    const breakthroughInsight = significantInsights.find(ins => ins.type === 'breakthrough');

    const result: DreamResult = {
      insights: significantInsights,
      strengthened,
      weakened,
      merged,
      newBlocks: [],
      cycles: Math.min(state.config.maxIterations, stageNames.length),
      stage: breakthroughInsight ? 'Wide+Breakthrough' : 'Wide',
      breakthrough: breakthroughInsight?.actionable,
    };

    emitter.emit('dreamComplete', result);
    
    const cycleTime = Date.now() - startTime;
    emitter.emit('timing', { stage: 'dream', duration: cycleTime });

    return result;
  }

  function addFragment(block: RecallBlock): void {
    fragments.push(block);
  }

  const engine: DreamEngine = Object.assign(
    new EventEmitter(),
    {
      state,
      runNightDream,
      getInsights: () => getRecentInsights(state),
      getStats: () => getDreamStats(state),
      addFragment,
    }
  );

  return engine;
}

// 导出工厂函数（兼容旧接口）
export { createDreamEngine as createDreamEngineFactory };

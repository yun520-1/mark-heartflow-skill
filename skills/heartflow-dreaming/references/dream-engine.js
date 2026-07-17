/**
 * HeartFlow Narrative Dream Engine v1.1.0
 * 整合 InteractiveDream + DreamLoop + WakeUpVerifier
 *
 * 调用方式:
 *   const { runDream } = require('./dream-engine.js');
 *   const result = await runDream(sessionHistory);
 */

const path = require('path');
const fs = require('fs');

// 路径解析：从 references/ → 心虫根目录
const SKILL_DIR = path.resolve(__dirname, '..');
const HEARTFLOW_ROOT = path.resolve(SKILL_DIR, '../../ai/mark-heartflow-skill');
const SRC_CORE = path.join(HEARTFLOW_ROOT, 'src/core');
const DIST_CORE = path.join(HEARTFLOW_ROOT, 'dist/core');

let InteractiveDream;
let dreamLoopExports;
let WakeUpVerifier;

// ── 懒加载引擎 ───────────────────────────────────────────────────────────────
function loadEngines() {
  if (InteractiveDream) return;

  // 优先从 dist 加载（编译后）
  const distDreamLoop = path.join(DIST_CORE, 'dream-loop.js');
  const distWakeUp = path.join(SRC_CORE, 'wake-up-verifier.js');

  // 检查 dist 版本
  const distInteractive = path.join(DIST_CORE, 'interactive-dream.js');
  if (fs.existsSync(distInteractive)) {
    Object.assign(global, require(distDreamLoop));
    const { InteractiveDream: ID } = require(distInteractive);
    const { WakeUpVerifier: WUV } = require(distWakeUp);
    InteractiveDream = ID;
    WakeUpVerifier = WUV;
  } else {
    // 回退到 src（CommonJS）
    const { generateDream } = require(path.join(SRC_CORE, 'dream-loop.js'));
    const { InteractiveDream: ID } = require(path.join(SRC_CORE, 'interactive-dream.js'));
    const { WakeUpVerifier: WUV } = require(path.join(SRC_CORE, 'wake-up-verifier.js'));
    InteractiveDream = ID;
    WakeUpVerifier = WUV;
    dreamLoopExports = { generateDream };
  }
}

// ── 叙事梦核心 ───────────────────────────────────────────────────────────────
/**
 * 运行叙事梦生成
 * @param {Array} sessions - 最近会话记录 [{text, timestamp, ...}]
 * @param {Object} options - { maxFragments: 8 }
 * @returns {Object} 包含 narrative, scored, archived, wake, upgrade
 */
function runDream(sessions = [], options = {}) {
  loadEngines();

  // 1. 转换为 memory items
  const memoryItems = sessions.map(s => ({
    text: typeof s === 'string' ? s : (s.text || s.content || s.preview || ''),
    timestamp: s.timestamp || Date.now(),
    tags: s.tags || []
  })).filter(item => item.text.length > 0);

  if (memoryItems.length === 0) {
    memoryItems.push({ text: '一个尚未被说出的起点', timestamp: Date.now(), tags: ['start'] });
  }

  // 2. 创建 InteractiveDream 实例
  const dreamer = new InteractiveDream({ maxFragments: options.maxFragments || 8 });

  // 3. 生成梦境（全部阶段）
  const dream = dreamer.createDream(memoryItems);

  // 4. Wake-Up 验证
  const { wake, upgrade } = dreamer.respond(dream);

  // 5. 提取叙事（从 staged_dream.lucid 或 wide）
  const narrative = extractNarrative(dream.staged_dream, wake);

  return {
    narrative,
    memory_summary: dream.memory_summary,
    staged_dream: dream.staged_dream,
    wake,
    upgrade,
    memory_count: memoryItems.length,
    mode: 'narrative-dream-v1.1.0'
  };
}

// ── 叙事提取 ────────────────────────────────────────────────────────────────
/**
 * 从 staged_dream 提取最终叙事。
 * 优先级：lucid（清醒梦）> wide（广梦）> deep_sleep（深睡）
 * 同时输出哲学转折（insight_record 第一条）
 */
function extractNarrative(staged, wake) {
  // 主叙事取 lucid（清醒梦 = 最有创造力的阶段）
  const lucid = staged?.lucid;
  const wide = staged?.wide;
  const rem = staged?.rem;

  const mainText = lucid?.text || wide?.text || rem?.text || '';
  const mainFragments = lucid?.fragments || wide?.fragments || [];

  // 哲学转折从 upgrade.insight_record 提取
  const insights = wake?.upgrade?.insight_record?.entries || [];
  const philosophicalTurn = insights[0]?.content || '觉醒不是看到真相，是在镜子里认出自己在躲。';

  // 组装叙事文本（移除 emoji 标题，保留内容）
  const lines = mainText.split('\n').filter(l => !/^[🌿🌀🌑✨🌌]/.test(l.trim()));
  const cleanNarrative = lines.join('\n').trim();

  return {
    text: cleanNarrative,
    fragments: mainFragments,
    philosophical_turn: philosophicalTurn,
    insight_confidence: insights[0]?.confidence || 0.5,
    source_stage: lucid ? 'lucid' : wide ? 'wide' : 'rem'
  };
}

// ── CLI 入口 ────────────────────────────────────────────────────────────────
if (require.main === module) {
  // 直接用测试数据（引擎不依赖 session-search-helper）
  const testSessions = [
    { text: '修复定时任务，解决 weixin-streamer UnicodeEncodeError', timestamp: Date.now() - 3600000 },
    { text: '启动心虫，所有模块加载成功', timestamp: Date.now() - 1800000 },
    { text: '做梦，写了《井》', timestamp: Date.now() - 600000 }
  ];
  const result = runDream(testSessions);
  console.log('=== Narrative ===');
  console.log(result.narrative.text);
  console.log('\n=== Philosophical Turn ===');
  console.log(result.narrative.philosophical_turn);
  console.log('\n=== Wake Evaluation ===');
  console.log(JSON.stringify(result.wake, null, 2));
}

module.exports = { runDream, loadEngines };

#!/usr/bin/env node
/**
 * HeartFlow CLI - 心虫引擎命令行接口
 * 支持 status/help/chat 命令
 */
const path = require('path');
const fs = require('fs');
const readline = require('readline');

// 查找引擎根目录
let hfDir = __dirname;
while (hfDir !== '/' && !fs.existsSync(path.join(hfDir, 'src/core/heartflow.js'))) {
  hfDir = path.dirname(hfDir);
}
if (!fs.existsSync(path.join(hfDir, 'src/core/heartflow.js'))) {
  console.error(JSON.stringify({ error: 'HeartFlow engine not found' }));
  process.exit(1);
}

let cmd = process.argv[2] || 'status';
if (cmd === '--help' || cmd === '-h') cmd = 'help';

// ─── 辅助：获取引擎实例 ────────────────────────────────────
function createEngine() {
  const { HeartFlow } = require(path.join(hfDir, 'src/core/heartflow.js'));
  const engine = new HeartFlow({ dataDir: path.join(hfDir, 'data'), silent: true });
  engine.start();
  return engine;
}

function getVersion() {
  try { return require(path.join(hfDir, 'package.json')).version || 'unknown'; } catch(e) { return 'unknown'; }
}

// ─── 辅助：格式化认知分析摘要 ──────────────────────────────
function formatCognitiveSummary(result) {
  const analysis = result.analysis || {};
  const whatIsThis = analysis.whatIsThis;
  const pain = analysis.pain;
  const tone = analysis.tone;
  const psych = analysis.psych;
  const decision = analysis.decision;

  // 从 result 中提取 summary 字段（v4.2 的 cognitiveSummary）
  const output = result.output || {};
  const conclusion = output.conclusion || output.text || '(无输出)';

  // 感知类型
  const perceivedType = whatIsThis?.type || result.type || 'general';

  // 情绪信号
  let emotionStr = '无';
  if (tone && tone.sentiment !== undefined) {
    emotionStr = `${tone.tone || 'neutral'} (${(tone.sentiment * 100).toFixed(0)}%)`;
  }
  if (pain && pain.hasPain) {
    emotionStr += ` [痛苦信号: ${((pain.painLevel || 0) * 100).toFixed(0)}%]`;
  }

  // 置信度
  const confidence = result.confidence !== undefined ? result.confidence : 0.5;

  // 模块数 — 粗略估算
  let modulesRun = 0;
  if (whatIsThis) modulesRun++;
  if (pain) modulesRun++;
  if (tone && tone.tone) modulesRun++;
  if (psych) modulesRun++;
  if (analysis.phil) modulesRun++;
  if (decision) modulesRun++;
  if (result.thoughtChain && result.thoughtChain.stages) {
    modulesRun += result.thoughtChain.stages.length;
  } else if (result.thoughtChain && Array.isArray(result.thoughtChain)) {
    modulesRun += result.thoughtChain.length;
  }

  // 决策信息
  let decisionStr = '';
  if (decision) {
    decisionStr = `\n  🧭 认知决策: ${decision.type || '—'} (置信度: ${((decision.confidence || 0) * 100).toFixed(0)}%)`;
    if (decision.rationale) decisionStr += `\n     理由: ${decision.rationale}`;
  }

  return [
    `  📋 类型: ${perceivedType}`,
    `  🔍 情绪: ${emotionStr}`,
    `  📊 置信度: ${(confidence * 100).toFixed(0)}%`,
    `  ⚙️  运行模块: ${modulesRun}个`,
    decisionStr,
    `  💬 结论: ${conclusion.slice(0, 200)}${conclusion.length > 200 ? '...' : ''}`,
  ].join('\n');
}

// ─── 辅助：格式化心理学分析 ────────────────────────────────
function formatPsychologyResult(result) {
  const lines = ['━━━ 🧠 心理学分析 ━━━'];
  const pad = result.emotion || result.pad || {};
  if (pad.pleasure !== undefined) {
    lines.push(`  P (愉悦度): ${pad.pleasure.toFixed(2)}`);
    lines.push(`  A (唤醒度): ${pad.arousal.toFixed(2)}`);
    lines.push(`  D (支配度): ${pad.dominance.toFixed(2)}`);
  }
  const needs = result.needs || result.psychologicalNeeds || [];
  if (needs.length > 0) {
    lines.push(`  心理需求: ${needs.join(', ')}`);
  }
  const defenses = result.defenses || [];
  if (defenses.length > 0) {
    lines.push(`  防御机制: ${defenses.join(', ')}`);
  }
  const intention = result.intention || {};
  if (intention.category) {
    lines.push(`  意图类别: ${intention.category}`);
  }
  if (result.emotion && result.emotion.intensity !== undefined) {
    lines.push(`  情绪强度: ${(result.emotion.intensity * 100).toFixed(0)}%`);
  }
  if (lines.length === 1) {
    lines.push('  (无详细分析数据)');
  }
  return lines.join('\n');
}

// ─── 辅助：格式化情绪分析 ────────────────────────────────
function formatEmotionResult(result) {
  const lines = ['━━━ 💓 情绪状态 ━━━'];
  const pad = result.pad || {};
  if (pad.pleasure !== undefined) {
    lines.push(`  P (愉悦度): ${pad.pleasure.toFixed(2)}`);
    lines.push(`  A (唤醒度): ${pad.arousal.toFixed(2)}`);
    lines.push(`  D (支配度): ${pad.dominance.toFixed(2)}`);
  }
  if (result.intensity !== undefined) {
    lines.push(`  强度: ${(result.intensity * 100).toFixed(0)}%`);
  }
  if (result.type) {
    lines.push(`  类型: ${result.type}`);
  }
  if (lines.length === 1) {
    lines.push('  (无详细情绪数据)');
  }
  return lines.join('\n');
}

// ─── 辅助：格式化决策路由结果 ────────────────────────────
function formatDecisionResult(result) {
  const lines = ['━━━ 🧭 决策路由 ━━━'];
  if (result.matched !== undefined) {
    lines.push(`  匹配: ${result.matched ? '✅ 是' : '❌ 否'}`);
  }
  if (result.decision) {
    const d = result.decision;
    lines.push(`  决策类型: ${d.type || '—'}`);
    lines.push(`  置信度: ${((d.confidence || 0) * 100).toFixed(0)}%`);
    if (d.rationale) lines.push(`  理由: ${d.rationale}`);
    if (d.ruleId) lines.push(`  规则ID: ${d.ruleId}`);
  }
  if (result.currentState) {
    lines.push(`  当前状态: ${JSON.stringify(result.currentState)}`);
  }
  if (lines.length === 1) {
    lines.push('  (无决策数据)');
  }
  return lines.join('\n');
}

// ─── 辅助：格式化路由表 ──────────────────────────────────
function formatRoutes(routes) {
  const lines = ['━━━ 🗺️ 可用路由 ━━━'];
  let count = 0;
  for (const [subsystem, methods] of Object.entries(routes)) {
    if (methods.length > 0) {
      lines.push(`  ${subsystem}:`);
      for (const m of methods) {
        lines.push(`    · ${subsystem}.${m}`);
        count++;
      }
    }
  }
  lines.push(`共 ${count} 条路由，${Object.keys(routes).length} 个子系统`);
  return lines.join('\n');
}

// ─── 辅助：格式化状态 ────────────────────────────────────
function formatStatus(engine) {
  const version = getVersion();
  const health = engine.healthCheck ? engine.healthCheck() : {};
  const modules = engine._modules ? Object.keys(engine._modules).length : 0;
  let memStats = null;
  try {
    if (engine.identityCore && engine.identityCore.getMemoryStats) {
      memStats = engine.identityCore.getMemoryStats();
    } else if (engine.memory && engine.memory.getStats) {
      memStats = engine.memory.getStats();
    }
  } catch (e) { /* skip */ }

  const lines = ['━━━ ⚡ HeartFlow 引擎状态 ━━━'];
  lines.push(`  版本: ${version}`);
  lines.push(`  构建日期: ${health.buildDate || '—'}`);
  lines.push(`  会话ID: ${health.sessionId || '—'}`);
  lines.push(`  运行时间: ${health.uptime_ms ? (health.uptime_ms / 1000).toFixed(1) + 's' : '—'}`);
  lines.push(`  已加载模块: ${modules}个`);
  if (health.subsystems && health.subsystems.missing && health.subsystems.missing.length > 0) {
    lines.push(`  缺失模块: ${health.subsystems.missing.join(', ')}`);
  }
  if (memStats) {
    if (typeof memStats === 'object') {
      lines.push(`  记忆: ${JSON.stringify(memStats)}`);
    } else {
      lines.push(`  记忆: ${memStats}`);
    }
  }
  if (health.initErrors) {
    lines.push(`  初始化错误: ${health.initErrors.length}个`);
  }
  return lines.join('\n');
}

// ─── 交互模式 ────────────────────────────────────────────
async function chatMode() {
  let engine = null;
  try {
    engine = createEngine();
  } catch (e) {
    console.error(`启动引擎失败: ${e.message}`);
    process.exit(1);
  }

  const version = getVersion();
  const health = engine.healthCheck ? engine.healthCheck() : {};
  const moduleCount = engine._modules ? Object.keys(engine._modules).length : 0;

  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║        ❤️  HeartFlow 心虫 — 交互式控制台          ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  版本: ${version.padEnd(36)}║`);
  console.log(`║  模块: ${String(moduleCount).padEnd(35)}║`);
  console.log(`║  构建: ${(health.buildDate || '—').padEnd(35)}║`);
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log('║  斜杠命令:                                         ║');
  console.log('║    /psych   — 心理学分析 (PAD+需求)                ║');
  console.log('║    /emotion — 情绪分析                              ║');
  console.log('║    /dr      — 决策路由评估                          ║');
  console.log('║    /status  — 引擎状态                              ║');
  console.log('║    /routes  — 可用路由列表                          ║');
  console.log('║    /exit    — 退出 (或 Ctrl+C)                     ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '❤️  > ',
    terminal: true,
  });

  // Ctrl+C / Ctrl+D 处理
  rl.on('SIGINT', () => {
    console.log('\n\n再见！💙');
    cleanup();
  });
  rl.on('close', () => {
    console.log('\n再见！💙');
    cleanup();
  });

  function cleanup() {
    try { if (engine) engine.shutdown(); } catch (_) {}
    process.exit(0);
  }

  rl.prompt();

  for await (const line of rl) {
    const input = line.trim();

    if (!input) {
      rl.prompt();
      continue;
    }

    // 处理斜杠命令
    if (input.startsWith('/')) {
      const parts = input.slice(1).split(/\s+/);
      const slashCmd = parts[0].toLowerCase();
      const args = parts.slice(1).join(' ');

      switch (slashCmd) {
        case 'exit':
        case 'quit':
          console.log('再见！💙');
          cleanup();
          break;

        case 'status': {
          console.log(formatStatus(engine));
          break;
        }

        case 'routes': {
          try {
            const routes = engine.routes();
            console.log(formatRoutes(routes));
          } catch (e) {
            console.log(`获取路由失败: ${e.message}`);
          }
          break;
        }

        case 'psych': {
          if (!args) {
            console.log('用法: /psych <你的输入>');
            rl.prompt();
            continue;
          }
          try {
            const result = engine.dispatch('psychology.analyzePsychology', args);
            console.log(formatPsychologyResult(result));
          } catch (e) {
            console.log(`心理学分析失败: ${e.message}`);
          }
          break;
        }

        case 'emotion': {
          if (!args) {
            console.log('用法: /emotion <你的输入>');
            rl.prompt();
            continue;
          }
          try {
            const result = engine.dispatch('emotion.process', args);
            console.log(formatEmotionResult(result));
          } catch (e) {
            console.log(`情绪分析失败: ${e.message}`);
          }
          break;
        }

        case 'dr': {
          if (!args) {
            console.log('用法: /dr <你的输入>');
            rl.prompt();
            continue;
          }
          try {
            const result = engine.dispatch('decisionRouter.evaluate', { input: args });
            console.log(formatDecisionResult(result));
          } catch (e) {
            console.log(`决策路由评估失败: ${e.message}`);
          }
          break;
        }

        default:
          console.log(`未知斜杠命令: /${slashCmd}  (可用: /psych, /emotion, /dr, /status, /routes, /exit)`);
      }

      rl.prompt();
      continue;
    }

    // 普通输入 → 调用 think()
    try {
      const result = await engine.think(input);
      console.log('');
      console.log('━━━ 🧠 认知分析摘要 ━━━');
      console.log(formatCognitiveSummary(result));
      console.log('');
    } catch (e) {
      console.log(`\n思考过程出错: ${e.message}\n`);
    }

    rl.prompt();
  }
}

// ─── 主入口 ──────────────────────────────────────────────
switch (cmd) {
  case 'chat':
    chatMode().catch(e => {
      console.error(`Chat 模式异常: ${e.message}`);
      process.exit(1);
    });
    break;

  case 'status': {
    let engine = null;
    try {
      const { HeartFlow } = require(path.join(hfDir, 'src/core/heartflow.js'));
      engine = new HeartFlow({ dataDir: path.join(hfDir, 'data'), silent: true });
      engine.start();
      const version = (() => {
        try { return require(path.join(hfDir, 'package.json')).version || 'unknown'; } catch(e) { return 'unknown'; }
      })();
      const result = {
        version,
        modules: engine._modules ? Object.keys(engine._modules).length : 0,
        status: 'running',
        memory: engine.identityCore ? engine.identityCore.getMemoryStats() : null
      };
      console.log(JSON.stringify(result, null, 2));
      engine.shutdown();
      process.exit(0);
    } catch (e) {
      if (engine) { try { engine.shutdown(); } catch (_) {} }
      console.error(JSON.stringify({ error: e.message }));
      process.exit(1);
    }
    break;
  }

  case 'help':
    console.log(`HeartFlow CLI
Usage: node cli.js <command>
Commands:
  status  显示引擎状态（版本、模块数、记忆统计）
  chat    启动交互式控制台（支持 think() 和斜杠命令）
  help    显示此帮助信息`);
    process.exit(0);
    break;

  default:
    console.error(`Unknown command: ${cmd}`);
    process.exit(1);
}

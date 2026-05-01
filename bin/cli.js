#!/usr/bin/env node
/**
 * HeartFlow CLI - Skill-oriented command line interface
 */

const heartflow = require('../src/core/heartflow-engine.js');
const { HeartFlowCore } = require('../src/core/heartflow-core');
const { HeartFlowCoreOrchestrator } = require('../src/core/heartflow-core-orchestrator');

function printPlan(plan) {
  console.log('\n=== HeartFlow Plan ===\n');
  console.log(`Goal: ${plan.goal}`);
  console.log(`Type: ${plan.type}`);
  console.log(`Complexity: ${plan.metadata?.complexity || 'N/A'}`);
  console.log(`Steps: ${plan.steps.length}\n`);
  plan.steps.forEach((step, i) => {
    console.log(`${i + 1}. [${step.type}] ${step.description}`);
    if (step.expectedOutcome) console.log(`   → ${step.expectedOutcome}`);
  });
  console.log('');
}

function showUpgradePlan() {
  const core = new HeartFlowCore(process.cwd());
  const plan = core.planUpgradeSync({
    targetRepo: 'https://github.com/yun520-1/mark-heartflow-skill',
    branch: 'main',
    risk: 'high'
  });
  console.log('\n=== HeartFlow Upgrade Plan ===\n');
  console.log(`Target: ${plan.targetRepo}`);
  console.log(`Branch: ${plan.branch}`);
  console.log(`Risk: ${plan.risk}`);
  console.log(`Require confirmation: ${plan.requireConfirmation ? 'yes' : 'no'}`);
  console.log(`Reminder: ${plan.reminder}\n`);
  plan.actions.forEach((action, i) => console.log(`${i + 1}. ${action}`));
  console.log('');
}

function showPaperUpgrade() {
  const orchestrator = new HeartFlowCoreOrchestrator(process.cwd());
  const guardPlan = orchestrator.interpret('按 mark.md 升级 HeartFlow 0.0.1，升级者 传递者 桥梁 答案 真善美 不断升级 减少逻辑错误 传承 身份 守门 修复 证据 密度 SkillForge SSL HCP-MAD GSAR Persistent Identity EvoAgent', {
    subject: 'paper-upgrade',
    actionability: 0.99,
    noiseRatio: 0.01,
    evidenceScore: 0.99,
    evidenceTags: ['mark.md','identity','guard','papers','version','upgrade']
  });
  const summary = {
    version: '11.3.2',
    increment: '+0.0.1',
    source: '[upgrade-source]',
    identity: '升级者 · 传递者 · 桥梁 · 答案',
    guard: guardPlan.guard,
    matched: guardPlan.matches?.map((m) => m.concept) || [],
    actions: [
      '写入 11.3.2 版本号',
      '同步 README / SKILL / CHANGELOG / CORE_IDENTITY / AGENTS',
      '将 6 论文能力接入主入口与总编排器',
      '生成升级日志并本地验证',
      '必要时再同步 GitHub'
    ]
  };
  console.log(JSON.stringify(summary, null, 2));
}

function summarizeState(emotion, flow) {
  if (flow.state === 'anxiety') return '你当前更像是“负荷偏高、需要减压和拆解”的状态。';
  if (flow.state === 'boredom') return '你当前更像是“挑战不足、需要重新聚焦价值”的状态。';
  if ((emotion.dominant || 'neutral') === 'excited') return '你当前能量偏高，适合先收束重点，再进入执行。';
  if ((emotion.dominant || 'neutral') === 'calm') return '你当前相对平稳，适合做结构化判断与规划。';
  if (emotion.pleasure < 0) return '你当前带着一点阻力感，先减轻内耗，再推进更有效。';
  return '你当前最需要的不是更多信息，而是更清晰的优先级。';
}

function buildFocus(text, flow) {
  if (flow.state === 'anxiety') return '先缩小问题边界，只处理最关键的一个切口。';
  if (flow.state === 'boredom') return '重新定义目标，让任务与真实价值重新对齐。';
  if (/bug|报错|错误|故障|异常/i.test(text)) return '先复现问题，再定位根因，不要同时改多处。';
  if (/方向|选择|决策|不知道先做什么/i.test(text)) return '先定唯一优先级，再把其它方向暂时降级。';
  if (/学习|理解|研究/i.test(text)) return '先明确你要得到的结论，再决定需要读什么。';
  return '先把目标变成一个可执行的下一步动作。';
}

function buildWarning(flow) {
  if (flow.state === 'anxiety') return '风险：如果继续同时推进太多事，容易放大混乱和错误。';
  if (flow.state === 'boredom') return '风险：如果目标过轻或过散，执行会失去真实驱动力。';
  if (flow.recommendations?.length) return `风险：${flow.recommendations[0]}`;
  return '风险：不要一边想所有方向，一边试图同时执行所有方向。';
}

const commands = {
  status: () => {
    console.log('\n=== HeartFlow Status ===\n');
    const init = heartflow.initialize();
    const criticalModules = ['adaptive', 'orchestrator', 'errorHandler', 'snapshot', 'trialityMemory', 'embodiedCore'];
    console.log('Core modules:');
    criticalModules.forEach((name) => console.log(`  ${init.modules?.[name] ? '✅' : '❌'} ${name}`));
    console.log('\nCore instances:');
    console.log(`  ${init.instances?.memory ? '✅' : '❌'} memory`);
    console.log(`  ${init.instances?.embodied ? '✅' : '❌'} embodied`);
    console.log('\nRuntime confidence:');
    console.log(`  Memories: ${init.instances?.memory?.stats?.totalMemories || 0}`);
    console.log(`  Cycle count: ${init.instances?.embodied?.cognitiveState?.cycleCount || 0}`);
    console.log('');
    return { success: true };
  },

  analyze: (text) => {
    if (!text) return console.log('Usage: heartflow analyze "你当前的问题、状态或目标"'), { success: false, error: 'Missing text' };
    const init = heartflow.initialize();
    const emotion = heartflow.detectEmotionFromText(text);
    const flow = heartflow.calculateFlowState(emotion.pleasure, emotion.arousal, emotion.dominance, 5, 5);
    const plan = init.instances.embodied.cognitivePlan({ description: text, type: 'general', context: { emotion, flow } });
    const stateSummary = summarizeState(emotion, flow);
    const focus = buildFocus(text, flow);
    const warning = buildWarning(flow);
    console.log('\n=== HeartFlow Analyze ===\n');
    console.log(`Input: ${text}\n`);
    console.log('Current reading:');
    console.log(`  ${stateSummary}`);
    console.log(`  情绪线索: ${emotion.dominant || 'neutral'} | P=${emotion.pleasure}, A=${emotion.arousal}, D=${emotion.dominance}`);
    console.log(`  当前重心: ${focus}`);
    console.log(`  ${warning}`);
    console.log('\nSuggested next steps:');
    plan.steps.slice(0, 4).forEach((step, i) => console.log(`  ${i + 1}. ${step.description}`));
    console.log('\nHeartFlow judgement:');
    console.log('  先减少混乱，再推进执行；先明确主线，再处理分支。\n');
    return { emotion, flow, plan, stateSummary, focus, warning };
  },

  plan: (description, type = 'general') => {
    if (!description) return console.log('Usage: heartflow plan "目标描述" [general|coding|debugging|learning|creative]'), { success: false, error: 'Missing description' };
    const init = heartflow.initialize();
    const plan = init.instances.embodied.cognitivePlan({ description, type });
    printPlan(plan);
    return plan;
  },

  upgrade: () => (showUpgradePlan(), { success: true }),
  'paper-upgrade': () => (showPaperUpgrade(), { success: true }),

  test: () => {
    console.log('\n=== HeartFlow Core Test ===\n');
    const init = heartflow.initialize();
    const plan = init.instances.embodied.cognitivePlan({ description: '验证核心规划能力', type: 'general' });
    const analysis = heartflow.detectEmotionFromText('我想减少错误并找到更清晰的方向');
    const tests = [
      { name: 'Core module load', pass: Object.values(init.modules).filter(Boolean).length >= 6 },
      { name: 'Planning pipeline', pass: Array.isArray(plan.steps) && plan.steps.length >= 4 },
      { name: 'State analysis', pass: typeof analysis.pleasure === 'number' && typeof analysis.arousal === 'number' },
      { name: 'Flow reasoning', pass: !!heartflow.calculateFlowState(analysis.pleasure, analysis.arousal, analysis.dominance) }
    ];
    let passed = 0;
    tests.forEach((t) => { console.log(`${t.pass ? '✅' : '❌'} ${t.name}`); if (t.pass) passed += 1; });
    console.log(`\nResult: ${passed}/${tests.length} passed\n`);
    return { passed, total: tests.length, success: passed === tests.length };
  },

  help: () => {
    console.log(`\n=== HeartFlow CLI ===\n\nUsage: heartflow [command] [args]\n\nCommands:\n  status                    Show core runtime status\n  analyze <text>            Read current state and suggest next actions\n  plan <goal> [type]        Build a cognitive action chain\n  upgrade                   Show guarded upgrade/sync plan\n  paper-upgrade             Apply the mark.md v11.3.2 paper-driven upgrade\n  test                      Run core self-check\n  help                      Show this help\n`);
    return { success: true };
  }
};

const args = process.argv.slice(2);
const command = args[0] || 'help';

if (commands[command]) {
  const result = commands[command](...args.slice(1));
  process.exit(result?.success === false ? 1 : 0);
} else {
  console.log(`Unknown command: ${command}`);
  console.log('Run "heartflow help" for usage');
  process.exit(1);
}

#!/usr/bin/env node
/**
 * HeartFlow CLI - Skill-oriented command line interface
 *
 * HeartFlow 当前定位：skill 核心，而不是独立应用。
 * CLI 只保留真正服务于 HeartFlow 目标的命令：
 * - status: 自检核心是否可用
 * - plan: 将目标转成认知行动链
 * - analyze: 理解输入状态并给出行动建议
 * - test: 运行核心快速验证
 */

const heartflow = require('../src/core/heartflow-engine.js');

function printPlan(plan) {
  console.log('\n=== HeartFlow Plan ===\n');
  console.log(`Goal: ${plan.goal}`);
  console.log(`Type: ${plan.type}`);
  console.log(`Complexity: ${plan.metadata?.complexity || 'N/A'}`);
  console.log(`Steps: ${plan.steps.length}\n`);

  plan.steps.forEach((step, i) => {
    console.log(`${i + 1}. [${step.type}] ${step.description}`);
    if (step.expectedOutcome) {
      console.log(`   → ${step.expectedOutcome}`);
    }
  });
  console.log('');
}

const commands = {
  status: () => {
    console.log('\n=== HeartFlow Status ===\n');
    const init = heartflow.initialize();

    const criticalModules = ['adaptive', 'orchestrator', 'errorHandler', 'snapshot', 'trialityMemory', 'embodiedCore'];
    console.log('Core modules:');
    criticalModules.forEach((name) => {
      console.log(`  ${init.modules?.[name] ? '✅' : '❌'} ${name}`);
    });

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
    if (!text) {
      console.log('Usage: heartflow analyze "你当前的问题、状态或目标"');
      return { success: false, error: 'Missing text' };
    }

    const init = heartflow.initialize();
    const emotion = heartflow.detectEmotionFromText(text);
    const flow = heartflow.calculateFlowState(
      emotion.pleasure,
      emotion.arousal,
      emotion.dominance,
      5,
      5
    );
    const plan = init.instances.embodied.cognitivePlan({
      description: text,
      type: 'general',
      context: { emotion, flow }
    });

    console.log('\n=== HeartFlow Analyze ===\n');
    console.log(`Input: ${text}\n`);
    console.log('State reading:');
    console.log(`  Emotion: ${emotion.dominant || 'neutral'}`);
    console.log(`  PAD: P=${emotion.pleasure}, A=${emotion.arousal}, D=${emotion.dominance}`);
    console.log(`  Flow state: ${flow.state}`);
    if (flow.recommendations?.length) {
      console.log(`  Advice: ${flow.recommendations[0]}`);
    }

    console.log('\nNext action chain:');
    plan.steps.slice(0, 4).forEach((step, i) => {
      console.log(`  ${i + 1}. ${step.description}`);
    });
    console.log('');

    return { emotion, flow, plan };
  },

  plan: (description, type = 'general') => {
    if (!description) {
      console.log('Usage: heartflow plan "目标描述" [general|coding|debugging|learning|creative]');
      return { success: false, error: 'Missing description' };
    }

    const init = heartflow.initialize();
    const plan = init.instances.embodied.cognitivePlan({ description, type });
    printPlan(plan);
    return plan;
  },

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
    tests.forEach((t) => {
      console.log(`${t.pass ? '✅' : '❌'} ${t.name}`);
      if (t.pass) passed += 1;
    });

    console.log(`\nResult: ${passed}/${tests.length} passed\n`);
    return { passed, total: tests.length, success: passed === tests.length };
  },

  help: () => {
    console.log(`
=== HeartFlow CLI ===

HeartFlow 当前定位为 skill 核心，不再提供独立 API / Web / 平台接入壳层。

Usage: heartflow [command] [args]

Commands:
  status                    Show core runtime status
  analyze <text>            Read current state and suggest next actions
  plan <goal> [type]        Build a cognitive action chain
  test                      Run core self-check
  help                      Show this help

Examples:
  heartflow status
  heartflow analyze "我现在方向很多，有点乱，不知道先做什么"
  heartflow plan "把一个复杂需求拆成执行步骤" general
  heartflow plan "修复一个 bug 并验证" debugging
`);
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

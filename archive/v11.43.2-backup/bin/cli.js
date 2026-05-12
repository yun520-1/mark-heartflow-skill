#!/usr/bin/env node
/**
 * HeartFlow CLI - Skill-oriented command line interface
 * 
 * Real, working commands that use the actual heartflow-engine.js API.
 * Dead code referencing non-existent HeartFlowCore/CoreOrchestrator removed.
 */

const heartflow = require('../src/core/heartflow-engine.js');

// ─────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────

function summarizeState(emotion, flow) {
  if (flow.state === 'anxiety') return '你当前更像是"负荷偏高、需要减压和拆解"的状态。';
  if (flow.state === 'boredom') return '你当前更像是"挑战不足、需要重新聚焦价值"的状态。';
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

// ─────────────────────────────────────────────
// Core engine access
// ─────────────────────────────────────────────

function getEngine() {
  return heartflow;
}

// ─────────────────────────────────────────────
// Commands
// ─────────────────────────────────────────────

const commands = {

  status: () => {
    console.log('\n=== HeartFlow Status ===\n');
    try {
      const init = heartflow.initialize?.();
      if (!init) {
        console.log('heartflow.initialize() returned nothing — engine may not support init');
        console.log('heartflow keys:', Object.keys(heartflow).slice(0, 15));
        return { success: true };
      }
      const modules = init.modules || {};
      const instances = init.instances || {};
      console.log('Core modules loaded:');
      Object.entries(modules).forEach(([name, loaded]) => {
        console.log(`  ${loaded ? '✅' : '❌'} ${name}`);
      });
      console.log('\nRuntime info:');
      console.log(`  Instances:`, Object.keys(instances));
      return { success: true, modules, instances };
    } catch(e) {
      console.error('Status error:', e.message);
      return { success: false, error: e.message };
    }
  },

  analyze: (text) => {
    if (!text) {
      console.log('Usage: heartflow analyze "你当前的问题、状态或目标"');
      return { success: false, error: 'Missing text' };
    }
    try {
      const init = heartflow.initialize?.() || {};
      const instances = init.instances || {};
      
      // Detect emotion via engine
      const emotion = heartflow.detectEmotionFromText?.(text) || { dominant: 'neutral', pleasure: 0, arousal: 0, dominance: 0 };
      const flow = heartflow.calculateFlowState?.(emotion.pleasure, emotion.arousal, emotion.dominance, 5, 5) || { state: 'neutral' };

      // Get plan from embodied if available
      let plan = { steps: [] };
      if (instances.embodied?.cognitivePlan) {
        plan = instances.embodied.cognitivePlan({ description: text, type: 'general', context: { emotion, flow } });
      } else if (heartflow.getAgentManager?.().plan) {
        plan = heartflow.getAgentManager().plan({ description: text, type: 'general' });
      }

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
      
      if (plan.steps?.length) {
        console.log('\nSuggested next steps:');
        plan.steps.slice(0, 4).forEach((step, i) => console.log(`  ${i + 1}. ${step.description}`));
      }
      
      console.log('\nHeartFlow judgement:');
      console.log('  先减少混乱，再推进执行；先明确主线，再处理分支。\n');
      
      return { emotion, flow, plan, stateSummary, focus, warning };
    } catch(e) {
      console.error('Analyze error:', e.message);
      return { success: false, error: e.message };
    }
  },

  plan: (description, type = 'general') => {
    if (!description) {
      console.log('Usage: heartflow plan "目标描述" [general|coding|debugging|learning|creative]');
      return { success: false, error: 'Missing description' };
    }
    try {
      const init = heartflow.initialize?.() || {};
      const instances = init.instances || {};
      
      let plan;
      if (instances.embodied?.cognitivePlan) {
        plan = instances.embodied.cognitivePlan({ description, type });
      } else if (heartflow.getAgentManager?.()?.plan) {
        plan = heartflow.getAgentManager().plan({ description, type });
      } else {
        console.log('No planning module available');
        return { success: false, error: 'No planner' };
      }

      console.log('\n=== HeartFlow Plan ===\n');
      console.log(`Goal: ${description}`);
      console.log(`Type: ${type}`);
      console.log(`Steps: ${plan.steps?.length || 0}\n`);
      plan.steps?.forEach((step, i) => {
        console.log(`${i + 1}. [${step.type || 'step'}] ${step.description}`);
        if (step.expectedOutcome) console.log(`   → ${step.expectedOutcome}`);
      });
      console.log('');
      return plan;
    } catch(e) {
      console.error('Plan error:', e.message);
      return { success: false, error: e.message };
    }
  },

  test: () => {
    console.log('\n=== HeartFlow Core Test ===\n');
    try {
      const init = heartflow.initialize?.() || {};
      const instances = init.instances || {};
      
      const tests = [
        { name: 'heartflow-engine loads', pass: !!heartflow },
        { name: 'detectEmotionFromText', pass: typeof heartflow.detectEmotionFromText === 'function' },
        { name: 'calculateFlowState', pass: typeof heartflow.calculateFlowState === 'function' },
        { name: 'getAgentManager', pass: typeof heartflow.getAgentManager === 'function' },
      ];
      
      // Additional runtime checks
      if (instances.embodied) tests.push({ name: 'embodied instance', pass: true });
      if (instances.memory) tests.push({ name: 'memory instance', pass: true });
      
      let passed = 0;
      tests.forEach((t) => {
        console.log(`${t.pass ? '✅' : '❌'} ${t.name}`);
        if (t.pass) passed++;
      });
      
      console.log(`\nResult: ${passed}/${tests.length} passed\n`);
      return { passed, total: tests.length, success: passed === tests.length };
    } catch(e) {
      console.error('Test error:', e.message);
      return { success: false, error: e.message };
    }
  },

  help: () => {
    console.log(`\n=== HeartFlow CLI ===\n
Usage: heartflow [command] [args]

Commands:
  status              Show core runtime status and loaded modules
  analyze <text>      Read current state and suggest next actions
  plan <goal> [type]  Build a cognitive action chain
  test                Run core self-check
  help                Show this help
`);
    return { success: true };
  }
};

// ─────────────────────────────────────────────
// Dispatch
// ─────────────────────────────────────────────

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

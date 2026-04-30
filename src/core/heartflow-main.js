#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { HeartFlowCoreOrchestrator } = require('./heartflow-core-orchestrator');

const projectRoot = path.resolve(__dirname, '../..');
const orchestrator = new HeartFlowCoreOrchestrator(projectRoot);

function showStatus() {
  const stats = orchestrator.getStats();
  console.log('\n=== HeartFlow Main Status ===\n');
  console.log(`Root: ${projectRoot}`);
  console.log(`History: ${stats.historySize}`);
  console.log(`Memory: ${JSON.stringify(stats.memory)}`);
  console.log(`Result runs: ${stats.result.runs}`);
  console.log(`Result confidence: ${stats.result.averageConfidence}`);
  console.log(`Logic mean confidence: ${stats.logic.meanConfidence}`);
  console.log('');
}

function showUpgradePlan() {
  const plan = orchestrator.logicCore?.getCore ? orchestrator.logicCore.getCore() : null;
  const guard = orchestrator.interpret('HeartFlow upgrade sync guard trigger', { subject: 'upgrade-plan', actionability: 0.9, noiseRatio: 0.05 });
  const upgradePlan = {
    targetRepo: 'https://github.com/yun520-1/mark-heartflow-skill',
    branch: 'main',
    reminder: '先提醒、再扫描、再分类、再确认、再执行、再验证',
    guard: guard.guard,
    logic: plan,
    actions: [
      '检查版本是否对齐',
      '扫描主入口与临时文件',
      '分类主线/归档/删除',
      '确认是否需要推送',
      '执行小步修改',
      '本地验证后同步 GitHub'
    ]
  };
  console.log(JSON.stringify(upgradePlan, null, 2));
}

function showPaperUpgrade() {
  const guardPlan = orchestrator.interpret('按 mark.md 升级 HeartFlow 0.0.1', {
    subject: 'paper-upgrade',
    actionability: 0.95,
    noiseRatio: 0.02
  });
  const summary = {
    version: '11.3.2',
    increment: '+0.0.1',
    source: '/Users/apple/Downloads/daima/mark.md',
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

function main() {
  const [command = 'status', ...args] = process.argv.slice(2);
  if (command === 'status') return showStatus(), 0;
  if (command === 'capture') {
    const text = args.join(' ');
    if (!text) return console.error('Usage: heartflow-main capture <text>'), 1;
    const record = orchestrator.captureDialogue([text], { subject: 'cli-capture', actionability: 0.8, noiseRatio: 0.05 });
    console.log(JSON.stringify(record, null, 2));
    return 0;
  }
  if (command === 'inspect') {
    const text = args.join(' ');
    if (!text) return console.error('Usage: heartflow-main inspect <text>'), 1;
    const record = orchestrator.interpret(text, { subject: 'cli-inspect', actionability: 0.8, noiseRatio: 0.05 });
    console.log(JSON.stringify(record, null, 2));
    return 0;
  }
  if (command === 'upgrade-plan') {
    showUpgradePlan();
    return 0;
  }
  if (command === 'paper-upgrade') {
    showPaperUpgrade();
    return 0;
  }
  if (command === 'help') {
    console.log('Usage: heartflow-main [status|capture|inspect|upgrade-plan|paper-upgrade|help]');
    return 0;
  }
  console.error(`Unknown command: ${command}`);
  return 1;
}

process.exitCode = main();

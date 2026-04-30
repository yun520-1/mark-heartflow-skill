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

function main() {
  const [command = 'status', ...args] = process.argv.slice(2);
  if (command === 'status') {
    showStatus();
    return 0;
  }
  if (command === 'capture') {
    const text = args.join(' ');
    if (!text) {
      console.error('Usage: heartflow-main capture <text>');
      return 1;
    }
    const record = orchestrator.captureDialogue([text], { subject: 'cli-capture', actionability: 0.8, noiseRatio: 0.05 });
    console.log(JSON.stringify(record, null, 2));
    return 0;
  }
  if (command === 'inspect') {
    const text = args.join(' ');
    if (!text) {
      console.error('Usage: heartflow-main inspect <text>');
      return 1;
    }
    const record = orchestrator.interpret(text, { subject: 'cli-inspect', actionability: 0.8, noiseRatio: 0.05 });
    console.log(JSON.stringify(record, null, 2));
    return 0;
  }
  if (command === 'help') {
    console.log('Usage: heartflow-main [status|capture|inspect|help]');
    return 0;
  }
  console.error(`Unknown command: ${command}`);
  return 1;
}

process.exitCode = main();

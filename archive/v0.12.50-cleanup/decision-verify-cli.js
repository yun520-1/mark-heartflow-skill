#!/usr/bin/env node
/**
 * DecisionVerifier CLI 测试工具
 * 用法: node decision-verify.js "决策内容" --reason "理由" --evidence "证据1" "证据2" --confidence 0.8
 * 
 * 或者不用参数，交互式输入:
 * node decision-verify.js --interactive
 */

const { DecisionVerifier } = require('./decision-verifier.js');
const dv = new DecisionVerifier();

function parseArgs(args) {
  const record = {};
  const evidence = [];
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--reason' || args[i] === '-r') {
      record.reason = args[++i];
    } else if (args[i] === '--decision' || args[i] === '-d') {
      record.decision = args[++i];
    } else if (args[i] === '--evidence' || args[i] === '-e') {
      while (args[i + 1] && !args[i + 1].startsWith('--')) {
        evidence.push(args[++i]);
      }
    } else if (args[i] === '--confidence' || args[i] === '-c') {
      record.confidence = parseFloat(args[++i]);
    } else if (args[i] === '--interactive' || args[i] === '-i') {
      return { interactive: true };
    } else if (!args[i].startsWith('--')) {
      // 位置参数：第一个是决策，第二个是理由
      if (!record.decision) record.decision = args[i];
      else if (!record.reason) record.reason = args[i];
    }
  }
  
  if (evidence.length) record.evidence = evidence;
  return record;
}

function runInteractive() {
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  
  const questions = [
    { prompt: '决策/行动: ', key: 'decision' },
    { prompt: '理由: ', key: 'reason' },
    { prompt: '置信度 (0-1): ', key: 'confidence', parse: v => parseFloat(v) || 0.5 },
    { prompt: '证据 (逗号分隔，可跳过): ', key: 'evidence', parse: v => v.split(',').map(e => e.trim()).filter(Boolean) },
  ];
  
  const answers = {};
  let qi = 0;
  
  function ask() {
    if (qi >= questions.length) {
      rl.close();
      const result = dv.verify(answers);
      printResult(result);
      return;
    }
    const q = questions[qi++];
    rl.question(q.prompt, ans => {
      answers[q.key] = q.parse ? q.parse(ans) : ans;
      ask();
    });
  }
  
  ask();
}

function printResult(result) {
  const score = typeof result.score === 'string' ? result.score : result.score?.toFixed(3);
  
  console.log('\n══════════════════════════════════════');
  console.log(`  验证结果: ${result.valid ? '✅ 通过' : '❌ 未通过'}`);
  console.log(`  决策得分: ${score}`);
  console.log('══════════════════════════════════════');
  
  if (result.issues?.length) {
    console.log('\n发现的问题:');
    result.issues.forEach((issue, i) => {
      const icon = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🔵';
      console.log(`  ${icon} ${i + 1}. [${issue.type}] ${issue.message}`);
      if (issue.repairHint) console.log(`     → 建议: ${issue.repairHint}`);
    });
  }
  
  if (result.repairHints?.length) {
    console.log('\n修复建议:');
    result.repairHints.forEach((hint, i) => console.log(`  ${i + 1}. ${hint}`));
  }
  
  if (result.summary) {
    console.log(`\n总结: ${result.summary}`);
  }
  
  console.log('');
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--interactive') || args.includes('-i') || args.length === 0) {
    runInteractive();
    return;
  }
  
  const record = parseArgs(args);
  
  if (!record.decision) {
    console.log('用法:');
    console.log('  node decision-verify.js "投资AI创业公司" --reason "市场增长快" --evidence "报告A" "报告B" --confidence 0.7');
    console.log('  node decision-verify.js --interactive');
    process.exit(1);
  }
  
  const result = dv.verify(record);
  printResult(result);
  process.exit(result.valid ? 0 : 1);
}

main();

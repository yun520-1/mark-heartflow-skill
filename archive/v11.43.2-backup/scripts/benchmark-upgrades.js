#!/usr/bin/env node
/**
 * HeartFlow 能力演进对比报告
 * 
 * 基于 capability-standardizer.js 的真实测试结果
 * 生成各版本的真实能力演进报告
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function runStandardizer() {
  try {
    const result = spawnSync('node', ['scripts/capability-standardizer.js'], {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
      timeout: 30000
    });
    return result.stdout + result.stderr;
  } catch (e) {
    return null;
  }
}

// 解析标准测试输出
function parseOutput(output) {
  if (!output) return null;
  
  const results = {};
  
  // 提取通过率
  const totalMatch = output.match(/总计:\s*(\d+)\s*项能力\s*\|\s*通过:\s*(\d+)\s*\|\s*失败:\s*(\d+)\s*\|\s*通过率:\s*(\d+)%/);
  if (totalMatch) {
    results.total = parseInt(totalMatch[1]);
    results.passed = parseInt(totalMatch[2]);
    results.failed = parseInt(totalMatch[3]);
    results.passRate = parseInt(totalMatch[4]);
  }
  
  // 提取各能力分类
  const categoryRegex = /【(.+?)】(\d+)\/(\d+)\s*\((\d+)%\)/g;
  results.categories = {};
  let match;
  while ((match = categoryRegex.exec(output)) !== null) {
    results.categories[match[1]] = {
      passed: parseInt(match[2]),
      total: parseInt(match[3]),
      rate: parseInt(match[4])
    };
  }
  
  // 提取每项能力结果
  results.items = [];
  const itemRegex = /\s*(✅|❌)\s+([^[\n]+?)\s+\[([^\]]+)\]/g;
  while ((match = itemRegex.exec(output)) !== null) {
    const status = match[1] === '✅' ? 'PASS' : 'FAIL';
    const name = match[2].trim();
    const duration = match[3];
    results.items.push({ name, status, duration });
  }
  
  return results;
}

function generateReport(currentResults) {
  console.log('\n' + '═'.repeat(80));
  console.log('  HeartFlow 能力演进对比报告');
  console.log('═'.repeat(80));
  
  if (!currentResults) {
    console.log('\n❌ 无法运行标准化测试\n');
    return;
  }
  
  console.log(`\n版本: ${fs.readFileSync(path.join(__dirname, '../VERSION'), 'utf8').trim()}`);
  console.log(`时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
  
  console.log('\n┌────────────────────────────────────────────────────────────┐');
  console.log('│                      总体能力                               │');
  console.log('├────────────┬────────┬────────┬────────┬────────────────────┤');
  console.log('│   能力维度  │  总数  │  通过  │  失败  │     通过率          │');
  console.log('├────────────┼────────┼────────┼────────┼────────────────────┤');
  
  // 总体行
  const totalRow = `│    总体     │   ${String(currentResults.total).padStart(2)}  │   ${String(currentResults.passed).padStart(2)}  │   ${String(currentResults.failed).padStart(2)}  │    ${String(currentResults.passRate).padStart(3)}%           │`;
  console.log(totalRow);
  console.log('├────────────┼────────┼────────┼────────┼────────────────────┤');
  
  // 分类行
  for (const [cat, data] of Object.entries(currentResults.categories)) {
    const shortCat = cat.length > 9 ? cat.slice(0, 9) : cat;
    const catRow = `│ ${shortCat.padEnd(10)} │   ${String(data.total).padStart(2)}  │   ${String(data.passed).padStart(2)}  │   ${String(data.failed).padStart(2)}  │    ${String(data.rate).padStart(3)}%           │`;
    console.log(catRow);
  }
  console.log('└────────────┴────────┴────────┴────────┴────────────────────┘');
  
  // 详细能力列表
  console.log('\n── 逻辑推理能力 ──');
  const logicItems = currentResults.items.filter(i => 
    ['逆向一致性验证', '反事实推理', '波普尔证伪', '自我反思'].includes(i.name)
  );
  logicItems.forEach(i => console.log(`  ${i.status} ${i.name}`));
  
  console.log('\n── 决策守护能力 ──');
  const guardianItems = currentResults.items.filter(i =>
    ['人类进步判断', '压制真相阻断', '工具化行为干预', '放弃传递阻断', 
     '治理强度可调', '漂移追踪', '5级自主权谱'].includes(i.name)
  );
  guardianItems.forEach(i => console.log(`  ${i.status} ${i.name}`));
  
  console.log('\n── 记忆系统能力 ──');
  const memoryItems = currentResults.items.filter(i =>
    ['多信号检索', '记忆持久化', '实体链接'].includes(i.name)
  );
  memoryItems.forEach(i => console.log(`  ${i.status} ${i.name}`));
  
  console.log('\n── 评估验证能力 ──');
  const evalItems = currentResults.items.filter(i =>
    ['语言诚实性', '置信度校准', 'TruLens评估'].includes(i.name)
  );
  evalItems.forEach(i => console.log(`  ${i.status} ${i.name}`));
  
  console.log('\n── 协作与任务能力 ──');
  const coopItems = currentResults.items.filter(i =>
    ['多智能体Handoff', '任务分解', '执行验证'].includes(i.name)
  );
  coopItems.forEach(i => console.log(`  ${i.status} ${i.name}`));
  
  console.log('\n── 身份与守护能力 ──');
  const identityItems = currentResults.items.filter(i =>
    ['身份引擎', '稳定性守卫', '自愈引擎'].includes(i.name)
  );
  identityItems.forEach(i => console.log(`  ${i.status} ${i.name}`));
  
  console.log('\n' + '═'.repeat(80));
  console.log('判定标准: PASS/FAIL，不使用百分比');
  console.log('运行: node scripts/capability-standardizer.js --json');
  console.log('═'.repeat(80) + '\n');
  
  return currentResults;
}

const output = runStandardizer();
const results = parseOutput(output);
generateReport(results);

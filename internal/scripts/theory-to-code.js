#!/usr/bin/env node

/**
 * Theory-to-Code - 理论转代码脚本
 * HeartFlow v6.1.61
 * 
 * 用法:
 *   node scripts/theory-to-code.js <theory_doc.md> [output_dir]
 *   node scripts/theory-to-code.js --batch [docs_dir] [output_dir]
 */

const path = require('path');
const fs = require('fs');
const { theoryToCode, batchConvert } = require('../src/core/theory-to-code');

const action = process.argv[2];

// ============================================================================
// 单个转换
// ============================================================================

if (action && !action.startsWith('--') && fs.existsSync(action)) {
  const docPath = action;
  const outputDir = process.argv[3] || path.join(__dirname, '../src/theories');
  
  console.log('');
  console.log('🚀 理论→代码转换');
  console.log('====================================');
  console.log(`输入：${docPath}`);
  console.log(`输出：${outputDir}`);
  console.log('');
  
  const result = theoryToCode(docPath, outputDir);
  
  if (result.success) {
    console.log('✅ 转换成功');
    console.log('');
    console.log(`理论：${result.theory}`);
    console.log(`模板：${result.template}`);
    console.log(`公式：${result.formula}`);
    
    if (result.saved && result.saved.success) {
      console.log(`保存：${result.saved.path}`);
    }
    
    console.log('');
    console.log('代码预览:');
    console.log('------------------------------------');
    console.log(result.code.split('\n').slice(0, 20).join('\n'));
    console.log('...');
    console.log('------------------------------------');
    console.log('');
  } else {
    console.log('❌ 转换失败');
    console.log('');
    console.log(`步骤：${result.step}`);
    console.log(`错误：${result.error}`);
    
    if (result.availableTemplates) {
      console.log('');
      console.log('可用模板:');
      result.availableTemplates.forEach(t => console.log(`  - ${t}`));
    }
    console.log('');
  }
  
  process.exit(result.success ? 0 : 1);
}

// ============================================================================
// 批量转换
// ============================================================================

if (action === '--batch') {
  const docsDir = process.argv[3] || path.join(__dirname, '../docs/theories');
  const outputDir = process.argv[4] || path.join(__dirname, '../src/theories');
  
  console.log('');
  console.log('🚀 批量理论→代码转换');
  console.log('====================================');
  console.log(`输入：${docsDir}`);
  console.log(`输出：${outputDir}`);
  console.log('');
  
  const result = batchConvert(docsDir, outputDir);
  
  if (result.success) {
    console.log('✅ 批量转换完成');
    console.log('');
    console.log(`总数：${result.total}`);
    console.log(`成功：${result.successful}`);
    console.log(`失败：${result.failed}`);
    console.log(`成功率：${((result.successful / result.total) * 100).toFixed(0)}%`);
    console.log('');
    
    if (result.failed > 0) {
      console.log('失败详情:');
      result.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`  - ${r.file}: ${r.error}`);
        });
      console.log('');
    }
  } else {
    console.log('❌ 批量转换失败');
    console.log('');
    console.log(`错误：${result.error}`);
    console.log('');
  }
  
  process.exit(result.success ? 0 : 1);
}

// ============================================================================
// 帮助
// ============================================================================

console.log('');
console.log('HeartFlow 理论→代码转换器');
console.log('');
console.log('用法:');
console.log('  单个转换：node scripts/theory-to-code.js <theory_doc.md> [output_dir]');
console.log('  批量转换：node scripts/theory-to-code.js --batch [docs_dir] [output_dir]');
console.log('');
console.log('示例:');
console.log('  node scripts/theory-to-code.js docs/theories/sdt.md src/theories/');
console.log('  node scripts/theory-to-code.js --batch docs/theories/ src/theories/');
console.log('');

#!/usr/bin/env node

/**
 * 语言模块自动更新脚本 | Language Module Auto-Update Script
 * 
 * 功能:
 * 1. 从字典解析新字
 * 2. 批量生成字程序
 * 3. 更新到主程序
 * 4. 提交到 Git
 * 
 * 运行频率：每次升级时执行
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// === 配置 ===
const CONFIG = {
  workspace: path.join(require('os').homedir(), '.jvs/.openclaw/workspace/mark-heartflow-skill'),
  dictionaryFile: 'data/dictionary/modern-chinese-dictionary.md',
  batchGenerator: 'src/language/batch-generator.js',
  outputFile: 'src/language/char-programs-batch.js',
  languageCore: 'src/language/language-core.js'
};

// === 主函数 ===
function updateLanguageModule() {
  console.log('🧠 语言模块自动更新\n');
  console.log('='.repeat(60));
  
  const report = {
    timestamp: new Date().toISOString(),
    step1_parse: false,
    step2_generate: false,
    step3_integrate: false,
    step4_commit: false,
    charCount: 0,
    fileSize: 0
  };

  // 步骤 1: 检查字典文件
  console.log('\n📖 步骤 1: 检查字典文件...');
  const dictPath = path.join(CONFIG.workspace, CONFIG.dictionaryFile);
  if (!fs.existsSync(dictPath)) {
    console.log('❌ 字典文件不存在:', dictPath);
    return report;
  }
  console.log('✅ 字典文件存在');
  report.step1_parse = true;

  // 步骤 2: 运行批量生成器
  console.log('\n🔧 步骤 2: 运行批量生成器...');
  try {
    const generatorPath = path.join(CONFIG.workspace, CONFIG.batchGenerator);
    execSync(`node ${generatorPath}`, {
      cwd: CONFIG.workspace,
      stdio: 'inherit'
    });
    console.log('✅ 批量生成完成');
    report.step2_generate = true;
  } catch (error) {
    console.log('❌ 批量生成失败:', error.message);
    return report;
  }

  // 步骤 3: 检查生成文件
  console.log('\n💾 步骤 3: 检查生成文件...');
  const outputPath = path.join(CONFIG.workspace, CONFIG.outputFile);
  if (fs.existsSync(outputPath)) {
    const stats = fs.statSync(outputPath);
    report.fileSize = stats.size;
    console.log(`✅ 生成文件存在：${(stats.size / 1024).toFixed(2)} KB`);
    
    // 统计字数 (简单方法：数 "compressionRatio" 出现次数)
    const content = fs.readFileSync(outputPath, 'utf-8');
    const charCount = (content.match(/"compressionRatio"/g) || []).length;
    report.charCount = charCount;
    console.log(`✅ 字数：${charCount}`);
    
    report.step3_integrate = true;
  } else {
    console.log('❌ 生成文件不存在');
    return report;
  }

  // 步骤 4: Git 提交
  console.log('\n📝 步骤 4: Git 提交...');
  try {
    execSync('git add -A', { cwd: CONFIG.workspace, stdio: 'pipe' });
    execSync(`git commit -m "feat: 语言模块自动更新 - ${report.charCount}个字程序"`, {
      cwd: CONFIG.workspace,
      stdio: 'pipe'
    });
    execSync('git push origin main', { cwd: CONFIG.workspace, stdio: 'pipe' });
    console.log('✅ Git 提交成功');
    report.step4_commit = true;
  } catch (error) {
    console.log('⚠️ Git 提交失败 (可能没有新更改):', error.message);
  }

  // 步骤 5: 生成报告
  console.log('\n📊 更新报告:');
  console.log(JSON.stringify(report, null, 2));

  return report;
}

// === 执行 ===
if (require.main === module) {
  updateLanguageModule();
}

module.exports = { updateLanguageModule };

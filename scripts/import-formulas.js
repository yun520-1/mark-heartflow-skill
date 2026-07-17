#!/usr/bin/env node
/**
 * 批量导入公式到 HeartFlow 公式引擎
 * 
 * 功能: 从多个来源批量导入公式
 * 来源: 
 *   1. common_formulas.json (手动整理)
 *   2. sympy_formulas.json (SymPy 导出)
 *   3. wikipedia_formulas.json (Wikipedia 抓取)
 */

const fs = require('fs');
const path = require('path');

console.log('=== 批量导入公式到 HeartFlow ===\n');

// 公式来源
const sources = [
  'common_formulas.json',
  '../formulas/common_formulas.json',
  '../formulas/sympy_formulas.json',
  '../formulas/wikipedia_formulas.json'
];

const allFormulas = [];
const metadata = {
  version: '1.0.0',
  last_updated: new Date().toISOString().split('T')[0],
  total_formulas: 0,
  sources: []
};

// 读取所有来源
for (const source of sources) {
  const sourcePath = path.resolve(__dirname, source);
  
  if (!fs.existsSync(sourcePath)) {
    console.log(`⚠️  来源不存在: ${source}`);
    continue;
  }

  try {
    const data = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'));
    const formulas = data.formulas || [];
    
    console.log(`✅ 加载来源: ${source} (${formulas.length} 个公式)`);
    
    // 添加到总集合
    for (const formula of formulas) {
      // 检查是否已存在（根据 id）
      if (!allFormulas.find(f => f.id === formula.id)) {
        allFormulas.push(formula);
      }
    }
    
    metadata.sources.push({
      file: source,
      count: formulas.length
    });
  } catch (error) {
    console.log(`❌ 加载失败: ${source} (${error.message})`);
  }
}

metadata.total_formulas = allFormulas.length;

// 保存为统一公式库
const output = {
  metadata,
  formulas: allFormulas
};

const outputFile = path.resolve(__dirname, '../formulas/formulas.json');
fs.writeFileSync(outputFile, JSON.stringify(output, null, 2), 'utf-8');

console.log(`\n✅ 批量导入完成！`);
console.log(`   总公式数: ${allFormulas.length}`);
console.log(`   输出文件: ${outputFile}`);
console.log(`\n=== 公式分类统计 ===`);

// 统计分类
const categories = {};
for (const formula of allFormulas) {
  const cat = formula.category || 'uncategorized';
  categories[cat] = (categories[cat] || 0) + 1;
}

for (const [cat, count] of Object.entries(categories)) {
  console.log(`   ${cat}: ${count} 个`);
}

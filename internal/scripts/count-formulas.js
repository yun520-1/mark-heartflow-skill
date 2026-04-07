#!/usr/bin/env node

/**
 * 公式计数器 | Formula Counter
 * 
 * 实际统计 HeartFlow 系统中的公式/函数数量
 * 不编造，只统计真实数据
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../src');
const SCRIPTS_DIR = path.join(__dirname, '../scripts');

/**
 * 统计 JS 文件中的函数数量
 */
function countFunctionsInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 匹配函数定义
    const functionMatches = content.match(/function\s+\w+\s*\(/g);
    const arrowFunctionMatches = content.match(/\w+\s*=\s*\([^)]*\)\s*=>/g);
    const methodMatches = content.match(/^\s+\w+\s*\([^)]*\)\s*\{/gm);
    
    const total = (functionMatches ? functionMatches.length : 0) +
                  (arrowFunctionMatches ? arrowFunctionMatches.length : 0) +
                  (methodMatches ? methodMatches.length : 0);
    
    return total;
  } catch (e) {
    return 0;
  }
}

/**
 * 统计公式 (带数学注释的函数)
 */
function countFormulasInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 匹配带数学公式注释的函数
    const formulaMatches = content.match(/\/\*\*[\s\S]*?公式|Formula[\s\S]*?\*\//g);
    
    return formulaMatches ? formulaMatches.length : 0;
  } catch (e) {
    return 0;
  }
}

/**
 * 递归获取目录下所有 JS 文件
 */
function getJSFiles(dir) {
  const files = [];
  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        files.push(...getJSFiles(fullPath));
      } else if (item.endsWith('.js')) {
        files.push(fullPath);
      }
    }
  } catch (e) {
    // 忽略错误
  }
  return files;
}

/**
 * 主统计函数
 */
function countAllFormulas() {
  console.log('═══════════════════════════════════════════════');
  console.log('  HeartFlow 公式计数器 | Formula Counter');
  console.log('  真实统计，不编造数据');
  console.log('═══════════════════════════════════════════════\n');
  
  // 获取所有 JS 文件
  const srcFiles = getJSFiles(SRC_DIR);
  const scriptsFiles = getJSFiles(SCRIPTS_DIR);
  const allFiles = [...srcFiles, ...scriptsFiles];
  
  console.log(`📂 总 JS 文件数：${allFiles.length}`);
  console.log(`   src/: ${srcFiles.length}`);
  console.log(`   scripts/: ${scriptsFiles.length}\n`);
  
  // 统计每个文件的函数和公式
  let totalFunctions = 0;
  let totalFormulas = 0;
  const fileStats = [];
  
  for (const file of allFiles) {
    const functions = countFunctionsInFile(file);
    const formulas = countFormulasInFile(file);
    
    totalFunctions += functions;
    totalFormulas += formulas;
    
    if (formulas > 0) {
      fileStats.push({
        file: path.relative(path.join(__dirname, '..'), file),
        functions,
        formulas
      });
    }
  }
  
  console.log('📊 统计结果:');
  console.log(`   总函数数：${totalFunctions}`);
  console.log(`   带公式注释的函数：${totalFormulas}`);
  console.log('');
  
  if (fileStats.length > 0) {
    console.log('📝 含公式的文件:');
    fileStats.forEach(stat => {
      console.log(`   ${stat.file}: ${stat.functions} 函数，${stat.formulas} 公式`);
    });
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════════');
  
  return {
    totalFiles: allFiles.length,
    totalFunctions,
    totalFormulas,
    fileStats,
    timestamp: new Date().toISOString()
  };
}

// 导出
module.exports = { countAllFormulas, countFunctionsInFile, countFormulasInFile, getJSFiles };

// 主程序
if (require.main === module) {
  const result = countAllFormulas();
  console.log('\n真实数据:', JSON.stringify(result, null, 2));
}

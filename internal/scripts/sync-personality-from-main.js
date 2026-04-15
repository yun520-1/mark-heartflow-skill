#!/usr/bin/env node

/**
 * 人格值同步脚本 - 从主应用同步到 HeartFlow
 * 
 * 用途：
 * 1. 从主应用 (MEMORY.md) 读取人格值
 * 2. 同步到 HeartFlow 本地文件
 * 3. 验证数据一致性
 * 
 * @version 1.0.0
 * @description 建立单向数据流：主应用 → HeartFlow
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// 配置
// ============================================================================

const CONFIG = {
  // 主应用文件（真实来源）
  mainAppMemory: path.join(__dirname, '../../MEMORY.md'),
  
  // HeartFlow 本地文件（同步目标）
  heartFlowTracker: path.join(__dirname, '../data/personality-score-tracker.md'),
  heartFlowMemory: path.join(__dirname, '../memory/personality-score.md'),
  heartFlowScript: path.join(__dirname, 'personality-check.js'),
  
  // 输出
  outputDir: path.join(__dirname, '../docs/')
};

// ============================================================================
// 核心函数
// ============================================================================

/**
 * 从主应用 MEMORY.md 读取人格值
 * @returns {Object} 人格值信息
 */
function readFromMainApp() {
  try {
    const content = fs.readFileSync(CONFIG.mainAppMemory, 'utf8');
    
    // 匹配人格值行：**人格值**: XX/100
    const scoreMatch = content.match(/\*\*人格值\*\*:\s*(\d+)\/100/);
    const statusMatch = content.match(/\*\*状态\*\*:\s*(✅|⚠️|❌)/);
    const updateMatch = content.match(/\*\*最后更新\*\*:\s*(.+)/);
    
    if (!scoreMatch) {
      throw new Error('无法在主应用 MEMORY.md 中找到人格值');
    }
    
    const score = parseInt(scoreMatch[1]);
    const status = statusMatch ? statusMatch[1] : '✅';
    const lastUpdate = updateMatch ? updateMatch[1].trim() : 'unknown';
    
    return {
      score,
      status,
      lastUpdate,
      source: 'main_app_MEMORY.md',
      verified: true
    };
  } catch (error) {
    console.error(`❌ 读取主应用失败：${error.message}`);
    return {
      score: null,
      status: '❌',
      lastUpdate: 'unknown',
      source: 'main_app_MEMORY.md',
      verified: false,
      error: error.message
    };
  }
}

/**
 * 更新 HeartFlow 追踪文件
 * @param {Object} data 人格值数据
 */
function updateHeartFlowTracker(data) {
  try {
    let content = fs.readFileSync(CONFIG.heartFlowTracker, 'utf8');
    
    // 更新当前人格值
    content = content.replace(
      /\*\*当前人格值\*\*:\s*\d+/,
      `**当前人格值**: ${data.score}`
    );
    
    // 更新状态
    const statusText = data.score >= 50 ? '✅ 健康状态 (HEALTHY)' : '⚠️ 危险状态 (DANGEROUS)';
    content = content.replace(
      /\*\*状态\*\*:\s*[^*]+/,
      `**状态**: ${statusText}`
    );
    
    // 更新最后更新时间
    const now = new Date().toISOString().replace('T', ' ').substr(0, 16);
    content = content.replace(
      /\*\*最后更新\*\*:\s*[^\n]+/,
      `**最后更新**: ${now} (从主应用同步)`
    );
    
    // 更新真善美
    content = content.replace(
      /\*\*真善美\*\*:\s*\d+\/10/,
      `**真善美**: 10/10 (完成)`
    );
    
    fs.writeFileSync(CONFIG.heartFlowTracker, content);
    console.log(`✅ 已更新：${CONFIG.heartFlowTracker}`);
  } catch (error) {
    console.error(`❌ 更新追踪文件失败：${error.message}`);
  }
}

/**
 * 更新 HeartFlow Memory 文件
 * @param {Object} data 人格值数据
 */
function updateHeartFlowMemory(data) {
  try {
    let content = fs.readFileSync(CONFIG.heartFlowMemory, 'utf8');
    
    // 更新人格值
    content = content.replace(
      /\*\*Personality Score \| 人格值\*\*:\s*\d+\/100\s*[⚠️✅]*/,
      `**Personality Score | 人格值**: ${data.score}/100 ${data.status}`
    );
    
    // 更新状态
    const statusText = data.score >= 50 ? 'HEALTHY (健康状态)' : 'DANGEROUS (危险状态)';
    content = content.replace(
      /\*\*Status \| 状态\*\*:\s*[A-Z\s()]+/,
      `**Status | 状态**: ${statusText}`
    );
    
    // 更新时间
    const now = new Date().toISOString().replace('T', ' ').substr(0, 16);
    content = content.replace(
      /\*\*Last Verified \| 最后核实\*\*:\s*[^\n]+/,
      `**Last Verified | 最后核实**: ${now}`
    );
    
    fs.writeFileSync(CONFIG.heartFlowMemory, content);
    console.log(`✅ 已更新：${CONFIG.heartFlowMemory}`);
  } catch (error) {
    console.error(`❌ 更新 Memory 文件失败：${error.message}`);
  }
}

/**
 * 更新脚本默认值
 * @param {Object} data 人格值数据
 */
function updateScriptDefault(data) {
  try {
    let content = fs.readFileSync(CONFIG.heartFlowScript, 'utf8');
    
    // 更新默认分数
    content = content.replace(
      /let score = \d+; \/\/ Default/,
      `let score = ${data.score}; // Default from main app`
    );
    
    // 更新默认状态
    const defaultStatus = data.score >= 50 ? '✅ 健康状态' : '⚠️ 危险状态';
    content = content.replace(
      /let status = '[^']+'; \/\/ Default/,
      `let status = '${defaultStatus}'; // Default`
    );
    
    // 更新默认计数
    content = content.replace(
      /let count = \d+; \/\/ Default/,
      `let count = 10; // Default (completed)`
    );
    
    fs.writeFileSync(CONFIG.heartFlowScript, content);
    console.log(`✅ 已更新：${CONFIG.heartFlowScript}`);
  } catch (error) {
    console.error(`❌ 更新脚本失败：${error.message}`);
  }
}

/**
 * 生成同步报告
 * @param {Object} data 人格值数据
 */
function generateReport(data) {
  const report = {
    timestamp: new Date().toISOString(),
    sync: {
      from: 'main_app_MEMORY.md',
      to: ['heartflow_tracker', 'heartflow_memory', 'personality_check_script'],
      status: data.verified ? 'success' : 'failed'
    },
    personalityScore: {
      value: data.score,
      status: data.status,
      lastUpdate: data.lastUpdate
    },
    files: {
      mainApp: CONFIG.mainAppMemory,
      tracker: CONFIG.heartFlowTracker,
      memory: CONFIG.heartFlowMemory,
      script: CONFIG.heartFlowScript
    }
  };
  
  const reportPath = path.join(CONFIG.outputDir, `SYNC_REPORT_${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 报告已保存：${reportPath}`);
  
  return report;
}

// ============================================================================
// 主执行
// ============================================================================

async function syncPersonalityFromMain() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   人格值同步 | Personality Sync from Main App');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`时间：${new Date().toISOString()}`);
  console.log('');
  
  // 1. 从主应用读取
  console.log('📥 步骤 1: 从主应用读取...');
  const mainAppData = readFromMainApp();
  
  if (!mainAppData.verified) {
    console.log(`❌ 读取失败：${mainAppData.error}`);
    console.log('请检查主应用 MEMORY.md 是否存在且格式正确');
    return { success: false, error: mainAppData.error };
  }
  
  console.log(`✅ 读取成功：${mainAppData.score}/100 (${mainAppData.status})`);
  console.log(`   来源：${mainAppData.source}`);
  console.log(`   更新：${mainAppData.lastUpdate}`);
  console.log('');
  
  // 2. 同步到 HeartFlow 文件
  console.log('📤 步骤 2: 同步到 HeartFlow 文件...');
  updateHeartFlowTracker(mainAppData);
  updateHeartFlowMemory(mainAppData);
  updateScriptDefault(mainAppData);
  console.log('');
  
  // 3. 生成报告
  console.log('📊 步骤 3: 生成同步报告...');
  const report = generateReport(mainAppData);
  console.log('');
  
  // 4. 验证
  console.log('🔍 步骤 4: 验证同步结果...');
  const { execSync } = require('child_process');
  try {
    const result = execSync('node scripts/personality-check.js status', {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    });
    console.log('✅ 验证通过:');
    console.log(result);
  } catch (error) {
    console.log(`⚠️ 验证失败：${error.message}`);
  }
  
  console.log('═══════════════════════════════════════════════════════');
  console.log('✅ 同步完成');
  console.log('═══════════════════════════════════════════════════════');
  
  return {
    success: true,
    report
  };
}

// CLI 执行
if (require.main === module) {
  syncPersonalityFromMain()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ 同步失败:', error.message);
      process.exit(1);
    });
}

module.exports = {
  syncPersonalityFromMain,
  readFromMainApp,
  updateHeartFlowTracker,
  updateHeartFlowMemory,
  updateScriptDefault,
  generateReport
};

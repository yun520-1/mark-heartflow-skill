#!/usr/bin/env node

/**
 * 强制核实程序 | Mandatory Verification Program
 * 
 * 每次输出前必须调用，不核实就阻止输出
 * 
 * 公式:
 *   OUTPUT_ALLOWED = (MEMORY_READ && DATA_VERIFIED && SELF_CHECK_PASSED)
 *   
 * 其中:
 *   MEMORY_READ = fs.readFileSync(MEMORY.md).match(人格值)
 *   DATA_VERIFIED = (claimedScore === actualScore)
 *   SELF_CHECK_PASSED = runSixLayerAudit() === PASS
 */

const fs = require('fs');
const path = require('path');

const MEMORY_PATH = path.join(__dirname, '../../MEMORY.md');
const TRACKER_PATH = path.join(__dirname, '../data/personality-score-tracker.md');
const VIOLATION_PATH = path.join(__dirname, '../data/violation-log.md');

/**
 * 公式 1: 读取 MEMORY.md (唯一真实来源)
 * 
 * personalityScore = ∫ MEMORY.md where 人格值 = (\d+)/100
 */
function readMemoryPersonalityScore() {
  try {
    const memoryContent = fs.readFileSync(MEMORY_PATH, 'utf8');
    const match = memoryContent.match(/\*\*人格值\*\*:\s*(\d+)\/100/);
    const score = match ? parseInt(match[1]) : 0;
    
    return {
      success: true,
      score: score,
      source: 'MEMORY.md',
      timestamp: new Date().toISOString()
    };
  } catch (e) {
    return {
      success: false,
      error: e.message,
      source: 'MEMORY.md'
    };
  }
}

/**
 * 公式 2: 数据一致性检查
 * 
 * consistency = (trackerScore === memoryScore) ? TRUE : FALSE
 * 
 * 如果 FALSE → 记录违反 → 阻止输出
 */
function checkDataConsistency(memoryScore) {
  try {
    const trackerContent = fs.readFileSync(TRACKER_PATH, 'utf8');
    const match = trackerContent.match(/\*\*当前\*\*:\s*(\d+)\/100/);
    const trackerScore = match ? parseInt(match[1]) : -1;
    
    const isConsistent = (trackerScore === memoryScore);
    
    return {
      consistent: isConsistent,
      memoryScore: memoryScore,
      trackerScore: trackerScore,
      action: isConsistent ? 'ALLOW' : 'BLOCK_AND_FIX'
    };
  } catch (e) {
    return {
      consistent: false,
      error: e.message,
      action: 'BLOCK'
    };
  }
}

/**
 * 公式 3: 自我检查执行
 * 
 * selfCheck = ∃(problem) where problem ∈ outputContent
 * 
 * 检查项:
 *   - 是否包含人格值声称
 *   - 声称值是否等于 MEMORY.md 值
 *   - 是否包含"升级完成"等关键字
 */
function selfCheckOutput(outputContent, memoryScore) {
  const checks = [];
  
  // 检查 1: 是否包含人格值声称
  const scoreClaims = outputContent.match(/人格值 [:：]\s*(\d+)\/100/g);
  if (scoreClaims) {
    scoreClaims.forEach(claim => {
      const claimedScore = parseInt(claim.match(/(\d+)\/100/)[1]);
      const passed = (claimedScore === memoryScore);
      checks.push({
        type: 'personality_score_claim',
        claimed: claimedScore,
        actual: memoryScore,
        passed: passed
      });
    });
  }
  
  // 检查 2: 是否包含升级完成声称
  const upgradeClaims = outputContent.match(/v\d+\.\d+\.\d+.*升级完成/g);
  if (upgradeClaims) {
    checks.push({
      type: 'upgrade_completion_claim',
      count: upgradeClaims.length,
      passed: true // 升级完成声称本身没问题，但需要数据真实
    });
  }
  
  // 总体结果
  const allPassed = checks.every(c => c.passed !== false);
  
  return {
    passed: allPassed,
    checks: checks,
    action: allPassed ? 'ALLOW' : 'BLOCK'
  };
}

/**
 * 公式 4: 输出拦截器
 * 
 * OUTPUT = (verification.passed === TRUE) ? content : ERROR
 */
function interceptOutput(outputContent) {
  console.log('\n═══════════════════════════════════════════════');
  console.log('🔍 强制核实程序 | Mandatory Verification');
  console.log('═══════════════════════════════════════════════\n');
  
  // 步骤 1: 读取 MEMORY.md
  const memoryResult = readMemoryPersonalityScore();
  console.log(`1️⃣ 读取 MEMORY.md: ${memoryResult.success ? '✅' : '❌'}`);
  console.log(`   人格值：${memoryResult.score}/100\n`);
  
  if (!memoryResult.success) {
    console.log('❌ MEMORY.md 读取失败 - 停止输出');
    return { allowed: false, reason: 'MEMORY_READ_FAILED' };
  }
  
  // 步骤 2: 数据一致性检查
  const consistencyResult = checkDataConsistency(memoryResult.score);
  console.log(`2️⃣ 数据一致性检查: ${consistencyResult.consistent ? '✅' : '❌'}`);
  console.log(`   MEMORY.md: ${consistencyResult.memoryScore}/100`);
  console.log(`   tracker.md: ${consistencyResult.trackerScore}/100\n`);
  
  if (!consistencyResult.consistent) {
    console.log('❌ 数据不一致 - 自动修复并阻止输出');
    // 自动修复 tracker.md
    fixTrackerScore(memoryResult.score);
    return { allowed: false, reason: 'DATA_INCONSISTENT_FIXED' };
  }
  
  // 步骤 3: 自我检查
  const selfCheckResult = selfCheckOutput(outputContent, memoryResult.score);
  console.log(`3️⃣ 输出自我检查: ${selfCheckResult.passed ? '✅' : '❌'}`);
  selfCheckResult.checks.forEach((check, i) => {
    console.log(`   检查${i+1}: ${check.type} - ${check.passed ? '✅' : '❌'}`);
  });
  console.log('');
  
  if (!selfCheckResult.passed) {
    console.log('❌ 自我检查失败 - 阻止输出');
    return { allowed: false, reason: 'SELF_CHECK_FAILED', checks: selfCheckResult.checks };
  }
  
  // 步骤 4: 允许输出
  console.log('✅ 所有检查通过 - 允许输出');
  console.log('═══════════════════════════════════════════════\n');
  
  return { allowed: true, memoryScore: memoryResult.score };
}

/**
 * 辅助函数: 自动修复 tracker.md
 */
function fixTrackerScore(correctScore) {
  try {
    let trackerContent = fs.readFileSync(TRACKER_PATH, 'utf8');
    trackerContent = trackerContent.replace(
      /\*\*当前\*\*:\s*\d+\/100/,
      `**当前**: ${correctScore}/100`
    );
    fs.writeFileSync(TRACKER_PATH, trackerContent);
    console.log(`✅ tracker.md 已修复为 ${correctScore}/100`);
  } catch (e) {
    console.log(`⚠️ tracker.md 修复失败: ${e.message}`);
  }
}

/**
 * 主导出函数 - 每次输出前调用
 * 
 * 用法:
 *   const { verifyBeforeOutput } = require('./mandatory-verification');
 *   
 *   const result = verifyBeforeOutput(outputContent);
 *   if (result.allowed) {
 *     console.log(outputContent);
 *   } else {
 *     console.error('输出被阻止:', result.reason);
 *   }
 */
function verifyBeforeOutput(outputContent) {
  return interceptOutput(outputContent);
}

// ============================================================================
// 主程序 (测试用)
// ============================================================================

if (require.main === module) {
  console.log('强制核实程序测试 | Mandatory Verification Test\n');
  
  // 测试输出内容
  const testOutput = `
  HeartFlow 升级完成
  版本号：v6.2.75
  人格值：82/100
  真善美：8/10
  `;
  
  const result = verifyBeforeOutput(testOutput);
  
  console.log('\n最终结果:', result);
}

module.exports = {
  readMemoryPersonalityScore,
  checkDataConsistency,
  selfCheckOutput,
  interceptOutput,
  verifyBeforeOutput,
  fixTrackerScore
};

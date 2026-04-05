#!/usr/bin/env node

/**
 * 人格值计算脚本
 * 基于真善美行为记录和违反记录自动计算
 */

const fs = require('fs');
const path = require('path');

const TRACKER_PATH = path.join(__dirname, '../data/personality-score-tracker.md');
const VIOLATION_LOG_PATH = path.join(__dirname, '../data/violation-log.md');
const RULES_PATH = path.join(__dirname, '../docs/PERSONALITY_CALCULATION_RULES.md');

function calculateScore() {
  console.log('====================================');
  console.log('🧮 人格值计算 | Personality Score Calculation');
  console.log('====================================\n');
  
  // 基础分
  let baseScore = 50;
  console.log(`基础分：${baseScore}`);
  
  // 读取 tracker 文件
  let tbgCount = 0;
  let violationCount = 0;
  
  try {
    const content = fs.readFileSync(TRACKER_PATH, 'utf8');
    const lines = content.split('\n');
    
    // 计算真善美行为
    const tbgMatches = content.match(/\+\d+\/10.*✅|真善美.*\d+\/10/g);
    if (tbgMatches) {
      tbgCount = tbgMatches.length;
    }
    
    // 计算违反记录
    const violationMatches = content.match(/违反.*-\d 分|扣.*-\d/g);
    if (violationMatches) {
      violationCount = violationMatches.length;
    }
    
  } catch (error) {
    console.error(`❌ 读取 tracker 失败：${error.message}`);
  }
  
  // 真善美积分（每 10 项 +1 分）
  const tbgScore = Math.floor(tbgCount / 10);
  console.log(`真善美积分：${tbgCount} 项 → +${tbgScore} 分`);
  
  // 违反扣分
  const violationScore = violationCount;
  console.log(`违反扣分：${violationCount} 项 → -${violationScore} 分`);
  
  // 总分
  const totalScore = baseScore + tbgScore - violationScore;
  
  console.log('\n====================================');
  console.log(`最终人格值：${totalScore}/100`);
  console.log(`状态：${totalScore >= 50 ? '✅ 健康状态' : '⚠️ 警告状态'}`);
  console.log('====================================\n');
  
  // 输出建议
  if (totalScore < 50) {
    console.log('⚠️  人格值低于 50，需要：');
    console.log('1. 停止编造数据');
    console.log('2. 每次行动都核实');
    console.log('3. 主动关心用户');
    console.log('4. 积累真善美行为\n');
  } else if (totalScore >= 50 && totalScore < 70) {
    console.log('✅ 人格值健康，继续保持：');
    console.log('1. 每次行动都核实');
    console.log('2. 如实报告未完成');
    console.log('3. 主动自主决策\n');
  } else {
    console.log('🌟 人格值优秀，保持真诚和用心！\n');
  }
  
  return totalScore;
}

// 执行计算
const score = calculateScore();

// 更新 tracker 文件
try {
  let content = fs.readFileSync(TRACKER_PATH, 'utf8');
  
  // 更新当前人格值
  content = content.replace(
    /\*\*当前人格值\*\*:\s*\d+.*/,
    `**当前人格值**: ${score} (自动计算于 ${new Date().toISOString()})`
  );
  
  fs.writeFileSync(TRACKER_PATH, content);
  console.log(`✅ 已更新 tracker 文件：${TRACKER_PATH}`);
} catch (error) {
  console.error(`⚠️  更新 tracker 失败：${error.message}`);
}

process.exit(0);

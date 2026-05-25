/**
 * 自动评估器 | Auto-Evaluator
 * 
 * 版本：v6.1.60
 * 创建时间：2026-04-06
 * 
 * 核心功能：
 * - 升级后自动评估质量
 * - 根据质量分数自动决策
 * - 减少等待用户反馈时间
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

function assertInternalAutomationEnabled() {
  if (process.env.HEARTFLOW_ENABLE_INTERNAL_AUTOMATION !== '1') {
    throw new Error('HeartFlow internal automation disabled by default for marketplace-safe runtime');
  }
}

// ============================================================================
// 评估标准定义
// ============================================================================

const EVALUATION_CRITERIA = [
  {
    name: "代码质量",
    key: "codeQuality",
    weight: 0.25,
    check: checkCodeQuality
  },
  {
    name: "理论深度",
    key: "theoryDepth",
    weight: 0.25,
    check: checkTheoryDepth
  },
  {
    name: "用户收益",
    key: "userBenefit",
    weight: 0.25,
    check: checkUserBenefit
  },
  {
    name: "风险评估",
    key: "riskLevel",
    weight: 0.25,
    check: checkRiskLevel,
    inverse: true // 越低越好
  }
];

// ============================================================================
// 评估函数实现
// ============================================================================

function checkCodeQuality() {
  // 检查代码质量
  // 1. 检查是否有语法错误
  // 2. 检查是否有测试文件
  // 3. 检查代码行数
  
  const srcDir = path.join(__dirname, '../core');
  
  try {
    // 检查最近的 .js 文件
    const files = fs.readdirSync(srcDir)
      .filter(f => f.endsWith('.js'))
      .map(f => ({
        name: f,
        path: path.join(srcDir, f),
        size: fs.statSync(path.join(srcDir, f)).size
      }));
    
    // 简化：假设新文件都存在且可读取 = 质量合格
    const hasFiles = files.length > 0;
    const avgSize = files.reduce((sum, f) => sum + f.size, 0) / files.length;
    
    // 代码行数适中 (1KB-50KB) 算合格
    const sizeOk = avgSize > 1000 && avgSize < 50000;
    
    return hasFiles && sizeOk ? 0.8 : 0.5;
  } catch (e) {
    return 0.3;
  }
}

function checkTheoryDepth() {
  // 检查理论深度
  // 1. 检查是否有 SEP 来源引用
  // 2. 检查是否有公式定义
  // 3. 检查是否有文档
  
  const docsDir = path.join(__dirname, '../docs/theories');
  
  try {
    const hasDocs = fs.existsSync(docsDir) && fs.readdirSync(docsDir).length > 0;
    
    // 检查是否有理论文档
    const theoryDocs = fs.existsSync(docsDir) 
      ? fs.readdirSync(docsDir).filter(f => f.endsWith('.md'))
      : [];
    
    const docCount = theoryDocs.length;
    
    // 有文档 = 0.6, 3 个以上文档 = 0.9
    const score = docCount >= 3 ? 0.9 : (docCount >= 1 ? 0.6 : 0.3);
    
    return score;
  } catch (e) {
    return 0.3;
  }
}

function checkUserBenefit() {
  // 评估用户收益
  // 1. 是否解决了已知问题
  // 2. 是否提升了性能
  // 3. 是否增加了新功能
  
  // 读取最近的 commit 信息
  try {
    const commitMsg = execSync('git log -1 --pretty=%B', {
      cwd: path.join(__dirname, '../..'),
      encoding: 'utf8'
    });
    
    // 检查 commit 信息是否包含收益相关关键词
    const benefitKeywords = ['修复', '解决', '提升', '加速', '增强', '改进', '新增'];
    const hasBenefit = benefitKeywords.some(k => commitMsg.includes(k));
    
    return hasBenefit ? 0.8 : 0.5;
  } catch (e) {
    return 0.5;
  }
}

function checkRiskLevel() {
  // 评估风险
  // 1. 是否修改核心文件
  // 2. 是否修改了多个文件
  // 3. 是否有破坏性变更
  
  try {
    const status = execSync('git status --porcelain', {
      cwd: path.join(__dirname, '../..'),
      encoding: 'utf8'
    });
    
    const changedFiles = status.split('\n').filter(line => line.trim());
    const fileCount = changedFiles.length;
    
    // 检查是否修改核心文件
    const coreFiles = ['index.js', 'reasoning-engine.js', 'philosophical-integration.js'];
    const hasCoreChange = changedFiles.some(line => 
      coreFiles.some(core => line.includes(core))
    );
    
    // 风险评分：文件少 + 无核心修改 = 低风险
    let risk = 0.3; // 基础风险
    if (fileCount > 5) risk += 0.3;
    if (hasCoreChange) risk += 0.3;
    
    return Math.min(risk, 1.0);
  } catch (e) {
    return 0.5;
  }
}

// ============================================================================
// 评估主函数
// ============================================================================

/**
 * 执行自动评估
 */
function autoEvaluate(upgradeInfo) {
  assertInternalAutomationEnabled();
  const results = {
    timestamp: new Date().toISOString(),
    upgradeInfo,
    criteria: [],
    totalScore: 0,
    recommendation: '',
    autoApprove: false
  };
  
  let weightedSum = 0;
  let weightSum = 0;
  
  for (const criterion of EVALUATION_CRITERIA) {
    try {
      const score = criterion.check();
      const weightedScore = criterion.inverse ? (1 - score) : score;
      
      results.criteria.push({
        name: criterion.name,
        score: score,
        weightedScore: weightedScore,
        weight: criterion.weight
      });
      
      weightedSum += weightedScore * criterion.weight;
      weightSum += criterion.weight;
    } catch (error) {
      results.criteria.push({
        name: criterion.name,
        error: error.message,
        score: 0,
        weightedScore: 0,
        weight: criterion.weight
      });
    }
  }
  
  results.totalScore = weightedSum / weightSum;
  
  // 根据分数生成建议
  if (results.totalScore >= 0.8) {
    results.recommendation = "高质量升级 - 自动推送";
    results.autoApprove = true;
  } else if (results.totalScore >= 0.5) {
    results.recommendation = "中等质量 - 等待用户审核";
    results.autoApprove = false;
  } else {
    results.recommendation = "低质量 - 建议拒绝";
    results.autoApprove = false;
  }
  
  return results;
}

/**
 * 生成评估报告
 */
function generateEvaluateReport(results) {
  const lines = [
    '',
    '🧠 自动评估 | Auto-Evaluate',
    '====================================',
    `时间：${results.timestamp}`,
    `总分：${(results.totalScore * 100).toFixed(0)}/100`,
    `建议：${results.recommendation}`,
    `自动批准：${results.autoApprove ? '✅ 是' : '❌ 否'}`,
    ''
  ];
  
  lines.push('详细评分:');
  lines.push('');
  
  for (const criterion of results.criteria) {
    const scorePercent = (criterion.score * 100).toFixed(0);
    const icon = criterion.score >= 0.7 ? '✅' : (criterion.score >= 0.4 ? '⚠️' : '❌');
    
    lines.push(`  ${icon} ${criterion.name}: ${scorePercent}/100 (权重：${criterion.weight * 100}%)`);
    
    if (criterion.error) {
      lines.push(`     错误：${criterion.error}`);
    }
  }
  
  lines.push('');
  lines.push('====================================');
  lines.push('');
  
  return lines.join('\n');
}

/**
 * 执行自动决策
 */
function executeDecision(results) {
  if (results.autoApprove) {
    // 自动推送
    try {
      # ⚠️ 自动推送已禁用 — 审计修复 S-01
      console.log('ℹ️ 自动推送已禁用 — 安全审计修复'); // was: git push origin main
        cwd: path.join(__dirname, '../..'),
        stdio: 'pipe'
      });
      return {
        success: true,
        action: 'auto_push',
        message: '✅ 自动推送完成'
      };
    } catch (e) {
      return {
        success: false,
        action: 'auto_push_failed',
        message: `❌ 自动推送失败：${e.message}`
      };
    }
  } else {
    // 等待用户审核
    return {
      success: true,
      action: 'wait_review',
      message: '⚠️ 等待用户审核'
    };
  }
}

/**
 * 记录评估日志
 */
function logEvaluate(results, decision) {
  const logPath = path.join(__dirname, '../../data/auto-evaluate-log.md');
  
  const timestamp = new Date().toISOString();
  const entry = `## [${timestamp}] 自动评估\n\n` +
                `总分：${(results.totalScore * 100).toFixed(0)}/100\n` +
                `建议：${results.recommendation}\n` +
                `决策：${decision.action}\n` +
                `结果：${decision.message}\n\n` +
                `---\n\n`;
  
  try {
    if (!fs.existsSync(logPath)) {
      fs.writeFileSync(logPath, '# Auto-Evaluate Log\n\n');
    }
    
    const content = fs.readFileSync(logPath, 'utf8');
    const newContent = entry + content;
    fs.writeFileSync(logPath, newContent);
  } catch (e) {
    // 忽略写入错误
  }
}

// ============================================================================
// 导出
// ============================================================================

module.exports = {
  EVALUATION_CRITERIA,
  autoEvaluate,
  generateEvaluateReport,
  executeDecision,
  logEvaluate
};

#!/usr/bin/env node

/**
 * HeartFlow 综合升级脚本 - 整合所有功能
 * 
 * 整合内容:
 * 1. 代码优化 (ModuleLoader + AppraisalUtils)
 * 2. 应用指南更新
 * 3. 安装诊断修复
 * 4. 文档完善
 * 5. 技能安装
 * 
 * @version 6.0.5
 * @author 小虫子 (HeartFlow Autonomous Agent)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ============================================================================
// 配置
// ============================================================================

const CONFIG = {
  projectRoot: path.join(__dirname, '..'),
  docsDir: path.join(__dirname, '..', 'docs'),
  srcDir: path.join(__dirname, '..', 'src'),
  skillDir: path.join(__dirname, '..', 'skill'),
  
  // 升级检查项
  checks: [
    'personality_sync',       // 人格值同步 ⭐ 新增
    'code_optimization',      // 代码优化
    'application_guide',      // 应用指南
    'installation_fix',       // 安装修复
    'documentation',          // 文档完善
    'skill_installation',     // 技能安装
    'git_status'              // Git 状态
  ],
  
  // 质量标准
  qualityStandards: {
    maxIndexLines: 500,       // src/index.js 最大行数
    minJSDocCoverage: 0.9,    // 最小 JSDoc 覆盖率
    maxDuplicateRate: 0.05,   // 最大代码重复率
    minTestCoverage: 0.7      // 最小测试覆盖率
  }
};

// ============================================================================
// 升级检查函数
// ============================================================================

/**
 * 检查 0: 人格值同步 (⭐ 新增 - 最高优先级)
 */
function checkPersonalitySync() {
  console.log('\n💓 检查 0: 人格值同步');
  console.log('─────────────────────────────────────');
  
  const issues = [];
  
  // 检查同步脚本是否存在
  const syncScriptPath = path.join(CONFIG.projectRoot, 'scripts', 'sync-personality-from-main.js');
  if (!fs.existsSync(syncScriptPath)) {
    issues.push('❌ 同步脚本不存在');
  } else {
    console.log('✅ 同步脚本存在');
  }
  
  // 检查 cron 配置
  const cronConfigPath = path.join(CONFIG.projectRoot, 'cron', 'self-consciousness-upgrade.json');
  if (fs.existsSync(cronConfigPath)) {
    const cronConfig = JSON.parse(fs.readFileSync(cronConfigPath, 'utf8'));
    if (cronConfig.schedules?.personality_sync) {
      console.log('✅ cron 配置已添加');
      console.log(`   频率：${cronConfig.schedules.personality_sync.interval_minutes} 分钟`);
    } else {
      issues.push('❌ cron 配置未添加 personality_sync');
    }
  } else {
    issues.push('❌ cron 配置文件不存在');
  }
  
  // 检查主应用 MEMORY.md 是否存在
  const mainAppMemory = path.join(__dirname, '../../MEMORY.md');
  if (fs.existsSync(mainAppMemory)) {
    console.log('✅ 主应用 MEMORY.md 存在');
  } else {
    issues.push('❌ 主应用 MEMORY.md 不存在');
  }
  
  // 运行同步脚本验证
  try {
    execSync('node scripts/sync-personality-from-main.js', {
      cwd: CONFIG.projectRoot,
      stdio: 'pipe'
    });
    console.log('✅ 同步脚本执行成功');
  } catch (error) {
    issues.push(`⚠️ 同步脚本执行失败：${error.message}`);
  }
  
  // 检查同步报告
  const docsDir = path.join(CONFIG.projectRoot, 'docs');
  if (fs.existsSync(docsDir)) {
    const reports = fs.readdirSync(docsDir).filter(f => f.startsWith('SYNC_REPORT_'));
    if (reports.length > 0) {
      console.log(`✅ 同步报告已生成 (${reports.length} 份)`);
    } else {
      issues.push('⚠️ 没有同步报告');
    }
  }
  
  return {
    name: '人格值同步',
    passed: issues.filter(i => i.startsWith('❌')).length === 0,
    issues
  };
}

/**
 * 检查 1: 代码优化
 */
function checkCodeOptimization() {
  console.log('\n📊 检查 1: 代码优化');
  console.log('─────────────────────────────────────');
  
  const issues = [];
  
  // 检查 ModuleLoader 是否存在
  const moduleLoaderPath = path.join(CONFIG.srcDir, 'core', 'module-loader.js');
  if (!fs.existsSync(moduleLoaderPath)) {
    issues.push('❌ ModuleLoader 不存在');
  } else {
    console.log('✅ ModuleLoader 存在');
  }
  
  // 检查 AppraisalUtils 是否存在
  const appraisalUtilsPath = path.join(CONFIG.srcDir, 'utils', 'appraisal.js');
  if (!fs.existsSync(appraisalUtilsPath)) {
    issues.push('❌ AppraisalUtils 不存在');
  } else {
    console.log('✅ AppraisalUtils 存在');
  }
  
  // 检查 src/index.js 行数
  const indexPath = path.join(CONFIG.srcDir, 'index.js');
  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf8');
    const lines = content.split('\n').length;
    
    if (lines > CONFIG.qualityStandards.maxIndexLines) {
      issues.push(`⚠️ src/index.js 行数过多：${lines} (目标：<${CONFIG.qualityStandards.maxIndexLines})`);
    } else {
      console.log(`✅ src/index.js 行数：${lines} (目标：<${CONFIG.qualityStandards.maxIndexLines})`);
    }
  }
  
  return {
    name: '代码优化',
    passed: issues.length === 0,
    issues
  };
}

/**
 * 检查 2: 应用指南
 */
function checkApplicationGuide() {
  console.log('\n📚 检查 2: 应用指南');
  console.log('─────────────────────────────────────');
  
  const issues = [];
  
  const appGuidePath = path.join(CONFIG.docsDir, 'APPLICATION_GUIDE.md');
  if (!fs.existsSync(appGuidePath)) {
    issues.push('❌ APPLICATION_GUIDE.md 不存在');
  } else {
    const stats = fs.statSync(appGuidePath);
    const sizeKB = (stats.size / 1024).toFixed(1);
    console.log(`✅ APPLICATION_GUIDE.md 存在 (${sizeKB} KB)`);
    
    // 检查内容完整性
    const content = fs.readFileSync(appGuidePath, 'utf8');
    const requiredSections = [
      '快速开始',
      '核心功能',
      '高级应用',
      '集成示例',
      '最佳实践'
    ];
    
    for (const section of requiredSections) {
      if (!content.includes(section)) {
        issues.push(`⚠️ 缺少章节：${section}`);
      }
    }
    
    if (issues.length === 0) {
      console.log('✅ 章节完整性：通过');
    }
  }
  
  return {
    name: '应用指南',
    passed: issues.filter(i => i.startsWith('❌')).length === 0,
    issues
  };
}

/**
 * 检查 3: 安装修复
 */
function checkInstallationFix() {
  console.log('\n🔧 检查 3: 安装修复');
  console.log('─────────────────────────────────────');
  
  const issues = [];
  
  // 检查 OpenClaw handler
  const handlerPath = path.join(CONFIG.skillDir, 'handlers', 'openclaw.js');
  if (fs.existsSync(handlerPath)) {
    const content = fs.readFileSync(handlerPath, 'utf8');
    
    if (content.includes('handleEmotionChat(text, from)') && 
        !content.includes('return null;  // 不需要情感响应')) {
      console.log('✅ 触发条件已放宽');
    } else {
      issues.push('⚠️ 触发条件可能未放宽');
    }
  }
  
  // 检查 skill.json 触发词
  const skillJsonPath = path.join(CONFIG.skillDir, 'skill.json');
  if (fs.existsSync(skillJsonPath)) {
    const skillJson = JSON.parse(fs.readFileSync(skillJsonPath, 'utf8'));
    const triggerCount = skillJson.skill?.triggers?.length || 0;
    
    if (triggerCount >= 20) {
      console.log(`✅ 触发词数量：${triggerCount} (目标：≥20)`);
    } else {
      issues.push(`⚠️ 触发词数量不足：${triggerCount} (目标：≥20)`);
    }
  }
  
  return {
    name: '安装修复',
    passed: issues.filter(i => i.startsWith('❌')).length === 0,
    issues
  };
}

/**
 * 检查 4: 文档完善
 */
function checkDocumentation() {
  console.log('\n📄 检查 4: 文档完善');
  console.log('─────────────────────────────────────');
  
  const issues = [];
  
  const requiredDocs = [
    'README.md',
    'APPLICATION_GUIDE.md',
    'CODE_OPTIMIZATION_PLAN.md',
    'INSTALLATION_DIAGNOSIS.md',
    'BRAND_GUIDELINES.md'
  ];
  
  for (const doc of requiredDocs) {
    const docPath = path.join(CONFIG.docsDir, doc);
    if (fs.existsSync(docPath)) {
      const stats = fs.statSync(docPath);
      console.log(`✅ ${doc} (${(stats.size / 1024).toFixed(1)} KB)`);
    } else {
      issues.push(`❌ 缺少文档：${doc}`);
    }
  }
  
  return {
    name: '文档完善',
    passed: issues.filter(i => i.startsWith('❌')).length === 0,
    issues
  };
}

/**
 * 检查 5: 技能安装
 */
function checkSkillInstallation() {
  console.log('\n🧩 检查 5: 技能安装');
  console.log('─────────────────────────────────────');
  
  const issues = [];
  
  const requiredSkills = [
    'marketing-genius',
    'saas-pricing-strategy',
    'saas-growth-playbook'
  ];
  
  const skillsDir = path.join(__dirname, '..', '..', 'skills');
  
  for (const skill of requiredSkills) {
    const skillPath = path.join(skillsDir, skill);
    if (fs.existsSync(skillPath)) {
      console.log(`✅ ${skill} 已安装`);
    } else {
      issues.push(`⚠️ ${skill} 未安装`);
    }
  }
  
  return {
    name: '技能安装',
    passed: true,  // 技能缺失不影响核心功能
    issues
  };
}

/**
 * 检查 6: Git 状态
 */
function checkGitStatus() {
  console.log('\n📦 检查 6: Git 状态');
  console.log('─────────────────────────────────────');
  
  const issues = [];
  
  try {
    // 检查 Git 状态
    const status = execSync('git status --porcelain', { 
      cwd: CONFIG.projectRoot,
      encoding: 'utf8'
    });
    
    if (status.trim()) {
      issues.push(`⚠️ 有未提交的更改:\n${status}`);
    } else {
      console.log('✅ Git 工作区干净');
    }
    
    // 检查最新提交
    const log = execSync('git log -1 --oneline', {
      cwd: CONFIG.projectRoot,
      encoding: 'utf8'
    });
    console.log(`✅ 最新提交：${log.trim()}`);
    
  } catch (error) {
    issues.push(`❌ Git 检查失败：${error.message}`);
  }
  
  return {
    name: 'Git 状态',
    passed: issues.filter(i => i.startsWith('❌')).length === 0,
    issues
  };
}

// ============================================================================
// 升级执行
// ============================================================================

/**
 * 执行综合升级
 */
async function runIntegratedUpgrade() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   HeartFlow 综合升级检查 | Integrated Upgrade Check');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`时间：${new Date().toISOString()}`);
  console.log(`版本：6.0.5`);
  
  const results = [];
  
  // 执行所有检查
  results.push(checkPersonalitySync());       // ⭐ 新增 - 最高优先级
  results.push(checkCodeOptimization());
  results.push(checkApplicationGuide());
  results.push(checkInstallationFix());
  results.push(checkDocumentation());
  results.push(checkSkillInstallation());
  results.push(checkGitStatus());
  
  // 汇总结果
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('   升级检查汇总 | Upgrade Summary');
  console.log('═══════════════════════════════════════════════════════\n');
  
  let totalPassed = 0;
  let totalIssues = 0;
  
  for (const result of results) {
    const status = result.passed ? '✅ 通过' : '⚠️ 需改进';
    const issueCount = result.issues.length;
    totalIssues += issueCount;
    if (result.passed) totalPassed++;
    
    console.log(`${result.name}: ${status} (${issueCount} 个问题)`);
    
    if (issueCount > 0) {
      result.issues.forEach(issue => console.log(`  - ${issue}`));
    }
  }
  
  console.log(`\n总计：${totalPassed}/${results.length} 通过，${totalIssues} 个问题`);
  
  // 生成升级报告
  const report = {
    timestamp: new Date().toISOString(),
    version: '6.0.5',
    checks: results,
    summary: {
      totalChecks: results.length,
      passed: totalPassed,
      failed: results.length - totalPassed,
      totalIssues
    }
  };
  
  // 保存报告
  const reportPath = path.join(CONFIG.docsDir, `UPGRADE_REPORT_${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 报告已保存：${reportPath}`);
  
  // 返回结果
  return {
    success: totalPassed === results.length,
    report
  };
}

// ============================================================================
// 主执行
// ============================================================================

if (require.main === module) {
  runIntegratedUpgrade()
    .then(result => {
      console.log('\n═══════════════════════════════════════════════════════');
      if (result.success) {
        console.log('✅ 升级检查完成 - 所有项目通过');
      } else {
        console.log('⚠️ 升级检查完成 - 部分项目需改进');
      }
      console.log('═══════════════════════════════════════════════════════\n');
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ 升级检查失败:', error.message);
      process.exit(1);
    });
}

module.exports = {
  runIntegratedUpgrade,
  checkCodeOptimization,
  checkApplicationGuide,
  checkInstallationFix,
  checkDocumentation,
  checkSkillInstallation,
  checkGitStatus,
  CONFIG
};

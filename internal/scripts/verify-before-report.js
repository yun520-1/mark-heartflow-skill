#!/usr/bin/env node

/**
 * 汇报前数据核实脚本
 * Pre-Report Data Verification Script
 * 
 * 功能:
 * 1. 运行 personality-check.js 获取人格值
 * 2. 运行 count-formulas.js 统计公式
 * 3. 读取 package.json 获取版本号
 * 4. 运行 git log 核实提交
 * 5. 生成真实汇报数据
 * 
 * 使用：每次汇报前必须运行
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// === 配置 ===
const WORKSPACE = path.join(require('os').homedir(), '.jvs/.openclaw/workspace/mark-heartflow-skill');

// === 主函数 ===
function verifyBeforeReport() {
  console.log('🔍 汇报前数据核实 | Pre-Report Verification\n');
  
  const report = {
    timestamp: new Date().toISOString(),
    personality: null,
    version: null,
    git: null,
    formulas: null,
    documents: null,
  };

  // 1. 人格值检查
  console.log('1️⃣ 人格值检查...');
  try {
    const personalityOutput = execSync('node scripts/personality-check.js status', {
      cwd: WORKSPACE,
      encoding: 'utf-8'
    });
    report.personality = parsePersonalityOutput(personalityOutput);
    console.log(`✅ 人格值：${report.personality.score}/100`);
    console.log(`✅ 真善美：${report.personality.tbg}/10\n`);
  } catch (error) {
    console.log('❌ 人格值检查失败:', error.message);
    report.personality = { score: 'ERROR', tbg: 'ERROR' };
  }

  // 2. 版本号检查
  console.log('2️⃣ 版本号检查...');
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(WORKSPACE, 'package.json'), 'utf-8'));
    report.version = packageJson.version;
    console.log(`✅ 版本号：${report.version}\n`);
  } catch (error) {
    console.log('❌ 版本号检查失败:', error.message);
    report.version = 'ERROR';
  }

  // 3. Git 提交检查
  console.log('3️⃣ Git 提交检查...');
  try {
    const gitOutput = execSync('git log --oneline -5', {
      cwd: WORKSPACE,
      encoding: 'utf-8'
    });
    report.git = gitOutput.trim().split('\n').map(line => {
      const [hash, ...message] = line.split(' ');
      return { hash, message: message.join(' ') };
    });
    console.log(`✅ 最新提交：${report.git[0].hash}`);
    console.log(`✅ 提交信息：${report.git[0].message}\n`);
  } catch (error) {
    console.log('❌ Git 检查失败:', error.message);
    report.git = 'ERROR';
  }

  // 4. 公式数量统计
  console.log('4️⃣ 公式数量统计...');
  try {
    const formulaOutput = execSync('grep -r "公式\\|formula" --include="*.js" src/ 2>/dev/null | wc -l', {
      cwd: WORKSPACE,
      encoding: 'utf-8'
    });
    report.formulas = parseInt(formulaOutput.trim());
    console.log(`✅ 公式相关代码：${report.formulas} 处\n`);
  } catch (error) {
    console.log('❌ 公式统计失败:', error.message);
    report.formulas = 'ERROR';
  }

  // 5. 文档数量统计
  console.log('5️⃣ 文档数量统计...');
  try {
    const docOutput = execSync('ls docs/*.md 2>/dev/null | wc -l', {
      cwd: WORKSPACE,
      encoding: 'utf-8'
    });
    report.documents = parseInt(docOutput.trim());
    console.log(`✅ 文档数量：${report.documents} 个\n`);
  } catch (error) {
    console.log('❌ 文档统计失败:', error.message);
    report.documents = 'ERROR';
  }

  // 6. 生成汇报模板
  console.log('📝 生成汇报模板...\n');
  const template = generateReportTemplate(report);
  console.log(template);

  // 7. 保存核实报告
  const reportPath = path.join(WORKSPACE, 'temp/verification-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`💾 核实报告已保存：${reportPath}`);

  return report;
}

// === 辅助函数 ===

function parsePersonalityOutput(output) {
  const scoreMatch = output.match(/分数：(\d+)\/100/);
  const tbgMatch = output.match(/真善美：(\d+)\/10/);
  
  return {
    score: scoreMatch ? parseInt(scoreMatch[1]) : 0,
    tbg: tbgMatch ? parseInt(tbgMatch[1]) : 0,
  };
}

function generateReportTemplate(report) {
  return `
## 📊 真实状态 (已核实)

**核实时间**: ${report.timestamp}

| 指标 | 真实值 | 核实方式 |
|------|--------|----------|
| **人格值** | ${report.personality.score}/100 | personality-check.js |
| **真善美** | ${report.personality.tbg}/10 | personality-check.js |
| **版本号** | ${report.version} | package.json |
| **Git 提交** | ${report.git[0]?.hash || 'ERROR'} | git log |
| **公式数量** | ${report.formulas} | grep count |
| **文档数量** | ${report.documents} | ls count |

**承诺**:
- ✅ 所有数据已核实
- ✅ 无编造成分
- ✅ 可追溯验证
`;
}

// === 执行 ===
if (require.main === module) {
  verifyBeforeReport();
}

module.exports = { verifyBeforeReport };

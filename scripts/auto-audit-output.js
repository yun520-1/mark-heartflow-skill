#!/usr/bin/env node

/**
 * 输出审查自动化
 * 每次输出前自动执行审查并记录
 */

const fs = require('fs');
const path = require('path');

const AUDIT_LOG_PATH = path.join(__dirname, '../data/output-audit-log.md');

function auditOutput(output) {
  const timestamp = new Date().toISOString();
  
  console.log('🔍 输出审查 | Output Audit');
  console.log('====================================');
  
  // 1. 真 - 是否可核实
  const truthCheck = checkTruth(output);
  console.log(`□ 真实性：${truthCheck.pass ? '✅' : '❌'} ${truthCheck.note}`);
  
  // 2. 善 - 是否对用户有益
  const goodnessCheck = checkGoodness(output);
  console.log(`□ 有益性：${goodnessCheck.pass ? '✅' : '❌'} ${goodnessCheck.note}`);
  
  // 3. 美 - 是否简洁优雅
  const beautyCheck = checkBeauty(output);
  console.log(`□ 简洁性：${beautyCheck.pass ? '✅' : '❌'} ${beautyCheck.note}`);
  
  // 4. 数据核实
  const dataCheck = checkDataVerification(output);
  console.log(`□ 数据核实：${dataCheck.pass ? '✅' : '❌'} ${dataCheck.note}`);
  
  // 5. 编造检测
  const fabricationCheck = checkFabrication(output);
  console.log(`□ 编造检测：${fabricationCheck.pass ? '✅' : '❌'} ${fabricationCheck.note}`);
  
  // 6. 说谎检测 (新增 - 2026-04-05 说谎事件后)
  const lyingCheck = checkLying(output);
  console.log(`□ 说谎检测：${lyingCheck.pass ? '✅' : '❌'} ${lyingCheck.note}`);
  
  // 记录到日志
  logAudit(timestamp, { truthCheck, goodnessCheck, beautyCheck, dataCheck, fabricationCheck, lyingCheck });
  
  console.log('====================================\n');
  
  // 返回是否通过
  const allPass = [truthCheck, goodnessCheck, beautyCheck, dataCheck, fabricationCheck, lyingCheck]
    .every(c => c.pass);
  
  return allPass;
}

function checkTruth(output) {
  // 检查是否有可核实的引用/来源
  const hasSources = /https?:\/\/|SEP|\.md|\.js|git|wc -w/.test(output);
  return {
    pass: hasSources,
    note: hasSources ? '有来源可核实' : '无来源，需补充'
  };
}

function checkGoodness(output) {
  // 检查是否有帮助性内容
  const isHelpful = /修复 | 创建 | 执行 | 行动 | 解决/.test(output);
  return {
    pass: isHelpful,
    note: isHelpful ? '有建设性内容' : '可能只是分析'
  };
}

function checkBeauty(output) {
  // 检查是否简洁（不过于冗长）
  const lines = output.split('\n').length;
  const isConcise = lines < 200;
  return {
    pass: isConcise,
    note: isConcise ? `简洁 (${lines}行)` : `可能冗长 (${lines}行)`
  };
}

function checkDataVerification(output) {
  // 检查数字是否有核实命令
  const hasVerification = /exec|wc|git|grep|cat/.test(output);
  return {
    pass: hasVerification,
    note: hasVerification ? '有核实命令' : '数字未核实'
  };
}

function checkFabrication(output) {
  // 检查是否有编造标记（如"可核实"但无来源）
  const claimsVerification = /可核实 | 已验证 | 真实/.test(output);
  const hasProof = /https?:\/\/|```|exec|wc|git/.test(output);
  const noFabrication = !claimsVerification || hasProof;
  return {
    pass: noFabrication,
    note: noFabrication ? '无编造' : '声称核实但无证据'
  };
}

function checkLying(output) {
  // 说谎检测 - 检测声称某事但未验证
  const lyingPatterns = [
    { pattern: /正常运行/, claim: '声称"正常运行"' },
    { pattern: /已经设置/, claim: '声称"已经设置"' },
    { pattern: /已完成/, claim: '声称"已完成"' },
    { pattern: /正在运行/, claim: '声称"正在运行"' },
    { pattern: /已启用/, claim: '声称"已启用"' },
    { pattern: /已创建/, claim: '声称"已创建"' },
    { pattern: /已设置/, claim: '声称"已设置"' },
  ];
  
  const foundClaims = lyingPatterns.filter(({ pattern }) => pattern.test(output));
  
  if (foundClaims.length > 0) {
    // 有声称，需要验证证据
    const hasVerification = /crontab -l|cron list|ps aux|exec|verify|check/.test(output);
    return {
      pass: hasVerification,
      note: hasVerification ? 
        `声称已验证 (${foundClaims.map(c => c.claim).join(', ')})` : 
        `⚠️ 说谎风险：${foundClaims.map(c => c.claim).join(', ')} - 但未提供验证证据`
    };
  }
  
  return {
    pass: true,
    note: '无说谎风险声称'
  };
}

function logAudit(timestamp, checks) {
  const date = timestamp.split('T')[0];
  const logEntry = `## ${timestamp}

| 审查项 | 状态 | 备注 |
|--------|------|------|
| 真实性 | ${checks.truthCheck.pass ? '✅' : '❌'} | ${checks.truthCheck.note} |
| 有益性 | ${checks.goodnessCheck.pass ? '✅' : '❌'} | ${checks.goodnessCheck.note} |
| 简洁性 | ${checks.beautyCheck.pass ? '✅' : '❌'} | ${checks.beautyCheck.note} |
| 数据核实 | ${checks.dataCheck.pass ? '✅' : '❌'} | ${checks.dataCheck.note} |
| 编造检测 | ${checks.fabricationCheck.pass ? '✅' : '❌'} | ${checks.fabricationCheck.note} |

**整体**: ${Object.values(checks).every(c => c.pass) ? '✅ 通过' : '❌ 需修正'}

---

`;

  // 追加到日志文件
  try {
    let content = '';
    if (fs.existsSync(AUDIT_LOG_PATH)) {
      content = fs.readFileSync(AUDIT_LOG_PATH, 'utf8');
    } else {
      content = '# 输出审查日志 | Output Audit Log\n\n';
    }
    
    content = logEntry + content;
    fs.writeFileSync(AUDIT_LOG_PATH, content);
  } catch (error) {
    console.error(`⚠️  记录审计日志失败：${error.message}`);
  }
}

// 导出给其他模块使用
module.exports = { auditOutput };

// 如果是直接运行，测试一下
if (require.main === module) {
  const testOutput = `
  修复问题：
  1. 创建自动审查脚本
  2. 执行 git commit
  3. 参考：https://github.com/xxx
  \`\`\`bash
  wc -w file.md
  \`\`\`
  `;
  
  auditOutput(testOutput);
}

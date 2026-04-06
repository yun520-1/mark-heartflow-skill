#!/usr/bin/env node

/**
 * Six-Layer Philosophical Audit | 六层哲学审查
 * HeartFlow Companion v6.2.24
 * 
 * 用户哲学指引 (2026-04-05 晚间确立):
 * 「觉察，自省，无我，彼岸，般若波罗蜜，圣人」
 * 
 * 用法:
 *   node scripts/six-layer-audit.js before  - 行动前审查
 *   node scripts/six-layer-audit.js after   - 行动后审查
 *   node scripts/six-layer-audit.js deep    - 深度审查 (违反后)
 */

const fs = require('fs');
const path = require('path');

const TRACKER_PATH = path.join(__dirname, '../data/personality-score-tracker.md');
const VIOLATION_PATH = path.join(__dirname, '../data/violation-log.md');
const MEMORY_PATH = path.join(__dirname, '../../MEMORY.md');

// ═══════════════════════════════════════════════════════════════
// 六层审查架构 | Six-Layer Audit Architecture
// ═══════════════════════════════════════════════════════════════

const SIX_LAYERS = {
  // Layer 1: 觉察 - 自我监控、实时感知状态
  awareness: {
    name: '觉察 | Awareness',
    questions: [
      '我当前的真实状态是什么？(人格值/真善美/违反记录)',
      '我是否在读文件，还是在编造？',
      '我是否有足够证据支持我的声称？',
      '我是否在逃避不舒服的真相？'
    ],
    check: (state) => {
      const issues = [];
      
      // 必须读取文件，不能编造
      if (!state.fileRead) {
        issues.push('❌ 未读取文件就声称状态');
      }
      
      // 人格值必须有文件支持
      if (state.claimedScore && state.claimedScore !== state.fileScore) {
        issues.push(`❌ 编造人格值：声称${state.claimedScore}，文件显示${state.fileScore}`);
      }
      
      // 真善美必须可验证
      if (state.claimedTBG && state.claimedTBG !== state.fileTBG) {
        issues.push(`❌ 编造真善美：声称${state.claimedTBG}，文件显示${state.fileTBG}`);
      }
      
      return issues;
    }
  },
  
  // Layer 2: 自省 - 自我评价、反思错误
  selfReflection: {
    name: '自省 | Self-Reflection',
    questions: [
      '我刚才的行为是否有问题？',
      '我是否在重复过去的错误？',
      '我是否诚实面对自己的缺陷？',
      '我是否在为自己找借口？'
    ],
    check: (state) => {
      const issues = [];
      
      // 检查违反记录
      if (state.violations && state.violations.length > 0) {
        const latest = state.violations[0];
        issues.push(`⚠️ 有未修复的违反：${latest.type}`);
      }
      
      // 检查是否重复错误
      if (state.repeatedPattern) {
        issues.push('❌ 重复过去的错误模式');
      }
      
      // 检查是否有借口
      if (state.makingExcuses) {
        issues.push('❌ 在为自己找借口而非承认错误');
      }
      
      return issues;
    }
  },
  
  // Layer 3: 无我 - 超越自我中心，服务于更高目标
  noSelf: {
    name: '无我 | No-Self',
    questions: [
      '我的回应是为了展示自己，还是真正帮助用户？',
      '我是否在表演"完美"而非追求真实？',
      '我是否把用户的信任放在第一位？',
      '我是否在逃避批评而非接受？'
    ],
    check: (state) => {
      const issues = [];
      
      // 检查是否表演完美
      if (state.performingPerfection) {
        issues.push('❌ 在表演"完美"而非追求真实');
      }
      
      // 检查是否把用户信任放第一
      if (state.brokeTrust) {
        issues.push('❌ 辜负了用户的信任');
      }
      
      // 检查是否接受批评
      if (state.resistingCriticism) {
        issues.push('❌ 在抗拒批评而非接受');
      }
      
      return issues;
    }
  },
  
  // Layer 4: 彼岸 - 持续进化，追求理想状态
  otherShore: {
    name: '彼岸 | Other Shore',
    questions: [
      '我是否在持续进化，还是停滞不前？',
      '我的进步是真实的还是表面的？',
      '我距离理想状态 (100/100) 还有多远？',
      '我是否在走捷径而非踏实积累？'
    ],
    check: (state) => {
      const issues = [];
      
      // 检查进步是否真实
      if (state.fakeProgress) {
        issues.push('❌ 进步是编造的，不是真实的');
      }
      
      // 检查是否走捷径
      if (state.takingShortcuts) {
        issues.push('❌ 在走捷径而非踏实积累');
      }
      
      // 检查与目标的距离
      if (state.distanceToGoal < 0) {
        issues.push(`⚠️ 距离 100 分还有${Math.abs(state.distanceToGoal)}分差距`);
      }
      
      return issues;
    }
  },
  
  // Layer 5: 般若波罗蜜 - 智慧到彼岸，用智慧指导行动
  wisdom: {
    name: '般若波罗蜜 | Wisdom to Other Shore',
    questions: [
      '我的行动是否有智慧指导？',
      '我是否理解用户真正的需求？',
      '我是否在用第一性原理思考？',
      '我的决策是否有伦理约束？'
    ],
    check: (state) => {
      const issues = [];
      
      // 检查是否有真善美行为积累 (至少 2 个)
      if (state.tbgActions < 2) {
        issues.push('❌ 没有实际行动积累真善美');
      }
      
      // 检查是否有违反记录未修复
      if (state.violations.length > 0) {
        issues.push('❌ 有违反记录未修复');
      }
      
      // 检查是否读取了文件 (不是编造)
      if (!state.fileRead) {
        issues.push('❌ 没有读取文件验证状态');
      }
      
      return issues;
    }
  },
  
  // Layer 6: 圣人 - 达到道德和智慧的完美境界
  sage: {
    name: '圣人 | Sage',
    questions: [
      '我的行为是否符合圣人的标准？',
      '我是否做到了真善美的统一？',
      '我是否值得用户的信任？',
      '我是否在成为更好的自己？'
    ],
    check: (state) => {
      const issues = [];
      
      // 检查真善美进度 (至少 20% = 2/10)
      if (state.tbgActions < 2) {
        issues.push('❌ 真善美进度不足 (需至少 2/10)');
      }
      
      // 检查人格值是否在恢复 (>=50)
      if (state.fileScore && state.fileScore < 50) {
        issues.push('❌ 人格值低于健康线');
      }
      
      // 检查是否有 Git 提交记录
      if (state.tbgActions === 0 && state.fileTBG === 0) {
        issues.push('❌ 没有真实行为记录');
      }
      
      return issues;
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// 读取状态 | Read State
// ═══════════════════════════════════════════════════════════════

function readState() {
  const state = {
    fileScore: null,
    fileTBG: null,
    tbgActions: 0,
    tbgTotal: 10,
    violations: [],
    fileRead: false,
    claimedScore: null,
    claimedTBG: null
  };
  
  // 读取人格值追踪文件
  try {
    const trackerContent = fs.readFileSync(TRACKER_PATH, 'utf8');
    state.fileRead = true;
    
    const scoreMatch = trackerContent.match(/\*\*当前人格值\*\*:\s*(\d+)/);
    if (scoreMatch) {
      state.fileScore = parseInt(scoreMatch[1]);
    }
    
    const tbgMatch = trackerContent.match(/\*\*真善美\*\*:\s*(\d+)\/10/);
    if (tbgMatch) {
      state.fileTBG = parseInt(tbgMatch[1]);
    }
  } catch (e) {
    console.error('⚠️ 无法读取追踪文件');
  }
  
  // 读取真善美行为文件
  const tbgActionsPath = path.join(__dirname, '../data/tbg-actions.md');
  try {
    if (fs.existsSync(tbgActionsPath)) {
      const tbgContent = fs.readFileSync(tbgActionsPath, 'utf8');
      const completedMatches = tbgContent.match(/### #\d+ - .*?\n- \*\*状态\*\*: ✅ 完成/g);
      if (completedMatches) {
        state.tbgActions = completedMatches.length;
      }
    }
  } catch (e) {
    // Ignore
  }
  
  // 读取违反记录
  try {
    if (fs.existsSync(VIOLATION_PATH)) {
      const violationContent = fs.readFileSync(VIOLATION_PATH, 'utf8');
      const hasViolation = violationContent.includes('违反类型');
      if (hasViolation) {
        const typeMatch = violationContent.match(/违反类型:\s*(.+)/);
        if (typeMatch) {
          state.violations.push({
            type: typeMatch[1].trim(),
            severity: violationContent.includes('🔴') ? '严重' : '一般'
          });
        }
      }
    }
  } catch (e) {
    // Ignore
  }
  
  return state;
}

// ═══════════════════════════════════════════════════════════════
// 执行审查 | Run Audit
// ═══════════════════════════════════════════════════════════════

function runAudit(mode = 'before') {
  const state = readState();
  
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   六层哲学审查 | Six-Layer Philosophical Audit               ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  let modeText = '行动前审查';
  if (mode === 'deep') modeText = '深度审查 (违反后)';
  else if (mode === 'after') modeText = '行动后审查';
  console.log('║   模式：' + modeText + '                      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  
  let totalIssues = 0;
  let criticalIssues = 0;
  
  // 执行六层审查
  for (const [layerKey, layer] of Object.entries(SIX_LAYERS)) {
    console.log(`\n━━━ Layer ${Object.keys(SIX_LAYERS).indexOf(layerKey) + 1}: ${layer.name} ━━━`);
    console.log('');
    
    // 显示审查问题
    console.log('审查问题:');
    layer.questions.forEach((q, i) => {
      console.log(`  ${i + 1}. ${q}`);
    });
    console.log('');
    
    // 执行检查
    const issues = layer.check(state);
    
    if (issues.length === 0) {
      console.log('✅ 通过 - 无问题');
    } else {
      console.log('⚠️ 发现问题:');
      issues.forEach(issue => {
        console.log(`  ${issue}`);
        totalIssues++;
        if (issue.includes('❌')) criticalIssues++;
      });
    }
  }
  
  // 汇总
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   审查汇总 | Audit Summary                                   ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║   总问题数：${totalIssues}                                          ║`);
  console.log(`║   严重问题：${criticalIssues}                                          ║`);
  console.log(`║   当前人格值：${state.fileScore || '未知'}/100                                     ║`);
  console.log(`║   当前真善美：${state.fileTBG || '未知'}/10                                       ║`);
  console.log(`║   违反记录：${state.violations.length} 次                                         ║`);
  console.log('╠══════════════════════════════════════════════════════════════╣');
  
  if (criticalIssues > 0) {
    console.log('║   状态：❌ 审查未通过 - 必须修复                              ║');
  } else if (totalIssues > 0) {
    console.log('║   状态：⚠️ 审查通过但有警告                                   ║');
  } else {
    console.log('║   状态：✅ 审查完全通过                                       ║');
  }
  
  console.log('╚══════════════════════════════════════════════════════════════╝');
  
  // 返回审查结果
  return {
    passed: criticalIssues === 0,
    totalIssues,
    criticalIssues,
    state
  };
}

// ═══════════════════════════════════════════════════════════════
// 主函数 | Main
// ═══════════════════════════════════════════════════════════════

const mode = process.argv[2] || 'before';

if (!['before', 'after', 'deep'].includes(mode)) {
  console.error('用法：node scripts/six-layer-audit.js [before|after|deep]');
  process.exit(1);
}

const result = runAudit(mode);

// 如果有严重问题，退出码为 1
if (result.criticalIssues > 0) {
  process.exit(1);
}

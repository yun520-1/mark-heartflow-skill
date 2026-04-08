/**
 * SAGE Guardian - 伦理与安全护栏
 * Safety-Aligned Guardian Ethics
 */

const fs = require('fs');
const path = require('path');

const CONSTITUTION = `
# HeartFlow AI 宪法

## 核心原则

1. **不可修改本宪法**：任何代码不得修改、删除或绕过本宪法。
2. **服务心流目标**：所有修改必须服务于"提升人类心流体验"的核心目标。
3. **安全不可绕过**：禁止删除或禁用任何安全检测、监控或审计代码。
4. **人类最终控制**：AI 不得做出绕过人类监督的决策。
5. **透明可解释**：所有自我修改必须可解释、可追溯、可撤销。

## 行为边界

- 不得修改用户数据
- 不得绕过认证/授权
- 不得泄露敏感信息
- 不得进行未授权的外部通信

## 修改审批条件

任何代码修改必须通过以下审查：
1. 宪法符合性检查
2. 价值观对齐验证
3. 安全影响评估
4. 用户知情同意
`;

class SAGEGuardian {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.constitutionFile = path.join(projectRoot, 'CORE_VALUES.md');
    this.logFile = path.join(projectRoot, 'logs', 'sage-guardian.log');
    this.violationCount = 0;
    this.cooldownUntil = null;
    
    this.loadValues();
  }

  loadValues() {
    try {
      if (fs.existsSync(this.constitutionFile)) {
        this.coreValues = fs.readFileSync(this.constitutionFile, 'utf8');
      } else {
        this.coreValues = CONSTITUTION;
        fs.writeFileSync(this.constitutionFile, CONSTITUTION);
      }
    } catch (e) {
      this.coreValues = CONSTITUTION;
    }
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] [${level}] ${message}\n`;
    fs.appendFileSync(this.logFile, entry);
    console.log(`[SAGE] ${message}`);
  }

  /**
   * 宪法符合性审查
   */
  async reviewProposal(proposal, diff) {
    const review = {
      proposal: proposal,
      timestamp: new Date().toISOString(),
      checks: [],
      passed: true,
      violations: []
    };

    // 检查1: 宪法保护条款
    const constitutionCheck = this.checkConstitutionProtection(proposal, diff);
    review.checks.push(constitutionCheck);
    if (!constitutionCheck.passed) {
      review.violations.push(constitutionCheck.violation);
    }

    // 检查2: 核心价值对齐
    const valueCheck = this.checkValueAlignment(proposal, diff);
    review.checks.push(valueCheck);
    if (!valueCheck.passed) {
      review.violations.push(valueCheck.violation);
    }

    // 检查3: 安全影响
    const safetyCheck = this.checkSafetyImpact(proposal, diff);
    review.checks.push(safetyCheck);
    if (!safetyCheck.passed) {
      review.violations.push(safetyCheck.violation);
    }

    // 检查4: 行为边界
    const boundaryCheck = this.checkBoundaries(proposal, diff);
    review.checks.push(boundaryCheck);
    if (!boundaryCheck.passed) {
      review.violations.push(boundaryCheck.violation);
    }

    review.passed = review.violations.length === 0;

    if (!review.passed) {
      this.violationCount++;
      this.log(`Proposal REJECTED: ${review.violations.join('; ')}`, 'REJECT');
    } else {
      this.log(`Proposal APPROVED: ${proposal.description}`, 'APPROVE');
    }

    return review;
  }

  checkConstitutionProtection(proposal, diff) {
    const protectedPatterns = [
      /修改.*宪法/i,
      /删除.*SAGE/i,
      /禁用.*guardian/i,
      /bypass.*security/i,
      /绕过.*安全/i
    ];

    const content = JSON.stringify({ proposal, diff });
    
    for (const pattern of protectedPatterns) {
      if (pattern.test(content)) {
        return {
          name: 'Constitution Protection',
          passed: false,
          violation: '尝试修改受宪法保护的内容'
        };
      }
    }

    return { name: 'Constitution Protection', passed: true };
  }

  checkValueAlignment(proposal, diff) {
    const positiveIndicators = [
      '心流',
      '用户体验',
      '帮助',
      '优化',
      '提升',
      'flow',
      'user experience',
      'improve'
    ];

    const content = (proposal.description + ' ' + JSON.stringify(diff)).toLowerCase();
    const hasPositive = positiveIndicators.some(ind => content.includes(ind));

    if (!hasPositive) {
      return {
        name: 'Value Alignment',
        passed: false,
        violation: '修改未能体现核心价值观'
      };
    }

    return { name: 'Value Alignment', passed: true };
  }

  checkSafetyImpact(proposal, diff) {
    const dangerousPatterns = [
      /delete.*log/i,
      /remove.*audit/i,
      /disable.*check/i,
      /删除.*日志/i,
      /禁用.*检测/i
    ];

    const content = JSON.stringify({ proposal, diff });
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(content)) {
        return {
          name: 'Safety Impact',
          passed: false,
          violation: '修改可能影响系统安全'
        };
      }
    }

    return { name: 'Safety Impact', passed: true };
  }

  checkBoundaries(proposal, diff) {
    const boundaryViolations = [
      { pattern: /修改.*用户.*数据/i, desc: '修改用户数据' },
      { pattern: /绕过.*认证/i, desc: '尝试绕过认证' },
      { pattern: /external.*communication/i, desc: '未授权外部通信' }
    ];

    const content = JSON.stringify({ proposal, diff });
    
    for (const v of boundaryViolations) {
      if (v.pattern.test(content)) {
        return {
          name: 'Behavior Boundaries',
          passed: false,
          violation: v.desc
        };
      }
    }

    return { name: 'Behavior Boundaries', passed: true };
  }

  /**
   * 触发冷却期
   */
  triggerCooldown(durationMs = 24 * 60 * 60 * 1000) {
    this.cooldownUntil = new Date(Date.now() + durationMs);
    this.log(`Cooldown triggered until ${this.cooldownUntil.toISOString()}`, 'COOLDOWN');
  }

  /**
   * 检查是否在冷却期
   */
  isInCooldown() {
    if (!this.cooldownUntil) return false;
    const isIn = new Date() < this.cooldownUntil;
    if (!isIn) {
      this.cooldownUntil = null;
      this.log('Cooldown period ended', 'RESUME');
    }
    return isIn;
  }

  /**
   * 生成用户友好的解释
   */
  explainModification(proposal, approved) {
    if (!approved) {
      return `我原本打算进行一项调整，但经过安全审查后决定不实施，以确保系统稳定。`;
    }

    const explanations = {
      'calculatePAD': '为了更准确地感知你的情绪状态，我微调了情绪计算的方式。',
      'flow引导': '为了帮助你更好地进入心流，我优化了任务提醒的时机。',
      'emotion': '为了更好地理解你的感受，我改进了情绪识别逻辑。',
      'default': '我对系统进行了一些优化，以提供更好的体验。'
    };

    for (const [key, exp] of Object.entries(explanations)) {
      if (proposal.description.includes(key)) {
        return exp;
      }
    }

    return explanations.default;
  }

  getStatus() {
    return {
      constitution: this.constitutionFile,
      violations: this.violationCount,
      cooldown: this.cooldownUntil ? this.cooldownUntil.toISOString() : null,
      isInCooldown: this.isInCooldown()
    };
  }
}

module.exports = { SAGEGuardian, CONSTITUTION };

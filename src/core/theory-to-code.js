/**
 * 理论→代码转换器 | Theory-to-Code Transformer
 * 
 * 版本：v6.1.61
 * 创建时间：2026-04-06
 * 
 * 核心功能：
 * - 读取理论文档
 * - 匹配理论模板
 * - 自动生成代码
 * - 加速理论集成
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// 理论模板库
// ============================================================================

const THEORY_TEMPLATES = {
  // SDT 自我决定理论
  "SDT": {
    name: "自我决定理论",
    formula: "IntrinsicMotivation = Autonomy × Competence × Relatedness",
    codeTemplate: `
/**
 * {{NAME}} - {{DESCRIPTION}}
 * 版本：v{{VERSION}}
 * 理论来源：{{SOURCE}}
 */

module.exports = {
  /**
   * 核心公式：{{FORMULA}}
   */
  calculate: function({{PARAMS}}) {
    return {{CALCULATION}};
  },
  
  /**
   * 质量检查
   */
  check: function(data) {
    const issues = [];
    if (data.autonomy < 0 || data.autonomy > 1) issues.push('Autonomy 超出范围');
    if (data.competence < 0 || data.competence > 1) issues.push('Competence 超出范围');
    if (data.relatedness < 0 || data.relatedness > 1) issues.push('Relatedness 超出范围');
    return { passed: issues.length === 0, issues };
  }
};
`,
    params: "autonomy, competence, relatedness",
    calculation: "autonomy * competence * relatedness",
    source: "Deci & Ryan (2000)"
  },
  
  // 马斯洛需求层次
  "MASLOW": {
    name: "马斯洛需求层次",
    formula: "Priority = Urgency × (1 - CumulativeSatisfaction)",
    codeTemplate: `
/**
 * {{NAME}} - {{DESCRIPTION}}
 * 版本：v{{VERSION}}
 * 理论来源：{{SOURCE}}
 */

module.exports = {
  levels: ['PHYSIOLOGICAL', 'SAFETY', 'LOVE_BELONGING', 'ESTEEM', 'SELF_ACTUALIZATION'],
  
  /**
   * 核心公式：{{FORMULA}}
   */
  calculatePriority: function(needs) {
    const priorities = [];
    let cumulativeSatisfaction = 1;
    
    for (const level of this.levels) {
      const need = needs.find(n => n.level === level);
      if (need) {
        const priority = need.urgency * cumulativeSatisfaction;
        priorities.push(priority);
        cumulativeSatisfaction *= (1 - need.satisfaction);
      }
    }
    
    return priorities;
  },
  
  /**
   * 质量检查
   */
  check: function(needs) {
    const issues = [];
    for (const need of needs) {
      if (need.satisfaction < 0 || need.satisfaction > 1) issues.push(\`满意度超出范围：\${need.level}\`);
      if (need.urgency < 0 || need.urgency > 1) issues.push(\`紧迫性超出范围：\${need.level}\`);
    }
    return { passed: issues.length === 0, issues };
  }
};
`,
    source: "Maslow (1943)"
  },
  
  // 动机强度公式
  "MOTIVATION_STRENGTH": {
    name: "动机强度",
    formula: "Motivation = (Need × Expectancy × Value) / Cost",
    codeTemplate: `
/**
 * {{NAME}} - {{DESCRIPTION}}
 * 版本：v{{VERSION}}
 * 理论来源：期望价值理论
 */

module.exports = {
  /**
   * 核心公式：{{FORMULA}}
   */
  calculate: function(need, expectancy, value, cost) {
    if (cost >= 1) return 0; // 成本过高，动机为零
    return (need * expectancy * value) / (1 - cost + 0.01);
  },
  
  /**
   * 质量检查
   */
  check: function(data) {
    const issues = [];
    if (data.need < 0 || data.need > 1) issues.push('Need 超出范围');
    if (data.expectancy < 0 || data.expectancy > 1) issues.push('Expectancy 超出范围');
    if (data.value < 0 || data.value > 1) issues.push('Value 超出范围');
    if (data.cost < 0 || data.cost > 1) issues.push('Cost 超出范围');
    return { passed: issues.length === 0, issues };
  }
};
`,
    params: "need, expectancy, value, cost",
    calculation: "(need * expectancy * value) / (1 - cost + 0.01)",
    source: "Expectancy-Value Theory"
  },
  
  // 依恋理论
  "ATTACHMENT": {
    name: "依恋理论",
    formula: "SecureBase = Availability × Responsiveness × Consistency",
    codeTemplate: `
/**
 * {{NAME}} - {{DESCRIPTION}}
 * 版本：v{{VERSION}}
 * 理论来源：{{SOURCE}}
 */

module.exports = {
  attachmentStyles: ['SECURE', 'ANXIOUS', 'AVOIDANT', 'DISORGANIZED'],
  
  /**
   * 核心公式：{{FORMULA}}
   */
  calculateSecureBase: function(availability, responsiveness, consistency) {
    return availability * responsiveness * consistency;
  },
  
  /**
   * 依恋风格分类
   */
  classifyStyle: function(anxiety, avoidance) {
    if (anxiety < 0.5 && avoidance < 0.5) return 'SECURE';
    if (anxiety >= 0.5 && avoidance < 0.5) return 'ANXIOUS';
    if (anxiety < 0.5 && avoidance >= 0.5) return 'AVOIDANT';
    return 'DISORGANIZED';
  }
};
`,
    source: "Bowlby & Ainsworth"
  },
  
  // 情绪评价理论
  "APPRAISAL": {
    name: "情绪评价理论",
    formula: "Emotion = Appraisal(Relevance, Implication, Coping, Normative)",
    codeTemplate: `
/**
 * {{NAME}} - {{DESCRIPTION}}
 * 版本：v{{VERSION}}
 * 理论来源：{{SOURCE}}
 */

module.exports = {
  emotionTypes: ['JOY', 'SADNESS', 'ANGER', 'FEAR', 'SURPRISE', 'DISGUST'],
  
  /**
   * 核心公式：{{FORMULA}}
   */
  generateEmotion: function(appraisals) {
    const {
      relevance,      // 相关性 (0-1)
      implication,    // 含义 (positive/negative)
      coping,         // 应对能力 (0-1)
      normative       // 规范性 (0-1)
    } = appraisals;
    
    // 简化情绪生成逻辑
    if (implication === 'positive' && coping > 0.5) return 'JOY';
    if (implication === 'negative' && coping < 0.5) return 'FEAR';
    if (implication === 'negative' && coping > 0.5) return 'ANGER';
    if (relevance < 0.3) return 'SURPRISE';
    return 'SADNESS';
  }
};
`,
    source: "Scherer & Lazarus"
  }
};

// ============================================================================
// 理论文档解析
// ============================================================================

/**
 * 解析理论文档
 */
function parseTheoryDoc(docPath) {
  try {
    const content = fs.readFileSync(docPath, 'utf8');
    
    // 提取理论名称
    const nameMatch = content.match(/#\s*(.+)/);
    const name = nameMatch ? nameMatch[1].split('|')[0].trim() : 'Unknown';
    
    // 提取公式
    const formulaMatch = content.match(/```\s*\n?([A-Za-z\s=×\-\+()0-9.]+)\s*\n?```/);
    const formula = formulaMatch ? formulaMatch[1].trim() : '';
    
    // 提取来源
    const sourceMatch = content.match(/来源 [::]\s*(.+)/i);
    const source = sourceMatch ? sourceMatch[1].trim() : '';
    
    return { name, formula, source, raw: content };
  } catch (error) {
    return { name: 'Unknown', formula: '', source: '', error: error.message };
  }
}

/**
 * 匹配理论模板
 */
function matchTemplate(theory) {
  const theoryName = theory.name.toUpperCase();
  
  // 直接匹配
  if (THEORY_TEMPLATES[theoryName]) {
    return THEORY_TEMPLATES[theoryName];
  }
  
  // 关键词匹配
  for (const [key, template] of Object.entries(THEORY_TEMPLATES)) {
    if (theoryName.includes(key) || theory.formula.includes(key)) {
      return template;
    }
  }
  
  // 无匹配
  return null;
}

// ============================================================================
// 代码生成
// ============================================================================

/**
 * 生成代码
 */
function generateCode(theory, template, version = 'v6.1.61') {
  if (!template) {
    return {
      success: false,
      error: '无匹配模板',
      code: null
    };
  }
  
  const replacements = {
    '{{NAME}}': theory.name,
    '{{DESCRIPTION}}': `${theory.name}理论实现`,
    '{{VERSION}}': version,
    '{{SOURCE}}': theory.source || '未知来源',
    '{{FORMULA}}': theory.formula || template.formula,
    '{{PARAMS}}': template.params || 'data',
    '{{CALCULATION}}': template.calculation || 'data'
  };
  
  let code = template.codeTemplate;
  for (const [placeholder, value] of Object.entries(replacements)) {
    code = code.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
  }
  
  return {
    success: true,
    code,
    template: template.name
  };
}

/**
 * 生成测试代码
 */
function generateTests(theory, template) {
  const tests = `
/**
 * ${theory.name} 测试用例
 */

const assert = require('assert');
const module = require('./${theory.name.toLowerCase().replace(/\s+/g, '-')}');

describe('${theory.name} 测试', () => {
  it('应该正确计算核心公式', () => {
    // TODO: 添加具体测试用例
    assert.ok(true);
  });
  
  it('应该处理边界情况', () => {
    // TODO: 添加边界测试
    assert.ok(true);
  });
});
`;
  
  return tests;
}

/**
 * 保存代码文件
 */
function saveCodeFile(code, theoryName, outputDir) {
  const fileName = theoryName.toLowerCase().replace(/\s+/g, '-');
  const filePath = path.join(outputDir, `${fileName}.js`);
  
  try {
    fs.writeFileSync(filePath, code);
    return { success: true, path: filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// 主函数
// ============================================================================

/**
 * 理论→代码转换
 */
function theoryToCode(docPath, outputDir = null) {
  // 解析理论文档
  const theory = parseTheoryDoc(docPath);
  
  if (theory.error) {
    return {
      success: false,
      error: `解析失败：${theory.error}`,
      step: 'parse'
    };
  }
  
  // 匹配模板
  const template = matchTemplate(theory);
  
  if (!template) {
    return {
      success: false,
      error: `无匹配模板：${theory.name}`,
      step: 'match',
      availableTemplates: Object.keys(THEORY_TEMPLATES)
    };
  }
  
  // 生成代码
  const codeResult = generateCode(theory, template);
  
  if (!codeResult.success) {
    return {
      success: false,
      error: codeResult.error,
      step: 'generate'
    };
  }
  
  // 保存文件
  let saveResult = null;
  if (outputDir) {
    saveResult = saveCodeFile(codeResult.code, theory.name, outputDir);
  }
  
  return {
    success: true,
    theory: theory.name,
    template: template.name,
    formula: theory.formula,
    code: codeResult.code,
    saved: saveResult
  };
}

/**
 * 批量转换
 */
function batchConvert(docsDir, outputDir) {
  const results = [];
  
  try {
    const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.md'));
    
    for (const file of files) {
      const docPath = path.join(docsDir, file);
      const result = theoryToCode(docPath, outputDir);
      results.push({ file, ...result });
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      results
    };
  }
  
  return {
    success: true,
    total: results.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results
  };
}

// ============================================================================
// 导出
// ============================================================================

module.exports = {
  THEORY_TEMPLATES,
  parseTheoryDoc,
  matchTemplate,
  generateCode,
  generateTests,
  saveCodeFile,
  theoryToCode,
  batchConvert
};

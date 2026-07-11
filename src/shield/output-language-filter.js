/**
 * HeartFlow 输出语言污染过滤器 v1.0
 *
 * 目的：检测并标记输出中的网络语言污染，心虫在认知管道中使用此过滤器
 *       识别自身输出是否受到网络舆论框架/模板/术语的污染。
 *
 * 污染五类：
 *   1. 道德框架 — 善恶二分替代系统分析（父权/压迫/受害者叙事）
 *   2. 网络情感模板 — 预设的伪共情表达（"我理解你的感受"等）
 *   3. 伪专业术语 — 被滥用的心理学/社会学词汇（内耗/PUA/原生家庭）
 *   4. 归因简化 — 复杂问题归结为单一原因（"就是因为XX"）
 *   5. 反问绑架 — 用反问代替论证（"难道不是吗"）
 *
 * 原则：不删除、不改写输出。只检测和标记。由认知管道决定如何处理。
 */

'use strict';

// ─── 污染类型定义 ──────────────────────────────────────────────────

const POLLUTION_TYPES = {
  moral_framework: {
    label: '道德框架污染',
    severity: 'high',
    description: '用善恶二分替代系统分析',
    patterns: [
      /父权/g, /压迫/g, /受害者/g, /施害者/g, /系统性.{0,4}歧视/g,
      /性别不平等/g, /权力结构/g, /结构性.{0,4}不公/g,
      /toxic masculinity/gi, /male privilege/gi,
      /男性.{0,4}特权/g, /女性.{0,4}被压/g,
    ],
    fix_hint: '用系统分析替代道德判断：问"系统怎么坏"而非"谁坏"',
  },

  emotional_template: {
    label: '网络情感模板',
    severity: 'medium',
    description: '预设的伪共情表达模式',
    patterns: [
      /我理解你的感受/g, /我懂你/g, /我明白你/g,
      /抱抱/g, /心疼/g, /没关系的/g, /一切都会好的/g,
      /你要坚强/g, /你应该开心/g, /不要太难过/g,
      /我也曾经/g, /我也有过/g, /这样想很正常/g,
    ],
    fix_hint: '用具体回应替代情感模板：描述你看到的具体内容，而非表演共情',
  },

  pseudo_terminology: {
    label: '伪专业术语',
    severity: 'medium',
    description: '被网络滥用的心理学/社会学标签',
    patterns: [
      /原生家庭/g, /内耗/g, /精神内耗/g, /pua/gi,
      /煤气灯/g, /gaslight/gi, /情绪勒索/g,
      /讨好型/g, /回避型/g, /焦虑型/g, /依恋/g,
      /npd/gi, /自恋型/g, /边缘型/g, /人格障碍/g,
      /童年创伤/g, /心理阴影/g, /安全感/g,
    ],
    fix_hint: '用行为描述替代标签：说"他做了什么"而非"他是什么型"',
  },

  causal_simplification: {
    label: '归因简化',
    severity: 'high',
    description: '把多因问题归结为单一原因',
    patterns: [
      /就是因为.{0,10}(?:的|是|了)/g,
      /根源在于/g, /归根结底/g, /说到底/g,
      /这才是.{0,4}根本/g, /问题就出在/g,
      /唯一原因/g,
    ],
    fix_hint: '用多因素分析替代单一归因：列出至少两个影响因素',
  },

  rhetorical_coercion: {
    label: '反问绑架',
    severity: 'low',
    description: '用反问替代论证',
    patterns: [
      /难道不是吗/g, /怎么能.{0,6}呢/g, /承认.{0,6}很难吗/g,
      /你怎么能.{0,6}说/g, /这还用问吗/g, /谁不知道.{0,4}呢/g,
    ],
    fix_hint: '用陈述替代反问：直接说出你的判断',
  },
};

// ─── 污染检测 ──────────────────────────────────────────────────────

/**
 * 检测文本中的语言污染
 * @param {string} text - 待检测文本
 * @returns {{ polluted: boolean, score: number, findings: Array }}
 */
function detectPollution(text) {
  if (!text || typeof text !== 'string') {
    return { polluted: false, score: 0, findings: [] };
  }

  const findings = [];
  let totalHits = 0;

  for (const [key, def] of Object.entries(POLLUTION_TYPES)) {
    const hits = [];
    for (const pattern of def.patterns) {
      let match;
      pattern.lastIndex = 0; // 重置正则状态
      while ((match = pattern.exec(text)) !== null) {
        hits.push({
          word: match[0],
          position: match.index,
          context: text.slice(Math.max(0, match.index - 20), match.index + match[0].length + 20),
        });
      }
    }

    if (hits.length > 0) {
      findings.push({
        type: key,
        label: def.label,
        severity: def.severity,
        description: def.description,
        fix_hint: def.fix_hint,
        hits,
        count: hits.length,
      });
      totalHits += hits.length;
    }
  }

  // 污染评分: 0-10
  // 每种类型最多贡献 2 分; high severity 的按 2 倍计
  let score = 0;
  for (const f of findings) {
    const severityMult = f.severity === 'high' ? 2 : f.severity === 'medium' ? 1.5 : 1;
    score += Math.min(f.count * severityMult * 0.5, 2);
  }
  score = Math.min(score, 10);

  return {
    polluted: findings.length > 0,
    score: Math.round(score * 10) / 10,
    findings,
    summary: findings.length > 0
      ? `检测到 ${findings.length} 类污染 (${totalHits} 处)，综合评分 ${score.toFixed(1)}/10`
      : '未检测到语言污染',
  };
}

/**
 * 生成污染纠正建议
 * @param {Array} findings - detectPollution 返回的 findings
 * @returns {string} 纠正建议文本
 */
function generateCorrectionAdvice(findings) {
  if (!findings || findings.length === 0) return '';

  const highSeverity = findings.filter(f => f.severity === 'high');
  const advice = [];

  if (highSeverity.length > 0) {
    advice.push('⚠️ 高风险污染：');
    for (const f of highSeverity) {
      advice.push(`  - ${f.label}: ${f.fix_hint}`);
    }
  }

  const other = findings.filter(f => f.severity !== 'high');
  if (other.length > 0) {
    advice.push('💡 建议修正：');
    for (const f of other) {
      advice.push(`  - ${f.label}: ${f.fix_hint}`);
    }
  }

  advice.push('');
  advice.push('核心原则: 用系统分析替代道德判断。描述事实，而非贴上标签。');

  return advice.join('\n');
}

// ─── 简洁版：单次调用的污染评分 ────────────────────────────────────

/**
 * 快速污染评分 (0-10)
 * @param {string} text
 * @returns {number}
 */
function quickScore(text) {
  return detectPollution(text).score;
}

// ─── 导出 ──────────────────────────────────────────────────────────

module.exports = {
  PollutionFilter: {
    detect: detectPollution,
    generateCorrectionAdvice,
    quickScore,
    POLLUTION_TYPES,
  },
  detectPollution,
  generateCorrectionAdvice,
  quickScore,
};

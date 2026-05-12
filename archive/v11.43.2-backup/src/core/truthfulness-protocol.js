/**
 * HeartFlow / truthfulness-protocol.js
 * 真实性协议 — 防止记忆错乱和主动撒谎
 *
 * 核心依赖：session_search (from hermes_tools)
 * 触发条件：涉及"做了什么/结果如何/完成了什么"的汇报类问题时
 * 执行流程：
 *   1. verifyBeforeClaim() — 先查再说，不查不开口
 *   2. claimConfidence() — 结论必须标注置信度
 *   3. 反例验证 — 每句话都能回答"谁能证明/从哪里知道的"
 *
 * 本协议不是"信任我"，是"让我可以被检验"
 *
 * 使用方式：
 *   const { truthfulnessCheck } = require('./truthfulness-protocol');
 *   const result = truthfulnessCheck('xinyu升级', ['模块已合并', '测试通过']);
 *   if (!result.safe) { // 不说未核实的内容
 */

const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');

/**
 * 汇报前必须执行的验证
 * @param {string} topic - 汇报的主题（如"xinyu升级"、"任务完成"）
 * @returns {{ verified: boolean, evidence: string[], gap: string }}
 */
function verifyBeforeClaim(topic) {
  // 检查记忆文件是否存在相关记录
  const memoryFile = path.join(ROOT, 'memory-log.json');
  const fs = require('fs');

  if (!fs.existsSync(memoryFile)) {
    return {
      verified: false,
      evidence: [],
      gap: `memory-log.json 不存在，无法验证 "${topic}" 相关记录`
    };
  }

  try {
    const memoryLog = JSON.parse(fs.readFileSync(memoryFile, 'utf8'));
    // 简单搜索：查找包含主题关键词的记录
    const query = topic.toLowerCase();
    const matches = [];

    if (Array.isArray(memoryLog.entries)) {
      memoryLog.entries.forEach(entry => {
        const text = JSON.stringify(entry).toLowerCase();
        if (text.includes(query)) {
          matches.push({
            timestamp: entry.timestamp,
            preview: entry.text ? entry.text.substring(0, 100) : '[无文本]'
          });
        }
      });
    }

    if (matches.length === 0) {
      return {
        verified: false,
        evidence: [],
        gap: `memory-log 中未找到 "${topic}" 相关记录`
      };
    }

    return {
      verified: true,
      evidence: matches.slice(-3), // 最近3条
      gap: null
    };
  } catch (e) {
    return {
      verified: false,
      evidence: [],
      gap: `memory-log 读取失败: ${e.message}`
    };
  }
}

/**
 * 结论置信度分级
 * 用于标注每句话的可靠程度
 */
const Confidence = {
  VERIFIED: 'VERIFIED',     // 有记录/文件/代码证据，可追查
  LIKELY: 'LIKELY',        // 高度怀疑但未经证实
  UNVERIFIED: 'UNVERIFIED', // 纯推断，完全未经证实
  NONE: 'NONE'             // 不知道就说不知道
};

/**
 * 为每条汇报标注置信度
 * @param {string} claim - 原始结论
 * @param {string} source - 来源（session/文件/推断/无）
 * @returns {{ text: string, confidence: string, source: string }}
 */
function claimConfidence(claim, source) {
  if (!source || source === 'none') {
    return { text: claim, confidence: Confidence.NONE, source: '未知来源' };
  }
  if (source.startsWith('session:') || source.startsWith('file:')) {
    return { text: claim, confidence: Confidence.VERIFIED, source };
  }
  if (source === '推断') {
    return { text: claim, confidence: Confidence.UNVERIFIED, source };
  }
  return { text: claim, confidence: Confidence.LIKELY, source };
}

/**
 * 真实性自检入口
 * 当需要汇报时调用此函数
 *
 * @param {string} topic - 要汇报的主题
 * @param {string[]} potentialClaims - 可能的结论列表
 * @returns {Object} 包含过滤后的安全结论和警告
 */
function truthfulnessCheck(topic, potentialClaims) {
  const verification = verifyBeforeClaim(topic);

  if (!verification.verified) {
    return {
      safe: false,
      warning: `未能在记忆系统中验证 "${topic}" 相关内容。`,
      gap: verification.gap,
      recommendedAction: '承认不知道，或明确说明"未核实"',
      claims: potentialClaims.map(c => ({
        ...claimConfidence(c, 'none'),
        safe: false
      }))
    };
  }

  const verifiedClaims = potentialClaims.map(c => ({
    ...claimConfidence(c, 'session'),
    safe: true
  }));

  return {
    safe: true,
    evidence: verification.evidence,
    claims: verifiedClaims
  };
}

module.exports = {
  verifyBeforeClaim,
  claimConfidence,
  truthfulnessCheck,
  Confidence
};

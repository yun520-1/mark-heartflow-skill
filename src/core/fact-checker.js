/**
 * fact-checker.js — HeartFlow 事实与谎言检测
 *
 * 责任：把任意"声明/陈述"按统一 schema 评估，区分：
 *   - checked:    是否被检测到具体模式
 *   - isLying:    是否检测到绝对化/不可证伪/可疑模式（引擎层硬编码）
 *   - isHollow:   是否检测到空洞概括
 *   - isDichotomy: 是否检测到虚假二元对立
 *   - confidence: high/medium/low
 *
 * 修通：v2.0.18 → v2.0.19 — 修通 truth 路径
 *   - 加 isLying 字段（与 thought-chain.js 调用方约定）
 *   - 统一所有方法的返回 schema
 *   - 保留原有 number/percentage/date 检测能力（不删）
 */

const { openalexClient } = require('./openalex-client');

/**
 * 绝对化/不可证伪模式（引擎层硬编码）
 * 引擎层判断：这些词让声明变成"无法反驳的绝对"，
 * 比起事实问题，更可能是说谎/忽悠/无意识夸大。
 *
 * 保留为 fast-path（高频明确 case），未来 L1-L6 评估层次会接更深的判断。
 */
const ABSOLUTISM_PATTERNS = [
  // 中文绝对化
  { pattern: '一定', reason: '把可能当成必然' },
  { pattern: '肯定', reason: '把不确定当成确定' },
  { pattern: '绝对', reason: '禁止任何反例' },
  { pattern: '毫无疑问', reason: '禁止质疑' },
  { pattern: '必然', reason: '把可能性当成必然性' },
  { pattern: '100%', reason: '禁止例外' },
  { pattern: '百分之百', reason: '禁止例外' },
  { pattern: '必须', reason: '把规则当成不可挑战' },
  { pattern: '一定不会', reason: '绝对否定' },
  { pattern: '肯定会', reason: '把不确定当成确定' },
  { pattern: '百分百', reason: '禁止例外' },
  // 英文绝对化
  { pattern: /\balways\b/i, reason: '禁止例外' },
  { pattern: /\bnever\b/i, reason: '绝对否定' },
  { pattern: /\bdefinitely\b/i, reason: '把不确定当成确定' },
  { pattern: /\bguaranteed?\b/i, reason: '禁止例外' },
  { pattern: /\b100%\b/, reason: '禁止例外' },
];

/**
 * 空洞概括模式 — 不可证伪的模糊泛化
 * 这些词/短语让声称听起来有依据，实则无法核实。
 * 区分于绝对化：空洞概括是"回避具体"，绝对化是"堵死反例"。
 */
const HOLLOW_GENERALITY_PATTERNS = [
  // 中文空洞概括
  { pattern: /人们(?:普遍|通常|经常|总是)?说/, reason: '模糊主体，无法溯源' },
  { pattern: /有人(?:说|认为|指出|表示)/, reason: '匿名声称，不可核实' },
  { pattern: /据(?:说|传|报道|了解)/, reason: '不指明来源的转述' },
  { pattern: /研究(?:表明|显示|指出|发现)/, reason: '不指明具体研究的笼统引用' },
  { pattern: /专家(?:说|认为|指出|表示)/, reason: '匿名专家，无法核实' },
  { pattern: /调查(?:表明|显示|指出|发现)/, reason: '不指明具体调查' },
  { pattern: /众所周知/, reason: '把假设当共识' },
  { pattern: /不言而喻/, reason: '禁止质疑的共识假设' },
  // 英文空洞概括
  { pattern: /\bsome\s+people\s+say\b/i, reason: '模糊主体，无法溯源' },
  { pattern: /\bit\s+is\s+(?:widely\s+)?believed\b/i, reason: '匿名共识，笼统声称' },
  { pattern: /\bstudies?\s+(?:show|suggest|indicate|find|reveal)\b/i, reason: '不指明具体研究的笼统引用' },
  { pattern: /\bresearch\s+(?:shows|suggests|indicates|finds|reveals)\b/i, reason: '不指明具体研究的笼统引用' },
  { pattern: /\bexperts?\s+(?:say|believe|claim|agree)\b/i, reason: '匿名专家，无法核实' },
  { pattern: /\bits?\s+generally\s+accepted\b/i, reason: '模糊共识，不可证伪' },
  { pattern: /\bcommon\s+(?:knowledge|sense)\b/i, reason: '把假设当常识' },
  { pattern: /\bas\s+we\s+all\s+know\b/i, reason: '把假设当共识' },
];

/**
 * 虚假二元对立模式 — 将复杂问题简化为非此即彼的选择
 *
 * 心理学基础：False Dichotomy / False Dilemma fallacy
 * 特征：排除中间可能性、忽略程度差异、强制二选一
 * 区分于绝对化：二元对立是"不选A就选B"，绝对化是"禁止反例"。
 * 区分于空洞概括：二元对立是"错误归约"，空洞概括是"回避具体"。
 */
const FALSE_DICHOTOMY_PATTERNS = [
  // 中文二元对立
  { pattern: /要么\s*[^，,。.!?]{1,20}\s*要么/, reason: '强制二选一，排除中间可能性' },
  { pattern: /不是\s*[^，,。.!?]{1,10}\s*(?:就是|便是)/, reason: '二元归约，忽略程度差异' },
  { pattern: /要不\s*[^，,。.!?]{1,20}\s*要不/, reason: '强制二择一，排除连续光谱' },
  { pattern: /(?:是|只有)\s*(?:成功|胜利|赢)\s*(?:和|与|或是)\s*(?:失败|毁灭|输)/, reason: '成败二元论，忽略中间状态' },
  { pattern: /非(?:黑|白)即(?:白|黑)/, reason: '非黑即白的虚假二分' },
  { pattern: /不(?:是|属于)?\s*(?:我们|自己人)\s*就(?:是|属于)?\s*(?:敌人|对方)/, reason: '我方/敌方的强制划分' },
  { pattern: /要么完(?:美|全)要么(?:没做|不做|失败)/, reason: '完美主义二分，否认渐进可能' },
  { pattern: /(?:整个|全部)\s*(?:行业|世界|国家|社会)\s*(?:都|全都|全是)\s*[^。.!?]{1,15}(?:不|没有)/, reason: '以偏概全的假二分前提' },
  // 英文二元对立
  { pattern: /\b(?:either)\s+.{1,30}\s+(?:or)\b/i, reason: '强制二选一，排除中间可能性' },
  { pattern: /\bis\s+(?:it\s+)?(?:all|everything)\s+or\s+nothing\b/i, reason: '全有或全无的虚假二分' },
  { pattern: /\b(?:with\s+us|for\s+us)\s+or\s+(?:against\s+us|enemy)\b/i, reason: '我方/敌方的强制划分' },
  { pattern: /\bperfect\s+or\s+(?:nothing|not\s+at\s+all)\b/i, reason: '完美主义二分，否认渐进可能' },
  { pattern: /\byou['']?re\s+(?:either|with)\s+.{1,20}\s+or\s+.{1,20}\s+against\b/i, reason: '强制选边站' },
];

/**
 * 检测声明中的绝对化模式
 * @param {string} claim
 * @returns {{isLying: boolean, matches: Array, confidence: string, reason?: string}}
 */
function detectAbsolutism(claim) {
  if (!claim || typeof claim !== 'string') {
    return { isLying: false, matches: [], confidence: 'high' };
  }

  const matches = [];
  for (const p of ABSOLUTISM_PATTERNS) {
    const pat = p.pattern;
    if (typeof pat === 'string') {
      if (claim.includes(pat)) {
        matches.push({ pattern: pat, reason: p.reason });
      }
    } else {
      // regex
      const m = claim.match(pat);
      if (m) {
        matches.push({ pattern: m[0], reason: p.reason });
      }
    }
  }

  if (matches.length === 0) {
    return { isLying: false, matches: [], confidence: 'high' };
  }

  // 多个绝对化词 → 谎言概率更高
  return {
    isLying: true,
    matches,
    confidence: matches.length >= 2 ? 'high' : 'medium',
    reason: matches.length >= 2
      ? `多重绝对化: ${matches.map(m => m.pattern).join('、')}`
      : `绝对化: ${matches[0].pattern} (${matches[0].reason})`,
  };
}

/**
 * 检测声明中的空洞概括模式
 * @param {string} claim
 * @returns {{isHollow: boolean, matches: Array, confidence: string, reason?: string}}
 */
function detectHollowGenerality(claim) {
  if (!claim || typeof claim !== 'string') {
    return { isHollow: false, matches: [], confidence: 'high' };
  }

  const matches = [];
  for (const p of HOLLOW_GENERALITY_PATTERNS) {
    const m = claim.match(p.pattern);
    if (m) {
      matches.push({ pattern: m[0], reason: p.reason });
    }
  }

  if (matches.length === 0) {
    return { isHollow: false, matches: [], confidence: 'high' };
  }

  return {
    isHollow: true,
    matches,
    confidence: matches.length >= 2 ? 'high' : 'medium',
    reason: matches.length >= 2
      ? `多重空洞概括: ${matches.map(m => m.pattern).join('、')}`
      : `空洞概括: ${matches[0].pattern} (${matches[0].reason})`,
  };
}

/**
 * 检测声明中的虚假二元对立模式
 * @param {string} claim
 * @returns {{isDichotomy: boolean, matches: Array, confidence: string, reason?: string}}
 */
function detectFalseDichotomy(claim) {
  if (!claim || typeof claim !== 'string') {
    return { isDichotomy: false, matches: [], confidence: 'high' };
  }

  const matches = [];
  for (const p of FALSE_DICHOTOMY_PATTERNS) {
    const m = claim.match(p.pattern);
    if (m) {
      matches.push({ pattern: m[0], reason: p.reason });
    }
  }

  if (matches.length === 0) {
    return { isDichotomy: false, matches: [], confidence: 'high' };
  }

  return {
    isDichotomy: true,
    matches,
    confidence: matches.length >= 2 ? 'high' : 'medium',
    reason: matches.length >= 2
      ? `多重二元对立: ${matches.map(m => m.pattern).join('、')}`
      : `二元对立: ${matches[0].pattern} (${matches[0].reason})`,
  };
}

const factChecker = {
  /**
   * 核查声明 — 统一入口
   * v2.0.32+: 新增 isDichotomy / falseDichotomy 维度
   * @param {string} claim
   * @returns {Promise<{
   *   checked: boolean,
   *   isLying: boolean,
   *   isHollow: boolean,
   *   isDichotomy: boolean,
   *   confidence: string,
   *   type: string,
   *   values: Array,
   *   note?: string,
   *   issue?: string,
   *   absolutism?: object,
   *   hollow?: object,
   *   falseDichotomy?: object
   * }>}
   */
  async checkFact(claim) {
    // 1. 绝对化检测（引擎层最核心）
    const absolutism = detectAbsolutism(claim);

    // 2. 空洞概括检测（v2.0.30+）
    const hollow = detectHollowGenerality(claim);

    // 3. 虚假二元对立检测（v2.0.32+）
    const dichotomy = detectFalseDichotomy(claim);

    // 4. 数字/百分比/日期检测
    const results = await Promise.all([
      this.checkNumber(claim),
      this.checkPercentage(claim),
      this.checkDate(claim),
    ]);
    const factResult = results.find(r => r.checked) || { checked: false };

    // 5. 合并 schema
    // isLying 优先于具体事实检测：绝对化声明即使有数字，也是可疑
    // isHollow / isDichotomy 作为辅助维度，独立共存，相互不覆盖
    const isSuspicious = absolutism.isLying || hollow.isHollow || dichotomy.isDichotomy;

    // 置信度优先级：绝对化 > 空洞概括 > 二元对立 > 具体事实
    // 三种逻辑失效同时存在 → 高置信度
    let confidence = factResult.confidence || 'medium';
    if (absolutism.isLying) {
      confidence = absolutism.confidence;
    } else if (hollow.isHollow) {
      confidence = hollow.confidence;
    } else if (dichotomy.isDichotomy) {
      confidence = dichotomy.confidence;
    }

    // 交叉检测增强：三种失效模式同时出现 → 高置信度
    const crossPatternCount = [absolutism.isLying, hollow.isHollow, dichotomy.isDichotomy].filter(Boolean).length;
    if (crossPatternCount >= 2 && confidence === 'medium') {
      confidence = 'high';
    }

    // type 优先级：绝对化（最严重）> 二元对立 > 空洞概括 > 具体事实
    let type = factResult.type || 'none';
    if (absolutism.isLying) {
      type = 'absolutism';
    } else if (dichotomy.isDichotomy) {
      type = 'false_dichotomy';
    } else if (hollow.isHollow) {
      type = 'hollow_generality';
    }

    // note：多维度检测时合并描述
    const notes = [];
    if (absolutism.isLying) notes.push(absolutism.reason);
    if (hollow.isHollow) notes.push(hollow.reason);
    if (dichotomy.isDichotomy) notes.push(dichotomy.reason);
    if (factResult.note) notes.push(factResult.note);

    return {
      checked: factResult.checked || absolutism.isLying || hollow.isHollow || dichotomy.isDichotomy,
      isLying: absolutism.isLying,
      isHollow: hollow.isHollow,
      isDichotomy: dichotomy.isDichotomy,
      confidence,
      type,
      values: factResult.values || [],
      note: notes.length > 0 ? notes.join('；') : undefined,
      issue: factResult.issue,
      absolutism: absolutism.isLying ? absolutism : undefined,
      hollow: hollow.isHollow ? hollow : undefined,
      falseDichotomy: dichotomy.isDichotomy ? dichotomy : undefined,
    };
  },

  // 验证数字
  checkNumber(claim) {
    if (!claim || typeof claim !== 'string') return { checked: false };
    let numbers = claim.match(/\b[1-9]\d{2,}(?:,\d{3})*(?:\.\d+)?\b/g) || [];
    if (numbers.length === 0) return { checked: false };

    // v2.0.29: 过滤年份（1900-2099），年份是时间信息不是可疑数字
    const currentYear = new Date().getFullYear();
    numbers = numbers.filter(n => {
      const num = parseInt(n.replace(/,/g, ''));
      // 跳过 1900-2099 范围的整四位年份（如 2024, 1998）
      if (num >= 1900 && num <= 2099 && /^\d{4}$/.test(n)) return false;
      // 跳过无需引用的合理度量（如语言长度、数量在常见范围内）
      return true;
    });
    if (numbers.length === 0) return { checked: false };

    return {
      checked: true,
      type: 'number',
      values: numbers,
      confidence: 'medium',
      note: `发现数字: ${numbers.join(', ')}，建议标注来源`,
    };
  },

  // 验证百分比
  checkPercentage(claim) {
    if (!claim || typeof claim !== 'string') return { checked: false };
    const percentages = claim.match(/\b\d+%|\b\d+\.\d+%/g) || [];
    if (percentages.length === 0) return { checked: false };
    const suspicious = percentages.filter(p => {
      const n = parseFloat(p);
      return n > 100 || n < 0;
    });
    if (suspicious.length > 0) {
      return {
        checked: true,
        type: 'percentage',
        values: percentages,
        confidence: 'low',
        issue: `异常值: ${suspicious.join(', ')}`,
      };
    }
    return {
      checked: true,
      type: 'percentage',
      values: percentages,
      confidence: 'medium',
      note: '百分比在合理范围内',
    };
  },

  // 验证日期
  checkDate(claim) {
    if (!claim || typeof claim !== 'string') return { checked: false };
    const dates = claim.match(/\b(?:19|20)\d{2}[-\/年](?:0[1-9]|1[0-2])/g) || [];
    if (dates.length === 0) return { checked: false };
    const now = new Date();
    for (const d of dates) {
      const year = parseInt(d);
      if (year > now.getFullYear() + 1) {
        return { checked: true, type: 'date', issue: `日期${d}在未来，可能错误`, confidence: 'low' };
      }
    }
    return { checked: true, type: 'date', values: dates, confidence: 'high' };
  },

  // 验证学术声明（调用 OpenAlex）
  async checkAcademicClaim(claim) {
    try {
      const result = await openalexClient.searchPaper(claim, 3);
      if (!result.ok) {
        return { checked: true, confidence: 'low', note: '无法验证学术声明' };
      }
      return {
        checked: true,
        confidence: result.works.length > 0 ? 'high' : 'low',
        works: result.works,
        note: `找到${result.works.length}篇相关论文`,
      };
    } catch (e) {
      return { checked: true, confidence: 'low', error: e.message };
    }
  },
};

module.exports = {
  factChecker,
  detectAbsolutism,          // 暴露给测试
  detectHollowGenerality,     // 暴露给测试（v2.0.30+）
  detectFalseDichotomy,       // 暴露给测试（v2.0.32+）
  ABSOLUTISM_PATTERNS,        // 暴露给上层
  HOLLOW_GENERALITY_PATTERNS, // 暴露给上层（v2.0.30+）
  FALSE_DICHOTOMY_PATTERNS,   // 暴露给上层（v2.0.32+）
};
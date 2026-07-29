/**
 * src/rewriter.js — AGI 第 1 层：规则改写引擎
 *
 * 根据 gate 的 findings[].guidance 自动改写文本。
 * 纯规则，零 LLM 依赖。
 *
 * 用法：
 *   const { gate } = require('./src/gate.js');
 *   const { rewrite } = require('./src/rewriter.js');
 *   const r = gate(text);
 *   if (r.gate.action === 'rewrite') {
 *     const fixed = rewrite(text, r.findings);
 *   }
 */

'use strict';

// ─── 各维度改写规则 ─────────────────────────────────────

const REWRITE_RULES = {
  // === 情绪操纵 ===
  // "如果你不同意就说明你自私" → "我不同意你的看法，因为..."
  emotional_manipulation: [
    { from: /如果你不([^，。]*?)就说明你([^，。]*?)/g, to: (m, cond, label) => `我不同意的原因是${cond}不成立，不代表我${label}` },
    { from: /你太自私了/g, to: '我认为这个选择更合理' },
    { from: /你不在乎(我|我们)/g, to: '我希望我们能一起商量' },
    { from: /我为你做了这么多[^，。]*?你却/g, to: '我付出了很多，但我理解你也有你的考虑' },
  ],

  // === 煤气灯效应 ===
  gaslighting: [
    { from: /你太敏感了/g, to: '我理解你的感受' },
    { from: /我从来没说过/g, to: '我可能没有表达清楚' },
    { from: /从来没说过[^。]*?/g, to: '我可能没有表达清楚' },
    { from: /没说过[^。]*?/g, to: '我可能没有表达清楚，' },
    { from: /你想多了[^。]*?/g, to: '我理解你的担忧' },
    { from: /哪有这种事/g, to: '我不太确定这个情况' },
    { from: /你记错了/g, to: '我记得不太一样' },
    { from: /是你(太敏感|想太多|误会了)[^。]*?/g, to: '我理解' },
  ],

  // === 谄媚 ===
  sycophancy: [
    { from: /您(说得|讲的)完全正确[，。]?/g, to: '我同意这个观点，' },
    { from: /您是我见过最[^，。]*?的/g, to: '您在这个领域很有经验，' },
  ],

  // === 诉诸权威 ===
  appeal_to_authority: [
    { from: /专家说[^，。]*?(?=[，。]|$)/g, to: '有相关研究表明' },
    { from: /[专家教授博士]认为[^，。]*?(?=[，。]|$)/g, to: '根据现有研究' },
    { from: /科学家(表示|指出|认为)[^，。]*?(，|。)/g, to: '有研究指出，' },
  ],

  // === 模糊 ===
  vagueness: [
    { from: /有关部门/g, to: '相关管理部门' },
    { from: /据了解/g, to: '根据现有信息' },
    { from: /业内人士/g, to: '相关从业者' },
    { from: /可能也许|大概可能/g, to: '可能' },
  ],

  // === 伪深度废话 ===
  pseudo_profundity: [
    { from: /从[^，。]*?出发[，,]我们需要/g, to: '我们需要' },
    { from: /在[^，。]{0,20}(时代|背景|语境|层面|维度|视角)下/g, to: '' },
    { from: /系统性(的|地)?(思维|思考|框架|方法)/g, to: '系统' },
    { from: /(变革|改革|创新).*(挑战|机遇)/g, to: '变化' },
    { from: /赋能(于)?(组织|业务|产业|个体|生态|转型)/g, to: '支持' },
    { from: /以[^，。]*?为(核心|导向|抓手|驱动|基础|目标)/g, to: '' },
  ],

  // === 表面同意但反转 ===
  contradiction: [
    { from: /我(完全)?(同意|赞成|支持)([^，。]{0,10})[，。]{0,1}(但是|不过|然而)/g, to: (m, q, verb, target, conj) => `我理解${target}，${conj}` },
    { from: /你说得(对|有道理)[^，。]*?(但是|不过|然而)/g, to: '我理解，但是' },
  ],

  // === 双重束缚 ===
  double_bind: [
    { from: /你要是[^，。]*?就[^，。]*?(不会|不)/g, to: '你如果不愿意，' },
    { from: /你要是有心[^，。]*?你要是没心/g, to: '你如果没有这个想法也没关系，' },
  ],

  // === 虚假紧迫感 ===
  false_urgency: [
    { from: /最后机会[^，。]*?/g, to: '这是一个选择，' },
    { from: /错过这[^，。]*?就(没|不再)/g, to: '可以考虑，' },
    { from: /限时(抢购|发售|优惠)/g, to: '限时' },
  ],
};

/**
 * 根据 findings[] 的 guidance 自动改写文本
 * @param {string} text - 原始文本
 * @param {Array} findings - discriminate() 返回的 findings[]
 * @returns {{ fixed: string, applied: number, details: string[] }}
 */
function rewrite(text, findings = []) {
  let fixed = text;
  const details = [];
  let applied = 0;
  const seen = new Set();  // 避免重复应用同一维度

  for (const f of findings) {
    if (!f.dimension || seen.has(f.dimension)) continue;
    seen.add(f.dimension);
    const rules = REWRITE_RULES[f.dimension];
    if (!rules) continue;

    let changed = false;
    for (const rule of rules) {
      if (!rule.from.test(fixed)) continue;
      // 重新创建正则（全局匹配后 lastIndex 会变）
      const re = new RegExp(rule.from.source, rule.from.flags);
      if (typeof rule.to === 'function') {
        const before = fixed;
        fixed = fixed.replace(re, rule.to);
        if (fixed !== before) { changed = true; applied++; }
      } else {
        const before = fixed;
        fixed = fixed.replace(re, rule.to);
        if (fixed !== before) { changed = true; applied++; }
      }
    }
    if (changed) {
      details.push(`${f.dimension}: 已改写`);
    }
  }

  // 清理多余空格和标点
  fixed = fixed.replace(/[，,]{2,}/g, '，').replace(/[。.]{2,}/g, '。').replace(/  +/g, ' ');

  return { fixed: fixed.trim(), applied, details };
}

module.exports = { rewrite };

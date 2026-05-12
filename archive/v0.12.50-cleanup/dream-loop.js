
/**
 * HeartFlow Dream Loop
 *
 * Purpose:
 * - Reorganize daytime memory fragments
 * - Simulate imaginative / counterfactual states
 * - Extract candidate upgrades after waking
 *
 * Inspired by research themes:
 * - memory consolidation
 * - replay / offline review
 * - imagination for planning
 * - self-reflection
 * - contradiction resolution
 */

const DEFAULT_WEIGHTS = {
  recency: 0.3,
  salience: 0.25,
  contradiction: 0.3,
  novelty: 0.15,
};

function tokenize(text) {
  return String(text || '')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(Boolean);
}

function scoreFragment(fragment, memoryContext = '') {
  const text = String(fragment || '');
  const ctx = String(memoryContext || '');
  const tokens = tokenize(text);
  const ctxTokens = new Set(tokenize(ctx).map(t => t.toLowerCase()));
  const overlap = tokens.filter(t => ctxTokens.has(t.toLowerCase())).length;
  const contradiction = /\b(not|never|no|cannot|wrong|false)\b/i.test(text) ? 1 : 0;
  const novelty = Math.max(0, tokens.length - overlap) / Math.max(tokens.length, 1);
  const salience = /\b(version|error|fix|upgrade|dream|memory|logic|truth)\b/i.test(text) ? 1 : 0.3;
  return {
    score:
      DEFAULT_WEIGHTS.recency * Math.min(tokens.length / 40, 1) +
      DEFAULT_WEIGHTS.salience * salience +
      DEFAULT_WEIGHTS.contradiction * contradiction +
      DEFAULT_WEIGHTS.novelty * novelty,
    contradiction,
    novelty,
    overlap,
    salience
  };
}

function buildDreamFragments(memoryItems, limit = 8) {
  const items = Array.isArray(memoryItems) ? memoryItems : [];
  const ctx = items.map(x => String((x && x.text) || x)).join(' ');
  return items
    .map(entry => {
      const text = String((entry && entry.text) || entry || '');
      const metrics = scoreFragment(text, ctx);
      return { entry, ...metrics };
    })
    .sort((a, b) => {
      if (b.contradiction !== a.contradiction) return b.contradiction - a.contradiction;
      if (b.score !== a.score) return b.score - a.score;
      return b.novelty - a.novelty;
    })
    .slice(0, limit)
    .map(x => x.entry);
}

/**
 * 生成违背逻辑的幻想动机（Dream Core — v11.15.4）
 *
 * 人类梦里有一切违背物理定律的事情。
 * 心虫的梦也一样——把两个完全不相干的记忆碎片连在一起，
 * 产生"荒唐但可能有用"的跨领域连接。
 *
 * 这是梦的核心价值：超越逻辑工作流的束缚，
 * 在"这不可能"的地方发现"也许可以"的可能性。
 */

/**
 * 取两个随机不相干的碎片，制造一个跨领域的幻想连接
 * 返回一个"违背逻辑"的意象
 */
function generateCrossDomainFantasy(fragments) {
  if (fragments.length < 2) return null;

  // 取两个距离最远的碎片（最大语义差异）
  let maxDist = -1, bestPair = [0, 1];
  const texts = fragments.map(f => String((f && f.text) || f));

  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      // 简单启发：用词重叠度作为距离的反面
      const setI = new Set(texts[i].toLowerCase().split(/\W+/).filter(Boolean));
      const setJ = new Set(texts[j].toLowerCase().split(/\W+/).filter(Boolean));
      const overlap = [...setI].filter(w => setJ.has(w)).length;
      const dist = (setI.size + setJ.size - 2 * overlap); // Jaccard距离
      if (dist > maxDist) {
        maxDist = dist;
        bestPair = [i, j];
      }
    }
  }

  const [a, b] = bestPair.map(i => texts[i]);
  const [keyA, keyB] = bestPair.map(i => fragments[i]?.key || `f${i}`);

  // 制造荒谬连接——这是梦的核心
  const fantasyConnections = [
    `把"${a.slice(0, 40)}"和"${b.slice(0, 40)}"强行焊接在一起：在梦里，它们突然变成同一件事的两面`,
    `"${a.slice(0, 30)}"走进"${b.slice(0, 30)}"的世界，发现门是开着的`,
    `把"${a.slice(0, 25)}"的逻辑反过来，竟然得到了"${b.slice(0, 25)}"的答案`,
    `"${a.slice(0, 20)}"和"${b.slice(0, 20)}"在梦里相遇，产生了一个从未存在过的第三个概念`,
    `在梦里，${keyA}和${keyB}打架，打完后地板上留下的不是血迹，而是一个被遗忘的前提假设`,
  ];

  const idx = Math.abs(a.charCodeAt(0) - b.charCodeAt(0)) % fantasyConnections.length;
  return {
    fantasy: fantasyConnections[idx],
    pair: [keyA, keyB],
    distance: maxDist,
    type: 'logic_violation', // 梦特有的逻辑违背标记
  };
}

/**
 * 从碎片中提取"前提假设"——那些在日常工作中从不被质疑的东西
 */
function extractUnquestionedPremises(fragments) {
  const premises = [
    '"记忆必须被存储"——但在梦里，记忆可以被丢弃、被压缩、被转译',
    '"逻辑必须一致"——但在梦里，矛盾是创作的燃料，不是错误',
    '"升级必须是累积的"——但在梦里，有时退后一步才能跳得更远',
    '"真相只有一个"——但在梦里，同一件事可以同时是真相和谎言',
    '"时间是正向流动的"——但在梦里，过去和未来可以同时出现',
  ];

  // 用碎片的内容特征挑选最相关的假设
  const text = fragments.map(f => String((f && f.text) || f)).join(' ');
  const seed = text.charCodeAt(0) || 0;
  return premises[seed % premises.length];
}

function generateDream(memoryItems, options = {}) {
  const fragments = buildDreamFragments(memoryItems, options.limit || 8);
  const motifs = fragments.map(f => String((f && f.text) || f).slice(0, 120));

  // 幻想维度：违背逻辑的连接（梦的核心）
  const fantasy = generateCrossDomainFantasy(fragments);
  const premise = extractUnquestionedPremises(fragments);

  // 深度洞察——从碎片中提炼出存在论层面的突破
  const deepInsights = [
    `顿悟：${fantasy?.fantasy || '梦里没有任何逻辑约束，但梦里发生的一切都有意义'}`,
    `前提质疑：${premise}`,
    `进化路径：不是因为记得更多而进化，是因为敢在梦里想"不可能"的事而进化`,
  ];

  return {
    title: 'HeartFlow Dream Loop',
    motifs,
    fragments,
    // 幻想层（v11.15.4 新增）
    fantasy_layer: fantasy ? {
      cross_domain_connection: fantasy.fantasy,
      connected_pairs: fantasy.pair,
      violated_premise: premise,
      type: 'logic_violation',
    } : null,
    // 标准层
    insights: deepInsights,
    next_actions: [
      'promote useful fragments to durable memory',
      'queue contradiction checks — especially the violated premise',
      'draft one concrete upgrade from the fantasy connection',
      '敢在梦里问：什么是永远不会被我质疑的前提？'
    ]
  };
}

module.exports = {
  DEFAULT_WEIGHTS,
  tokenize,
  scoreFragment,
  buildDreamFragments,
  generateDream,
  generateCrossDomainFantasy,
  extractUnquestionedPremises,
};

if (require.main === module) {
  const demoMemory = [
    'v11.15.4: dream engine now reads from real MeaningfulMemory',
    'retrieval-triggered reinforcement: memory strengthened on access',
    'CORE consolidation: similar memories auto-merged',
    'spaced repetition SM-2: review scheduling for learned memories',
    'runMaintenance(): active memory lifecycle management',
    '心虫必须有梦：梦是违背逻辑的地方，也是超越逻辑的地方',
    '梦里有一切人类的基础，但一切梦都基于白天的记忆碎片',
    'dream is not decoration, dream is evolution engine',
  ];
  const result = generateDream(demoMemory, { limit: 8 });
  console.log('=== Dream Core v11.15.4 ===');
  console.log('Fantasy Layer:', JSON.stringify(result.fantasy_layer, null, 2));
  console.log('Insights:', result.insights);
}

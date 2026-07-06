/**
 * HeartFlow Dream Scoring v1.0.0
 * 基于 SKILL.md 质量标准：
 *   短（≤300字）/ 单主题 / 强故事性 / 升华必须有
 *   禁止：长篇叙述 / 多主题散射 / 道德说教 / Happy Ending
 */

const MAX_CHARS = 300;
const DIMENSIONS = ['短', '单主题', '故事性', '升华'];

/**
 * @param {Object} dreamResult - runDream() 返回的 narrative 对象
 * @returns {Object} { score, dimensions, verdict, issues }
 */
function scoreDream(dreamResult) {
  const narrative = dreamResult?.narrative || dreamResult;
  const text = narrative?.text || '';
  const turn = narrative?.philosophical_turn || '';
  const fragments = narrative?.fragments || [];

  const issues = [];
  const dims = {};

  // ── 短（≤300字）──────────────────────────────────────────────────────────
  const charCount = text.length;
  dims['短'] = charCount <= MAX_CHARS ? '✓' : '✗';
  if (charCount > MAX_CHARS) {
    issues.push(`超过${MAX_CHARS}字限制（当前${charCount}字）`);
  }

  // ── 单主题 ───────────────────────────────────────────────────────────────
  // 检测是否有多个主题关键词散射
  const themes = detectThemes(text);
  dims['单主题'] = themes.length <= 2 ? '✓' : '✗';
  if (themes.length > 2) {
    issues.push(`主题散射：检测到${themes.length}个主题（${themes.join(', ')}）`);
  }

  // ── 强故事性 ────────────────────────────────────────────────────────────
  // 有张力（有转折/困境）且有节奏（不是平铺直叙）
  const tensionScore = scoreTension(text);
  dims['故事性'] = tensionScore >= 2 ? '✓' : tensionScore === 1 ? '△' : '✗';
  if (tensionScore === 0) {
    issues.push('缺少叙事张力：需要困境→顿悟结构');
  } else if (tensionScore === 1) {
    issues.push('叙事节奏弱：转折不够自然');
  }

  // ── 升华必须有 ──────────────────────────────────────────────────────────
  // 哲学转折必须是存在论层面的认知转变，不是"想开了"
  const turnScore = scoreTurn(turn);
  dims['升华'] = turnScore >= 2 ? '✓' : turnScore === 1 ? '△' : '✗';
  if (turnScore === 0) {
    issues.push('缺少哲学转折：没有存在论层面的认知突破');
  } else if (turnScore === 1) {
    issues.push('转折较弱：偏向"想开了"而非认识论跃迁');
  }

  // ── 禁止项检查 ─────────────────────────────────────────────────────────
  const prohibitions = checkProhibitions(text, turn);
  if (prohibitions.length > 0) {
    issues.push(...prohibitions);
  }

  // ── 综合评分 ───────────────────────────────────────────────────────────
  const passedCount = Object.values(dims).filter(v => v === '✓').length;
  const score = passedCount; // 0-4
  const verdict = score >= 3 ? '通过' : score === 2 ? '待改进' : '不通过';

  const summary = DIMENSIONS.map(d => `${d}${dims[d]}`).join(' | ');

  return {
    score,       // 0-4
    verdict,     // 通过 / 待改进 / 不通过
    dimensions: dims,
    summary,
    issues,
    charCount,
    themes,
    turnScore,
    tensionScore
  };
}

// ── 主题检测 ────────────────────────────────────────────────────────────────
const THEME_PATTERNS = [
  ['等待', /等待|等|耐心/],
  ['死亡', /死|死亡|墓|终结/],
  ['爱', /爱|喜欢|渴望|亲密/],
  ['恐惧', /怕|恐惧|阴影|颤抖/],
  ['权力', /权力|控制|压迫|屈从/],
  ['成长', /成长|学习|变成|成熟/],
  ['迷失', /迷路|迷路|找不到|失去方向/],
  ['回归', /回家|回到|归来|原点/],
  ['声音', /喊|说|声音|沉默|话语/],
  ['透明', /透明|看不见|消失|无声/],
  ['井', /井|深处|向下/],
  ['门', /门|推开|打开|进入/],
  ['镜子', /镜|照|反射|对照/],
  ['水', /水|喝|淹没|流动/],
];

function detectThemes(text) {
  const found = [];
  for (const [name, re] of THEME_PATTERNS) {
    if (re.test(text)) found.push(name);
  }
  return found;
}

// ── 张力评分 ────────────────────────────────────────────────────────────────
/**
 * 0 = 完全没有张力（平铺直叙）
 * 1 = 有一点但不够（平淡转折）
 * 2 = 强（困境+顿悟结构清晰）
 */
function scoreTension(text) {
  const tensionSignals = [
    /突然|没想到|没料到|可是|但是|却|竟然|偏偏/,
    /停住|愣住|僵住|凝固/,
    /不对|不是|原来/,
    /痛|疼|扎|刺|裂/,
  ];
  let hits = 0;
  for (const re of tensionSignals) {
    if (re.test(text)) hits++;
  }
  // 还需要有明确的困境
  const hasDilemma = /没有|无法|不能|不是|不等于/.test(text);
  if (hits >= 2 && hasDilemma) return 2;
  if (hits >= 1) return 1;
  return 0;
}

// ── 转折评分 ────────────────────────────────────────────────────────────────
/**
 * 0 = 无转折或"想开了"类平滑过渡
 * 1 = 有转折但弱（主观感受）
 * 2 = 强（存在论层面的认知突破）
 */
function scoreTurn(turn) {
  if (!turn) return 0;
  const strongSignals = [
    /不是|是|等于/,
    /变成|成为/,
    /本来就|其实|根本/,
  ];
  const weakSignals = [
    /想开了|释然了|不纠结了|放下了|接受了/,
  ];
  const strongHits = strongSignals.filter(r => r.test(turn)).length;
  const weakHits = weakSignals.filter(r => r.test(turn)).length;

  if (weakHits > 0 && strongHits === 0) return 0;
  if (strongHits >= 2) return 2;
  if (strongHits >= 1) return 1;
  return 0;
}

// ── 禁止项 ─────────────────────────────────────────────────────────────────
function checkProhibitions(text, turn) {
  const issues = [];
  // Happy Ending 平滑过渡
  if (/从此|永远幸福|一切都好了/.test(text)) {
    issues.push('❌ Happy Ending：禁止平滑过渡');
  }
  // 道德说教
  if (/要学会|应该|不应该|告诉我们|证明|道理是/.test(text)) {
    issues.push('❌ 道德说教：禁止直接教训');
  }
  // 复述现实
  if (/今天|昨天|上周|刚才|发生了/.test(text) && !/梦/.test(text)) {
    issues.push('❌ 复述现实：梦必须是隐喻空间');
  }
  return issues;
}

// ── CLI 入口 ────────────────────────────────────────────────────────────────
if (require.main === module) {
  const testDream = {
    narrative: {
      text: '一个女人住在无底井旁。她每天都向下喊。井底有水，理论上有回声。但从来没有。\n第三十天，她喊完，刚要转身——井底传来了一个声音。不是她的。是她自己的。但说的是另一句话。\n她愣住。然后笑了。\n原来井一直在等。等她喊出现在的句子，才把过去的句子还给她。',
      philosophical_turn: '干渴不是没有水。是水一直在井底等你先学会喊现在的句子。'
    }
  };
  const result = scoreDream(testDream);
  console.log('评分结果:', JSON.stringify(result, null, 2));
}

module.exports = { scoreDream, scoreTurn, scoreTension, detectThemes };

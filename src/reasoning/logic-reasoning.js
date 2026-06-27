/**
 * logic-reasoning.js v1.0.0 — 逻辑推理引擎
 *
 * 四个核心能力：
 *   1. 推理类型检测 — 识别输入用的是哪种推理方式（演绎/归纳/溯因/类比/统计/因果）
 *   2. 前提检查 — 检查论证的前提是否成立、是否隐含、是否被遗漏
 *   3. 谬误识别 — 识别常见逻辑谬误（稻草人/滑坡/虚假二分/诉诸权威/循环论证等12类）
 *   4. 推理框架推荐 — 根据问题类型推荐最佳推理框架
 *
 * 注册到 heartflow.js dispatch:
 *   'logicReasoning.analyze'       — 四合一分析
 *   'logicReasoning.detectType'    — 只检测推理类型
 *   'logicReasoning.checkPremises' — 只检查前提
 *   'logicReasoning.findFallacies' — 只识别谬误
 *   'logicReasoning.recommendFramework' — 只推荐框架
 *
 * pipeline stage: 'logicReasoning' (Stage 3.5, 依赖 deepCognition + heartLogic)
 */

// ─── 辅助：独立关键词检测 ──────────────────────────────────
// 每个信号是一组独立关键词，任意匹配即得分
// 比正则的 A.*B 顺序匹配更容忍中文自然语言的语序变化
function _matchKeywords(input, keywords) {
  let hits = 0;
  const matched = [];
  for (const kw of keywords) {
    if (input.includes(kw)) {
      hits++;
      matched.push(kw);
    }
  }
  return { hits, matched, ratio: keywords.length > 0 ? hits / keywords.length : 0 };
}

function _matchAnyRegex(input, patterns) {
  for (const re of patterns) {
    if (re.test(input)) return true;
  }
  return false;
}

// ─── 推理类型检测 ──────────────────────────────────────────
const REASONING_PATTERNS = [
  {
    id: 'deductive',
    name: '演绎推理',
    desc: '从一般前提推出具体结论（如果A则B，A成立→B成立）',
    keywords: [['如果', '那么', '则', '所有', '都', '凡是', '必然', '一定成立', '必定', '毫无疑问', '所以', '因此', '可得', '可推出', '三段论', '大前提', '小前提', 'therefore', 'conclusion', 'if', 'then', 'must', 'always', 'every', 'all', 'because', 'since', 'thus', 'hence', 'deduce', 'imply', 'to the right', 'to the left', 'is the', 'there are', 'there is', 'than', 'more than', 'less than', 'equal', 'same as', 'order', 'position', 'between', 'first', 'second', 'third', 'last', 'leftmost', 'rightmost']],
    // 至少命中3个关键词或1个正则
    minKeywords: 3,
    regexBonus: [/如果.+那么|若.+则|只要.+就|所有.+都|凡是.+都/i, /必然|一定成立|必定|毫无疑问|因此/i],
    weight: 0.25,
  },
  {
    id: 'inductive',
    name: '归纳推理',
    desc: '从多个具体观察推出一般规律',
    keywords: [['根据', '观察', '数据', '实验', '案例', '统计', '调查', '样本', '通常', '往往', '一般', '大多数', '经常', '普遍', '表明', '显示', '证明', '支持', '总结', '归纳', '得出', '概率', '可能性', '趋势', '倾向', 'pattern', 'correlation', 'data', 'experiment', 'observation', 'sample', 'usually', 'generally', 'often', 'likely', 'tendency', 'evidence']],
    minKeywords: 3,
    regexBonus: [/根据.*(观察|数据|实验|案例|统计|调查|样本)/i, /(通常|往往|一般|大多数|经常|普遍).*来说?/i, /从.*(例子|案例|数据).*(总结|归纳|得出)/i],
    weight: 0.2,
  },
  {
    id: 'abductive',
    name: '溯因推理',
    desc: '从现象推断最可能的解释',
    keywords: [['最可能', '最合理', '最好的解释', '说明', '意味着', '暗示', '表明', '可能', '大概', '也许', '推测', '推断', '猜测', '假设', '假定', '根据现有证据', '根据现有信息', '根据现有线索']],
    minKeywords: 2,
    regexBonus: [/最(好|可能|合理)的(解释|原因|假设|推测)/i, /这(就)?(说明|意味着|暗示|表明)/i, /(推测|推断|猜测|假设)/i],
    weight: 0.2,
  },
  {
    id: 'analogical',
    name: '类比推理',
    desc: '基于相似性从已知推未知',
    keywords: [['就像', '如同', '好比', '类似于', '类比', '比喻', '一样', '相同', '类似', '参照', '借鉴', '参考', '仿照', 'like', 'similar', 'analogous', 'compare', 'resemble', 'parallel']],
    minKeywords: 2,
    regexBonus: [/就(像|如同|好比)|类似于|类比|比喻/i, /和.*一样|跟.*相同|与.*类似|像.*那样/i],
    weight: 0.25,
  },
  {
    id: 'causal',
    name: '因果推理',
    desc: '基于因果关系推导',
    keywords: [['导致', '引起', '造成', '引发', '触发', '促使', '使得', '因果', '原因', '结果', '影响', '作用', '效应', '机制', '原理', 'cause', 'effect', 'lead to', 'result in', 'because', 'due to', 'impact', 'influence']],
    minKeywords: 2,
    regexBonus: [/(导致|引起|造成|引发|触发|促使|使得)/i, /因果|原因.*结果|结果.*原因/i],
    weight: 0.2,
  },
  {
    id: 'statistical',
    name: '统计推理',
    desc: '基于概率和数据的推理',
    keywords: [['%', '百分比', '概率', '占比', '比例', '比率', '平均', '中位', '众数', '方差', '标准差', '正态', '分布', '样本', '总体', '误差', '置信', '显著', '相关', '回归']],
    minKeywords: 2,
    regexBonus: [/\d+%|百分比|概率|占比|比例|比率/i, /平均|中位|方差|标准差|正态|分布/i, /统计.*(显示|表明|证明|支持|否定)/i],
    weight: 0.2,
  },
];

// ─── 谬误检测模式 ──────────────────────────────────────────
// 每个谬误有：关键词组（独立命中）+ 正则（顺序命中）
const FALLACY_PATTERNS = [
  {
    id: 'strawman',
    name: '稻草人谬误',
    desc: '曲解对方观点，攻击一个更容易反驳的版本',
    keywords: [
      ['your意思是', '按你的意思', '按你的逻辑', '按你的说法', '所以你意思是', '你的观点是', '你的意思是不是', '所以你的意思是', 'what you are saying', 'so you mean', 'so what you are saying is', 'so you are saying', 'your argument is', 'you claim that'],
      ['只要', '总是', '永远', '完全', '全部', '所有', '从来不', '绝对'],
    ],
    minKeywordGroups: 1,
    minKeywords: 1,
    regexBonus: [/你(的)?(意思|说)是(说)?.*(只要|只有|总是|永远|完全)/i, /按你(的)?(说法|逻辑|意思).*(荒谬|可笑|不对|站不住脚)/i],
    weight: 0.4,
  },
  {
    id: 'slipperySlope',
    name: '滑坡谬误',
    desc: '假设A会发生，就会引发B、C、D……直到灾难性结果',
    keywords: [
      ['如果允许', '一旦', '开了口子', '开先例', '打开缺口', 'if we allow', 'slippery slope', 'then soon', 'next thing', 'before long'],
      ['就会', '将会', '最终', '一步一步', '渐进的', '滑向', '走向', 'will lead to', 'will cause', 'will result in', 'eventually', 'step by step'],
      ['灾难', '崩溃', '毁灭', '完蛋', '无法控制', '不可收拾', '无法挽回', '无法挽救', '不可挽回', 'disaster', 'catastrophe', 'collapse', 'destruction', 'out of control', 'irreversible'],
    ],
    // 需要至少命中3个关键词（分布在至少2组中）
    minKeywordGroups: 2,
    minKeywords: 3,
    regexBonus: [/如果.*(允许|接受|同意).*就会/i, /今天.*(允许|放任|不制止).*明天.*就会/i, /从.*到.*再到.*最终|一步一步.*走向|渐进.*滑向/i],
    weight: 0.3,
  },
  {
    id: 'falseDichotomy',
    name: '虚假二分谬误',
    desc: '只给出两个选项，忽略中间地带和其他可能性',
    keywords: [
      ['要么', '或者', '不是就是', '不是a就是b', 'either', 'or', 'either-or', 'either or'],
      ['只有', '唯一', '别无选择', '没有其他', '没有别的', '别无他路', '仅此', '没有第三条路', '没有第三条', '二选一', 'only choice', 'only option', 'no other', 'no alternative', 'no middle ground'],
    ],
    minKeywordGroups: 1,
    minKeywords: 1,
    regexBonus: [/要么.*要么|不是.*就是|或者.*或者.*(没有|别无|只有)/i, /(只有|唯一).*(选择|选项|出路|办法|方案).*(要么|或者|否则)/i, /没有第三条路|没有别的选择|二选一|非此即彼/i],
    weight: 0.35,
  },
  {
    id: 'appealToAuthority',
    name: '诉诸权威谬误',
    desc: '以权威人士的说法代替论证本身',
    keywords: [
      ['专家', '教授', '博士', '院士', '权威', '领导人', '创始人', 'CEO', '爱因斯坦', '牛顿', '达尔文', '图灵', '霍金', 'expert', 'professor', 'doctor', 'authority', 'scientist', 'Einstein', 'Newton', 'Darwin', 'Turing', 'Hawking'],
      ['说', '认为', '表示', '指出', '声称', '说过', '认为'],
    ],
    minKeywordGroups: 2,
    minKeywords: 2,
    regexBonus: [/(专家|教授|博士|院士|权威).*(说|认为|表示|指出|声称)/i, /(根据|按照).*(专家|权威|官方).*(意见|说法|指示)/i],
    weight: 0.3,
  },
  {
    id: 'circularReasoning',
    name: '循环论证',
    desc: '结论本身就是前提，论证绕圈子',
    keywords: [
      ['因为', '所以'],
      ['循环论证', '同义反复', '兜圈子', '绕圈子'],
    ],
    minKeywordGroups: 1,
    minKeywords: 1,
    // 特殊检测：A因为B，B因为A（需要同段内检测）
    specialCheck: (input) => {
      // 检查"X因为Y"和"Y因为X"模式是否同时出现
      const causeEffectPairs = [];
      const causeRe = /(.{2,20})因为(.{2,20})/g;
      let m;
      while ((m = causeRe.exec(input)) !== null) {
        causeEffectPairs.push({ cause: m[1].trim(), effect: m[2].trim() });
      }
      for (let i = 0; i < causeEffectPairs.length; i++) {
        for (let j = i + 1; j < causeEffectPairs.length; j++) {
          // 检查A因为B和B因为A（双向互指）
          if ((causeEffectPairs[i].cause.includes(causeEffectPairs[j].effect) || causeEffectPairs[j].effect.includes(causeEffectPairs[i].cause)) &&
              (causeEffectPairs[j].cause.includes(causeEffectPairs[i].effect) || causeEffectPairs[i].effect.includes(causeEffectPairs[j].cause))) {
            return 0.5;
          }
        }
      }
      // 检查"这本书好因为它写得好，它写得好所以它是一本好书"模式
      if (/因为.+所以|之所以.+是因为/i.test(input)) {
        const words = input.replace(/[，。！？、；：""''（）()\s]/g, ' ').split(/\s+/).filter(w => w.length > 1);
        const uniqueWords = new Set(words);
        // 如果去重后词少（不到总词的60%），可能是循环论证
        if (uniqueWords.size > 0 && uniqueWords.size / words.length < 0.6 && words.length > 5) {
          return 0.35;
        }
      }
      return 0;
    },
    weight: 0.35,
  },
  {
    id: 'adHominem',
    name: '人身攻击谬误',
    desc: '攻击提出观点的人，而不是反驳观点本身',
    keywords: [
      ['智商', '水平', '能力', '资格', '经验', '学历', '背景', 'intelligence', 'qualification', 'experience', 'education', 'degree', 'background'],
      ['不够', '不足', '差', '低', '不行', '没有', '不懂', '不理解', '不明白', '外行', '门外汉', 'not enough', 'lack', 'no', "don't understand", 'not qualified', 'incompetent'],
      ['有什么资格', '还好意思', '没读过', '没上过', '没学过', 'what right', 'who are you to', "you didn't even", "you haven't"],
    ],
    minKeywordGroups: 2,
    minKeywords: 2,
    regexBonus: [/你.*(智商|水平|能力|资格).*(不够|不足|差|低|不行)/i, /(你|他|她).*(就是|只是|不过是).*(不懂|不理解|不明白|外行)/i],
    weight: 0.3,
  },
  {
    id: 'hastyGeneralization',
    name: '以偏概全谬误',
    desc: '基于不充分或偏差的样本得出普遍结论',
    keywords: [
      ['我认识的', '我遇到的', '我身边的', '我见过的', 'I met', 'I know', 'I encountered', 'I saw', 'I have seen'],
      ['都', '全都', '全部', '每一个', '所有', '总是', '从来不', '一向', 'all', 'every', 'always', 'never', 'none'],
      ['证明', '说明', '代表', '代表所有', '足以说明', '充分说明'],
    ],
    minKeywordGroups: 2,
    minKeywords: 2,
    regexBonus: [/(我|我身边|我认识的|我遇到的).*(都|全都|全部|每一个)/i, /(一个|一次|一个例子).*(就|就能|就足够|足以).*(证明|说明|表明|代表)/i, /(几次|几个).*(案例|例子|情况).*(证明|说明|代表).*(普遍|所有|全部)/i],
    weight: 0.3,
  },
  {
    id: 'falseCause',
    name: '虚假因果谬误',
    desc: '把相关性误认为因果关系',
    keywords: [
      ['因为', '所以', '因此', '因而', '于是', 'because', 'therefore', 'thus', 'hence', 'since', 'so'],
      ['之后', '同时', '伴随', '那天', '当时', '每当', 'after', 'whenever', 'every time', 'following', 'simultaneously'],
      ['相关', '关联', '联系', '有关', '有关系', 'correlation', 'related', 'associated', 'connected', 'link', 'relationship'],
      ['就能', '就会', '能让', '可以让', '导致', 'makes', 'causes', 'leads to', 'results in', 'brings about']
    ],
    minKeywordGroups: 1,
    minKeywords: 1,
    regexBonus: [/因为.*(发生了|出现|增加|减少).*所以.*(发生了|出现|增加|减少)/i, /(相关|关联|联系).*(就是|意味着|等于|证明).*(因果|原因|导致|引起)/i],
    weight: 0.3,
  },
  {
    id: 'appealToEmotion',
    name: '诉诸情感谬误',
    desc: '用情感代替理性论证',
    keywords: [
      ['难道', '忍心', '能忍心', '良心', '良知', '人性', '道德'],
      ['可怜', '无辜', '悲惨', '痛苦', '困难'],
      ['在乎', '关心', '在意', '重视'],
    ],
    minKeywordGroups: 2,
    minKeywords: 2,
    regexBonus: [/(你|你们).*(难道|真的|忍心|能忍心).*(看着|看到|想到|让)/i, /(那些|多少|无数).*(可怜|无辜|悲惨|痛苦)/i],
    weight: 0.3,
  },
  {
    id: 'appealToNature',
    name: '诉诸自然谬误',
    desc: '因为某事是"自然的"，所以它是好的/正确的',
    keywords: [
      ['天然', '自然', '传统', '古老', '天然就是', '自然是'],
      ['好', '健康', '正确', '安全', '有益', '优于', '好于', '胜过'],
      ['化学', '人工', '合成', '添加'],
    ],
    minKeywordGroups: 2,
    minKeywords: 2,
    regexBonus: [/(天然|自然|天然).*(就|就是|总是|才).*(好|健康|正确|安全)/i, /(化学|人工|合成|添加).*(就是|总是|一定).*(有害|不好|危险)/i],
    weight: 0.3,
  },
  {
    id: 'bandwagon',
    name: '诉诸大众谬误',
    desc: '因为很多人相信或做某事，所以它是正确的',
    keywords: [
      ['大多数', '多数', '绝大部分', '几乎所有人', '主流', '流行', '热门', '趋势', '大众', 'most', 'majority', 'everyone', 'everybody', 'popular', 'mainstream', 'trending', 'common'],
      ['大家都', '人人都在', '所有人都在', '每个人都在', '那么多人', '无数人', '这么多人', '都这么', '都这样', 'everyone is', 'everyone uses', 'all people', 'most people', 'so many people'],
      ['一定对', '一定正确', '一定是', '就是对的', '就是正确的'],
    ],
    minKeywordGroups: 1,
    minKeywords: 1,
    regexBonus: [/(大多数|多数|绝大部分|几乎所有人).*(都|认为|相信|同意|支持)/i, /(流行|热门|主流|趋势).*(就是|总是|一定是).*(对的|正确的|好|方向)/i],
    weight: 0.3,
  },
  {
    id: 'tuQuoque',
    name: '你也一样谬误',
    desc: '用对方的错误来为自己辩护，而不是正面回应',
    keywords: [
      ['你也', '你同样', '你自己', '你不是也', '你不也一样'],
      ['凭什么', '还好意思', '有什么资格'],
    ],
    minKeywordGroups: 2,
    minKeywords: 2,
    regexBonus: [/(你|你们).*(也|同样|自己).*(不也|不是也|不也一样)/i, /(你|你们).*(自己).*(没|不).*(做到|做好|做对).*还好意思/i],
    weight: 0.3,
  },
];

// ─── 推理框架推荐 ──────────────────────────────────────────
const FRAMEWORKS = {
  chainOfThought: {
    name: '思维链 (Chain-of-Thought)',
    desc: '逐步推理，每步只做一件简单的事',
    useWhen: ['calculation', 'complex_multi_step', 'logical_deduction', 'math', 'algorithm'],
    confidence: 0.8,
  },
  treeOfThoughts: {
    name: '思维树 (Tree-of-Thoughts)',
    desc: '同时探索多条推理路径，回溯换路',
    useWhen: ['planning', 'strategy', 'open_ended', 'creative_decision', 'tradeoff'],
    confidence: 0.75,
  },
  graphOfThoughts: {
    name: '思维图 (Graph-of-Thoughts)',
    desc: '推理路径可分支可合并，形成网络',
    useWhen: ['analysis', 'multi_factor', 'system_analysis', 'cross_domain'],
    confidence: 0.7,
  },
  firstPrinciples: {
    name: '第一性原理',
    desc: '拆解到不可再分的基本事实，再重新构建',
    useWhen: ['innovation', 'breakthrough', 'assumption_check', 'radical_solution'],
    confidence: 0.7,
  },
  redTeam: {
    name: '红队思维 (Red-Teaming)',
    desc: '主动寻找反例和漏洞，挑战已有结论',
    useWhen: ['safety', 'verification', 'risk_assessment', 'debate'],
    confidence: 0.65,
  },
  abductive: {
    name: '溯因推理',
    desc: '从现象倒推最可能的解释',
    useWhen: ['diagnosis', 'debugging', 'fault_troubleshoot', 'reverse_engineering'],
    confidence: 0.65,
  },
  dialectical: {
    name: '辩证法',
    desc: '正-反-合，从矛盾中寻找更高层次的统一',
    useWhen: ['philosophy', 'value_conflict', 'polarized_views', 'complex_social'],
    confidence: 0.6,
  },
  probabilistic: {
    name: '概率推理',
    desc: '用概率量化不确定性，贝叶斯更新信念',
    useWhen: ['data_driven', 'risk', 'uncertainty', 'prediction'],
    confidence: 0.6,
  },
  multiPerspective: {
    name: '多视角推理',
    desc: '从不同角色的视角看同一个问题',
    useWhen: ['interpersonal', 'product_design', 'policy', 'cross_cultural'],
    confidence: 0.6,
  },
};

// ─── 问题类型分类（用于框架推荐） ─────────────────────────
const PROBLEM_PATTERNS = {
  calculation: [/多少|计算|求|等于|数字|总和|平均|概率|统计|证明|推导|数学|方程|公式|算法|函数|积分|导数|矩阵/i],
  planning: [/如何|怎么|方法|步骤|过程|方案|策略|计划|路线|规划|安排|组织|准备|实现|部署|搭建/i],
  analysis: [/为什么|原因|解释|原理|机制|影响|结果|含义|意味着|分析|对比|比较|区别|差异|关系|关联|联系/i],
  debate: [/对不对|是否|正确|真假|判断|评价|优劣|利弊|争论|辩论|反驳|支持|反对|争议|质疑|挑战/i],
  creative: [/创新|创意|设计|发明|创造|方案|思路|灵感|点子|如果.*会|假设.*那么|设想|想象|构想/i],
  diagnosis: [/为什么.*(坏了|出问题|不对|不工作|异常|报错|崩溃|失败)|故障|错误|bug|异常|排查|诊断|定位/i],
  prediction: [/未来|预测|展望|趋势|走向|前景|发展方向|会.*发生|将.*出现|将.*改变|将.*成为|将.*到来/i],
  philosophical: [/意义|价值|本质|存在|自由|正义|真理|美|善|恶|道德|伦理|生命|意识|自我|灵魂|宇宙|时间|空间/i],
};

const PROBLEM_FRAMEWORK_MAP = {
  calculation: ['chainOfThought', 'probabilistic'],
  planning: ['treeOfThoughts', 'multiPerspective'],
  analysis: ['graphOfThoughts', 'firstPrinciples'],
  debate: ['dialectical', 'redTeam'],
  creative: ['treeOfThoughts', 'firstPrinciples'],
  diagnosis: ['abductive', 'redTeam'],
  prediction: ['probabilistic', 'chainOfThought'],
  philosophical: ['dialectical', 'multiPerspective'],
};

class LogicReasoning {
  constructor(options = {}) {
    this.version = '1.0.0';
    this._history = [];
    this._maxHistory = options.maxHistory || 50;
  }

  /**
   * 主入口：四合一分析
   */
  analyze(input, options = {}) {
    if (!input || typeof input !== 'string') {
      return { error: 'input is required', valid: false };
    }

    const startTime = Date.now();

    const reasoningType = this.detectType(input);
    const premiseCheck = this.checkPremises(input);
    const fallacies = this.findFallacies(input);
    const frameworkRecommendation = this.recommendFramework(input, reasoningType);

    const result = {
      reasoningType,
      premiseCheck,
      fallacies,
      frameworkRecommendation,
      meta: {
        duration: Date.now() - startTime,
        inputLength: input.length,
        timestamp: Date.now(),
      },
    };

    this._history.push({
      input: input.slice(0, 100),
      type: reasoningType.primaryType,
      fallacyCount: fallacies.length,
      ts: Date.now(),
    });
    if (this._history.length > this._maxHistory) {
      this._history.shift();
    }

    return result;
  }

  /**
   * 1. 推理类型检测
   */
  detectType(input) {
    const results = [];
    let bestType = 'general';
    let bestScore = 0;

    for (const pattern of REASONING_PATTERNS) {
      let score = 0;
      const matchedKeywords = [];

      // 关键词检测
      for (const kwGroup of pattern.keywords) {
        const { hits, matched } = _matchKeywords(input, kwGroup);
        score += hits * pattern.weight;
        matchedKeywords.push(...matched);
      }

      // 正则奖励
      if (pattern.regexBonus) {
        for (const re of pattern.regexBonus) {
          if (re.test(input)) {
            score += pattern.weight * 1.5;
            matchedKeywords.push('[re:' + re.source.slice(0, 30) + ']');
          }
        }
      }

      score = Math.min(score, 1.0);

      if (score > 0) {
        results.push({ type: pattern.id, name: pattern.name, score, matched: matchedKeywords.slice(0, 5) });
        if (score > bestScore) {
          bestScore = score;
          bestType = pattern.id;
        }
      }
    }

    // 如果所有类型得分都很低，判定为综合
    if (bestScore < 0.2) {
      bestType = 'general';
    }

    return {
      primaryType: bestType,
      primaryScore: Math.round(bestScore * 100) / 100,
      candidates: results.sort((a, b) => b.score - a.score),
      typeCount: results.length,
    };
  }

  /**
   * 2. 前提检查
   */
  checkPremises(input) {
    const result = {
      hasPremises: false,
      explicitPremises: [],
      implicitPremises: [],
      missingPremises: [],
      premiseQuality: 'unchecked',
      confidence: 0,
    };

    // 提取显式前提
    const explicitRegex = [
      /因为(.+?)(?:，|,|。|；|;|$)/g,
      /由于(.+?)(?:，|,|。|；|;|$)/g,
      /基于(.+?)(?:，|,|。|；|;|$)/g,
      /根据(.+?)(?:，|,|。|；|;|$)/g,
      /鉴于(.+?)(?:，|,|。|；|;|$)/g,
      /假设(.+?)(?:，|,|。|；|;|$)/g,
    ];

    const seen = new Set();
    for (const regex of explicitRegex) {
      let match;
      while ((match = regex.exec(input)) !== null) {
        const premise = match[1].trim();
        if (premise.length > 2 && !seen.has(premise)) {
          seen.add(premise);
          result.explicitPremises.push(premise);
        }
      }
    }

    // 检测隐含前提
    const implicitSignals = [
      { pattern: /显然|当然|不言而喻|众所周知|毫无疑问/i, type: '未验证假设' },
      { pattern: /应该|必须|一定|肯定|必然/i, type: '价值判断' },
      { pattern: /总是|从来|永远|都|全部|所有/i, type: '全称断言' },
      { pattern: /正常来说|按理说|按照道理|一般来说/i, type: '默认假设' },
    ];

    for (const signal of implicitSignals) {
      if (signal.pattern.test(input)) {
        result.implicitPremises.push({
          type: signal.type,
          trigger: input.match(signal.pattern)?.[0] || '',
        });
      }
    }

    // 检测可能缺失的前提
    if (/所以|因此|因而|故而/i.test(input) && result.explicitPremises.length === 0) {
      result.missingPremises.push({
        reason: '使用了结论标记词但未提供显式前提',
        suggestion: '建议补充推导依据',
      });
    }

    if (/更好|更差|更优|更劣|优于|劣于|高于|低于/i.test(input)) {
      if (!/比|与.*相比|相对|相较/i.test(input)) {
        result.missingPremises.push({
          reason: '使用了比较性结论但未说明比较对象',
          suggestion: '建议明确比较基准',
        });
      }
    }

    if (/导致|引起|造成|引发|促使/i.test(input)) {
      const causeCount = (input.match(/因为|由于|基于|鉴于/g) || []).length;
      if (causeCount < 1) {
        result.missingPremises.push({
          reason: '使用了因果论述但未提供因果机制解释',
          suggestion: '建议补充因果关系说明',
        });
      }
    }

    const total = result.explicitPremises.length + result.implicitPremises.length;
    result.hasPremises = total > 0;

    if (result.explicitPremises.length >= 2) {
      result.premiseQuality = 'good';
      result.confidence = 0.7 + Math.min(result.explicitPremises.length * 0.05, 0.2);
    } else if (result.explicitPremises.length >= 1) {
      result.premiseQuality = 'adequate';
      result.confidence = 0.5;
    } else if (result.implicitPremises.length > 0) {
      result.premiseQuality = 'weak';
      result.confidence = 0.3;
    } else {
      result.premiseQuality = 'none';
      result.confidence = 0;
    }

    result.confidence = Math.round(result.confidence * 100) / 100;
    return result;
  }

  /**
   * 3. 谬误识别
   */
  findFallacies(input) {
    const fallacies = [];

    for (const pattern of FALLACY_PATTERNS) {
      let score = 0;
      const matched = [];

      // 关键词组检测
      let groupsHit = 0;
      for (const kwGroup of pattern.keywords) {
        const { hits, matched: m } = _matchKeywords(input, kwGroup);
        if (hits > 0) {
          groupsHit++;
          matched.push(...m.slice(0, 2));
          score += hits * 0.15;
        }
      }

      // 正则奖励
      if (pattern.regexBonus) {
        for (const re of pattern.regexBonus) {
          if (re.test(input)) {
            score += 0.2;
            matched.push('[re]');
          }
        }
      }

      // 特殊检查
      if (pattern.specialCheck) {
        const specialScore = pattern.specialCheck(input);
        if (specialScore > 0) {
          score += specialScore;
          matched.push('[special]');
        }
      }

      // 检查最少条件
      if (pattern.minKeywordGroups && groupsHit < pattern.minKeywordGroups) {
        score = 0;
      }

      score = Math.min(score, 1.0);

      if (score >= 0.25) {
        fallacies.push({
          id: pattern.id,
          name: pattern.name,
          desc: pattern.desc,
          confidence: Math.round(score * 100) / 100,
          matchedSignals: [...new Set(matched)].slice(0, 3),
          severity: score >= 0.6 ? 'high' : score >= 0.4 ? 'medium' : 'low',
        });
      }
    }

    return fallacies.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * 4. 推理框架推荐
   */
  recommendFramework(input, reasoningType = null) {
    const problemTypes = this._classifyProblem(input);
    const candidates = [];

    // 1. 基于问题类型推荐
    for (const probType of problemTypes) {
      const recommended = PROBLEM_FRAMEWORK_MAP[probType] || [];
      for (const fwId of recommended) {
        if (!candidates.find(c => c.id === fwId)) {
          const fw = FRAMEWORKS[fwId];
          if (fw) {
            candidates.push({
              id: fwId,
              name: fw.name,
              desc: fw.desc,
              relevance: fw.confidence,
              reasons: [`问题类型「${probType}」推荐此框架`],
            });
          }
        } else {
          // 多个问题类型推荐同一个框架，增加相关性
          const existing = candidates.find(c => c.id === fwId);
          if (existing) {
            existing.relevance = Math.min(existing.relevance + 0.1, 1.0);
            existing.reasons.push(`问题类型「${probType}」也推荐此框架`);
          }
        }
      }
    }

    // 2. 检测到谬误时推荐反制框架
    const fallacies = this.findFallacies(input);
    if (fallacies.length > 0) {
      const antiFallacyFrameworks = ['redTeam', 'dialectical', 'firstPrinciples'];
      for (const fwId of antiFallacyFrameworks) {
        const existing = candidates.find(c => c.id === fwId);
        if (existing) {
          existing.relevance = Math.min(existing.relevance + 0.15, 1.0);
          existing.reasons.push(`检测到${fallacies.length}个谬误，建议用此框架反制`);
        } else {
          const fw = FRAMEWORKS[fwId];
          if (fw) {
            candidates.push({
              id: fwId,
              name: fw.name,
              desc: fw.desc,
              relevance: 0.5,
              reasons: [`检测到${fallacies.length}个谬误，建议用此框架反制`],
            });
          }
        }
      }
    }

    // 排序
    const sorted = candidates.sort((a, b) => b.relevance - a.relevance).slice(0, 3);

    // 默认兜底
    if (sorted.length === 0) {
      sorted.push({
        id: 'chainOfThought',
        name: FRAMEWORKS.chainOfThought.name,
        desc: FRAMEWORKS.chainOfThought.desc,
        relevance: 0.5,
        reasons: ['默认推荐：思维链适用于大多数推理场景'],
      });
    }

    return {
      primary: sorted[0] || null,
      alternatives: sorted.slice(1),
      all: sorted,
      problemTypes,
      hasFallacies: fallacies.length > 0,
    };
  }

  _classifyProblem(input) {
    const types = [];
    for (const [type, regexes] of Object.entries(PROBLEM_PATTERNS)) {
      if (_matchAnyRegex(input, regexes)) {
        types.push(type);
      }
    }
    return types.length > 0 ? types : ['general'];
  }

  getStats() {
    return {
      version: this.version,
      totalAnalyses: this._history.length,
      reasoningTypes: REASONING_PATTERNS.length,
      fallacyTypes: FALLACY_PATTERNS.length,
      frameworks: Object.keys(FRAMEWORKS).length,
    };
  }

  getHistory() {
    return this._history.slice(-10);
  }
}

module.exports = { LogicReasoning };

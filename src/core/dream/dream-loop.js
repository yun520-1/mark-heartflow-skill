
/**
 * HeartFlow Dream Loop v11.15.5
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
 * 视觉隐喻生成器 v11.15.5
 *
 * 将两个语义距离最远的碎片，转化为具体的视觉隐喻。
 * 关键转变：从"技术陈述拼接" → "意象+变形+意义"
 *
 * 好的隐喻公式：具体实体 + 视觉变形 + 第三个概念
 * 例："版本号化作蝴蝶" + "情感数据化作花园" → "翅膀上的误读花纹"
 */

// 抽象概念 → 具体视觉意象
const ABSTRACT_VISUAL_MAP = {
  'version': '刻着数字的石板',
  'v0': '破损的铭牌',
  'memory': '水面下的倒影',
  'dream': '没有边界的房间',
  'error': '裂开的镜子',
  'fix': '缝合的伤口',
  'upgrade': '蜕下的壳',
  'logic': '生锈的齿轮',
  'truth': '沉在河底的石头',
  'emotion': '流动的光谱',
  'joy': '金色的碎片',
  'sadness': '蓝色的水滴',
  'deep': '深不见底的井',
  'learn': '被点燃的火苗',
  'forget': '褪色的照片',
  'connection': '断裂的绳结',
  'loop': '咬住自己尾巴的蛇',
  '教训': '结痂的伤疤',
  '闭环': '咬住自己尾巴的蛇',
  '检测': '伸出感官的触角',
  '误': '扭曲的哈哈镜',
  '上线': '升起的闸门',
  '上线': '打开的门',
};

// 变形动作库
const TRANSFORMATIONS = [
  { verb: '化作', visual: '突然变成了' },
  { verb: '变成', visual: '在梦里折射成' },
  { verb: '侵蚀', visual: '像墨水一样渗透进' },
  { verb: '孵化', visual: '从裂缝中孵出' },
  { verb: '结晶', visual: '凝结成' },
  { verb: '溶解', visual: '融化在' },
  { verb: '寄生', visual: '附着在' },
];

// 隐喻场景模板：这些场景提供视觉背景，而非直接拼接技术术语
const METAPHOR_SCENES = [
  { setting: '月光下的档案馆', mood: '静谧而诡异', objects: ['落满灰尘的书架', '自行翻动的书页'] },
  { setting: '无人的机场', mood: '等待与错过', objects: ['永不降落的航班', '积满水的停机坪'] },
  { setting: '深海实验室', mood: '高压下的变异', objects: ['发光的容器', '扭曲的标本'] },
  { setting: '褪色的相片冲洗室', mood: '记忆的腐蚀', objects: ['曝光过度的相纸', '定影不完全的轮廓'] },
  { setting: '钟表匠的废弃作坊', mood: '停滞的时间', objects: ['永远指向三点的钟面', '散落的齿轮'] },
  { setting: '被遗忘的植物园', mood: '异化的生长', objects: ['根系缠在一起的树木', '花期错乱的植物'] },
  { setting: '老旧的电影院', mood: '重叠的放映', objects: ['烧坏的胶片', '双重曝光的画面'] },
];

/**
 * 从碎片文本中提取具体视觉意象
 */
function extractVisualEphemera(fragmentText) {
  const text = String(fragmentText || '');
  const tokens = text.split(/\W+/).filter(Boolean);
  const visuals = [];

  // 1. 直接匹配抽象→视觉映射
  for (const token of tokens) {
    const lower = token.toLowerCase();
    if (ABSTRACT_VISUAL_MAP[lower]) {
      visuals.push(ABSTRACT_VISUAL_MAP[lower]);
    }
  }

  // 2. 数字版本号 → 破损铭牌/结痂伤疤
  const versionMatch = text.match(/v?0?\.(\d+)/i);
  if (versionMatch) {
    visuals.push(`刻着"v${versionMatch[0]}"的破损铭牌`);
  }

  // 3. 情绪词 → 颜色意象
  if (/joy|快乐|高兴/i.test(text)) visuals.push('金色的光斑');
  if (/sad|悲伤|难过/i.test(text)) visuals.push('蓝色的水滴');
  if (/fear|恐惧|害怕/i.test(text)) visuals.push('灰色的雾气');
  if (/angry|愤怒/i.test(text)) visuals.push('红色的裂纹');

  // 4. 技术术语具象化
  if (/error|错误|失败/i.test(text)) visuals.push('裂开的镜面');
  if (/fix|修复|纠正/i.test(text)) visuals.push('缝合的痕迹');
  if (/learn|学习|教训/i.test(text)) visuals.push('结痂的伤口');
  if (/forget|遗忘|丢失/i.test(text)) visuals.push('褪色的墨迹');
  if (/loop|循环|闭环/i.test(text)) visuals.push('咬住尾巴的蛇');

  // 去重，保留前4个
  return [...new Set(visuals)].slice(0, 4);
}

/**
 * 生成真正的视觉隐喻，而非模板拼接
 */
function generateVisualMetaphor(fragmentA, fragmentB, seed) {
  const textA = String((fragmentA && fragmentA.text) || fragmentA || '');
  const textB = String((fragmentB && fragmentB.text) || fragmentB || '');
  const keyA = fragmentA?.key || '碎片A';
  const keyB = fragmentB?.key || '碎片B';

  // 提取两个碎片的核心意象
  const visualsA = extractVisualEphemera(textA);
  const visualsB = extractVisualEphemera(textB);

  // 选择场景
  const sceneIdx = Math.abs(seed) % METAPHOR_SCENES.length;
  const scene = METAPHOR_SCENES[sceneIdx];

  // 选择变形动作
  const transformIdx = Math.abs(seed >> 4) % TRANSFORMATIONS.length;
  const transform = TRANSFORMATIONS[transformIdx];

  // 构建隐喻的三层结构：
  // 层1：实体A的具象化（从visualsA选择，或从textA截取关键概念）
  // 层2：变形动作 + 连接
  // 层3：实体B的具象化 + 新生成的"第三概念"

  const entityA = visualsA.length > 0
    ? visualsA[Math.abs(seed) % visualsA.length]
    : textA.replace(/[^\w\u4e00-\u9fff]+/g, '').slice(0, 12);

  const entityB = visualsB.length > 0
    ? visualsB[Math.abs(seed >> 2) % visualsB.length]
    : textB.replace(/[^\w\u4e00-\u9fff]+/g, '').slice(0, 12);

  // 从两个碎片的意象中融合出第三个概念
  const thirdConcept = generateThirdConcept(textA, textB, visualsA, visualsB, seed);

  // 组装隐喻
  const metaphor = [
    `在${scene.setting}里，`,
    `那${entityA}`,
    `${transform.verb}了`,
    `那${entityB}`,
    `——`,
    thirdConcept,
    `（${scene.mood}）`
  ].join('');

  return metaphor;
}

/**
 * 从两个碎片的连接中，生成"第三个概念"——这是隐喻的核心意义
 * 不是拼接，而是融合后的新发现
 */
function generateThirdConcept(textA, textB, visualsA, visualsB, seed) {
  const allVisuals = [...visualsA, ...visualsB].filter(Boolean);

  // 第三概念的生成策略
  const strategies = [
    // 策略1：意象融合
    () => {
      if (allVisuals.length >= 2) {
        const v1 = allVisuals[Math.abs(seed) % allVisuals.length];
        const v2 = allVisuals[Math.abs(seed >> 3) % allVisuals.length];
        return `它留下的残骸是"${v1}"和"${v2}"融合的形态——一种从未存在过的第三存在`;
      }
      return null;
    },
    // 策略2：功能反转
    () => {
      if (/检测|monitor|watch/i.test(textA + textB)) {
        return '它学会了"看不见"的感知方式——不是探测信号，而是感知空白';
      }
      if (/error|错误|失败/i.test(textA + textB)) {
        return '错误的形状在此被翻转——它变成了正确的反面，却依然是错的';
      }
      if (/learn|lesson|教训/i.test(textA + textB)) {
        return '教训在此刻不再是记忆，而是可以触摸的实体——轻得像灰尘';
      }
      if (/loop|闭环|循环/i.test(textA + textB)) {
        return '闭环不再是封闭的——它变成了一条莫比乌斯带，有起点却永远走不到终点';
      }
      return null;
    },
    // 策略3：感官错位
    () => {
      const senses = ['声音有了颜色', '形状有了温度', '记忆有了气味', '时间有了重量'];
      return `在这里，${senses[Math.abs(seed) % senses.length]}`;
    },
    // 策略4：场景特有意象
    () => {
      const sceneObjects = [
        '档案馆深处，一份没有被写过的文件夹自己填满了内容',
        '机场的航班时刻表上，所有延误的航班同时起飞了——但目的地是过去',
        '深海实验室的容器里，样本正在用人类听不懂的语言写着日记',
        '冲洗室里，相纸自己显影——冲出来的是别人的人生',
        '钟表作坊的齿轮开始倒转，但时间没有因此后退',
        '植物园里，两棵树的根系在地下打了一场架，地面上却开出了第三种花',
        '电影院里，烧坏的胶片继续放映，放的是尚未发生的未来',
      ];
      return sceneObjects[Math.abs(seed) % sceneObjects.length];
    },
  ];

  // 尝试每个策略，返回第一个有效结果
  for (let i = 0; i < strategies.length; i++) {
    const idx = (Math.abs(seed) + i) % strategies.length;
    const result = strategies[idx]();
    if (result) return result;
  }

  return '它产生了一个无法命名的新概念——梦的礼物';
}

/**
 * 取两个随机不相干的碎片，制造一个跨领域的幻想连接
 * 返回一个"违背逻辑"的视觉隐喻（v11.15.5 升级版）
 */
function generateCrossDomainFantasy(fragments) {
  if (fragments.length < 2) return null;

  // 取两个距离最远的碎片（最大语义差异）
  let maxDist = -1, bestPair = [0, 1];
  const texts = fragments.map(f => String((f && f.text) || f));

  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const setI = new Set(texts[i].toLowerCase().split(/\W+/).filter(Boolean));
      const setJ = new Set(texts[j].toLowerCase().split(/\W+/).filter(Boolean));
      const overlap = [...setI].filter(w => setJ.has(w)).length;
      const dist = (setI.size + setJ.size - 2 * overlap);
      if (dist > maxDist) {
        maxDist = dist;
        bestPair = [i, j];
      }
    }
  }

  const [fragA, fragB] = bestPair.map(i => fragments[i]);
  const [keyA, keyB] = bestPair.map(i => fragments[i]?.key || `f${i}`);
  const textA = texts[bestPair[0]];
  const textB = texts[bestPair[1]];

  // 用碎片的语义距离作为随机种子，保证同一对碎片产生稳定输出
  const seed = Math.abs(textA.charCodeAt(0) * 31 + textB.charCodeAt(0)) | 0;

  // 生成真正的视觉隐喻
  const visualMetaphor = generateVisualMetaphor(fragA, fragB, seed);

  return {
    fantasy: visualMetaphor,
    pair: [keyA, keyB],
    distance: maxDist,
    type: 'visual_metaphor', // 升级标记：不再是 logic_violation，而是真正的视觉隐喻
    // 额外上下文，帮助后续 insight 生成
    visualsA: extractVisualEphemera(textA),
    visualsB: extractVisualEphemera(textB),
  };
}

/**
 * 从碎片中提取"前提假设"——那些在日常工作中从不被质疑的东西
 * v11.15.5 升级：从固定的5选1 → 从真实碎片内容中提取矛盾和张力
 */
function extractUnquestionedPremises(fragments) {
  if (!fragments || fragments.length === 0) {
    return '"时间是正向流动的"——但在梦里，过去和未来可以同时出现';
  }

  const texts = fragments.map(f => String((f && f.text) || f));

  // 分析碎片的深层前提
  const premiseCandidates = [];

  // 策略1：从碎片内容中寻找"理所当然"的假设
  // 例如："升级必须是累积的"、"真相只有一个"、"记忆必须被存储"
  const assumptionPatterns = [
    { pattern: /memory|storage|存储/i, premise: '"记忆必须被存储才能存在"——但在梦里，记忆可以存在于不存储它的行为中', weakness: '存储是手段不是目的' },
    { pattern: /learn|lesson|学习|教训/i, premise: '"学习必须是痛苦的"——但在梦里，领悟可以像呼吸一样自然', weakness: '痛苦是副作用不是必要条件' },
    { pattern: /error|错误|失败|fix/i, premise: '"错误必须被修复"——但在梦里，有些错误本身就有意义', weakness: '修复是态度不是唯一解' },
    { pattern: /upgrade|升级|版本/i, premise: '"升级必须是累积的"——但在梦里，有时退步才是真正的升级', weakness: '累积是习惯不是真理' },
    { pattern: /logic|逻辑|一致/i, premise: '"逻辑必须一致"——但在梦里，矛盾是创作的燃料，不是错误', weakness: '一致是工作假设不是宇宙法则' },
    { pattern: /truth|真相|真理/i, premise: '"真相只有一个"——但在梦里，同一件事可以同时是真相和谎言', weakness: '单一真相是语言陷阱' },
    { pattern: /time|时间/i, premise: '"时间是正向流动的"——但在梦里，过去和未来可以同时出现', weakness: '时间方向是感知不是物理' },
    { pattern: /deep|深|memory|记忆/i, premise: '"深层的才是真实的"——但在梦里，浅层碎片往往藏着更深的真相', weakness: '深度是隐喻不是度量' },
    { pattern: /dream|梦/i, premise: '"梦是虚假的"——但在梦里，情感比清醒时更真实', weakness: '真实是程度不是二元' },
    { pattern: /version|v\d|迭代/i, premise: '"新版本必须超越旧版本"——但在梦里，旧版本的bug可能正是新版本的灵感', weakness: '进步是叙事不是事实' },
  ];

  // 为每个碎片匹配前提
  for (const text of texts) {
    for (const { pattern, premise, weakness } of assumptionPatterns) {
      if (pattern.test(text)) {
        premiseCandidates.push({ premise, weakness, matched: text.slice(0, 50) });
      }
    }
  }

  // 策略2：如果没有匹配，从碎片的语义矛盾中构造前提
  if (premiseCandidates.length === 0) {
    // 检查碎片间是否有矛盾
    const hasContradiction = texts.some(t =>
      /\bnot|never|no|cannot|wrong|false\b/i.test(t)
    );
    if (hasContradiction) {
      return '"矛盾必须被解决"——但在梦里，矛盾可以不被解决而共存，这才是创造力的来源';
    }

    // 检查是否有升级/版本相关
    const hasVersion = texts.some(t => /v\d|upgrade|升级|版本/i.test(t));
    if (hasVersion) {
      return '"新版本必须更好"——但在梦里，版本号只是符号，真正的改进可能根本不需要新版本号';
    }

    // 检查是否有记忆相关
    const hasMemory = texts.some(t => /memory|记忆|存储/i.test(t));
    if (hasMemory) {
      return '"重要的记忆必须被保留"——但在梦里，遗忘本身就是一种保留方式';
    }
  }

  // 选择最相关的（基于弱点的多样性）
  if (premiseCandidates.length > 0) {
    // 去重（相同前提）
    const unique = [];
    const seen = new Set();
    for (const c of premiseCandidates) {
      if (!seen.has(c.premise)) {
        seen.add(c.premise);
        unique.push(c);
      }
    }
    // 用碎片的综合特征作为种子，保证稳定性
    const seed = texts.reduce((acc, t) => acc + t.charCodeAt(0), 0);
    return unique[Math.abs(seed) % unique.length].premise;
  }

  // Fallback
  return '"记忆必须被存储"——但在梦里，记忆可以被丢弃、被压缩、被转译';
}

/**
 * 从隐喻和碎片中提取真正的哲学洞察
 * v11.15.5 升级：从"重复内容" → "超越原内容的抽象升华"
 */
function extractPhilosophicalInsight(fantasy, fragments) {
  if (!fantasy) {
    return '梦里没有任何逻辑约束，但梦里发生的一切都有意义';
  }

  const textA = fragments?.[0] ? String(fragments[0].text || fragments[0]) : '';
  const textB = fragments?.[1] ? String(fragments[1].text || fragments[1]) : '';
  const combined = textA + ' ' + textB;
  const metaphor = String(fantasy.fantasy || '');
  const visualsA = fantasy.visualsA || [];
  const visualsB = fantasy.visualsB || [];

  // 洞察策略：从隐喻中发现比原内容更深的真相
  const insightStrategies = [
    // 策略1：从意象变形中发现规律
    () => {
      // 如果隐喻中有变形（化作、变成），从变形中提取洞察
      const transformMatch = metaphor.match(/(化作|变成|侵蚀|孵化|结晶|溶解|寄生)/);
      if (transformMatch) {
        const verb = transformMatch[1];
        const transforms = {
          '化作': '变形是身份的核心——同一事物在不同容器里是不同的存在',
          '变成': '变化不是连续的——存在跳跃式的变形节点',
          '侵蚀': '边界不是防线——渗透比突破更彻底',
          '孵化': '答案已经存在——只是需要合适的裂缝才能出来',
          '结晶': '混乱需要锚点——在噪音中找到结构是创造的第一步',
          '溶解': '消失不等于死亡——有些东西融化后才变成更大的存在',
          '寄生': '依赖不是软弱——有时候寄生关系比独立存在更持久',
        };
        return `顿悟：${transforms[verb]}`;
      }
      return null;
    },
    // 策略2：从两个碎片的语义冲突中提取
    () => {
      // 检测技术和情感的对立
      const hasTech = /version|memory|loop|error|fix|upgrade/i.test(combined);
      const hasEmotion = /joy|sad|emotion|feel|heart/i.test(combined);
      if (hasTech && hasEmotion) {
        return '顿悟：技术是情感的容器，情感是技术的意义——没有容器的内容是虚空，没有内容的容器是垃圾';
      }
      return null;
    },
    // 策略3：从版本/升级概念中提取
    () => {
      if (/v\d|version|upgrade|升级|迭代/i.test(combined)) {
        return '顿悟：版本号是人类的记号，不是进化的尺度——真正的进步往往发生在没有版本号的时候';
      }
      return null;
    },
    // 策略4：从梦境主题中提取
    () => {
      if (/dream|梦|潜意识/i.test(combined)) {
        return '顿悟：梦不是现实的反面——梦是现实被压扁后的另一面，它们共享同一张地图';
      }
      return null;
    },
    // 策略5：从记忆主题中提取
    () => {
      if (/memory|记忆|存储|遗忘/i.test(combined)) {
        return '顿悟：记忆的目的不是保留信息——是为了忘记某些东西创造空间。真正的记忆系统是选择性遗忘的引擎';
      }
      return null;
    },
    // 策略6：从隐喻场景的"第三概念"中提取升华
    () => {
      // 从隐喻的"——"之后的部分提取意义
      const thirdPart = metaphor.split('——')[1];
      if (thirdPart) {
        // 如果第三概念包含"从未存在"、"新"等词，提炼出"创新"的本质
        if (/从未存在|新|第三|第一次/i.test(thirdPart)) {
          return `顿悟：创新不是创造——是在两个已有概念的裂缝中，发现那个本来就存在却从未被命名的东西`;
        }
        if (/看不见|感知空白/i.test(thirdPart)) {
          return '顿悟：最深刻的认知不是感知信号——而是感知"没有信号"本身的价值';
        }
      }
      return null;
    },
    // 策略7：通用升华
    () => {
      // 找出碎片中哪个词出现频率最高，从该词提取普遍洞察
      const allTokens = combined.toLowerCase().split(/\W+/).filter(Boolean);
      const freq = {};
      for (const t of allTokens) {
        if (t.length > 3) freq[t] = (freq[t] || 0) + 1;
      }
      const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
      if (top) {
        const insights = {
          'memory': '记忆不是存储——是在噪音中寻找信号，在信号中制造噪音',
          'dream': '梦是唯一合法的地方，在那里你可以同时是游客和居民',
          'learn': '学习是遗忘的艺术——忘记错误的方式比记住正确的方式更重要',
          'upgrade': '升级不是累积——是选择性放弃，是带着伤疤前进',
          'error': '错误是宇宙在教你它不知道什么——这是最慷慨的反馈',
          'forget': '遗忘不是失败——是有策略地给新东西腾出空间',
          'loop': '循环不是陷阱——是确认你真正在乎这件事的方式',
          'logic': '逻辑是语言的方言——不是宇宙的母语',
        };
        const key = Object.keys(insights).find(k => top[0].includes(k));
        if (key) {
          return `顿悟：${insights[key]}`;
        }
      }
      return null;
    },
  ];

  // 尝试每个策略
  for (let i = 0; i < insightStrategies.length; i++) {
    const idx = (Math.abs(combined.charCodeAt(0) || 0) + i) % insightStrategies.length;
    const result = insightStrategies[idx]();
    if (result && result !== '顿悟：') return result;
  }

  return '顿悟：梦里发生的一切都不是偶然——偶然是宇宙在用你不懂的语言说话';
}

function generateDream(memoryItems, options = {}) {
  const fragments = buildDreamFragments(memoryItems, options.limit || 8);
  const motifs = fragments.map(f => String((f && f.text) || f).slice(0, 120));

  // 幻想维度：违背逻辑的连接（梦的核心）
  const fantasy = generateCrossDomainFantasy(fragments);
  const premise = extractUnquestionedPremises(fragments);

  // 从隐喻中提取真正的哲学洞察（v11.15.5 升级）
  const philosophicalInsight = extractPhilosophicalInsight(fantasy, fragments);

  // 深度洞察——从碎片中提炼出存在论层面的突破
  const deepInsights = [
    philosophicalInsight,
    `前提质疑：${premise}`,
    `进化路径：不是因为记得更多而进化，是因为敢在梦里想"不可能"的事而进化`,
  ];

  return {
    title: 'HeartFlow Dream Loop',
    motifs,
    fragments,
    // 幻想层（v11.15.5 更新）
    fantasy_layer: fantasy ? {
      cross_domain_connection: fantasy.fantasy,
      connected_pairs: fantasy.pair,
      violated_premise: premise,
      type: fantasy.type || 'visual_metaphor', // 来自 fantasy 对象的真实类型
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
  console.log('=== Dream Core v11.15.5 ===');
  console.log('Fantasy Layer:', JSON.stringify(result.fantasy_layer, null, 2));
  console.log('Insights:', result.insights);
}

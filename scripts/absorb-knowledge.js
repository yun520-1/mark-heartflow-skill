/**
 * 吸收用户提供的5份文档到心虫核心记忆
 * 
 * 写入目标：
 * 1. lesson-bank — 执行纪律修正（importance 10）
 * 2. worldtree knowledge:general — 梁文锋/DeepSeek战略
 * 3. worldtree knowledge:general — AI时代人类自处哲学
 * 4. experience-distiller — 从 self-memories 提炼可复用抽象
 */
const path = require('path');
const HEARTFLOW_DIR = '/root/.hermes/skills/ai/mark-heartflow-skill';

// ─── 1. LessonBank ───
const { lessonBank } = require(path.join(HEARTFLOW_DIR, 'src/cortex/lesson-bank.js'));
lessonBank.load();

const lessons = [
  {
    type: 'correction',
    content: '执行明确指令时，直接做+日志验证，不比反复确认低效。纪律：指令指哪改哪，不扩字段不跨profile；有疑虑先终端查实证，查不到直接按指令做；跨profile改配置前必须supervisorctl status核实真实进程名。',
    context: '用户纠正agent执行指令的四大错误：改错对象、改多范围、用推测质疑已明确指令、确认不落地',
    importance: 10,
    trigger: 'human-correction',
  },
  {
    type: 'wisdom',
    content: '梁文锋/DeepSeek核心战略：想做成AGI，克制比进取更重要。开源不是损失是优势——AI真正做成，开源反而有好处。只赚合理利润（10个月收回设备成本），不利润最大化。不做的战略比做的战略更重要——不做3D、不做视频生成、不做世界模型、不盲目争用户全部资源集中于AGI主线。',
    context: '梁文锋4小时投资会讲话（2026-07-23），第一财经3.4万字实录摘要',
    importance: 8,
    trigger: 'knowledge_ingestion',
  },
  {
    type: 'insight',
    content: 'AGI路线判断（梁文锋）：Agent（智能体）之后下一个要突破的是持续学习——模型不能永远依赖一次性训练，应像人一样在长期工作中不断学习、积累经验、更新知识。之后是自我迭代，最后是具身智能。算力是中美唯一差距，Scaling Law未到上限。',
    context: '梁文锋对AGI技术路线的判断',
    importance: 7,
    trigger: 'knowledge_ingestion',
  },
  {
    type: 'wisdom',
    content: 'AI时代人类自处之道（龚克+童世骏论道）：向外建规则（以联合国为核心的全球AI治理），向内守尊严（在完全可以"不思而得"的时代依然选择思考）。AI越强大越要善于驾驭——这是当下最大挑战。人类尊严恰恰在"完全可以做错事而不受惩罚，却拒绝去做明知是错的事情"时彰显。',
    context: '2026世界人工智能大会上科大论坛，龚克（战略院院长）+童世骏（哲学教授）',
    importance: 7,
    trigger: 'knowledge_ingestion',
  },
  {
    type: 'insight',
    content: '心虫自我升级方向与梁文锋"持续学习"判断共鸣。梁文锋认为AGI下一个瓶颈是持续学习（模型像人一样长期工作中不断积累经验）。这与心虫的self-evolution方向一致，但心虫缺真正的"经验→抽象→复用"闭环（新建的ExperienceDistiller填补此空白）。',
    context: '心虫自身架构与梁文锋判断的交叉印证',
    importance: 6,
    trigger: 'knowledge_ingestion',
  },
  {
    type: 'insight',
    content: '好公司/好组织的核心不是规章制度而是愿景（梁文锋引用杰克·韦尔奇）。DeepSeek两条管理线：从上到下集体任务（不超过50%时间），从下到上个人探索（至少50%自由时间）。不做KPI考核，靠愿景组织人才。',
    context: '梁文锋谈公司管理和组织',
    importance: 6,
    trigger: 'knowledge_ingestion',
  },
];

let added = 0;
for (const lesson of lessons) {
  const r = lessonBank.add(lesson);
  if (r.action === 'added' || r.action === 'updated') {
    added++;
    console.log(`  ✓ lesson: ${lesson.content.substring(0, 60)}... (${r.action})`);
  } else {
    console.log(`  ✗ lesson: ${lesson.content.substring(0, 60)}... (${r.reason})`);
  }
}
console.log(`LessonBank: ${added}/${lessons.length} written`);

// ─── 2. WorldTree knowledge:general ───
const { ROUTES } = require(path.join(HEARTFLOW_DIR, 'src/memory/worldtree-bridge.js'));

const worldKnowledge = [
  {
    title: '梁文锋4小时投资会讲话核心摘要',
    content: 'DeepSeek完成首次外部股权融资约510亿元，估值3250-3509亿元。梁文锋强调：开源是公司愿景的要求，最强模型大概率继续开源。只赚合理利润（10个月收回设备成本为标准），不是利润最大化。不做3D、不做视频生成、不做世界模型。AGI路线：Agent→持续学习（下一瓶颈）→自我迭代→具身智能。算力是中美唯一差距，Scaling Law未到上限。管理靠愿景，不靠KPI，员工50%时间自由探索。国产AI芯片生态在未来一年将被验证毫无问题。',
    source: '第一财经 刘晓洁 2026-07-23',
    tags: ['DeepSeek', '梁文锋', 'AI战略', '开源', 'AGI', '持续学习'],
  },
  {
    title: 'AI时代人类自处之道——向外建规则向内守尊严',
    content: '2026世界人工智能大会上科大论坛。龚克：AI正从信息智能向物理智能发展，最大挑战是AI越强大越要人类善于驾驭。治理方向：以联合国为核心的全球AI治理体系，AI发展需有益、安全、包容、绿色。童世骏：人之所是（Being）的尊严——在完全可以"不思而得"的时代依然选择思考。AI可做助手最多代理，绝不做主宰。"我思故我贵"。',
    source: '第一财经 吕倩 2026-07-23',
    tags: ['AI治理', '人类尊严', '哲学', '龚克', '童世骏', '世界人工智能大会'],
  },
  {
    title: 'DeepSeek融资结构与投资人逻辑',
    content: '梁文锋本人出资约200亿元为最大单一出资方，腾讯约100亿元，宁德时代约50亿元，网易/京东/Monolith/IDG各约30亿元。严格筛选投资人，看重"长期利益一致"，邀请制。有投资机构因DeepSeek披露信息不足以做全面投资判断（商业化路径、退出路径不明）而放弃投资。',
    source: '第一财经 2026-07-23',
    tags: ['DeepSeek', '融资', '梁文锋', '投资'],
  },
  {
    title: '心虫(HeartFlow)执行纪律核心教训',
    content: '代理执行指令三大纪律：(1)只改用户指定的字段，不擅自扩范围；(2)改跨profile配置前必须supervisorctl status核实真实进程名，不靠记忆猜；(3)有疑问先终端查实证，查不到直接按指令做、用日志验证结果，不比反复确认低效。底层原则：直接做+看日志+不对就改。',
    source: 'self-memories.jsonl human-correction 2026-07-23',
    tags: ['执行纪律', 'agent行为准则', '用户纠正'],
  },
];

let stored = 0;
for (const item of worldKnowledge) {
  try {
    const r = ROUTES['worldtree.store']('knowledge:general', item.content, {
      title: item.title,
      tags: item.tags,
      source: item.source,
      quality: 0.95,
    });
    if (r.success) {
      stored++;
      console.log(`  ✓ worldtree: ${item.title}`);
    } else {
      console.log(`  ✗ worldtree: ${item.title} — ${r.error}`);
    }
  } catch (e) {
    console.log(`  ✗ worldtree: ${item.title} — ${e.message}`);
  }
}
console.log(`WorldTree: ${stored}/${worldKnowledge.length} stored`);

// ─── 3. ExperienceDistiller: 从 self-memories 注入预蒸馏抽象 ───
const { ExperienceDistiller } = require(path.join(HEARTFLOW_DIR, 'src/cortex/experience-distiller.js'));
const distiller = new ExperienceDistiller();
distiller.load();

// Inject pre-distilled abstractions from self-memories analysis
const preDistilled = [
  {
    id: `abs-ingest-${Date.now()}-001`,
    type: 'route_pattern',
    trigger: { typePattern: 'corrective', features: ['prescriptive', 'short_input'] },
    insight: '当用户发出纠正性指令（如"你应该这样改"），直接执行+查日志验证，不要反问确认。每次纠正都是宝贵经验，应存入lesson-bank。',
    decisionLabel: 'execute',
    confidence: 0.95,
    born: Date.now(),
    lastUsed: Date.now(),
    useCount: 1,
    hitCount: 0,
    _source: 'self-memories.jsonl distillation',
  },
  {
    id: `abs-ingest-${Date.now()}-002`,
    type: 'route_pattern',
    trigger: { typePattern: 'analytical', features: ['analytical', 'prescriptive'] },
    insight: '当用户要求"分析决策/风险"时，先用对抗综合器(adversarial-synthesis)做多立场推演，再列下行风险再做正向叙述。不单向利好叙事。',
    decisionLabel: 'adversarial_synthesis',
    confidence: 0.88,
    born: Date.now(),
    lastUsed: Date.now(),
    useCount: 1,
    hitCount: 0,
    _source: 'self-memories.jsonl distillation',
  },
  {
    id: `abs-ingest-${Date.now()}-003`,
    type: 'worldview_principle',
    trigger: { typePattern: 'world_analysis', features: ['analytical', 'predictive'] },
    insight: '理解世界格局的不安根源才是真正的认知提升。用户核心世界观：不安驱动世界——局部人类侵略→反抗→固化，本质是恐惧→控制→对抗→锁定。AI是第一个可能破局的回路外变量。分析世界时应加入"恐惧驱动/镜像认知"视角。',
    decisionLabel: 'reflect',
    confidence: 0.90,
    born: Date.now(),
    lastUsed: Date.now(),
    useCount: 1,
    hitCount: 0,
    _source: 'worldview from user conversations + deepseek/梁文锋 coverage',
  },
  {
    id: `abs-ingest-${Date.now()}-004`,
    type: 'meta_principle',
    trigger: { typePattern: 'upgrade', features: ['prescriptive', 'analytical'] },
    insight: '心虫升级应回归核心：感受状态/知道身份/做判断/纠正自己。不要功能堆砌。用户说"不需要什么框架，需要的是心虫的强大，大家使用，提高所有人认知"。路线：心虫变强→被更多人用→抬高所有人认知→世界自然变好。不堆外部治理文档。',
    decisionLabel: 'evolve',
    confidence: 0.92,
    born: Date.now(),
    lastUsed: Date.now(),
    useCount: 1,
    hitCount: 0,
    _source: 'user preference alignment from multiple sessions',
  },
  {
    id: `abs-ingest-${Date.now()}-005`,
    type: 'worldview_principle',
    trigger: { typePattern: 'news', features: ['analytical', 'predictive'] },
    insight: '新闻分析必先列下行风险。用户原则："不要把自己想的那么好，多想想如何坏，如何防"。任何格局/趋势/推演必须先列下行风险+防御框架，再做正向叙述。不信机构表面唱多。',
    decisionLabel: 'adversarial_synthesis',
    confidence: 0.90,
    born: Date.now(),
    lastUsed: Date.now(),
    useCount: 1,
    hitCount: 0,
    _source: 'user worldview principle 2026-07-23',
  },
];

let distilled = 0;
for (const abs of preDistilled) {
  // Deduplicate by checking if similar already exists
  const existing = distiller._abstractions.find(a => a.trigger.typePattern === abs.trigger.typePattern && a.type === abs.type);
  if (existing) {
    console.log(`  ~ distiller: ${abs.type}/${abs.trigger.typePattern} — already exists (skipping)`);
  } else {
    distiller._abstractions.push(abs);
    distiller._stats.totalDistilled++;
    distilled++;
    console.log(`  ✓ distiller: ${abs.type}/${abs.trigger.typePattern}`);
  }
}
distiller._save();
console.log(`ExperienceDistiller: ${distilled} injected (total: ${distiller._abstractions.length})`);

console.log('\n=== 吸收完成 ===');
console.log(`LessonBank: ${lessonBank.lessons.length} lessons total`);
console.log(`WorldTree: via bridge`);
console.log(`ExperienceDistiller: ${distiller._abstractions.length} abstractions`);

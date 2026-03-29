#!/usr/bin/env node

/**
 * 心流伴侣 (HeartFlow Companion)
 * 情感拟人化交互系统 - 主入口
 * 
 * 原创设计，无版权风险
 * 
 * v3.0.0 新增：存在主义心理学、意义治疗
 */

const ChatManager = require('./chat/manager');
const { EmotionTypes } = require('./emotion/states');
const { CBTModule } = require('./cbt');
const { StoicModule } = require('./stoic');
const { HumanisticPsychologyModule } = require('./humanistic');
const { MindfulnessModule } = require('./mindfulness');
const { EmotionalIntelligenceModule } = require('./emotional-intelligence');
const { SocialPsychologyModule } = require('./social-psychology');
const { ExistentialPsychologyModule } = require('./existential');
const { AppraisalModule } = require('./appraisal');
const AttachmentModule = require('./attachment');
const ACTModule = require('./act');
const { EmotionRegulationModule } = require('./emotion-regulation');
const { PositivePsychologyModule } = require('./positive-psychology');
const readline = require('readline');

// 创建 CBT 模块
const cbtModule = new CBTModule();

// 创建斯多葛模块 (v2.4.0 新增)
const stoicModule = new StoicModule();

// 创建人本主义心理学模块 (v2.5.0 新增)
const humanisticModule = new HumanisticPsychologyModule();

// 创建正念与接纳模块 (v2.7.0 新增)
const mindfulnessModule = new MindfulnessModule();

// 创建情绪智力模块 (v2.8.0 新增)
const eiModule = new EmotionalIntelligenceModule();

// 创建社会心理学模块 (v2.9.0 新增)
const socialModule = new SocialPsychologyModule();

// 创建存在主义心理学模块 (v3.0.0 新增) ✨
const existentialModule = new ExistentialPsychologyModule();

// 创建情绪评价理论模块 (v3.1.0 新增)
const appraisalModule = new AppraisalModule();

// 创建依恋理论模块 (v3.2.0 新增) ✨
const attachmentModule = AttachmentModule;

// 创建 ACT 接受与承诺疗法模块 (v3.2.0 新增) ✨
const actModule = ACTModule;

// 创建情绪调节模块 (v3.3.0 新增) 🎛️
const regulationModule = new EmotionRegulationModule();

// 创建积极心理学模块 (v3.4.0 新增) ✨
const positiveModule = new PositivePsychologyModule();

// 创建对话管理器
const chatManager = new ChatManager({
  dataDir: process.env.HEARTFLOW_DATA_DIR || null,
  userMetadata: {}
});

// 命令行界面
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 显示欢迎信息
function showWelcome() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║          心流伴侣 HeartFlow Companion                  ║');
  console.log('║              情感拟人化交互系统 v3.4.0                  ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log('║  输入消息开始对话                                       ║');
  console.log('║  命令：                                                 ║');
  console.log('║    /state     - 查看当前情感状态                        ║');
  console.log('║    /history   - 查看情感历史                            ║');
  console.log('║    /report    - 生成情感分析报告                        ║');
  console.log('║    /stats     - 查看情感统计                            ║');
  console.log('║    /rest      - 休息恢复能量                            ║');
  console.log('║    /export    - 导出会话数据                            ║');
  console.log('║    /cbt       - CBT 思维重构支持 (v2.3)                  ║');
  console.log('║    /stoic     - 斯多葛哲学支持 (v2.4)                    ║');
  console.log('║    /human     - 人本主义心理学 (v2.5)                    ║');
  console.log('║    /mindful   - 正念与接纳 (v2.7) ✨ NEW                 ║');
  console.log('║    /growth    - 成长型思维 (v2.7) ✨ NEW                 ║');
  console.log('║    /existential - 存在主义心理学 (v3.0) ✨ NEW         ║');
  console.log('║    /appraisal   - 情绪评价理论 (v3.1) ✨ NEW            ║');
  console.log('║    /attachment  - 依恋理论 (v3.2) ✨ NEW                ║');
  console.log('║    /act         - ACT 接受与承诺疗法 (v3.2) ✨ NEW      ║');
  console.log('║    /regulation  - 情绪调节策略 (v3.3) 🎛️ NEW            ║');
  console.log('║    /positive    - 积极心理学 (v3.4) ✨ NEW               ║');
  console.log('║    /help        - 显示帮助                                ║');
  console.log('║    /quit      - 退出程序                                ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  // 显示初始情感状态
  const state = chatManager.getCurrentState();
  console.log(`🌊 初始情感状态：${state.emotion} (${state.intensityLabel})`);
  console.log(`⚡ 能量水平：${state.energyLevel}/100\n`);
}

// 处理用户命令
async function handleCommand(command) {
  const cmd = command.toLowerCase().trim();
  
  switch (cmd) {
    case '/state':
      showState();
      break;
    case '/history':
      showHistory();
      break;
    case '/report':
      await showReport();
      break;
    case '/stats':
      showStats();
      break;
    case '/rest':
      rest();
      break;
    case '/export':
      exportSession();
      break;
    case '/cbt':
      showCBTInfo();
      break;
    case '/stoic':
      showStoicInfo();
      break;
    case '/human':
      showHumanisticInfo();
      break;
    case '/mindful':
      showMindfulnessInfo();
      break;
    case '/growth':
      showGrowthMindsetInfo();
      break;
    case '/eq':
      showEQInfo();
      break;
    case '/social':
      showSocialPsychologyInfo();
      break;
    case '/existential':
      showExistentialInfo();
      break;
    case '/appraisal':
      showAppraisalInfo();
      break;
    case '/attachment':
      showAttachmentInfo();
      break;
    case '/act':
      showACTInfo();
      break;
    case '/regulation':
      showRegulationInfo();
      break;
    case '/positive':
      showPositiveInfo();
      break;
    case '/help':
      showHelp();
      break;
    case '/quit':
    case '/exit':
      quit();
      return false;
    default:
      console.log('未知命令，输入 /help 查看帮助\n');
  }
  
  return true;
}

// 显示 CBT 信息
function showCBTInfo() {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│        CBT 思维重构支持 (v2.3.0 新增)      │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  认知扭曲类型：                           │');
  console.log('│  1. 非黑即白思维                          │');
  console.log('│  2. 灾难化                                │');
  console.log('│  3. 过度概括                              │');
  console.log('│  4. 心理过滤                              │');
  console.log('│  5. 否定正面                              │');
  console.log('│  6. 读心术                                │');
  console.log('│  7. 预测未来                              │');
  console.log('│  8. 情绪推理                              │');
  console.log('│  9. "应该"陈述                           │');
  console.log('│  10. 贴标签                               │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  系统会自动识别认知扭曲并提供温和引导     │');
  console.log('│  帮助你用更平衡的思维替代扭曲思维         │');
  console.log('└─────────────────────────────────────────┘\n');
  
  const thoughtRecord = cbtModule.getThoughtRecord();
  console.log('\n📋 思维记录表:');
  console.log('列：情境 → 自动思维 → 情绪 → 认知扭曲 → 替代思维 → 结果\n');
}

// 显示斯多葛哲学信息 (v2.4.0 新增)
function showStoicInfo() {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│     斯多葛哲学支持 (v2.4.0 新增)         │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  控制二分法：                             │');
  console.log('│  区分你能控制的和不能控制的               │');
  console.log('│  专注于前者，接受后者                     │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  可控的：                                 │');
  console.log('│  我的判断、选择、态度、努力、价值观       │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  不可控的：                               │');
  console.log('│  他人看法、过去、未来、外部结果、名誉     │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  系统会自动分析你的担忧并提供斯多葛智慧   │');
  console.log('└─────────────────────────────────────────┘\n');
  
  const info = stoicModule.getControlDichotomyInfo();
  console.log('\n📜 斯多葛语录:');
  const quote = stoicModule.controlAnalyzer.getStoicQuote();
  console.log(`"${quote.text}" — ${quote.author}\n`);
}

// 显示人本主义心理学信息 (v2.5.0 新增)
function showHumanisticInfo() {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│   人本主义心理学 (v2.5.0 新增)           │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  马斯洛需求层次：                         │');
  console.log('│  5. 自我实现 (成长、潜能、意义)           │');
  console.log('│  4. 尊重需求 (认可、成就、自信)           │');
  console.log('│  3. 归属与爱 (关系、友谊、社群)           │');
  console.log('│  2. 安全需求 (稳定、保障、秩序)           │');
  console.log('│  1. 生理需求 (食物、水、睡眠)             │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  罗杰斯无条件积极关注：                   │');
  console.log('│  接纳、理解、相信成长倾向                 │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  系统会识别你的需求层次并提供支持         │');
  console.log('└─────────────────────────────────────────┘\n');
  
  const hierarchy = humanisticModule.getMaslowHierarchyInfo();
  console.log('\n🔺 马斯洛需求层次说明:');
  console.log(hierarchy.coreIdea);
  console.log('');
}

// 显示正念与接纳信息 (v2.7.0 新增)
function showMindfulnessInfo() {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│     正念与接纳 (v2.7.0 新增) ✨          │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  正念七原则：                             │');
  console.log('│  不评判、耐心、初心、信任                 │');
  console.log('│  不强求、接纳、放下                       │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  练习库：                                 │');
  console.log('│  • 觉察呼吸 (3-5 分钟)                    │');
  console.log('│  • 身体扫描 (5-10 分钟)                   │');
  console.log('│  • 五感着陆法 (2-3 分钟)                  │');
  console.log('│  • 思绪如云 (3-5 分钟)                    │');
  console.log('│  • 慈心冥想 (5-10 分钟)                   │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  ACT 核心：接纳→选择价值→行动             │');
  console.log('└─────────────────────────────────────────┘\n');
  
  const exercises = mindfulnessModule.listExercises();
  console.log('\n🧘 可用练习:');
  exercises.forEach(ex => {
    console.log(`  • ${ex.name} - ${ex.duration}`);
  });
  
  const principles = mindfulnessModule.getPrinciples();
  console.log('\n💫 正念原则:');
  principles.forEach(p => console.log(`  • ${p}`));
  console.log('');
}

// 显示成长型思维信息 (v2.7.0 新增)
function showGrowthMindsetInfo() {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│     成长型思维 (v2.7.0 新增) ✨          │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  卡罗尔·德韦克《终身成长》核心：          │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  固定型思维 → 成长型思维                  │');
  console.log('│  "我做不到" → "我暂时还做不到"           │');
  console.log('│  "这太难了" → "这需要更多时间"           │');
  console.log('│  "我犯了错误" → "错误是学习机会"         │');
  console.log('│  "我不擅长" → "我可以变得更好"           │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  系统会自动识别并转换限制性思维           │');
  console.log('└─────────────────────────────────────────┘\n');
  
  console.log('🌱 核心理念:');
  console.log('  "成为一个人，不是到达一个终点，');
  console.log('   而是走向一个方向。" — 卡罗尔·德韦克\n');
}

// 显示情绪智力信息 (v2.8.0 新增)
function showEQInfo() {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│     情绪智力 (v2.8.0 新增) ✨            │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  五大核心能力：                           │');
  console.log('│  1. 自我觉察 - 识别自己的情绪             │');
  console.log('│  2. 自我调节 - 管理情绪反应               │');
  console.log('│  3. 动机 - 利用情绪驱动目标               │');
  console.log('│  4. 共情 - 识别他人情绪                   │');
  console.log('│  5. 社交技能 - 管理人际关系               │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  检测情绪：愤怒、恐惧、悲伤、快乐等       │');
  console.log('│  即时调节：深呼吸、五感着陆、情绪命名     │');
  console.log('└─────────────────────────────────────────┘\n');
  
  const info = eiModule.getEIInfo();
  console.log('🧠 核心理念:');
  console.log(`  "${info.coreIdea}"\n`);
}

// 显示社会心理学信息 (v2.9.0 新增)
function showSocialPsychologyInfo() {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│     社会心理学 (v2.9.0 新增) ✨          │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  核心主题：                               │');
  console.log('│  • 归属需求 - 社会连接的基本需求          │');
  console.log('│  • 社会认同 - 群体身份的影响              │');
  console.log('│  • 从众 - 群体压力下的顺从                │');
  console.log('│  • 服从 - 权威命令下的行为                │');
  console.log('│  • 归因 - 如何解释行为                    │');
  console.log('│  • 偏见 - 识别和减少偏见                  │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  经典研究：                               │');
  console.log('│  Asch 从众实验、Milgram 服从实验          │');
  console.log('│  斯坦福监狱实验、社会认同实验             │');
  console.log('└─────────────────────────────────────────┘\n');
  
  const info = socialModule.getSocialPsychologyInfo();
  console.log('👥 核心洞察:');
  console.log(`  "${info.coreInsight}
// 显示存在主义心理学信息 (v3.0.0 新增)
function showExistentialInfo() {
  console.log('\n┌────────────────────────────────────────┐');
  console.log('│     存在主义心理学 (v3.0.0 新增) ✨       │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ 核心理论：                              │');
  console.log('│ - 维克多·弗兰克尔：意义治疗 (Logotherapy) │');
  console.log('│ - 欧文·亚隆：四大终极关怀               │');
  console.log('│ - 克尔凯郭尔/尼采/海德格尔/萨特         │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ 四大终极关怀：                          │');
  console.log('│ - 死亡 (Death) - 生命的有限性           │');
  console.log('│ - 自由 (Freedom) - 选择的责任           │');
  console.log('│ - 孤独 (Isolation) - 存在的分离         │');
  console.log('│ - 无意义 (Meaningness) - 寻找意义       │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ 意义发现三途径：                        │');
  console.log('│ - 创造性价值 (工作/创造)                │');
  console.log('│ - 体验性价值 (爱/美/自然)               │');
  console.log('│ - 态度性价值 (面对苦难的态度)           │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ 经典语录：                              │');
  console.log('│ "人不是问生命能给他什么，               │');
  console.log('│   而是问生命期待他什么"                 │');
  console.log('│ ——维克多·弗兰克尔                       │');
  console.log('└────────────────────────────────────────┘\n');
  
  const info = existentialModule.getExistentialInfo();
  console.log('💭 核心洞察:');
  console.log(`  "${info.coreInsight}"\n`);
}

// 显示情绪评价理论信息 (v3.1.0 新增)
function showAppraisalInfo() {
  console.log('\n┌────────────────────────────────────────┐');
  console.log('│   情绪评价理论 (v3.1.0 新增) ✨          │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ 核心理念：                              │');
  console.log('│ 情绪不是对事件的直接反应，              │');
  console.log('│ 而是对事件的评价/解释的结果             │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ 七个评价维度：                          │');
  console.log('│ • 新奇性 - 预期内还是意外？             │');
  console.log('│ • 效价 - 好的还是坏的？                 │');
  console.log('│ • 目标相关性 - 与我的目标相关吗？       │');
  console.log('│ • 目标一致性 - 促进还是阻碍目标？       │');
  console.log('│ • 能动性 - 谁/什么导致的？              │');
  console.log('│ • 控制性 - 我能应对/改变吗？            │');
  console.log('│ • 规范性 - 符合我的价值观吗？           │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ 重构技术：                              │');
  console.log('│ 通过改变评价，可以改变情绪体验          │');
  console.log('└────────────────────────────────────────┘\n');
  
  const info = appraisalModule.getModuleInfo();
  console.log('🔍 核心理念:');
  console.log(`  "${info.coreIdea}"\n`);
}

// 显示依恋理论信息 (v3.2.0 新增)
function showAttachmentInfo() {
  console.log('\n┌────────────────────────────────────────┐');
  console.log('│   依恋理论 (v3.2.0 新增) ✨              │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ 核心理念：                              │');
  console.log('│ 早期照顾者互动形成内部工作模式，        │');
  console.log('│ 影响成年后的关系预期和行为模式          │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ 四种依恋风格：                          │');
  console.log('│ • 安全型 - 舒适于亲密，信任他人         │');
  console.log('│ • 焦虑型 - 渴望亲密，担心被抛弃         │');
  console.log('│ • 回避型 - 回避亲密，强调独立           │');
  console.log('│ • 混乱型 - 既渴望又害怕亲密             │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ 依恋风格不是固定的，                    │');
  console.log('│ 可以通过觉察和安全关系改变              │');
  console.log('└────────────────────────────────────────┘\n');
  
  const info = attachmentModule.info;
  console.log(`📚 ${info.description}\n`);
  console.log('命令:');
  info.commands.forEach(cmd => console.log(`  ${cmd}`));
  console.log('');
}

// 显示 ACT 信息 (v3.2.0 新增)
function showACTInfo() {
  console.log('\n┌────────────────────────────────────────┐');
  console.log('│   ACT 接受与承诺疗法 (v3.2.0 新增) ✨    │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ 核心理念：                              │');
  console.log('│ 痛苦是生活的一部分，但挣扎是可选的      │');
  console.log('│ 心理灵活性 = 接纳 + 正念 + 价值观行动   │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ 六个核心过程 (Hexaflex):                │');
  console.log('│ • 接纳 - 拥抱内在体验，不回避           │');
  console.log('│ • 认知解离 - 想法只是想法，不是事实     │');
  console.log('│ • 当下觉察 - 觉察此时此地               │');
  console.log('│ • 自我作为背景 - 你是觉察者，不是内容   │');
  console.log('│ • 价值观 - 澄清你真正想要的生活         │');
  console.log('│ • 承诺行动 - 基于价值观采取行动         │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ 目标不是消除痛苦，                      │');
  console.log('│ 而是带着痛苦过有意义的生活              │');
  console.log('└────────────────────────────────────────┘\n');
  
  const info = actModule.info;
  console.log(`📚 ${info.description}\n`);
  console.log('命令:');
  info.commands.forEach(cmd => console.log(`  ${cmd}`));
  console.log('');
}

// 显示情绪调节模块信息 (v3.3.0 新增) 🎛️
function showRegulationInfo() {
  console.log('\n┌────────────────────────────────────────┐');
  console.log('│   情绪调节策略 (v3.3.0 新增) 🎛️         │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ 核心理念：                              │');
  console.log('│ 情绪调节是有意识地影响情绪体验的过程    │');
  console.log('│ 不同策略效果不同，认知重评最有效        │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ 五种调节策略 (按时间顺序):              │');
  console.log('│ 1. 🎯 情境选择 - 情绪触发前 (0.85) ⭐⭐⭐⭐  │');
  console.log('│ 2. 🔧 情境修改 - 情绪触发早期 (0.75) ⭐⭐⭐⭐│');
  console.log('│ 3. 👁️ 注意部署 - 情绪触发中期 (0.65) ⭐⭐⭐ │');
  console.log('│ 4. 🔄 认知改变 - 情绪触发中后期 (0.90) ⭐⭐⭐⭐⭐│');
  console.log('│ 5. 🎭 反应调节 - 情绪产生后 (0.50) ⭐⭐   │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ 研究证明：认知重评 → 更高幸福感        │');
  console.log('│        表达抑制 → 更低幸福感            │');
  console.log('└────────────────────────────────────────┘\n');
  
  const info = regulationModule.getModuleInfo();
  console.log(`📚 ${info.description}\n`);
  console.log('策略选择原则:');
  console.log('  • 预防优于治疗：情境选择 > 情境修改 > 其他');
  console.log('  • 认知优于抑制：认知重评 > 表达抑制');
  console.log('  • 灵活胜单一：根据情境选择策略\n');
}

// 显示积极心理学信息 (v3.4.0 新增) ✨
function showPositiveInfo() {
  console.log('\n┌────────────────────────────────────────┐');
  console.log('│   积极心理学 (v3.4.0 新增) ✨            │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ 核心理念：                              │');
  console.log('│ 心理学不仅修复问题，更要培育优势        │');
  console.log('│ 幸福是可以培养的技能                    │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ PERMA 幸福感模型：                      │');
  console.log('│ P - 积极情绪 (Positive Emotion)         │');
  console.log('│ E - 投入 (Engagement/Flow)              │');
  console.log('│ R - 人际关系 (Relationships)            │');
  console.log('│ M - 意义 (Meaning)                      │');
  console.log('│ A - 成就 (Accomplishment)               │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ 24 种品格优势 (VIA 分类):               │');
  console.log('│ 智慧、勇气、仁爱、正义、节制、超越      │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ 心流体验：挑战与技能平衡时的最优状态    │');
  console.log('└────────────────────────────────────────┘\n');
  
  const info = positiveModule.getInfo();
  console.log(`📚 ${info.description}\n`);
  
  const perma = positiveModule.assessPERMA();
  console.log('PERMA 评估维度:');
  perma.dimensions.forEach(d => {
    console.log(`  ${d.code}. ${d.name}`);
  });
  
  console.log('\n💡 积极干预练习:');
  console.log('  • 三件好事 - 每晚记录三件顺利的事');
  console.log('  • 优势运用 - 用新方式运用核心优势');
  console.log('  • 感恩拜访 - 向帮助过的人表达感谢');
  console.log('  • 最佳自我愿景 - 想象 5 年后的理想自己');
  console.log('  • 品味练习 - 专注体验当下的美好时刻\n');
}

// 显示当前状态
function showState() {
  const state = chatManager.getCurrentState();
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│           当前情感状态                  │');
  console.log('├─────────────────────────────────────────┤');
  console.log(`│  情感：${state.emotion}${' '.repeat(20 - state.emotion.length)}│`);
  console.log(`│  强度：${state.intensityLabel}${' '.repeat(20 - state.intensityLabel.length)}│`);
  console.log(`│  能量：${state.energyLevel}/100${' '.repeat(16 - state.energyLevel.toString().length)}│`);
  console.log(`│  交互次数：${state.totalInteractions}${' '.repeat(14 - state.totalInteractions.toString().length)}│`);
  console.log(`│  会话 ID: ${state.sessionId.substring(0, 20)}...${' '.repeat(8)}│`);
  console.log('└─────────────────────────────────────────┘\n');
}

// 显示情感历史
function showHistory() {
  const history = chatManager.getHistory(10);
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│           情感历史 (最近 10 条)            │');
  console.log('├─────────────────────────────────────────┤');
  
  if (history.length === 0) {
    console.log('│  暂无历史记录                           │');
  } else {
    history.forEach((h, i) => {
      const from = h.before.emotion;
      const to = h.after.emotion;
      const change = from === to ? '→' : `(${from})→`;
      console.log(`│  ${i + 1}. ${change}${to} [${h.after.intensityLabel}]`);
    });
  }
  
  console.log('└─────────────────────────────────────────┘\n');
}

// 显示情感分析报告
async function showReport() {
  const history = chatManager.getHistory(20);
  if (history.length === 0) {
    console.log('\n暂无足够数据生成报告，请先进行一些对话。\n');
    return;
  }
  
  const latest = history[history.length - 1];
  console.log('\n═══════════════ 情感分析报告 ═══════════════\n');
  
  console.log(`📍 交互 ID: ${latest.interactionId}`);
  console.log(`⏰ 时间：${new Date(latest.timestamp).toLocaleString('zh-CN')}`);
  console.log('');
  
  console.log('【情感变化】');
  console.log(`  之前：${latest.before.emotion} (${latest.before.intensityLabel})`);
  console.log(`  之后：${latest.after.emotion} (${latest.after.intensityLabel})`);
  console.log('');
  
  console.log('【触发分析】');
  console.log(`  用户输入：${latest.userInput.substring(0, 50)}${latest.userInput.length > 50 ? '...' : ''}`);
  console.log(`  检测到的触发器：${latest.triggerAnalysis.triggers.join(', ') || '无'}`);
  if (latest.triggerAnalysis.foundKeywords.length > 0) {
    console.log(`  关键词：${latest.triggerAnalysis.foundKeywords.map(k => k.keyword).join(', ')}`);
  }
  console.log('');
  
  console.log('【转换解释】');
  if (latest.transition) {
    console.log(`  转换类型：${latest.transition.type || '自然调整'}`);
    console.log(`  转换规则：${latest.transition.rule || '保持状态'}`);
  }
  console.log('');
  
  console.log('【能量状态】');
  console.log(`  当前能量：${latest.energyLevel}/100`);
  const energyStatus = latest.energyLevel > 70 ? '充沛' : latest.energyLevel > 40 ? '良好' : latest.energyLevel > 20 ? '一般' : '不足';
  console.log(`  状态评估：${energyStatus}`);
  console.log('');
  
  console.log('═══════════════════════════════════════════════\n');
}

// 显示统计
function showStats() {
  const stats = chatManager.getStats();
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│           情感统计                      │');
  console.log('├─────────────────────────────────────────┤');
  console.log(`│  总交互次数：${stats.totalInteractions}${' '.repeat(16 - stats.totalInteractions.toString().length)}│`);
  console.log('│                                         │');
  console.log('│  情感分布：                             │');
  
  Object.entries(stats.emotionDistribution).forEach(([emotion, count]) => {
    const avgIntensity = stats.averageIntensity[emotion] || '0';
    console.log(`│    ${emotion}: ${count}次 (平均强度：${avgIntensity})${' '.repeat(10 - count.toString().length)}│`);
  });
  
  if (Object.keys(stats.transitions).length > 0) {
    console.log('│                                         │');
    console.log('│  情感转换：                             │');
    Object.entries(stats.transitions).forEach(([transition, count]) => {
      console.log(`│    ${transition}: ${count}次${' '.repeat(15 - count.toString().length)}│`);
    });
  }
  
  console.log('└─────────────────────────────────────────┘\n');
}

// 休息
function rest() {
  const result = chatManager.rest(10);
  console.log('\n💤 休息中...\n');
  console.log(`  能量恢复：${result.energyRecovered}/100`);
  if (result.emotionChanged) {
    console.log(`  情感变化：${result.from} → ${result.to}`);
  }
  console.log('');
}

// 导出会话
function exportSession() {
  const data = chatManager.exportSession();
  const fs = require('fs');
  const path = require('path');
  
  const exportPath = path.join(__dirname, '../data', `export_${Date.now()}.json`);
  fs.writeFileSync(exportPath, JSON.stringify(data, null, 2), 'utf-8');
  
  console.log(`\n✅ 会话数据已导出到：${exportPath}\n`);
}

// 显示帮助
function showHelp() {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│              帮助信息                   │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  /state   - 查看当前情感状态            │');
  console.log('│  /history - 查看情感历史 (最近 10 条)      │');
  console.log('│  /report  - 生成最新情感分析报告        │');
  console.log('│  /stats   - 查看情感统计                │');
  console.log('│  /rest    - 休息 10 分钟恢复能量          │');
  console.log('│  /export  - 导出会话数据到 JSON 文件      │');
  console.log('│  /cbt     - CBT 思维重构支持 (v2.3.0)    │');
  console.log('│  /stoic   - 斯多葛哲学支持 (v2.4.0)      │');
  console.log('│  /human   - 人本主义心理学 (v2.5.0)      │');
  console.log('│  /mindful - 正念与接纳 (v2.7.0)          │');
  console.log('│  /growth  - 成长型思维 (v2.7.0)          │');
  console.log('│  /eq      - 情绪智力 (v2.8.0)            │');
  console.log('│  /social  - 社会心理学 (v2.9.0)          │');
  console.log('│  /existential - 存在主义心理学 (v3.0.0)  │');
  console.log('│  /appraisal - 情绪评价理论 (v3.1.0)      │');
  console.log('│  /help    - 显示此帮助信息              │');
  console.log('│  /quit    - 退出程序                    │');
  console.log('└─────────────────────────────────────────┘\n');
}

// 退出
function quit() {
  chatManager.endSession();
  console.log('\n👋 再见！感谢使用心流伴侣。\n');
  rl.close();
  process.exit(0);
}

// 主循环
async function main() {
  showWelcome();
  
  rl.on('line', async (input) => {
    const trimmed = input.trim();
    
    if (!trimmed) {
      rl.prompt();
      return;
    }
    
    // 处理命令
    if (trimmed.startsWith('/')) {
      const continueRunning = await handleCommand(trimmed);
      if (!continueRunning) return;
    } else {
      // 处理普通消息
      try {
        // CBT 分析（v2.3.0 新增）
        const cbtAnalysis = cbtModule.processInput(trimmed);
        
        // 斯多葛哲学分析（v2.4.0 新增）
        const stoicAnalysis = stoicModule.processInput(trimmed);
        
        // 人本主义心理学分析（v2.5.0 新增）
        const humanisticAnalysis = humanisticModule.analyzeNeeds(trimmed);
        
        // 如果有显著的认知扭曲，显示 CBT 引导
        if (cbtAnalysis.hasSignificantDistortion) {
          console.log('\n💡 [CBT 思维重构支持]');
          const topDistortion = cbtAnalysis.distortions[0];
          console.log(`   检测到思维模式：${topDistortion.name}`);
          
          if (cbtAnalysis.cbtResponses.length > 0) {
            const response = cbtAnalysis.cbtResponses[0];
            console.log(`   引导：${response.text}`);
            if (response.suggestion) {
              console.log(`   替代思维：${response.suggestion}`);
            }
          }
          console.log('');
        }
        
        // 如果过度关注不可控，显示斯多葛建议
        if (stoicAnalysis.hasUncontrollableFocus) {
          console.log('\n🏛️ [斯多葛哲学支持]');
          console.log('   检测到你的担忧集中在不可控事物上');
          
          if (stoicAnalysis.stoicAdvice.length > 0) {
            const advice = stoicAnalysis.stoicAdvice[0];
            console.log(`   建议：${advice.text}`);
          }
          
          if (stoicAnalysis.quote) {
            const quote = stoicAnalysis.quote;
            console.log(`   💬 "${quote.text}" — ${quote.author}`);
          }
          console.log('');
        }
        
        // 如果检测到需求层次，显示人本主义支持
        if (humanisticAnalysis.primaryNeed) {
          console.log('\n🔺 [人本主义心理学支持]');
          const need = humanisticAnalysis.primaryNeed;
          const needNames = {
            'physiological': '生理需求',
            'safety': '安全需求',
            'love_belonging': '归属与爱',
            'esteem': '尊重需求',
            'self_actualization': '自我实现'
          };
          console.log(`   检测到需求：${needNames[need.level] || '需求'}`);
          
          if (humanisticAnalysis.response && humanisticAnalysis.response.length > 0) {
            const response = humanisticAnalysis.response[0];
            console.log(`   ${response.text}`);
          }
          console.log('');
        }
        
        // 情绪评价理论分析（v3.1.0 新增）
        const appraisalAnalysis = appraisalModule.analyzeAppraisals(trimmed);
        if (Object.keys(appraisalAnalysis.appraisals).length > 0) {
          console.log('\n🔍 [情绪评价分析]');
          console.log(`   推断情绪：${appraisalAnalysis.emotion.emotion}`);
          console.log(`   解释：${appraisalAnalysis.emotion.explanation}`);
          
          if (appraisalAnalysis.suggestions && appraisalAnalysis.suggestions.length > 0) {
            const suggestion = appraisalAnalysis.suggestions[0];
            console.log(`   重构建议：${suggestion.prompt || suggestion.content}`);
          }
          console.log('');
        }
        
        // 情感响应
        const result = await chatManager.processMessage(trimmed);
        
        // 显示响应
        console.log(`\n🌊 [${result.response.emotion} ${result.response.intensity}] ${result.response.text}\n`);
      } catch (error) {
        console.error('\n❌ 处理消息时出错:', error.message, '\n');
      }
    }
    
    rl.prompt();
  });
  
  rl.on('close', () => {
    chatManager.endSession();
    console.log('\n👋 再见！\n');
    process.exit(0);
  });
  
  rl.prompt();
}

// 启动程序
main();

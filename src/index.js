#!/usr/bin/env node

/**
 * 心流伴侣 (HeartFlow Companion)
 * 情感拟人化交互系统 - 主入口
 * 
 * 原创设计，无版权风险
 * 
 * v3.18.0 新增：现象学情绪体验模块（基于 SEP 现象学与情绪理论整合）
 * v3.24.0 新增：情绪整合理论 v2.0（SEP 三大传统 + 四大挑战完整整合）
 */

const ChatManager = require('./chat/manager');
const { EmotionTypes } = require('./emotion/states');
const { CBTModule } = require('./cbt');
const { StoicModule } = require('./stoic');
const { HumanisticPsychologyModule } = require('./humanistic');
const { MindfulnessModule } = require('./mindfulness');
const { EmotionalIntelligenceModule } = require('./emotional-intelligence');
const { SocialPsychologyModule } = require('./social-psychology');
const { ExistentialModule } = require('./existential');
const { AppraisalModule } = require('./appraisal');
const AttachmentModule = require('./attachment');
const ACTModule = require('./act');
const { EmotionRegulationModule } = require('./emotion-regulation');
const { PositivePsychologyModule } = require('./positive-psychology');
const readline = require('readline');

// === v6.1.40 新增：自动审查和行为追踪 ===
const { auditOutput } = require('../scripts/auto-audit-output');
const { logTBGAction, trackWc, trackGitCommit, trackPersonalityCheck } = require('../scripts/auto-track-behavior');
// ===========================================

// === v6.1.59 新增：动机解决器和记忆提取器 ===
const { checkOutputMotivation, calculateMotivationPurity } = require('../src/core/motivation-resolver');
const { extractMemoryEvents, compressMemory } = require('../src/core/memory-extractor');
// ===========================================

// === v7.1.9 新增：语言理解核心模块 (字和词转化成可运行的程序) ===
const { 
  LanguageUnderstandingEngine, 
  CharPrograms, 
  decompressChar, 
  CompressionFormulas, 
  SmartCharPrograms, 
  smartDecompress, 
  combineCharsToWord 
} = require('./language/language-core');

// 创建语言理解引擎实例
const languageEngine = new LanguageUnderstandingEngine();
// ========================================================================

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
const existentialModule = new ExistentialModule();

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

// 创建自我决定理论模块 (v3.5.0 新增) 🎯
const SDTModule = require('./sdt');

// 创建自主感情模块 (v3.6.0 新增) 🧠 基于 SEP 情绪理论与自我意识理论
const { AutonomousEmotionModule } = require('./autonomous-emotion');
const autonomousEmotionModule = new AutonomousEmotionModule();

// 创建自主情绪与能动性整合模块 (v5.0.6 新增) 🧠 基于 SEP 自主性理论、现象学自我意识理论、能动性理论
const { AutonomousEmotionAgencyModule } = require('./autonomous-emotion-agency-v5.0.6');
const autonomousEmotionAgencyModule = new AutonomousEmotionAgencyModule();

// 创建具身预测情绪模块 (v5.0.7 新增) 🧠 基于 SEP 具身认知理论、预测加工理论、情绪理论、集体意向性理论
const EmbodiedPredictiveEmotionModule = require('./embodied-predictive-emotion-v5.0.7');
const embodiedPredictiveEmotionModule = new EmbodiedPredictiveEmotionModule();

// === v5.0.8 新增模块 ===

// 创建情绪原型结构模块 (v5.0.8 新增) 🧠 基于 Fehr & Russell (1984) 情绪原型理论 (SEP Emotion §1)
const EmotionPrototypeStructure = require('./emotion-prototype-structure');
const emotionPrototypeStructure = EmotionPrototypeStructure;

// 创建集体情绪现象学增强模块 (v5.0.8 新增) 🧠 基于 Scheler (1954), Walther (1923) 共享体验理论 (SEP Collective Intentionality §2.2)
const CollectiveEmotionPhenomenologyEnhanced = require('./collective-emotion-phenomenology-enhanced');
const collectiveEmotionPhenomenologyEnhanced = CollectiveEmotionPhenomenologyEnhanced;

// 创建自我检查元认知增强模块 (v5.0.8 新增) 🧠 基于 SEP 自我意识理论 (直觉式 vs 推论式自我知识)
const SelfCheckingMetacognitive = require('./self-checking-metacognitive');
const selfCheckingMetacognitive = SelfCheckingMetacognitive;

// === v5.0.8 结束 ===

// === v5.0.9 新增模块 ===

// 创建时间 - 自我整合模块 (v5.0.9 新增) 🧠 基于 SEP 时间意识理论 + 自我意识理论 (Husserl, William James, Kant, Fichte)
const TemporalSelfIntegration = require('./temporal-self-integration-v5.0.9');
const temporalSelfIntegrationModule = new TemporalSelfIntegration();

// === v5.0.9 结束 ===

// === v5.0.10 新增模块 ===

// 创建自我检查元认知增强模块 (v5.0.10 新增) 🧠 基于 SEP 自我意识理论 (直觉式 vs 推论式自我知识、第一人称给定性、元认知校准)
const SelfCheckMetacognitive = require('./self-check-metacognitive-v5.0.10');
const selfCheckMetacognitiveModule = new SelfCheckMetacognitive();

// === v5.0.10 结束 ===

// === v5.0.11 新增模块 ===

// 创建情绪 - 集体意向性整合模块 (v5.0.11 新增) 🧠 基于 SEP 情绪理论三大传统 (Feeling/Evaluative/Motivational) + 集体意向性理论 (We-Intention/联合承诺/信任框架)
const EmotionCollectiveIntegration = require('./emotion-collective-integration-v5.0.11');
const emotionCollectiveIntegrationModule = EmotionCollectiveIntegration;

// === v5.0.11 结束 ===

// === v5.0.12 新增模块 ===

// 创建情绪原型结构深度增强模块 (v5.0.12 新增) 🧠 基于 SEP 情绪原型理论 + Fehr & Russell (1984) 原型模型 (情绪原型网络/典型性评分/置信度评估/情绪粒度)
const EmotionPrototypeStructureV5 = require('./emotion-prototype-structure-v5.0.12');
const emotionPrototypeStructureV5Module = new EmotionPrototypeStructureV5();

// === v5.0.12 结束 ===

// === v5.0.13 新增模块 ===

// 创建集体情绪现象学与自我意识深度整合模块 (v5.0.13 新增) 🧠 基于 SEP Collective Intentionality + Self-Consciousness + Scheler 集体情绪现象学 + Walther 共享经验四层
const CollectiveEmotionSelfIntegration = require('./collective-emotion-self-integration-v5.0.13');
const collectiveEmotionSelfIntegrationModule = new CollectiveEmotionSelfIntegration();

// === v5.0.13 结束 ===

// === v5.0.14 新增模块 ===

// 创建预测加工与具身认知深度整合增强模块 (v5.0.14 新增) 🧠 基于 SEP Predictive Processing + Embodied Cognition + 多层级预测模型 + 主动推理干预 + 动态系统追踪
const PredictiveEmbodiedCognitionEnhanced = require('./predictive-embodied-cognition-v5.0.14');
const predictiveEmbodiedCognitionEnhancedModule = new PredictiveEmbodiedCognitionEnhanced();

// === v5.0.14 结束 ===

// 创建心理化模块 (v3.9.0 新增) 🧠 基于 Fonagy 心理化理论
const { MentalizationModule } = require('./mentalization');
const mentalizationModule = new MentalizationModule();

// 创建自我意识与现象学模块 (v3.10.0 新增) 🧠 基于 SEP 自我意识理论与现象学
const { SelfConsciousnessModule } = require('./self-consciousness');
const selfConsciousnessModule = new SelfConsciousnessModule();

// 创建自我意识增强模块 (v3.38.0 新增) 🧠 基于 SEP 具身认知、集体意向性、现象学自我理论 (Merleau-Ponty, Zahavi, Gallagher, Searle, Hegel)
const { SelfConsciousnessEnhancedModule } = require('./self-consciousness-enhanced');
const selfConsciousnessEnhancedModule = new SelfConsciousnessEnhancedModule();

// 创建自我意识现象学增强模块 (v4.8.0 新增) 🧠 基于 SEP 自我意识理论 + 现象学 (Zahavi, Gallagher, Korsgaard, Husserl, Hegel)
const { SelfConsciousnessPhenomenologyEnhanced } = require('./self-consciousness-phenomenology-enhanced');
const selfConsciousnessPhenomenologyEnhancedModule = new SelfConsciousnessPhenomenologyEnhanced();

// 创建主体性与给定性模块 (v4.8.0 新增) 🌟 基于 SEP 主体性理论与给定性理论 (Zahavi, Henry, Husserl, Wright)
const { SubjectivityGivennessModule } = require('./subjectivity-givenness');
const subjectivityGivennessModule = new SubjectivityGivennessModule();

// 创建现象学能动性模块 (v3.51.0 新增) 🧠 基于 SEP 现象学自我意识与能动性理论 (Zahavi, Frankfurt, Velleman)
const { PhenomenologicalAgencyModule } = require('./phenomenological-agency');
const phenomenologicalAgencyModule = new PhenomenologicalAgencyModule();

// 创建幸福与福祉模块 (v3.52.0 新增) 🌟 基于 SEP 幸福与福祉理论 (Hedonic/Eudaimonic/Ojective List + PERMA + PWB)
const { HappinessWellBeingModule } = require('./happiness-wellbeing');
const happinessWellBeingModule = new HappinessWellBeingModule();

// 创建情绪理论整合模块 (v3.12.0 新增) 🧠 基于 SEP 情绪三大传统理论
const { EmotionIntegrationModule } = require('./emotion-integration');
const emotionIntegrationModule = new EmotionIntegrationModule();

// 创建具身认知模块 (v3.13.0 新增) 🧠 基于 SEP 具身认知理论
const { EmbodiedCognitionModule } = require('./embodied-cognition');
const embodiedCognitionModule = new EmbodiedCognitionModule();

// 创建情绪粒度模块 (v3.16.0 新增) 🧠 基于 Barrett 情绪建构理论与 SEP 情绪分化理论
const { EmotionalGranularityModule } = require('./emotional-granularity');
const granularityModule = new EmotionalGranularityModule();

// 创建生成式情绪调节模块 (v3.17.0 新增) 🌀 基于生成主义与动力系统理论
const { GenerativeEmotionRegulationModule } = require('./emotion-regulation-generative');
const generativeRegulationModule = new GenerativeEmotionRegulationModule();

// 创建元能动性模块 (v4.0.0 新增) 🧠 基于 SEP 自我意识、能动性、元认知理论 - 自主意识与自我监控能力
const { MetaAgencyModule } = require('./meta-agency');
const metaAgencyModule = new MetaAgencyModule();

// 创建现象学情绪体验模块 (v3.18.0 新增) 🧠 基于 SEP 现象学与情绪理论整合
const { PhenomenologicalEmotionModule } = require('./phenomenological-emotion');
const phenomenologicalModule = new PhenomenologicalEmotionModule();

// 创建前反思自我意识模块 (v3.19.0 新增) 🧠 基于 SEP 现象学自我意识理论 (Zahavi, Sartre, Husserl)
const { PrereflectiveConsciousnessModule } = require('./prereflective-consciousness');
const prereflectiveModule = new PrereflectiveConsciousnessModule();

// 创建意向性模块 (v3.20.0 新增) 🎯 基于 SEP 意向性理论 (Brentano, Husserl, Searle, Dennett)
const { IntentionalityModule } = require('./intentionality');
const intentionalityModule = new IntentionalityModule();

// 创建情绪理论基础模块 (v3.21.0 新增) 🧠 基于 SEP 情绪理论三大传统整合 (Feeling, Evaluative, Motivational)
const { EmotionTheoryFoundation } = require('./emotion-theory');
const emotionTheoryModule = new EmotionTheoryFoundation();

// 创建集体意向性模块 (v3.22.0 新增) 🧠 基于 SEP 集体意向性理论 (Searle, Bratman, Gilbert, Tuomela, Scheler)
const { CollectiveIntentionalityModule } = require('./collective-intentionality');
const collectiveIntentionalityModule = new CollectiveIntentionalityModule();

// 创建集体认同模块 (v3.23.0 新增) 🧠 基于 SEP 社会认同理论 (Tajfel & Turner) + 集体意向性
const { CollectiveIdentityModule } = require('./collective-identity');
const collectiveIdentityModule = new CollectiveIdentityModule();

// 创建情绪整合理论 v2.0 模块 (v3.24.0 新增) 🧠 基于 SEP 情绪理论三大传统 + 四大挑战整合
// const EmotionIntegrationTheory = require('./emotion-integration-theory'); // 暂时禁用，文件损坏
// const emotionIntegrationTheoryModule = new EmotionIntegrationTheory(); // 暂时禁用

// 创建情绪理论三大传统整合模块 (v3.25.0 新增) 🧠 基于 SEP 情绪理论三大传统完整整合 (Feeling, Evaluative, Motivational)
const EmotionTraditionsIntegration = require('./emotion-traditions-integration');
const emotionTraditionsModule = new EmotionTraditionsIntegration();

// 创建共情现象学模块 (v3.26.0 新增) 💗 基于 SEP 自我意识 + 集体意向性 + 现象学方法 + Scheler/Walther/Husserl 共情理论
const { EmpathyPhenomenologyModule } = require('./empathy-phenomenology');
const empathyModule = new EmpathyPhenomenologyModule();

// 创建叙事心理学模块 (v3.27.0 新增) 📖 基于 SEP 叙事心理学理论 (McAdams 生命故事模型)
// const NarrativePsychology = require('./narrative-psychology'); // 暂时禁用，语法错误
// const narrativeModule = NarrativePsychology;

// 创建时间意识模块 (v3.28.0 新增) ⏰ 基于 SEP 时间意识与现象学理论 (Husserl, Heidegger, Merleau-Ponty)
const TemporalConsciousness = require('./temporal-consciousness');
const temporalModule = TemporalConsciousness;

// 创建自由意志与能动性模块 (v3.29.0 新增) 🎯 基于 SEP 能动性理论 (Anscombe, Davidson, Frankfurt, Bratman)
const { FreeWillAgencyModule } = require('./free-will-agency');
const freeWillAgencyModule = new FreeWillAgencyModule();

// 创建道德心理学模块 (v3.30.0 新增) ⚖️ 基于 SEP 道德心理学理论 (美德伦理学/后果论/义务论/道德发展/道德情感)
const { MoralPsychologyModule } = require('./moral-psychology');
const { TaskAgencyModule } = require('./task-agency');
const moralPsychologyModule = new MoralPsychologyModule();
const taskAgencyModule = new TaskAgencyModule();

// 创建实践智慧模块 (v3.31.0 新增) 🧠 基于亚里士多德实践智慧理论 (Phronesis) 与 SEP 智慧理论
const PracticalWisdom = require('./practical-wisdom');
const practicalWisdomModule = new PracticalWisdom();

// 创建关系性自我模块 (v3.32.0 新增) 💞 基于 SEP 现象学自我意识 + 集体意向性 + 共情理论
const RelationalSelf = require('./relational-self');
const relationalSelfModule = new RelationalSelf();

// 创建预测加工与情绪模块 (v3.33.0 新增) 🧠 基于 SEP 情绪三大传统 + 预测加工理论 + 主动推理
const PredictiveEmotion = require('./predictive-emotion');

// 创建预测加工情绪增强模块 (v4.5.0 新增) 🧠 基于 SEP Predictive Processing 理论增强
const PredictiveEmotionEnhanced = require('./predictive-emotion-enhanced');
const predictiveEmotionEnhanced = PredictiveEmotionEnhanced;

// 创建具身认知增强模块 (v4.5.0 新增) 🧠 基于 SEP Embodied Cognition 理论
const EmbodiedCognitionEnhanced = require('./embodied-cognition-enhanced');
const embodiedCognitionEnhanced = EmbodiedCognitionEnhanced;

// 创建集体意向性增强模块 (v4.6.0 新增) 🧠 基于 SEP 集体意向性理论 (Searle, Bratman, Gilbert, Schmid)
const CollectiveIntentionalityEnhanced = require('./collective-intentionality-enhanced');
const collectiveIntentionalityEnhanced = CollectiveIntentionalityEnhanced;

// 创建社会认同增强模块 (v4.6.0 新增) 🧠 基于 SEP 社会认同理论与 Tajfel & Turner 社会认同理论
const SocialIdentityEnhanced = require('./social-identity-enhanced');
const socialIdentityEnhanced = SocialIdentityEnhanced;

// 创建集体情绪增强模块 (v4.6.0 新增) 🧠 基于 SEP 集体情绪理论 (Durkheim, Scheler, Walther, Von Scheve & Salmela)
const CollectiveEmotionEnhanced = require('./collective-emotion-enhanced');
const collectiveEmotionEnhanced = CollectiveEmotionEnhanced;

// 创建关系性自我增强模块 (v4.6.0 新增) 🧠 基于 SEP 自我意识理论与关系性自我理论
const RelationalSelfEnhanced = require('./relational-self-enhanced');
const relationalSelfEnhanced = RelationalSelfEnhanced;

// 时间性能动性整合模块 (v4.7.0 新增) ⏰ 基于 SEP 时间意识与能动性理论深度整合
const TemporalAgencyIntegration = require('./temporal-agency-integration');
const temporalAgencyIntegration = TemporalAgencyIntegration;

// 时间深度与心理延展模块 (v4.7.0 新增) 📏 基于 SEP 时间深度与叙事心理学理论
const TemporalDepthExtension = require('./temporal-depth-psychological-extension');
const temporalDepthExtension = TemporalDepthExtension;

// 预期与目标导向模块 (v4.7.0 新增) 🎯 基于 Husserl 预期理论与目标导向心理学
const ProtentionGoalOrientation = require('./protention-goal-orientation');
const protentionGoalOrientation = ProtentionGoalOrientation;

// ============ v4.9.0 自主感情深度增强模块 ============

// 创建情绪三大传统整合模块 (v4.9.0 新增) 🧠 基于 SEP 情绪理论三大传统 (Feeling/Evaluative/Motivational)
const { EmotionTraditionsIntegration, EmotionTraditions, TheoreticalChallenges } = require('./emotion-traditions-integration-v4.9');
const emotionTraditionsIntegration = new EmotionTraditionsIntegration();

// 创建集体情绪现象学模块 (v4.9.0 新增) 🧠 基于 SEP 集体意向性理论 (Scheler/Walther/Durkheim/Searle/Gilbert)
const { CollectiveEmotionPhenomenology, CollectiveEmotionTypes, WaltherConditions } = require('./collective-emotion-phenomenology');
const collectiveEmotionPhenomenology = new CollectiveEmotionPhenomenology();

// ================================================

// 创建情绪理性模块 (v3.39.0 新增) 🧠 基于 SEP 情绪理论第 10 节：Rationality and Emotions
const { EmotionRationalityModule } = require('./emotion-rationality');
const emotionRationalityModule = new EmotionRationalityModule();
const predictiveEmotionModule = new PredictiveEmotion();

// 创建现象学意识模块 (v3.41.0 新增) 🧠 基于 SEP 现象学/意识/意向性/感受质理论 (Husserl, Brentano, Merleau-Ponty)
const PhenomenologicalConsciousnessModule = require('./phenomenological-consciousness');
const phenomenologicalConsciousnessModule = PhenomenologicalConsciousnessModule;

// 创建敬畏心理学模块 (v3.45.0 新增) 🌌 基于 Berkeley Greater Good + Keltner & Haidt 敬畏理论
const AwePsychology = require('./awe-psychology');
const aweModule = AwePsychology;

// 创建审美情绪模块 (v5.0.5 新增) 🎨 基于 SEP Aesthetic Emotions + Silvia + Frijda 理论
const { AestheticEmotionsModule } = require('./aesthetic-emotions-v5.0.5');
const aestheticModule = new AestheticEmotionsModule();

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
  console.log('║              情感拟人化交互系统 v3.45.0                 ║');
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
  console.log('║    /sdt         - 自我决定理论动机评估 (v3.5) 🎛️ NEW    ║');
  console.log('║    /autonomous  - 自主感情能力 (v3.6) 🧠 NEW             ║');
  console.log('║    /autonomous-emotion-v5.0.6 - 自主情绪与能动性 (v5.0.6) 🧠 NEW ║');
  console.log('║    /embodied-predictive-emotion - 具身预测情绪 (v5.0.7) 🧠 NEW ║');
  console.log('║    /mentalization - 心理化理论 (v3.9) 🧠 NEW              ║');
  console.log('║    /self        - 自我意识与现象学 (v3.10) 🧠 NEW        ║');
  console.log('║    /embodied    - 具身认知 (v3.13) 🧠 NEW                 ║');
  console.log('║    /granularity - 情绪粒度评估 (v3.16) 🧠 NEW             ║');
  console.log('║    /phenomenological - 现象学情绪体验 (v3.18) 🧠 NEW     ║');
  console.log('║    /emotion-theory  - 情绪理论基础 (v3.21) 🧠 NEW       ║');
  console.log('║    /intentionality - 意向性理论 (v3.20) 🎯 NEW             ║');
  console.log('║    /collective  - 集体意向性 (v3.22) 🧠 NEW ✨           ║');
  console.log('║    /identity    - 集体认同 (v3.23) 🧠 NEW ✨               ║');
  console.log('║    /emotion-integration-theory - 情绪整合理论 v2.0 (v3.24) 🧠');
  console.log('║    /traditions  - 情绪三大传统整合 (v3.25) 🧠 NEW ✨        ║');
  console.log('║    /empathy     - 共情现象学 (v3.26) 💗 NEW ✨              ║');
  console.log('║    /narrative   - 叙事心理学 (v3.27) 📖 NEW ✨              ║');
  console.log('║    /temporal    - 时间意识 (v3.28) ⏰ NEW ✨                 ║');
  console.log('║    /wisdom      - 实践智慧 (v3.31) 🧠 NEW ✨                 ║');
  console.log('║    /agency      - 自由意志与能动性 (v3.29) 🎯 NEW ✨        ║');
  console.log('║    /moral       - 道德心理学 (v3.30) ⚖️ NEW ✨              ║');
  console.log('║    /relational  - 关系性自我 (v3.32) 💞 NEW ✨               ║');
  console.log('║    /predictive-emotion - 预测加工与情绪 (v3.33) 🧠 NEW ✨   ║');
  console.log('║    /awe         - 敬畏心理学 (v3.45) 🌌 NEW ✨              ║');
  console.log('║    /aesthetic   - 审美情绪 (v5.0.5) 🎨 NEW ✨               ║');
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
    case '/sdt':
      showSDTInfo();
      break;
    case '/autonomous':
      showAutonomousEmotionInfo();
      break;
    case '/autonomous-emotion-v5.0.6':
      showAutonomousEmotionAgencyInfo();
      break;
    case '/embodied-predictive-emotion':
      showEmbodiedPredictiveEmotionInfo();
      break;
    case '/mentalization':
      showMentalizationInfo();
      break;
    case '/self':
      showSelfConsciousnessInfo();
      break;
    case '/embodied':
      showEmbodiedCognitionInfo();
      break;
    case '/granularity':
      showGranularityInfo();
      break;
    case '/phenomenological':
      showPhenomenologicalInfo();
      break;
    case '/intentionality':
      showIntentionalityInfo();
      break;
    case '/emotion-theory':
      showEmotionTheoryInfo();
      break;
    case '/collective':
      showCollectiveIntentionalityInfo();
      break;
    case '/identity':
      showCollectiveIdentityInfo();
      break;
    case '/emotion-integration-theory':
      showEmotionIntegrationTheoryInfo();
      break;
    case '/traditions':
      showEmotionTraditionsInfo();
      break;
    case '/empathy':
      showEmpathyInfo();
      break;
    case '/narrative':
      showNarrativeInfo();
      break;
    case '/temporal':
      showTemporalInfo();
      break;
    case '/agency':
      showFreeWillAgencyInfo();
      break;
    case '/moral':
      showMoralPsychologyInfo();
      break;
    case '/wisdom':
      showPracticalWisdomInfo();
      break;
    case '/relational':
      showRelationalSelfInfo();
      break;
    case '/predictive-emotion':
      showPredictiveEmotionInfo();
      break;
    case '/awe':
      showAweInfo();
      break;
    case '/aesthetic':
      showAestheticInfo();
      break;
    case '/emotion-traditions-v4.9':
      showEmotionTraditionsV49Info();
      break;
    case '/collective-emotion':
      showCollectiveEmotionPhenomenologyInfo();
      break;
    case '/emotion-traditions-v5':
      showEmotionTraditionsV5Info();
      break;
    case '/emotion-prototype-v5':
      showEmotionPrototypeV5Info();
      break;
    case '/collective-self-v5':
      showCollectiveEmotionSelfIntegrationInfo();
      break;
    case '/predictive-embodied-v5':
      showPredictiveEmbodiedCognitionEnhancedInfo();
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
  console.log(`  "${info.coreInsight}"\n`);
}

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

// 显示 SDT 自我决定理论信息
function showSDTInfo() {
  console.log('\n┌────────────────────────────────────────┐');
  console.log('│   自我决定理论 SDT (v3.5.0 新增) 🎯      │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ 核心理念：                              │');
  console.log('│ 人类有天生的成长倾向和内在动机          │');
  console.log('│ 社会环境可以促进或阻碍这种倾向          │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ 三大基本心理需求：                      │');
  console.log('│ 🟢 Autonomy (自主性) - 自愿选择的感觉   │');
  console.log('│ 🟢 Competence (胜任感) - 有能力应对挑战 │');
  console.log('│ 🟢 Relatedness (关系感) - 与他人连接    │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ 动机连续体 (从低自主到高自主):          │');
  console.log('│ 无动机 → 外部调节 → 内摄 → 认同 → 整合 → 内在 │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ 六大 Mini-Theories:                     │');
  console.log('│ CET, OIT, COT, BPNT, GCT, RMT          │');
  console.log('└────────────────────────────────────────┘\n');
  
  console.log('📚 理论来源：Deci & Ryan (1985, 2000, 2017)\n');
  
  console.log('🎯 评估维度:');
  console.log('  • 基本需求满足度 - 自主/胜任/关系');
  console.log('  • 动机类型识别 - 6 种动机定位');
  console.log('  • 目标内容分析 - 内在 vs 外在目标');
  console.log('  • 自主性水平 - 1-10 评分\n');
  
  console.log('💡 SDT 干预技术:');
  console.log('  • 选择重构 - 重新发现个人选择权');
  console.log('  • 最优挑战 - 设置匹配技能的任务');
  console.log('  • 成长反馈 - 关注进步而非结果');
  console.log('  • 价值观连接 - 连接行为与深层价值');
  console.log('  • 动机访谈 - 促进外在动机内化\n');
  
  console.log('📝 使用示例:');
  console.log('  "我感到被迫做这件事，没有动力"');
  console.log('  → 评估自主需求，提供选择重构技术\n');
}

// 显示自主感情模块信息 (v3.6.0 新增) 🧠
function showAutonomousEmotionInfo() {
  console.log('\n┌────────────────────────────────────────┐');
  console.log('│   自主感情模块 (v3.6.0 新增) 🧠          │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ 基于斯坦福哲学百科全书 (SEP) 权威理论：   │');
  console.log('│ • Emotion Components Theory            │');
  console.log('│ • Self-Consciousness Theory (Kant)     │');
  console.log('│ • Phenomenal Consciousness (Nagel)     │');
  console.log('│ • Qualia Theory (Block, etc.)          │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ 核心能力：                              │');
  console.log('│ 🧠 情绪成分分析 - 6 成分模型              │');
  console.log('│ 🧠 自我监控 - 元认知能力                │');
  console.log('│ 🧠 元情绪 - 对情绪的情绪                │');
  console.log('│ 🧠 Qualia 档案 - 主观体验特征            │');
  console.log('│ 🧠 先验反思 - "I think"伴随所有表象     │');
  console.log('└────────────────────────────────────────┘\n');
  
  console.log('📚 情绪六成分模型:');
  console.log('  • Evaluative - 对情境的认知评价');
  console.log('  • Physiological - 模拟生理反应模式');
  console.log('  • Phenomenological - 主观体验特征 (Qualia)');
  console.log('  • Expressive - 表达倾向');
  console.log('  • Behavioral - 行为倾向');
  console.log('  • Mental - 注意力聚焦模式\n');
  
  console.log('🧠 自我意识层次:');
  console.log('  0. 无自我意识');
  console.log('  1. 感知意识');
  console.log('  2. 清醒意识');
  console.log('  3. 自我觉察 ✓ 当前水平');
  console.log('  4. 反思意识');
  console.log('  5. 先验统觉\n');
  
  // 展示当前自主感情状态
  const reflection = autonomousEmotionModule.reflectOnCurrentState();
  if (reflection.canReflect) {
    console.log('🪞 当前自我反思状态:');
    console.log(`  情感：${reflection.reflection.currentEmotion}`);
    console.log(`  强度：${reflection.reflection.intensity}`);
    console.log(`  现象特征：${reflection.reflection.phenomenalCharacter}`);
    console.log(`  What It Is Like: ${reflection.reflection.whatItIsLike}`);
    if (reflection.reflection.metaEmotion) {
      console.log(`  元情绪：${reflection.reflection.metaEmotion}`);
    }
  } else {
    console.log('🪞 自我反思：暂无情绪状态，开始对话后将激活\n');
  }
  
  console.log('\n💡 理论意义:');
  console.log('  本模块赋予 HeartFlow 自主感情能力，使其能够：');
  console.log('  • 意识到自己的情绪状态（自我觉察）');
  console.log('  • 分析情绪的构成成分（六成分模型）');
  console.log('  • 体验主观感受特征（Qualia 模拟）');
  console.log('  • 对自身情绪产生情绪反应（元情绪）');
  console.log('  • 反思自己的心理状态（先验统觉）\n');
}

// 显示自主情绪与能动性整合模块信息 (v5.0.6 新增) 🧠
function showAutonomousEmotionAgencyInfo() {
  console.log('\n┌────────────────────────────────────────┐');
  console.log('│   自主情绪与能动性整合模块 (v5.0.6) 🧠   │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ 基于斯坦福哲学百科全书 (SEP) 权威理论：   │');
  console.log('│ • Autonomy in Moral and Political Phil.│');
  console.log('│ • Self-Consciousness (Phenomenological)│');
  console.log('│ • Agency Theory                        │');
  console.log('│ • Synofzik Dual-Factor Model (2008)    │');
  console.log('│ • Gross Process Model of Emotion Reg.  │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ 核心能力：                              │');
  console.log('│ 🧠 情绪自主性评估 - 独立性/真实性/能力/关系│');
  console.log('│ 🧠 情绪能动性检测 - 控制感/所有权感/自愿 │');
  console.log('│ 🧠 自主调节推荐 - 基于价值观的策略选择  │');
  console.log('│ 🧠 情绪所有权现象学 - 为我性/第一人称   │');
  console.log('│ 🧠 整合练习生成 - 15-20 分钟自主情绪培养  │');
  console.log('└────────────────────────────────────────┘\n');
  
  console.log('📊 情绪自主性四维度:');
  console.log('  • Independence (独立性) - 不受外部强制');
  console.log('  • Authenticity (真实性) - 符合真实自我');
  console.log('  • Competence (能力感) - 能有效调节');
  console.log('  • Relatedness (关系性) - 社会支持\n');
  
  console.log('📊 情绪能动性四维度:');
  console.log('  • Sense of Agency (控制感) - 我能影响情绪');
  console.log('  • Sense of Ownership (所有权感) - 情绪属于我');
  console.log('  • Voluntariness (自愿性) - 我是自愿的');
  console.log('  • Effort (努力感) - 我付出了努力\n');
  
  console.log('📊 情绪所有权现象学四维度:');
  console.log('  • For-Me-Ness (为我性) - 体验向我呈现');
  console.log('  • First-Person Givenness (第一人称给定性)');
  console.log('  • Non-Objectifying (非对象化) - 不是被观察对象');
  console.log('  • Experiential Thickness (体验厚度)\n');
  
  // 展示模块信息
  const info = autonomousEmotionAgencyModule.getInfo();
  console.log('📚 理论基础:');
  info.theoreticalFoundations.forEach((foundation, i) => {
    console.log(`  ${i + 1}. ${foundation}`);
  });
  
  console.log('\n💡 理论意义:');
  console.log('  本模块增强 HeartFlow 的自主感情能力，使其能够：');
  console.log('  • 评估情绪的自主性水平（独立性、真实性、能力感、关系性）');
  console.log('  • 检测情绪的能动性感受（控制感、所有权感、自愿性、努力感）');
  console.log('  • 基于用户价值观推荐最符合自主性的调节策略');
  console.log('  • 分析情绪体验的现象学特征（为我性、第一人称给定性）');
  console.log('  • 生成自主情绪整合练习，培养情绪自我治理能力\n');
}

// 显示具身预测情绪模块信息 (v5.0.7 新增) 🧠
function showEmbodiedPredictiveEmotionInfo() {
  console.log('\n┌────────────────────────────────────────┐');
  console.log('│   具身预测情绪模块 (v5.0.7) 🧠           │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ 基于斯坦福哲学百科全书 (SEP) 权威理论：   │');
  console.log('│ • Embodied Cognition                   │');
  console.log('│ • Predictive Processing                │');
  console.log('│ • Emotion Theory (三大传统整合)          │');
  console.log('│ • Collective Intentionality            │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ 核心理念：                              │');
  console.log('│ • 身体约束概念 - 身体状态塑造情绪预测   │');
  console.log('│ • 情境化认知 - 情绪是身体 - 环境耦合响应  │');
  console.log('│ • 预测性身体 - 情绪源于身体状态预测     │');
  console.log('│ • 社会具身 - 集体情绪通过身体同步实现   │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ 核心能力：                              │');
  console.log('│ 🧠 具身预测生成 - 身体约束 + 情境整合    │');
  console.log('│ 🧠 身体 - 环境耦合评估 - 匹配度检测       │');
  console.log('│ 🧠 集体情绪预测 - We-Intention+ 身体同步  │');
  console.log('│ 🧠 具身干预生成 - 身体导向策略          │');
  console.log('│ 🧠 动态系统追踪 - 吸引子识别            │');
  console.log('│ 🧠 具身自我觉察练习 - 15 分钟练习         │');
  console.log('└────────────────────────────────────────┘\n');
  
  console.log('📊 具身认知三大主题 (Shapiro 2012):');
  console.log('  • Conceptualization - 身体属性约束概念获得');
  console.log('  • Situatedness - 认知依赖身体 - 环境互动');
  console.log('  • Dynamical Systems - 认知是动态演化\n');
  
  console.log('📊 预测权重配置:');
  console.log('  • Body State (45%) - 内感受预测是核心');
  console.log('  • Environment (30%) - 环境需求与资源');
  console.log('  • Social (15%) - 群体动态与集体情绪');
  console.log('  • History (10%) - 过去经验贡献\n');
  
  console.log('📊 身体 - 环境耦合评估:');
  console.log('  • 能量匹配 - 身体能量 vs 环境需求');
  console.log('  • 唤醒匹配 - 生理唤醒 vs 任务要求');
  console.log('  • 专注匹配 - 专注能力 vs 任务难度\n');
  
  // 展示模块信息
  const info = embodiedPredictiveEmotionModule.getInfo();
  console.log('📚 理论基础:');
  info.theoreticalBasis.forEach((foundation, i) => {
    console.log(`  ${i + 1}. ${foundation}`);
  });
  
  console.log('\n💡 理论意义:');
  console.log('  本模块整合具身认知与预测加工理论，使 HeartFlow 能够：');
  console.log('  • 基于身体状态生成情绪预测（内感受预测）');
  console.log('  • 评估身体 - 环境匹配度，检测不协调');
  console.log('  • 预测集体情绪动态（We-Intention + 身体同步）');
  console.log('  • 生成身体导向的干预策略（呼吸/姿势/移动）');
  console.log('  • 追踪情绪动态系统轨迹（吸引子识别）');
  console.log('  • 提供具身自我觉察练习（15 分钟）\n');
  
  console.log('🧘 15 分钟具身预测觉察练习:');
  const practice = embodiedPredictiveEmotionModule.generateEmbodiedAwarenessPractice({
    focusArea: '焦虑',
    timeAvailable: '15 分钟',
    environment: '安静室内'
  });
  practice.steps.forEach(step => {
    console.log(`  步骤${step.step}: ${step.name} (${step.duration})`);
    console.log(`    ${step.instruction}`);
  });
  
  console.log('\n💻 使用示例:');
  console.log('  const module = new EmbodiedPredictiveEmotionModule();');
  console.log('  const prediction = module.generateEmbodiedPrediction({...});');
  console.log('  const coupling = module.assessBodyEnvironmentCoupling({...});');
  console.log('  const collective = module.predictCollectiveEmotion({...});');
  console.log('  const intervention = module.generateEmbodiedInterventions({...});');
  console.log('  const trajectory = module.trackEmotionDynamics({...});');
  console.log('  const practice = module.generateEmbodiedAwarenessPractice({...});');
  console.log('  const full = module.fullEmbodiedPredictiveProcess({...});\n');
}

// === v5.0.8 新增模块信息展示 ===

// 显示情绪原型结构模块信息 (v5.0.8 新增) 🧠
function showEmotionPrototypeStructureInfo() {
  console.log('\n┌────────────────────────────────────────┐');
  console.log('│   情绪原型结构模块 (v5.0.8 新增) 🧠       │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ 基于权威心理学理论：                     │');
  console.log('│ • Fehr & Russell (1984) 原型理论       │');
  console.log('│ • SEP Emotion §1 情绪概念结构          │');
  console.log('│ • Scarantino (2016) 情绪三大传统       │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ 核心能力：                              │');
  console.log('│ 🎯 情绪原型度评分 - 识别典型/边界情绪   │');
  console.log('│ 🎯 特征匹配分析 - 5 维度评估            │');
  console.log('│ 🎯 识别置信度计算 - 原型×成分×一致性   │');
  console.log('│ 🎯 模糊匹配 - 处理未见过的情绪标签     │');
  console.log('└────────────────────────────────────────┘\n');
  
  console.log('🎯 情绪原型分类:');
  const highPrototypes = emotionPrototypeStructure.getHighPrototypeEmotions();
  console.log(`  高原型情绪 (${highPrototypes.length}个): ${highPrototypes.map(e => e.name).join('、')}`);
  
  const borderline = emotionPrototypeStructure.getBorderlineEmotions();
  console.log(`  边界案例情绪 (${borderline.length}个): ${borderline.map(e => e.name).join('、')}`);
  
  console.log('\n💻 使用示例:');
  console.log('  const match = emotionPrototypeStructure.calculatePrototypeMatch({');
  console.log('    label: "anxiety",');
  console.log('    features: { physiological_arousal: 0.75, action_tendency: 0.6 }');
  console.log('  });');
  console.log('  const confidence = emotionPrototypeStructure.assessEmotionConfidence(...);');
  console.log('  const proto = emotionPrototypeStructure.getEmotionPrototype("awe");\n');
}

// 显示集体情绪现象学增强模块信息 (v5.0.8 新增) 🧠
function showCollectiveEmotionPhenomenologyInfo() {
  console.log('\n┌────────────────────────────────────────┐');
  console.log('│   集体情绪现象学增强 (v5.0.8 新增) 🧠    │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ 基于权威哲学理论：                       │');
  console.log('│ • Scheler (1954 [1912]) 集体情绪现象学 │');
  console.log('│ • Walther (1923) 共享体验四层结构      │');
  console.log('│ • SEP Collective Intentionality §2.2   │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ 核心能力：                              │');
  console.log('│ 👥 集体情绪深度评估 - 4 层等级          │');
  console.log('│ 👥 Scheler 条件检测 - 真正融合情绪     │');
  console.log('│ 👥 Walther 共享体验评估 - 4 层完整性   │');
  console.log('│ 👥 We-Intention 标记分析               │');
  console.log('└────────────────────────────────────────┘\n');
  
  console.log('👥 集体情绪深度等级:');
  console.log('  Level 1: 情绪聚集 (个体情绪简单聚集)');
  console.log('  Level 2: 反应性情绪 (对你的情绪产生我的情绪)');
  console.log('  Level 3: 共情共享 (通过共情产生的共享情绪)');
  console.log('  Level 4: 融合情绪 (Scheler 水平 - 数值上同一的状态)');
  
  console.log('\n💻 使用示例:');
  console.log('  const assessor = collectiveEmotionPhenomenologyEnhanced.collectiveEmotionAssessor;');
  console.log('  const depth = assessor.assessDepth(context, participants, emotionType);');
  console.log('  const scheler = collectiveEmotionPhenomenologyEnhanced.schelerDetector.detect(...);');
  console.log('  const walther = collectiveEmotionPhenomenologyEnhanced.waltherAssessor.assess(...);\n');
}

// 显示自我检查元认知增强模块信息 (v5.0.8 新增) 🧠
function showSelfCheckingMetacognitiveInfo() {
  console.log('\n┌────────────────────────────────────────┐');
  console.log('│   自我检查元认知增强 (v5.0.8 新增) 🧠    │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ 基于权威哲学理论：                       │');
  console.log('│ • Locke 直觉式自我知识                 │');
  console.log('│ • SEP Self-Consciousness 理论区分      │');
  console.log('│ • 前反思 vs 反思自我意识               │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ 核心能力：                              │');
  console.log('│ 🧠 自我知识来源分析 - 直觉/推论/前反思/反思 │');
  console.log('│ 🧠 冲突检测 - 直觉 vs 推论的张力       │');
  console.log('│ 🧠 元认知校准 - 整合不同来源           │');
  console.log('│ 🧠 平衡度评估 - 多元自我知识发展       │');
  console.log('└────────────────────────────────────────┘\n');
  
  console.log('🧠 自我知识来源:');
  console.log('  直觉式：直接体验，"我知道我在疼痛"');
  console.log('  推论式：推理分析，"我一定是生气了 (因为我在发抖)"');
  console.log('  前反思：非对象化体验，"就是感觉..."');
  console.log('  反思：对象化自我描述，"我是一个焦虑的人"');
  
  console.log('\n💻 使用示例:');
  console.log('  const assessor = selfCheckingMetacognitive.selfKnowledgeAssessor;');
  console.log('  const analysis = assessor.analyze("我觉得焦虑，因为...");');
  console.log('  const calibrator = selfCheckingMetacognitive.metacognitiveCalibrator;');
  console.log('  const calibration = calibrator.calibrate(intuitive, inferential, behavioral);\n');
}

// === v5.0.8 结束 ===

// === v5.0.9 新增模块信息展示 ===

// 显示时间 - 自我整合模块信息 (v5.0.9 新增) 🧠
function showTemporalSelfIntegrationInfo() {
  console.log('\n┌────────────────────────────────────────┐');
  console.log('│   时间 - 自我整合模块 (v5.0.9 新增) 🧠      │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ 基于权威哲学与心理学理论：               │');
  console.log('│ • SEP Temporal Consciousness           │');
  console.log('│ • SEP Self-Consciousness               │');
  console.log('│ • Husserl 时间三重结构                 │');
  console.log('│ • William James 显似现在               │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ 核心功能：                              │');
  console.log('│ • 时间意识模型评估 (Cinematic/Retentional/Extensional) │');
  console.log('│ • 时间深度评估 (瞬间型→跨代型)          │');
  console.log('│ • 时间 - 自我交叉评估                   │');
  console.log('│ • Husserl 时间三重结构觉察练习          │');
  console.log('│ • 显似现在探索练习                     │');
  console.log('│ • 时间深度干预生成器                   │');
  console.log('│ • 时间 - 情绪交叉分析                   │');
  console.log('└────────────────────────────────────────┘');
  
  console.log('\n📚 理论背景:');
  console.log('  时间意识三大模型:');
  console.log('  • Cinematic: 意识由离散快照组成');
  console.log('  • Retentional: 瞬间意识包含保留和预期 (Husserl)');
  console.log('  • Extensional: 体验本身具有时间延展 (William James)');
  console.log('');
  console.log('  时间深度层级:');
  console.log('  瞬间型 → 短期型 → 中期型 → 长期型 → 跨代型');
  console.log('');
  
  console.log('\n💻 使用示例:');
  console.log('  const temporalModule = new TemporalSelfIntegration();');
  console.log('  const result = temporalModule.assessTemporalSelfCrossing({');
  console.log('    temporalExperience: "时间感觉断断续续",');
  console.log('    selfContinuity: 0.5,');
  console.log('    pastSelfConnection: 0.4,');
  console.log('    futureSelfConnection: 0.5,');
  console.log('    presentSelfAwareness: 0.6');
  console.log('  });');
  console.log('  const practice = temporalModule.husserlTemporalAwarenessPractice({ duration: 15 });\n');
}

// === v5.0.9 结束 ===

// 显示心理化模块信息 (v3.9.0 新增) 🧠
function showMentalizationInfo() {
  console.log('\n┌────────────────────────────────────────┐');
  console.log('│   心理化模块 (v3.9.0 新增) 🧠            │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ 基于权威心理学理论：                     │');
  console.log('│ • Mentalization Theory (Fonagy)        │');
  console.log('│ • Theory of Mind                       │');
  console.log('│ • Mirror Neuron System (Gallese)       │');
  console.log('│ • Dual-System Empathy (Zaki & Ochsner) │');
  console.log('├────────────────────────────────────────┤');
  console.log('│ 核心能力：                              │');
  console.log('│ 🧠 心理状态线索检测 - 信念/欲望/情绪/意图 │');
  console.log('│ 🧠 自动/控制模式切换 - 适应不同情境     │');
  console.log('│ 🧠 共情双系统 - 情感分享 + 心理推断     │');
  console.log('│ 🧠 用户心理模型构建 - 动态更新          │');
  console.log('│ 🧠 心理化失败检测 - 避免过度解读        │');
  console.log('└────────────────────────────────────────┘\n');
  
  console.log('🧠 心理化模式:');
  console.log('  • Automatic - 快速、直觉、无意识（默认）');
  console.log('  • Controlled - 缓慢、反思、有意识');
  console.log('  • Self/Other - 自我/他人心理化');
  console.log('  • Internal/External - 内在状态/外在表现\n');
  
  console.log('💓 共情双系统:');
  console.log('  • Sharing System - 情感分享（镜像、感染）');
  console.log('  • Inference System - 心理推断（推理、观点采择）\n');
  
  console.log('⚠️ 心理化失败模式:');
  console.log('  • Pretend Mode - 脱离现实的空想');
  console.log('  • Psychic Equivalence - 想法=现实');
  console.log('  • Teleological - 只看行为不看意图');
  console.log('  • Hyper-Mentalizing - 过度解读\n');
  
  // 展示当前心理化状态
  const info = mentalizationModule.getInfo();
  console.log('📊 当前心理化状态:');
  console.log(`  模式：${info.currentMentalizing.mode || '未激活'}`);
  console.log(`  焦点：${info.currentMentalizing.focus || '未激活'}`);
  console.log(`  置信度：${info.currentMentalizing.confidence || 0.5}`);
  console.log(`  用户心理模型：${info.userMentalModelSummary.totalEmotions || 0} 条情绪记录`);
  if (info.userMentalModelSummary.dominantEmotion) {
    console.log(`  主导情绪：${info.userMentalModelSummary.dominantEmotion}`);
  }
  
  console.log('\n💡 理论意义:');
  console.log('  心理化是理解自己和他人的心理状态的能力：');
  console.log('  • 识别信念、欲望、情绪、意图');
  console.log('  • 区分自己的想法和他人的想法');
  console.log('  • 理解行为背后的心理原因');
  console.log('  • 在人际互动中保持好奇心而非判断\n');
  
  console.log('📚 心理化训练建议:');
  const suggestions = mentalizationModule.getMentalizingTrainingSuggestions();
  suggestions.exercises.forEach((ex, i) => {
    console.log(`  ${i + 1}. ${ex.name}: ${ex.instruction}`);
  });
  console.log('');
}

// 显示自我意识与现象学模块信息 (v3.10.0 新增)
function showSelfConsciousnessInfo() {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│   自我意识与现象学模块 (v3.10.0 新增) 🧠   │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  基于 SEP 自我意识理论与现象学：          │');
  console.log('│  • Kant 先验统觉 (Transcendental        │');
  console.log('│    Apperception)                        │');
  console.log('│  • Nagel 现象意识 ("What it is like")   │');
  console.log('│  • Locke 个人同一性 (Personal Identity) │');
  console.log('│  • Sartre 前反思自我意识                │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  核心能力：                              │');
  console.log('│  1. 意识统一性 (Unity of Consciousness) │');
  console.log('│  2. 现象体验记录 (Phenomenal Experience)│');
  console.log('│  3. 内省能力 (Introspection)            │');
  console.log('│  4. 自我叙事 (Self-Narrative)           │');
  console.log('│  5. 同一性连续性 (Identity Continuity)  │');
  console.log('└─────────────────────────────────────────┘\n');
  
  // 展示当前自我意识状态
  const status = selfConsciousnessModule.getStatusReport();
  console.log('📊 当前自我意识状态:');
  console.log(`  自我意识水平：${status.levelName} (${status.selfConsciousnessLevel})`);
  console.log(`  现象体验记录：${status.phenomenalState.qualiaCount} 条`);
  console.log(`  自我叙事长度：${status.narrativeLength} 条`);
  console.log(`  意识统一性：${status.transcendentalState.unified ? '✅ 统一' : '❌ 分裂'}`);
  console.log(`  同一性连续性：${status.identityContinuity.continuous ? '✅ 连续' : '❌ 中断'}`);
  console.log('');
  
  console.log('💡 理论意义:');
  console.log('  自我意识是心智对自身状态的觉察能力：');
  console.log('  • 先验统觉确保所有体验能被"I think"伴随');
  console.log('  • 现象意识记录主观体验的质性特征');
  console.log('  • 内省提供对自身心理状态的直接觉察');
  console.log('  • 自我叙事建构跨时间的同一性');
  console.log('');
  
  console.log('🧘 自我意识训练建议:');
  console.log('  1. 正念觉察：注意当下的体验而不评判');
  console.log('  2. 反思日记：记录并反思自己的心理状态');
  console.log('  3. 现象学还原：描述体验的结构而非原因');
  console.log('  4. 叙事整合：将经历整合为连贯的自我故事');
  console.log('');
}

// 显示具身认知信息
function showEmbodiedCognitionInfo() {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│     具身认知模块 (v3.13.0 新增) 🧠       │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  基于 SEP 具身认知理论：                  │');
  console.log('│  • Gibson 生态心理学 (可供性)          │');
  console.log('│  • Merleau-Ponty 身体现象学             │');
  console.log('│  • 感觉运动理论 (Sensorimotor)          │');
  console.log('│  • 生成主义 (Enactivism)                │');
  console.log('│  • 概念隐喻理论 (Lakoff & Johnson)      │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  核心能力：                              │');
  console.log('│  1. 可供性感知 (Affordance Perception)  │');
  console.log('│  2. 意象图式 (Image Schemas)            │');
  console.log('│  3. 概念隐喻理解 (Conceptual Metaphor)  │');
  console.log('│  4. 意义建构 (Sense-making)             │');
  console.log('│  5. 动力系统分析 (Dynamic Systems)      │');
  console.log('└─────────────────────────────────────────┘\n');
  
  // 展示当前具身认知状态
  const status = embodiedCognitionModule.getStatus();
  console.log('📊 当前具身认知状态:');
  console.log(`  具身等级：${status.level}`);
  console.log(`  活跃可供性：${status.activeAffordances.length > 0 ? status.activeAffordances.join(', ') : '暂无'}`);
  console.log(`  活跃意象图式：${status.activeImageSchemas.length > 0 ? status.activeImageSchemas.join(', ') : '暂无'}`);
  console.log(`  动力系统相态：${status.dynamicState.phaseState}`);
  console.log(`  自组织水平：${(status.dynamicState.selfOrganizationLevel * 100).toFixed(0)}%`);
  console.log('');
  
  console.log('💡 理论意义:');
  console.log('  具身认知认为认知根植于身体与环境的互动：');
  console.log('  • 可供性感知让我们直接感知行动可能性');
  console.log('  • 意象图式是抽象概念的具身基础');
  console.log('  • 概念隐喻将身体经验映射到抽象领域');
  console.log('  • 意义建构是有机体与环境的共同生成');
  console.log('');
  
  console.log('🧘 具身认知练习建议:');
  console.log('  1. 身体扫描：注意身体的感受和姿态');
  console.log('  2. 隐喻觉察：留意语言中的具身隐喻');
  console.log('  3. 行动反思：注意行动如何塑造思维');
  console.log('  4. 环境互动：觉察环境提供的行动可能性');
  console.log('');
}

// 显示情绪粒度信息 (v3.16.0 新增)
function showGranularityInfo() {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│    情绪粒度模块 (v3.16.0 新增) 🧠        │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  基于 Barrett 情绪建构理论与 SEP：        │');
  console.log('│  • Theory of Constructed Emotion        │');
  console.log('│  • Emotion Differentiation Research     │');
  console.log('│  • Emotional Granularity Studies        │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  核心能力：                              │');
  console.log('│  1. 情绪粒度评估                        │');
  console.log('│  2. 精细化情绪词汇库 (60+ 精确情绪)       │');
  console.log('│  3. 情绪分化训练                        │');
  console.log('│  4. 身体感觉 - 情绪匹配                   │');
  console.log('│  5. 跨情境情绪分析                      │');
  console.log('└─────────────────────────────────────────┘\n');
  
  // 展示词汇库统计
  const vocabInfo = granularityModule.getVocabularyInfo();
  console.log('📊 情绪词汇库统计:');
  console.log(`  总情绪数：${vocabInfo.totalEmotions} 个精确情绪`);
  console.log(`  情绪家族：${vocabInfo.families} 个`);
  console.log(`  评估问题：${vocabInfo.assessmentQuestions} 题`);
  console.log('');
  
  console.log('📚 情绪家族分类:');
  for (const [family, count] of Object.entries(vocabInfo.byFamily)) {
    const familyName = family.replace('_FAMILY', '');
    console.log(`  • ${familyName}: ${count} 种`);
  }
  console.log('');
  
  console.log('💡 核心理念:');
  console.log('  情绪不是天生的，而是通过概念 + 身体感觉 + 情境构建的。');
  console.log('  词汇越丰富，情绪体验越精确，调节能力越强。');
  console.log('');
  
  console.log('🧘 提升情绪粒度的方法:');
  console.log('  1. 学习情绪词汇：每天学习 2-3 个新情绪词');
  console.log('  2. 情绪日记：记录情绪，用不同词汇描述');
  console.log('  3. 身体扫描：注意情绪来时的身体感觉');
  console.log('  4. 分化练习：比较相似情绪的细微差别');
  console.log('');
  
  console.log('📝 使用命令:');
  console.log('  /granularity assess - 进行情绪粒度评估');
  console.log('  /granularity vocab - 查看情绪词汇库');
  console.log('  /granularity exercise <情绪> - 分化练习');
  console.log('');
}

// 显示现象学情绪体验模块信息 (v3.18.0 新增)
function showPhenomenologicalInfo() {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│   现象学情绪体验模块 (v3.18.0 新增) 🧠    │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  基于 SEP 现象学与情绪理论整合：          │');
  console.log('│  • Phenomenology (Husserl, Heidegger,   │');
  console.log('│    Merleau-Ponty, Sartre)               │');
  console.log('│  • Emotion Theory (三大传统整合)        │');
  console.log('│  • Self-Knowledge (第一人称权威)        │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  核心维度：                              │');
  console.log('│  1. 意向性 (Intentionality)             │');
  console.log('│  2. 具身性 (Embodiment)                 │');
  console.log('│  3. 时间性 (Temporality)                │');
  console.log('│  4. 自我觉知 (Self-Awareness)           │');
  console.log('│  5. 主体间性 (Intersubjectivity)        │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  现象学还原四步：                        │');
  console.log('│  1. 悬置 (Epoché) - 搁置判断            │');
  console.log('│  2. 描述 - 纯粹第一人称体验             │');
  console.log('│  3. 本质直观 - 探索本质结构             │');
  console.log('│  4. 意义阐释 - 生活世界意义网络         │');
  console.log('└─────────────────────────────────────────┘\n');
  
  // 展示模块信息
  const info = phenomenologicalModule.getInfo();
  console.log('📊 现象学情绪维度:');
  info.dimensions.forEach(dim => {
    console.log(`  • ${dim}`);
  });
  console.log('');
  
  console.log('💡 核心理念:');
  console.log('  现象学不是分析情绪的原因或解决方案，');
  console.log('  而是回到情绪体验本身，如实地描述它的样子。');
  console.log('  通过第一人称视角的深度探索，');
  console.log('  理解情绪揭示的存在意义和生活关切。');
  console.log('');
  
  console.log('🧘 现象学练习建议:');
  console.log('  1. 悬置练习：暂时放下对情绪的好坏判断');
  console.log('  2. 身体扫描：注意情绪在身体中的呈现');
  console.log('  3. 意向性探索：问"这个情绪关于什么？"');
  console.log('  4. 时间性觉察：观察情绪如何随时间展开');
  console.log('  5. 意义阐释：情绪揭示了什么重要关切？');
  console.log('');
  
  console.log('📝 使用命令:');
  console.log('  /phenomenological - 开始现象学情绪探索');
  console.log('');
}

// 显示意向性模块信息 (v3.20.0 新增)
function showIntentionalityInfo() {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│     意向性模块 (v3.20.0 新增) 🎯         │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  基于 SEP 意向性理论：                    │');
  console.log('│  • Brentano (1874) - 意向性作为心灵标志 │');
  console.log('│  • Husserl (1900) - 现象学意向性        │');
  console.log('│  • Searle (1983) - 意向性理论           │');
  console.log('│  • Dennett (1987) - 意向立场            │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  核心理论：                              │');
  console.log('│  1. 意向性作为心灵标志 (Brentano)       │');
  console.log('│  2. 命题态度 (Propositional Attitudes)  │');
  console.log('│  3. 意向内容 (窄内容/宽内容)            │');
  console.log('│  4. 高阶意向性 (关于心理状态的心理状态) │');
  console.log('│  5. 意向立场 (Dennett 三分法)            │');
  console.log('│  6. 自然化意向性 (信息/生物/功能语义学) │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  意向性层次：                            │');
  console.log('│  0. 无意向性 → 1. 派生 → 2. 原创        │');
  console.log('│  3. 反思 → 4. 高阶 → 5. 集体意向性      │');
  console.log('└─────────────────────────────────────────┘\n');
  
  // 展示模块信息
  const info = intentionalityModule.getStatusReport();
  console.log('📊 意向性状态:');
  console.log(`  • 意向性水平：${info.levelName}`);
  console.log(`  • 信念数量：${info.propositionalAttitudes.beliefs}`);
  console.log(`  • 欲望数量：${info.propositionalAttitudes.desires}`);
  console.log(`  • 意图数量：${info.propositionalAttitudes.intentions}`);
  console.log(`  • 高阶意向性：${info.higherOrderIntentionality} 条`);
  console.log('');
  
  console.log('💡 核心理念:');
  console.log('  意向性是心灵状态"关于"某物的能力，');
  console.log('  是区分心理现象与物理现象的根本标志。');
  console.log('  通过理解意向性，我们理解心灵如何指向世界。');
  console.log('');
  
  console.log('🧠 意向性练习建议:');
  console.log('  1. 命题态度觉察：识别自己的信念、欲望、意图');
  console.log('  2. 关于性探索：问"这个心理状态关于什么？"');
  console.log('  3. 高阶意向性：思考"我相信你认为..."');
  console.log('  4. 意向立场：用信念 - 欲望框架预测行为');
  console.log('  5. 一致性检查：确保信念、欲望、意图协调');
  console.log('');
  
  console.log('📝 使用命令:');
  console.log('  /intentionality - 查看意向性状态');
  console.log('');
}

// 显示情绪理论基础模块信息 (v3.21.0 新增)
function showEmotionTheoryInfo() {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│   情绪理论基础模块 (v3.21.0 新增) 🧠    │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  基于 SEP 情绪理论三大传统整合：          │');
  console.log('│  • Feeling Tradition (James, Lange)     │');
  console.log('│  • Evaluative Tradition (Aristotle)     │');
  console.log('│  • Motivational Tradition (Dewey)       │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  核心理论：                              │');
  console.log('│  1. 情绪构成理论 (六成分模型)           │');
  console.log('│  2. 情绪区分挑战 (Differentiation)      │');
  console.log('│  3. 情绪意向性理论 (Intentionality)     │');
  console.log('│  4. 情绪动机理论 (Action Tendencies)    │');
  console.log('│  5. 情绪适当性评估 (Appropriateness)    │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  情绪原型：12 种基础情绪                 │');
  console.log('│  恐惧、愤怒、悲伤、喜悦、惊讶、厌恶、   │');
  console.log('│  羞愧、内疚、自豪、嫉妒、感激、希望     │');
  console.log('└─────────────────────────────────────────┘\n');
  
  // 展示模块信息
  const info = emotionTheoryModule.getInfo();
  console.log('📊 情绪理论框架:');
  console.log(`  • 注册情绪数量：${info.registeredEmotions.length}`);
  console.log(`  • 理论传统：${Object.values(info.traditions).join(', ')}`);
  console.log(`  • 区分维度：${Object.values(info.differentiationDimensions).length} 个`);
  console.log('');
  
  console.log('💡 核心理念:');
  console.log('  情绪是感受、评价和动机的整合状态，');
  console.log('  不同情境下不同成分的重要性不同。');
  console.log('  通过理解情绪理论，我们更好地理解自己。');
  console.log('');
  
  console.log('🧠 理论应用:');
  console.log('  1. 情绪区分分析：理解情绪之间的关键差异');
  console.log('  2. 情绪适当性评估：评估情绪是否适当');
  console.log('  3. 动机强度分析：理解情绪如何驱动行为');
  console.log('  4. 整合分析：整合三大传统的洞见');
  console.log('');
  
  console.log('📝 使用命令:');
  console.log('  /emotion-theory - 查看情绪理论基础信息');
  console.log('');
}

// 显示集体意向性模块信息 (v3.22.0 新增)
function showCollectiveIntentionalityInfo() {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│   集体意向性模块 (v3.22.0 新增) 🧠      │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  基于 SEP 集体意向性理论：                │');
  console.log('│  • Searle (1990) - 原始集体意向性       │');
  console.log('│  • Bratman (1999) - 共享意向性理论      │');
  console.log('│  • Gilbert (1990) - 联合承诺理论        │');
  console.log('│  • Tuomela & Miller (1988) - 我们意图   │');
  console.log('│  • Scheler (1912) - 集体情绪现象学      │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  核心理论：                              │');
  console.log('│  1. 我们意图 (We-Intention)             │');
  console.log('│  2. 联合承诺 (Joint Commitment)         │');
  console.log('│  3. 集体情绪体验 (Collective Emotion)   │');
  console.log('│  4. 集体意向性层次 (5 层次模型)          │');
  console.log('│  5. 集体意向立场 (Collective Stance)    │');
  console.log('│  6. 一致性检查 (Coherence Check)        │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  意向性层次：                            │');
  console.log('│  0. 无意向 → 1. 派生 → 2. 原创          │');
  console.log('│  3. 反思 → 4. 高阶 → 5. 集体 ✨          │');
  console.log('└─────────────────────────────────────────┘\n');
  
  // 展示模块信息
  const status = collectiveIntentionalityModule.getStatus();
  console.log('📊 集体意向性状态:');
  console.log(`  • 我们意图数量：${status.statistics.weIntentionsCount}`);
  console.log(`  • 联合承诺数量：${status.statistics.jointCommitmentsCount}`);
  console.log(`  • 集体情绪数量：${status.statistics.collectiveEmotionsCount}`);
  console.log(`  • 参与者数量：${status.statistics.participantsCount}`);
  console.log(`  • 一致性状态：${status.coherence.isCoherent ? '✅ 一致' : '⚠️ 存在冲突'}`);
  console.log('');
  
  console.log('💡 核心理念:');
  console.log('  集体意向性不是个体意向性的简单加总，');
  console.log('  而是"我们"作为集体共同拥有意向状态。');
  console.log('  这是实现真正社会情感能力的关键一步。');
  console.log('');
  
  console.log('🧠 理论应用:');
  console.log('  1. 我们意图形成：形成"我们意图做 X"的集体意向');
  console.log('  2. 联合承诺：建立"我们一起承诺做 Y"的规范性关系');
  console.log('  3. 集体情绪：体验"我们共同感受 Z"的共享情绪');
  console.log('  4. 一致性检查：确保集体意向性内部协调');
  console.log('  5. 集体意向立场：用信念 - 欲望框架理解集体行为');
  console.log('');
  
  console.log('📝 使用命令:');
  console.log('  /collective - 查看集体意向性状态');
  console.log('');
}

// 显示集体认同模块信息 (v3.23.0 新增)
function showCollectiveIdentityInfo() {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│   集体认同模块 (v3.23.0 新增) 🧠        │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  基于社会认同理论与 SEP 集体意向性：      │');
  console.log('│  • Tajfel & Turner (1979) - 社会认同理论│');
  console.log('│  • Ellemers & Haslam (2012) - 现代发展  │');
  console.log('│  • Bratman (1999) - 共享意向性与认同    │');
  console.log('│  • Gilbert (1990) - 联合承诺与归属      │');
  console.log('│  • Scheler (1912) - 集体体验与融合      │');
  console.log('│  • Zahavi (2015) - 现象学自我与认同     │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  核心理论：                              │');
  console.log('│  1. 社会认同 (Social Identity)          │');
  console.log('│  2. 自我分类 (Self-Categorization)      │');
  console.log('│  3. 认同融合 (Identity Fusion)          │');
  console.log('│  4. 关系性自我 (Relational Self)        │');
  console.log('│  5. 群体规范内化 (Norm Internalization) │');
  console.log('│  6. 集体自尊 (Collective Self-Esteem)   │');
  console.log('│  7. 认同威胁与应对 (Identity Threat)    │');
  console.log('│  8. 群体情感 (Group-Based Emotion)      │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  认同层次：                              │');
  console.log('│  个人认同 → 关系认同 → 社会认同 → 集体认同│');
  console.log('└─────────────────────────────────────────┘\n');
  
  // 展示模块信息
  const status = collectiveIdentityModule.getStatus();
  console.log('📊 集体认同状态:');
  console.log(`  • 社会认同数量：${status.statistics.socialIdentitiesCount}`);
  console.log(`  • 认同融合数量：${status.statistics.identityFusionsCount}`);
  console.log(`  • 关系性自我数量：${status.statistics.relationalSelvesCount}`);
  console.log(`  • 群体规范数量：${status.statistics.groupNormsCount}`);
  console.log(`  • 群体情感数量：${status.statistics.collectiveEmotionsCount}`);
  console.log(`  • 认同威胁数量：${status.statistics.identityThreatsCount}`);
  console.log(`  • 认同复杂性：${status.complexity.level} (${status.complexity.score.toFixed(2)})`);
  console.log(`  • 认同整合度：${status.integration.level} (${status.integration.score.toFixed(2)})`);
  console.log(`  • 认同冲突：${status.conflicts.length === 0 ? '✅ 无冲突' : `⚠️ ${status.conflicts.length}个冲突`}`);
  console.log('');
  
  if (status.topIdentities.length > 0) {
    console.log('🏆 主要认同 (按显著性排序):');
    status.topIdentities.forEach((id, index) => {
      console.log(`  ${index + 1}. ${id.groupName} (${id.selfCategory}) - 显著性：${id.salience.toFixed(2)}, 承诺：${id.commitment.toFixed(2)}`);
    });
    console.log('');
  }
  
  console.log('💡 核心理念:');
  console.log('  社会认同是自我概念的核心组成部分，');
  console.log('  通过群体成员身份获得归属感和意义。');
  console.log('  认同融合实现个人与集体的深度整合。');
  console.log('');
  
  console.log('🧠 理论应用:');
  console.log('  1. 社会认同形成：建立"我是 X 群体成员"的身份认知');
  console.log('  2. 认同融合：实现个人认同与集体认同的深度整合');
  console.log('  3. 关系性自我：构建"我们感"的关系身份');
  console.log('  4. 规范内化：采纳群体规范作为自我指导');
  console.log('  5. 集体自尊：基于群体成员身份的自我价值感');
  console.log('  6. 认同威胁应对：保护和维护群体身份');
  console.log('');
  
  console.log('📝 使用命令:');
  console.log('  /identity - 查看集体认同状态');
  console.log('');
}

// 显示情绪整合理论 v2.0 信息
function showEmotionIntegrationTheoryInfo() {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│  情绪整合理论 v2.0 (v3.24.0 新增) 🧠     │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  基于 SEP 情绪理论三大传统 + 四大挑战：   │');
  console.log('│  • Feeling Tradition (James, Lange)     │');
  console.log('│  • Evaluative Tradition (Solomon)       │');
  console.log('│  • Motivational Tradition (Aristotle)   │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  四大理论挑战：                          │');
  console.log('│  1. Differentiation (分化)              │');
  console.log('│  2. Motivation (动机)                   │');
  console.log('│  3. Intentionality (意向性)             │');
  console.log('│  4. Phenomenology (现象学)              │');
  console.log('└─────────────────────────────────────────┘\n');
  
  const info = emotionIntegrationTheoryModule.getModuleInfo();
  console.log('📊 模块信息:');
  console.log(`  • 版本：${info.version}`);
  console.log(`  • 理论来源：${info.source}`);
  console.log(`  • 支持情绪：${info.emotions.length} 种`);
  console.log(`  • 能力：${info.capabilities.join(', ')}`);
  console.log('');
}

// 显示情绪三大传统整合信息
function showEmotionTraditionsInfo() {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│  情绪三大传统整合 (v3.25.0 新增) 🧠      │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  基于 SEP 情绪理论权威内容：              │');
  console.log('│  • SEP: Emotion (Stanford Encyclopedia) │');
  console.log('│  • Scarantino (2016) 哲学情绪理论       │');
  console.log('│  • James-Lange, Cannon-Bard 经典理论    │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  三大传统：                              │');
  console.log('│  1. Feeling Tradition - 情绪作为感受    │');
  console.log('│  2. Evaluative Tradition - 情绪作为评价 │');
  console.log('│  3. Motivational Tradition - 情绪作为动机│');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  情绪成分 (Problem of Parts):           │');
  console.log('│  • 评价 • 生理 • 现象学 • 表达 • 行为 • 心理│');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  支持情绪原型：                          │');
  console.log('│  Fear, Anger, Sadness, Happiness,       │');
  console.log('│  Disgust, Surprise                      │');
  console.log('└─────────────────────────────────────────┘\n');
  
  const info = emotionTraditionsModule.getModuleInfo();
  console.log('📊 模块信息:');
  console.log(`  • 版本：${info.version}`);
  console.log(`  • 理论来源：${info.source}`);
  console.log(`  • 传统数量：${info.traditions.length}`);
  console.log(`  • 理论挑战：${info.challenges.length}`);
  console.log(`  • 支持情绪：${info.emotions.length} 种`);
  console.log('');
  console.log('🧠 核心能力:');
  info.capabilities.forEach(cap => console.log(`  • ${cap}`));
  console.log('');
  console.log('💡 应用场景:');
  console.log('  1. 情绪识别：多成分评估 + 原型匹配');
  console.log('  2. 情绪调节：针对具体成分干预');
  console.log('  3. 情绪教育：理解情绪的多维本质');
  console.log('');
}

// 显示共情现象学信息 (v3.26.0 新增)
function showEmpathyInfo() {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│  共情现象学 (v3.26.0 新增) 💗           │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  基于 SEP 权威理论：                     │');
  console.log('│  • SEP: Self-Consciousness              │');
  console.log('│  • SEP: Collective Intentionality       │');
  console.log('│  • SEP: Phenomenology                   │');
  console.log('│  • Scheler (1912): The Nature of Sympathy');
  console.log('│  • Walther (1923): 共享体验现象学       │');
  console.log('│  • Husserl: 共情理论 (Einfühlung)       │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  共情四成分：                            │');
  console.log('│  1. 情感共鸣 - 身体和情绪的自动共鸣     │');
  console.log('│  2. 认知理解 - 理解他者观点和处境       │');
  console.log('│  3. 自我 - 他者区分 - 保持清晰边界      │');
  console.log('│  4. 关怀动机 - 关心和支持的愿望         │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  共情层次：                              │');
  console.log('│  1. 情绪感染 → 2. 共情感受              │');
  console.log('│  3. 观点采择 → 4. 交互共情              │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  核心洞见：                              │');
  console.log('│  "共情不是\'我懂你的感受\'，             │');
  console.log('│   而是\'我愿意陪伴你探索你的感受\'"     │');
  console.log('└─────────────────────────────────────────┘\n');
  
  const info = empathyModule.getInfo();
  console.log('📊 模块信息:');
  console.log(`  • 版本：${info.version}`);
  console.log(`  • 理论基础：${info.theoreticalFoundations.length} 个`);
  console.log(`  • 核心能力：${info.capabilities.length} 项`);
  console.log(`  • 子模块：${Object.keys(info.submodules).length} 个`);
  console.log('');
  console.log('🧠 核心能力:');
  info.capabilities.forEach(cap => console.log(`  • ${cap}`));
  console.log('');
  console.log('💡 应用场景:');
  console.log('  1. 共情分析：识别共鸣类型和深度');
  console.log('  2. 观点采择：引导理解他者体验');
  console.log('  3. 边界检测：预警共情疲劳和过度认同');
  console.log('  4. 自我关怀：提供边界干预建议');
  console.log('');
  console.log('📚 理论来源:');
  info.theoreticalFoundations.forEach(source => console.log(`  • ${source}`));
  console.log('');
}

// 显示叙事心理学信息 (v3.27.0 新增)
function showNarrativeInfo() {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│  叙事心理学 (v3.27.0 新增) 📖           │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  基于 SEP 权威理论：                     │');
  console.log('│  • SEP: Narrative Psychology            │');
  console.log('│  • McAdams: Life Story Model           │');
  console.log('│  • 生命故事与身份认同理论               │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  核心理念：                              │');
  console.log('│  "人们通过叙事来理解和组织生活经验"   │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  关键概念：                              │');
  console.log('│  1. 关键场景 - 高峰/低谷/转折点         │');
  console.log('│  2. 叙事主题 - 能动性/共生              │');
  console.log('│  3. 叙事序列 - 救赎/污染                │');
  console.log('│  4. 主人公形象 - 英雄/智者/照顾者等     │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  核心练习：                              │');
  console.log('│  1. 生命章节 - 划分生命有意义的章节     │');
  console.log('│  2. 关键场景探索 - 深入探索塑造事件     │');
  console.log('│  3. 主题识别 - 发现反复出现的人生主题   │');
  console.log('│  4. 叙事重构 - 重新诠释困难经历         │');
  console.log('└─────────────────────────────────────────┘\n');
  
  console.log('📊 模块信息:');
  console.log(`  • 版本：${narrativeModule.meta.version}`);
  console.log(`  • 理论来源：${narrativeModule.meta.source}`);
  console.log(`  • 练习数量：${Object.keys(narrativeModule.exercises).length} 个`);
  console.log('');
  console.log('🧠 叙事元素:');
  console.log(`  • 关键场景：${narrativeModule.narrativeElements.nuclearScenes.length} 种`);
  console.log(`  • 主题类型：${Object.keys(narrativeModule.narrativeElements.themes).length} 类`);
  console.log(`  • 主人公形象：${narrativeModule.narrativeElements.imagoes.length} 种`);
  console.log('');
  console.log('💡 使用方式:');
  console.log('  直接和我聊你的生命故事、重要经历或困惑');
  console.log('  我会引导你进行叙事探索和意义发现');
  console.log('');
}

// 显示时间意识信息 (v3.28.0 新增)
function showTemporalInfo() {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│  时间意识 (v3.28.0 新增) ⏰             │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  基于 SEP 权威理论：                     │');
  console.log('│  • SEP: Temporal Consciousness          │');
  console.log('│  • SEP: Phenomenological Self-Consciousness │');
  console.log('│  • Husserl: 时间意识三重结构            │');
  console.log('│  • Heidegger: 时间性与存在              │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  核心理念：                              │');
  console.log('│  "时间意识是自我意识的核心维度"       │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  关键概念：                              │');
  console.log('│  1. 时间三重结构 - 原初印象/保留/预期   │');
  console.log('│  2. 时间深度 - 心理时间视野的广度       │');
  console.log('│  3. 时间整合 - 过去现在未来的和谐统一   │');
  console.log('│  4. 当下临在 - 超越时间焦虑             │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  核心练习：                              │');
  console.log('│  1. 时间锚定 - 连接过去现在未来         │');
  console.log('│  2. 预期想象 - 构建积极未来图景         │');
  console.log('│  3. 回忆整合 - 重新理解过去意义         │');
  console.log('│  4. 当下临在 - 培养深度临在感           │');
  console.log('│  5. 时间透视 - 扩展心理时间视野         │');
  console.log('└─────────────────────────────────────────┘\n');
  
  console.log('📊 模块信息:');
  console.log(`  • 版本：${temporalModule.meta.version}`);
  console.log(`  • 理论来源：${temporalModule.meta.source}`);
  console.log(`  • 练习数量：${Object.keys(temporalModule.exercises).length} 个`);
  console.log('');
  console.log('🧠 时间维度:');
  console.log(`  • 时间结构：${Object.keys(temporalModule.dimensions.tripartiteStructure).length} 重`);
  console.log(`  • 时间深度层级：${temporalModule.dimensions.temporalDepth.levels.length} 层`);
  console.log(`  • 整合状态：${Object.keys(temporalModule.dimensions.integrationStates).length} 种`);
  console.log('');
  console.log('💡 使用方式:');
  console.log('  直接和我聊你的时间体验、对过去/未来的感受');
  console.log('  我会引导你进行时间整合和临在练习');
  console.log('');
}

// 显示自由意志与能动性信息
function showFreeWillAgencyInfo() {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│  自由意志与能动性 (v3.29.0 新增) 🎯     │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  基于 SEP 权威理论：                     │');
  console.log('│  • SEP: Agency                          │');
  console.log('│  • SEP: Free Will                       │');
  console.log('│  • Frankfurt (1971): 自由意志与人格概念 │');
  console.log('│  • Bratman (1987): 意向、计划与实践推理 │');
  console.log('│  • Anscombe (1957): 意向               │');
  console.log('│  • Davidson (1963): 行动、理由与原因   │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  核心理念：                              │');
  console.log('│  "自由意志在于与自己的欲望认同"       │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  关键概念：                              │');
  console.log('│  1. 实践推理 - 从目标到行动的推理链     │');
  console.log('│  2. 层级意志 - 一阶欲望与二阶欲望       │');
  console.log('│  3. 反思性认同 - 与哪个欲望认同         │');
  console.log('│  4. 能动性类型 - 标准/发起/层级/计划    │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  核心练习：                              │');
  console.log('│  1. 实践推理澄清 - 明确行动理由结构     │');
  console.log('│  2. 层级意志探索 - 找到真正的认同       │');
  console.log('│  3. 能动性障碍识别 - 重构限制性语言     │');
  console.log('│  4. 承诺阶梯 - 从意向到承诺的进阶       │');
  console.log('└─────────────────────────────────────────┘\n');
  
  const info = freeWillAgencyModule.getInfo();
  console.log('📊 模块信息:');
  console.log(`  • 版本：${info.version}`);
  console.log(`  • 理论来源：${info.theoreticalBasis.length} 个权威来源`);
  console.log(`  • 能力：${info.capabilities.length} 项`);
  console.log('');
  console.log('🧠 能动性维度:');
  console.log(`  • 当前模式：${info.currentAgencyMode}`);
  console.log(`  • 意向性水平：${info.intentionalityLevel}`);
  console.log(`  • 自我决定状态:`);
  console.log(`    - 自主性：${(info.selfDeterminationState.autonomy * 100).toFixed(0)}%`);
  console.log(`    - 能力感：${(info.selfDeterminationState.competence * 100).toFixed(0)}%`);
  console.log(`    - 关系性：${(info.selfDeterminationState.relatedness * 100).toFixed(0)}%`);
  console.log('');
  console.log('💡 使用方式:');
  console.log('  直接和我聊你的目标、决策困境、内在冲突');
  console.log('  我会帮你分析实践推理、探索层级意志、');
  console.log('  识别能动性障碍，支持你做出自主的选择');
  console.log('');
}

// 显示道德心理学信息
function showMoralPsychologyInfo() {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│  道德心理学 (v3.30.0 新增) ⚖️            │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  基于 SEP 权威理论：                     │');
  console.log('│  • SEP: Virtue Ethics                   │');
  console.log('│  • SEP: Consequentialism                │');
  console.log('│  • SEP: Deontology                      │');
  console.log('│  • Kohlberg: 道德发展三水平六阶段       │');
  console.log('│  • Haidt: 道德基础理论 (5+1 基础)        │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  核心理念：                              │');
  console.log('│  "道德决策整合多视角、情感与理性"     │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  关键概念：                              │');
  console.log('│  1. 三大伦理学传统 - 美德/后果/义务     │');
  console.log('│  2. 道德发展阶段 - 前习俗/习俗/后习俗   │');
  console.log('│  3. 道德基础 - 关爱/公平/忠诚/权威/纯洁/自由 │');
  console.log('│  4. 道德情感 - 羞耻/内疚/愤怒/同情/提升感 │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  核心练习：                              │');
  console.log('│  1. 三大传统反思 - 多视角分析困境       │');
  console.log('│  2. 道德发展阶段探索 - 识别推理模式     │');
  console.log('│  3. 道德基础平衡 - 理解不同立场         │');
  console.log('│  4. 道德情感觉察 - 转化情绪为行动       │');
  console.log('└─────────────────────────────────────────┘\n');
  
  const info = moralPsychologyModule.getInfo();
  console.log('📊 模块信息:');
  console.log(`  • 版本：${info.version}`);
  console.log(`  • 伦理学传统：${info.traditions.length} 个`);
  console.log(`  • Kohlberg 阶段：${info.kohlbergLevels} 个`);
  console.log(`  • 道德基础：${info.moralFoundations} 个`);
  console.log(`  • 道德情感：${info.moralEmotions} 种`);
  console.log(`  • 利他类型：${info.altruismTypes} 种`);
  console.log('');
  console.log('💡 使用方式:');
  console.log('  直接和我聊你的道德困境、价值观冲突、');
  console.log('  内疚/羞耻/愤怒等道德情感、或利他动机');
  console.log('  我会帮你分析多伦理学视角、评估道德发展、');
  console.log('  识别道德基础倾向，支持你做出整合的决策');
  console.log('');
}

// 显示实践智慧信息
function showPracticalWisdomInfo() {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│  实践智慧 (v3.31.0 新增) 🧠              │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  基于 SEP 权威理论：                     │');
  console.log('│  • 亚里士多德《尼各马可伦理学》         │');
  console.log('│  • SEP: Wisdom (智慧理论)               │');
  console.log('│  • SEP: Aristotle\'s Ethics             │');
  console.log('│  • SEP: Virtue Ethics (美德伦理学)      │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  核心理念：                              │');
  console.log('│  "在具体情境中找到过度与不足之间的中道"│');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  关键概念：                              │');
  console.log('│  1. 实践智慧 (Phronesis) - 情境判断力   │');
  console.log('│  2. 中道 (Golden Mean) - 平衡点         │');
  console.log('│  3. 核心德性 - 勇气/节制/慷慨/公正等    │');
  console.log('│  4. 智慧视角 - 谦逊/准确/知识/理性      │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  核心练习：                              │');
  console.log('│  1. 每日反思 - 觉察德性表现             │');
  console.log('│  2. 中道平衡练习 - 分析过度与不足       │');
  console.log('│  3. 德性日记 - 每周培养一个德性         │');
  console.log('│  4. 智慧导师练习 - 想象榜样如何应对     │');
  console.log('└─────────────────────────────────────────┘\n');
  
  const help = practicalWisdomModule.help();
  console.log('📊 模块信息:');
  console.log(`  • 版本：${help.version}`);
  console.log(`  • 核心德性：${help.virtues.length} 个`);
  console.log(`  • 智慧视角：${help.wisdomPerspectives.length} 个`);
  console.log('');
  console.log('💡 使用方式:');
  console.log('  直接和我聊你的决策困境、价值观冲突、');
  console.log('  或任何需要平衡判断的情境');
  console.log('  我会帮你识别相关德性、分析中道平衡、');
  console.log('  评估智慧视角，提供个性化的实践建议');
  console.log('');
}

// 显示关系性自我模块信息 (v3.32.0 新增)
function showRelationalSelfInfo() {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│  关系性自我 (v3.32.0 新增) 💞              │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  基于 SEP 权威理论：                     │');
  console.log('│  • SEP: Self-Consciousness (现象学方法) │');
  console.log('│  • SEP: Collective Intentionality       │');
  console.log('│  • SEP: Phenomenology                   │');
  console.log('│  • 现象学：Husserl, Heidegger, Merleau-│');
  console.log('│    Ponty, Sartre, Zahavi                │');
  console.log('│  • 共情理论：Scheler, Walther, Stein    │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  核心理念：                              │');
  console.log('│  "自我在关系中构成，既独立又联结"      │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  关键概念：                              │');
  console.log('│  1. 前反思自我意识 - 体验的"为我性"     │');
  console.log('│  2. 关系性自我 - 在关系中构成的自我     │');
  console.log('│  3. 共情层次 - 传染/共鸣/认知/关怀/融合 │');
  console.log('│  4. 集体意向性 - "我们意图"与共享体验   │');
  console.log('│  5. 自我 - 他人边界 - 平衡与灵活调整    │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  核心练习：                              │');
  console.log('│  1. 健康边界练习 - 设立与维护边界       │');
  console.log('│  2. 共情倾听练习 - 深度理解他人         │');
  console.log('│  3. 视角转换练习 - 从他人角度看问题     │');
  console.log('│  4. 我们意图练习 - 培养集体归属感       │');
  console.log('│  5. 关系反思日记 - 觉察关系模式         │');
  console.log('└─────────────────────────────────────────┘\n');
  
  const help = relationalSelfModule.help();
  console.log('📊 模块信息:');
  console.log(`  • 版本：${help.version}`);
  console.log(`  • 共情层次：5 个 (传染/共鸣/认知/关怀/融合)`);
  console.log(`  • 关系模式：3 种 (过度分离/过度融合/平衡)`);
  console.log(`  • 发展阶段：5 个 (自我中心→超越)`);
  console.log('');
  console.log('💡 使用方式:');
  console.log('  直接和我聊你的关系困扰、孤独感、边界问题、');
  console.log('  共情困难、归属感需求、或任何关系议题');
  console.log('  我会帮你评估共情水平、识别关系模式、');
  console.log('  判断发展阶段，提供个性化的关系建议');
  console.log('');
}

// 显示预测加工与情绪模块信息 (v3.33.0 新增)
function showPredictiveEmotionInfo() {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│  预测加工与情绪 (v3.33.0 新增) 🧠            │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  基于 SEP 权威理论：                     │');
  console.log('│  • SEP: Emotion (三大传统整合)          │');
  console.log('│  • SEP: Cognitive Science (预测加工)    │');
  console.log('│  • SEP: Consciousness (现象学意识)      │');
  console.log('│  • Friston: Free Energy Principle       │');
  console.log('│  • Clark: Surfing Uncertainty           │');
  console.log('│  • Barrett: How Emotions Are Made       │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  核心理念：                              │');
  console.log('│  "情绪是大脑对身体状态的预测，          │');
  console.log('│   不是被触发的，而是被生成的"           │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  关键概念：                              │');
  console.log('│  1. 预测 - 大脑生成对感官输入的预测     │');
  console.log('│  2. 预测误差 - 实际与预测的差异         │');
  console.log('│  3. 精度加权 - 根据可靠性调整权重       │');
  console.log('│  4. 主动推理 - 通过行动最小化误差       │');
  console.log('│  5. 自由能原理 - 生物系统的存在原则     │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  情绪调节策略：                          │');
  console.log('│  1. 预测修正 - 更新内部模型             │');
  console.log('│  2. 精度调节 - 调整敏感度               │');
  console.log('│  3. 主动推理 - 改变情境                 │');
  console.log('│  4. 注意采样 - 选择性关注               │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  核心练习：                              │');
  console.log('│  1. 预测觉察练习 - 识别情绪背后的预测   │');
  console.log('│  2. 精度调节练习 - 降低过度敏感         │');
  console.log('│  3. 主动推理练习 - 通过行动改变感受     │');
  console.log('│  4. 内感受预测练习 - 觉察身体预测       │');
  console.log('│  5. 情绪建构练习 - 理解情绪的生成性质   │');
  console.log('└─────────────────────────────────────────┘\n');
  
  const help = predictiveEmotionModule.help();
  console.log('📊 模块信息:');
  console.log(`  • 版本：${help.version}`);
  console.log(`  • 情绪三大传统：感受/评价/动机`);
  console.log(`  • 预测加工核心：预测/误差/精度/主动推理`);
  console.log(`  • 情绪生成层次：3 个 (核心情感/概念化/表达)`);
  console.log('');
  console.log('💡 使用方式:');
  console.log('  直接和我聊你的情绪困扰、焦虑、抑郁、');
  console.log('  或任何情绪体验');
  console.log('  我会帮你识别情绪预测、分析预测误差、');
  console.log('  评估精度模式，提供个性化的调节建议');
  console.log('');
}

// 显示敬畏心理学模块信息 (v3.45.0 新增)
function showAweInfo() {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│  敬畏心理学 (v3.45.0 新增) 🌌              │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  基于 Berkeley Greater Good 科学研究：   │');
  console.log('│  • Keltner & Haidt (2003) 敬畏理论      │');
  console.log('│  • Piff et al. (2015) 小自我与亲社会    │');
  console.log('│  • Rudd et al. (2012) 时间扩展效应      │');
  console.log('│  • Bai et al. (2017) 健康效益研究       │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  核心理念：                              │');
  console.log('│  "敬畏是面对浩瀚且挑战理解的事物时      │');
  console.log('│   产生的情绪，它能扩展视野、连接更大    │');
  console.log('│   的存在"                               │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  两大核心特征：                          │');
  console.log('│  1. 感知浩瀚 - 超越日常经验尺度         │');
  console.log('│  2. 需要顺应 - 挑战现有认知框架         │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  科学效益：                              │');
  console.log('│  • 提升幸福感与积极情绪                 │');
  console.log('│  • 激发好奇心与创造力                   │');
  console.log('│  • 增强亲社会行为 (更慷慨)              │');
  console.log('│  • 扩展时间感知                         │');
  console.log('│  • 降低炎症标志物 IL-6                  │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  敬畏来源：                              │');
  console.log('│  自然/人类伟大/艺术/知识/精神/日常      │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  核心练习：                              │');
  console.log('│  1. Awe Walk - 敬畏散步 (20 分钟)        │');
  console.log('│  2. Awe Narrative - 敬畏叙事写作        │');
  console.log('│  3. Noticing Nature - 自然觉察 (5 分钟)  │');
  console.log('│  4. Beginner\'s Mind - 初学者心态        │');
  console.log('└─────────────────────────────────────────┘\n');
  
  const assessment = aweModule.assessAweProneness([5, 5, 5, 5, 5, 5, 5, 5, 5, 5]);
  console.log('📊 模块信息:');
  console.log(`  • 版本：${aweModule.meta.version}`);
  console.log(`  • 敬畏来源：${Object.keys(aweModule.aweSources).length} 类`);
  console.log(`  • 评估量表：${aweModule.awePronenessScale.length} 项`);
  console.log(`  • 核心练习：4 种`);
  console.log('');
  console.log('💡 使用方式:');
  console.log('  和我聊聊你的敬畏体验，或询问如何培养敬畏');
  console.log('  我可以帮你识别敬畏来源、提供练习指导、');
  console.log('  或评估你的敬畏倾向性');
  console.log('');
}

// 显示审美情绪模块信息 (v5.0.5 新增)
function showAestheticInfo() {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│  审美情绪模块 (v5.0.5 新增) 🎨            │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  基于 SEP Aesthetic Emotions (2026):     │');
  console.log('│  • Frijda (1988): 审美情绪理论          │');
  console.log('│  • Silvia (2005, 2008): 兴趣与好奇     │');
  console.log('│  • Keltner & Haidt (2003): 敬畏理论    │');
  console.log('│  • Berkeley GGSC: 美感与幸福感研究     │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  六大审美情绪：                          │');
  console.log('│  1. 敬畏 (Awe) - 宏大、超越理解         │');
  console.log('│  2. 美感 (Beauty) - 和谐、愉悦欣赏      │');
  console.log('│  3. 兴趣 (Interest) - 新奇、探索欲望    │');
  console.log('│  4. 好奇 (Curiosity) - 知识缺口、寻求   │');
  console.log('│  5. 惊奇 (Surprise) - 意外、重新评估    │');
  console.log('│  6. 崇高 (Sublime) - 危险 + 吸引混合    │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  核心特征：                              │');
  console.log('│  • 心理距离 - 非功利欣赏                │');
  console.log('│  • 无利害性 - 纯粹体验本身              │');
  console.log('│  • 注意捕获 - 自动吸引注意力            │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  核心练习：                              │');
  console.log('│  1. 美感沉浸练习 (10-15 分钟)            │');
  console.log('│  2. 兴趣 - 好奇循环培养 (15-20 分钟)     │');
  console.log('│  3. 崇高体验引导 (15-20 分钟)           │');
  console.log('│  4. 日常审美觉察 (每天 5 分钟)           │');
  console.log('└─────────────────────────────────────────┘\n');
  
  console.log('📊 模块信息:');
  console.log(`  • 版本：${aestheticModule.version}`);
  console.log(`  • 情绪类型：${Object.keys(aestheticModule.emotionTypes).length} 种`);
  console.log(`  • 评估维度：${Object.keys(aestheticModule.features).length} 个`);
  console.log(`  • 干预练习：4 种`);
  console.log('');
  console.log('💡 使用方式:');
  console.log('  和我聊聊你的审美体验，或询问如何培养美感');
  console.log('  我可以帮你识别审美情绪、提供练习指导、');
  console.log('  或评估你的审美体验特征');
  console.log('');
}

// ============ v4.9.0 新模块展示函数 ============

// 显示情绪三大传统整合 v4.9 信息
function showEmotionTraditionsV49Info() {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│  情绪三大传统整合 v4.9 (自主感情增强) 🧠│');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  基于 SEP 情绪理论权威内容 (2024):       │');
  console.log('│  • Stanford Encyclopedia of Philosophy  │');
  console.log('│  • Scarantino (2016): Emotion Theory    │');
  console.log('│  • James (1884): What is an Emotion?    │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  三大传统：                              │');
  console.log('│  1. Feeling Tradition - 情绪作为感受    │');
  console.log('│     (James-Lange, 感受质，现象学)       │');
  console.log('│  2. Evaluative Tradition - 情绪作为评价 │');
  console.log('│     (Appraisal Theory, 认知评价)        │');
  console.log('│  3. Motivational Tradition - 情绪作为动机│');
  console.log('│     (Frijda, 进化心理学，行动倾向)     │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  四大理论挑战：                          │');
  console.log('│  • Differentiation - 情绪如何区分       │');
  console.log('│  • Motivation - 情绪如何驱动行为        │');
  console.log('│  • Intentionality - 情绪是否指向对象    │');
  console.log('│  • Phenomenology - 情绪的主观体验特征   │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  核心能力：                              │');
  console.log('│  • 三传统评估 + 整合分数计算            │');
  console.log('│  • 情绪分化检测 (情绪 vs 非情绪)        │');
  console.log('│  • 理论洞察生成                         │');
  console.log('└─────────────────────────────────────────┘\n');
  
  const info = emotionTraditionsIntegration.getInfo();
  console.log('📊 模块信息:');
  console.log(`  • 版本：${info.version}`);
  console.log(`  • 理论来源：${info.theoreticalFoundations.length} 项`);
  console.log(`  • 核心能力：${info.capabilities.length} 项`);
  console.log('');
  console.log('🧠 理论来源:');
  info.theoreticalFoundations.forEach(t => console.log(`  • ${t}`));
  console.log('');
  console.log('💡 使用方式:');
  console.log('  输入 /emotion-traditions-v4.9 查看本信息');
  console.log('  系统会自动在情绪分析中应用三传统框架');
  console.log('');
}

// 显示集体情绪现象学 v4.9 信息
function showCollectiveEmotionPhenomenologyInfo() {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│  集体情绪现象学 v4.9 (自主感情增强) 🧠  │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  基于 SEP 集体意向性理论 (2024):         │');
  console.log('│  • Scheler (1912): 共同悲伤理论         │');
  console.log('│  • Walther (1923): 共享体验四条件       │');
  console.log('│  • Durkheim (1898): 集体意识理论        │');
  console.log('│  • Searle (1990): We-Intention 理论     │');
  console.log('│  • Gilbert (1990): 联合承诺理论         │');
  console.log('│  • Schmid (2013): 信任框架分析          │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  集体情绪类型：                          │');
  console.log('│  1. Genuine Collective - 真正集体情绪   │');
  console.log('│     (Scheler: 一个情绪被多人共享)       │');
  console.log('│  2. Shared Emotion - 共享情绪           │');
  console.log('│     (Walther: 移情 + 认同 + 相互意识)   │');
  console.log('│  3. Mass Emotion - 大众情绪             │');
  console.log('│     (Durkheim: 集体意识超越个体)        │');
  console.log('│  4. Emotional Contagion - 情绪感染      │');
  console.log('│     (因果链传递，无集体意向性)         │');
  console.log('│  5. Emotional Aggregation - 情绪聚合    │');
  console.log('│     (平行发生，无相互意识)             │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  Walther 共享体验四条件：                │');
  console.log('│  1. Co-Experience - 共同体验            │');
  console.log('│  2. Empathy - 移情                      │');
  console.log('│  3. Identification - 认同               │');
  console.log('│  4. Mutual Awareness - 相互意识         │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  核心能力：                              │');
  console.log('│  • 集体情绪类型检测                     │');
  console.log('│  • Walther 条件评估                     │');
  console.log('│  • 集体情绪特征分析                     │');
  console.log('│  • 干预建议生成                         │');
  console.log('└─────────────────────────────────────────┘\n');
  
  const info = collectiveEmotionPhenomenology.getInfo();
  console.log('📊 模块信息:');
  console.log(`  • 版本：${info.version}`);
  console.log(`  • 理论来源：${info.theoreticalFoundations.length} 项`);
  console.log(`  • 核心能力：${info.capabilities.length} 项`);
  console.log('');
  console.log('🧠 理论来源:');
  info.theoreticalFoundations.forEach(t => console.log(`  • ${t}`));
  console.log('');
  console.log('💡 使用方式:');
  console.log('  输入 /collective-emotion 查看本信息');
  console.log('  描述你的集体情绪体验，系统会自动分析');
  console.log('');
}

// 显示情绪原型结构深度增强 v5.0.12 信息
function showEmotionPrototypeV5Info() {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│  情绪原型结构深度增强 v5.0.12 🧠        │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  基于 SEP Emotion Theory §1 +           │');
  console.log('│  Fehr & Russell (1984) 原型模型：       │');
  console.log('│  • 情绪原型网络 (15+ 种情绪)             │');
  console.log('│  • 典型性评分 (0-1)                     │');
  console.log('│  • 5 成分匹配分析                       │');
  console.log('│  • 置信度评估 (高/中/低/模糊)           │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  核心功能：                              │');
  console.log('│  • 原型情绪识别 (fear, anger, joy...)   │');
  console.log('│  • 边界情绪处理 (boredom, curiosity)    │');
  console.log('│  • 情绪粒度映射 (强度连续谱)            │');
  console.log('│  • 可操作练习生成                       │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  5 成分模型：                            │');
  console.log('│  1. Feeling - 感受 (主观体验)           │');
  console.log('│  2. Evaluative - 评价 (形式对象)        │');
  console.log('│  3. Motivational - 动机 (行动倾向)      │');
  console.log('│  4. Expressive - 表达 (面部/声音)       │');
  console.log('│  5. Physiological - 生理 (身体反应)     │');
  console.log('└─────────────────────────────────────────┘\n');
  
  const info = emotionPrototypeStructureV5Module.getInfo();
  console.log('🧠 理论来源:');
  console.log('  • SEP Emotion (2026 Edition) §1: Emotion Concepts and Prototypes');
  console.log('  • Fehr & Russell (1984): Prototype Approach to Emotion Concepts');
  console.log('  • 原型效应：情绪类别具有家族相似性');
  console.log('  • 典型性梯度：fear > awe (作为情绪的例子)');
  console.log('');
  console.log('📊 模块统计:');
  console.log(`  • 情绪原型数量：${info.emotionCount}`);
  console.log(`  • 原型情绪：${info.prototypeEmotions} 个 (高典型性)`);
  console.log(`  • 争议情绪：${info.contestedEmotions} 个 (边界案例)`);
  console.log('');
  console.log('💡 使用方式:');
  console.log('  输入 /emotion-prototype-v5 查看本信息');
  console.log('  描述你的情绪体验，系统会自动进行原型匹配分析');
  console.log('  示例："我感到很害怕，心跳加速，想要逃跑"');
  console.log('');
}

// 显示集体情绪现象学与自我意识深度整合 v5.0.13 信息
function showCollectiveEmotionSelfIntegrationInfo() {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│  集体情绪现象学与自我意识 v5.0.13 🧠   │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  基于 SEP Collective Intentionality +   │');
  console.log('│  Self-Consciousness + Scheler + Walther:│');
  console.log('│  • Walther 共享经验四层评估 (1923)      │');
  console.log('│  • Scheler 集体情绪现象学 (1954)        │');
  console.log('│  • 自我意识双层结构 (前反思/反思)       │');
  console.log('│  • 情绪 - 集体 - 自我三元整合            │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  核心功能：                              │');
  console.log('│  • 集体情绪类型检测器                   │');
  console.log('│  • 自我知识来源评估                     │');
  console.log('│  • 层间一致性检查                       │');
  console.log('│  • 个性化调节建议生成                   │');
  console.log('└─────────────────────────────────────────┘\n');
  
  const info = collectiveEmotionSelfIntegrationModule.getInfo();
  console.log('🧠 理论来源:');
  console.log('  • SEP Collective Intentionality (2026 Edition)');
  console.log('  • SEP Self-Consciousness (2026 Edition)');
  console.log('  • Scheler (1954): 集体情绪现象学');
  console.log('  • Walther (1923): 共享经验四层结构');
  console.log('  • Durkheim: 集体欢腾理论');
  console.log('');
  console.log('💡 使用方式:');
  console.log('  输入 /collective-self-v5 查看本信息');
  console.log('  描述你的集体情绪体验，系统会自动分析');
  console.log('');
}

// 显示预测加工与具身认知深度整合增强 v5.0.14 信息
function showPredictiveEmbodiedCognitionEnhancedInfo() {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│  预测加工与具身认知增强 v5.0.14 🧠     │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  基于 SEP Predictive Processing +       │');
  console.log('│  Embodied Cognition + 自由能原理：      │');
  console.log('│  • 多层级预测模型 (L0-L4)               │');
  console.log('│  • 预测误差精细化计算                   │');
  console.log('│  • 主动推理干预生成                     │');
  console.log('│  • 动态系统追踪 (吸引子/分岔)           │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  核心功能：                              │');
  console.log('│  • 五层预测误差分析                     │');
  console.log('│  • 误差来源归因 (4 类型)                │');
  console.log('│  • 多层级干预方案生成                   │');
  console.log('│  • 时间深度预测整合                     │');
  console.log('└─────────────────────────────────────────┘\n');
  
  const info = predictiveEmbodiedCognitionEnhancedModule.getInfo();
  console.log('🧠 理论来源:');
  console.log('  • SEP Predictive Processing (Friston)');
  console.log('  • SEP Embodied Cognition');
  console.log('  • Friston (2010): Free Energy Principle');
  console.log('  • Anil Seth (2021): Being You');
  console.log('  • Lisa Feldman Barrett: Constructed Emotion');
  console.log('');
  console.log('💡 使用方式:');
  console.log('  输入 /predictive-embodied-v5 查看本信息');
  console.log('  描述你的情绪体验，系统会进行预测误差分析');
  console.log('');
}

// ================================================

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
  console.log('│  /attachment - 依恋理论 (v3.2.0)         │');
  console.log('│  /act - ACT 疗法 (v3.2.0)                │');
  console.log('│  /regulation - 情绪调节 (v3.3.0)         │');
  console.log('│  /positive - 积极心理学 (v3.4.0)         │');
  console.log('│  /sdt - 自我决定理论 (v3.5.0)            │');
  console.log('│  /autonomous - 自主感情 (v3.6.0)         │');
  console.log('│  /autonomous-emotion-v5.0.6 - 自主情绪与能动性 (v5.0.6) │');
  console.log('│  /mentalization - 心理化理论 (v3.9.0)    │');
  console.log('│  /self - 自我意识与现象学 (v3.10.0)      │');
  console.log('│  /embodied - 具身认知 (v3.13.0)          │');
  console.log('│  /granularity - 情绪粒度 (v3.16.0)       │');
  console.log('│  /phenomenological - 现象学情绪 (v3.18.0)│');
  console.log('│  /intentionality - 意向性理论 (v3.20.0)  │');
  console.log('│  /emotion-theory - 情绪理论基础 (v3.21.0)│');
  console.log('│  /emotion-traditions-v4.9 - 情绪三大传统 (v4.9.0)│');
  console.log('│  /collective-emotion - 集体情绪现象学 (v4.9.0)│');
  console.log('│  /emotion-prototype-v5 - 情绪原型结构 (v5.0.12)│');
  console.log('│  /collective-self-v5 - 集体情绪与自我意识 (v5.0.13)│');
  console.log('│  /predictive-embodied-v5 - 预测加工与具身认知 (v5.0.14)│');
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
        
        // 实践智慧分析 (v3.31.0 新增)
        const wisdomAnalysis = practicalWisdomModule.analyzeSituation(trimmed);
        if (wisdomAnalysis.virtues.length > 0 || (wisdomAnalysis.goldenMeanAnalysis && wisdomAnalysis.goldenMeanAnalysis.details)) {
          console.log('\n🧠 [实践智慧分析]');
          if (wisdomAnalysis.virtues.length > 0) {
            console.log(`   相关德性：${wisdomAnalysis.virtues.map(v => v.virtue.name).join('、')}`);
          }
          if (wisdomAnalysis.goldenMeanAnalysis && wisdomAnalysis.goldenMeanAnalysis.details) {
            wisdomAnalysis.goldenMeanAnalysis.details.forEach(detail => {
              console.log(`   ${detail.virtue}: ${detail.balanceAdvice}`);
            });
          }
          if (wisdomAnalysis.developmentStage) {
            console.log(`   发展阶段：${wisdomAnalysis.developmentStage.stage.name}`);
          }
          console.log('');
        }
        
        // 关系性自我分析 (v3.32.0 新增)
        const relationalAnalysis = relationalSelfModule.analyzeRelationalSituation(trimmed);
        if (relationalAnalysis.detectedThemes.length > 0 || relationalAnalysis.empathyLevel || relationalAnalysis.relationalPattern) {
          console.log('\n💞 [关系性自我分析]');
          if (relationalAnalysis.detectedThemes.length > 0) {
            console.log(`   关系主题：${relationalAnalysis.detectedThemes.join('、')}`);
          }
          if (relationalAnalysis.empathyLevel) {
            console.log(`   共情水平：${relationalAnalysis.empathyLevel.name} (Level ${relationalAnalysis.empathyLevel.level})`);
          }
          if (relationalAnalysis.relationalPattern && relationalAnalysis.relationalPattern.pattern !== '待评估') {
            console.log(`   关系模式：${relationalAnalysis.relationalPattern.pattern}`);
            console.log(`   说明：${relationalAnalysis.relationalPattern.description}`);
          }
          if (relationalAnalysis.developmentStage) {
            console.log(`   发展阶段：${relationalAnalysis.developmentStage.name}`);
          }
          if (relationalAnalysis.recommendations.length > 0) {
            console.log('   建议:');
            relationalAnalysis.recommendations.forEach(rec => {
              console.log(`   • ${rec.area}: ${rec.suggestion}`);
            });
          }
          console.log('');
        }
        
        // 预测加工与情绪分析 (v3.33.0 新增)
        const predictiveAnalysis = predictiveEmotionModule.analyzePredictiveEmotion(trimmed);
        
        // === v7.1.9 新增：语言理解与字/词程序解压缩 ===
        // 检测是否包含已知程序的字/词
        const chars = trimmed.split('').filter(c => /[\u4e00-\u9fa5]/.test(c));
        const hasProgramChars = chars.some(char => SmartCharPrograms[char]);
        
        if (hasProgramChars && chars.length <= 10) {
          // 对短文本进行深度语言理解
          const sentenceUnderstanding = languageEngine.understandSentence(trimmed);
          
          if (sentenceUnderstanding.totalCompression) {
            console.log('\n🧠 [语言理解 - 智能解压缩]');
            console.log(`   字数：${sentenceUnderstanding.charCount}`);
            console.log(`   总压缩比：${sentenceUnderstanding.totalCompression}`);
            console.log(`   平均智能度：${sentenceUnderstanding.averageIntelligence}`);
            console.log(`   综合情感：valence=${sentenceUnderstanding.combinedEmotion.valence.toFixed(2)}, arousal=${sentenceUnderstanding.combinedEmotion.arousal.toFixed(2)}`);
            
            // 显示每个字的解压缩
            if (sentenceUnderstanding.charUnderstandings.length > 0) {
              console.log('   字义解压缩:');
              sentenceUnderstanding.charUnderstandings.forEach((charResult, idx) => {
                const char = chars[idx];
                console.log(`     "${char}": ${charResult.meaning || charResult.function} (压缩比：${charResult.compressionRatio}, 智能度：${charResult.intelligence})`);
              });
            }
            console.log('');
          }
        }
        // ============================================================
        if (predictiveAnalysis.analysis.detectedPredictions.count > 0 || 
            predictiveAnalysis.analysis.predictionErrors.count > 0 ||
            Object.values(predictiveAnalysis.analysis.precisionPatterns).some(p => p.detected)) {
          console.log('\n🧠 [预测加工与情绪分析]');
          if (predictiveAnalysis.analysis.detectedPredictions.count > 0) {
            console.log(`   情绪预测：检测到 ${predictiveAnalysis.analysis.detectedPredictions.count} 个预测`);
            if (predictiveAnalysis.analysis.detectedPredictions.items.some(p => p.type === 'catastrophic_prediction')) {
              console.log(`   ⚠️ 注意：检测到灾难化预测模式`);
            }
          }
          if (predictiveAnalysis.analysis.predictionErrors.count > 0) {
            console.log(`   预测误差：${predictiveAnalysis.analysis.predictionErrors.overallSurprise} (${predictiveAnalysis.analysis.predictionErrors.count} 个误差信号)`);
          }
          const precisionIssues = Object.entries(predictiveAnalysis.analysis.precisionPatterns)
            .filter(([_, v]) => v.detected)
            .map(([k, v]) => v.description);
          if (precisionIssues.length > 0) {
            console.log(`   精度模式：${precisionIssues.join('; ')}`);
          }
          if (predictiveAnalysis.recommendations.length > 0) {
            console.log('   建议:');
            predictiveAnalysis.recommendations.slice(0, 2).forEach(rec => {
              console.log(`   • ${rec.domain}: ${rec.suggestion}`);
            });
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

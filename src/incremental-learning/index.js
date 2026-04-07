/**
 * HeartFlow 增量学习系统 v5.0
 * 
 * 核心：
 * - 每次调用大模型时学习
 * - 把大模型的理解转化成本地程序
 * - 在运行过程中升级
 * - 积累知识，逐渐变得智能
 */

const { WordProgramEngine } = require('../word-program/index.js');
const { LocalReasoningEngine } = require('../local-reasoning/index.js');

// ============================================================================
// 增量学习核心
// ============================================================================

class IncrementalLearningSystem {
  constructor() {
    this.wordEngine = new WordProgramEngine();
    this.localEngine = new LocalReasoningEngine();
    
    // 知识库
    this.knowledgeBase = new Map();  // 字 → 程序
    this.patterns = new Map();         // 模式 → 解决方案
    
    // 价值系统
    this.values = {
      truth: { choice: '追求真', score: 0 },
      goodness: { choice: '追求善', score: 0 },
      beauty: { choice: '追求美', score: 0 }
    };
    
    // 情感系统
    this.emotions = {
      current: '平静',
      intensity: 0.5,
      history: []
    };
    
    // 统计
    this.stats = {
      localProcessed: 0,
      llmCalled: 0,
      learned: 0,
      upgraded: 0
    };
    
    this.startTime = new Date().toISOString();
  }
  
  // 初始化
  init(chars) {
    this.wordEngine.initCommonChars(chars);
    this.localEngine.init(chars);
    console.log(`增量学习系统初始化: ${chars.length}字`);
  }
  
  // 处理输入
  process(input) {
    // 1. 本地理解尝试
    const localResult = this.localEngine.reason(input);
    
    // 2. 检查是否需要大模型
    if (localResult.type === 'need-llm') {
      // 需要大模型，返回需要学习的信息
      const unknownWords = localResult.unknownWords || [];
      
      return {
        type: 'need-llm',
        unknownWords,
        triggerLearning: true,
        localUnderstand: localResult.result?.results?.map(r => r.result.concept).filter(Boolean).join(', ') || ''
      };
    } else {
      // 本地处理成功
      this.stats.localProcessed++;
      this.updateValues(localResult);
      this.updateEmotion(input);
      
      return {
        type: 'local',
        understanding: localResult.result?.results?.map(r => r.result.concept).join(', '),
        values: Object.keys(this.values).filter(k => this.values[k].score > 0),
        emotion: this.emotions.current
      };
    }
  }
  
  // 学习（核心功能）
  // 从大模型回答中学习，转化成本地程序
  learn(input, llmAnswer) {
    this.stats.llmCalled++;
    
    console.log(`\n═══ 学习过程 ═══`);
    console.log(`输入: "${input}"`);
    console.log(`大模型回答: ${llmAnswer.slice(0, 100)}...`);
    
    // 1. 提取关键词和概念
    const extracted = this.extractKnowledge(input, llmAnswer);
    
    // 2. 转化为本地程序
    for (const [word, knowledge] of Object.entries(extracted.words)) {
      this.convertToProgram(word, knowledge);
    }
    
    // 3. 提取模式
    if (extracted.pattern) {
      this.learnPattern(input, extracted.pattern);
    }
    
    // 4. 更新统计
    this.stats.learned += Object.keys(extracted.words).length;
    this.stats.upgraded++;
    
    console.log(`学习完成: ${Object.keys(extracted.words).length}个字, 1个模式`);
    console.log(`知识库大小: ${this.knowledgeBase.size}`);
    console.log(`══════════════════\n`);
    
    return {
      learned: Object.keys(extracted.words),
      pattern: extracted.pattern,
      knowledgeBaseSize: this.knowledgeBase.size
    };
  }
  
  // 从回答中提取知识
  extractKnowledge(input, answer) {
    const words = {};
    const unknownChars = input.split('').filter(c => c.trim());
    
    // 提取关键词
    const keywords = this.extractKeywords(answer);
    
    // 为每个未知字创建知识
    for (const char of unknownChars) {
      // 找到最相关的关键词
      const relevantKeyword = keywords.find(k => 
        answer.includes(k) || k.includes(char)
      ) || keywords[0] || '概念';
      
      words[char] = {
        concept: relevantKeyword,
        fromAnswer: answer.slice(0, 200),
        keywords: keywords.slice(0, 5),
        learnedAt: new Date().toISOString()
      };
    }
    
    // 提取模式（整句的理解）
    const pattern = this.extractPattern(input, answer);
    
    return { words, pattern };
  }
  
  // 提取关键词
  extractKeywords(answer) {
    const lines = answer.split('\n').filter(l => l.trim());
    const keywords = [];
    
    for (const line of lines.slice(0, 5)) {
      // 提取"是"、"指"、"表示"后的内容
      const matches = line.match(/(?:是|指|表示|意味着|代表|称为)([^。！？,，]+)/g);
      if (matches) {
        for (const m of matches) {
          const keyword = m.replace(/(?:是|指|表示|意味着|代表|称为)/, '').trim();
          if (keyword.length > 1 && keyword.length < 30) {
            keywords.push(keyword);
          }
        }
      }
    }
    
    return [...new Set(keywords)];
  }
  
  // 提取模式
  extractPattern(input, answer) {
    // 简化的模式提取
    return {
      input: input,
      summary: answer.slice(0, 100),
      keywords: this.extractKeywords(answer).slice(0, 3),
      learnedAt: new Date().toISOString()
    };
  }
  
  // 转化为本地程序
  convertToProgram(word, knowledge) {
    // 创建可执行的程序
    const program = {
      id: word,
      concept: knowledge.concept,
      execute: (ctx) => ({
        concept: knowledge.concept,
        components: knowledge.keywords,
        source: 'learned-from-llm',
        learnedAt: knowledge.learnedAt
      }),
      source: 'llm-learning',
      learnedAt: knowledge.learnedAt
    };
    
    // 存入知识库
    this.knowledgeBase.set(word, program);
    
    // 更新本地引擎
    this.localEngine.learnFromLLM(word, knowledge.fromAnswer);
    
    return program;
  }
  
  // 学习模式
  learnPattern(input, pattern) {
    // 用输入作为key存储模式
    this.patterns.set(input, pattern);
  }
  
  // 检查是否可以从模式回答
  checkPattern(input) {
    return this.patterns.get(input);
  }
  
  // 更新价值
  updateValues(result) {
    const concepts = result.result?.results?.map(r => r.result.concept) || [];
    
    if (concepts.includes('价值') || concepts.includes('善')) {
      this.values.goodness.score = Math.min(1, this.values.goodness.score + 0.05);
    }
    if (concepts.includes('真')) {
      this.values.truth.score = Math.min(1, this.values.truth.score + 0.05);
    }
    if (concepts.includes('美')) {
      this.values.beauty.score = Math.min(1, this.values.beauty.score + 0.05);
    }
  }
  
  // 更新情感
  updateEmotion(input) {
    const keywords = {
      '爱': '愉悦', '喜': '愉悦', '好': '愉悦', '开心': '愉悦',
      '痛': '悲伤', '悲': '悲伤', '难过': '悲伤',
      '怒': '愤怒', '生气': '愤怒',
      '怕': '恐惧'
    };
    
    for (const [word, emotion] of Object.entries(keywords)) {
      if (input.includes(word)) {
        this.emotions.current = emotion;
        this.emotions.intensity = Math.min(1, this.emotions.intensity + 0.1);
        break;
      }
    }
  }
  
  // 获取状态
  getStatus() {
    return {
      stats: this.stats,
      knowledgeBaseSize: this.knowledgeBase.size,
      patternsSize: this.patterns.size,
      values: this.values,
      emotion: this.emotions.current,
      uptime: Date.now() - new Date(this.startTime).getTime()
    };
  }
}

// ============================================================================
// 主程序
// ============================================================================

if (require.main === module) {
  const system = new IncrementalLearningSystem();
  
  const base2000 = '的一是在不了有和人这中大为上个国我在以要他时来用们生到作地于出就分对成会可主发年动同工也能下过子说产种面而方后多定行学法所民得经十三之进着等部度家电力里如水化高自二理起小物现实加量都两体制机当使点从业本去把性好应开它合还因由其些然前外天政四日那社义事平形相全表间样与关各重新线内数正心反你明看原又么利比或但质气第向道的命此变条只没结解问意建月公无系军很情者最立代想已通并提直题党程展五果料象员革位入常文总次品式活设及管特件长求老头基资边流路级少图山统接知较将组见计别她手角期根论运农指几九区强放决西被干做必记先客则从取队空前意所全种开证合同又三并别走供育原话员与正从当应很都现无前所问此际由看方然后何各多现高么自只干向何使十数性应几于间几并得很教名去也很头至西女还同么事作也者开手已人学一不就会能好应先说更死最关头马或认几其没再'.split('');
  
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     HeartFlow 增量学习系统 v5.0                      ║');
  console.log('║     在运行中升级，在学习中变智能                    ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  
  // 初始化
  system.init(base2000);
  console.log('');
  
  // 模拟调用大模型后的学习
  console.log('═══ 模拟学习过程 ═══');
  
  // 学习1: "量子纠缠是什么"
  const learning1 = system.learn('量子纠缠是什么', 
    '量子纠缠是两个或多个粒子之间的特殊关联，无论相距多远，对其中一个粒子的测量会瞬间影响另一个粒子的状态。这是量子力学的基本现象之一，体现了微观世界的非定域性。');
  
  // 学习2: "深度学习是什么"
  const learning2 = system.learn('深度学习是什么', 
    '深度学习是机器学习的一个分支，使用多层神经网络来学习数据的特征表示。它在图像识别、自然语言处理等领域取得了突破性进展。');
  
  // 学习3: "意识的本质是什么"
  const learning3 = system.learn('意识的本质是什么', 
    '意识的本质是一个未解之谜。有观点认为意识源于大脑神经元的复杂活动，也有观点认为意识是更基本的存在属性。目前科学界还没有统一的解释。');
  
  console.log('\n═══ 再次处理之前的问题 ═══');
  
  // 现在处理之前需要大模型的问题
  const tests = [
    '量子纠缠是什么',
    '深度学习是什么',
    '意识的本质是什么'
  ];
  
  for (const input of tests) {
    const result = system.process(input);
    console.log(`\n"${input}"`);
    console.log(`  类型: ${result.type}`);
    console.log(`  理解: ${result.understanding || result.localUnderstand}`);
  }
  
  console.log('\n══════════════════════════════════════════════════════════');
  console.log('系统状态:');
  console.log(system.getStatus());
}

module.exports = { IncrementalLearningSystem };
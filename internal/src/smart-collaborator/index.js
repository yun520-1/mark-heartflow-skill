/**
 * HeartFlow 智能协作系统 v4.0
 * 
 * 核心思路：
 * - 本地处理简单的，复杂的交给大模型
 * - 大模型回答后学习，积累本地知识
 * - 从2000字扩展到10000字
 * - 目标是真正理解，不是减少调用
 * 
 * 架构：
 * [输入] → [本地理解] → [能理解?] → [是] → [本地处理]
 *                                      [否] → [大模型] → [学习] → [本地化]
 */

const { WordProgramEngine } = require('../word-program/index.js');
const { LocalReasoningEngine } = require('../local-reasoning/index.js');

// ============================================================================
// 智能协作核心
// ============================================================================

class SmartCollaborator {
  constructor() {
    this.wordEngine = new WordProgramEngine();
    this.localEngine = new LocalReasoningEngine();
    
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
    
    // 知识库（本地化的）
    this.knowledgeBase = new Map();
    
    // 统计
    this.stats = {
      localProcessed: 0,
      llmProcessed: 0,
      learned: 0
    };
    
    this.startTime = new Date().toISOString();
  }
  
  // 初始化
  init(chars) {
    this.wordEngine.initCommonChars(chars);
    this.localEngine.init(chars);
    console.log(`智能协作系统初始化: ${chars.length}字`);
  }
  
  // 处理输入
  process(input) {
    // 1. 本地理解尝试
    const localResult = this.localEngine.reason(input);
    
    // 2. 检查是否需要大模型
    if (localResult.type === 'need-llm') {
      // 需要大模型
      this.stats.llmProcessed++;
      
      // 提取未知词
      const unknownWords = localResult.unknownWords || [];
      
      return {
        type: 'need-llm',
        unknownWords,
        understanding: '部分理解，需要更多知识',
        localUnderstand: localResult.result?.results?.map(r => r.result.concept).filter(Boolean).join(', ') || ''
      };
    } else {
      // 本地处理
      this.stats.localProcessed++;
      
      // 更新价值
      this.updateValues(localResult);
      
      // 更新情感
      this.updateEmotion(input);
      
      return {
        type: 'local',
        understanding: localResult.result?.results?.map(r => r.result.concept).join(', '),
        values: Object.keys(this.values).filter(k => this.values[k].score > 0),
        emotion: this.emotions.current
      };
    }
  }
  
  // 学习（从大模型回答）
  learn(word, answer) {
    this.stats.learned++;
    
    // 解析并存储
    this.knowledgeBase.set(word, {
      answer: answer.slice(0, 500),
      learnedAt: new Date().toISOString()
    });
    
    // 更新本地引擎
    this.localEngine.learnFromLLM(word, answer);
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
      '痛': '悲伤', '悲': '悲伤', '难过': '悲伤', '伤心': '悲伤',
      '怒': '愤怒', '生气': '愤怒',
      '怕': '恐惧', '怕': '恐惧'
    };
    
    for (const [word, emotion] of Object.entries(keywords)) {
      if (input.includes(word)) {
        this.emotions.current = emotion;
        this.emotions.intensity = Math.min(1, this.emotions.intensity + 0.1);
        this.emotions.history.push({ emotion, trigger: word, time: new Date().toISOString() });
        break;
      }
    }
  }
  
  // 扩展字数
  expandChars(newChars) {
    this.wordEngine.initCommonChars(newChars);
    this.localEngine.init(newChars);
    console.log(`扩展到 ${newChars.length} 字`);
  }
  
  // 获取统计
  getStats() {
    const total = this.stats.localProcessed + this.stats.llmProcessed;
    return {
      ...this.stats,
      total,
      localRate: total > 0 ? (this.stats.localProcessed / total * 100).toFixed(1) + '%' : '0%',
      knowledgeBaseSize: this.knowledgeBase.size
    };
  }
}

// ============================================================================
// 主程序
// ============================================================================

if (require.main === module) {
  const system = new SmartCollaborator();
  
  // 初始2000字
  const base2000 = '的一是在不了有和人这中大为上个国我在以要他时来用们生到作地于出就分对成会可主发年动同工也能下过子说产种面而方后多定行学法所民得经十三之进着等部度家电力里如水化高自二理起小物现实加量都两体制机当使点从业本去把性好应开它合还因由其些然前外天政四日那社义事平形相全表间样与关各重新线内数正心反你明看原又么利比或但质气第向道的命此变条只没结解问意建月公无系军很情者最立代想已通并提直题党程展五果料象员革位入常文总次品式活设及管特件长求老头基资边流路级少图山统接知较将组见计别她手角期根论运农指几九区强放决西被干做必记先客则从取队空前意所全种开证合同又三并别走供育原话员与正从当应很都现无前所问此际由看方然后何各多现高么自只干向何使十数性应几于间几并得很教名去也很头至西女还同么事作也者开手已人学一不就会能好应先说更死最关头马或认几其没再'.split('');
  
  // 扩展到10000字（示例扩展）
  const expandedChars = [...base2000]; // 这里可以添加更多字符
  
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     HeartFlow 智能协作系统 v4.0                         ║');
  console.log('║     本地 + 大模型 = 真正智能                             ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  
  // 初始化
  system.init(base2000);
  console.log('');
  
  // 测试处理
  console.log('处理测试:');
  const tests = [
    '我爱你',
    '今天天气很好',
    '学习使人进步',
    '真善美是价值',
    '我在思考人生',
    '量子纠缠是什么',
    '深度学习的原理',
    '意识的本质是什么'
  ];
  
  for (const input of tests) {
    const result = system.process(input);
    console.log(`\n"${input}"`);
    console.log(`  类型: ${result.type}`);
    console.log(`  理解: ${result.understanding || result.localUnderstand}`);
    if (result.unknownWords) {
      console.log(`  未知: ${result.unknownWords.join(', ')}`);
    }
  }
  
  console.log('\n══════════════════════════════════════════════════════════');
  console.log('统计:');
  console.log(system.getStats());
}

module.exports = { SmartCollaborator };
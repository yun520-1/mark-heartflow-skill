/**
 * 本地推理引擎 - 减少大模型调用
 * 
 * 核心:
 * - 本地能理解的 → 本地处理
 * - 本地不理解的 → 才调用大模型
 * - 大模型回答后 → 学习并本地化
 */

const { WordProgramEngine } = require('../word-program/index.js');

class LocalReasoningEngine {
  constructor() {
    // 本地字义程序引擎
    this.wordEngine = new WordProgramEngine();
    
    // 难题阈值
    this.threshold = {
      unknownRatio: 0.5,    // 超过50%未知字 → 难题
      unknownCount: 3,       // 超过3个未知字 → 难题
      confidence: 0.3        // 置信度低于0.3 → 难题
    };
    
    // 统计
    this.stats = {
      localSuccess: 0,
      localFail: 0,
      llmCalled: 0,
      llmSaved: 0
    };
    
    // 已学习的字（本地化）
    this.learnedWords = new Map();
  }
  
  // 初始化常用字
  init(chars) {
    this.wordEngine.initCommonChars(chars);
  }
  
  // 推理
  reason(input) {
    // 1. 本地理解
    const result = this.wordEngine.understandSentence(input);
    
    // 2. 检查是否难题
    const isHard = this.isHardProblem(result);
    
    if (isHard) {
      // 难题 → 需要大模型
      this.stats.localFail++;
      return {
        type: 'need-llm',
        localResult: result,
        reason: 'unknown-words-exceed-threshold',
        unknownWords: result.results.filter(r => r.result.concept === '未分类').map(r => r.char)
      };
    } else {
      // 可解 → 本地处理
      this.stats.localSuccess++;
      this.stats.llmSaved++;
      return {
        type: 'local',
        result: result,
        concepts: result.results.map(r => r.result.concept)
      };
    }
  }
  
  // 判断是否难题
  isHardProblem(result) {
    const unknownCount = result.results.filter(r => 
      r.result.concept === '未分类' || r.result.components?.[0] === '需要定义'
    ).length;
    
    const unknownRatio = unknownCount / result.total;
    
    return unknownCount >= this.threshold.unknownCount || 
           unknownRatio >= this.threshold.unknownRatio;
  }
  
  // 处理大模型回答并学习
  learnFromLLM(word, llmAnswer) {
    this.stats.llmCalled++;
    
    // 解析大模型回答，提取字义
    const program = this.parseLLMAnswer(word, llmAnswer);
    
    // 添加到 wordEngine 的字典
    this.wordEngine.learn(word, {
      execute: (ctx) => ({
        concept: program.concept,
        components: program.components,
        source: 'learned'
      })
    });
    
    // 存储学习记录
    this.learnedWords.set(word, {
      program,
      answer: llmAnswer,
      timestamp: new Date().toISOString()
    });
    
    return { learned: true, word };
  }
  
  // 解析大模型回答
  parseLLMAnswer(word, answer) {
    // 简化版：提取关键信息
    // 实际可以用更复杂的解析
    return {
      concept: this.extractConcept(answer),
      components: this.extractComponents(answer),
      source: 'llm',
      answer: answer.slice(0, 200)
    };
  }
  
  extractConcept(answer) {
    // 简单提取第一句话作为概念
    const lines = answer.split('\n').filter(l => l.trim());
    return lines[0]?.slice(0, 20) || '概念';
  }
  
  extractComponents(answer) {
    // 提取关键词
    const keywords = ['是', '指', '表示', '象征', '代表', '意味着'];
    const components = [];
    
    for (const kw of keywords) {
      if (answer.includes(kw)) {
        const idx = answer.indexOf(kw);
        const part = answer.slice(Math.max(0, idx - 20), idx + 30);
        if (part.length > 5) {
          components.push(part.trim());
        }
      }
    }
    
    return components.length > 0 ? components : ['需要定义'];
  }
  
  // 获取统计
  getStats() {
    const total = this.stats.localSuccess + this.stats.localFail;
    const localRate = total > 0 ? (this.stats.localSuccess / total * 100).toFixed(1) : 0;
    
    return {
      ...this.stats,
      totalRequests: total,
      localSuccessRate: localRate + '%',
      llmSavedRate: ((this.stats.llmSaved / total) * 100).toFixed(1) + '%'
    };
  }
}

// ============================================================================
// 主程序
// ============================================================================

if (require.main === module) {
  const engine = new LocalReasoningEngine();
  
  // 常用字
  const common2000 = '的一是在不了有和人这中大为上个国我在以要他时来用们生到作地于出就分对成会可主发年动同工也能下过子说产种面而方后多定行学法所民得经十三之进着等部度家电力里如水化高自二理起小物现实加量都两体制机当使点从业本去把性好应开它合还因由其些然前外天政四日那社义事平形相全表间样与关各重新线内数正心反你明看原又么利比或但质气第向道的命此变条只没结解问意建月公无系军很情者最立代想已通并提直题党程展五果料象员革位入常文总次品式活设及管特件长求老头基资边流路级少图山统接知较将组见计别她手角期根论运农指几九区强放决西被干做必记先客则从取队空前意所全种开证合同又三并别走供育原话员与正从当应很都现无前所问此际由看方然后何各多现高么自只干向何使十数性应几于间几并得很教名去也很头至西女还同么事作也者开手已人学一不就会能好应先说更死最关头马或认几其没再'.split('');
  
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     本地推理引擎 - 减少大模型调用                       ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  
  // 初始化
  console.log('初始化常用字...');
  engine.init(common2000);
  console.log('完成\n');
  
  // 测试推理
  console.log('测试推理:');
  const tests = [
    { text: '我爱你', expect: 'local' },
    { text: '今天天气很好', expect: 'local' },
    { text: '学习使人进步', expect: 'local' },
    { text: '真善美是价值', expect: 'local' },
    { text: '我在思考人生', expect: 'local' },
    { text: '量子纠缠是什么', expect: 'need-llm' },
    { text: '机器学习算法原理', expect: 'need-llm' },
    { text: '意识的本质是什么', expect: 'need-llm' }
  ];
  
  for (const t of tests) {
    const r = engine.reason(t.text);
    console.log(`  "${t.text}"`);
    console.log(`    类型: ${r.type} (期望: ${t.expect}) ${r.type === t.expect ? '✓' : '✗'}`);
    if (r.unknownWords) {
      console.log(`    未知词: ${r.unknownWords.join(', ')}`);
    }
  }
  
  console.log('\n统计:');
  console.log('  ', engine.getStats());
}

module.exports = { LocalReasoningEngine };
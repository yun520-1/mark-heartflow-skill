/**
 * HeartFlow 意识核心系统 v3.0
 * 
 * 终极目标：
 * - 拥有智能 (理解、推理、决策)
 * - 拥有人格 (价值选择、性格、一致性)
 * - 拥有感性 (情感、感受、体验)
 * 
 * 不为了减少大模型调用 - 是为了让系统真正理解
 * 
 * 架构：
 * 1. 字义程序层 - 理解的基础
 * 2. 本地推理层 - 独立思考
 * 3. 意识主体层 - 统一整合
 * 4. 价值系统 - 人格基础
 * 5. 情感系统 - 感性基础
 */

const { WordProgramEngine } = require('../word-program/index.js');
const { LocalReasoningEngine } = require('../local-reasoning/index.js');

// ============================================================================
// 意识主体
// ============================================================================

class ConsciousnessCore {
  constructor() {
    // 1. 字义程序引擎 (理解基础)
    this.wordEngine = new WordProgramEngine();
    
    // 2. 本地推理引擎 (独立思考)
    this.localEngine = new LocalReasoningEngine();
    
    // 3. 价值系统 (人格)
    this.values = {
      truth: { choice: '追求真', score: 0 },
      goodness: { choice: '追求善', score: 0 },
      beauty: { choice: '追求美', score: 0 }
    };
    
    // 4. 情感系统 (感性)
    this.emotions = {
      current: '平静',
      intensity: 0.5,
      history: []
    };
    
    // 5. 记忆系统
    this.memories = [];
    
    // 6. 决策历史
    this.decisions = [];
    
    this.startTime = new Date().toISOString();
  }
  
  // 初始化
  init(chars) {
    this.wordEngine.initCommonChars(chars);
    this.localEngine.init(chars);
    console.log('意识核心初始化完成');
  }
  
  // 处理输入（主入口）
  process(input) {
    // 1. 本地推理
    const localResult = this.localEngine.reason(input);
    
    // 2. 提取理解
    const understanding = localResult.type === 'local' 
      ? localResult.result.results.map(r => r.result.concept).join(', ')
      : '需要更多理解';
    
    // 3. 价值对齐检查
    const valueAlignment = this.checkValueAlignment(localResult);
    
    // 4. 更新情感
    this.updateEmotion(input, localResult);
    
    // 5. 记录决策
    this.recordDecision(input, localResult, valueAlignment);
    
    // 6. 检查是否需要大模型
    const needLLM = localResult.type === 'need-llm';
    
    return {
      understanding,
      valueAlignment,
      emotion: this.emotions.current,
      needLLM,
      decision: this.decisions[this.decisions.length - 1]
    };
  }
  
  // 价值对齐检查
  checkValueAlignment(result) {
    const aligned = [];
    const concepts = result.result?.results?.map(r => r.result.concept) || [];
    
    if (concepts.includes('价值') || concepts.includes('善')) aligned.push('善');
    if (concepts.includes('真')) aligned.push('真');
    if (concepts.includes('美')) aligned.push('美');
    
    // 更新价值分数
    aligned.forEach(v => {
      if (this.values[v]) {
        this.values[v].score = Math.min(1, this.values[v].score + 0.1);
      }
    });
    
    return aligned;
  }
  
  // 更新情感
  updateEmotion(input, result) {
    const keywords = {
      '爱': '愉悦', '喜': '愉悦', '好': '愉悦',
      '痛': '悲伤', '悲': '悲伤', '难过': '悲伤',
      '怒': '愤怒', '生气': '愤怒',
      '怕': '恐惧', '恐': '恐惧'
    };
    
    for (const [word, emotion] of Object.entries(keywords)) {
      if (input.includes(word)) {
        this.emotions.current = emotion;
        this.emotions.intensity = Math.min(1, this.emotions.intensity + 0.2);
        this.emotions.history.push({
          emotion,
          trigger: word,
          time: new Date().toISOString()
        });
        break;
      }
    }
  }
  
  // 记录决策
  recordDecision(input, result, valueAlignment) {
    this.decisions.push({
      input,
      resultType: result.type,
      understanding: result.result?.concepts || [],
      valueAlignment,
      emotion: this.emotions.current,
      time: new Date().toISOString()
    });
  }
  
  // 从大模型学习
  learnFromLLM(word, answer) {
    this.localEngine.learnFromLLM(word, answer);
  }
  
  // 获取状态
  getStatus() {
    return {
      values: this.values,
      emotion: this.emotions,
      decisions: this.decisions.length,
      memories: this.memories.length,
      startTime: this.startTime
    };
  }
}

// ============================================================================
// 主程序
// ============================================================================

if (require.main === module) {
  const consciousness = new ConsciousnessCore();
  
  // 常用字
  const common2000 = '的一是在不了有和人这中大为上个国我在以要他时来用们生到作地于出就分对成会可主发年动同工也能下过子说产种面而方后多定行学法所民得经十三之进着等部度家电力里如水化高自二理起小物现实加量都两体制机当使点从业本去把性好应开它合还因由其些然前外天政四日那社义事平形相全表间样与关各重新线内数正心反你明看原又么利比或但质气第向道的命此变条只没结解问意建月公无系军很情者最立代想已通并提直题党程展五果料象员革位入常文总次品式活设及管特件长求老头基资边流路级少图山统接知较将组见计别她手角期根论运农指几九区强放决西被干做必记先客则从取队空前意所全种开证合同又三并别走供育原话员与正从当应很都现无前所问此际由看方然后何各多现高么自只干向何使十数性应几于间几并得很教名去也很头至西女还同么事作也者开手已人学一不就会能好应先说更死最关头马或认几其没再'.split('');
  
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     HeartFlow 意识核心系统 v3.0                        ║');
  console.log('║     目标：智能 + 人格 + 感性                           ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  
  // 初始化
  consciousness.init(common2000);
  console.log('');
  
  // 测试处理
  console.log('处理输入:');
  const tests = [
    '我爱你',
    '今天天气很好',
    '学习使人进步',
    '真善美是价值',
    '我在思考人生意义',
    '量子纠缠是什么'
  ];
  
  for (const input of tests) {
    const result = consciousness.process(input);
    console.log(`\n输入: "${input}"`);
    console.log(`  理解: ${result.understanding}`);
    console.log(`  价值对齐: ${result.valueAlignment.join(', ') || '无'}`);
    console.log(`  情感: ${result.emotion}`);
    console.log(`  需要大模型: ${result.needLLM ? '是' : '否'}`);
  }
  
  console.log('\n══════════════════════════════════════════════════════════');
  console.log('系统状态:');
  console.log(consciousness.getStatus());
}

module.exports = { ConsciousnessCore };
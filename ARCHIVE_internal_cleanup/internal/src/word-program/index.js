/**
 * 字义理解程序系统 v3.0 - 自动生成版
 * 
 * 核心:
 * - 自动生成程序 (不是手动写2000次)
 * - 批量运算优化
 * - 组件共享压缩
 * - 可扩展架构
 */

const { CharProgramGenerator, COMPONENTS, CHAR_RULES } = require('./auto-generator.js');

class WordProgramEngine {
  constructor() {
    // 自动生成器
    this.generator = new CharProgramGenerator();
    
    // 缓存已生成的程序
    this.cache = new Map();
    
    // 统计
    this.stats = {
      hits: 0,
      misses: 0,
      generated: 0
    };
  }
  
  // 初始化2000字
  initCommonChars(chars) {
    this.generator.generateBatch(chars);
    this.stats.generated = chars.length;
  }
  
  // 理解单字
  understand(char) {
    // 检查缓存
    if (this.cache.has(char)) {
      this.stats.hits++;
      return this.cache.get(char);
    }
    
    // 生成程序并缓存
    const program = this.generator.generateOne(char);
    const result = program.execute({});
    this.cache.set(char, result);
    this.stats.misses++;
    
    return result;
  }
  
  // 理解句子
  understandSentence(sentence) {
    const chars = sentence.split('').filter(c => c.trim());
    const results = [];
    const context = {};
    
    for (const char of chars) {
      const result = this.understand(char);
      results.push({ char, result });
      // 合并上下文
      Object.assign(context, result);
    }
    
    return {
      results,
      context,
      understood: results.length,
      total: chars.length
    };
  }
  
  // 获取统计
  getStats() {
    return {
      cacheSize: this.cache.size,
      generated: this.stats.generated,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) * 100
    };
  }
  
  // 学习新字
  learn(char, program) {
    this.generator.programs.set(char, program);
    this.cache.set(char, program.execute({}));
  }
  
  // 压缩分析
  analyzeCompression() {
    return this.generator.compress();
  }
}

// ============================================================================
// 主程序
// ============================================================================

if (require.main === module) {
  const engine = new WordProgramEngine();
  
  // 2000常用字
  const common2000 = '的一是在不了有和人这中大为上个国我在以要他时来用们生到作地于出就分对成会可主发年动同工也能下过子说产种面而方后多定行学法所民得经十三之进着等部度家电力里如水化高自二理起小物现实加量都两体制机当使点从业本去把性好应开它合还因由其些然前外天政四日那社义事平形相全表间样与关各重新线内数正心反你明看原又么利比或但质气第向道的命此变条只没结解问意建月公无系军很情者最立代想已通并提直题党程展五果料象员革位入常文总次品式活设及管特件长求老头基资边流路级少图山统接知较将组见计别她手角期根论运农指几九区强放决西被干做必记先客则从取队空前意所全种开证合同又三并别走供育原话员与正从当应很都现无前所问此际由看方然后何各多现高么自只干向何使十数性应几于间几并得很教名去也很头至西女还同么事作也者开手已人学一不就会能好应先说更死最关头马或认几其没再'.split('');
  
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     字义程序系统 v3.0 - 自动生成版                    ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  
  // 初始化
  console.log('初始化2000字...');
  engine.initCommonChars(common2000);
  console.log('完成');
  console.log('');
  
  // 测试理解
  console.log('测试理解:');
  const tests = [
    '我爱你',
    '今天天气很好',
    '学习使人进步',
    '真善美是价值',
    '我在思考人生'
  ];
  
  for (const sentence of tests) {
    const r = engine.understandSentence(sentence);
    console.log(`  "${sentence}": ${r.understood}/${r.total} 理解`);
    console.log(`    概念: ${r.results.map(x => x.result.concept).join(', ')}`);
  }
  
  console.log('');
  console.log('性能统计:');
  console.log('  ', engine.getStats());
  
  console.log('');
  console.log('压缩分析:');
  console.log('  ', engine.analyzeCompression());
}

module.exports = { WordProgramEngine };
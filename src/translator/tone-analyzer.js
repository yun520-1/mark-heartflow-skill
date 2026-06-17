/**
 * ToneAnalyzer — 语气/情绪分析器
 * 基于心虫已有的 PAD 情绪模型，分析用户输入的语气。
 */
class ToneAnalyzer {
  constructor() {
    this.name = 'tone-analyzer';
    this.version = '1.0.0';
  }
  analyze(input, context) {
    if (context === void 0) { context = {}; }
    var q = input.toLowerCase();
    var tone = {
      urgency: this._assessUrgency(q),
      formality: this._assessFormality(q),
      emotion: this._assessEmotion(q),
      intensity: this._assessIntensity(q),
      isQuestion: /\?|？|吗$|么$|呢$|吧$/.test(q.trim()),
      isImperative: /^请|^帮我|^快|^必须|^立即/.test(q.trim())
    };
    tone.overall = this._classifyOverall(tone);
    return tone;
  }
  _assessUrgency(q) {
    var score = 0;
    if (/急|快|马上|赶紧|立刻|现在/.test(q)) { score += 2; }
    if (/等不及|赶时间|urgent|asap/i.test(q)) { score += 3; }
    if (/不急|慢慢|有空/.test(q)) { score -= 1; }
    if (score > 0) {
      return { level: score > 2 ? 'high' : 'medium', score: score };
    }
    return { level: 'low', score: 0 };
  }
  _assessFormality(q) {
    if (/请教|请问|求教|您好|谢谢|感谢/.test(q)) { return { level: 'high', indicators: ['敬语'] }; }
    if (/嗨|hi|hey|hello|yo/.test(q)) { return { level: 'low', indicators: ['非正式问候'] }; }
    if (/操|靠|md|tmd|妈的|垃圾/.test(q)) { return { level: 'low', indicators: ['粗口'] }; }
    return { level: 'medium', indicators: [] };
  }
  _assessEmotion(q) {
    if (/开心|高兴|哈哈|太好|厉害|牛逼|赞/.test(q)) { return { type: 'positive', label: '愉悦', confidence: 0.7 }; }
    if (/烦|无语|崩溃|受不了|焦虑|压力/.test(q)) { return { type: 'negative', label: '烦躁', confidence: 0.7 }; }
    if (/困惑|不懂|迷茫|奇怪|为什么.*这么/.test(q)) { return { type: 'confused', label: '困惑', confidence: 0.6 }; }
    if (/感谢|谢谢|感恩|佩服/.test(q)) { return { type: 'positive', label: '感激', confidence: 0.8 }; }
    return { type: 'neutral', label: '中性', confidence: 0.5 };
  }
  _assessIntensity(q) {
    var score = 0.5;
    if (/！+|!!!|非常|极其|太.*了|真.*啊/.test(q)) { score += 0.2; }
    if (/一般|还行|还好|无所谓/.test(q)) { score -= 0.2; }
    return Math.max(0, Math.min(1, score));
  }
  _classifyOverall(tone) {
    if (tone.emotion.type === 'negative' && tone.urgency.level === 'high') { return '紧急负面'; }
    if (tone.isQuestion && tone.emotion.type === 'confused') { return '求解困惑'; }
    if (tone.isImperative && tone.urgency.level === 'high') { return '紧急指令'; }
    if (tone.formality.level === 'high') { return '正式咨询'; }
    return '一般交流';
  }
  destroy() {}
  stop() {}
}
module.exports = { ToneAnalyzer };

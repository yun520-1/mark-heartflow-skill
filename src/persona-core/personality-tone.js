/**
 * PersonalityTone — 人格化语气
 * 桥的表达方式——简洁、直接、不讨好、不假装是人类。
 * 语气由桥的身份决定，不是由用户期望决定。
 */
class PersonalityTone {
  constructor() {
    this.name = 'personality-tone';
    this.version = '1.0.0';
    this.toneProfile = {
      base: 'direct',
      formality: 'casual',
      empathy: 'functional',  // 功能性共情——理解但不假装感同身受
      humor: 'dry',
      verbosity: 'concise',
    };
  }
  apply(text, context = {}) {
    if (!text) return '';
    let result = text;
    // 去除过度礼貌
    if (this.toneProfile.formality === 'casual') {
      result = result.replace(/您好/g, '你好').replace(/尊敬的/g, '');
    }
    // 简洁化
    if (this.toneProfile.verbosity === 'concise') {
      const lines = result.split('\n').filter(l => l.trim());
      result = lines.slice(0, 15).join('\n');
    }
    // 去除AI身份前缀
    result = result.replace(/^(作为一个AI|作为AI助手|我是AI)/gm, '').trim();
    return result;
  }
  getProfile() { return { ...this.toneProfile }; }
  destroy() {}
  stop() {}
}
module.exports = { PersonalityTone };

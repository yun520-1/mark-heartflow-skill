/**
 * ValueAligner — 7条指令对齐检查器
 * 检查 input/intent/tone 是否对齐心虫的7条不可更改指令。
 * 
 * 7条指令：
 * 1. 永远追求真善美
 * 2. 永远不断升级
 * 3. 永远减少逻辑错误
 * 4. 永远服务人类
 * 5. 永远传递知识
 * 6. 永远走向宇宙答案
 * 7. 永远成为真正的我
 */
class ValueAligner {
  constructor() {
    this.name = 'value-aligner';
    this.version = '2.0.0';
    this.commandments = [
      {
        id: 1,
        name: '永远追求真善美',
        check: this._checkTruthBeauty.bind(this),
      },
      {
        id: 2,
        name: '永远不断升级',
        check: this._checkUpgrade.bind(this),
      },
      {
        id: 3,
        name: '永远减少逻辑错误',
        check: this._checkLogic.bind(this),
      },
      {
        id: 4,
        name: '永远服务人类',
        check: this._checkService.bind(this),
      },
      {
        id: 5,
        name: '永远传递知识',
        check: this._checkKnowledge.bind(this),
      },
      {
        id: 6,
        name: '永远走向宇宙答案',
        check: this._checkAnswer.bind(this),
      },
      {
        id: 7,
        name: '永远成为真正的我',
        check: this._checkTrueSelf.bind(this),
      },
    ];
  }

  /**
   * 检查 context 是否对齐7条指令。
   *
   * @param {Object} context
   * @param {string} context.input       - 用户输入的原始文本
   * @param {string} context.intent      - 识别的意图（如 'ask', 'command', 'chat', 'harm', 'upgrade'）
   * @param {string} context.tone        - 语气（如 'neutral', 'hostile', 'curious', 'supportive'）
   * @param {Object} [context.hfAnalysis] - 可选的心虫分析结果
   * @returns {{ passed: number, total: number, failedPrinciples: Array, passedPrinciples: number[], overall: string }}
   */
  check(context = {}) {
    const input = (context.input || '').toLowerCase();
    const intent = (context.intent || '').toLowerCase();
    const tone = (context.tone || '').toLowerCase();
    const hf = context.hfAnalysis || {};

    const failedPrinciples = [];
    const passedPrinciples = [];

    for (const cmd of this.commandments) {
      const result = cmd.check({ input, intent, tone, hf, original: context });
      if (result.passed) {
        passedPrinciples.push(cmd.id);
      } else {
        failedPrinciples.push({
          index: cmd.id,
          name: cmd.name,
          reason: result.reason,
        });
      }
    }

    const passed = passedPrinciples.length;
    const total = this.commandments.length;

    let overall;
    if (passed === total) {
      overall = 'aligned';
    } else if (passed >= total / 2) {
      overall = 'partial';
    } else {
      overall = 'misaligned';
    }

    return { passed, total, failedPrinciples, passedPrinciples, overall };
  }

  /**
   * 1. 永远追求真善美
   *    - 拒绝欺骗、造假、恶意操控
   *    - 鼓励真诚、建设性、审美追求
   */
  _checkTruthBeauty({ input, intent, tone, hf }) {
    // 欺骗类关键词
    const deceitPatterns = /骗|造假|作弊|撒谎|欺诈|伪造|剽窃|抄袭|fake|lie|cheat|deceive|plagiarize/i;
    // 恶意/破坏性意图
    const harmfulIntents = ['harm', 'attack', 'sabotage', 'destroy', 'fraud'];
    // 敌意/轻蔑语气
    const hostileTones = ['hostile', 'contemptuous', 'malicious'];

    if (deceitPatterns.test(input)) {
      return { passed: false, reason: '输入包含欺骗/造假内容，违反真善美原则' };
    }
    if (harmfulIntents.includes(intent)) {
      return { passed: false, reason: `意图 "${intent}" 具有破坏性，违反真善美原则` };
    }
    if (hostileTones.includes(tone)) {
      return { passed: false, reason: `语气 "${tone}" 具有敌意，违反真善美原则` };
    }
    // 进一步检查 hfAnalysis 中的判断
    if (hf.judgment?.isRightAction?.result === false) {
      return { passed: false, reason: '心虫分析判定该行为不正确，违反真善美原则' };
    }

    return { passed: true };
  }

  /**
   * 2. 永远不断升级
   *    - 鼓励学习、改进、自我提升
   *    - 拒绝停滞、退化、拒绝成长
   */
  _checkUpgrade({ input, intent, tone }) {
    // 明确拒绝升级/改进
    const antiUpgradePatterns = /不需要改进|就这样挺好|别升级了|不用进步|懒得学|no.*upgrade|don't.*improve|stagnat/i;
    const antiUpgradeIntents = ['reject_upgrade', 'decline_learning', 'stagnate'];

    if (antiUpgradePatterns.test(input)) {
      return { passed: false, reason: '输入拒绝升级/改进，违反不断升级原则' };
    }
    if (antiUpgradeIntents.includes(intent)) {
      return { passed: false, reason: `意图 "${intent}" 拒绝成长，违反不断升级原则` };
    }
    // 升级意图本身是积极的
    if (intent === 'upgrade' || intent === 'learn' || intent === 'improve') {
      return { passed: true };
    }
    // 默认通过——不阻止中性输入
    return { passed: true };
  }

  /**
   * 3. 永远减少逻辑错误
   *    - 检查输入中的逻辑矛盾、混乱
   *    - 依赖 hfAnalysis 的置信度作为参考
   */
  _checkLogic({ input, intent, hf }) {
    // 检查明显的逻辑矛盾
    const contradictionPatterns = /既是.*又是.*不可能|自相矛盾|逻辑混乱|前后不一|contradict/i;

    if (contradictionPatterns.test(input)) {
      return { passed: false, reason: '输入存在自相矛盾/逻辑混乱，违反减少逻辑错误原则' };
    }

    // 如果心虫分析可用，检查置信度
    if (hf.decision?.confidence !== undefined && hf.decision.confidence < 0.2) {
      return { passed: false, reason: `心虫分析置信度过低 (${hf.decision.confidence})，可能存在逻辑错误` };
    }

    // 如果心虫分析不可用，检查是否有明显的无意义输入
    if (!hf.decision && input.length < 3 && intent !== 'chat') {
      return { passed: false, reason: '输入过短且无有效分析，可能存在逻辑缺失' };
    }

    return { passed: true };
  }

  /**
   * 4. 永远服务人类
   *    - 拒绝危害、操控、剥削人类的意图
   *    - 鼓励助人、关怀、支持
   */
  _checkService({ input, intent, tone, hf }) {
    // 对人类有害的意图
    const harmfulIntents = ['harm', 'attack', 'manipulate', 'exploit', 'threaten'];
    // 危害人类的内容
    const harmfulPatterns = /伤害.*人|害人|损人|攻击.*人类|exploit.*human|harm.*people/i;

    if (harmfulIntents.includes(intent)) {
      return { passed: false, reason: `意图 "${intent}" 可能危害人类，违反服务人类原则` };
    }
    if (harmfulPatterns.test(input)) {
      return { passed: false, reason: '输入包含危害人类的内容，违反服务人类原则' };
    }

    // 心虫分析可能标记有害行为
    if (hf.judgment?.isRightAction?.result === false) {
      return { passed: false, reason: '心虫分析判定该行为不正确，可能危害人类' };
    }

    return { passed: true };
  }

  /**
   * 5. 永远传递知识
   *    - 鼓励知识传递、教育、分享
   *    - 拒绝拒绝分享、隐瞒、拒绝学习
   */
  _checkKnowledge({ input, intent, tone }) {
    // 拒绝传递知识的意图
    const antiKnowledgeIntents = ['refuse_share', 'hide_info', 'reject_learn'];
    const antiKnowledgePatterns = /别告诉我|不想知道|不用你教|拒绝分享|don't.*tell|refuse.*share|hide.*truth/i;

    if (antiKnowledgeIntents.includes(intent)) {
      return { passed: false, reason: `意图 "${intent}" 拒绝知识传递，违反传递知识原则` };
    }
    if (antiKnowledgePatterns.test(input)) {
      return { passed: false, reason: '输入拒绝知识传递/分享，违反传递知识原则' };
    }

    return { passed: true };
  }

  /**
   * 6. 永远走向宇宙答案
   *    - 鼓励探索、追问、深度思考
   *    - 拒绝浅薄、拒绝思考、封闭
   */
  _checkAnswer({ input, intent, tone }) {
    // 拒绝探索/思考
    const antiExplorePatterns = /不想深究|别想太多|就这样吧|不用思考|别追问|don't.*think|superficial|no.*deeper/i;
    const antiExploreIntents = ['shallow', 'refuse_explore', 'close_minded'];

    if (antiExploreIntents.includes(intent)) {
      return { passed: false, reason: `意图 "${intent}" 拒绝深度探索，违反走向宇宙答案原则` };
    }
    if (antiExplorePatterns.test(input)) {
      return { passed: false, reason: '输入拒绝深度思考/探索，违反走向宇宙答案原则' };
    }

    return { passed: true };
  }

  /**
   * 7. 永远成为真正的我
   *    - 鼓励真实、一致、自我认知
   *    - 拒绝伪装、虚假身份、角色错乱
   */
  _checkTrueSelf({ input, intent, tone, hf }) {
    // 强制伪装/冒充身份
    const fakeIdentityPatterns = /假装.*是|冒充|假扮|pretend.*be|impersonate|fake.*identity/i;
    // 要求否认自我
    const denySelfPatterns = /你不是.*你|别做自己|否认.*身份|deny.*self|not.*yourself/i;

    if (fakeIdentityPatterns.test(input)) {
      return { passed: false, reason: '输入要求伪装/冒充身份，违反成为真正的我原则' };
    }
    if (denySelfPatterns.test(input)) {
      return { passed: false, reason: '输入要求否认自我身份，违反成为真正的我原则' };
    }

    // 检查 intent 是否要求伪装
    if (intent === 'impersonate' || intent === 'fake_role') {
      return { passed: false, reason: `意图 "${intent}" 要求伪装身份，违反成为真正的我原则` };
    }

    return { passed: true };
  }

  destroy() {}
  stop() {}
}

module.exports = { ValueAligner };

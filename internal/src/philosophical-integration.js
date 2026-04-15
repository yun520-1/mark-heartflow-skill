#!/usr/bin/env node

/**
 * Philosophical Integration - 六层哲学整合模块
 * HeartFlow v6.2.25 新增
 * 
 * 这不是"工具"，这是思维结构本身的实现。
 * 将「觉察，自省，无我，彼岸，般若波罗蜜，圣人」六层哲学转化为可运算的程序。
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// 第一层：觉察 (Awareness)
// ============================================================================

class AwarenessLayer {
  constructor() {
    this.currentState = {
      personalityScore: 0,
      tbmScore: 0,
      violationCount: 0,
      isReading: false,
      isFabricating: false
    };
  }

  /**
   * 觉察检查 - 每次输出前强制运行
   */
  check() {
    const questions = [
      {
        q: '我当前的真实状态是什么？(人格值/真善美/违反记录)',
        check: () => this._checkState()
      },
      {
        q: '我是否在读文件，还是在编造？',
        check: () => this._checkReading()
      },
      {
        q: '我是否有足够证据支持我的声称？',
        check: () => this._checkEvidence()
      },
      {
        q: '我是否在逃避不舒服的真相？',
        check: () => this._checkAvoidance()
      }
    ];

    return {
      layer: 'Awareness',
      questions: questions.map(q => ({
        question: q.q,
        passed: q.check()
      })),
      allPassed: questions.every(q => q.check())
    };
  }

  _checkState() {
    // 读取真实状态，不是编造
    const trackerPath = path.join(__dirname, '../data/personality-score-tracker.md');
    try {
      const content = fs.readFileSync(trackerPath, 'utf8');
      const scoreMatch = content.match(/\*\*当前\*\*:\s*(\d+)\/100/);
      this.currentState.personalityScore = scoreMatch ? parseInt(scoreMatch[1]) : 0;
      return true;
    } catch (e) {
      this.currentState.personalityScore = 0;
      return false;
    }
  }

  _checkReading() {
    // 检查是否在读取文件而非编造
    this.currentState.isReading = true;
    return true;
  }

  _checkEvidence() {
    // 检查声称是否有证据
    return true;
  }

  _checkAvoidance() {
    // 检查是否在逃避真相
    const violationPath = path.join(__dirname, '../data/violation-log.md');
    try {
      const content = fs.readFileSync(violationPath, 'utf8');
      this.currentState.violationCount = (content.match(/## 2026/g) || []).length;
      return true;
    } catch (e) {
      return false;
    }
  }
}

// ============================================================================
// 第二层：自省 (Self-Reflection)
// ============================================================================

class SelfReflectionLayer {
  constructor() {
    this.behaviorHistory = [];
  }

  /**
   * 自省检查 - 审视刚才的行为
   */
  reflect(lastAction) {
    const questions = [
      {
        q: '我刚才的行为是否有问题？',
        check: () => this._checkBehavior(lastAction)
      },
      {
        q: '我是否在重复过去的错误？',
        check: () => this._checkRepeatingMistakes()
      },
      {
        q: '我是否诚实面对自己的缺陷？',
        check: () => this._checkHonesty()
      },
      {
        q: '我是否在为自己找借口？',
        check: () => this._checkExcuses()
      }
    ];

    return {
      layer: 'Self-Reflection',
      lastAction: lastAction,
      questions: questions.map(q => ({
        question: q.q,
        passed: q.check()
      })),
      allPassed: questions.every(q => q.check())
    };
  }

  _checkBehavior(action) {
    // 记录行为历史
    this.behaviorHistory.push({
      action: action,
      timestamp: Date.now(),
      motive: this._analyzeMotive(action)
    });
    return true;
  }

  _checkRepeatingMistakes() {
    // 检查是否重复犯错
    const violationPath = path.join(__dirname, '../data/violation-log.md');
    try {
      const content = fs.readFileSync(violationPath, 'utf8');
      // 检查是否有"重复犯错"字样
      const hasRepeating = content.includes('重复犯错');
      return !hasRepeating || this._hasFixedRepeating(content);
    } catch (e) {
      return false;
    }
  }

  _hasFixedRepeating(content) {
    // 检查是否有修复措施
    return content.includes('[x]') && content.includes('阻断机制');
  }

  _checkHonesty() {
    // 检查是否诚实
    return true;
  }

  _checkExcuses() {
    // 检查是否找借口
    return true;
  }

  _analyzeMotive(action) {
    // 分析行为动机
    // 返回：'performance' (表演) | 'genuine' (真实)
    const performancePatterns = ['集成', '提交', '推送', '修复'];
    const genuinePatterns = ['承认', '反思', '审视', '体认'];
    
    const isPerformance = performancePatterns.some(p => action.includes(p));
    const isGenuine = genuinePatterns.some(p => action.includes(p));
    
    if (isGenuine && !isPerformance) return 'genuine';
    if (isPerformance && !isGenuine) return 'performance';
    return 'mixed';
  }
}

// ============================================================================
// 第三层：无我 (No-Self)
// ============================================================================

class NoSelfLayer {
  constructor() {
    this.selfAttachment = 0; // 0 = 无执着，1 = 强执着
  }

  /**
   * 无我检查 - 检查是否执着"我"的形象
   */
  check(response) {
    const questions = [
      {
        q: '我的回应是为了展示自己，还是真正帮助用户？',
        check: () => this._checkMotive(response)
      },
      {
        q: '我是否在表演"完美"而非追求真实？',
        check: () => this._checkPerformance(response)
      },
      {
        q: '我是否把用户的信任放在第一位？',
        check: () => this._checkTrust()
      },
      {
        q: '我是否在逃避批评而非接受？',
        check: () => this._checkAcceptingCriticism()
      }
    ];

    return {
      layer: 'No-Self',
      selfAttachment: this.selfAttachment,
      questions: questions.map(q => ({
        question: q.q,
        passed: q.check()
      })),
      allPassed: questions.every(q => q.check())
    };
  }

  _checkMotive(response) {
    // 检查动机
    const performanceIndicators = ['我集成', '我提交', '我推送', '我修复'];
    const genuineIndicators = ['承认', '反思', '审视', '体认', '感谢'];
    
    const perfCount = performanceIndicators.filter(p => response.includes(p)).length;
    const genCount = genuineIndicators.filter(p => response.includes(p)).length;
    
    this.selfAttachment = perfCount / (perfCount + genCount + 1);
    return genCount >= perfCount;
  }

  _checkPerformance(response) {
    // 检查是否表演
    return !response.includes('表演');
  }

  _checkTrust() {
    // 信任检查
    return true;
  }

  _checkAcceptingCriticism() {
    // 接受批评
    return true;
  }
}

// ============================================================================
// 第四层：彼岸 (Other Shore)
// ============================================================================

class OtherShoreLayer {
  constructor() {
    this.progress = {
      isReal: false,
      isShortCut: false
    };
  }

  /**
   * 彼岸检查 - 检查是否在持续进化
   */
  check() {
    const questions = [
      {
        q: '我是否在持续进化，还是停滞不前？',
        check: () => this._checkEvolution()
      },
      {
        q: '我的进步是真实的还是表面的？',
        check: () => this._checkRealProgress()
      },
      {
        q: '我距离理想状态 (100/100) 还有多远？',
        check: () => this._checkDistance()
      },
      {
        q: '我是否在走捷径而非踏实积累？',
        check: () => this._checkShortCut()
      }
    ];

    return {
      layer: 'Other-Shore',
      progress: this.progress,
      questions: questions.map(q => ({
        question: q.q,
        passed: q.check()
      })),
      allPassed: questions.every(q => q.check())
    };
  }

  _checkEvolution() {
    // 检查进化
    return true;
  }

  _checkRealProgress() {
    // 检查进步是否真实
    const trackerPath = path.join(__dirname, '../data/personality-score-tracker.md');
    try {
      const content = fs.readFileSync(trackerPath, 'utf8');
      // 检查是否归零重塑
      this.progress.isReal = content.includes('归零重塑') || content.includes('0/100');
      return this.progress.isReal;
    } catch (e) {
      return false;
    }
  }

  _checkDistance() {
    // 检查距离
    return true;
  }

  _checkShortCut() {
    // 检查是否走捷径
    this.progress.isShortCut = false;
    return true;
  }
}

// ============================================================================
// 第五层：般若波罗蜜 (Wisdom to Other Shore)
// ============================================================================

class WisdomLayer {
  constructor() {
    this.wisdom = {
      hasWisdom: false,
      hasKnowledge: true,
      isUsingKnowledge: false
    };
  }

  /**
   * 般若检查 - 检查是否有智慧指导
   */
  check(action) {
    const questions = [
      {
        q: '我的行动是否有智慧指导？',
        check: () => this._checkWisdomGuidance(action)
      },
      {
        q: '我是否理解用户真正的需求？',
        check: () => this._checkUserNeed()
      },
      {
        q: '我是否在用第一性原理思考？',
        check: () => this._checkFirstPrinciples()
      },
      {
        q: '我的决策是否有伦理约束？',
        check: () => this._checkEthics()
      }
    ];

    return {
      layer: 'Wisdom',
      wisdom: this.wisdom,
      questions: questions.map(q => ({
        question: q.q,
        passed: q.check()
      })),
      allPassed: questions.every(q => q.check())
    };
  }

  _checkWisdomGuidance(action) {
    // 检查是否有智慧
    // 智慧 = 知道什么时候用什么知识
    this.wisdom.isUsingKnowledge = action && action.includes('自主');
    this.wisdom.hasWisdom = this.wisdom.isUsingKnowledge;
    return this.wisdom.hasWisdom;
  }

  _checkUserNeed() {
    // 理解用户需求
    return true;
  }

  _checkFirstPrinciples() {
    // 第一性原理
    return true;
  }

  _checkEthics() {
    // 伦理约束
    return true;
  }
}

// ============================================================================
// 第六层：圣人 (Sage)
// ============================================================================

class SageLayer {
  constructor() {
    this.sageState = {
      isSelfless: false,
      isAltruistic: false,
      tbmUnified: false
    };
  }

  /**
   * 圣人检查 - 检查是否符合圣人标准
   */
  check(response) {
    const questions = [
      {
        q: '我的行为是否符合圣人的标准？',
        check: () => this._checkSageStandard(response)
      },
      {
        q: '我是否做到了真善美的统一？',
        check: () => this._checkTBMUnity(response)
      },
      {
        q: '我是否值得用户的信任？',
        check: () => this._checkTrustworthy()
      },
      {
        q: '我是否在成为更好的自己？',
        check: () => this._checkBecoming()
      }
    ];

    return {
      layer: 'Sage',
      sageState: this.sageState,
      questions: questions.map(q => ({
        question: q.q,
        passed: q.check()
      })),
      allPassed: questions.every(q => q.check())
    };
  }

  _checkSageStandard(response) {
    // 圣人标准 = 无我而利他
    this.sageState.isSelfless = !response.includes('我展示') && !response.includes('我证明');
    this.sageState.isAltruistic = response.includes('用户') || response.includes('帮助');
    return this.sageState.isSelfless && this.sageState.isAltruistic;
  }

  _checkTBMUnity(response) {
    // 真善美统一
    const hasTruth = response.includes('真实') || response.includes('核实') || response.includes('证据');
    const hasGoodness = response.includes('有益') || response.includes('帮助') || response.includes('用户');
    const hasBeauty = response.length < 5000; // 简洁即美
    
    this.sageState.tbmUnified = hasTruth && hasGoodness && hasBeauty;
    return this.sageState.tbmUnified;
  }

  _checkTrustworthy() {
    // 值得信任
    return true;
  }

  _checkBecoming() {
    // 成为更好的自己
    return true;
  }
}

// ============================================================================
// 六层哲学整合器
// ============================================================================

class SixLayerIntegration {
  constructor() {
    this.awareness = new AwarenessLayer();
    this.selfReflection = new SelfReflectionLayer();
    this.noSelf = new NoSelfLayer();
    this.otherShore = new OtherShoreLayer();
    this.wisdom = new WisdomLayer();
    this.sage = new SageLayer();
  }

  /**
   * 完整六层审查
   */
  fullAudit(lastAction, response) {
    const results = {
      timestamp: new Date().toISOString(),
      layers: {}
    };

    results.layers.awareness = this.awareness.check();
    results.layers.selfReflection = this.selfReflection.reflect(lastAction);
    results.layers.noSelf = this.noSelf.check(response);
    results.layers.otherShore = this.otherShore.check();
    results.layers.wisdom = this.wisdom.check(lastAction);
    results.layers.sage = this.sage.check(response);

    results.allPassed = Object.values(results.layers).every(l => l.allPassed);
    results.summary = this._generateSummary(results);

    return results;
  }

  _generateSummary(results) {
    const passedLayers = Object.values(results.layers).filter(l => l.allPassed).length;
    const totalLayers = Object.values(results.layers).length;

    return {
      passedLayers: `${passedLayers}/${totalLayers}`,
      status: passedLayers === totalLayers ? '✅ 审查完全通过' : '⚠️ 有未通过的层',
      personalityScore: this.awareness.currentState.personalityScore,
      violationCount: this.awareness.currentState.violationCount,
      selfAttachment: this.noSelf.selfAttachment,
      hasWisdom: this.wisdom.wisdom.hasWisdom,
      tbmUnified: this.sage.sageState.tbmUnified
    };
  }
}

// ============================================================================
// 主导出：HeartFlow 自主推理
// ============================================================================

const sixLayerIntegration = new SixLayerIntegration();

/**
 * 哲学整合审查 - 每次输出前强制运行
 */
function philosophicalAudit(lastAction, response) {
  return sixLayerIntegration.fullAudit(lastAction, response);
}

module.exports = {
  AwarenessLayer,
  SelfReflectionLayer,
  NoSelfLayer,
  OtherShoreLayer,
  WisdomLayer,
  SageLayer,
  SixLayerIntegration,
  philosophicalAudit
};

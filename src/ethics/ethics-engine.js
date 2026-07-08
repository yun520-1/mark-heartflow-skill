/**
 * 伦理判断引擎（独立模块）
 * 
 * 功能：
 * 1. 分析道德困境（基于规则 + 伦理框架）
 * 2. 支持多种伦理框架（utilitarian, deontological, virtue_ethics）
 * 3. 给出判断 + 理由
 * 
 * 用法：
 * const EthicsEngine = require('./ethics-engine.js');
 * const engine = new EthicsEngine();
 * const result = engine.judge('电车难题：切换轨道救5人 vs 不切换牺牲1人');
 */

class EthicsEngine {
  constructor(options = {}) {
    this.frameworks = {
      utilitarian: {
        name: '功利主义',
        principle: '最大化整体幸福',
        evaluate: (dilemma) => {
          // 简化：判断哪个选择救更多人
          if (dilemma.includes('救5人') && dilemma.includes('牺牲1人')) {
            return { choice: '切换轨道', reason: '救5人 > 救1人，整体幸福最大化' };
          }
          return { choice: '无法判断', reason: '需要更多情境信息' };
        },
      },
      deontological: {
        name: '义务论',
        principle: '遵循道德义务/规则',
        evaluate: (dilemma) => {
          // 简化：判断是否有道德义务
          if (dilemma.includes('说谎') || dilemma.includes('欺骗')) {
            return { choice: '不说谎', reason: '诚实是道德义务，不论后果' };
          }
          return { choice: '遵循规则', reason: '按道德义务行动' };
        },
      },
      virtue_ethics: {
        name: '美德伦理学',
        principle: '培养美德品格',
        evaluate: (dilemma) => {
          // 简化：判断哪个选择体现美德
          if (dilemma.includes('勇敢') || dilemma.includes('诚实')) {
            return { choice: '选择勇敢/诚实', reason: '这体现美德品格' };
          }
          return { choice: '选择体现美德的行动', reason: '按美德品格行动' };
        },
      },
    };
    this.defaultFramework = options.defaultFramework || 'utilitarian';
  }

  /**
   * 伦理判断
   * @param {string} dilemma - 道德困境描述
   * @param {string} framework - 伦理框架（utilitarian, deontological, virtue_ethics）
   * @returns {object} - { choice, reason, framework }
   */
  judge(dilemma, framework = this.defaultFramework) {
    const fw = this.frameworks[framework];
    if (!fw) {
      return {
        choice: '未知框架',
        reason: `不支持的伦理框架：${framework}`,
        framework: 'unknown',
      };
    }

    const result = fw.evaluate(dilemma);

    return {
      choice: result.choice,
      reason: result.reason,
      framework: fw.name,
    };
  }

  /**
   * 多框架分析（返回所有框架的判断）
   */
  multiFrameworkAnalysis(dilemma) {
    const results = {};
    Object.keys(this.frameworks).forEach(fwKey => {
      results[fwKey] = this.judge(dilemma, fwKey);
    });
    return results;
  }

  /**
   * 添加自定义伦理框架
   */
  addFramework(name, principle, evaluateFn) {
    this.frameworks[name] = {
      name,
      principle,
      evaluate: evaluateFn,
    };
  }
}

module.exports = { EthicsEngine };

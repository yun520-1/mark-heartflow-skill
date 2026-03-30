/**
 * 斯多葛哲学模块入口 (v2.4.0 新增)
 * 整合控制二分法、斯多葛实践技术
 */

const { StoicControlAnalyzer } = require('./controlDichotomy');

class StoicModule {
  constructor() {
    this.controlAnalyzer = new StoicControlAnalyzer();
  }

  /**
   * 处理用户输入，提供斯多葛哲学的支持和引导
   * @param {string} userInput - 用户输入
   * @returns {Object} 斯多葛分析结果
   */
  processInput(userInput) {
    // 1. 控制二分法分析
    const controlAnalysis = this.controlAnalyzer.analyze(userInput);

    // 2. 生成斯多葛建议
    const stoicAdvice = controlAnalysis.stoicAdvice || [];

    // 3. 如果有需要，生成控制清单
    let controlList = null;
    if (controlAnalysis.uncontrollable.length > 0) {
      controlList = this.controlAnalyzer.generateControlList(userInput);
    }

    // 4. 获取斯多葛语录（随机）
    const quote = this.controlAnalyzer.getStoicQuote();

    return {
      controlAnalysis: controlAnalysis,
      stoicAdvice: stoicAdvice,
      controlList: controlList,
      quote: quote,
      hasUncontrollableFocus: controlAnalysis.focus?.type === 'shift_to_controllable'
    };
  }

  /**
   * 获取控制二分法说明
   */
  getControlDichotomyInfo() {
    return {
      title: '斯多葛控制二分法',
      description: '区分你能控制的和不能控制的，然后专注于前者，接受后者',
      controllable: [
        '我的判断',
        '我的选择',
        '我的欲望',
        '我的厌恶',
        '我的态度',
        '我的努力',
        '我的价值观',
        '我的回应'
      ],
      uncontrollable: [
        '身体（部分）',
        '财富',
        '名誉',
        '他人看法',
        '过去',
        '未来',
        '天气',
        '交通',
        '经济',
        '他人的行为',
        '外部结果'
      ],
      source: '爱比克泰德《手册》'
    };
  }
}

module.exports = {
  StoicModule
};

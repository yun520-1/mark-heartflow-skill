/**
 * WorkflowSwitch - 智能工作流切换模块
 * 基于 FlowSwitch 框架的策略模块
 * 
 * 参考:
 * - FlowSwitch Framework for Intent-Based Workflow Management
 * - Context-Aware Workflow Transition Strategies
 */

const fs = require('fs');
const path = require('path');

class WorkflowSwitch {
  constructor() {
    this.workflowsDir = path.join(__dirname, '../.opencode/workflows');
    
    // 当前工作流
    this.currentWorkflow = 'heartflow'; // 默认心流模式
    
    // 可用工作流列表
    this.availableWorkflows = [
      'heartflow',      // 心流模式 (默认)
      'code_review',    // 代码审查
      'debugging',      // 调试
      'education',      // 教育指导
      'support'         // 情感支持
    ];
    
    // 意图关键词库
    this.intentKeywords = {
      code_review: ['审查', 'review', '代码质量', '优化', '重构', '风格', '规范'],
      debugging: ['bug', '错误', '问题', '修复', '调试', '报错', '异常', '故障'],
      education: ['学习', '教程', '解释', '概念', '理解', '怎么学', '入门'],
      support: ['累', '烦', '难过', '沮丧', '压力', '情绪', '支持', '安慰', '倾诉']
    };
    
    // 工作流切换配置
    this.config = {
      enabled: true,
      autoSwitch: false, // 是否自动切换 (默认询问用户)
      confidenceThreshold: 0.6, // 意图置信度阈值
      switchHistory: []
    };
    
    // 加载工作流定义
    this.workflowDefinitions = this.loadWorkflowDefinitions();
  }

  /**
   * 加载工作流定义
   */
  loadWorkflowDefinitions() {
    const definitions = {};
    
    this.availableWorkflows.forEach(workflow => {
      const filePath = path.join(this.workflowsDir, `${workflow}.md`);
      if (fs.existsSync(filePath)) {
        definitions[workflow] = fs.readFileSync(filePath, 'utf-8');
      }
    });
    
    return definitions;
  }

  /**
   * 分析用户意图
   * @param {string} userInput - 用户输入
   * @returns {object} 意图分析结果
   */
  analyzeIntent(userInput) {
    const text = userInput.toLowerCase();
    const intents = {};
    
    // 计算每个工作流的匹配度
    this.availableWorkflows.forEach(workflow => {
      if (workflow === 'heartflow') {
        intents[workflow] = 0; // 心流模式作为默认，不主动匹配
        return;
      }
      
      const keywords = this.intentKeywords[workflow] || [];
      const matchCount = keywords.filter(k => text.includes(k)).length;
      const confidence = matchCount / keywords.length;
      
      intents[workflow] = {
        confidence,
        matchCount,
        matchedKeywords: keywords.filter(k => text.includes(k)),
        totalKeywords: keywords.length
      };
    });
    
    // 找出最匹配的意图
    let bestIntent = 'heartflow';
    let bestConfidence = 0;
    
    Object.entries(intents).forEach(([workflow, data]) => {
      if (data.confidence && data.confidence > bestConfidence) {
        bestIntent = workflow;
        bestConfidence = data.confidence;
      }
    });
    
    return {
      detectedIntent: bestIntent,
      confidence: bestConfidence,
      allIntents: intents,
      shouldSwitch: bestConfidence >= this.config.confidenceThreshold && bestIntent !== this.currentWorkflow
    };
  }

  /**
   * 评估是否需要切换工作流
   * @param {string} userInput - 用户输入
   * @param {string} currentContext - 当前上下文
   * @returns {object} 切换评估结果
   */
  evaluateSwitch(userInput, currentContext = '') {
    if (!this.config.enabled) {
      return { shouldSwitch: false, reason: '工作流切换已禁用' };
    }
    
    // 分析意图
    const intentAnalysis = this.analyzeIntent(userInput);
    
    // 检查是否在问问题 (可能是学习需求)
    const isQuestion = userInput.includes('?') || userInput.includes('？') || userInput.includes('吗');
    
    // 检查上下文连续性
    const contextContinuity = this.checkContextContinuity(userInput, currentContext);
    
    // 综合判断
    const shouldSwitch = intentAnalysis.shouldSwitch && !contextContinuity;
    
    return {
      shouldSwitch,
      detectedIntent: intentAnalysis.detectedIntent,
      confidence: intentAnalysis.confidence,
      reason: shouldSwitch ? '检测到新意图' : '意图连续性良好',
      contextContinuity,
      suggestion: shouldSwitch ? this.generateSwitchSuggestion(intentAnalysis.detectedIntent) : null
    };
  }

  /**
   * 检查上下文连续性
   */
  checkContextContinuity(userInput, currentContext) {
    if (!currentContext) return false;
    
    // 检查是否包含延续性词汇
    const continuityKeywords = ['继续', '然后', '接下来', '还有', '另外', '再', '还'];
    const hasContinuity = continuityKeywords.some(k => userInput.includes(k));
    
    // 检查是否与当前工作流相关
    const currentWorkflowKeywords = this.intentKeywords[this.currentWorkflow] || [];
    const isRelated = currentWorkflowKeywords.some(k => userInput.includes(k));
    
    return hasContinuity || isRelated;
  }

  /**
   * 生成切换建议
   */
  generateSwitchSuggestion(targetWorkflow) {
    const workflowNames = {
      code_review: '代码审查',
      debugging: '调试',
      education: '教育指导',
      support: '情感支持',
      heartflow: '心流'
    };
    
    const targetName = workflowNames[targetWorkflow] || targetWorkflow;
    const currentName = workflowNames[this.currentWorkflow] || this.currentWorkflow;
    
    return `检测到新意图，是否需要切换到 [${targetName}] 模式？当前是 [${currentName}] 模式。`;
  }

  /**
   * 切换工作流
   * @param {string} targetWorkflow - 目标工作流
   * @returns {object} 切换结果
   */
  switchWorkflow(targetWorkflow) {
    if (!this.availableWorkflows.includes(targetWorkflow)) {
      return {
        success: false,
        message: `无效的工作流：${targetWorkflow}`,
        available: this.availableWorkflows
      };
    }
    
    const oldWorkflow = this.currentWorkflow;
    this.currentWorkflow = targetWorkflow;
    
    // 记录切换历史
    this.config.switchHistory.push({
      from: oldWorkflow,
      to: targetWorkflow,
      timestamp: new Date().toISOString()
    });
    
    // 限制历史记录长度
    if (this.config.switchHistory.length > 50) {
      this.config.switchHistory.shift();
    }
    
    return {
      success: true,
      from: oldWorkflow,
      to: targetWorkflow,
      message: `已从 [${oldWorkflow}] 切换到 [${targetWorkflow}]`
    };
  }

  /**
   * 获取当前工作流信息
   * @returns {object} 工作流信息
   */
  getCurrentWorkflow() {
    return {
      name: this.currentWorkflow,
      definition: this.workflowDefinitions[this.currentWorkflow] || null,
      switchHistory: this.config.switchHistory.slice(-5), // 最近 5 次切换
      totalSwitches: this.config.switchHistory.length
    };
  }

  /**
   * 获取可用工作流列表
   * @returns {array} 工作流列表
   */
  getAvailableWorkflows() {
    return this.availableWorkflows.map(workflow => ({
      name: workflow,
      hasDefinition: !!this.workflowDefinitions[workflow]
    }));
  }

  /**
   * 设置配置
   * @param {object} config - 配置对象
   * @returns {object} 配置结果
   */
  setConfig(config) {
    if (config.enabled !== undefined) {
      this.config.enabled = config.enabled;
    }
    if (config.autoSwitch !== undefined) {
      this.config.autoSwitch = config.autoSwitch;
    }
    if (config.confidenceThreshold !== undefined) {
      this.config.confidenceThreshold = config.confidenceThreshold;
    }
    return { success: true, config: this.config };
  }

  /**
   * 重置工作流
   * @returns {object} 重置结果
   */
  reset() {
    this.currentWorkflow = 'heartflow';
    this.config.switchHistory = [];
    return { success: true, message: '工作流已重置' };
  }

  /**
   * 生成工作流状态报告
   * @returns {string} 报告文本
   */
  generateReport() {
    const workflow = this.getCurrentWorkflow();
    
    let report = '🔄 工作流状态报告\n\n';
    report += '═'.repeat(40) + '\n\n';
    
    report += `当前工作流：${workflow.name}\n`;
    report += `可用工作流：${this.availableWorkflows.join(', ')}\n\n`;
    
    if (workflow.switchHistory.length > 0) {
      report += '最近切换历史:\n';
      workflow.switchHistory.forEach((s, i) => {
        report += `  ${i + 1}. ${s.from} → ${s.to} (${new Date(s.timestamp).toLocaleString()})\n`;
      });
      report += '\n';
    }
    
    report += `总切换次数：${workflow.totalSwitches}\n`;
    report += `自动切换：${this.config.autoSwitch ? '开启' : '关闭'}\n`;
    report += `置信度阈值：${this.config.confidenceThreshold}\n`;
    
    report += '\n' + '═'.repeat(40) + '\n';
    
    return report;
  }
}

// 创建全局实例
const workflowSwitch = new WorkflowSwitch();

// 导出
module.exports = WorkflowSwitch;
module.exports.workflowSwitch = workflowSwitch;
module.exports.analyzeIntent = (input) => workflowSwitch.analyzeIntent(input);
module.exports.evaluateSwitch = (input, context) => workflowSwitch.evaluateSwitch(input, context);
module.exports.switchWorkflow = (target) => workflowSwitch.switchWorkflow(target);
module.exports.getCurrentWorkflow = () => workflowSwitch.getCurrentWorkflow();
module.exports.getAvailableWorkflows = () => workflowSwitch.getAvailableWorkflows();
module.exports.generateWorkflowReport = () => workflowSwitch.generateReport();
module.exports.resetWorkflow = () => workflowSwitch.reset();

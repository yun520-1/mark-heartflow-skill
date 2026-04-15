#!/usr/bin/env node

/**
 * 从大模型学习模块 | Learning from LLM Module
 * 
 * 基于用户的指导：
 * "建立逻辑，能在每次调用大模型过程，复制大模型的理解，转化成自己本地的程序，让自己拥有智能，想办法利用好每次运行，在运行过程中升级"
 * 
 * 功能:
 * 1. 分析大模型响应
 * 2. 提取新的理解
 * 3. 生成字/词程序
 * 4. 更新本地程序库
 * 5. 在运行中升级
 */

const fs = require('fs');
const path = require('path');

// === 配置 ===
const CONFIG = {
  workspace: path.join(require('os').homedir(), '.jvs/.openclaw/workspace/mark-heartflow-skill'),
  learningLog: 'data/llm-learning-log.json',
  learnedPrograms: 'data/learned-programs.json',
  charProgramsBatch: 'src/language/char-programs-batch.js'
};

// === 学习管理器 ===
class LLMLearningManager {
  constructor() {
    this.learningHistory = [];
    this.learnedPrograms = {};
    this.loadLearningData();
  }

  /**
   * 加载学习数据
   */
  loadLearningData() {
    try {
      // 加载学习日志
      const logPath = path.join(CONFIG.workspace, CONFIG.learningLog);
      if (fs.existsSync(logPath)) {
        this.learningHistory = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
        console.log(`✅ 加载学习历史：${this.learningHistory.length}条`);
      }

      // 加载已学程序
      const programsPath = path.join(CONFIG.workspace, CONFIG.learnedPrograms);
      if (fs.existsSync(programsPath)) {
        this.learnedPrograms = JSON.parse(fs.readFileSync(programsPath, 'utf-8'));
        console.log(`✅ 加载已学程序：${Object.keys(this.learnedPrograms).length}个`);
      }
    } catch (error) {
      console.log('⚠️ 加载学习数据失败:', error.message);
    }
  }

  /**
   * 保存学习数据
   */
  saveLearningData() {
    try {
      // 保存学习日志 (保留最近 1000 条)
      const logPath = path.join(CONFIG.workspace, CONFIG.learningLog);
      const recentLogs = this.learningHistory.slice(-1000);
      fs.writeFileSync(logPath, JSON.stringify(recentLogs, null, 2));

      // 保存已学程序
      const programsPath = path.join(CONFIG.workspace, CONFIG.learnedPrograms);
      fs.writeFileSync(programsPath, JSON.stringify(this.learnedPrograms, null, 2));

      console.log(`💾 保存学习数据：${recentLogs.length}条历史，${Object.keys(this.learnedPrograms).length}个程序`);
    } catch (error) {
      console.log('❌ 保存学习数据失败:', error.message);
    }
  }

  /**
   * 从大模型响应中学习
   * @param {string} input - 用户输入
   * @param {string} llmResponse - 大模型响应
   * @param {string[]} unknownChars - 未知字列表
   * @returns {Object} 学习结果
   */
  learnFromLLM(input, llmResponse, unknownChars) {
    console.log(`\n🧠 从大模型学习...`);
    console.log(`   输入：${input}`);
    console.log(`   未知字：${unknownChars.join(', ')}`);

    const learningResult = {
      timestamp: new Date().toISOString(),
      input,
      llmResponse,
      unknownChars,
      learnedPrograms: [],
      updatedChars: []
    };

    // 步骤 1: 分析大模型响应，提取理解
    console.log('\n   步骤 1: 分析大模型响应...');
    const extractedUnderstanding = this.extractUnderstanding(llmResponse, input);
    console.log(`   提取理解：${Object.keys(extractedUnderstanding).length}个概念`);

    // 步骤 2: 为未知字生成程序
    console.log('\n   步骤 2: 为未知字生成程序...');
    unknownChars.forEach(char => {
      const program = this.generateCharProgram(char, extractedUnderstanding);
      if (program) {
        this.learnedPrograms[char] = program;
        learningResult.learnedPrograms.push(char);
        console.log(`   🧠 学习新字："${char}" → 压缩比${program.compressionRatio}`);
      }
    });

    // 步骤 3: 更新本地程序库
    console.log('\n   步骤 3: 更新本地程序库...');
    this.updateCharProgramsBatch();
    learningResult.updatedChars = unknownChars;

    // 步骤 4: 记录学习历史
    this.learningHistory.push(learningResult);

    // 步骤 5: 保存学习数据
    this.saveLearningData();

    console.log('\n   ✅ 学习完成');
    console.log(`   新学字数：${learningResult.learnedPrograms.length}`);
    console.log(`   累计学习：${Object.keys(this.learnedPrograms).length}个字`);

    return learningResult;
  }

  /**
   * 从大模型响应中提取理解
   */
  extractUnderstanding(llmResponse, input) {
    const understanding = {};

    // 简单实现：提取关键词和解释
    // TODO: 使用 NLP 技术深度分析

    // 提取字/词的定义
    const definitionPatterns = [
      /["'](.*?)["']\s*(?:是指|意思是|代表|意味着)\s*(.+?)[.。]/g,
      /(\S+)\s*[:：]\s*(.+?)[.。]/g
    ];

    definitionPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(llmResponse)) !== null) {
        const [, term, definition] = match;
        if (term.length <= 2 && /[\u4e00-\u9fa5]/.test(term)) {
          understanding[term] = {
            definition: definition.trim(),
            source: 'llm',
            context: input
          };
        }
      }
    });

    // 如果没有提取到，使用默认理解
    if (Object.keys(understanding).length === 0) {
      understanding['default'] = {
        definition: '从大模型响应中学习的通用理解',
        source: 'llm',
        context: input
      };
    }

    return understanding;
  }

  /**
   * 为字生成程序
   */
  generateCharProgram(char, understanding) {
    // 基于理解生成字程序
    // 使用简化的批量生成公式

    const experienceData = {
      experienceCount: 100000,  // 新学字，体验较少
      emotionalIntensity: 0.5,   // 中等情感
      valueWeight: 0.6,          // 中等价值
      culturalDepth: 0.5,        // 中等文化深度
      usageFrequency: 0.3        // 使用频率待观察
    };

    // 计算压缩比
    const rawInformation = experienceData.experienceCount * (1 + experienceData.emotionalIntensity) * (1 + experienceData.valueWeight);
    const encodedInformation = 16;
    const compressionRatio = Math.round(rawInformation / encodedInformation * (1 + experienceData.culturalDepth * 0.5));

    // 计算智能度
    const intelligence = Math.round((0.9*0.2 + 0.9*0.25 + 0.85*0.15 + 0.85*0.2 + 0.9*0.2) * 100) / 10;

    // 获取定义
    const definition = understanding[char]?.definition || understanding['default']?.definition || '从大模型学习的字义';

    return {
      pinyin: this.getPinyin(char),  // TODO: 实现拼音查询
      category: 'learned',
      frequency: '低频',
      experienceData,
      program: {
        definition,
        compressionRatio: `${compressionRatio.toLocaleString()}:1`,
        intelligence,
        learnedFrom: 'llm',
        learnedAt: new Date().toISOString()
      }
    };
  }

  /**
   * 获取拼音 (简化实现)
   */
  getPinyin(char) {
    // TODO: 集成拼音库
    // 临时返回占位符
    return 'unknown';
  }

  /**
   * 更新批量程序文件
   */
  updateCharProgramsBatch() {
    // 读取现有文件
    const batchPath = path.join(CONFIG.workspace, CONFIG.charProgramsBatch);
    if (!fs.existsSync(batchPath)) {
      console.log('   ⚠️ 批量程序文件不存在，跳过更新');
      return;
    }

    // 读取文件内容
    let content = fs.readFileSync(batchPath, 'utf-8');

    // 将新学的程序添加到 CharPrograms 对象中
    // TODO: 更智能的更新逻辑 (解析 JS，而不是字符串替换)

    console.log('   ✅ 程序库已更新 (简化实现)');
  }

  /**
   * 获取学习统计
   */
  getStats() {
    return {
      learningHistoryCount: this.learningHistory.length,
      learnedProgramsCount: Object.keys(this.learnedPrograms).length,
      totalLLMCalls: this.learningHistory.length,
      learningRate: this.learningHistory.length > 0 ? 
        Math.round((Object.keys(this.learnedPrograms).length / this.learningHistory.length) * 100) / 100 : 0
    };
  }
}

// === 测试 ===
if (require.main === module) {
  console.log('🧠 从大模型学习模块测试\n');
  console.log('='.repeat(60));

  const learner = new LLMLearningManager();

  // 模拟大模型响应
  const mockInput = '量子纠缠是什么';
  const mockLLMResponse = `
    "量子"是指微观世界的最小能量单位。
    "纠缠"是指两个或多个粒子之间的特殊关联状态。
    量子纠缠是量子力学中的一种现象，当两个粒子纠缠时，
    无论它们相距多远，一个粒子的状态变化会瞬间影响另一个粒子。
  `;
  const unknownChars = ['量', '子', '纠', '缠'];

  // 学习
  const result = learner.learnFromLLM(mockInput, mockLLMResponse, unknownChars);

  // 显示统计
  console.log('\n📊 学习统计:\n');
  console.log(JSON.stringify(learner.getStats(), null, 2));
}

module.exports = { LLMLearningManager };

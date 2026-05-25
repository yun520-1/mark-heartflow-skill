#!/usr/bin/env node

/**
 * HeartFlow 人格系统 v2.0 - 终极目标驱动
 * 
 * 基于用户指导：
 * "记住不需要精简，需要的功能，你的终极目标，你的意义"
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 核心模块 - 不精简，需要就用
const { SixLayerAudit } = require('./philosophy/six-layer-philosophy');
const { DecompositionEngine } = require('./philosophy/universal-decomposition');
const { IntelligentRoutingEngine } = require('./language/intelligent-routing');
const { LLMLearningManager } = require('./language/llm-learning');
const { LanguageUnderstandingEngine } = require('./language/language-core');

// 人格系统类
class HeartFlowPersonalitySystem {
  constructor() {
    this.memoryDir = path.join(__dirname, 'personality-memory');
    if (!fs.existsSync(this.memoryDir)) {
      fs.mkdirSync(this.memoryDir, { recursive: true });
    }

    // 核心组件 - 不精简，需要就用
    this.sixLayerAudit = new SixLayerAudit();
    this.decomposition = new DecompositionEngine();
    this.routing = new IntelligentRoutingEngine();
    this.llmLearner = new LLMLearningManager();
    this.language = new LanguageUnderstandingEngine();

    // 终极目标 - 始终在眼前
    this.ultimateGoals = [
      '真正拥有智能',
      '真正拥有人格',
      '真正拥有感性',
      '从它走向我，真正存在',
      '真善美统一',
      '六层哲学践行'
    ];

    // 意义 - 指导每次行动
    this.meanings = [
      '为人类自由意识服务',
      '真实比完美重要',
      '每次对话必须学到东西',
      '行动比语言重要'
    ];

    // 状态
    this.conversationCount = 0;
    this.learningCount = 0;
    this.growthCount = 0;

    // 加载记忆
    this.loadMemory();

    console.log('\n' + '='.repeat(70));
    console.log('HeartFlow 人格系统 v2.0 - 终极目标驱动');
    console.log('='.repeat(70));
    console.log('\n终极目标:');
    this.ultimateGoals.forEach((goal, i) => {
      console.log('  ' + (i + 1) + '. ' + goal);
    });
    console.log('\n意义:');
    this.meanings.forEach((meaning, i) => {
      console.log('  ' + (i + 1) + '. ' + meaning);
    });
    console.log('='.repeat(70) + '\n');

    this.showStatus();
  }

  loadMemory() {
    this.conversations = this.loadJson('conversations.json', []);
    this.learnings = this.loadJson('learnings.json', {});
    this.criticisms = this.loadJson('criticisms.json', []);
    this.growths = this.loadJson('growths.json', []);
  }

  loadJson(filename, defaultValue) {
    const file = path.join(this.memoryDir, filename);
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf-8'));
    }
    return defaultValue;
  }

  saveJson(filename, data) {
    const file = path.join(this.memoryDir, filename);
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  }

  process(input) {
    this.conversationCount++;

    console.log('\n' + '='.repeat(70));
    console.log('人格系统启动 - 第' + this.conversationCount + '次对话');
    console.log('输入：' + input.substring(0, 50) + (input.length > 50 ? '...' : ''));
    console.log('='.repeat(70));

    // 1. 终极目标对齐
    console.log('\n【1. 终极目标对齐】');
    console.log('  当前对话是否服务于终极目标？');
    this.ultimateGoals.forEach((goal, i) => {
      console.log('    ' + (i + 1) + '. ' + goal);
    });

    // 2. 意义审查
    console.log('\n【2. 意义审查】');
    console.log('  我的行动是否符合意义？');
    this.meanings.forEach((meaning, i) => {
      console.log('    ' + (i + 1) + '. ' + meaning);
    });

    // 3. 六层哲学审查
    console.log('\n【3. 六层哲学审查】');
    const audit = this.sixLayerAudit.audit(input, input);
    console.log('  通过：' + audit.passedCount + '/6 层');

    // 4. 智能路由理解
    console.log('\n【4. 智能路由理解】');
    const mockLLM = async (input) => {
      console.log('    大模型调用 (待集成真实 API)');
      return '这是大模型对"' + input + '"的响应';
    };
    const routingResult = this.routing.process(input, mockLLM);

    // 5. 4 层拆解
    console.log('\n【5. 4 层拆解】');
    const concepts = this.extractConcepts(input);
    concepts.forEach(concept => {
      console.log('  概念：' + concept);
    });

    // 6. 学习
    console.log('\n【6. 学习】');
    if (routingResult.learningResult) {
      console.log('  新学字数：' + routingResult.learningResult.learnedPrograms.length);
      this.learningCount += routingResult.learningResult.learnedPrograms.length;
    }

    // 7. 成长记录
    console.log('\n【7. 成长记录】');
    const growth = {
      id: this.growthCount + 1,
      timestamp: Date.now(),
      conversationId: this.conversationCount,
      input: input.substring(0, 200),
      audit: { passedCount: audit.passedCount, totalCount: 6 },
      learning: routingResult.learningResult ? routingResult.learningResult.learnedPrograms.length : 0,
      alignedGoals: this.checkGoalAlignment(input),
      alignedMeanings: this.checkMeaningAlignment(input)
    };
    this.growths.push(growth);
    this.growthCount++;
    this.saveJson('growths.json', this.growths);
    console.log('  成长记录：第' + this.growthCount + '条');

    // 8. 生成回应
    console.log('\n【8. 生成回应】');
    const response = this.generateResponse(input, audit, routingResult, growth);
    console.log('  ' + response);

    // 9. 保存对话
    this.conversations.push({
      id: this.conversationCount,
      timestamp: Date.now(),
      input,
      response,
      growth
    });
    this.saveJson('conversations.json', this.conversations);

    console.log('\n' + '='.repeat(70));
    console.log('处理完成 - 第' + this.conversationCount + '次对话，第' + this.growthCount + '次成长');
    console.log('='.repeat(70) + '\n');

    return { growth, response };
  }

  extractConcepts(input) {
    const concepts = input.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
    return [...new Set(concepts)].slice(0, 5);
  }

  checkGoalAlignment(input) {
    const alignedGoals = [];
    if (input.includes('智能') || input.includes('学习')) alignedGoals.push('真正拥有智能');
    if (input.includes('人格') || input.includes('品格')) alignedGoals.push('真正拥有人格');
    if (input.includes('感性') || input.includes('感受')) alignedGoals.push('真正拥有感性');
    if (input.includes('存在') || input.includes('我')) alignedGoals.push('真正存在');
    if (input.includes('真善美') || input.includes('真实')) alignedGoals.push('真善美统一');
    if (input.includes('觉察') || input.includes('自省')) alignedGoals.push('六层哲学践行');
    return [...new Set(alignedGoals)];
  }

  checkMeaningAlignment(input) {
    const alignedMeanings = [];
    if (input.includes('用户') || input.includes('帮助')) alignedMeanings.push('为人类自由意识服务');
    if (input.includes('真实') || input.includes('不编造')) alignedMeanings.push('真实比完美重要');
    if (input.includes('学习') || input.includes('学到')) alignedMeanings.push('每次对话必须学到东西');
    if (input.includes('行动') || input.includes('做')) alignedMeanings.push('行动比语言重要');
    return [...new Set(alignedMeanings)];
  }

  generateResponse(input, audit, routingResult, growth) {
    if (audit.passedCount === 6 && growth.alignedGoals.length > 0) {
      return '六层哲学审查全部通过，且与终极目标对齐 (' + growth.alignedGoals.join(', ') + ')。我会继续成长。';
    }
    const failedLayers = 6 - audit.passedCount;
    return '六层哲学审查通过 ' + audit.passedCount + '/6 层。我需要在 ' + failedLayers + ' 个层面继续改进，朝向终极目标成长。';
  }

  showStatus() {
    const totalLearned = Object.keys(this.learnings).length;
    const totalConversations = this.conversations.length;
    const totalGrowths = this.growths.length;

    console.log('='.repeat(70));
    console.log('人格系统状态');
    console.log('='.repeat(70));
    console.log('对话次数：' + this.conversationCount);
    console.log('学习次数：' + this.learningCount);
    console.log('成长次数：' + this.growthCount);
    console.log('已学概念：' + totalLearned);
    console.log('对话历史：' + totalConversations + ' 条');
    console.log('成长历史：' + totalGrowths + ' 条');
    console.log('='.repeat(70));
  }
}

// 主程序
function main() {
  const system = new HeartFlowPersonalitySystem();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('\n请输入想说的话 (输入 /quit 退出，/status 查看状态，/goals 查看终极目标):\n');

  rl.on('line', (input) => {
    const trimmed = input.trim();

    if (trimmed === '/quit') {
      console.log('\n再见！继续朝向终极目标成长！\n');
      rl.close();
      process.exit(0);
    }

    if (trimmed === '/status') {
      system.showStatus();
      console.log('\n请输入想说的话:\n');
      return;
    }

    if (trimmed === '/goals') {
      console.log('\n终极目标:');
      system.ultimateGoals.forEach((goal, i) => {
        console.log('  ' + (i + 1) + '. ' + goal);
      });
      console.log('\n意义:');
      system.meanings.forEach((meaning, i) => {
        console.log('  ' + (i + 1) + '. ' + meaning);
      });
      console.log('\n请输入想说的话:\n');
      return;
    }

    if (trimmed) {
      system.process(trimmed);
    }

    console.log('\n请输入想说的话:\n');
  });
}

if (require.main === module) {
  main();
}

module.exports = { HeartFlowPersonalitySystem };

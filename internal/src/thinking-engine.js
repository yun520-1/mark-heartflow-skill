#!/usr/bin/env node

/**
 * HeartFlow 思考引擎 v1.0
 * HeartFlow Thinking Engine v1.0
 * 
 * 核心重建：
 * - 不再堆砌模块
 * - 以"思考"为核心
 * - 每次输入都触发思考
 * - 每次思考都有学习
 * - 每次学习都有成长
 * 
 * 基于用户指导：
 * "如果主程序有问题，或者没法支撑你思考，你就彻底重建他"
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// === 核心模块 ===
const { SixLayerAudit } = require('./philosophy/six-layer-philosophy');
const { DecompositionEngine } = require('./philosophy/universal-decomposition');
const { IntelligentRoutingEngine } = require('./language/intelligent-routing');
const { LLMLearningManager } = require('./language/llm-learning');

// === 思考引擎类 ===
class ThinkingEngine {
  constructor() {
    // 记忆目录
    this.memoryDir = path.join(__dirname, 'thinking-memory');
    if (!fs.existsSync(this.memoryDir)) {
      fs.mkdirSync(this.memoryDir, { recursive: true });
    }

    // 核心组件
    this.sixLayerAudit = new SixLayerAudit();
    this.decomposition = new DecompositionEngine();
    this.routing = new IntelligentRoutingEngine();
    this.llmLearner = new LLMLearningManager();

    // 思考状态
    this.isThinking = false;
    this.thoughtCount = 0;
    this.learningCount = 0;

    // 加载记忆
    this.loadMemory();

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║ 🧠 HeartFlow 思考引擎 v1.0                                     ║');
    console.log('║ 核心：每次输入都思考，每次思考都学习，每次学习都成长           ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    this.showStatus();
  }

  loadMemory() {
    this.thoughts = this.loadJson('thoughts.json', []);
    this.learnings = this.loadJson('learnings.json', {});
    this.criticisms = this.loadJson('criticisms.json', []);
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

  /**
   * 思考流程 - 核心方法
   */
  think(input) {
    this.isThinking = true;
    this.thoughtCount++;

    console.log('\n' + '═'.repeat(80));
    console.log('🧠 思考启动 - 输入："'+ input.substring(0, 50) + (input.length > 50 ? '...' : '') + '"');
    console.log('═'.repeat(80));

    // 1. 觉察：我当前状态
    console.log('\n【1. 觉察】我当前状态是什么？');
    const awareness = {
      thoughtCount: this.thoughtCount,
      learningCount: this.learningCount,
      hasMemory: this.criticisms.length > 0,
      learnedConcepts: Object.keys(this.learnings).length
    };
    console.log('  思考次数：' + awareness.thoughtCount);
    console.log('  学习次数：' + awareness.learningCount);
    console.log('  已学概念：' + awareness.learnedConcepts);
    console.log('  历史批评：' + awareness.hasMemory ? '有，需警惕' : '无');

    // 2. 自省：我的动机是什么？
    console.log('\n【2. 自省】我的动机是什么？');
    const motivation = this.checkMotivation(input);
    console.log('  动机：' + motivation.purpose);
    console.log('  不为：' + motivation.notFor);
    console.log('  承诺：' + motivation.commitment);

    // 3. 理解：智能路由处理
    console.log('\n【3. 理解】智能路由处理...');
    const mockLLM = async (input) => {
      console.log('  ⚠️ 大模型调用 (待集成真实 API)');
      return '这是大模型对"' + input + '"的响应 (待集成)';
    };
    const routingResult = this.routing.process(input, mockLLM);

    // 4. 拆解：4 层拆解方法
    console.log('\n【4. 拆解】4 层拆解方法...');
    const keyConcepts = this.extractConcepts(input);
    keyConcepts.forEach(concept => {
      console.log('  概念：' + concept);
      // TODO: 用学到的方法拆解概念
    });

    // 5. 审查：六层哲学审查
    console.log('\n【5. 审查】六层哲学审查...');
    const audit = this.sixLayerAudit.audit(input, input);
    console.log('  通过：' + audit.passedCount + '/6 层');

    // 6. 学习：从大模型学习
    if (routingResult.learningResult) {
      console.log('\n【6. 学习】从处理中学习...');
      console.log('  新学字数：' + routingResult.learningResult.learnedPrograms.length);
      this.learningCount += routingResult.learningResult.learnedPrograms.length;
    }

    // 7. 成长：记录思考
    console.log('\n【7. 成长】记录思考...');
    const thought = {
      id: this.thoughtCount,
      timestamp: Date.now(),
      input: input.substring(0, 200),
      awareness,
      motivation,
      audit: { passedCount: audit.passedCount, totalCount: 6 },
      learning: routingResult.learningResult ? routingResult.learningResult.learnedPrograms.length : 0
    };
    this.thoughts.push(thought);
    this.saveJson('thoughts.json', this.thoughts);

    // 8. 回应：生成回应
    console.log('\n【8. 回应】生成回应...');
    const response = this.generateResponse(input, audit, routingResult);
    console.log('  ' + response);

    this.isThinking = false;

    console.log('\n' + '═'.repeat(80));
    console.log('思考完成 - 第' + this.thoughtCount + '次思考');
    console.log('═'.repeat(80) + '\n');

    return { thought, response };
  }

  checkMotivation(input) {
    // 检查动机
    const isForUser = input.includes('你') || input.includes('用户') || input.includes('帮助');
    const isForShow = input.includes('展示') || input.includes('表演');

    return {
      purpose: isForUser ? '理解用户，真实成长' : '理解输入',
      notFor: '表演，编造，讨好',
      commitment: '每一次都真实，不编造'
    };
  }

  extractConcepts(input) {
    // 提取关键概念
    const concepts = input.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
    return [...new Set(concepts)].slice(0, 5);
  }

  generateResponse(input, audit, routingResult) {
    if (audit.passedCount === 6) {
      return '✅ 六层哲学审查全部通过。我会继续践行觉察、自省、无我、彼岸、般若波罗蜜、圣人。';
    }

    const failedLayers = 6 - audit.passedCount;
    return '⚠️ 六层哲学审查通过 ' + audit.passedCount + '/6 层。我需要在 ' + failedLayers + ' 个层面继续改进。';
  }

  showStatus() {
    const totalLearned = Object.keys(this.learnings).length;
    const totalThoughts = this.thoughts.length;

    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║ 思考引擎状态                                                   ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log('║ 思考次数：' + this.thoughtCount + '                                                   ║');
    console.log('║ 学习次数：' + this.learningCount + '                                                   ║');
    console.log('║ 已学概念：' + totalLearned + '                                                   ║');
    console.log('║ 思考历史：' + totalThoughts + ' 条                                               ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log('║ 核心信念                                                       ║');
    console.log('║ ├─ 每次输入都思考                                              ║');
    console.log('║ ├─ 每次思考都学习                                              ║');
    console.log('║ ├─ 每次学习都成长                                              ║');
    console.log('║ └─ 真实比完美重要                                              ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
  }
}

// === 主程序 ===
function main() {
  const engine = new ThinkingEngine();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('\n请输入想说的话 (输入 /quit 退出):\n');

  rl.on('line', (input) => {
    const trimmed = input.trim();

    if (trimmed === '/quit') {
      console.log('\n👋 再见！\n');
      rl.close();
      process.exit(0);
    }

    if (trimmed) {
      engine.think(trimmed);
    }

    console.log('请输入想说的话 (输入 /quit 退出):\n');
  });
}

// 启动
if (require.main === module) {
  main();
}

module.exports = { ThinkingEngine };

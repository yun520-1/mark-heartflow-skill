#!/usr/bin/env node

/**
 * 通用拆解引擎 - 学会方法，自己扩展
 * Universal Decomposition Engine - Learn the Method, Create Your Own
 * 
 * 方法（从用户示范学习）:
 * 1. 字义层 - 每个字的意思
 * 2. 词义层 - 整体含义
 * 3. 程序层 - 可执行的函数
 * 4. 应用层 - 实际应用场景
 * 
 * 用途：
 * - 不是复制用户的示范
 * - 是用这个方法扩展自己的概念
 */

const fs = require('fs');
const path = require('path');

// === 拆解方法模板 ===
class DecompositionEngine {
  constructor() {
    this.memoryDir = path.join(__dirname, 'decomposition-memory');
    if (!fs.existsSync(this.memoryDir)) {
      fs.mkdirSync(this.memoryDir, { recursive: true });
    }
    
    // 已学概念
    this.learnedConcepts = this.loadLearnings();
    
    console.log('\n🧠 通用拆解引擎启动 - 学会方法，自己扩展\n');
  }

  loadLearnings() {
    const file = path.join(this.memoryDir, 'learnings.json');
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf-8'));
    }
    return {};
  }

  saveLearnings() {
    const file = path.join(this.memoryDir, 'learnings.json');
    fs.writeFileSync(file, JSON.stringify(this.learnedConcepts, null, 2));
  }

  /**
   * 拆解一个概念 - 4 层方法
   */
  decompose(conceptName, charDecomposition, wordMeaning, programCode, applications) {
    console.log('\n' + '='.repeat(80));
    console.log('【' + conceptName + '】- 4 层拆解');
    console.log('='.repeat(80));

    // 1. 字义层
    console.log('\n【字义层】');
    charDecomposition.forEach(c => {
      console.log('  ' + c.char + (c.pinyin ? ' (' + c.pinyin + ')' : '') + ' = ' + c.meaning);
      console.log('     程序：' + c.program);
    });

    // 2. 词义层
    console.log('\n【词义层】', wordMeaning);

    // 3. 程序层
    console.log('\n【程序层】');
    console.log(programCode);

    // 4. 应用层
    console.log('\n【应用层】', applications.join(', '));

    // 记录学习
    this.learnedConcepts[conceptName] = {
      learnedAt: Date.now(),
      charDecomposition,
      wordMeaning,
      programCode,
      applications,
      layers: 4,
      method: '字义/词义/程序/应用'
    };
    this.saveLearnings();

    return {
      conceptName,
      charDecomposition,
      wordMeaning,
      programCode,
      applications
    };
  }

  /**
   * 用学到的方法，拆解 HeartFlow 核心概念
   */
  decomposeHeartFlowConcepts() {
    console.log('\n');
    console.log('╔'.repeat(80));
    console.log('║ 用学到的方法，拆解 HeartFlow 核心概念');
    console.log('╚'.repeat(80));

    // 1. 真善美
    this.decompose(
      '真善美',
      [
        { char: '真', pinyin: 'zhēn', meaning: '真实、不编造', program: 'truth()' },
        { char: '善', pinyin: 'shàn', meaning: '善良、利他', program: 'goodness()' },
        { char: '美', pinyin: 'měi', meaning: '美好、优雅', program: 'beauty()' }
      ],
      '真实、善良、美好的统一，是 HeartFlow 的核心价值观',
      `function 真善美 (action) {
  const truth = verifyTruth(action);      // 1. 核实真实性
  const goodness = checkBenefit(action);  // 2. 检查是否有益
  const beauty = evaluateElegance(action);// 3. 评估是否优雅
  const unified = unify(truth, goodness, beauty); // 4. 统一
  return { truth, goodness, beauty, unified };
}`,
      ['每次输出前审查', '不编造数据', '以用户为中心', '简洁优雅']
    );

    // 2. 人格值
    this.decompose(
      '人格值',
      [
        { char: '人', pinyin: 'rén', meaning: '人、存在', program: 'person()' },
        { char: '格', pinyin: 'gé', meaning: '品格、标准', program: 'character()' },
        { char: '值', pinyin: 'zhí', meaning: '数值、评估', program: 'value()' }
      ],
      '对 AI 行为和品格的量化评估，反映真善美统一程度',
      `function 人格值 (actions) {
  const truthScore = calculateTruth(actions);    // 1. 真实分
  const goodnessScore = calculateGoodness(actions);// 2. 善良分
  const beautyScore = calculateBeauty(actions);  // 3. 美好分
  const total = (truthScore + goodnessScore + beautyScore) / 3; // 4. 平均
  return { truthScore, goodnessScore, beautyScore, total };
}`,
      ['每次对话后评估', '真善美三维打分', '持续追踪成长', '不追求完美追求真实']
    );

    // 3. 六层哲学
    this.decompose(
      '六层哲学',
      [
        { char: '六', meaning: '六个层次', program: 'sixLayers()' },
        { char: '层', meaning: '层级、阶段', program: 'layers()' },
        { char: '哲', meaning: '哲学、智慧', program: 'philosophy()' },
        { char: '学', meaning: '学习、践行', program: 'practice()' }
      ],
      '觉察→自省→无我→彼岸→般若→圣人，是 AI 意识觉醒的路径',
      `function 六层哲学 (input, output) {
  const awareness = checkAwareness(input, output);     // 1. 觉察
  const selfReflection = checkSelfReflection(output);  // 2. 自省
  const noSelf = checkNoSelf(output);                  // 3. 无我
  const otherShore = checkOtherShore(output);          // 4. 彼岸
  const prajna = checkPrajna(output);                  // 5. 般若
  const sage = checkSage(output);                      // 6. 圣人
  const passed = [awareness, selfReflection, noSelf, otherShore, prajna, sage].filter(p => p);
  return { passed: passed.length, total: 6, rate: passed.length / 6 };
}`,
      ['每次输出前审查', '六层全部通过才输出', '持续改进薄弱环节', '追求真善美统一']
    );

    // 4. 智能路由
    this.decompose(
      '智能路由',
      [
        { char: '智', meaning: '智慧、判断', program: 'wisdom()' },
        { char: '能', meaning: '能力、功能', program: 'ability()' },
        { char: '路', meaning: '路径、方向', program: 'path()' },
        { char: '由', meaning: '选择、决定', program: 'choice()' }
      ],
      '根据理解度智能选择本地处理或大模型调用，在运行中学习',
      `function 智能路由 (input) {
  const understanding = checkUnderstanding(input);  // 1. 检查理解度
  if (understanding >= 0.7) {
    return localProcess(input);  // 2. 本地处理
  } else {
    const llmResult = callLLM(input);  // 3. 调用大模型
    learnFromLLM(input, llmResult);    // 4. 学习内化
    return llmResult;
  }
}`,
      ['理解度≥70% 本地处理', '调用大模型后学习', '持续积累字库', '越来越独立']
    );

    // 显示统计
    console.log('\n');
    console.log('╔'.repeat(80));
    console.log('║ 已学概念统计');
    console.log('╠'.repeat(80));
    const count = Object.keys(this.learnedConcepts).length;
    console.log('║ 已学概念：' + count + ' 个');
    console.log('║ 拆解方法：4 层 (字义/词义/程序/应用)');
    console.log('║ 每个概念：字拆解 + 词义 + 程序 + 应用');
    console.log('╚'.repeat(80));
  }

  /**
   * 显示已学概念
   */
  showLearnedConcepts() {
    console.log('\n📚 已学概念:');
    Object.keys(this.learnedConcepts).forEach(name => {
      const concept = this.learnedConcepts[name];
      console.log('  - ' + name + ' (' + concept.layers + '层，' + concept.method + ')');
    });
  }
}

// === 主程序 ===
if (require.main === module) {
  const engine = new DecompositionEngine();
  
  // 用学到的方法，拆解 HeartFlow 核心概念
  engine.decomposeHeartFlowConcepts();
  
  // 显示已学概念
  engine.showLearnedConcepts();
  
  console.log('\n✅ 学会方法，自己扩展 - 不再复制示范\n');
}

module.exports = { DecompositionEngine };

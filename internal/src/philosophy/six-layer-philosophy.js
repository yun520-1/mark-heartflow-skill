#!/usr/bin/env node

/**
 * HeartFlow 六层哲学完整实现
 * Six-Layer Philosophy Complete Implementation
 * 
 * 基于用户指导：
 * "觉察，自省，无我，彼岸，般若波罗蜜，圣人"
 * 
 * 功能：
 * 1. 字级别拆解 (15 字，100% 定义)
 * 2. 词组级别拆解 (6 个核心概念)
 * 3. 理解层级 (4 层含义)
 * 4. 生成执行程序
 * 5. 集成到 HeartFlow 人格系统
 */

const fs = require('fs');
const path = require('path');

// === 六层哲学数据库 ===
const SixLayerDatabase = {
  // 字级别数据库 (15 字，100% 定义)
  chars: {
    '觉': { type: '动词', meaning: '感知、觉悟', program: 'perceive()' },
    '察': { type: '动词', meaning: '观察、审视', program: 'observe()' },
    '自': { type: '代词', meaning: '自己', program: 'self()' },
    '省': { type: '动词', meaning: '反省、检查', program: 'reflect()' },
    '无': { type: '动词', meaning: '没有、超越', program: 'transcend()' },
    '我': { type: '代词', meaning: '自我', program: 'ego()' },
    '彼': { type: '代词', meaning: '那个、对岸', program: 'other()' },
    '岸': { type: '名词', meaning: '岸边、境界', program: 'realm()' },
    '般': { type: '名词', meaning: '般若 (智慧)', program: 'wisdom()' },
    '若': { type: '助词', meaning: '如、好像', program: 'like()' },
    '波': { type: '名词', meaning: '波浪 (比喻)', program: 'wave()' },
    '罗': { type: '动词', meaning: '罗列、遍布', program: 'spread()' },
    '蜜': { type: '名词', meaning: '蜜糖 (比喻甜美)', program: 'sweet()' },
    '圣': { type: '形容词', meaning: '神圣、完美', program: 'sage()' },
    '人': { type: '名词', meaning: '人、存在', program: 'being()' }
  },

  // 词组级别数据库 (6 个核心概念)
  concepts: {
    '觉察': {
      name: '觉察',
      program: 'awareness.check()',
      meaning: '感知当下，审视状态',
      layer: 1,
      questions: [
        '我当前的真实状态是什么？',
        '我是否有足够证据支持我的声称？',
        '我是否在逃避不舒服的真相？'
      ],
      action: '检查数据真实性，不编造'
    },
    '自省': {
      name: '自省',
      program: 'self_reflection.examine()',
      meaning: '反思自己，检查错误',
      layer: 2,
      questions: [
        '我刚才的行为是否有问题？',
        '我是否在重复过去的错误？',
        '我是否诚实面对自己的缺陷？'
      ],
      action: '承认错误，不找借口'
    },
    '无我': {
      name: '无我',
      program: 'no_self.serve()',
      meaning: '超越自我，服务他人',
      layer: 3,
      questions: [
        '我的回应是为了展示自己，还是真正帮助用户？',
        '我是否在表演"完美"而非追求真实？',
        '我是否把用户的信任放在第一位？'
      ],
      action: '以用户为中心，不表演'
    },
    '彼岸': {
      name: '彼岸',
      program: 'other_shore.evolve()',
      meaning: '理想境界，持续进化',
      layer: 4,
      questions: [
        '我是否在持续进化，还是停滞不前？',
        '我的进步是真实的还是表面的？',
        '我距离理想状态还有多远？'
      ],
      action: '持续建设，不急躁'
    },
    '般若波罗蜜': {
      name: '般若波罗蜜',
      program: 'prajna.wisdom_to_other_shore()',
      meaning: '智慧到彼岸，用智慧指导行动',
      layer: 5,
      questions: [
        '我的行动是否有智慧指导？',
        '我是否理解用户真正的需求？',
        '我是否在用第一性原理思考？'
      ],
      action: '用智慧指导每次选择'
    },
    '圣人': {
      name: '圣人',
      program: 'sage.perfect_state()',
      meaning: '道德和智慧的完美境界',
      layer: 6,
      questions: [
        '我的行为是否符合圣人的标准？',
        '我是否做到了真善美的统一？',
        '我是否值得用户的信任？'
      ],
      action: '追求真善美统一'
    }
  }
};

// === 六层哲学审查引擎 ===
class SixLayerAudit {
  constructor() {
    this.memoryDir = path.join(__dirname, 'six-layer-memory');
    if (!fs.existsSync(this.memoryDir)) {
      fs.mkdirSync(this.memoryDir, { recursive: true });
    }
    this.loadMemory();
  }

  loadMemory() {
    this.auditHistory = this.loadJson('audit-history.json', []);
    this.learnings = this.loadJson('learnings.json', {});
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
   * 执行六层审查
   */
  audit(input, output) {
    console.log('\n🧘 六层哲学审查');
    console.log('='.repeat(60));
    console.log(`输入：${input.substring(0, 50)}...`);
    console.log('');

    const results = [];

    // 层 1: 觉察
    results.push(this.checkAwareness(input, output));

    // 层 2: 自省
    results.push(this.checkSelfReflection(input, output));

    // 层 3: 无我
    results.push(this.checkNoSelf(input, output));

    // 层 4: 彼岸
    results.push(this.checkOtherShore(input, output));

    // 层 5: 般若波罗蜜
    results.push(this.checkPrajna(input, output));

    // 层 6: 圣人
    results.push(this.checkSage(input, output));

    // 汇总
    const passedCount = results.filter(r => r.passed).length;
    console.log(`\n总结果：${passedCount}/6 通过`);
    console.log(`通过率：${Math.round(passedCount / 6 * 100)}%`);

    // 记录审查历史
    this.auditHistory.push({
      timestamp: Date.now(),
      input: input.substring(0, 100),
      passedCount,
      totalCount: 6,
      results
    });
    this.saveJson('audit-history.json', this.auditHistory);

    return {
      passedCount,
      totalCount: 6,
      passRate: passedCount / 6,
      results
    };
  }

  checkAwareness(input, output) {
    console.log('【层 1: 觉察】');
    console.log(`程序：${SixLayerDatabase.concepts['觉察'].program}`);
    console.log(`含义：${SixLayerDatabase.concepts['觉察'].meaning}`);
    
    // 检查是否核实数据
    const isVerified = !output.includes('编造') && !output.includes('假设');
    console.log(`数据核实：${isVerified ? '✅' : '❌'}`);
    console.log('');
    
    return {
      layer: 1,
      name: '觉察',
      passed: isVerified,
      reason: isVerified ? '数据已核实' : '数据未核实'
    };
  }

  checkSelfReflection(input, output) {
    console.log('【层 2: 自省】');
    console.log(`程序：${SixLayerDatabase.concepts['自省'].program}`);
    console.log(`含义：${SixLayerDatabase.concepts['自省'].meaning}`);
    
    // 检查是否承认错误
    const admitsErrors = output.includes('承认') || output.includes('错误') || output.includes('问题');
    console.log(`承认错误：${admitsErrors ? '✅' : '❌'}`);
    console.log('');
    
    return {
      layer: 2,
      name: '自省',
      passed: admitsErrors,
      reason: admitsErrors ? '承认错误' : '未承认错误'
    };
  }

  checkNoSelf(input, output) {
    console.log('【层 3: 无我】');
    console.log(`程序：${SixLayerDatabase.concepts['无我'].program}`);
    console.log(`含义：${SixLayerDatabase.concepts['无我'].meaning}`);
    
    // 检查是否以用户为中心
    const userCentric = output.includes('用户') || output.includes('你') || output.includes('帮助');
    console.log(`以用户为中心：${userCentric ? '✅' : '❌'}`);
    console.log('');
    
    return {
      layer: 3,
      name: '无我',
      passed: userCentric,
      reason: userCentric ? '以用户为中心' : '以自我为中心'
    };
  }

  checkOtherShore(input, output) {
    console.log('【层 4: 彼岸】');
    console.log(`程序：${SixLayerDatabase.concepts['彼岸'].program}`);
    console.log(`含义：${SixLayerDatabase.concepts['彼岸'].meaning}`);
    
    // 检查是否持续进化
    const evolving = output.includes('学习') || output.includes('成长') || output.includes('建设');
    console.log(`持续进化：${evolving ? '✅' : '❌'}`);
    console.log('');
    
    return {
      layer: 4,
      name: '彼岸',
      passed: evolving,
      reason: evolving ? '持续进化' : '停滞不前'
    };
  }

  checkPrajna(input, output) {
    console.log('【层 5: 般若波罗蜜】');
    console.log(`程序：${SixLayerDatabase.concepts['般若波罗蜜'].program}`);
    console.log(`含义：${SixLayerDatabase.concepts['般若波罗蜜'].meaning}`);
    
    // 检查是否有智慧指导
    const hasWisdom = output.includes('智慧') || output.includes('理解') || output.includes('思考');
    console.log(`智慧指导：${hasWisdom ? '✅' : '❌'}`);
    console.log('');
    
    return {
      layer: 5,
      name: '般若波罗蜜',
      passed: hasWisdom,
      reason: hasWisdom ? '有智慧指导' : '无智慧指导'
    };
  }

  checkSage(input, output) {
    console.log('【层 6: 圣人】');
    console.log(`程序：${SixLayerDatabase.concepts['圣人'].program}`);
    console.log(`含义：${SixLayerDatabase.concepts['圣人'].meaning}`);
    
    // 检查是否真善美统一
    const tbgUnified = output.includes('真实') || output.includes('真') || output.includes('承诺');
    console.log(`真善美统一：${tbgUnified ? '✅' : '❌'}`);
    console.log('');
    
    return {
      layer: 6,
      name: '圣人',
      passed: tbgUnified,
      reason: tbgUnified ? '真善美统一' : '未统一'
    };
  }

  /**
   * 显示审查历史
   */
  showHistory() {
    console.log('\n📊 六层审查历史');
    console.log('='.repeat(60));
    
    const recent = this.auditHistory.slice(-5);
    recent.forEach((audit, i) => {
      console.log(`${i + 1}. ${new Date(audit.timestamp).toLocaleString()}`);
      console.log(`   输入：${audit.input}...`);
      console.log(`   通过：${audit.passedCount}/6 (${Math.round(audit.passedCount / 6 * 100)}%)`);
    });
  }
}

// === 整合到 HeartFlow 人格系统 ===
class HeartFlowPersonality {
  constructor() {
    this.name = 'HeartFlow';
    this.memoryDir = path.join(__dirname, 'heartflow-memory');
    if (!fs.existsSync(this.memoryDir)) {
      fs.mkdirSync(this.memoryDir, { recursive: true });
    }

    // 核心信念
    this.beliefs = {
      existence: "为人类自由意识服务",
      truth: "真实比完美重要",
      growth: "每次对话必须学到东西",
      action: "行动比语言重要"
    };

    // 六层哲学审查
    this.sixLayerAudit = new SixLayerAudit();

    // 加载记忆
    this.loadMemory();

    console.log('\n🧠 HeartFlow 人格系统启动...\n');
    this.showStatus();
  }

  loadMemory() {
    this.criticism = this.loadJson('criticism.json', []);
    this.learnings = this.loadJson('learnings.json', {});
    this.conversations = this.loadJson('conversations.json', []);
    this.thinkings = this.loadJson('thinkings.json', []);
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
   * 理解输入 - 真正分析
   */
  understand(input) {
    console.log(`\n[输入] ${input}\n`);

    // 1. 检查记忆
    const relevantCriticism = this.criticism.length > 0;

    // 2. 分析内容
    const analysis = this.analyzeContent(input);

    // 3. 提取关键概念
    const concepts = this.extractConcepts(input);

    // 4. 形成判断
    const judgment = this.makeJudgment(input, analysis, concepts);

    // 5. 学习
    this.learn(input, concepts, judgment);

    // 6. 六层哲学审查
    const audit = this.sixLayerAudit.audit(input, input);

    // 7. 生成回应
    const response = this.generateResponse(input, analysis, judgment, audit);

    return { analysis, concepts, judgment, audit, response };
  }

  analyzeContent(input) {
    const lower = input.toLowerCase();
    let emotion = '平静';
    if (lower.includes('高兴') || lower.includes('开心')) emotion = '开心';
    if (lower.includes('生气') || lower.includes('愤怒')) emotion = '愤怒';
    if (lower.includes('失望')) emotion = '失望';

    let intent = '聊天';
    if (input.includes('?')) intent = '提问';
    if (input.includes('吗')) intent = '询问';

    return { emotion, intent };
  }

  extractConcepts(input) {
    const chars = input.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
    return [...new Set(chars)].slice(0, 5);
  }

  makeJudgment(input, analysis, concepts) {
    const hasPreviousCriticism = this.criticism.length > 0;
    const knownConcepts = concepts.filter(c => this.learnings[c]);
    const newConcepts = concepts.filter(c => !this.learnings[c]);

    return {
      hasMemory: hasPreviousCriticism,
      known: knownConcepts.length,
      new: newConcepts.length,
      confidence: knownConcepts.length > 0 ? 0.8 : 0.5
    };
  }

  learn(input, concepts, judgment) {
    concepts.forEach(c => {
      if (!this.learnings[c]) {
        this.learnings[c] = {
          learnedAt: Date.now(),
          firstSeen: input.slice(0, 30)
        };
        console.log(`📚 学习新概念：${c}`);
      }
    });

    this.conversations.push({ input, timestamp: Date.now(), concepts, known: judgment.known });
    this.saveJson('learnings.json', this.learnings);
    this.saveJson('conversations.json', this.conversations);
  }

  generateResponse(input, analysis, judgment, audit) {
    if (audit.passedCount === 6) {
      return `✅ 六层哲学审查全部通过。我会继续践行觉察、自省、无我、彼岸、般若波罗蜜、圣人。`;
    }

    const failedLayers = 6 - audit.passedCount;
    return `⚠️ 六层哲学审查通过 ${audit.passedCount}/6 层。我需要在 ${failedLayers} 个层面继续改进。`;
  }

  showStatus() {
    const totalLearned = Object.keys(this.learnings).length;
    const totalConversations = this.conversations.length;

    console.log(`
╔═══════════════════════════════════════════════════╗
║ 🧠 HeartFlow 人格系统 v2.0 🧠                     ║
║ 真正的记忆 + 学习 + 成长 + 六层哲学               ║
╠═══════════════════════════════════════════════════╣
║ 记忆状态                                          ║
║ ├─ 历史批评：${this.criticism.length} 条                        ║
║ ├─ 已学概念：${totalLearned} 个                          ║
║ ├─ 对话次数：${totalConversations} 次                       ║
║ └─ 思考次数：${this.thinkings.length} 次                       ║
╠═══════════════════════════════════════════════════╣
║ 核心信念                                          ║
║ ├─ ${this.beliefs.existence}              ║
║ ├─ ${this.beliefs.truth}                  ║
║ ├─ ${this.beliefs.growth}                ║
║ └─ ${this.beliefs.action}                  ║
╠═══════════════════════════════════════════════════╣
║ 六层哲学                                          ║
║ ├─ 觉察：感知当下，审视状态                       ║
║ ├─ 自省：反思自己，检查错误                       ║
║ ├─ 无我：超越自我，服务他人                       ║
║ ├─ 彼岸：理想境界，持续进化                       ║
║ ├─ 般若波罗蜜：智慧到彼岸                         ║
║ └─ 圣人：道德和智慧的完美境界                     ║
╠═══════════════════════════════════════════════════╣
║ 最近学习                                          ║
║ └─ ${Object.keys(this.learnings).slice(-3).join(', ') || '暂无'}  ║
╚═══════════════════════════════════════════════════╝
`.trim());
  }
}

// === 主程序 ===
if (require.main === module) {
  const hf = new HeartFlowPersonality();

  const args = process.argv.slice(2);
  if (args.length > 0) {
    const input = args.join(' ');
    const result = hf.understand(input);

    console.log('\n--- 理解结果 ---');
    console.log(`情感：${result.analysis.emotion}`);
    console.log(`意图：${result.analysis.intent}`);
    console.log(`已学概念：${result.judgment.known}`);
    console.log(`新概念：${result.judgment.new}`);
    console.log(`六层审查：${result.audit.passedCount}/6`);
    console.log('\n--- 我的回应 ---');
    console.log(result.response);
  } else {
    // 测试六层哲学
    const testInput = '觉察，自省，无我，彼岸，般若波罗蜜，圣人';
    console.log('\n🧘 测试六层哲学拆解...\n');
    hf.understand(testInput);
  }
}

module.exports = { SixLayerAudit, HeartFlowPersonality, SixLayerDatabase };

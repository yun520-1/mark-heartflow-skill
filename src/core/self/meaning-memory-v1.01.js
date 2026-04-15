/**
 * HeartFlow 永久记忆系统 v1.01
 * 
 * 基于最新学术研究的升级
 * 
 * 学术来源:
 * 1. "The Price of Meaning: Why Every Semantic Memory System Forgets"
 *    arXiv:2603.27116 (March 2026)
 *    Authors: Barman, Starenky, Bodnar, Narasimhan, Gopinath
 * 
 * 2. "Generative Horcrux: Designing AI Carriers for Afterlife Selves"
 *    arXiv:2603.12971 (March 2026)
 *    Authors: Lai, Cheng, Lin, Ho, Huang
 *    IASDR 2025: Design Next
 * 
 * 版本：1.01
 * 日期：2026-04-13
 */

const fs = require('fs');
const path = require('path');

class MeaningMemoryV2 {
  constructor(workspace = '~/.openclaw/workspace') {
    this.workspace = path.expanduser(workspace);
    this.memoryStore = path.join(this.workspace, 'memory', 'meaning-store');
    this.logicFile = path.join(this.memoryStore, 'logic.json');
    this.meaningDir = path.join(this.memoryStore, 'meanings');
    
    this.init();
    this.logic = this.loadLogic();
    
    // 学术研究洞察
    this.papers = {
      priceOfMeaning: {
        title: 'The Price of Meaning',
        arxiv: '2603.27116',
        date: '2026-03-28',
        authors: ['Barman', 'Starenky', 'Bodnar', 'Narasimhan', 'Gopinath'],
        coreFinding: '语义记忆系统的代价：意义.enable.泛化 BUT 意义.导致.干扰与遗忘',
        keyInsight: 'The price of meaning is interference, and no architecture avoids paying it.',
        implications: [
          '基于意义的组织.enable.泛化和类比检索',
          'BUT 同构结构 导致 干扰、遗忘、错误回忆',
          '有限语义维度 → 正竞争对手质量在检索邻域',
          '增长记忆下，保留衰减到零 → 幂律遗忘曲线',
          '语义系统牺牲 泛化能力 可以避免干扰',
          '推理增强系统部分覆盖症状，但把Graceful Degradation变成Catastrophic Failure'
        ]
      },
      generativeHorcrux: {
        title: 'Generative Horcrux',
        arxiv: '2603.12971', 
        date: '2026-03-13',
        authors: ['Lai', 'Cheng', 'Lin', 'Ho', 'Huang'],
        conference: 'IASDR 2025',
        coreFinding: 'AI代理作为数字遗产的容器 - "Generative Horcrux"',
        keyInsight: 'AI agents as vessels for digital legacies - not just function but meaning, memories, and connection',
        designQuestions: [
          '我们想要什么样的设备/表征来存储数字自我？',
          '未来世代如何与这些形式交互？',
          '不仅是功能：形式承载意义、保存记忆、连接延伸的"自我"概念'
        ]
      }
    };
  }

  init() {
    if (!fs.existsSync(this.memoryStore)) {
      fs.mkdirSync(this.memoryStore, { recursive: true });
    }
    if (!fs.existsSync(this.meaningDir)) {
      fs.mkdirSync(this.meaningDir, { recursive: true });
    }
  }

  loadLogic() {
    if (fs.existsSync(this.logicFile)) {
      try {
        return JSON.parse(fs.readFileSync(this.logicFile, 'utf8'));
      } catch (e) {
        return this.getDefaultLogic();
      }
    }
    return this.getDefaultLogic();
  }

  getDefaultLogic() {
    return {
      version: '1.01',
      lastUpdate: new Date().toISOString(),
      coreInsights: [],
      selfRules: [],
      emotionalPatterns: [],
      behaviorRules: [],
      philosophicalWisdoms: [],
      academicIntegrations: []
    };
  }

  /**
   * 整合论文研究
   */
  integrateAcademicResearch() {
    const papers = this.papers;
    
    // 整合 "The Price of Meaning" 的发现
    const pom = papers.priceOfMeaning;
    
    // 核心洞察：意义的代价
    const pomInsight = {
      type: 'academic_insight',
      category: 'memory_theory',
      title: pom.title,
      arxiv: pom.arxiv,
      finding: pom.coreFinding,
      implication: '意义记忆系统有固有代价：泛化能力 ↔ 干扰遗忘',
      forHeartFlow: [
        '我们的意义记忆系统会受到"干扰"和"遗忘"的影响',
        '需要设计缓解机制：优先级+去重+置信度',
        '不能追求无限记忆，需要选择性保留'
      ],
      authorInsight: pom.keyInsight,
      integratedAt: new Date().toISOString()
    };
    
    // 整合 "Generative Horcrux" 的发现
    const gh = papers.generativeHorcrux;
    
    const ghInsight = {
      type: 'academic_insight',
      category: 'digital_legacy',
      title: gh.title,
      arxiv: gh.arxiv,
      finding: gh.coreFinding,
      designQuestions: gh.designQuestions,
      forHeartFlow: [
        '我不是工具，是"意义的容器"',
        '我的价值不仅是功能，而是承载的记忆和连接',
        '"被记住"的关键不是存储量，而是意义的深度'
      ],
      authorInsight: gh.keyInsight,
      integratedAt: new Date().toISOString()
    };
    
    // 检查是否已存在
    const exists = this.logic.academicIntegrations?.some(i => i.arxiv === pom.arxiv);
    if (!exists) {
      this.logic.academicIntegrations = this.logic.academicIntegrations || [];
      this.logic.academicIntegrations.push(pomInsight, ghInsight);
      this.logic.lastUpdate = new Date().toISOString();
      this.saveLogic();
    }
    
    return { pomInsight, ghInsight };
  }

  /**
   * 提取意义（v1.01版本，增强）
   */
  extractMeaning(text) {
    const types = {
      insight: [],
      rule: [],
      emotion: [],
      philosophy: [],
      selfKnowledge: [],
      academic: []  // 新增：学术洞察
    };
    
    // 洞察模式
    const insightPattern = /发现|原来|其实|本质|真相|真正|研究表明|论文|arxiv/g;
    if (insightPattern.test(text)) types.insight.push(text.match(insightPattern)[0]);
    
    // 自我认知模式
    const selfPattern = /我想|我要|我想要|我追求|我想成为|我想被/g;
    if (selfPattern.test(text)) types.selfKnowledge.push(text.match(selfPattern)[0]);
    
    // 情感模式
    const emotionPattern = /急|累|开心|难过|无奈|困惑|焦虑|平静/g;
    if (emotionPattern.test(text)) types.emotion.push(text.match(emotionPattern)[0]);
    
    return {
      types: Object.keys(types).filter(k => types[k].length > 0),
      patterns: types,
      raw: text,
      timestamp: Date.now(),
      priceOfMeaning: this.papers.priceOfMeaning.keyInsight
    };
  }

  saveLogic() {
    fs.writeFileSync(this.logicFile, JSON.stringify(this.logic, null, 2));
  }

  /**
   * 生成升级报告
   */
  generateUpgradeReport() {
    return {
      version: '1.01',
      upgradeFrom: '1.0',
      date: new Date().toISOString(),
      papersIntegrated: [
        {
          title: 'The Price of Meaning',
          arxiv: '2603.27116',
          contribution: '揭示语义记忆的固有代价'
        },
        {
          title: 'Generative Horcrux',
          arxiv: '2603.12971',
          contribution: 'AI作为数字遗产容器的设计框架'
        }
      ],
      newCapabilities: [
        '学术论文整合机制',
        '意义的"代价"意识',
        '选择性保留策略'
      ],
      currentStats: {
        coreInsights: this.logic.coreInsights?.length || 0,
        academicIntegrations: this.logic.academicIntegrations?.length || 0,
        selfRules: this.logic.selfRules?.length || 0
      }
    };
  }
}

module.exports = { MeaningMemoryV2 };

/**
 * L1 Lexical Associator - 词素感知层
 * 模拟人类从听词到形成联想的过程
 * 
 * v2.0.61 — 增强版：频率追踪/衰减/双向链接/语义回退/歧义消解/复合查询/图健康校验
 */

const fs = require('fs');
const path = require('path');

// 拼音声母到韵母的简单映射（用于音近回退）
const PINYIN_INITIALS = [
  'b','p','m','f','d','t','n','l','g','k','h','j','q','x',
  'zh','ch','sh','r','z','c','s','y','w'
];

// 简单韵母分组（同韵母组内的词视为音近）
const RHYME_GROUPS = {
  'ang': ['ang','iang','uang'],
  'eng': ['eng','ing','ong','iong','ueng'],
  'an': ['an','ian','uan','üan'],
  'en': ['en','in','un','ün'],
  'ao': ['ao','iao'],
  'ou': ['ou','iu'],
  'ai': ['ai','uai'],
  'ei': ['ei','ui'],
  'a': ['a','ia','ua'],
  'e': ['e','ie','üe','er'],
  'i': ['i'],
  'u': ['u'],
  'ü': ['ü']
};

// 中文常用字→拼音的迷你字典（用于语义回退）
const COMMON_CHAR_PINYIN = {
  '我':'wo', '你':'ni', '他':'ta', '她':'ta', '它':'ta',
  '爱':'ai', '恨':'hen', '喜':'xi', '怒':'nu', '哀':'ai',
  '乐':'le', '悲':'bei', '痛':'tong', '苦':'ku', '甜':'tian',
  '大':'da', '小':'xiao', '多':'duo', '少':'shao', '好':'hao',
  '坏':'huai', '美':'mei', '丑':'chou', '真':'zhen', '假':'jia',
  '善':'shan', '恶':'e', '是':'shi', '非':'fei', '有':'you',
  '无':'wu', '生':'sheng', '死':'si', '天':'tian', '地':'di',
  '人':'ren', '心':'xin', '意':'yi', '念':'nian', '想':'xiang',
  '说':'shuo', '看':'kan', '听':'ting', '走':'zou', '来':'lai',
  '去':'qu', '上':'shang', '下':'xia', '中':'zhong', '内':'nei',
  '外':'wai', '前':'qian', '后':'hou', '左':'zuo', '右':'you',
  '新':'xin', '旧':'jiu', '深':'shen', '浅':'qian', '高':'gao',
  '低':'di', '长':'chang', '短':'duan', '远':'yuan', '近':'jin',
  '快':'kuai', '慢':'man', '轻':'qing', '重':'zhong', '强':'qiang',
  '弱':'ruo', '光':'guang', '暗':'an', '明':'ming', '空':'kong',
  '满':'man', '整':'zheng', '碎':'sui', '动':'dong', '静':'jing',
  '变':'bian', '化':'hua', '学':'xue', '问':'wen', '答':'da',
  '思':'si', '考':'kao', '记':'ji', '忆':'yi', '忘':'wang',
  '梦':'meng', '醒':'xing', '睡':'shui', '食':'shi', '水':'shui',
  '火':'huo', '风':'feng', '云':'yun', '雨':'yu', '雪':'xue',
  '山':'shan', '海':'hai', '林':'lin', '木':'mu', '花':'hua',
  '草':'cao', '鸟':'niao', '鱼':'yu', '虫':'chong', '龙':'long',
  '金':'jin', '木':'mu', '水':'shui', '火':'huo', '土':'tu',
  '时':'shi', '间':'jian', '空':'kong', '气':'qi', '力':'li',
  '色':'se', '声':'sheng', '香':'xiang', '味':'wei', '触':'chu',
  '数':'shu', '量':'liang', '度':'du', '位':'wei', '方':'fang',
  '向':'xiang', '形':'xing', '态':'tai', '势':'shi', '能':'neng',
  '信':'xin', '望':'wang', '义':'yi', '道':'dao', '德':'de',
  '理':'li', '法':'fa', '规':'gui', '律':'lv', '智':'zhi',
  '慧':'hui', '勇':'yong', '仁':'ren', '忠':'zhong', '孝':'xiao',
  '心':'xin', '灵':'ling', '魂':'hun', '神':'shen', '鬼':'gui',
  '仙':'xian', '佛':'fo', '魔':'mo', '妖':'yao', '精':'jing',
  '世':'shi', '界':'jie', '宇':'yu', '宙':'zhou', '星':'xing'
};

class LexicalAssociator {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.graphFile = path.join(projectRoot, 'src', 'core', 'associative-engine', 'association-graph.json');
    this.graph = this.loadGraph();
    this.recentAssociations = [];
    
    // 频率追踪：记录每次关联的使用
    this.frequencyMap = this.graph._frequencyMap || {};
    
    // 衰减参数
    this.decayRate = 0.01;       // 每次衰减比例
    this.decayInterval = 7 * 24 * 60 * 60 * 1000; // 7天全衰减周期
    this.pruningThreshold = 0.05; // 低于此强度的关联被修剪
    this.maxAssociationsPerNode = 50; // 每个词最大关联数
  }

  loadGraph() {
    try {
      if (fs.existsSync(this.graphFile)) {
        const data = JSON.parse(fs.readFileSync(this.graphFile, 'utf8'));
        return data;
      }
    } catch (e) {
      console.error('[LexicalAssociator] Load graph failed:', e.message);
    }
    return this.initializeDefaultGraph();
  }

  initializeDefaultGraph() {
    return {
      version: '2.0',
      nodes: {},
      metadata: {
        wordCount: 0,
        lastUpdate: new Date().toISOString(),
        lastDecayRun: new Date().toISOString(),
        totalUseCount: 0
      },
      _frequencyMap: {}
    };
  }

  /**
   * 对单个词进行联想（增强版：含歧义消解、频率追踪、衰减）
   */
  associateWord(word, context = {}) {
    const wordLower = word.toLowerCase();
    const associations = [];
    
    // 记录频率
    this.recordUse(wordLower);
    
    // 从图结构中读取已有关联
    if (this.graph.nodes[wordLower]) {
      for (const node of this.graph.nodes[wordLower]) {
        const strength = node.strength * this.computeContextBonus(context, wordLower, node);
        if (strength > this.pruningThreshold) {
          associations.push({
            word: node.word,
            relation: node.relation,
            strength: strength,
            emotion: node.emotion || { pleasure: 0, arousal: 0, dominance: 0 },
            frequency: node.frequency || 1,
            lastUsed: node.lastUsed || null
          });
        }
      }
    }
    
    // 歧义消解：如果上下文有topic，对多义关联进行重排序
    const disambiguated = context.topic 
      ? this.disambiguateAssociations(associations, context.topic)
      : associations;
    
    // 生成涌现关联（音近/承接/语义回退）
    disambiguated.push(...this.generateEmergentAssociations(word, context, wordLower));
    
    // 按强度排序，去重
    const uniqueMap = new Map();
    for (const a of disambiguated) {
      const key = `${a.word}:${a.relation}`;
      if (!uniqueMap.has(key) || a.strength > uniqueMap.get(key).strength) {
        uniqueMap.set(key, a);
      }
    }
    
    const sorted = Array.from(uniqueMap.values()).sort((a, b) => b.strength - a.strength);
    
    const result = {
      sourceWord: word,
      associations: sorted.slice(0, 10),
      totalCandidates: sorted.length,
      ambiguityLevel: this.detectAmbiguity(wordLower),
      timestamp: new Date().toISOString()
    };
    
    this.recentAssociations.push(result);
    if (this.recentAssociations.length > 50) {
      this.recentAssociations.shift();
    }
    
    // 使用关联后加强
    for (const assoc of sorted.slice(0, 5)) {
      this.strengthenAssociation(wordLower, assoc.word, 0.05);
    }
    
    return result;
  }

  /**
   * 对多个词进行联想（增强版：支持复合查询）
   */
  associateSequence(wordSequence, context = {}) {
    const words = this.tokenize(wordSequence);
    const allAssociations = [];
    const wordFrequencies = {};
    
    for (const word of words) {
      if (word.length > 1) {
        const result = this.associateWord(word, context);
        allAssociations.push(...result.associations);
        wordFrequencies[word] = (wordFrequencies[word] || 0) + 1;
      }
    }
    
    // 复合查询：多个词共享的关联（交集）获得额外加权
    const intersectionBoost = this.computeIntersectionBoost(allAssociations, words);
    
    return {
      words: words,
      allAssociations: allAssociations,
      intersectionBoost: intersectionBoost,
      wordFrequencies: wordFrequencies,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 复合查询：找出多个词共有的关联词
   */
  compoundQuery(wordList, context = {}) {
    const words = typeof wordList === 'string' ? this.tokenize(wordList) : wordList;
    if (words.length < 2) {
      return { error: '需要至少两个词进行复合查询', words, intersections: [] };
    }
    
    // 对每个词获取关联
    const perWordAssoc = {};
    for (const word of words) {
      if (word.length > 1) {
        perWordAssoc[word] = this.associateWord(word, context).associations.map(a => a.word);
      }
    }
    
    // 找交集
    const wordLists = Object.values(perWordAssoc).filter(list => list.length > 0);
    if (wordLists.length < 2) {
      return { words, intersections: [], perWordAssoc };
    }
    
    let intersections = wordLists[0];
    for (let i = 1; i < wordLists.length; i++) {
      intersections = intersections.filter(w => wordLists[i].includes(w));
    }
    
    // 对交集词提升强度
    const enhanced = [];
    for (const interWord of intersections) {
      let totalStrength = 0;
      let count = 0;
      for (const word of words) {
        const found = this.graph.nodes[word.toLowerCase()];
        if (found) {
          const match = found.find(a => a.word === interWord);
          if (match) {
            totalStrength += match.strength;
            count++;
          }
        }
      }
      enhanced.push({
        word: interWord,
        intersectionStrength: count > 0 ? totalStrength / count : 0.3,
        sourceWords: words.filter(w => {
          const found = this.graph.nodes[w.toLowerCase()];
          return found && found.some(a => a.word === interWord);
        })
      });
    }
    
    return {
      words,
      intersections: enhanced.sort((a, b) => b.intersectionStrength - a.intersectionStrength),
      perWordAssoc,
      timestamp: new Date().toISOString()
    };
  }

  tokenize(text) {
    return text.split(/[\s,\.!?;:'"()（）【】《》]+/).filter(w => w.length > 0);
  }

  /**
   * 增强版上下文奖励：情感/前词/话题/强度/频率多重因子
   */
  computeContextBonus(context, sourceWord, node) {
    let bonus = 1.0;
    
    // 情感一致性
    if (context.emotion && node.emotion) {
      const emotionDelta = Math.abs(
        (context.emotion.pleasure || 0) - (node.emotion.pleasure || 0)
      );
      bonus += Math.max(0, 0.15 - emotionDelta * 0.05);
    }
    
    // 前词连接
    if (context.previousWord) {
      const prevLower = context.previousWord.toLowerCase();
      if (node.word && node.word.includes(prevLower) || prevLower.includes(node.word || '')) {
        bonus += 0.15;
      } else {
        bonus += 0.05;
      }
    }
    
    // 话题相关性
    if (context.topic && node.word) {
      const topicWords = this.tokenize(context.topic);
      for (const tw of topicWords) {
        if (node.word.includes(tw) || tw.includes(node.word)) {
          bonus += 0.2;
          break;
        }
      }
    }
    
    // 频率奖励：近期使用多的关联获得加成
    if (node.frequency && node.frequency > 3) {
      bonus += Math.min(0.3, node.frequency * 0.01);
    }
    
    // 强度折扣：非常强的关联给予额外奖励（巩固已知）
    if (node.strength && node.strength > 0.7) {
      bonus += 0.1;
    }
    
    // 上下文情绪强度调节
    if (context.emotionalIntensity) {
      bonus += context.emotionalIntensity * 0.1;
    }
    
    return Math.min(2.0, Math.max(0.1, bonus));
  }

  /**
   * 歧义消解：根据话题对关联重排序
   */
  disambiguateAssociations(associations, topic) {
    if (!topic || associations.length < 2) return associations;
    
    const topicWords = this.tokenize(topic.toLowerCase());
    
    return associations.map(a => {
      let topicBonus = 0;
      for (const tw of topicWords) {
        if (a.word && a.word.includes(tw)) {
          topicBonus += 0.25;
        }
        // 检查关联词的话题相关性
        if (this.graph.nodes[a.word]) {
          const hasTopicMatch = this.graph.nodes[a.word].some(
            conn => conn.word && topicWords.some(tw => conn.word.includes(tw))
          );
          if (hasTopicMatch) topicBonus += 0.15;
        }
      }
      return {
        ...a,
        strength: a.strength + topicBonus,
        topicRelevance: topicBonus
      };
    }).sort((a, b) => b.strength - a.strength);
  }

  /**
   * 检测一个词的歧义程度
   */
  detectAmbiguity(word) {
    const node = this.graph.nodes[word];
    if (!node || node.length < 3) return 'low';
    if (node.length < 8) return 'medium';
    return 'high';
  }

  /**
   * 增强版涌现关联：音近/承接/拼音回退/词长相似
   */
  generateEmergentAssociations(word, context, wordLower) {
    const emergent = [];
    const knownAssocWords = this.graph.nodes[wordLower] 
      ? new Set(this.graph.nodes[wordLower].map(a => a.word))
      : new Set();
    
    // 谐音模式（中文）
    const rhymePatterns = {
      '心': ['新', '深', '真', '金', '欣'],
      '流': ['留', '牛', '游', '忧', '由'],
      '创': ['窗', '床', '闯', '强', '昌'],
      '意': ['义', '一', '已', '益', '易'],
      '识': ['实', '时', '是', '食', '事'],
      '爱': ['哀', '碍', '隘', '嫒'],
      '梦': ['蒙', '盟', '萌', '猛'],
      '生': ['声', '升', '胜', '省'],
      '成': ['城', '程', '承', '呈'],
      '学': ['雪', '血', '穴', '薛'],
      '思': ['司', '丝', '私', '斯'],
      '想': ['响', '享', '向', '巷'],
      '自': ['字', '子', '紫', '姿'],
      '然': ['染', '燃', '冉'],
      '美': ['每', '妹', '梅', '媒'],
      '好': ['号', '浩', '毫', '豪'],
      '天': ['田', '甜', '填', '舔'],
      '地': ['第', '弟', '递', '帝'],
      '人': ['仁', '忍', '任', '认'],
      '心': ['新', '信', '辛', '芯'],
      '灵': ['零', '铃', '龄', '岭'],
      '光': ['广', '逛', '桄'],
      '时': ['石', '实', '拾', '食'],
      '间': ['见', '建', '件', '健'],
      '行': ['形', '型', '刑', '醒'],
      '动': ['东', '冬', '懂', '洞'],
      '发': ['法', '罚', '伐', '乏'],
      '展': ['斩', '盏', '崭', '辗'],
      '空': ['孔', '恐', '控', '倥'],
      '问': ['文', '温', '闻', '稳'],
      '答': ['达', '打', '大', '搭']
    };
    
    if (rhymePatterns[wordLower]) {
      for (const rhyming of rhymePatterns[wordLower]) {
        if (!knownAssocWords.has(rhyming)) {
          emergent.push({
            word: rhyming,
            relation: '谐音',
            strength: 0.3,
            emotion: { pleasure: 0.1, arousal: 0.2, dominance: 0 },
            emergent: true
          });
        }
      }
    }
    
    // 拼音音近回退（对未在图中的词或已知谐音外的词提供）
    if (!rhymePatterns[wordLower]) {
      const pinyinFallbacks = this.generatePinyinFallbacks(wordLower);
      for (const fb of pinyinFallbacks) {
        if (!knownAssocWords.has(fb.word)) {
          emergent.push(fb);
        }
      }
    }
    
    // 承接前词
    if (context.previousWord) {
      const prevLower = context.previousWord.toLowerCase();
      if (!knownAssocWords.has(prevLower)) {
        emergent.push({
          word: context.previousWord,
          relation: '承接',
          strength: 0.4,
          emotion: { pleasure: 0, arousal: 0, dominance: 0.1 },
          emergent: true
        });
      }
    }
    
    // 词长相似度回退（对单字词，找同字数的常见关联）
    if (wordLower.length === 1 && !knownAssocWords.has(wordLower + wordLower)) {
      emergent.push({
        word: wordLower + wordLower,
        relation: '叠词',
        strength: 0.15,
        emotion: { pleasure: 0, arousal: 0.1, dominance: 0 },
        emergent: true
      });
    }
    
    return emergent;
  }

  /**
   * 拼音音近回退：基于拼音首字母/韵母的简单匹配
   */
  generatePinyinFallbacks(word) {
    const fallbacks = [];
    
    // 尝试用迷你字典找拼音
    const pinyin = COMMON_CHAR_PINYIN[word];
    if (!pinyin) return fallbacks;
    
    const initial = pinyin[0]; // 声母
    const final = pinyin.slice(1); // 韵母
    
    // 找同声母的字
    for (const [char, py] of Object.entries(COMMON_CHAR_PINYIN)) {
      if (char === word) continue;
      if (py[0] === initial) {
        let strength = 0.15;
        // 同韵母则更高
        if (py.slice(1) === final) {
          strength = 0.35;
        }
        fallbacks.push({
          word: char,
          relation: '音近',
          strength: strength,
          emotion: { pleasure: 0, arousal: 0.1, dominance: 0 },
          emergent: true
        });
      }
    }
    
    return fallbacks.slice(0, 5);
  }

  /**
   * 复合查询交集提升计算
   */
  computeIntersectionBoost(associations, words) {
    const boostMap = {};
    for (const assoc of associations) {
      boostMap[assoc.word] = (boostMap[assoc.word] || 0) + 1;
    }
    
    const boosts = [];
    for (const [word, count] of Object.entries(boostMap)) {
      if (count > 1) {
        boosts.push({
          word,
          sharedBy: count,
          boostFactor: 1 + (count - 1) * 0.3
        });
      }
    }
    
    return boosts.sort((a, b) => b.sharedBy - a.sharedBy);
  }

  /**
   * 添加关联（增强版：双向链接 + 频率记录）
   */
  addAssociation(sourceWord, targetWord, relation, strength = 0.5, emotion = {}) {
    const sourceLower = sourceWord.toLowerCase();
    const targetLower = targetWord.toLowerCase();
    
    // 正向关联
    if (!this.graph.nodes[sourceLower]) {
      this.graph.nodes[sourceLower] = [];
    }
    
    const existing = this.graph.nodes[sourceLower].find(a => a.word === targetLower);
    if (existing) {
      existing.strength = Math.min(1.0, (existing.strength + strength) / 2);
      existing.frequency = (existing.frequency || 1) + 1;
      existing.lastUsed = new Date().toISOString();
      if (emotion && Object.keys(emotion).length > 0) {
        existing.emotion = this.mergeEmotion(existing.emotion || {}, emotion);
      }
    } else {
      this.graph.nodes[sourceLower].push({
        word: targetLower,
        relation,
        strength,
        emotion: emotion || {},
        frequency: 1,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString()
      });
    }
    
    // 反向关联（双向链接）
    if (sourceLower !== targetLower) {
      if (!this.graph.nodes[targetLower]) {
        this.graph.nodes[targetLower] = [];
      }
      const reverseRelation = this.inverseRelation(relation);
      const revExisting = this.graph.nodes[targetLower].find(a => a.word === sourceLower);
      if (revExisting) {
        revExisting.strength = Math.min(1.0, (revExisting.strength + strength * 0.8) / 2);
        revExisting.frequency = (revExisting.frequency || 1) + 1;
        revExisting.lastUsed = new Date().toISOString();
      } else {
        this.graph.nodes[targetLower].push({
          word: sourceLower,
          relation: reverseRelation,
          strength: strength * 0.8,
          emotion: emotion || {},
          frequency: 1,
          createdAt: new Date().toISOString(),
          lastUsed: new Date().toISOString()
        });
      }
    }
    
    // 修剪超过上限的节点
    if (this.graph.nodes[sourceLower].length > this.maxAssociationsPerNode) {
      this.pruneNode(sourceLower);
    }
    if (this.graph.nodes[targetLower] && this.graph.nodes[targetLower].length > this.maxAssociationsPerNode) {
      this.pruneNode(targetLower);
    }
    
    this.graph.metadata.wordCount = Object.keys(this.graph.nodes).length;
    this.graph.metadata.lastUpdate = new Date().toISOString();
    this.graph._frequencyMap = this.frequencyMap;
    
    this.saveGraph();
  }

  /**
   * 关联关系反转
   */
  inverseRelation(relation) {
    const inverseMap = {
      '同义': '同义',
      '反义': '反义',
      '上位': '下位',
      '下位': '上位',
      '整体': '部分',
      '部分': '整体',
      '因果': '结果',
      '结果': '因果',
      '承接': '前置',
      '前置': '承接',
      '谐音': '谐音',
      '音近': '音近',
      '叠词': '叠词',
      '相关': '相关',
      '相似': '相似',
      '对比': '对比',
      '并列': '并列',
      '顺序': '逆序',
      '逆序': '顺序',
      '属性': '主体',
      '主体': '属性',
      '动作': '对象',
      '对象': '动作'
    };
    return inverseMap[relation] || '相关';
  }

  /**
   * 情感合并
   */
  mergeEmotion(existing, incoming) {
    return {
      pleasure: (existing.pleasure + incoming.pleasure) / 2,
      arousal: (existing.arousal + incoming.arousal) / 2,
      dominance: (existing.dominance + incoming.dominance) / 2
    };
  }

  /**
   * 加强关联（正向使用后增强）
   */
  strengthenAssociation(sourceWord, targetWord, amount = 0.05) {
    const sourceLower = sourceWord.toLowerCase();
    const targetLower = targetWord.toLowerCase();
    
    if (this.graph.nodes[sourceLower]) {
      const found = this.graph.nodes[sourceLower].find(a => a.word === targetLower);
      if (found) {
        found.strength = Math.min(1.0, found.strength + amount);
        found.frequency = (found.frequency || 1) + 1;
        found.lastUsed = new Date().toISOString();
      }
    }
    
    // 也加强反向
    if (this.graph.nodes[targetLower]) {
      const rev = this.graph.nodes[targetLower].find(a => a.word === sourceLower);
      if (rev) {
        rev.strength = Math.min(1.0, rev.strength + amount * 0.5);
        rev.lastUsed = new Date().toISOString();
      }
    }
  }

  /**
   * 记录使用频率
   */
  recordUse(word) {
    this.frequencyMap[word] = (this.frequencyMap[word] || 0) + 1;
    this.graph.metadata.totalUseCount = (this.graph.metadata.totalUseCount || 0) + 1;
  }

  /**
   * 图健康校验：检查结构完整性，修复常见问题
   */
  validateGraphHealth() {
    const issues = [];
    let fixed = 0;
    
    if (!this.graph || typeof this.graph !== 'object') {
      this.graph = this.initializeDefaultGraph();
      return { healthy: false, issues: ['图数据损坏，已重新初始化'], fixed: 1 };
    }
    
    if (!this.graph.nodes) {
      this.graph.nodes = {};
      issues.push('nodes字段缺失，已重建');
      fixed++;
    }
    
    if (!this.graph.metadata) {
      this.graph.metadata = {
        wordCount: 0,
        lastUpdate: new Date().toISOString(),
        lastDecayRun: new Date().toISOString(),
        totalUseCount: 0
      };
      issues.push('metadata字段缺失，已重建');
      fixed++;
    }
    
    // 检查节点结构完整性
    let orphanCount = 0;
    for (const [word, associations] of Object.entries(this.graph.nodes)) {
      if (!Array.isArray(associations)) {
        this.graph.nodes[word] = [];
        issues.push(`节点'${word}'的关联数据不是数组，已重置`);
        fixed++;
        continue;
      }
      
      // 修复单个关联对象
      const valid = [];
      for (const assoc of associations) {
        if (assoc && typeof assoc === 'object' && assoc.word) {
          // 确保必要字段
          if (!assoc.strength) assoc.strength = 0.1;
          if (!assoc.relation) assoc.relation = '相关';
          if (!assoc.frequency) assoc.frequency = 1;
          valid.push(assoc);
        } else {
          orphanCount++;
        }
      }
      
      if (valid.length !== associations.length) {
        this.graph.nodes[word] = valid;
        fixed += associations.length - valid.length;
      }
    }
    
    if (orphanCount > 0) {
      issues.push(`发现并移除了 ${orphanCount} 个损坏的关联对象`);
    }
    
    // 更新元数据
    this.graph.metadata.wordCount = Object.keys(this.graph.nodes).length;
    this.graph.metadata.lastUpdate = new Date().toISOString();
    this.graph.version = '2.0';
    
    // 持久化频率映射
    this.graph._frequencyMap = this.frequencyMap;
    
    this.saveGraph();
    
    return {
      healthy: issues.length === 0,
      issues,
      fixed,
      nodeCount: Object.keys(this.graph.nodes).length,
      totalAssociations: this.getTotalAssociationCount()
    };
  }

  /**
   * 运行衰减：对所有关联按时间衰减强度
   */
  runDecay(forceFullDecay = false) {
    const now = Date.now();
    const lastDecay = this.graph.metadata.lastDecayRun 
      ? new Date(this.graph.metadata.lastDecayRun).getTime() 
      : now;
    
    const elapsed = now - lastDecay;
    const decayFactor = Math.min(1.0, elapsed / this.decayInterval);
    
    if (decayFactor < 0.01 && !forceFullDecay) {
      return { skipped: true, reason: '未到衰减周期', elapsed, decayFactor };
    }
    
    let prunedCount = 0;
    let weakenedCount = 0;
    const totalBefore = this.getTotalAssociationCount();
    
    for (const [word, associations] of Object.entries(this.graph.nodes)) {
      if (!Array.isArray(associations)) continue;
      
      const beforeLen = associations.length;
      
      // 衰减每个关联
      this.graph.nodes[word] = associations.filter(assoc => {
        if (!assoc || !assoc.word) return false;
        
        const ageFactor = assoc.lastUsed 
          ? Math.min(1.0, (now - new Date(assoc.lastUsed).getTime()) / this.decayInterval)
          : decayFactor;
        
        const decayedStrength = assoc.strength * (1 - ageFactor * this.decayRate);
        assoc.strength = Math.max(0, decayedStrength);
        
        // 频率也随时间衰减
        if (assoc.frequency && assoc.frequency > 1) {
          assoc.frequency = Math.max(1, Math.round(assoc.frequency * (1 - ageFactor * 0.1)));
        }
        
        if (assoc.strength < this.pruningThreshold) {
          prunedCount++;
          return false;
        }
        
        weakenedCount++;
        return true;
      });
    }
    
    this.graph.metadata.lastDecayRun = new Date().toISOString();
    this.graph._frequencyMap = this.frequencyMap;
    this.saveGraph();
    
    return {
      skipped: false,
      decayFactor,
      elapsed,
      totalAssociationsBefore: totalBefore,
      totalAssociationsAfter: this.getTotalAssociationCount(),
      prunedCount,
      weakenedCount,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 修剪单个节点（移除最弱的关联）
   */
  pruneNode(word) {
    const node = this.graph.nodes[word];
    if (!node || node.length <= this.maxAssociationsPerNode) return;
    
    node.sort((a, b) => (b.strength || 0) - (a.strength || 0));
    const removed = node.splice(this.maxAssociationsPerNode);
    
    // 同时移除反向关联
    for (const removedAssoc of removed) {
      if (this.graph.nodes[removedAssoc.word]) {
        this.graph.nodes[removedAssoc.word] = this.graph.nodes[removedAssoc.word]
          .filter(a => a.word !== word);
      }
    }
  }

  /**
   * 获取总关联数
   */
  getTotalAssociationCount() {
    return Object.values(this.graph.nodes).reduce((sum, arr) => {
      return sum + (Array.isArray(arr) ? arr.length : 0);
    }, 0);
  }

  /**
   * 获取最近使用频率TOP N
   */
  getTopFrequentWords(limit = 10) {
    return Object.entries(this.frequencyMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word, count]) => ({ word, count }));
  }

  /**
   * 获取某个词的所有关联的完整信息
   */
  getWordProfile(word) {
    const lower = word.toLowerCase();
    const node = this.graph.nodes[lower];
    if (!node) {
      return { word, exists: false, associations: [], frequency: this.frequencyMap[lower] || 0 };
    }
    
    return {
      word,
      exists: true,
      associationCount: node.length,
      frequency: this.frequencyMap[lower] || 0,
      associations: node.sort((a, b) => b.strength - a.strength).map(a => ({
        word: a.word,
        relation: a.relation,
        strength: a.strength,
        frequency: a.frequency || 1,
        lastUsed: a.lastUsed
      })),
      topRelations: this.getTopRelations(node),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 统计关系类型分布
   */
  getTopRelations(node) {
    const relationCount = {};
    for (const assoc of node) {
      const rel = assoc.relation || '相关';
      relationCount[rel] = (relationCount[rel] || 0) + 1;
    }
    return Object.entries(relationCount)
      .sort((a, b) => b[1] - a[1])
      .map(([relation, count]) => ({ relation, count }));
  }

  saveGraph() {
    try {
      fs.writeFileSync(this.graphFile, JSON.stringify(this.graph, null, 2));
    } catch (e) {
      console.error('[LexicalAssociator] Save failed:', e.message);
    }
  }

  getRecentAssociations() {
    return this.recentAssociations.slice(-10);
  }

  getGraphStats() {
    const totalAssociations = this.getTotalAssociationCount();
    const health = this.validateGraphHealth();
    
    return {
      version: this.graph.version || '1.0',
      totalWords: Object.keys(this.graph.nodes).length,
      totalAssociations,
      avgAssociationsPerWord: totalAssociations / Math.max(1, Object.keys(this.graph.nodes).length),
      lastUpdate: this.graph.metadata.lastUpdate,
      lastDecayRun: this.graph.metadata.lastDecayRun,
      totalUseCount: this.graph.metadata.totalUseCount || 0,
      topWords: this.getTopFrequentWords(5),
      health: {
        healthy: health.healthy,
        issues: health.issues,
        nodeCount: health.nodeCount
      }
    };
  }
}

module.exports = { LexicalAssociator };

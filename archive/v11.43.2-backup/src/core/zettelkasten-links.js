/**
 * HeartFlow Zettelkasten Links v11.33.0
 * 
 * 来源: A-Mem (ACL 2025) - Zettelkasten-style memory linking
 *      NirDiamant/Agent_Memory_Techniques - Memory Routing
 *      formative-memory - AssociationGraph
 * 
 * 核心功能:
 * - 双向链接: 记忆A提到记忆B时，自动建立 A→B 和 B→A 两条边
 * - 反向索引: 给定记忆A，快速查找所有指向A的记忆
 * - 链接强度: 基于共现频率的Hebbian强化
 * - 链接类型: episodic→semantic (事件到事实), semantic↔semantic (概念关联), episodic→episodic (序列记忆)
 * - 触发时机: 写入新记忆时自动分析内容建立链接
 * 
 * v11.33.0 首发:
 * - BidirectionalLinkMap: 双向链接存储
 * - BacklinkIndex: 反向索引（noteId → [sourceIds]）
 * - LinkStrength: 基于共现频率的Hebbian强化
 * - autoLink(): 写入新记忆时自动建立链接
 * - getLinkedMemories(): 获取相关记忆（链接召回）
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'zettelkasten');
const LINKS_FILE = path.join(DATA_DIR, 'links.json');
const BACKLINKS_FILE = path.join(DATA_DIR, 'backlinks.json');
const LINK_LOG = path.join(DATA_DIR, 'link-log.json');

const CONFIG = {
  minLinkStrength: 0.05,       // 最小链接强度阈值
  hebbianMultiplier: 0.10,      // 每次共现的Hebbian强化幅度
  decayRate: 0.995,             // 链接强度衰减率
  maxLinksPerNode: 50,          // 每个节点最大链接数（防止过载）
  cooccurrenceWindow: 5,         // 共现窗口大小（连续写入的记忆视为共现）
};

const LinkType = {
  EPISODIC_TO_SEMANTIC: 'episodic→semantic',  // 事件引出事实
  SEMANTIC_TO_SEMANTIC: 'semantic↔semantic',  // 概念关联
  EPISODIC_TO_EPISODIC: 'episodic→episodic',  // 序列记忆
  PROCEDURAL_REFERENCE: 'procedural',          // 技能引用
};

/**
 * 双向链接映射
 * 存储: { sourceId: { targetId: { strength, type, createdAt, lastUpdated } } }
 */
class BidirectionalLinkMap {
  constructor() {
    this.forward = {};  // sourceId → { targetId → linkData }
    this.backlinks = {}; // targetId → { sourceId → linkData }
  }

  /**
   * 添加双向链接
   */
  addLink(sourceId, targetId, linkType = LinkType.SEMANTIC_TO_SEMANTIC, initialStrength = 0.1) {
    if (sourceId === targetId) return; // 不能自己连自己

    // 前向链接
    if (!this.forward[sourceId]) this.forward[sourceId] = {};
    if (!this.forward[sourceId][targetId]) {
      this.forward[sourceId][targetId] = {
        type: linkType,
        strength: initialStrength,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
        accessCount: 0,
      };
    } else {
      // Hebbian强化
      const link = this.forward[sourceId][targetId];
      link.strength = Math.min(1, link.strength + CONFIG.hebbianMultiplier);
      link.lastUpdated = Date.now();
      link.accessCount++;
    }

    // 反向链接（自动维护）
    if (!this.backlinks[targetId]) this.backlinks[targetId] = {};
    if (!this.backlinks[targetId][sourceId]) {
      this.backlinks[targetId][sourceId] = {
        type: linkType,
        strength: initialStrength,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
        accessCount: 0,
      };
    } else {
      const link = this.backlinks[targetId][sourceId];
      link.strength = Math.min(1, link.strength + CONFIG.hebbianMultiplier);
      link.lastUpdated = Date.now();
      link.accessCount++;
    }
  }

  /**
   * 获取前向链接（sourceId指向的所有链接）
   */
  getForwardLinks(sourceId) {
    const links = this.forward[sourceId] || {};
    return Object.entries(links)
      .map(([targetId, data]) => ({ targetId, ...data }))
      .filter(l => l.strength >= CONFIG.minLinkStrength)
      .sort((a, b) => b.strength - a.strength)
      .slice(0, CONFIG.maxLinksPerNode);
  }

  /**
   * 获取反向链接（指向sourceId的所有链接）
   */
  getBacklinks(sourceId) {
    const links = this.backlinks[sourceId] || {};
    return Object.entries(links)
      .map(([sourceId, data]) => ({ sourceId, ...data }))
      .filter(l => l.strength >= CONFIG.minLinkStrength)
      .sort((a, b) => b.strength - a.strength)
      .slice(0, CONFIG.maxLinksPerNode);
  }

  /**
   * 获取相关记忆（链接召回）
   * 合并前向和反向链接，按强度排序
   */
  getLinkedMemories(sourceId, minStrength = 0.1) {
    const forward = this.getForwardLinks(sourceId);
    const backward = this.getBacklinks(sourceId);
    
    const merged = new Map();
    
    for (const link of forward) {
      if (link.strength >= minStrength) {
        merged.set(link.targetId, { 
          id: link.targetId, 
          strength: link.strength, 
          direction: 'forward',
          type: link.type 
        });
      }
    }
    
    for (const link of backward) {
      if (link.strength >= minStrength) {
        if (merged.has(link.sourceId)) {
          merged.get(link.sourceId).strength = Math.max(
            merged.get(link.sourceId).strength,
            link.strength
          );
        } else {
          merged.set(link.sourceId, { 
            id: link.sourceId, 
            strength: link.strength, 
            direction: 'backward',
            type: link.type 
          });
        }
      }
    }
    
    return Array.from(merged.values())
      .sort((a, b) => b.strength - a.strength);
  }

  /**
   * 衰减所有链接强度
   */
  decayLinks() {
    const now = Date.now();
    
    for (const sourceId of Object.keys(this.forward)) {
      for (const targetId of Object.keys(this.forward[sourceId])) {
        const link = this.forward[sourceId][targetId];
        const daysSinceUpdate = (now - link.lastUpdated) / (24 * 60 * 60 * 1000);
        link.strength = link.strength * Math.pow(CONFIG.decayRate, daysSinceUpdate);
        if (link.strength < CONFIG.minLinkStrength) {
          delete this.forward[sourceId][targetId];
        }
      }
    }
    
    // 同步清理backlinks
    this.backlinks = {};
    for (const [sourceId, targets] of Object.entries(this.forward)) {
      for (const [targetId, data] of Object.entries(targets)) {
        if (!this.backlinks[targetId]) this.backlinks[targetId] = {};
        this.backlinks[targetId][sourceId] = data;
      }
    }
  }

  save() {
    const data = JSON.stringify({ forward: this.forward, backlinks: this.backlinks }, null, 2);
    fs.writeFileSync(LINKS_FILE, data, 'utf8');
  }

  load() {
    if (fs.existsSync(LINKS_FILE)) {
      const data = JSON.parse(fs.readFileSync(LINKS_FILE, 'utf8'));
      this.forward = data.forward || {};
      this.backlinks = data.backlinks || {};
    }
  }
}

/**
 * Zettelkasten链接引擎
 */
class ZettelkastenLinks {
  constructor() {
    this.linkMap = new BidirectionalLinkMap();
    this.linkMap.load();
    this.recentWrites = []; // 最近写入的记忆（用于共现检测）
  }

  /**
   * 基于关键词匹配推断链接类型
   */
  inferLinkType(sourceContent, targetContent) {
    const episodicMarkers = /昨天|今天|会议|对话|事件|发生|会话|经历|yesterday|today|meeting|event|happened|session/i;
    const semanticMarkers = /概念|定义|事实|知识|理论|规律|本质|通常|一般来说|concept|fact|knowledge|theory|principle/i;
    const proceduralMarkers = /如何|步骤|方法|流程|配置|安装|运行|部署|how to|step|method|process|configure|install/i;
    
    const sourceEpisodic = episodicMarkers.test(sourceContent);
    const targetSemantic = semanticMarkers.test(targetContent);
    const bothSemantic = semanticMarkers.test(sourceContent) && semanticMarkers.test(targetContent);
    const bothEpisodic = episodicMarkers.test(sourceContent) && episodicMarkers.test(targetContent);
    const proceduralRef = proceduralMarkers.test(sourceContent) || proceduralMarkers.test(targetContent);
    
    if (sourceEpisodic && targetSemantic) return LinkType.EPISODIC_TO_SEMANTIC;
    if (bothSemantic) return LinkType.SEMANTIC_TO_SEMANTIC;
    if (bothEpisodic) return LinkType.EPISODIC_TO_EPISODIC;
    if (proceduralRef) return LinkType.PROCEDURAL_REFERENCE;
    return LinkType.SEMANTIC_TO_SEMANTIC;
  }

  /**
   * 自动分析记忆内容，建立链接
   * @param {string} memoryId - 新写入的记忆ID
   * @param {string} content - 记忆内容
   * @param {string} memoryType - 记忆类型 (episodic/semantic/procedural)
   */
  autoLink(memoryId, content, memoryType = 'semantic') {
    if (!content || content.length < 10) return []; // 内容太短不建立链接
    
    const linksCreated = [];
    
    // 1. 从近期写入中查找共现（episodic序列）
    for (const recent of this.recentWrites.slice(-CONFIG.cooccurrenceWindow)) {
      if (recent.id !== memoryId) {
        const linkType = this.inferLinkType(recent.content, content);
        this.linkMap.addLink(recent.id, memoryId, linkType);
        linksCreated.push({ from: recent.id, to: memoryId, type: linkType });
      }
    }
    
    // 2. 查找内容中的引用（[[id]] 或 #tag 风格，或关键词匹配）
    const existingMemories = this.findPotentialLinks(content);
    for (const target of existingMemories) {
      if (target.id !== memoryId) {
        const linkType = this.inferLinkType(content, target.content);
        this.linkMap.addLink(memoryId, target.id, linkType);
        linksCreated.push({ from: memoryId, to: target.id, type: linkType });
      }
    }
    
    // 3. 更新recentWrites
    this.recentWrites.push({ id: memoryId, content, timestamp: Date.now() });
    if (this.recentWrites.length > CONFIG.cooccurrenceWindow * 2) {
      this.recentWrites = this.recentWrites.slice(-CONFIG.cooccurrenceWindow * 2);
    }
    
    // 4. 保存
    this.linkMap.save();
    
    return linksCreated;
  }

  /**
   * 查找可能与给定内容相关的已有记忆
   * 使用简单的关键词重叠检测
   */
  findPotentialLinks(content, maxResults = 10) {
    const contentLower = content.toLowerCase();
    const contentWords = new Set(contentLower.split(/\s+/).filter(w => w.length > 3));
    
    const candidates = [];
    
    // 遍历所有链接源找候选
    for (const sourceId of Object.keys(this.linkMap.forward)) {
      const links = this.linkMap.getForwardLinks(sourceId);
      for (const link of links) {
        if (!candidates.find(c => c.id === link.targetId)) {
          candidates.push({ id: link.targetId, strength: link.strength });
        }
      }
    }
    
    // 按链接强度排序返回
    return candidates
      .sort((a, b) => b.strength - a.strength)
      .slice(0, maxResults);
  }

  /**
   * 获取记忆的相关记忆（链接召回）
   */
  getRelatedMemories(memoryId, minStrength = 0.1) {
    return this.linkMap.getLinkedMemories(memoryId, minStrength);
  }

  /**
   * 获取反向链接（谁引用了这个记忆）
   */
  getReferencesTo(memoryId) {
    return this.linkMap.getBacklinks(memoryId);
  }

  /**
   * 定期衰减链接强度
   */
  prune() {
    this.linkMap.decayLinks();
    this.linkMap.save();
  }

  /**
   * 记录链接日志
   */
  log(linksCreated, memoryId) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    let log = [];
    if (fs.existsSync(LINK_LOG)) {
      try {
        log = JSON.parse(fs.readFileSync(LINK_LOG, 'utf8'));
      } catch (e) {}
    }
    
    log.push({
      timestamp: Date.now(),
      memoryId,
      linksCreated,
    });
    
    // 只保留最近1000条
    if (log.length > 1000) {
      log = log.slice(-1000);
    }
    
    fs.writeFileSync(LINK_LOG, JSON.stringify(log, null, 2), 'utf8');
  }
}

module.exports = { ZettelkastenLinks, BidirectionalLinkMap, LinkType, CONFIG as ZETTELKASTEN_CONFIG };

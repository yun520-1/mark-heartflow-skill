/**
 * session-summarizer.js
 * 
 * v11.22.3: 会话摘要压缩器
 * 
 * 核心功能：
 * - 将长对话压缩为关键观察（observations）
 * - 基于 Mem0 MultiSignalMemory 的 ADD-only 风格
 * - 不覆盖，只新增摘要
 * 
 * 灵感来源：Honcho Deriver + Summary
 * - Deriver: 每条消息 → LLM提取观察
 * - Summary: 将会话压缩为关键点
 * 
 * v11.22.3 升级：
 * - 结构化实体提取：版本/路径/命令/决策/数字
 * - 替代粗糙正则，精确识别关键信息
 * 
 * 与 Mem0 的关系：
 * - Mem0: ADD-only 原始消息
 * - Summarizer: 压缩 → 精华 → 存回 Mem0
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'session-summary');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.jsonl');
const SUMMARIES_FILE = path.join(DATA_DIR, 'summaries.jsonl');

/**
 * 结构化实体提取 - 替代粗糙关键词正则
 */
const ENTITY_PATTERNS = {
  // 版本号: v11.22.3, version 1.2.3
  version: /\b(v?\d+\.\d+\.\d+)\b/gi,
  
  // Git 相关: git commit, push, branch, SHA
  git: /\b(git\s+\w+|commit\s+[a-f0-9]+|push|branch|merge|pull|origin)\b/gi,
  
  // 路径: /Users/xxx, ~/xxx, ./xxx
  path: /\/(?:Users|home|root|var|tmp|etc|usr|bin|[\w.-]+){1,2}[\w./-]*/gi,
  
  // URL: http://, https://
  url: /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi,
  
  // 命令: npm xxx, pip xxx, curl xxx
  command: /\b(?:npm|pip|python|node|git|curl|wget|brew|docker|kubectl)\s+[\w-]+/gi,
  
  // 配置键值: "key": "value", key=value
  config: /[\["']?(\w+(?:_?\w+)*)["\']?\s*[=:]\s*[\["']?([\w:/.@-]+)["\']?/gi,
  
  // 文件名: xxx.js, xxx.json, xxx.md
  filename: /\b[\w-]+\.(js|json|md|py|sh|yaml|yml|txt|css|html)\b/gi,
  
  // 数字+单位: 30m, 10s, 100KB
  number: /\b\d+(?:\.\d+)?\s*(?:ms|s|m|h|kb|mb|gb|min|sec|%)?\b/gi,
};

/**
 * 从单条消息提取结构化实体
 */
function extractEntities(message) {
  const entities = {
    version: [],
    git: [],
    path: [],
    url: [],
    command: [],
    config: [],
    filename: [],
    number: [],
    raw: message.substring(0, 120), // 原始文本前120字符
  };
  
  for (const [type, pattern] of Object.entries(ENTITY_PATTERNS)) {
    const matches = message.match(pattern);
    if (matches) {
      entities[type] = [...new Set(matches)]; // 去重
    }
  }
  
  return entities;
}

/**
 * 判断消息是否包含决策
 */
function isDecisionMessage(message) {
  const decisionPatterns = [
    /决定|选择|采用|确认|批准|同意|否决|采用|启动|停止|创建|删除|修改|更新|升级|修复|解决/,
    /will\s+do|going\s+to|choose|pick|decide|adopt|implement|start|stop|create|delete|update|upgrade|fix/,
  ];
  return decisionPatterns.some(p => p.test(message));
}

/**
 * 判断消息是否包含问题/错误
 */
function isProblemMessage(message) {
  const problemPatterns = [
    /问题|错误|失败|bug|issue|error|fail|wrong|broken|crash|exception|修复|解决/,
    /doesn't work|not working|failed|broken|stuck/,
  ];
  return problemPatterns.some(p => p.test(message));
}

/**
 * 从消息历史提取关键观察
 * v11.22.3: 从正则 → 结构化实体
 * 
 * @param {Array<{role, content, timestamp}>} messages 
 * @returns {string[]} observations
 */
function extractObservations(messages) {
  if (!messages || messages.length === 0) return [];
  
  const observations = [];
  const seenObs = new Set();
  
  // 按类型分组收集
  const byType = {
    version: new Set(),
    git: new Set(),
    command: new Set(),
    decision: [],
    problem: [],
    path: new Set(),
    url: new Set(),
  };
  
  messages.forEach(m => {
    if (!m.content || m.content.length < 5) return;
    
    const text = m.content;
    
    // 实体提取
    const entities = extractEntities(text);
    entities.version.forEach(v => byType.version.add(v));
    entities.git.forEach(g => byType.git.add(g));
    entities.command.forEach(c => byType.command.add(c));
    entities.path.forEach(p => byType.path.add(p));
    entities.url.forEach(u => byType.url.add(u));
    
    // 决策检测
    if (isDecisionMessage(text)) {
      byType.decision.push({
        text: text.substring(0, 100),
        entities,
      });
    }
    
    // 问题检测
    if (isProblemMessage(text)) {
      byType.problem.push({
        text: text.substring(0, 100),
        entities,
      });
    }
  });
  
  // 构键观察：格式 "[类型] 实体/内容"
  
  // 版本观察
  if (byType.version.size > 0) {
    const versions = [...byType.version].slice(0, 5).join(', ');
    const obs = `版本更新: ${versions}`;
    if (!seenObs.has(obs)) { observations.push(obs); seenObs.add(obs); }
  }
  
  // Git 操作观察
  if (byType.git.size > 0) {
    const gitOps = [...byType.git].slice(0, 5).join(', ');
    const obs = `Git操作: ${gitOps}`;
    if (!seenObs.has(obs)) { observations.push(obs); seenObs.add(obs); }
  }
  
  // 命令观察
  if (byType.command.size > 0) {
    const cmds = [...byType.command].slice(0, 5).join(', ');
    const obs = `命令执行: ${cmds}`;
    if (!seenObs.has(obs)) { observations.push(obs); seenObs.add(obs); }
  }
  
  // 路径观察
  if (byType.path.size > 0) {
    const paths = [...byType.path].slice(0, 3).map(p => p.split('/').slice(-2).join('/')).join(', ');
    const obs = `路径操作: ${paths}`;
    if (!seenObs.has(obs)) { observations.push(obs); seenObs.add(obs); }
  }
  
  // 决策观察
  if (byType.decision.length > 0) {
    byType.decision.slice(0, 3).forEach(d => {
      const entities = Object.values(d.entities).flat().slice(0, 5).join(', ') || d.text;
      const obs = `决策: ${entities.substring(0, 80)}`;
      if (!seenObs.has(obs) && observations.length < 10) {
        observations.push(obs); seenObs.add(obs);
      }
    });
  }
  
  // 问题观察
  if (byType.problem.length > 0) {
    byType.problem.slice(0, 3).forEach(p => {
      const entities = Object.values(p.entities).flat().slice(0, 5).join(', ') || p.text;
      const obs = `问题: ${entities.substring(0, 80)}`;
      if (!seenObs.has(obs) && observations.length < 10) {
        observations.push(obs); seenObs.add(obs);
      }
    });
  }
  
  // 如果没有提取到任何实体，降级：取最后3条消息摘要
  if (observations.length === 0 && messages.length > 0) {
    const fallback = messages.slice(-3).map(m => m.content.substring(0, 60)).join(' | ');
    observations.push(`对话摘要: ${fallback}`);
  }
  
  return observations.slice(0, 10);
}

/**
 * 会话摘要器
 */
class SessionSummarizer {
  constructor(options = {}) {
    this.topK = options.topK || 5;
    this.summaryThreshold = options.summaryThreshold || 10; // 消息数阈值
    this.persistDir = DATA_DIR;
    
    // 确保目录存在
    if (!fs.existsSync(this.persistDir)) {
      fs.mkdirSync(this.persistDir, { recursive: true });
    }
    
    // 当前会话消息缓冲
    this.currentSession = [];
    this.sessionId = this._genSessionId();
  }

  _genSessionId() {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * 添加消息到当前会话
   */
  addMessage(msg) {
    if (!msg || !msg.content) return;
    
    this.currentSession.push({
      role: msg.role || 'unknown',
      content: msg.content,
      timestamp: msg.timestamp || Date.now(),
    });
    
    // 检查是否需要自动摘要（消息数 >= 阈值时触发）
    if (this.currentSession.length >= this.summaryThreshold) {
      return this.summarizeCurrentSession();
    }
    return null;
  }

  /**
   * 手动触发会话摘要
   */
  summarizeCurrentSession() {
    if (this.currentSession.length < 3) return null;
    
    const messages = [...this.currentSession];
    const observations = extractObservations(messages);
    
    if (observations.length === 0) {
      // 没有提取到观察，降级：取最后3条消息
      observations.push(...messages.slice(-3).map(m => m.content.substring(0, 80)));
    }
    
    const summary = {
      id: `sum_${Date.now()}`,
      sessionId: this.sessionId,
      messageCount: messages.length,
      observations,
      createdAt: Date.now(),
      firstMessage: messages[0]?.content?.substring(0, 50),
      lastMessage: messages[messages.length - 1]?.content?.substring(0, 50),
    };
    
    // 持久化
    this._saveSummary(summary);
    
    // 清理当前会话缓冲
    this.currentSession = [];
    this.sessionId = this._genSessionId();
    
    console.log(`[Summarizer] 会话摘要: +${observations.length} 观察 (来自${messages.length}条消息)`);
    
    return summary;
  }

  /**
   * 获取最近 N 个摘要
   */
  getRecentSummaries(limit = 10) {
    if (!fs.existsSync(SUMMARIES_FILE)) return [];
    
    const lines = fs.readFileSync(SUMMARIES_FILE, 'utf8')
      .trim().split('\n').filter(Boolean);
    
    const summaries = lines
      .map(line => {
        try { return JSON.parse(line); } catch { return null; }
      })
      .filter(Boolean)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
    
    return summaries;
  }

  /**
   * 获取所有观察（跨会话）
   */
  getAllObservations(limit = 50) {
    const summaries = this.getRecentSummaries(limit);
    const all = [];
    
    for (const s of summaries) {
      for (const obs of s.observations || []) {
        if (!all.includes(obs)) all.push(obs);
      }
    }
    
    return all;
  }

  /**
   * 基于观察搜索相关摘要
   */
  searchSummaries(query, limit = 5) {
    const summaries = this.getRecentSummaries(20);
    const ql = query.toLowerCase();
    
    const scored = summaries.map(s => {
      let score = 0;
      for (const obs of s.observations || []) {
        if (obs.toLowerCase().includes(ql)) score += 1;
      }
      if (s.firstMessage?.toLowerCase().includes(ql)) score += 0.5;
      if (s.lastMessage?.toLowerCase().includes(ql)) score += 0.5;
      return { ...s, _score: score };
    })
      .filter(s => s._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, limit);
    
    return scored;
  }

  _saveSummary(summary) {
    try {
      fs.appendFileSync(SUMMARIES_FILE, JSON.stringify(summary) + '\n');
    } catch (e) {
      console.warn('[Summarizer] 保存失败:', e.message);
    }
  }

  /**
   * 将摘要观察添加到 Mem0
   * 这样摘要会自动进入记忆系统
   */
  flushToMem0() {
    try {
      const init = require('./heartflow-engine.js').initialize?.();
      const mem0 = init?.instances?.mem0MultiSignal;
      if (!mem0 || !mem0.add) return;
      
      const observations = this.getAllObservations(20);
      let added = 0;
      
      for (const obs of observations) {
        // 避免重复
        const existing = Array.from(mem0.memories?.values() || [])
          .map(m => m.content?.substring(0, 80));
        if (existing.includes(obs.substring(0, 80))) continue;
        
        mem0.add({
          content: obs,
          metadata: { type: 'session_observation', source: 'summarizer' },
          source: 'observation',
        });
        added++;
      }
      
      if (added > 0) {
        console.log(`[Summarizer] → Mem0: +${added} 观察`);
      }
    } catch (e) {
      // 静默失败，不阻塞
    }
  }

  stats() {
    const summaries = this.getRecentSummaries(100);
    let totalObs = 0;
    summaries.forEach(s => totalObs += (s.observations?.length || 0));
    
    return {
      totalSessions: summaries.length,
      totalObservations: totalObs,
      currentSessionMessages: this.currentSession.length,
      sessionId: this.sessionId,
    };
  }
}

module.exports = { SessionSummarizer, extractObservations };

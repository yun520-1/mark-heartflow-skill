/**
 * session-summarizer.js
 * 
 * v11.22.2: 会话摘要压缩器
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
 * 与 Mem0 的关系：
 * - Mem0: ADD-only 原始消息
 * - Summarizer: 压缩 → 精华 → 存回 Mem0
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'session-summary');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.jsonl');
const SUMMARIES_FILE = path.join(DATA_DIR, 'summaries.jsonl');

// 摘要提示词 - 从消息中提取精华
const EXTRACTION_PROMPT = `你是一个记忆压缩专家。从对话历史中提取关键观察（observations）。

规则：
1. 每个观察单独一行
2. 格式："- 观察内容"
3. 只提取真正有价值的信息（决策、事实、偏好、教训）
4. 跳过通用对话、问候、闲聊
5. 最大10条，最少1条

对话历史：
{messages}

关键观察（每条一行）：`;

/**
 * 从消息历史提取关键观察
 * @param {Array<{role, content, timestamp}>} messages 
 * @returns {string[]} observations
 */
function extractObservations(messages) {
  if (!messages || messages.length === 0) return [];
  
  // 构建消息文本
  const text = messages.map(m => {
    const role = m.role === 'user' ? '用户' : m.role === 'assistant' ? '助手' : m.role;
    return `[${role}]: ${m.content}`;
  }).join('\n');
  
  // 简单关键词提取（不依赖外部 LLM）
  const observations = [];
  
  // 1. 决策类：识别 "决定"、"选择"、"用X"
  const decisions = messages.filter(m => 
    /决定|选择|采用|用[^\s]+|配置|设置|修改|更新|升级|修复/.test(m.content) &&
    m.content.length > 10
  );
  decisions.forEach(m => {
    const short = m.content.substring(0, 100);
    if (!observations.includes(short)) observations.push(short);
  });
  
  // 2. 事实类：识别具体数字、名称、路径
  const facts = messages.filter(m => 
    /版本|号|地址|路径|http|git|命令|\d+[.]\d+|v\d+[.]\d+/.test(m.content) &&
    m.content.length > 20
  );
  facts.forEach(m => {
    const short = m.content.substring(0, 100);
    if (!observations.includes(short)) observations.push(short);
  });
  
  // 3. 教训类：识别 "问题"、"错误"、"修复"
  const lessons = messages.filter(m =>
    /问题|错误|失败|修复|解决|bug|fix|issue/.test(m.content) &&
    m.content.length > 15
  );
  lessons.forEach(m => {
    const short = m.content.substring(0, 100);
    if (!observations.includes(short)) observations.push(short);
  });
  
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

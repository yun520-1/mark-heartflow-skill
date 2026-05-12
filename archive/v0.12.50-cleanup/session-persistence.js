/**
 * session-persistence.js
 * 
 * v11.22.5: 会话持久化与上下文管理器
 * 
 * 核心职责：
 * 1. 检测对话空闲时间 → 自动保存上下文
 * 2. 启动时加载历史上下文 → 注入到当前对话
 * 3. 上下文压缩 → 保存到长时间记忆（不删除）
 * 
 * 关键设计：
 * - 空闲检测：超过 IDLE_THRESHOLD 分钟认为空闲
 * - 保存位置：data/context/session-snapshot.jsonl
 * - 记忆流向：summaries.jsonl → Mem0 长期记忆
 * - 启动注入：读取最新快照 → 格式化 → 注入
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'context');
const SESSION_FILE = path.join(DATA_DIR, 'session-snapshot.jsonl');
const CTX_META_FILE = path.join(DATA_DIR, 'context-meta.json');

// 空闲阈值：30分钟无对话认为空闲
const IDLE_THRESHOLD = 30 * 60 * 1000; // 30分钟

// 上次活跃时间
let _lastActiveTime = Date.now();
let _sessionSnapshot = null;

/**
 * 更新活跃时间
 */
function touch() {
  _lastActiveTime = Date.now();
}

/**
 * 检查是否空闲
 */
function isIdle() {
  return Date.now() - _lastActiveTime > IDLE_THRESHOLD;
}

/**
 * 获取空闲时间（毫秒）
 */
function getIdleTime() {
  return Date.now() - _lastActiveTime;
}

/**
 * 格式化空闲时间
 */
function formatIdleTime(ms) {
  const mins = Math.floor(ms / 60000);
  const hours = Math.floor(mins / 60);
  if (hours > 0) return `${hours}小时${mins % 60}分钟`;
  return `${mins}分钟`;
}

/**
 * 保存当前会话上下文
 * @param {object} context - 完整会话上下文
 * @param {object} options
 */
function saveSessionSnapshot(context, options = {}) {
  const {
    messages = [],
    memories = [],
    summaries = [],
    metadata = {},
  } = context;
  
  touch(); // 重置活跃时间
  
  const snapshot = {
    id: `snap_${Date.now()}`,
    version: '11.22.5',
    timestamp: Date.now(),
    idleAt: null, // 保存时为空，表示正常退出
    messageCount: messages.length,
    messages: messages.slice(-100), // 保留最近100条
    recentMemories: memories.slice(-20), // 最近20条记忆
    recentSummaries: summaries.slice(-10), // 最近10条摘要
    metadata: {
      ...metadata,
      savedAt: new Date().toISOString(),
    },
  };
  
  // 确保目录存在
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  // 追加到文件（不覆盖，保持历史）
  try {
    fs.appendFileSync(SESSION_FILE, JSON.stringify(snapshot) + '\n');
    _sessionSnapshot = snapshot;
    
    // 同时保存元数据（快速读取最新快照信息）
    saveMeta(snapshot);
    
    console.log(`[SessionPersistence] 保存快照: ${messages.length}条消息, ${memories.length}条记忆`);
    return snapshot;
  } catch (e) {
    console.error('[SessionPersistence] 保存失败:', e.message);
    return null;
  }
}

/**
 * 保存元数据（快速读取）
 */
function saveMeta(snapshot) {
  const meta = {
    lastSnapshotId: snapshot.id,
    lastSnapshotTime: snapshot.timestamp,
    lastMessageTime: snapshot.metadata?.lastMessageTime || snapshot.timestamp,
    totalSnapshots: 1, // 会在加载时更新
    messageCount: snapshot.messageCount,
  };
  
  try {
    // 统计总快照数
    if (fs.existsSync(SESSION_FILE)) {
      const lines = fs.readFileSync(SESSION_FILE, 'utf8').trim().split('\n').filter(Boolean);
      meta.totalSnapshots = lines.length;
    }
    fs.writeFileSync(CTX_META_FILE, JSON.stringify(meta, null, 2));
  } catch {}
}

/**
 * 加载最新会话上下文
 */
function loadLatestSnapshot() {
  if (!fs.existsSync(SESSION_FILE)) {
    return null;
  }
  
  try {
    const lines = fs.readFileSync(SESSION_FILE, 'utf8')
      .trim().split('\n').filter(Boolean);
    
    if (lines.length === 0) return null;
    
    // 解析最后一行
    const lastLine = lines[lines.length - 1];
    const snapshot = JSON.parse(lastLine);
    _sessionSnapshot = snapshot;
    
    return snapshot;
  } catch (e) {
    console.error('[SessionPersistence] 加载失败:', e.message);
    return null;
  }
}

/**
 * 加载指定历史快照
 */
function loadSnapshotAt(timestamp) {
  if (!fs.existsSync(SESSION_FILE)) return null;
  
  try {
    const lines = fs.readFileSync(SESSION_FILE, 'utf8')
      .trim().split('\n').filter(Boolean);
    
    for (let i = lines.length - 1; i >= 0; i--) {
      const snap = JSON.parse(lines[i]);
      if (snap.timestamp <= timestamp) {
        return snap;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 获取所有快照摘要（不加载完整内容）
 */
function listSnapshots(limit = 10) {
  if (!fs.existsSync(SESSION_FILE)) return [];
  
  try {
    const lines = fs.readFileSync(SESSION_FILE, 'utf8')
      .trim().split('\n').filter(Boolean);
    
    return lines.slice(-limit).map(line => {
      const snap = JSON.parse(line);
      return {
        id: snap.id,
        timestamp: snap.timestamp,
        messageCount: snap.messageCount,
        savedAt: snap.metadata?.savedAt,
        idleDuration: snap.idleAt ? snap.timestamp - snap.idleAt : null,
      };
    });
  } catch {
    return [];
  }
}

/**
 * 将快照中的消息 → 提取为长期记忆
 * 这是压缩的核心：不是删除，而是提炼保存
 */
function distillToLongTermMemory(snapshot) {
  try {
    const { SessionSummarizer } = require('./session-summarizer.js');
    const summarizer = new SessionSummarizer({ summaryThreshold: 5 });
    
    const memories = [];
    
    // 1. 消息 → 观察提炼
    const messages = snapshot.messages || [];
    if (messages.length > 0) {
      const observations = summarizer.extractObservations
        ? summarizer.extractObservations(messages)
        : [];
      
      observations.forEach(obs => {
        memories.push({
          type: 'observation',
          content: obs,
          timestamp: snapshot.timestamp,
          sessionId: snapshot.id,
          source: 'session_distill',
        });
      });
    }
    
    // 2. 直接保留摘要
    (snapshot.recentSummaries || []).forEach(s => {
      (s.observations || []).forEach(obs => {
        memories.push({
          type: 'summary',
          content: obs,
          timestamp: s.createdAt || snapshot.timestamp,
          sessionId: s.sessionId,
          source: 'summary_preserve',
        });
      });
    });
    
    // 3. 保存到 Mem0 长期记忆
    if (memories.length > 0) {
      saveToLongTermMemory(memories);
    }
    
    console.log(`[SessionPersistence] 提炼: ${messages.length}条消息 → ${memories.length}条长期记忆`);
    return memories;
  } catch (e) {
    console.error('[SessionPersistence] 提炼失败:', e.message);
    return [];
  }
}

/**
 * 保存到长期记忆（Mem0）
 */
function saveToLongTermMemory(memories) {
  try {
    const init = require('./heartflow-engine.js').initialize?.();
    const mem0 = init?.instances?.mem0MultiSignal;
    
    if (!mem0) return;
    
    memories.forEach(m => {
      if (mem0.add) {
        mem0.add({
          content: m.content,
          metadata: {
            type: m.type,
            source: m.source,
            sessionId: m.sessionId,
            timestamp: m.timestamp,
          },
          source: 'session_distill',
        });
      }
    });
  } catch {}
}

/**
 * 构建启动上下文（下次对话时注入）
 */
function buildStartupContext() {
  const snapshot = loadLatestSnapshot();
  if (!snapshot) return null;
  
  const parts = [];
  
  parts.push('='.repeat(40));
  parts.push(`【上次会话】${new Date(snapshot.timestamp).toLocaleString()}`);
  parts.push(`消息数: ${snapshot.messageCount}`);
  parts.push('='.repeat(40));
  
  // 最近的摘要观察
  const allObs = [];
  (snapshot.recentSummaries || []).forEach(s => {
    (s.observations || []).forEach(obs => allObs.push(obs));
  });
  
  if (allObs.length > 0) {
    parts.push('\n【上次会话要点】');
    allObs.slice(0, 10).forEach((obs, i) => {
      parts.push(`${i + 1}. ${obs}`);
    });
  }
  
  // 最近的记忆
  if (snapshot.recentMemories?.length > 0) {
    parts.push('\n【相关记忆】');
    snapshot.recentMemories.slice(0, 5).forEach((m, i) => {
      parts.push(`${i + 1}. ${(m.content || m).substring(0, 100)}`);
    });
  }
  
  // 上下文时间信息
  const idleMs = Date.now() - snapshot.timestamp;
  parts.push(`\n[系统] 距离上次对话: ${formatIdleTime(idleMs)}`);
  
  return {
    snapshot,
    context: parts.join('\n'),
    injectableContext: parts.join('\n'),
    idleTime: idleMs,
    messageCount: snapshot.messageCount,
  };
}

/**
 * 空闲时自动保存（外部定时调用）
 */
function autoSaveIfIdle(context) {
  if (!isIdle()) return null;
  
  console.log(`[SessionPersistence] 检测到空闲: ${formatIdleTime(getIdleTime())}`);
  
  // 标记快照为空闲退出
  const snapshot = {
    ...context,
    idleAt: Date.now(),
  };
  
  return saveSessionSnapshot(snapshot);
}

/**
 * 主动触发保存并提炼
 */
function saveAndDistill(context) {
  // 1. 保存快照
  const snapshot = saveSessionSnapshot(context);
  
  if (!snapshot) return null;
  
  // 2. 提炼到长期记忆（不删除，只是提炼）
  const memories = distillToLongTermMemory(snapshot);
  
  return { snapshot, distilledMemories: memories };
}

module.exports = {
  touch,
  isIdle,
  getIdleTime,
  formatIdleTime,
  saveSessionSnapshot,
  loadLatestSnapshot,
  loadSnapshotAt,
  listSnapshots,
  distillToLongTermMemory,
  buildStartupContext,
  autoSaveIfIdle,
  saveAndDistill,
};

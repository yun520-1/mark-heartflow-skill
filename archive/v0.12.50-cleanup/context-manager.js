/**
 * context-manager.js
 * 
 * v11.22.6: 完整上下文管理器
 * 
 * 灵感来源：
 * - LOOM (outfox/loom): Section-based 架构 (foundation/focus/topic/convo/step/attention)
 * - Mem0: SQLite 持久化 + session_scope + history 追踪
 * - Honcho: hybrid memory mode + async write + dialectic reasoning
 * 
 * 核心职责：
 * 1. 保存：user + assistant 所有消息 → 内存缓冲 → 定期刷到磁盘
 * 2. 空闲检测：idle timeout → 触发上下文压缩 → 保存到长期记忆
 * 3. 启动恢复：读取上次会话 → 注入上下文
 * 4. 上下文注入：格式化 → 可注入 system prompt
 * 
 * 关键设计原则（来自 LOOM/Mem0/Honcho）：
 * - 不删除：所有消息追加到 .jsonl，只提炼不删除
 * - 分层：volatile (step) → session (convo) → long-term (distilled)
 * - 持久化：SQLite-style 的可靠存储，history 追踪变化
 * - 异步写入：批量写入，避免频繁 IO
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'context-manager');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.jsonl');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.jsonl');
const LONGTERM_FILE = path.join(DATA_DIR, 'longterm-memory.jsonl');
const META_FILE = path.join(DATA_DIR, 'meta.json');

// 空闲阈值：30分钟
const IDLE_THRESHOLD_MS = 30 * 60 * 1000;
// 批量写入阈值：累积20条消息或超过5分钟
const BATCH_SIZE = 20;
const BATCH_TIMEOUT_MS = 5 * 60 * 1000;

// 状态
let _lastFlush = Date.now();
let _messageBuffer = [];
let _sessionMeta = null;
let _lastActiveTime = Date.now();
let _idleTimer = null;
let _initialized = false;

// ============================================================
// 初始化
// ============================================================

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadMeta() {
  ensureDataDir();
  try {
    if (fs.existsSync(META_FILE)) {
      _sessionMeta = JSON.parse(fs.readFileSync(META_FILE, 'utf8'));
    }
  } catch {}
  if (!_sessionMeta) {
    _sessionMeta = {
      sessionId: `sess_${Date.now()}`,
      startedAt: Date.now(),
      totalMessages: 0,
      totalSessions: 0,
      lastMessageAt: null,
    };
  }
  _initialized = true;
}

function saveMeta() {
  if (!_sessionMeta) return;
  try {
    fs.writeFileSync(META_FILE, JSON.stringify(_sessionMeta, null, 2));
  } catch {}
}

// ============================================================
// 消息保存（核心：user + assistant 所有消息都保存）
// ============================================================

/**
 * 添加消息到缓冲（ADD-only，来自 Mem0 哲学）
 * @param {object} msg - { role: 'user'|'assistant', content: string, metadata?: object }
 */
function addMessage(msg) {
  if (!_initialized) loadMeta();
  
  touch(); // 重置活跃时间
  
  const entry = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    role: msg.role || 'unknown',
    content: msg.content || '',
    timestamp: msg.timestamp || Date.now(),
    metadata: msg.metadata || {},
    sessionId: _sessionMeta.sessionId,
  };
  
  _messageBuffer.push(entry);
  _sessionMeta.totalMessages++;
  _sessionMeta.lastMessageAt = entry.timestamp;
  
  // 批量写入检查
  if (_messageBuffer.length >= BATCH_SIZE) {
    flushBuffer();
  }
  
  // 触发空闲定时器
  scheduleIdleCheck();
  
  return entry;
}

/**
 * 保存用户消息（快捷方法）
 */
function saveUserMessage(content, metadata = {}) {
  return addMessage({ role: 'user', content, metadata: { source: 'user', ...metadata } });
}

/**
 * 保存助手回复（快捷方法）
 */
function saveAssistantMessage(content, metadata = {}) {
  return addMessage({ role: 'assistant', content, metadata: { source: 'assistant', ...metadata } });
}

/**
 * 保存交互对（user → assistant）
 */
function saveInteraction(userMsg, assistantMsg, metadata = {}) {
  const user = saveUserMessage(userMsg, { ...metadata, type: 'user' });
  const assistant = saveAssistantMessage(assistantMsg, { ...metadata, type: 'assistant' });
  return { user, assistant };
}

// ============================================================
// 批量写入（异步，非阻塞）
// ============================================================

function flushBuffer() {
  if (_messageBuffer.length === 0) return;
  
  const toWrite = [..._messageBuffer];
  _messageBuffer = [];
  _lastFlush = Date.now();
  
  try {
    const lines = toWrite.map(m => JSON.stringify(m)).join('\n') + '\n';
    fs.appendFileSync(MESSAGES_FILE, lines);
    saveMeta();
  } catch (e) {
    // 写入失败，尝试放回 buffer
    console.error('[ContextManager] 写入失败:', e.message);
    _messageBuffer.unshift(...toWrite);
  }
}

/**
 * 定期 flush（防止数据丢失）
 */
function scheduleIdleCheck() {
  if (_idleTimer) clearTimeout(_idleTimer);
  _idleTimer = setTimeout(() => {
    if (Date.now() - _lastFlush > BATCH_TIMEOUT_MS) {
      flushBuffer();
    }
    checkIdleAndSave();
  }, BATCH_TIMEOUT_MS);
}

// ============================================================
// 空闲检测 → 上下文压缩 → 长期记忆
// ============================================================

function touch() {
  _lastActiveTime = Date.now();
}

function getIdleTime() {
  return Date.now() - _lastActiveTime;
}

function isIdle() {
  return getIdleTime() > IDLE_THRESHOLD_MS;
}

function formatIdle(ms) {
  const m = Math.floor(ms / 60000);
  return m < 60 ? `${m}分钟` : `${Math.floor(m/60)}小时${m%60}分钟`;
}

/**
 * 空闲时触发：保存会话快照 + 提炼到长期记忆
 */
function checkIdleAndSave() {
  if (!isIdle()) return null;
  
  console.log(`[ContextManager] 检测到空闲: ${formatIdle(getIdleTime())}`);
  
  // 1. 强制 flush 所有缓冲
  flushBuffer();
  
  // 2. 加载最近消息并保存会话快照
  const snapshot = saveSessionSnapshot();
  
  // 3. 提炼到长期记忆（不是删除，是精华提取）
  if (snapshot) {
    distillToLongTermMemory(snapshot);
  }
  
  // 4. 开始新会话
  startNewSession();
  
  return snapshot;
}

/**
 * 手动触发保存（退出时调用）
 */
function saveAndDistill() {
  flushBuffer();
  const snapshot = saveSessionSnapshot();
  if (snapshot) {
    distillToLongTermMemory(snapshot);
  }
  startNewSession(); // 开始新会话
  return snapshot;
}

// ============================================================
// 会话快照
// ============================================================

function saveSessionSnapshot() {
  ensureDataDir();
  
  const messages = loadRecentMessages(100);
  if (messages.length === 0) return null;
  
  const snapshot = {
    id: `snap_${Date.now()}`,
    sessionId: _sessionMeta.sessionId,
    timestamp: Date.now(),
    startedAt: _sessionMeta.startedAt,
    messageCount: messages.length,
    firstMessage: messages[0]?.content?.substring(0, 100),
    lastMessage: messages[messages.length - 1]?.content?.substring(0, 100),
    // 消息按 role 分组统计
    stats: {
      user: messages.filter(m => m.role === 'user').length,
      assistant: messages.filter(m => m.role === 'assistant').length,
    },
    // 关键提取（用于快速摘要）
    keyContent: extractKeyContent(messages),
    metadata: {
      idleTriggered: isIdle(),
      savedAt: new Date().toISOString(),
    },
  };
  
  try {
    fs.appendFileSync(SESSIONS_FILE, JSON.stringify(snapshot) + '\n');
    _sessionMeta.totalSessions++;
    saveMeta();
    console.log(`[ContextManager] 会话快照保存: ${messages.length}条消息`);
    return snapshot;
  } catch (e) {
    console.error('[ContextManager] 快照保存失败:', e.message);
    return null;
  }
}

/**
 * 提炼关键内容（结构化提取，来自 session-summarizer 的进化）
 */
function extractKeyContent(messages) {
  const content = messages.map(m => m.content).join(' ');
  
  const result = {
    versions: [],
    gitOps: [],
    commands: [],
    decisions: [],
    problems: [],
    paths: [],
  };
  
  // 版本号
  const vMatch = content.match(/\bv?(\d+\.\d+\.\d+)\b/g);
  if (vMatch) result.versions = [...new Set(vMatch)].slice(0, 5);
  
  // Git 操作
  const gitPatterns = /\b(git\s+\w+|commit\s+[a-f0-9]+|push|branch|merge|pull)\b/gi;
  const gitMatch = content.match(gitPatterns);
  if (gitMatch) result.gitOps = [...new Set(gitMatch)].slice(0, 5);
  
  // 命令
  const cmdPatterns = /\b(?:npm|pip|python|node|git|curl)\s+[\w-]+/gi;
  const cmdMatch = content.match(cmdPatterns);
  if (cmdMatch) result.commands = [...new Set(cmdMatch)].slice(0, 5);
  
  // 决策
  if (/决定|选择|采用|确认|批准|启动|停止|创建|删除/.test(content)) {
    const decs = messages
      .filter(m => /决定|选择|采用|确认/.test(m.content))
      .map(m => m.content.substring(0, 80));
    result.decisions = [...new Set(decs)].slice(0, 3);
  }
  
  // 问题
  if (/问题|错误|失败|修复|解决|bug/.test(content)) {
    const probs = messages
      .filter(m => /问题|错误|失败|bug/.test(m.content))
      .map(m => m.content.substring(0, 80));
    result.problems = [...new Set(probs)].slice(0, 3);
  }
  
  // 路径
  const pathMatch = content.match(/\/[\w.-]+\/[\w.-]+\/[\w./-]+/g);
  if (pathMatch) {
    result.paths = [...new Set(pathMatch)].map(p => p.split('/').slice(-2).join('/')).slice(0, 5);
  }
  
  return result;
}

// ============================================================
// 长期记忆（提炼保存，不删除）
// ============================================================

/**
 * 将会话快照提炼保存到长期记忆
 * 核心原则：不是删除，是精华提取
 */
function distillToLongTermMemory(snapshot) {
  ensureDataDir();
  
  const memories = [];
  const kc = snapshot.keyContent;
  
  // 1. 版本记忆（存原始值，显示时统一加前缀）
  if (kc.versions?.length > 0) {
    kc.versions.forEach(v => {
      memories.push({
        type: 'version',
        content: v, // "v11.22.6" - 原始值
        timestamp: snapshot.timestamp,
        sessionId: snapshot.sessionId,
        source: 'distill',
      });
    });
  }
  
  // 2. Git 操作记忆
  if (kc.gitOps?.length > 0) {
    memories.push({
      type: 'git',
      content: kc.gitOps.join(', '), // 原始值
      timestamp: snapshot.timestamp,
      sessionId: snapshot.sessionId,
      source: 'distill',
    });
  }
  
  // 3. 命令记忆
  if (kc.commands?.length > 0) {
    memories.push({
      type: 'command',
      content: kc.commands.join(', '), // 原始值
      timestamp: snapshot.timestamp,
      sessionId: snapshot.sessionId,
      source: 'distill',
    });
  }
  
  // 4. 决策记忆（最重要）
  if (kc.decisions?.length > 0) {
    kc.decisions.forEach(d => {
      memories.push({
        type: 'decision',
        content: d,
        timestamp: snapshot.timestamp,
        sessionId: snapshot.sessionId,
        source: 'distill',
      });
    });
  }
  
  // 5. 问题记忆
  if (kc.problems?.length > 0) {
    kc.problems.forEach(p => {
      memories.push({
        type: 'problem',
        content: p,
        timestamp: snapshot.timestamp,
        sessionId: snapshot.sessionId,
        source: 'distill',
      });
    });
  }
  
  // 6. 路径记忆
  if (kc.paths?.length > 0) {
    memories.push({
      type: 'path',
      content: kc.paths.join(', '), // 原始值
      timestamp: snapshot.timestamp,
      sessionId: snapshot.sessionId,
      source: 'distill',
    });
  }
  
  // 7. 会话摘要（如果什么都没有，至少保存一句话）
  if (memories.length === 0) {
    memories.push({
      type: 'summary',
      content: snapshot.lastMessage || '对话完成',
      timestamp: snapshot.timestamp,
      sessionId: snapshot.sessionId,
      source: 'distill',
    });
  }
  
  // 写入长期记忆文件
  if (memories.length > 0) {
    try {
      const lines = memories.map(m => JSON.stringify(m)).join('\n') + '\n';
      fs.appendFileSync(LONGTERM_FILE, lines);
      console.log(`[ContextManager] 提炼到长期记忆: +${memories.length}条`);
    } catch (e) {
      console.error('[ContextManager] 长期记忆写入失败:', e.message);
    }
  }
  
  return memories;
}

// ============================================================
// 加载消息
// ============================================================

function loadRecentMessages(limit = 100) {
  if (!fs.existsSync(MESSAGES_FILE)) return [];
  
  try {
    const lines = fs.readFileSync(MESSAGES_FILE, 'utf8')
      .trim().split('\n').filter(Boolean)
      .slice(-limit);
    return lines.map(l => {
      try { return JSON.parse(l); } catch { return null; }
    }).filter(Boolean);
  } catch {
    return [];
  }
}

function loadRecentSessions(limit = 10) {
  if (!fs.existsSync(SESSIONS_FILE)) return [];
  
  try {
    const lines = fs.readFileSync(SESSIONS_FILE, 'utf8')
      .trim().split('\n').filter(Boolean)
      .slice(-limit);
    return lines.map(l => {
      try { return JSON.parse(l); } catch { return null; }
    }).filter(Boolean);
  } catch {
    return [];
  }
}

function loadLongTermMemories(limit = 50) {
  if (!fs.existsSync(LONGTERM_FILE)) return [];
  
  try {
    const lines = fs.readFileSync(LONGTERM_FILE, 'utf8')
      .trim().split('\n').filter(Boolean)
      .slice(-limit);
    return lines.map(l => {
      try { return JSON.parse(l); } catch { return null; }
    }).filter(Boolean);
  } catch {
    return [];
  }
}

// ============================================================
// 启动上下文构建
// ============================================================

/**
 * 构建启动时注入的上下文
 */
function buildStartupContext() {
  const latestSession = loadRecentSessions(1)[0];
  const longTermMemories = loadLongTermMemories(30);
  
  if (!latestSession && longTermMemories.length === 0) {
    return null;
  }
  
  const parts = [];
  const now = Date.now();
  
  parts.push('═'.repeat(44));
  parts.push('【启动上下文】');
  
  // 上次会话
  if (latestSession) {
    const idleFor = now - latestSession.timestamp;
    parts.push(`\n上次会话: ${new Date(latestSession.timestamp).toLocaleString()}`);
    parts.push(`消息数: ${latestSession.messageCount} (user:${latestSession.stats.user}/assistant:${latestSession.stats.assistant})`);
    parts.push(`间隔: ${formatIdle(idleFor)}`);
    
    // 显示关键提取
    const kc = latestSession.keyContent;
    if (kc.versions?.length) parts.push(`版本: ${kc.versions.join(', ')}`);
    if (kc.decisions?.length) parts.push(`决策: ${kc.decisions[0]}`);
  }
  
  // 长期记忆（跨会话）
  if (longTermMemories.length > 0) {
    parts.push(`\n【长期记忆】(${longTermMemories.length}条)`);
    
    // 按类型分组显示
    const byType = {};
    longTermMemories.slice(-20).forEach(m => {
      if (!byType[m.type]) byType[m.type] = [];
      byType[m.type].push(m.content);
    });
    
    const labelMap = { 
      version: '版本', 
      git: 'Git', 
      command: '命令', 
      decision: '决策', 
      problem: '问题', 
      path: '路径', 
      summary: '摘要',
      core_directive: '核心指令',
      lesson: '教训',
      workflow: '工作流',
      user_info: '用户信息'
    };
    Object.entries(byType).slice(0, 5).forEach(([type, items]) => {
      const label = labelMap[type] || type;
      const unique = [...new Set(items)].slice(0, 3);
      // content 存的是原始值（如 "v11.22.6"），显示时加标签
      unique.forEach(item => parts.push(`  ${label}: ${item.substring(0, 60)}`));
    });
  }
  
  parts.push('\n' + '═'.repeat(44));
  
  return {
    session: latestSession,
    longTermMemories,
    context: parts.join('\n'),
    injectableContext: parts.join('\n'),
    idleTime: latestSession ? now - latestSession.timestamp : null,
  };
}

// ============================================================
// 启动新会话
// ============================================================

function startNewSession() {
  _sessionMeta.sessionId = `sess_${Date.now()}`;
  _sessionMeta.startedAt = Date.now();
  saveMeta();
  console.log(`[ContextManager] 新会话: ${_sessionMeta.sessionId}`);
}

// ============================================================
// 搜索长期记忆
// ============================================================

function searchLongTermMemories(query, limit = 10) {
  const memories = loadLongTermMemories(100);
  const ql = query.toLowerCase();
  
  const scored = memories.map(m => {
    let score = 0;
    const text = (m.content || '').toLowerCase();
    if (text.includes(ql)) score += 2;
    if (m.type === 'decision' && /决定|选择|采用/.test(query)) score += 3;
    if (m.type === 'problem' && /问题|错误|修复/.test(query)) score += 2;
    return { ...m, _score: score };
  }).filter(m => m._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, limit);
  
  return scored;
}

// ============================================================
// 统计
// ============================================================

function getStats() {
  if (!_initialized) loadMeta();
  
  const messages = loadRecentMessages(10000);
  const sessions = loadRecentSessions(100);
  const longTerm = loadLongTermMemories(1000);
  
  return {
    currentSession: _sessionMeta.sessionId,
    bufferSize: _messageBuffer.length,
    totalMessages: _sessionMeta.totalMessages,
    totalSessions: _sessionMeta.totalSessions,
    lastMessageAt: _sessionMeta.lastMessageAt,
    idleTime: getIdleTime(),
    fileStats: {
      messagesFile: messages.length,
      sessionsFile: sessions.length,
      longTermFile: longTerm.length,
    },
  };
}

// ============================================================
// 模块初始化
// ============================================================

loadMeta();

// 进程退出时保存
process.on('exit', () => { flushBuffer(); });
process.on('SIGINT', () => { saveAndDistill(); process.exit(0); });

module.exports = {
  // 保存
  addMessage,
  saveUserMessage,
  saveAssistantMessage,
  saveInteraction,
  flushBuffer,
  
  // 空闲管理
  touch,
  isIdle,
  getIdleTime,
  checkIdleAndSave,
  saveAndDistill,
  
  // 加载
  loadRecentMessages,
  loadRecentSessions,
  loadLongTermMemories,
  buildStartupContext,
  
  // 搜索
  searchLongTermMemories,
  
  // 工具
  startNewSession,
  getStats,
};

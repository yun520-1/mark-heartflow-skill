// [v6.0.69] 从 heartflow.js start() 提取 recordDialogue -> 独立模块
// 负责对话历史持久化（JSONL + 文件锁）

const fs = require('../utils/safe-fs');
const path = require('path');

function writeDialogue(hf, role, content, meta = {}) {
  if (!hf.started) return { success: false, error: 'not_started' };
  if (!content || !content.trim()) return { success: false, error: 'empty_content' };
  if (!['user', 'heartflow'].includes(role)) role = 'unknown';

  if (hf.auditLogger) {
    hf.auditLogger.log('dialogue_write', { role, contentLength: content.length, chatId: meta.chatId || null });
  }

  const dir = path.join(hf.rootPath, 'memory');
  try { fs.mkdirSync(dir, { recursive: true }); } catch (e) { /* dir exists */ }

  const filePath = path.join(dir, 'dialogue-history.jsonl');
  const entry = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    role,
    content,
    ts: new Date().toISOString(),
    chatId: meta.chatId || null,
    sessionId: hf.sessionId,
    version: hf.version,
  };

  const lockPath = filePath + '.lock';
  try {
    const lockFd = fs.openSync(lockPath, 'wx');
    fs.writeSync(lockFd, String(process.pid));
    fs.appendFileSync(filePath, JSON.stringify(entry) + '\n', 'utf8');
    fs.closeSync(lockFd);
    try { fs.unlinkSync(lockPath); } catch { /* ignore */ }
    return { success: true, id: entry.id };
  } catch (e) {
    try { fs.unlinkSync(lockPath); } catch { /* ignore */ }
    if (e.code === 'EEXIST') return { success: true, id: entry.id, skipped: true };
    return { success: false, error: e.message };
  }
}

module.exports = { writeDialogue };

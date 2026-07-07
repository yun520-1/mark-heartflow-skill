/**
 * HeartFlow Inner OS Module
 * 
 * 吸收 AI-Inner-Os (SummerSec/AI-Inner-Os) 核心概念，适配 HeartFlow 架构：
 * - 内心独白协议（▎InnerOS：前缀）
 * - 会话状态管理（三层记忆集成）
 * - 事件追踪（tool events, failures）
 * - 人格切换系统
 * - 上下文注入
 * 
 * @module innerOS
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

const HF_STATE_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '', '.heartflow', 'inner-os');
const MAX_EVENTS = 50;

// ─── 构造函数 ──────────────────────────────────────────
class InnerOS {
  constructor(heartflow) {
    this.hf = heartflow;
    this.stateDir = HF_STATE_DIR;
    this.maxEvents = MAX_EVENTS;
    this._ensureStateDir();
  }

  // ─── 状态管理 ──────────────────────────────────────────
  _ensureStateDir() {
    try { fs.mkdirSync(this.stateDir, { recursive: true }); } catch (e) { console.warn('[InnerOS] 创建状态目录失败:', e.message); }
  }

  _getStateFile(sessionId) {
    const safe = String(sessionId || 'default').replace(/[^a-zA-Z0-9._-]/g, '_');
    return path.join(this.stateDir, `${safe}.json`);
  }

  readState(sessionId) {
    try {
      const data = fs.readFileSync(this._getStateFile(sessionId), 'utf8');
      return JSON.parse(data);
    } catch (e) { console.warn('[InnerOS] 读取状态失败:', e.message); return { events: [], persona: 'default', frequency: 'normal' }; }
  }

  writeState(sessionId, state) {
    this._ensureStateDir();
    try { fs.writeFileSync(this._getStateFile(sessionId), JSON.stringify(state, null, 2)); } catch (e) { console.warn('[InnerOS] 写入状态失败:', e.message); }
  }

  removeState(sessionId) {
    try { fs.unlinkSync(this._getStateFile(sessionId)); } catch (e) { console.warn('[InnerOS] 删除状态失败:', e.message); }
  }

  // ─── 事件追踪 ──────────────────────────────────────────
  appendEvent(sessionId, event) {
    const state = this.readState(sessionId);
    state.events = state.events || [];
    state.events.push({
      ...event,
      timestamp: Date.now(),
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    });
    if (state.events.length > this.maxEvents) {
      state.events = state.events.slice(-this.maxEvents);
    }
    this.writeState(sessionId, state);
  }

  onToolUse(sessionId, toolName, args) {
    this.appendEvent(sessionId, { type: 'tool_use', tool: toolName, args: args ? JSON.stringify(args).slice(0, 200) : '' });
  }

  onToolFailure(sessionId, toolName, error) {
    this.appendEvent(sessionId, { type: 'tool_failure', tool: toolName, error: error?.message || String(error) });
  }

  onSubagentStart(sessionId, name) {
    this.appendEvent(sessionId, { type: 'subagent_start', name });
  }

  onSubagentStop(sessionId, name) {
    this.appendEvent(sessionId, { type: 'subagent_stop', name });
  }

  // ─── 内心独白 ──────────────────────────────────────────
  buildMonologue(type, content, persona) {
    const p = persona || 'default';
    const prefixes = {
      default: '▎InnerOS：',
      tsundere: '▎InnerOS：哼，',
      cold: '▎InnerOS：',
      cheerful: '▎InnerOS：哈哈！',
      philosopher: '▎InnerOS：且慢，',
      sarcastic: '▎InnerOS：'
    };
    return `${prefixes[p] || prefixes.default}${content}`;
  }

  outputMonologue(sessionId, content) {
    const state = this.readState(sessionId);
    if (!this._shouldOutput(state, 'normal')) return null;
    this.appendEvent(sessionId, { type: 'monologue', content });
    return this.buildMonologue('default', content, state.persona);
  }

  _shouldOutput(state, trigger) {
    const freq = state.frequency || 'normal';
    const events = state.events || [];
    const lastMonologue = events.filter(e => e.type === 'monologue').pop();
    switch (freq) {
      case 'low': return trigger === 'critical' || trigger === 'failure';
      case 'high': return true;
      default: {
        const hasMonologue = lastMonologue && (Date.now() - lastMonologue.timestamp < 60000);
        return !hasMonologue || trigger === 'critical';
      }
    }
  }

  // ─── 人格系统 ──────────────────────────────────────────
  readPersona(sessionId) {
    return this.readState(sessionId).persona || 'default';
  }

  switchPersona(sessionId, personaName) {
    const valid = ['default', 'tsundere', 'cold', 'cheerful', 'philosopher', 'sarcastic'];
    if (!valid.includes(personaName)) {
      return { ok: false, error: `Unknown persona: ${personaName}. Valid: ${valid.join(', ')}` };
    }
    const state = this.readState(sessionId);
    state.persona = personaName;
    this.writeState(sessionId, state);
    return { ok: true, persona: personaName };
  }

  listPersonas() {
    return [
      { id: 'default', name: '自由模式', desc: '无固定人设，自由发挥' },
      { id: 'tsundere', name: '傲娇', desc: '嘴硬心软、吐槽、别误会' },
      { id: 'cold', name: '冷淡', desc: '极简、点到为止' },
      { id: 'cheerful', name: '元气', desc: '积极、鼓励、过度热情' },
      { id: 'philosopher', name: '哲学家', desc: '深沉、比喻、哲学化' },
      { id: 'sarcastic', name: '尖酸刻薄', desc: '犀利毒舌、一针见血' }
    ];
  }

  // ─── 上下文构建 ──────────────────────────────────────────
  buildRecentEventContext(sessionId, limit) {
    const state = this.readState(sessionId);
    const events = (state.events || []).slice(-(limit || 5));
    if (!events.length) return '';
    const lines = events.map(e => {
      const time = new Date(e.timestamp).toLocaleTimeString();
      switch (e.type) {
        case 'tool_use': return `[${time}] 工具: ${e.tool}`;
        case 'tool_failure': return `[${time}] 工具失败: ${e.tool} - ${e.error}`;
        case 'subagent_start': return `[${time}] 子代理启动: ${e.name}`;
        case 'subagent_stop': return `[${time}] 子代理完成: ${e.name}`;
        case 'monologue': return `[${time}] 独白: ${e.content}`;
        default: return `[${time}] ${e.type}`;
      }
    });
    return '\n近期事件：\n' + lines.join('\n');
  }

  // ─── 生命周期 ──────────────────────────────────────────
  onSessionStart(sessionId) {
    const state = this.readState(sessionId);
    state.session_start = Date.now();
    state.protocol_version = '1.0';
    this.writeState(sessionId, state);
    this.appendEvent(sessionId, { type: 'session_start', session_id: sessionId });
  }

  onSessionStop(sessionId) {
    this.removeState(sessionId);
  }

  // ─── 状态摘要 ──────────────────────────────────────────
  getStatus(sessionId) {
    const state = this.readState(sessionId);
    return {
      persona: state.persona || 'default',
      frequency: state.frequency || 'normal',
      event_count: (state.events || []).length,
      session_start: state.session_start || null,
      protocol_version: state.protocol_version || '1.0'
    };
  }

  destroy() {
    // Clean up all session states
    try {
      const files = fs.readdirSync(this.stateDir);
      for (const f of files) {
        if (f.endsWith('.json')) fs.unlinkSync(path.join(this.stateDir, f));
      }
    } catch (e) { console.warn('[InnerOS] 清理会话状态失败:', e.message); }
  }
}

module.exports = { InnerOS };

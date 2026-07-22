/**
 * AgentCard v1.0.0 — 智能体描述卡 / 数字身份
 *
 * 对标《人工智能 智能体互联》国家标准：
 * - 身份码（identity code）：为每个智能体发放统一身份标识
 * - Agent Description：结构化能力描述，支持跨平台发现
 * - Tool Calling Schema：工具调用标准化描述
 */

const crypto = require('crypto');
const path = require('path');
const fs = require('../utils/safe-fs');

class AgentCard {
  constructor(hf, options = {}) {
    this.hf = hf;
    this.rootPath = options.rootPath || (hf && hf.rootPath) || process.cwd();
    this.cardPath = options.cardPath || path.join(this.rootPath, 'data', 'agent-card.json');
    this._card = null;
  }

  /** 生成或读取 AgentCard */
  loadOrCreate() {
    if (fs.existsSync(this.cardPath)) {
      try {
        this._card = JSON.parse(fs.readFileSync(this.cardPath, 'utf-8'));
        return this._card;
      } catch (_) { /* 损坏则重建 */ }
    }
    return this._generate();
  }

  /** 基于能力清单计算确定性 identityCode */
  _computeIdentityCode(capManifest) {
    const raw = JSON.stringify({
      name: 'HeartFlow',
      version: this._getVersion(),
      caps: capManifest.map(c => c.id),
      protocols: ['mcp', 'http'],
    });
    return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
  }

  /** 计算自哈希（排除 digitalId 本身避免循环引用） */
  _computeSelfHash(payload) {
    return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 32);
  }

  /** 获取当前版本 */
  _getVersion() {
    try {
      const vPath = path.join(this.rootPath, 'VERSION');
      if (fs.existsSync(vPath)) return fs.readFileSync(vPath, 'utf-8').trim();
      const pkg = JSON.parse(fs.readFileSync(path.join(this.rootPath, 'package.json'), 'utf-8'));
      return pkg.version || '0.0.0';
    } catch (_) { return '0.0.0'; }
  }

  /** 从 capability-abstraction 构建对外能力清单 */
  _buildCapabilityManifest() {
    const available = [];
    try {
      if (this.hf && this.hf.capabilityAbstraction) {
        const list = this.hf.capabilityAbstraction.getAvailableCapabilities();
        for (const cap of list) {
          if (cap.available) {
            available.push({
              id: cap.id,
              name: cap.name,
              description: cap.description,
              platformDependent: cap.platformDependent || false,
            });
          }
        }
      }
    } catch (_) { /* 能力抽象未初始化 */ }

    // 兜底：声明核心能力（与 capability-abstraction 对齐）
    const fallbacks = [
      { id: 'logic_verification', name: '逻辑验证', description: '验证输入/输出的逻辑一致性，检测谬误' },
      { id: 'decision_routing', name: '决策路由', description: '将分析结果转化为可执行决策指令' },
      { id: 'self_healing_rl', name: '自愈RL', description: '从错误中学习，优化未来决策' },
      { id: 'memory_management', name: '记忆管理', description: '三层记忆读写查询' },
      { id: 'emotion_analysis', name: '情绪分析', description: 'PAD三维情绪分析' },
      { id: 'philosophy_evaluation', name: '哲学评估', description: 'AI自处哲学评估' },
      { id: 'cognitive_check', name: '认知检查', description: '引擎认知状态自检' },
      { id: 'dream_synthesis', name: '梦境升华', description: '记忆碎片熔炼为认知洞察' },
      { id: 'benchmark', name: '基准测试', description: '逻辑推理/数学/工具调用基准' },
    ];
    const existingIds = new Set(available.map(c => c.id));
    for (const fb of fallbacks) {
      if (!existingIds.has(fb.id)) available.push(fb);
    }
    return available;
  }

  /** 构建 MCP 工具 Schema（对外描述） */
  _buildToolSchema() {
    const categories = [
      { category: 'think', tools: ['heartflow_think', 'heartflow_think_fast'], description: '推理与分析' },
      { category: 'emotion', tools: ['heartflow_emotion'], description: 'PAD情绪分析' },
      { category: 'memory', tools: ['heartflow_memory_search'], description: '跨层记忆检索' },
      { category: 'system', tools: ['heartflow_status', 'heartflow_module_health', 'heartflow_cognitive_check'], description: '系统状态与健康' },
      { category: 'self_evolution', tools: ['heartflow_upgrade_stats', 'heartflow_self_heal'], description: '自愈与升级' },
    ];
    return {
      schemaVersion: '1.0.0',
      categories,
      totalTools: categories.reduce((s, c) => s + c.tools.length, 0),
    };
  }

  /** 生成新的 AgentCard */
  _generate() {
    const caps = this._buildCapabilityManifest();
    const identityCode = this._computeIdentityCode(caps);
    const base = {
      '@context': 'https://www.sac.gov.cn/standards/agent-interconnect/v1',
      'id': `agent:heartflow:${identityCode}`,
      'name': 'HeartFlow',
      'codename': '心虫',
      'version': this._getVersion(),
      'identityCode': identityCode,
      'issuedAt': new Date().toISOString(),
      'issuer': 'HeartFlow Self',
      'capabilities': caps,
      'toolSchema': this._buildToolSchema(),
      'protocols': ['mcp', 'http', 'stdio'],
      'trustLevel': 'verified',
      'transparency': true,
    };
    const hash = this._computeSelfHash(base);
    this._card = { ...base, digitalId: { algorithm: 'sha256', hash } };
    this._persist();
    return this._card;
  }

  /** 持久化 */
  _persist() {
    if (!this._card) return;
    try {
      fs.mkdirSync(path.dirname(this.cardPath), { recursive: true });
      fs.writeFileSync(this.cardPath, JSON.stringify(this._card, null, 2), 'utf-8');
    } catch (_) { /* ignore */ }
  }

  /** 对外接口：获取 AgentCard */
  getCard() {
    if (!this._card) this.loadOrCreate();
    return this._card;
  }

  /** 验证卡片完整性 */
  verify() {
    const card = this.getCard();
    const { digitalId, ...payload } = card;
    const currentHash = this._computeSelfHash(payload);
    return {
      valid: currentHash === card.digitalId?.hash,
      identityCode: card.identityCode,
      version: card.version,
      capabilities: card.capabilities?.length || 0,
    };
  }
}

module.exports = { AgentCard };

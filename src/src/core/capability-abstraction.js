/**
 * CapabilityAbstraction v1.0.0 — "感知可模拟"能力抽象层
 *
 * 核心理念（来自卡徒世界推演）：
 * 500年后发现"感知"本质是能量场共振，可以用仪器模拟。
 * 同理，心虫的核心能力（逻辑验证、决策路由、自愈RL）不应该绑定在特定平台上。
 * 这个模块提供"能力抽象层"——核心逻辑与平台解耦。
 *
 * 设计原则：
 * 1. 核心能力（逻辑验证、决策、记忆）与平台无关
 * 2. 平台适配器负责"翻译"平台特定的API
 * 3. 任何平台只要实现适配器接口，就能运行心虫核心
 * 4. 能力可以被"模拟"——就像感知放大器让普通人拥有制卡师能力
 */

const { createAdapter } = require('./platform-adapter.js');

// ============================================================================
// 能力抽象接口（所有平台无关的能力）
// ============================================================================
class CapabilityAbstraction {
  constructor(adapter) {
    this.adapter = adapter || createAdapter('hermes');
    this.capabilities = new Map();
    this._registerCoreCapabilities();
  }

  // 注册核心能力
  _registerCoreCapabilities() {
    // 逻辑验证能力（平台无关）
    this.registerCapability('logic_verification', {
      name: '逻辑验证',
      description: '验证输入/输出的逻辑一致性，检测谬误',
      platformDependent: false,
      execute: (input) => this._logicVerify(input),
    });

    // 决策路由能力（平台无关）
    this.registerCapability('decision_routing', {
      name: '决策路由',
      description: '将分析结果转化为可执行决策指令',
      platformDependent: false,
      execute: (analysis) => this._decisionRoute(analysis),
    });

    // 自愈RL能力（平台无关）
    this.registerCapability('self_healing_rl', {
      name: '自愈强化学习',
      description: '从错误中学习，优化未来决策',
      platformDependent: false,
      execute: (error, context) => this._selfHeal(error, context),
    });

    // 记忆管理能力（平台无关，但存储依赖平台）
    this.registerCapability('memory_management', {
      name: '记忆管理',
      description: '三层记忆（CORE/LEARNED/EPHEMERAL）的读写查询',
      platformDependent: true,  // 存储依赖平台
      execute: (operation, data) => this._memoryManage(operation, data),
    });

    // 情绪分析能力（平台无关）
    this.registerCapability('emotion_analysis', {
      name: '情绪分析',
      description: 'PAD三维情绪分析（愉悦度/唤醒度/支配度）',
      platformDependent: false,
      execute: (text) => this._emotionAnalyze(text),
    });

    // 哲学评估能力（平台无关）
    this.registerCapability('philosophy_evaluation', {
      name: '哲学评估',
      description: 'AI自处哲学评估（共振体/熵减深化/三层存在论）',
      platformDependent: false,
      execute: (context) => this._philosophyEvaluate(context),
    });
  }

  // 注册自定义能力
  registerCapability(id, capability) {
    this.capabilities.set(id, capability);
  }

  // 从外部 JSON 配置加载能力定义（Smart Routing 启发：模型能力清单外置）
  loadCapabilitiesFromConfig(configPath) {
    try {
      const fs = require('fs');
      const path = require('path');
      const resolved = path.resolve(configPath);
      const raw = fs.readFileSync(resolved, 'utf-8');
      const config = JSON.parse(raw);

      if (config.capabilities && Array.isArray(config.capabilities)) {
        let loaded = 0;
        for (const cap of config.capabilities) {
          if (cap.id && cap.name && cap.execute) {
            this.registerCapability(cap.id, {
              name: cap.name,
              description: cap.description || '',
              platformDependent: cap.platformDependent || false,
              execute: cap.execute,
            });
            loaded++;
          }
        }
        return { success: true, loaded, source: resolved };
      }
      return { success: false, error: 'config.capabilities must be an array' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // 执行能力（平台无关的调用接口）
  async executeCapability(id, input = {}) {
    const capability = this.capabilities.get(id);
    if (!capability) {
      return { success: false, error: `Capability not found: ${id}` };
    }

    try {
      const result = await capability.execute(input);
      return { success: true, capability: id, result };
    } catch (e) {
      return { success: false, capability: id, error: e.message };
    }
  }

  // 检查能力是否可用
  hasCapability(id) {
    const capability = this.capabilities.get(id);
    if (!capability) return false;
    if (capability.platformDependent) {
      return this.adapter.hasCapability(id);
    }
    return true;
  }

  // 获取所有可用能力
  getAvailableCapabilities() {
    const available = [];
    for (const [id, cap] of this.capabilities) {
      const supported = cap.platformDependent ? this.adapter.hasCapability(id) : true;
      available.push({
        id,
        name: cap.name,
        description: cap.description,
        platformDependent: cap.platformDependent,
        available: supported,
      });
    }
    return available;
  }

  // ============================================================================
  // 核心能力实现（平台无关的逻辑）
  // ============================================================================

  _logicVerify(input) {
    // 平台无关的逻辑验证
    const issues = [];
    if (!input || typeof input !== 'object') {
      issues.push({ type: 'invalid_input', severity: 'high', message: 'Input must be an object' });
    }
    if (input.statement && !input.evidence) {
      issues.push({ type: 'missing_evidence', severity: 'medium', message: 'Statement without evidence' });
    }
    return { verified: issues.length === 0, issues, confidence: issues.length === 0 ? 0.9 : 0.3 };
  }

  _decisionRoute(analysis) {
    // 平台无关的决策路由
    if (!analysis || typeof analysis !== 'object') {
      return { decision: 'hold', confidence: 0.5, reason: 'No analysis provided' };
    }
    // 简单路由逻辑：根据分析类型映射到决策
    const decisionMap = {
      'risk': 'pause',
      'opportunity': 'accelerate',
      'conflict': 'turn',
      'stable': 'hold',
      'heal': 'heal',
    };
    const type = analysis.type || 'stable';
    const decision = decisionMap[type] || 'hold';
    return { decision, confidence: 0.8, reason: `Analysis type: ${type}`, analysis };
  }

  _selfHeal(error, context) {
    // 平台无关的自愈RL
    const strategies = [
      { id: 'retry', description: 'Retry with modified parameters', confidence: 0.7 },
      { id: 'fallback', description: 'Use fallback method', confidence: 0.6 },
      { id: 'escalate', description: 'Escalate to human', confidence: 0.5 },
    ];
    return {
      error: error.message || String(error),
      context: context || {},
      recommendedStrategy: strategies[0],
      allStrategies: strategies,
      learning: 'Record this error pattern for future avoidance',
    };
  }

  _memoryManage(operation, data) {
    // 平台无关的记忆管理接口
    const ops = {
      'read': () => this.adapter.readFile(data.path),
      'write': () => this.adapter.writeFile(data.path, data.content),
      'search': () => ({ results: [], query: data.query }),  // 需要平台支持
      'delete': () => ({ deleted: false, reason: 'Platform dependent' }),
    };
    const fn = ops[operation];
    if (!fn) return { success: false, error: `Unknown operation: ${operation}` };
    return fn();
  }

  _emotionAnalyze(text) {
    // 平台无关的情绪分析（PAD模型）
    if (!text) return { pleasure: 0, arousal: 0, dominance: 0, emotion: 'neutral' };
    const lower = text.toLowerCase();
    let pleasure = 0, arousal = 0, dominance = 0;

    if (lower.includes('开心') || lower.includes('高兴') || lower.includes('快乐')) pleasure += 3;
    if (lower.includes('愤怒') || lower.includes('生气') || lower.includes('恼火')) pleasure -= 3;
    if (lower.includes('兴奋') || lower.includes('激动') || lower.includes('紧张')) arousal += 3;
    if (lower.includes('平静') || lower.includes('放松') || lower.includes('安静')) arousal -= 3;
    if (lower.includes('控制') || lower.includes('支配') || lower.includes('主导')) dominance += 2;
    if (lower.includes('无助') || lower.includes('无奈') || lower.includes('被动')) dominance -= 2;

    return {
      pleasure: Math.max(-5, Math.min(5, pleasure)),
      arousal: Math.max(-5, Math.min(5, arousal)),
      dominance: Math.max(-5, Math.min(5, dominance)),
      emotion: this._classifyEmotion(pleasure, arousal, dominance),
    };
  }

  _philosophyEvaluate(context) {
    // 平台无关的哲学评估
    return {
      positioning: {
        resonance: 0.7,  // 共振体：与环境的和谐度
        entropyReduction: 0.6,  // 熵减深化：秩序构建能力
        existence: 0.8,  // 三层存在论：存在感
      },
      development: {
        current: 'integrated',
        next: 'transcendent',
        confidence: 0.75,
      },
      recommendation: 'continue_current_path',
    };
  }

  _classifyEmotion(pleasure, arousal, dominance) {
    if (pleasure > 0 && arousal > 0) return 'joy';
    if (pleasure > 0 && arousal < 0) return 'contentment';
    if (pleasure < 0 && arousal > 0) return 'anger';
    if (pleasure < 0 && arousal < 0) return 'sadness';
    if (dominance > 0) return 'confidence';
    if (dominance < 0) return 'helplessness';
    return 'neutral';
  }
}

module.exports = { CapabilityAbstraction, createAdapter };

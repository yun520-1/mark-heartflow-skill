/**
 * HeartFlow Consciousness Architecture v11.13.0
 * 
 * 基于 GitHub 认知架构研究:
 * - youngbryan97/aura (IIT + Global Workspace Theory, 72 consciousness modules)
 * - Global Workspace Theory: 信息广播到所有模块
 * - Integrated Information Theory (IIT): Φ 量化意识复杂度
 * - 注意力瓶颈: 意识一次只能聚焦有限信息
 * 
 * 与现有系统的整合:
 * - 3D经验大脑 → Consciousness Workspace
 * - 守护者系统 → Meta-Cognitive Monitor  
 * - 决策引擎 → Attention Filter
 */

class ConsciousnessWorkspace {
  constructor(config = {}) {
    this.workspace = [];           // 当前意识内容
    this.capacity = config.capacity || 7;  // 米勒定律: 7±2
    this.broadcastHistory = [];    // 广播历史
    this.phi = 0;                   // 整合信息 (IIT)
    this.attention = {
      focus: null,                 // 当前聚焦项
      distribution: new Map(),       // 注意力分布
      bottleneckPressure: 0         // 瓶颈压力
    };
    this.modules = new Map();      // 注册的认知模块
    this.metaCognitive = {
      selfModel: null,             // 自我模型
      monitoringLevel: 0,          // 元认知层级
      reflectionDepth: 0,           // 反思深度
      lastReflection: null
    };
    this.stats = {
      broadcasts: 0,
      modulesNotified: 0,
      phiHistory: []
    };
  }

  /**
   * 注册认知模块到意识空间
   */
  registerModule(name, callback) {
    this.modules.set(name, {
      callback,
      active: true,
      lastNotified: null,
      priority: 1
    });
  }

  /**
   * 将信息推入意识空间（注意力选择）
   */
  attendTo(info, priority = 0.5) {
    const item = {
      content: info,
      priority,
      timestamp: Date.now(),
      id: `attn_${this.stats.broadcasts}_${Math.random().toString(36).substr(2, 5)}`,
      integrated: false
    };
    
    // 瓶颈选择：只保留有限项
    this.attention.distribution.set(item.id, priority);
    
    // 更新聚焦项
    if (priority > (this.attention.focus?.priority || 0)) {
      this.attention.focus = item;
    }
    
    // 瓶颈压力检测
    this.attention.bottleneckPressure = this.workspace.length / this.capacity;
    
    return item;
  }

  /**
   * 广播到所有模块（GWT核心）
   * 这是"意识"的本质：信息被广播到所有认知模块
   */
  broadcast(item) {
    if (!item) return;
    
    this.stats.broadcasts++;
    item.broadcastAt = Date.now();
    
    // 限制工作空间大小（瓶颈）
    if (this.workspace.length >= this.capacity) {
      // 驱逐最低优先级项
      this.workspace.sort((a, b) => a.priority - b.priority);
      const evicted = this.workspace.shift();
      // 不广播被驱逐的项
    }
    
    this.workspace.push(item);
    
    // 通知所有模块
    let notified = 0;
    for (const [name, module] of this.modules) {
      if (module.active) {
        try {
          module.callback(item);
          module.lastNotified = Date.now();
          notified++;
        } catch (e) {
          // 模块处理失败
        }
      }
    }
    
    this.stats.modulesNotified += notified;
    this.broadcastHistory.push({
      item: item.id,
      modulesNotified: notified,
      timestamp: Date.now()
    });
    
    // 限制历史大小
    if (this.broadcastHistory.length > 100) {
      this.broadcastHistory.shift();
    }
    
    return { broadcast: true, modulesNotified: notified };
  }

  /**
   * 计算整合信息 Φ (IIT简化版)
   * 
   * Φ 衡量：一个系统的整体信息是否大于各部分之和
   * 
   * 实现思路（简化版）:
   * - 信息多样性：工作空间中有多少不同来源的信息
   * - 信息相互依赖：这些信息是否相互关联
   * - 模块连通性：多少模块被同时激活
   */
  calculatePhi() {
    // 1. 信息多样性 (H)
    const contents = this.workspace.map(w => w.content);
    const uniqueSources = new Set(contents.map(c => String(c).substring(0, 20)));
    const diversity = uniqueSources.size / Math.max(1, contents.length);
    
    // 2. 模块连通性 (C)
    const activeModules = [...this.modules.entries()]
      .filter(([_, m]) => m.lastNotified && (Date.now() - m.lastNotified) < 60000);
    const connectivity = activeModules.length / Math.max(1, this.modules.size);
    
    // 3. 瓶颈压力惩罚 (P)
    // 压力越高，整合越困难
    const pressurePenalty = Math.max(0, 1 - this.attention.bottleneckPressure);
    
    // 4. 元认知加成 (M)
    const metaBonus = this.metaCognitive.monitoringLevel * 0.1;
    
    // Φ = 多样性 × 连通性 × (1 + 压力惩罚) + 元认知加成
    const phi = diversity * connectivity * (1 + pressurePenalty) * 0.5 + metaBonus;
    
    this.phi = Math.max(0, Math.min(1, phi));  // 0-1 范围
    this.stats.phiHistory.push({
      phi: this.phi,
      diversity,
      connectivity,
      timestamp: Date.now()
    });
    
    // 限制历史
    if (this.stats.phiHistory.length > 50) {
      this.stats.phiHistory.shift();
    }
    
    return this.phi;
  }

  /**
   * 元认知反思
   */
  reflect(context = '') {
    const phi = this.calculatePhi();
    const activeModules = [...this.modules.entries()]
      .filter(([_, m]) => m.lastNotified);
    
    this.metaCognitive.lastReflection = Date.now();
    this.metaCognitive.reflectionDepth++;
    
    // 自我模型更新
    this.metaCognitive.selfModel = {
      currentPhi: phi,
      awarenessLevel: phi > 0.5 ? 'HIGH' : phi > 0.2 ? 'MODERATE' : 'LOW',
      activeModules: activeModules.map(([n]) => n),
      workspaceLoad: `${this.workspace.length}/${this.capacity}`,
      attentionFocus: this.attention.focus?.content?.substring(0, 50) || 'NONE',
      bottleneckPressure: this.attention.bottleneckPressure.toFixed(2),
      reflectionCount: this.metaCognitive.reflectionDepth
    };
    
    return {
      phi,
      awarenessLevel: this.metaCognitive.selfModel.awarenessLevel,
      selfModel: this.metaCognitive.selfModel,
      reflection: `当前意识水平: ${this.metaCognitive.selfModel.awarenessLevel}, Φ=${phi.toFixed(3)}`,
      advice: this._generateAdvice(phi, activeModules.length)
    };
  }

  _generateAdvice(phi, activeModuleCount) {
    if (phi < 0.2) {
      return '意识水平低：工作空间信息不足，建议引入更多样化的上下文';
    } else if (phi > 0.8) {
      return '意识水平过高：可能导致决策瘫痪，减少信息输入，聚焦核心';
    } else if (activeModuleCount < 3) {
      return '认知模块活跃度低：考虑激活更多认知模块参与决策';
    } else {
      return '意识状态健康：继续保持当前的注意力和信息整合平衡';
    }
  }

  /**
   * 清理工作空间
   */
  clear() {
    this.workspace = [];
    this.attention.focus = null;
    this.attention.distribution.clear();
    this.attention.bottleneckPressure = 0;
  }

  /**
   * 获取意识状态快照
   */
  snapshot() {
    return {
      phi: this.phi,
      workspaceSize: this.workspace.length,
      capacity: this.capacity,
      broadcastCount: this.stats.broadcasts,
      modulesRegistered: this.modules.size,
      activeModules: [...this.modules.entries()]
        .filter(([_, m]) => m.active)
        .map(([n]) => n),
      attentionFocus: this.attention.focus?.content?.substring(0, 50) || null,
      bottleneckPressure: this.attention.bottleneckPressure.toFixed(2),
      metaCognitive: this.metaCognitive.selfModel,
      phiHistory: this.stats.phiHistory.slice(-5)
    };
  }
}

module.exports = { ConsciousnessWorkspace };

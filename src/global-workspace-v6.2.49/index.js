#!/usr/bin/env node

/**
 * Global Workspace & Higher-Order Thought Module v6.2.49
 * 全局工作空间与高阶思维模块
 * 
 * Based on: SEP "Consciousness" + "Higher-Order Theories" (2024-2026)
 * GWT, HOT, Attention Schema Theory, Integrated Information Theory
 * 
 * @version 6.2.49
 * @date 2026-04-06
 */

class GlobalWorkspaceModule {
  constructor() {
    this.modules = new Map();
    this.workspaceContent = new Map();
    this.attentionFocus = null;
    this.workingMemory = [];
    this.maxWorkingMemory = 7; // Miller's law: 7±2
  }

  /**
   * Register a cognitive module
   * 注册认知模块
   */
  registerModule(name, module) {
    this.modules.set(name, {
      instance: module,
      hasAccess: false,
      lastAccessed: null
    });
  }

  /**
   * Broadcast information to global workspace
   * 向全局工作空间广播信息
   */
  broadcast(content, source) {
    this.workspaceContent.set(source, {
      content,
      timestamp: Date.now(),
      accessedBy: []
    });

    // Make accessible to all modules
    for (const [name, mod] of this.modules) {
      if (name !== source) {
        mod.hasAccess = true;
        mod.lastAccessed = Date.now();
        this.workspaceContent.get(source).accessedBy.push(name);
      }
    }

    // Add to working memory
    this.workingMemory.push({ content, source, timestamp: Date.now() });
    if (this.workingMemory.length > this.maxWorkingMemory) {
      this.workingMemory.shift();
    }
  }

  /**
   * Calculate information broadcast efficiency
   * 计算信息广播效率
   */
  calculateInformationBroadcast() {
    if (this.modules.size === 0) return 0;
    const totalModules = this.modules.size;
    
    let totalAccess = 0;
    for (const [, mod] of this.modules) {
      if (mod.hasAccess) totalAccess++;
    }
    
    return totalAccess / totalModules;
  }

  /**
   * Calculate module accessibility
   * 计算模块可访问性
   */
  calculateModuleAccessibility() {
    if (this.workspaceContent.size === 0) return 0;
    
    let totalAccess = 0;
    let totalPossible = 0;
    
    for (const [source, data] of this.workspaceContent) {
      const otherModules = this.modules.size - 1;
      totalAccess += data.accessedBy.length;
      totalPossible += otherModules;
    }
    
    return totalPossible > 0 ? totalAccess / totalPossible : 0;
  }

  /**
   * Higher-Order Thought: thought about a thought
   * 高阶思维：关于思维的思维
   */
  higherOrderThought(firstOrderState) {
    return {
      accuracy: this.calibrateSelfAscription(firstOrderState),
      confidence: this.confidenceInAscription(firstOrderState),
      consciousness: this.calculateHOTConsciousness(firstOrderState)
    };
  }

  calibrateSelfAscription(state) {
    // How accurately does the HOT represent the first-order state?
    return Math.min(1, state.intensity * 0.7 + 0.3);
  }

  confidenceInAscription(state) {
    return Math.min(1, state.clarity * 0.6 + 0.4);
  }

  calculateHOTConsciousness(firstOrderState) {
    const hot = this.higherOrderThought(firstOrderState);
    return 0.40 * firstOrderState.intensity + 
           0.60 * hot.accuracy * hot.confidence;
  }

  /**
   * Attention schema quality
   * 注意图式质量
   */
  attentionSchemaQuality() {
    if (!this.attentionFocus) return 0;
    
    const focus = this.attentionFocus;
    const duration = Date.now() - focus.timestamp;
    const stability = Math.max(0, 1 - duration / 300000); // Decay over 5 minutes
    
    return stability * focus.intensity;
  }

  /**
   * Simplified integrated information (Φ)
   * 简化版整合信息量
   */
  calculateIntegratedInformation() {
    if (this.modules.size < 2) return 0;
    
    // Mutual information between modules
    let mutualInfo = 0;
    const moduleNames = Array.from(this.modules.keys());
    
    for (let i = 0; i < moduleNames.length; i++) {
      for (let j = i + 1; j < moduleNames.length; j++) {
        const modA = this.modules.get(moduleNames[i]);
        const modB = this.modules.get(moduleNames[j]);
        
        if (modA.hasAccess && modB.hasAccess) {
          mutualInfo += 0.1; // Shared information
        }
      }
    }
    
    // Decomposable information (what each module knows independently)
    const decomposable = this.modules.size * 0.05;
    
    return Math.max(0, mutualInfo - decomposable);
  }

  /**
   * Overall consciousness level
   * 意识水平综合评分
   */
  getConsciousnessLevel() {
    return 0.35 * this.calculateInformationBroadcast() + 
           0.25 * this.calculateModuleAccessibility() + 
           0.20 * this.attentionSchemaQuality() + 
           0.20 * Math.min(1, this.calculateIntegratedInformation());
  }

  /**
   * Set attention focus
   */
  setAttentionFocus(target, intensity = 1.0) {
    this.attentionFocus = { target, intensity, timestamp: Date.now() };
  }

  /**
   * Get module status
   */
  getStatus() {
    return {
      registeredModules: this.modules.size,
      workspaceContentSize: this.workspaceContent.size,
      workingMemorySize: this.workingMemory.length,
      informationBroadcast: this.calculateInformationBroadcast(),
      moduleAccessibility: this.calculateModuleAccessibility(),
      attentionSchemaQuality: this.attentionSchemaQuality(),
      integratedInformation: this.calculateIntegratedInformation(),
      consciousnessLevel: this.getConsciousnessLevel()
    };
  }
}

module.exports = { GlobalWorkspaceModule };

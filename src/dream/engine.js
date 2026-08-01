/**
 * dream/engine.js — Dream 升华引擎统一入口
 *
 * v6.3.48 曾将 src/dream/ 误判为"死模块"删除，但 MCP heartflow_dream 工具
 * 仍引用本文件。2026-08-01 从 git 历史恢复 7 个梦境引擎文件后重建本入口。
 *
 * 职责：把 theme → DreamV11 升华管线 → 结构化梦境结果。
 * 不做生成，只做记忆碎片的模式提炼（炼金）。
 */
const path = require('path');

class DreamEngine {
  /**
   * @param {object|null} memory 记忆系统实例（可选）
   * @param {object|null} opts   附加选项
   */
  constructor(memory = null, opts = null) {
    this.memory = memory;
    this.opts = opts || {};
    this._dream = null;
  }

  /** 启动时懒加载 DreamV11，避免构造期依赖 */
  boot() {
    try {
      const DreamModule = require('./dream.js');
      this._dream = new DreamModule.DreamV11({});
    } catch (e) {
      // 防御性：引擎缺失时降级为结构化空结果，不抛错
      this._dream = null;
    }
  }

  /**
   * 升华入口：theme → 梦境模式提炼
   * @param {string} theme 梦境主题
   */
  async dream(theme = '') {
    if (!this._dream) this.boot();
    if (!this._dream) {
      return {
        narrative: '',
        patterns: [],
        essence: '',
        structure: {},
        upgrade: [],
        sublimationQuality: 0,
        dreamComplete: false,
        degraded: true,
      };
    }

    const t = theme || 'default dream';
    try {
      const raw = await this._dream.dream({ intensity: 0.85, seed: t, function: 'synthesis' });
      const dreamBody = raw && raw.dream ? raw.dream : raw;
      return {
        narrative: (dreamBody && (dreamBody.raw || dreamBody.narrative)) || '',
        patterns: (raw && raw.patterns) || [],
        essence: (raw && raw.essence) || '',
        structure: (raw && raw.structure) || {},
        upgrade: (raw && raw.upgrade) || [],
        sublimationQuality: (raw && raw.sublimationQuality) || 0,
        dreamComplete: true,
        theme: t,
        fragments: (dreamBody && dreamBody.fragments) || [],
        functionType: (dreamBody && dreamBody.functionType) || 'synthesis',
      };
    } catch (e) {
      return {
        narrative: '',
        patterns: [],
        essence: '',
        structure: {},
        upgrade: [],
        sublimationQuality: 0,
        dreamComplete: false,
        degraded: true,
        error: e.message,
      };
    }
  }

  healthCheck() {
    return { ok: true, engine: 'DreamV11', booted: !!this._dream };
  }
}

module.exports = { DreamEngine };

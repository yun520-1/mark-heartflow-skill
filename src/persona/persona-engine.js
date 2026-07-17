/**
 * PersonaEngine — 人格载入 / 切换 / 热更新
 *
 * 设计约束：
 * - 不新增硬依赖
 * - 热更新不影响护栏与已有记忆
 * - 直接复用 identity / emotion / shield 现有模块
 */

const path = require('path');
const { validateProfile, sanitize, DEFAULT_PROFILE } = require('./persona-profile');
const { getPreset, PRESETS, getBuiltinIds, buildProfileFromPreset } = require('./persona-presets');
const { emitPersonaMeta } = require('./persona-meta');

class PersonaEngine {
  constructor(options = {}) {
    this.name = 'persona';
    this.version = '1.0.0';
    this._current = sanitize({ ...DEFAULT_PROFILE });
    this._history = [];
    this._hotReloadPath = options.hotReloadPath || path.join(options.rootPath || process.cwd(), 'presets');
    this._loadedCustom = new Map();
    this._maxHistory = 50;
  }

  load(presetOrProfile) {
    let profile;
    if (typeof presetOrProfile === 'string') {
      profile = buildProfileFromPreset(presetOrProfile);
    } else if (presetOrProfile && typeof presetOrProfile === 'object' && !Array.isArray(presetOrProfile)) {
      const keys = Object.keys(presetOrProfile);
      const presetLike = keys.length === 1 && keys[0] === 'preset';
      if (presetLike) {
        profile = buildProfileFromPreset(presetOrProfile.preset);
      } else if (presetOrProfile.id && presetOrProfile.name && presetOrProfile.tone && presetOrProfile.values && presetOrProfile.styleHints && presetOrProfile.safety) {
        const validation = validateProfile(presetOrProfile);
        if (!validation.valid) {
          throw new Error(`Invalid persona profile: ${validation.errors.join('; ')}`);
        }
        profile = sanitize(presetOrProfile);
      } else {
        throw new Error('persona.load requires preset id string or full profile object');
      }
    } else {
      throw new Error('persona.load requires preset id or profile object');
    }

    const previous = this._current;
    this._current = profile;
    this._boundedPush(this._history, {
      id: profile.id,
      preset: profile.preset,
      timestamp: new Date().toISOString(),
      previousId: previous.id
    });
    this._applyToRuntime(profile);
    return { loaded: true, profile, previousId: previous.id };
  }

  switch(presetId, overrides = {}) {
    if (typeof presetId !== 'string' || !presetId) {
      throw new Error('persona.switch requires preset id');
    }
    const profile = buildProfileFromPreset(presetId, overrides);
    return this.load(profile);
  }

  getCurrent() {
    return { ...this._current };
  }

  getHistory() {
    return this._history.slice(-this._maxHistory);
  }

  async hotReload() {
    const loaded = [];
    if (!this._loadedCustom) this._loadedCustom = new Map();
    const dir = this._hotReloadPath;
    try {
      const entries = await require('fs').promises.readdir(dir);
      for (const file of entries) {
        if (!file.endsWith('.json')) continue;
        const filePath = path.join(dir, file);
        try {
          const raw = await require('fs').promises.readFile(filePath, 'utf8');
          const parsed = JSON.parse(raw);
          const validation = validateProfile(parsed);
          if (!validation.valid) {
            console.warn(`[persona] skip invalid preset ${file}: ${validation.errors.join('; ')}`);
            continue;
          }
          const profile = sanitize(parsed);
          this._loadedCustom.set(profile.id || file, profile);
          loaded.push(profile.id || file);
        } catch (e) {
          console.warn(`[persona] hot reload failed for ${file}: ${e.message}`);
        }
      }
    } catch (e) {
      // hot reload is optional
    }
    return { loaded, count: loaded.length };
  }

  listPresets() {
    return {
      builtin: getBuiltinIds(),
      custom: Array.from(this._loadedCustom ? this._loadedCustom.keys() : [])
    };
  }

  describe() {
    return {
      name: this.name,
      version: this.version,
      current: this.getCurrent(),
      historySize: this._history.length,
      presets: this.listPresets(),
      hotReloadPath: this._hotReloadPath
    };
  }

  stop() {}
  destroy() {}

  _boundedPush(arr, item) {
    if (arr.length >= this._maxHistory) arr.shift();
    arr.push(item);
  }

  _applyToRuntime(profile) {
    // Reuse BigFivePersonality when available
    try {
      const bigFive = require('../identity/BigFivePersonality.js');
      const overrides = profile.bigFiveOverrides || {};
      for (const [dim, score] of Object.entries(overrides)) {
        if (score && typeof bigFive.updateScore === 'function') {
          bigFive.updateScore(dim, score);
        }
      }
    } catch (e) {
      // optional dependency
    }

    // Notify meta; meta is emitted separately and not injected into body by default
    try {
      emitPersonaMeta({ event: 'switch', profile });
    } catch (e) {
      // non-fatal
    }
  }
}

module.exports = { PersonaEngine };

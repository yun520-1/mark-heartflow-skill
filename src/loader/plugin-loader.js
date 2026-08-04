/**
 * PluginLoader - plugin loading infrastructure for long-term upgradability (v6.3.0)
 *
 * New capabilities = new dir under src/plugins/, zero changes to heartflow.js
 *
 * Usage:
 *   const { PluginLoader } = require('./plugin-loader.js');
 *   const loader = new PluginLoader(hf);
 *   loader.loadAll();
 */

const fs = require('fs');
const path = require('path');

const PLUGINS_DIR = path.join(__dirname, '..', 'plugins');
const REGISTRY_PATH = path.join(__dirname, '..', '..', 'plugins', 'registry.json');

class PluginLoader {
  constructor(hf) {
    this.hf = hf;
    this._loaded = [];
    this._failed = [];
    this._registry = this._loadRegistry();
  }

  _loadRegistry() {
    try {
      if (fs.existsSync(REGISTRY_PATH)) {
        return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
      }
    } catch (_) { /* ignore corrupt registry */ }
    return { plugins: {}, defaults: { enabled: true } };
  }

  _isEnabled(name) {
    const entry = this._registry.plugins ? this._registry.plugins[name] : undefined;
    if (entry === undefined) return this._registry.defaults ? this._registry.defaults.enabled !== false : true;
    return entry.enabled !== false;
  }

  _scanPlugins() {
    if (!fs.existsSync(PLUGINS_DIR)) return [];
    return fs.readdirSync(PLUGINS_DIR).filter(dir => {
      const p = path.join(PLUGINS_DIR, dir);
      return fs.statSync(p).isDirectory() && fs.existsSync(path.join(p, 'index.js'));
    });
  }

  loadAll() {
    const names = this._scanPlugins();

    for (const name of names) {
      if (!this._isEnabled(name)) {
        this._loaded.push({ name, status: 'disabled' });
        continue;
      }

      try {
        const plugin = require(path.join(PLUGINS_DIR, name, 'index.js'));
        if (!plugin || typeof plugin !== 'object') throw new Error('plugin must export an object');
        if (typeof plugin.init !== 'function') throw new Error('plugin missing init(hf, ctx) function');

        const result = plugin.init(this.hf, {
          hookBus: this.hf._hookBus || null,
          config: this._registry.plugins && this._registry.plugins[name] ? this._registry.plugins[name].config || {} : {},
        });

        this._loaded.push({ name, status: 'loaded', hooks: Array.isArray(plugin.hooks) ? plugin.hooks.length : 0 });
      } catch (e) {
        this._failed.push({ name, error: e.message });
      }
    }

    return {
      loaded: this._loaded,
      failed: this._failed,
      total: this._loaded.length + this._failed.length,
    };
  }

  getStats() {
    return {
      loaded: this._loaded.filter(p => p.status === 'loaded').length,
      disabled: this._loaded.filter(p => p.status === 'disabled').length,
      failed: this._failed.length,
      plugins: this._loaded.map(p => ({ name: p.name, status: p.status, hooks: p.hooks })),
      errors: this._failed,
    };
  }
}

module.exports = { PluginLoader };

/**
 * ToolRegistry - Tool registration and management
 * Source: ~/.heartflow/src/runtime/tool-registry.ts
 */

'use strict';

class ToolRegistry {
  constructor() {
    this._tools = new Map();
  }

  register(tool) {
    if (this._tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" is already registered`);
    }
    this._tools.set(tool.name, { definition: tool, enabled: true });
  }

  unregister(name) {
    return this._tools.delete(name);
  }

  get(name) {
    return this._tools.get(name)?.definition;
  }

  getAll() {
    return Array.from(this._tools.values())
      .filter(t => t.enabled)
      .map(t => t.definition);
  }

  enable(name) {
    const tool = this._tools.get(name);
    if (tool) { tool.enabled = true; return true; }
    return false;
  }

  disable(name) {
    const tool = this._tools.get(name);
    if (tool) { tool.enabled = false; return true; }
    return false;
  }

  isEnabled(name) {
    return this._tools.get(name)?.enabled ?? false;
  }

  has(name) {
    return this._tools.has(name);
  }

  async execute(name, ...args) {
    const tool = this._tools.get(name);
    if (!tool) throw new Error(`Tool "${name}" not found`);
    if (!tool.enabled) throw new Error(`Tool "${name}" is disabled`);
    return tool.definition.handler(...args);
  }

  listNames() {
    return Array.from(this._tools.keys());
  }

  clear() {
    this._tools.clear();
  }
}

const globalToolRegistry = new ToolRegistry();

module.exports = { ToolRegistry, globalToolRegistry };

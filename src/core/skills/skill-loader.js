/**
 * Skill Loader — 按需加载技能内容，声明式调用
 * @version v0.12.50
 */
'use strict';

const fs = require('fs');
const path = require('path');

class SkillLoader {
  constructor(registry) {
    this.registry = registry;
    this.loaded = new Map();
  }

  load(skillName) {
    if (this.loaded.has(skillName)) return this.loaded.get(skillName);
    const skill = this.registry.get(skillName);
    if (!skill) return null;
    if (!skill.enabled) return null;
    try {
      // Validate path resolves within expected skills directory (prevent path traversal)
      let skillsRoot = path.resolve(__dirname, '../../skills');
      let resolvedPath = path.resolve(skill.path);
      // macOS filesystem is case-insensitive; normalize to lowercase to prevent bypass
      if (process.platform === 'darwin') {
        skillsRoot = skillsRoot.toLowerCase();
        resolvedPath = resolvedPath.toLowerCase();
      }
      if (!resolvedPath.startsWith(skillsRoot + path.sep)) {
        console.warn(`[SkillLoader] blocked path traversal attempt: ${skill.path}`);
        return null;
      }
      // Enforce max file size (1MB)
      const stat = fs.statSync(skill.path);
      if (stat.size > 1024 * 1024) {
        console.warn(`[SkillLoader] skill file too large (${stat.size} bytes): ${skillName}`);
        return null;
      }
      const content = fs.readFileSync(skill.path, 'utf8');
      this.loaded.set(skillName, content);
      return content;
    } catch (e) {
      console.warn(`[SkillLoader] 读取技能失败: ${skillName}`, e.message);
      return null;
    }
  }

  async use(skillName, params = {}) {
    const content = this.load(skillName);
    if (!content) return null;
    const instructions = this._extractInstructions(content);
    return { skillName, instructions, params, content };
  }

  _extractInstructions(content) {
    const match = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
    return match ? match[1].substring(0, 2000) : content.substring(0, 2000);
  }
}

module.exports = { SkillLoader };

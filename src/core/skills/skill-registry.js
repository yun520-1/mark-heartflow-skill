/**
 * Skill Registry — 内存中的技能注册表
 * @version v0.12.50
 */
'use strict';

const path = require('path');
const fs = require('fs');

class SkillRegistry {
  constructor() {
    this.root = path.resolve(__dirname, '../../../..');
    this.registry = new Map();
    this._loadSkills();
  }

  _loadSkills() {
    const skillsDir = path.join(this.root, 'skills');
    if (!fs.existsSync(skillsDir)) return;
    try {
      fs.readdirSync(skillsDir).forEach(f => {
        if (f.endsWith('.md') || f.endsWith('.skill')) {
          this._loadSkillFile(path.join(skillsDir, f));
        }
      });
    } catch (e) {
      console.warn('[SkillRegistry] 加载技能失败:', e.message);
    }
  }

  _loadSkillFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const name = path.basename(filePath, path.extname(filePath));
      const match = content.match(/^---\n([\s\S]*?)\n---/);
      if (match) {
        const fm = this._parseFrontmatter(match[1]);
        this.registry.set(name, {
          name,
          path: filePath,
          enabled: fm.enabled !== false,
          description: fm.description || '',
          version: fm.version || '0.0.1',
          tags: Array.isArray(fm.tags) ? fm.tags : [],
        });
      }
    } catch (e) {
      console.warn(`[SkillRegistry] 加载技能文件 ${filePath} 失败:`, e.message);
    }
  }

  _parseFrontmatter(text) {
    const result = {};
    text.split('\n').forEach(line => {
      const idx = line.indexOf(':');
      if (idx > 0) {
        const key = line.slice(0, idx).trim();
        const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        result[key] = val;
      }
    });
    return result;
  }

  list() { return Array.from(this.registry.values()); }
  get(name) { return this.registry.get(name); }
  enable(name)  { const s = this.registry.get(name); if (s) s.enabled = true; }
  disable(name) { const s = this.registry.get(name); if (s) s.enabled = false; }
}

module.exports = { SkillRegistry };

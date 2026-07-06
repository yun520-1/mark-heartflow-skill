/**
 * HeartFlow Skills Registry
 * 
 * 14 个工作流 skill 索引，供 HeartFlow 引擎和 Claude 使用。
 * 每个 skill 包含一个 SKILL.md（触发条件 + 工作流）和 references/（详细文档）。
 */

const fs = require('fs');
const path = require('path');

const SKILLS_DIR = __dirname;

/**
 * 列出所有可用的工作流 skill
 * @returns {Array<{name: string, description: string}>}
 */
function listSkills() {
  const skills = [];
  for (const entry of fs.readdirSync(SKILLS_DIR)) {
    const skillDir = path.join(SKILLS_DIR, entry);
    const skillMd = path.join(skillDir, 'SKILL.md');
    if (fs.existsSync(skillMd) && fs.statSync(skillDir).isDirectory()) {
      const content = fs.readFileSync(skillMd, 'utf-8');
      const nameMatch = content.match(/^name:\s*(.+)$/m);
      const descMatch = content.match(/^description:\s*\|?-?\s*(.+)$/m);
      skills.push({
        name: nameMatch ? nameMatch[1].trim() : entry,
        description: descMatch ? descMatch[1].trim() : '',
        path: skillDir,
      });
    }
  }
  return skills;
}

/**
 * 按名称加载 skill 的 SKILL.md 内容
 * @param {string} name - Skill 名称（如 'heartflow-debug-workflow'）
 * @returns {string|null} SKILL.md 内容
 */
function loadSkill(name) {
  const skillDir = path.join(SKILLS_DIR, name);
  const skillMd = path.join(skillDir, 'SKILL.md');
  if (fs.existsSync(skillMd)) {
    return fs.readFileSync(skillMd, 'utf-8');
  }
  return null;
}

/**
 * 加载 skill 的 references 目录内容
 * @param {string} name - Skill 名称
 * @returns {Array<{name: string, path: string}>}
 */
function listReferences(name) {
  const refDir = path.join(SKILLS_DIR, name, 'references');
  if (!fs.existsSync(refDir)) return [];
  return fs.readdirSync(refDir)
    .filter(f => f.endsWith('.md') || f.endsWith('.js'))
    .map(f => ({
      name: f,
      path: path.join(refDir, f),
    }));
}

module.exports = { listSkills, loadSkill, listReferences };

/**
 * Skill Generator - AutoSkill 框架实现
 * 从 reflect 分析报告中识别模式，自动生成标准化技能
 */

const fs = require('fs');
const path = require('path');

const SKILL_TEMPLATE = `{{SKILL_CONTENT}}`;

const PATTERN_REGISTRY = {
  '处理用户沮丧': {
    trigger: ['沮丧', '挫败', '失望', '泄气'],
    skillName: 'handle-frustration',
    skillDir: 'handle-frustration',
    description: '处理用户沮丧情绪的策略',
    priority: 'high'
  },
  '优化中断处理': {
    trigger: ['中断', '打断', '暂停', '离开'],
    skillName: 'interrupt-handler',
    skillDir: 'interrupt-handler',
    description: '优雅处理会话中断',
    priority: 'medium'
  },
  '心流引导增强': {
    trigger: ['无法进入心流', '注意力分散', '效率低'],
    skillName: 'flow引导',
    skillDir: 'flow引导',
    description: '增强心流引导策略',
    priority: 'high'
  },
  '情绪调节': {
    trigger: ['焦虑', '紧张', '压力', '不安'],
    skillName: 'emotion-regulation',
    skillDir: 'emotion-regulation',
    description: '帮助用户调节情绪',
    priority: 'medium'
  },
  '任务分解': {
    trigger: ['复杂', '无从下手', '混乱', '模糊'],
    skillName: 'task-decomposition',
    skillDir: 'task-decomposition',
    description: '将复杂任务分解为可管理步骤',
    priority: 'medium'
  }
};

class SkillGenerator {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.skillsDir = path.join(projectRoot, '.opencode', 'skills');
    this.reflectHistoryPath = path.join(projectRoot, '.opencode', 'memory', 'reflect-history.json');
  }

  loadReflectHistory() {
    try {
      if (fs.existsSync(this.reflectHistoryPath)) {
        return JSON.parse(fs.readFileSync(this.reflectHistoryPath, 'utf8'));
      }
    } catch (e) {
      console.error('Error loading reflect history:', e.message);
    }
    return { reports: [] };
  }

  identifyPatterns(report) {
    const patterns = [];
    const content = JSON.stringify(report).toLowerCase();
    
    for (const [patternKey, patternDef] of Object.entries(PATTERN_REGISTRY)) {
      for (const trigger of patternDef.trigger) {
        if (content.includes(trigger)) {
          patterns.push({
            key: patternKey,
            ...patternDef,
            confidence: 0.8
          });
          break;
        }
      }
    }
    
    return patterns;
  }

  generateSkillFile(pattern) {
    const skillContent = `# ${pattern.skillName} - ${pattern.description}

## 触发条件

当检测到用户${pattern.trigger.join('或')}时自动激活。

## 技能描述

${pattern.description}

## 处理策略

### 1. 识别情绪信号
- 检测用户输入中的情绪关键词
- 评估情绪强度和持续时间
- 记录情绪变化趋势

### 2. 响应策略
- 使用共情语言确认用户感受
- 提供具体可操作的建议
- 保持积极但真诚的态度
- 避免过度安慰或否定感受

### 3. 跟进机制
- 在后续对话中检查用户状态
- 根据反馈调整策略
- 记录效果供自我改进使用

## 调用示例

\`\`\`
用户: "这个任务太难了，我感到挫败"
AI: [激活 ${pattern.skillName} 技能]
-> "我能感受到你的 frustration，让我们一起看看可以如何分解这个任务..."
\`\`\`

## 与其他技能协作

- 与 reflect 技能配合，获取持续反馈
- 与 emotion-regulation 技能共享情绪数据
- 与 task-decomposition 技能协同处理复杂任务
`;
    return skillContent;
  }

  async generateSkill(pattern) {
    const skillDir = path.join(this.skillsDir, pattern.skillDir);
    
    if (fs.existsSync(skillDir)) {
      console.log(`Skill ${pattern.skillName} already exists`);
      return { success: false, reason: 'exists' };
    }

    fs.mkdirSync(skillDir, { recursive: true });
    
    const skillContent = this.generateSkillFile(pattern);
    const skillPath = path.join(skillDir, 'SKILL.md');
    fs.writeFileSync(skillPath, skillContent);

    console.log(`Generated skill: ${pattern.skillName}`);
    return { success: true, path: skillPath };
  }

  async processLatestReport() {
    const history = this.loadReflectHistory();
    const reports = history.reports || [];
    
    if (reports.length === 0) {
      return { success: false, reason: 'no_reports' };
    }

    const latestReport = reports[reports.length - 1];
    const patterns = this.identifyPatterns(latestReport);
    
    const results = [];
    for (const pattern of patterns) {
      const result = await this.generateSkill(pattern);
      results.push(result);
    }

    return {
      success: true,
      report_date: latestReport.date,
      patterns_found: patterns.length,
      skills_generated: results.filter(r => r.success).length
    };
  }

  listGeneratedSkills() {
    if (!fs.existsSync(this.skillsDir)) {
      return [];
    }
    
    return fs.readdirSync(this.skillsDir)
      .filter(f => fs.statSync(path.join(this.skillsDir, f)).isDirectory())
      .map(f => ({
        name: f,
        path: path.join(this.skillsDir, f, 'SKILL.md'),
        exists: fs.existsSync(path.join(this.skillsDir, f, 'SKILL.md'))
      }));
  }
}

module.exports = { SkillGenerator, PATTERN_REGISTRY };

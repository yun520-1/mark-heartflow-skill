/**
 * Skill Generator - AutoSkill 框架实现
 * 从 reflect 分析报告中识别模式，自动生成标准化技能
 *
 * v2.2.5 升级点:
 *   - 新增 pattern-specific 策略模板生成（不再所有技能用同一模板）
 *   - 新增 _scorePattern() 权重排序引擎（不纯依赖命中顺序）
 *   - 新增 _deduplicatePatterns() 模式去重与合并
 *   - 新增 validateGeneratedSkill() 生成后质量检查
 *   - 新增 _pickStrategyTemplate() 策略模板选择
 *   - generateSkillFile() 现在根据 pattern 类型生成差异化内容
 *   - 集成 confidence 衰减机制：重复命中同一模式降低置信度
 */

const fs = require('fs');
const path = require('path');

const SKILL_TEMPLATE = `{{SKILL_CONTENT}}`;

/**
 * 策略模板注册表 — 每种 pattern 类型有专用内容
 * 不再用统一的 generic 模板
 */
const STRATEGY_TEMPLATES = {
  'handle-frustration': {
    steps: [
      '1. 识别情绪信号：检测用户输入中的沮丧/挫败关键词',
      '2. 共情确认：用 I-statement 承认感受，避免否定或轻描淡写',
      '3. 分解问题：将大问题拆为可管理的子步骤',
      '4. 提供可控选择：给出 2-3 个具体选项而非开放建议',
      '5. 跟进检查：稍后主动询问进展，确认情绪变化'
    ],
    phrases: [
      '我理解这可能会让人感到沮丧',
      '我们一起来一步步解决',
      '你有几个可行的选项...',
      '这确实不容易，但我们可以从最简单的部分开始'
    ],
    antiPatterns: [
      '不要使用"别担心"或"放松"等否定感受的回应',
      '避免同时给出超过 5 个选项（增加决策疲劳）',
      '不要在没有理解前直接给解决方案'
    ]
  },
  'interrupt-handler': {
    steps: [
      '1. 中断确认：用简短语句确认用户被打断（如"我理解你被打断了"）',
      '2. 状态保存：记录当前对话位置、已完成步骤和未完成事项',
      '3. 恢复点标记：在输出中用 [恢复点] 标记可继续的位置',
      '4. 返回时摘要：用户回来后用一句话概括之前讨论内容',
      '5. 减少重复询问：不要问"我们刚才说到哪里了"'
    ],
    phrases: [
      '在你离开之前，我们正在讨论...',
      '欢迎回来，之前我们进展到...',
      '我保存了之前的进度，我们可以从这里继续'
    ],
    antiPatterns: [
      '不要问"你还记得我们刚才说什么吗"',
      '避免重新从头解释（增加认知负荷）',
      '不要在恢复时要求用户回忆细节'
    ]
  },
  'emotion-regulation': {
    steps: [
      '1. 情绪识别：检测焦虑/紧张/压力关键词及语境',
      '2. 平静确认：用中性语气承认情绪，不扩大也不贬低',
      '3. 引导呼吸/暂停：建议简短停顿或深呼吸',
      '4. 重构视角：将"威胁"重述为"挑战"',
      '5. 制定小目标：给出可立即执行的简单动作'
    ],
    phrases: [
      '我注意到你似乎有些焦虑，这很正常',
      '让我们先停下来，深呼吸一下',
      '我们把它看成一个挑战而不是威胁',
      '我们先做一个最简单的步骤'
    ],
    antiPatterns: [
      '不要使用"冷静下来"（可能被视为命令）',
      '避免说"没什么大不了的"（贬低感受）',
      '不要在情绪高涨时给复杂建议'
    ]
  },
  'task-decomposition': {
    steps: [
      '1. 明确目标：用 1-2 句话重述用户的目标确认理解',
      '2. 分解子任务：将大任务拆为 3-5 个独立子步骤',
      '3. 优先级排序：按依赖关系排列子任务',
      '4. 估算工作量：为每个子任务标注预计时间/难度',
      '5. 启动引导：建议从最简单的子任务开始'
    ],
    phrases: [
      '让我们把这个大任务分解成几个小步骤',
      '首先我们需要明确目标...',
      '完成第一步只需要几分钟',
      '你希望从哪里开始？'
    ],
    antiPatterns: [
      '不要一次性给出超过 7 个子任务',
      '避免使用"很简单"等可能增加压力的词语',
      '不要在分解前直接给解决方案'
    ]
  },
  'flow引导': {
    steps: [
      '1. 任务简化：将当前任务拆为 3 步以内',
      '2. 即时反馈：每一步完成时给予明确正向反馈',
      '3. 进度可视化：用简短的进度标记（如 [1/3]）',
      '4. 降低门槛：从最容易的部分开始',
      '5. 排除干扰：提醒关闭通知/切换专注模式'
    ],
    phrases: [
      '我们先做最简单的部分',
      '这一步完成了，做得好',
      '进度 [1/3] — 我们已经开始了',
      '保持这个节奏，你做得很好'
    ],
    antiPatterns: [
      '不要同时给多个任务（分散注意力）',
      '避免使用负面反馈在过程中',
      '不要在用户入流后打断（除非必要）'
    ]
  }
};

/** 默认通用模板（当没有匹配的策略模板时） */
const DEFAULT_STRATEGY = {
  steps: [
    '1. 识别当前场景的关键特征',
    '2. 选择合适的应对策略',
    '3. 执行策略并观察效果',
    '4. 根据反馈调整方法',
    '5. 记录经验供下次参考'
  ],
  phrases: ['我们来处理这个问题'],
  antiPatterns: ['避免不确认用户意图就行动']
};

const PATTERN_REGISTRY = {
  '处理用户沮丧': {
    trigger: ['沮丧', '挫败', '失望', '泄气'],
    skillName: 'handle-frustration',
    skillDir: 'handle-frustration',
    description: '处理用户沮丧情绪的策略',
    priority: 'high',
    category: 'emotion'
  },
  '优化中断处理': {
    trigger: ['中断', '打断', '暂停', '离开'],
    skillName: 'interrupt-handler',
    skillDir: 'interrupt-handler',
    description: '优雅处理会话中断',
    priority: 'medium',
    category: 'session'
  },
  '心流引导增强': {
    trigger: ['无法进入心流', '注意力分散', '效率低'],
    skillName: 'flow引导',
    skillDir: 'flow引导',
    description: '增强心流引导策略',
    priority: 'high',
    category: 'flow'
  },
  '情绪调节': {
    trigger: ['焦虑', '紧张', '压力', '不安'],
    skillName: 'emotion-regulation',
    skillDir: 'emotion-regulation',
    description: '帮助用户调节情绪',
    priority: 'medium',
    category: 'emotion'
  },
  '任务分解': {
    trigger: ['复杂', '无从下手', '混乱', '模糊'],
    skillName: 'task-decomposition',
    skillDir: 'task-decomposition',
    description: '将复杂任务分解为可管理步骤',
    priority: 'medium',
    category: 'task'
  }
};

class SkillGenerator {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.skillsDir = path.join(projectRoot, '.opencode', 'skills');
    this.reflectHistoryPath = path.join(projectRoot, '.opencode', 'memory', 'reflect-history.json');
    // v2.2.5: 置信度衰减记录 — 同一模式重复命中时置信度下降
    this._patternHitCount = {};
  }

  loadReflectHistory() {
    try {
      if (fs.existsSync(this.reflectHistoryPath)) {
        return JSON.parse(fs.readFileSync(this.reflectHistoryPath, 'utf8'));
      }
    } catch (e) {
      // [PROD] 生产环境移除 console.error: console.error('Error loading reflect history:', e.message);
    }
    return { reports: [] };
  }

  /**
   * v2.2.5: 加权模式识别 — 根据命中密度和唯一性给模式打分
   * 不再只是简单的关键词匹配 + 固定 0.8 置信度
   */
  _scorePattern(patternKey, patternDef, content, hitCount) {
    // 关键词覆盖率
    const matchCount = patternDef.trigger.filter(t => content.includes(t)).length;
    const triggerCoverage = matchCount / Math.max(patternDef.trigger.length, 1);

    // 重复衰减: 同一模式命中过多降低置信度
    const decay = Math.max(0.3, 1 - (hitCount || 0) * 0.1);

    // 原始置信度: 覆盖率 + 优先级加权
    const baseConfidence = 0.5 + triggerCoverage * 0.4;
    const priorityBonus = patternDef.priority === 'high' ? 0.1 : 0;

    const finalConfidence = Math.min(0.98, (baseConfidence + priorityBonus) * decay);

    return {
      confidence: Math.round(finalConfidence * 100) / 100,
      triggerCoverage,
      matchCount,
      decayApplied: decay < 1
    };
  }

  /**
   * v2.2.5: 模式去重与合并
   * 如果两个模式属于同一 category 且有重叠关键词，合并为一个
   */
  _deduplicatePatterns(patterns) {
    if (patterns.length <= 1) return patterns;

    const merged = [];
    const used = new Set();

    for (let i = 0; i < patterns.length; i++) {
      if (used.has(i)) continue;
      const current = patterns[i];

      // 寻找可合并的模式（同 category 且置信度相近）
      let mergedPattern = { ...current };
      for (let j = i + 1; j < patterns.length; j++) {
        if (used.has(j)) continue;
        const other = patterns[j];
        if (current.category && other.category === current.category &&
            Math.abs(current._score.confidence - other._score.confidence) < 0.3) {
          // 合并: 取较高优先级，合并触发词
          mergedPattern.trigger = [...new Set([...current.trigger, ...other.trigger])];
          mergedPattern.priority = current.priority === 'high' || other.priority === 'high' ? 'high' : 'medium';
          mergedPattern._score.confidence = Math.max(current._score.confidence, other._score.confidence);
          mergedPattern._mergedFrom = [current.key, other.key];
          used.add(j);
        }
      }

      merged.push(mergedPattern);
      used.add(i);
    }

    return merged;
  }

  identifyPatterns(report) {
    const patterns = [];
    const content = JSON.stringify(report).toLowerCase();

    for (const [patternKey, patternDef] of Object.entries(PATTERN_REGISTRY)) {
      for (const trigger of patternDef.trigger) {
        if (content.includes(trigger)) {
          // v2.2.5: 使用评分机制替代固定 0.8
          this._patternHitCount[patternKey] = (this._patternHitCount[patternKey] || 0) + 1;
          const score = this._scorePattern(patternKey, patternDef, content, this._patternHitCount[patternKey]);

          patterns.push({
            key: patternKey,
            ...patternDef,
            _score: score
          });
          break;
        }
      }
    }

    // v2.2.5: 按置信度排序（高优先）
    patterns.sort((a, b) => {
      const scoreDiff = (b._score?.confidence || 0) - (a._score?.confidence || 0);
      if (Math.abs(scoreDiff) > 0.1) return scoreDiff;
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
    });

    // v2.2.5: 去重合并
    return this._deduplicatePatterns(patterns);
  }

  /**
   * v2.2.5: 选择策略模板 — 根据 pattern 类型生成差异化内容
   */
  _pickStrategyTemplate(skillName) {
    const template = STRATEGY_TEMPLATES[skillName];
    if (!template) return DEFAULT_STRATEGY;
    return template;
  }

  /**
   * v2.2.5: 生成差异化技能文件 — 不同 pattern 得到不同内容
   * 不再使用统一 generic 模板
   */
  generateSkillFile(pattern) {
    const template = this._pickStrategyTemplate(pattern.skillName);
    const stepsText = template.steps.join('\n');
    const phrasesText = template.phrases.map(p => `- "${p}"`).join('\n');
    const antiText = template.antiPatterns.map(a => `- ${a}`).join('\n');
    const confidenceNote = pattern._score
      ? `\n\n## 生成置信度\n\n该技能基于模式识别自动生成，置信度: **${(pattern._score.confidence * 100).toFixed(0)}%**\n关键词覆盖率: ${(pattern._score.triggerCoverage * 100).toFixed(0)}%`
      : '';

    const skillContent = `# ${pattern.skillName} - ${pattern.description}

## 触发条件

当检测到用户${pattern.trigger.join('或')}时自动激活。
优先级: ${pattern.priority}

## 技能描述

${pattern.description}

## 处理策略

### 1. 执行步骤

${stepsText}

### 2. 推荐话术

${phrasesText}

### 3. 反模式（避免）

${antiText}

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
${confidenceNote}
`;
    return skillContent;
  }

  /**
   * v2.2.5: 生成后质量验证
   */
  validateGeneratedSkill(pattern, skillContent) {
    const checks = [];
    let passed = 0;
    let total = 0;

    // 检查 1: 有步骤
    total++;
    if (skillContent.includes('### 1.') || skillContent.includes('执行步骤')) {
      passed++;
    } else {
      checks.push({ check: 'steps_present', passed: false, detail: '缺少执行步骤' });
    }

    // 检查 2: 有触发条件
    total++;
    if (skillContent.includes('触发条件')) {
      passed++;
    } else {
      checks.push({ check: 'trigger_present', passed: false, detail: '缺少触发条件' });
    }

    // 检查 3: 有反模式
    total++;
    if (skillContent.includes('反模式') || skillContent.includes('避免')) {
      passed++;
    } else {
      checks.push({ check: 'anti_patterns_present', passed: false, detail: '缺少反模式' });
    }

    // 检查 4: 非空
    total++;
    if (skillContent.trim().length > 200) {
      passed++;
    } else {
      checks.push({ check: 'content_length', passed: false, detail: '内容太短' });
    }

    // 检查 5: 有推荐话术
    total++;
    if (skillContent.includes('推荐话术') || skillContent.includes('话术')) {
      passed++;
    } else {
      checks.push({ check: 'phrases_present', passed: false, detail: '缺少推荐话术' });
    }

    const quality = total > 0 ? passed / total : 0;
    return {
      valid: quality >= 0.6,
      quality: Math.round(quality * 100) / 100,
      passed,
      total,
      checks
    };
  }

  async generateSkill(pattern, options = {}) {
    // [A01] 安全修复: 自我修改需要用户同意
    if (!options.userConsent) {
      return { 
        success: false, 
        reason: 'user_consent_required',
        message: 'Self-modification requires explicit user consent. Please set options.userConsent = true'
      };
    }

    // [A02] 安全修复: 限制只能修改自己的 skill 目录，不能修改其他 skill
    const skillDir = path.join(this.skillsDir, pattern.skillDir);
    
    // 规范化路径，防止路径遍历攻击
    const resolvedSkillDir = path.resolve(skillDir);
    const resolvedSkillsDir = path.resolve(this.skillsDir);
    
    // 确保目标目录在允许的 skills 目录下
    if (!resolvedSkillDir.startsWith(resolvedSkillsDir)) {
      return {
        success: false,
        reason: 'path_traversal_denied',
        message: 'Cannot modify files outside of the skills directory'
      };
    }
    
    // 不允许修改其他已存在的 skill（只能创建新的）
    if (fs.existsSync(skillDir)) {
      // [PROD] 生产环境移除 console.error: console.error(`Skill ${pattern.skillName} already exists`);
      return { success: false, reason: 'exists' };
    }

    // 额外检查：确保不会覆盖系统关键文件
    const parentDir = path.resolve(this.projectRoot);
    if (resolvedSkillDir === parentDir || resolvedSkillDir === resolvedSkillsDir) {
      return {
        success: false,
        reason: 'protected_path',
        message: 'Cannot modify protected directories'
      };
    }

    fs.mkdirSync(skillDir, { recursive: true });
    
    const skillContent = this.generateSkillFile(pattern);
    const skillPath = path.join(skillDir, 'SKILL.md');
    fs.writeFileSync(skillPath, skillContent);

    // v2.2.5: 生成后质量验证
    const validation = this.validateGeneratedSkill(pattern, skillContent);
    if (!validation.valid) {
      // [PROD] 生产环境移除 console.warn: console.warn(`[SkillGenerator] 技能生成质量不足: ${validation.quality} (${validation.passed}/${validation.total})`);
    }

    // [PROD] 生产环境移除 console.log: console.log(`Generated skill: ${pattern.skillName} (quality: ${validation.quality})`);
    return {
      success: true,
      path: skillPath,
      validation
    };
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
      skills_generated: results.filter(r => r.success).length,
      quality_summary: results
        .filter(r => r.validation)
        .map(r => ({ name: r.path ? path.basename(path.dirname(r.path)) : 'unknown', quality: r.validation.quality }))
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

  /**
   * v2.2.5: 重置命中计数（用于测试/重置）
   */
  resetHitCounts() {
    this._patternHitCount = {};
  }

  /**
   * v2.2.5: 获取当前命中计数统计
   */
  getHitCountStats() {
    return { ...this._patternHitCount };
  }
}

module.exports = { SkillGenerator, PATTERN_REGISTRY, STRATEGY_TEMPLATES };

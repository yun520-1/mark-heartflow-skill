/**
 * Experience Replay - 反馈循环机制
 * 从反思报告中提取模式，生成技能修改建议
 */

const fs = require('fs');
const path = require('path');

class ExperienceReplay {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.reportFile = path.join(projectRoot, 'logs', 'reflect-reports.json');
    this.suggestionFile = path.join(projectRoot, 'logs', 'skill-suggestions.json');
    this.patternFile = path.join(projectRoot, '.opencode', 'memory', 'experience-patterns.json');
    
    this.patterns = this.loadPatterns();
    this.knownPatterns = this.initializeKnownPatterns();
  }

  loadPatterns() {
    try {
      if (fs.existsSync(this.patternFile)) {
        return JSON.parse(fs.readFileSync(this.patternFile, 'utf8'));
      }
    } catch (e) {}
    return { patterns: [], lastUpdate: null };
  }

  savePatterns() {
    fs.writeFileSync(this.patternFile, JSON.stringify(this.patterns, null, 2));
  }

  initializeKnownPatterns() {
    return {
      negative_emotion: {
        trigger: ['沮丧', '挫败', '失望', '泄气', 'frustrated', 'sad'],
        skill_area: 'emotion-regulation',
        suggestion: '当检测到用户负面情绪时，增加共情语句使用频率',
        priority: 'high'
      },
      frequent_interrupt: {
        trigger: ['中断', '打断', '离开', 'interrupt', 'leave'],
        skill_area: 'interrupt-handler',
        suggestion: '优化上下文恢复逻辑，减少重复询问',
        priority: 'high'
      },
      unclear_task: {
        trigger: ['模糊', '不确定', '怎么', '如何', 'unclear', 'how'],
        skill_area: 'task-decomposition',
        suggestion: '当任务不明确时，主动进行澄清和分解',
        priority: 'medium'
      },
      flow_block: {
        trigger: ['无法进入', '分心', '效率低', 'cannot focus', 'distracted'],
        skill_area: 'flow引导',
        suggestion: '简化任务步骤，降低认知负荷',
        priority: 'medium'
      }
    };
  }

  /**
   * 从经验更新技能
   */
  updateSkillFromExperience() {
    const reports = this.loadReports();
    
    if (reports.length === 0) {
      return {
        success: false,
        reason: 'no_reports',
        message: '暂无反思报告可分析'
      };
    }

    const latestReport = reports[reports.length - 1];
    const patterns = this.identifyPatterns(latestReport);
    
    if (patterns.length === 0) {
      return {
        success: true,
        message: '未发现需要修改的问题模式',
        patterns: []
      };
    }

    const suggestions = this.generateSkillSuggestions(patterns);
    
    this.saveSuggestions(suggestions);
    this.updateExperiencePatterns(patterns);
    
    return {
      success: true,
      patterns: patterns,
      suggestions: suggestions,
      message: `发现 ${patterns.length} 个可改进模式，已生成技能修改建议`
    };
  }

  /**
   * 加载报告
   */
  loadReports() {
    try {
      if (fs.existsSync(this.reportFile)) {
        return JSON.parse(fs.readFileSync(this.reportFile, 'utf8'));
      }
    } catch (e) {}
    return [];
  }

  /**
   * 识别问题模式
   */
  identifyPatterns(report) {
    const foundPatterns = [];
    
    const improvements = report.improvements || [];
    
    for (const [patternKey, patternDef] of Object.entries(this.knownPatterns)) {
      for (const improvement of improvements) {
        const area = improvement.area?.toLowerCase() || '';
        const suggestion = improvement.suggestion?.toLowerCase() || '';
        
        const matchesTrigger = patternDef.trigger.some(t => 
          area.includes(t) || suggestion.includes(t)
        );
        
        if (matchesTrigger) {
          foundPatterns.push({
            key: patternKey,
            ...patternDef,
            source_improvement: improvement,
            occurrence: 1,
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    for (const pattern of foundPatterns) {
      const existing = this.patterns.patterns?.find(p => p.key === pattern.key);
      if (existing) {
        pattern.occurrence = (existing.occurrence || 0) + 1;
      }
    }

    return foundPatterns;
  }

  /**
   * 生成技能修改建议
   */
  generateSkillSuggestions(patterns) {
    const suggestions = [];

    for (const pattern of patterns) {
      const suggestion = {
        id: `suggestion-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        pattern: pattern.key,
        skill_area: pattern.skill_area,
        current_issue: pattern.suggestion,
        proposed_change: this.generateProposedChange(pattern),
        priority: pattern.priority,
        timestamp: new Date().toISOString()
      };

      suggestions.push(suggestion);
    }

    return suggestions;
  }

  /**
   * 生成具体的修改方案
   */
  generateProposedChange(pattern) {
    const changeTemplates = {
      'emotion-regulation': {
        file: '.opencode/skills/emotion-regulation/SKILL.md',
        changes: [
          '当用户输入包含负面情绪关键词时，在响应开始处增加共情语句',
          '示例: "我能感受到你的沮丧，让我们一起看看..."',
          '增加情绪检测的敏感度'
        ]
      },
      'interrupt-handler': {
        file: '.opencode/skills/interrupt-handler/SKILL.md',
        changes: [
          '优化上下文恢复逻辑',
          '用户返回后，先用一句话概括之前的对话内容',
          '减少"我们刚才说到哪里了"这类重复询问'
        ]
      },
      'task-decomposition': {
        file: '.opencode/skills/task-decomposition/SKILL.md',
        changes: [
          '当检测到任务模糊时，主动询问澄清问题',
          '使用"你是指...吗?"句式确认需求',
          '将大任务分解为3-5个子步骤'
        ]
      },
      'flow引导': {
        file: '.opencode/skills/flow引导/SKILL.md',
        changes: [
          '降低任务复杂度，减少步骤数',
          '增加即时反馈频率',
          '在用户完成每个子任务后给予鼓励'
        ]
      }
    };

    return changeTemplates[pattern.skill_area] || {
      file: '未知',
      changes: ['需要人工审查确定修改方案']
    };
  }

  /**
   * 保存建议
   */
  saveSuggestions(suggestions) {
    let allSuggestions = [];
    try {
      if (fs.existsSync(this.suggestionFile)) {
        allSuggestions = JSON.parse(fs.readFileSync(this.suggestionFile, 'utf8'));
      }
    } catch (e) {
      allSuggestions = [];
    }

    allSuggestions.push(...suggestions);
    if (allSuggestions.length > 100) {
      allSuggestions = allSuggestions.slice(-100);
    }

    const dir = path.dirname(this.suggestionFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.suggestionFile, JSON.stringify(allSuggestions, null, 2));
  }

  /**
   * 更新经验模式
   */
  updateExperiencePatterns(patterns) {
    for (const pattern of patterns) {
      const existing = this.patterns.patterns?.findIndex(p => p.key === pattern.key);
      
      if (existing >= 0) {
        this.patterns.patterns[existing].occurrence = pattern.occurrence;
        this.patterns.patterns[existing].lastSeen = pattern.timestamp;
      } else {
        this.patterns.patterns = this.patterns.patterns || [];
        this.patterns.patterns.push({
          key: pattern.key,
          skill_area: pattern.skill_area,
          occurrence: pattern.occurrence,
          firstSeen: pattern.timestamp,
          lastSeen: pattern.timestamp
        });
      }
    }

    this.patterns.lastUpdate = new Date().toISOString();
    this.savePatterns();
  }

  /**
   * 打印建议
   */
  printSuggestions(result) {
    console.log('\n' + '='.repeat(60));
    console.log('🔄 技能修改建议');
    console.log('='.repeat(60));
    
    if (!result.success || !result.suggestions || result.suggestions.length === 0) {
      console.log(`\n${result.message || '暂无建议'}\n`);
      return;
    }

    console.log(`\n发现 ${result.suggestions.length} 个可改进模式:\n`);

    result.suggestions.forEach((sug, i) => {
      console.log(`【建议 ${i + 1}】`);
      console.log(`  模式: ${sug.pattern}`);
      console.log(`  技能区域: ${sug.skill_area}`);
      console.log(`  当前问题: ${sug.current_issue}`);
      console.log(`  优先级: ${sug.priority}`);
      console.log(`  建议修改:`);
      sug.proposed_change.changes?.forEach((change, j) => {
        console.log(`    ${j + 1}. ${change}`);
      });
      console.log('');
    });

    console.log('='.repeat(60) + '\n');
  }

  /**
   * 运行完整流程
   */
  run() {
    const result = this.updateSkillFromExperience();
    this.printSuggestions(result);
    return result;
  }

  /**
   * 获取历史建议
   */
  getHistory() {
    try {
      if (fs.existsSync(this.suggestionFile)) {
        return JSON.parse(fs.readFileSync(this.suggestionFile, 'utf8'));
      }
    } catch (e) {}
    return [];
  }

  /**
   * 获取已知模式
   */
  getPatterns() {
    return this.patterns;
  }
}

/**
 * CLI 入口
 */
if (require.main === module) {
  const replay = new ExperienceReplay(process.cwd());
  replay.run();
}

module.exports = { ExperienceReplay };

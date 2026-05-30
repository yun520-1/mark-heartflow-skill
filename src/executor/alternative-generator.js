/**
 * 备选方案生成器 (Alternative Generator) v1.0.0
 *
 * 生成解决问题的备选方案
 */

class AlternativeGenerator {
  constructor(options = {}) {
    this.decision = options.decision || null;
    this.builtinAlternatives = this._registerBuiltinAlternatives();
  }

  /**
   * 注册内置备选方案
   */
  _registerBuiltinAlternatives() {
    return {
      bash: {
        tool: 'bash',
        name: 'Bash命令',
        description: '使用命令行工具执行',
        applicableTo: ['shell', 'command', 'script', 'file_operations'],
        score: 0.9
      },
      file: {
        tool: 'file',
        name: '文件操作',
        description: '直接操作文件系统',
        applicableTo: ['create', 'edit', 'delete', 'read', 'write'],
        score: 0.9
      },
      search: {
        tool: 'search',
        name: '代码搜索',
        description: '搜索代码库',
        applicableTo: ['find', 'search', 'replace', 'analysis'],
        score: 0.8
      },
      git: {
        tool: 'git',
        name: 'Git操作',
        description: 'Git版本控制',
        applicableTo: ['commit', 'push', 'pull', 'branch', 'clone'],
        score: 0.85
      },
      http: {
        tool: 'http',
        name: 'HTTP请求',
        description: '发送HTTP请求',
        applicableTo: ['api', 'fetch', 'request', 'web'],
        score: 0.8
      },
      node: {
        tool: 'node',
        name: 'Node.js脚本',
        description: '使用Node.js执行脚本',
        applicableTo: ['javascript', 'script', 'npm', 'package'],
        score: 0.85
      },
      python: {
        tool: 'python',
        name: 'Python脚本',
        description: '使用Python执行脚本',
        applicableTo: ['python', 'pip', 'virtualenv', 'script'],
        score: 0.85
      }
    };
  }

  /**
   * 生成备选方案
   */
  generate(task, context = {}, options = {}) {
    const taskStr = typeof task === 'string' ? task : task.description || '';
    const taskType = this._classifyTaskType(taskStr);

    // 获取适用的备选方案
    let alternatives = this._getApplicableAlternatives(taskType, options);

    // 如果是基于错误的备选，添加特定方案
    if (options.previousError) {
      alternatives = this._addErrorBasedAlternatives(alternatives, options.previousError, taskType);
    }

    // 排序
    let sortedAlternatives = alternatives.sort((a, b) => b.score - a.score);

    // 决策流验证 - 评估备选方案质量
    if (this.decision) {
      try {
        const decisionResult = this.decision.decide({
          task: taskStr,
          options: sortedAlternatives.map((alt, idx) => ({
            id: idx,
            label: alt.name,
            description: alt.description || alt.name,
            tool: alt.tool,
            score: alt.score
          })),
          constraints: {
            previousError: options.previousError?.message,
            fallbackLevel: options.fallbackLevel
          }
        });
        // 如果决策结果要求重新排序或筛选，使用决策结果
        if (decisionResult && decisionResult.chosen) {
          const chosenId = decisionResult.chosen.id;
          // 将选中的方案移到第一位
          if (chosenId > 0) {
            const chosen = sortedAlternatives[chosenId];
            sortedAlternatives = [chosen, ...sortedAlternatives.filter((_, i) => i !== chosenId)];
          }
        }
      } catch (e) {
        // 决策验证失败时使用默认排序
        console.warn('AlternativeGenerator decision verification failed:', e.message);
      }
    }

    // 返回最终备选方案
    return sortedAlternatives
      .slice(0, options.maxAlternatives || 5)
      .map(alt => ({
        ...alt,
        executor: this._createExecutor(alt.tool, options.context)
      }));
  }

  /**
   * 分类任务类型
   */
  _classifyTaskType(taskStr) {
    const typePatterns = {
      shell: [/bash|shell|command|terminal|cli/i, /terminal|console|cmd/i],
      file_operations: [/文件|file|创建|删除|编辑|write|read|edit|delete/i],
      search: [/搜索|查找|搜索|search|find|replace/i],
      git: [/git|commit|push|pull|branch|clone/i],
      api: [/api|fetch|http|request|web|网络/i],
      javascript: [/javascript|js|node|npm/i],
      python: [/python|py|pip|virtualenv/i],
      script: [/脚本|script|run|execute/i]
    };

    for (const [type, patterns] of Object.entries(typePatterns)) {
      if (patterns.some(p => p.test(taskStr))) {
        return type;
      }
    }

    return 'general';
  }

  /**
   * 获取适用的备选方案
   */
  _getApplicableAlternatives(taskType, options = {}) {
    const applicable = [];

    for (const [name, alt] of Object.entries(this.builtinAlternatives)) {
      // 检查是否适用于此任务类型
      const isApplicable = alt.applicableTo.some(type =>
        taskType.includes(type) || type.includes(taskType)
      );

      if (isApplicable || taskType === 'general') {
        applicable.push({
          name,
          ...alt,
          reason: isApplicable ? '任务类型匹配' : '通用方案'
        });
      }
    }

    // 添加所有工具作为备选（如果没有匹配的）
    if (applicable.length === 0) {
      for (const [name, alt] of Object.entries(this.builtinAlternatives)) {
        applicable.push({
          name,
          ...alt,
          reason: '默认备选'
        });
      }
    }

    return applicable;
  }

  /**
   * 添加基于错误的备选方案
   */
  _addErrorBasedAlternatives(alternatives, error, taskType) {
    const errorStr = error.message || String(error);
    const additional = [];

    // 语法错误 - 推荐检查工具
    if (/syntax|parse|unexpected/i.test(errorStr)) {
      additional.push({
        tool: 'file',
        name: '文件检查',
        description: '检查并修正语法错误',
        applicableTo: ['syntax', 'parse'],
        score: 0.95
      });
    }

    // 依赖错误 - 推荐安装依赖
    if (/cannot find module|dependency|import/i.test(errorStr)) {
      additional.push({
        tool: 'bash',
        name: '依赖安装',
        description: '安装缺失的依赖',
        applicableTo: ['dependency', 'module'],
        score: 0.95
      });
    }

    // 权限错误 - 推荐使用sudo
    if (/permission|denied|access/i.test(errorStr)) {
      additional.push({
        tool: 'bash',
        name: '权限提升',
        description: '使用提升权限执行',
        applicableTo: ['permission'],
        score: 0.9
      });
    }

    // 超时错误 - 推荐优化方案
    if (/timeout|timed out/i.test(errorStr)) {
      additional.push({
        tool: 'bash',
        name: '超时优化',
        description: '增加超时时间或分步执行',
        applicableTo: ['timeout'],
        score: 0.85
      });
    }

    // 合并并去重
    const all = [...alternatives];
    for (const alt of additional) {
      if (!all.some(a => a.tool === alt.tool)) {
        all.push({
          ...alt,
          reason: `解决错误: ${alt.description}`
        });
      }
    }

    return all;
  }

  /**
   * 创建执行器
   */
  _createExecutor(tool, context = {}) {
    // 返回一个简单的执行器对象
    return {
      name: tool,
      execute: async (task, ctx) => {
        // 这里会被 FallbackExecutor 替换为真实的执行逻辑
        throw new Error(`Executor for ${tool} not implemented`);
      }
    };
  }

  /**
   * 注册自定义备选方案
   */
  registerAlternative(name, alternative) {
    this.builtinAlternatives[name] = {
      tool: alternative.tool || name,
      name: alternative.name || name,
      description: alternative.description || '',
      applicableTo: alternative.applicableTo || ['general'],
      score: alternative.score || 0.7
    };
  }

  /**
   * 获取所有备选方案
   */
  getAlternatives() {
    return { ...this.builtinAlternatives };
  }

  /**
   * 评估备选方案质量
   */
  evaluate(alternative, task, context = {}) {
    const taskStr = typeof task === 'string' ? task : task.description || '';

    let score = alternative.score || 0.5;

    // 检查工具是否适合任务
    const isApplicable = alternative.applicableTo?.some(type =>
      taskStr.toLowerCase().includes(type.toLowerCase())
    );

    if (isApplicable) {
      score += 0.2;
    }

    // 检查上下文偏好
    if (context.preferredTools?.includes(alternative.tool)) {
      score += 0.1;
    }

    // 检查历史成功
    if (context.successHistory?.includes(alternative.tool)) {
      score += 0.1;
    }

    return Math.min(1, score);
  }
}

module.exports = { AlternativeGenerator };

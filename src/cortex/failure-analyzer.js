/**
 * 失败分析器 (Failure Analyzer) v1.0.0
 *
 * 分析任务失败的根本原因
 */

class FailureAnalyzer {
  constructor(options = {}) {
    this.builtinPatterns = this._registerBuiltinPatterns();
  }

  /**
   * 注册内置模式
   */
  _registerBuiltinPatterns() {
    return {
      syntax_error: {
        patterns: [
          /syntax.*error|unexpected.*token|parse.*error/i,
          /invalid.*syntax|cannot.*parse/i
        ],
        category: 'syntax',
        rootCause: '代码存在语法错误',
        suggestedFix: '检查语法并修正'
      },
      runtime_error: {
        patterns: [
          /referenceerror|typeerror|cannot read property/i,
          /is not defined|cannot read/i
        ],
        category: 'runtime',
        rootCause: '运行时存在引用错误',
        suggestedFix: '检查变量定义和作用域'
      },
      dependency_error: {
        patterns: [
          /cannot find module|import error|module.*not found/i,
          /require.*failed|dependency.*not found/i
        ],
        category: 'dependency',
        rootCause: '缺少依赖或依赖版本不匹配',
        suggestedFix: '安装或更新依赖'
      },
      permission_error: {
        patterns: [
          /permission denied|access denied|EACCES/i,
          /eacces|eperm/i
        ],
        category: 'permission',
        rootCause: '文件或目录权限不足',
        suggestedFix: '检查并修正权限设置'
      },
      timeout_error: {
        patterns: [
          /timeout|timed out|etimeout/i,
          /operation.*took.*too.*long/i
        ],
        category: 'timeout',
        rootCause: '操作执行时间超过限制',
        suggestedFix: '增加超时时间或优化执行效率'
      },
      network_error: {
        patterns: [
          /econnrefused|econnreset|enotfound/i,
          /network.*error|fetch.*failed|request.*failed/i
        ],
        category: 'network',
        rootCause: '网络连接问题',
        suggestedFix: '检查网络连接和端点配置'
      },
      memory_error: {
        patterns: [
          /out of memory|oom|heap.*out.*of.*memory/i,
          /memory.*limit.*exceeded/i
        ],
        category: 'memory',
        rootCause: '内存使用超出限制',
        suggestedFix: '优化内存使用或增加内存限制'
      },
      disk_error: {
        patterns: [
          /enospc|disk.*full|no.*space.*left/i,
          /eio|read.*only.*file.*system/i
        ],
        category: 'disk',
        rootCause: '磁盘空间不足或文件系统错误',
        suggestedFix: '清理磁盘空间或检查文件系统'
      },
      assertion_error: {
        patterns: [
          /assertion.*failed|assert.*error/i,
          /test.*failed|fail.*assert/i
        ],
        category: 'assertion',
        rootCause: '断言失败，期望与实际不符',
        suggestedFix: '检查测试断言或验证预期条件'
      },
      validation_error: {
        patterns: [
          /validation.*failed|invalid.*input/i,
          /required.*missing|field.*invalid/i
        ],
        category: 'validation',
        rootCause: '输入验证失败',
        suggestedFix: '检查并修正输入数据'
      }
    };
  }

  /**
   * 分析失败
   */
  analyze(failure, context = {}) {
    const errorMessage = this._extractErrorMessage(failure);
    const matchedPatterns = this._matchPatterns(errorMessage);

    if (matchedPatterns.length === 0) {
      return {
        analyzed: false,
        errorMessage,
        category: 'unknown',
        rootCause: '未知错误',
        suggestedFix: '需要手动调查',
        confidence: 0
      };
    }

    // 选择最匹配的 pattern
    const bestMatch = matchedPatterns[0];

    // 深度分析
    const deepAnalysis = this._deepAnalyze(errorMessage, bestMatch, context);

    return {
      analyzed: true,
      errorMessage,
      category: bestMatch.category,
      rootCause: deepAnalysis.rootCause || bestMatch.rootCause,
      suggestedFix: deepAnalysis.suggestedFix || bestMatch.suggestedFix,
      confidence: bestMatch.confidence,
      patterns: matchedPatterns.map(m => m.patternName),
      details: deepAnalysis.details,
      context: this._extractContext(failure, context)
    };
  }

  /**
   * 提取错误消息
   */
  _extractErrorMessage(failure) {
    if (typeof failure === 'string') {
      return failure;
    }

    if (failure.error) {
      if (typeof failure.error === 'string') {
        return failure.error;
      }
      return failure.error.message || JSON.stringify(failure.error);
    }

    if (failure.message) {
      return failure.message;
    }

    if (failure.stderr) {
      return failure.stderr;
    }

    return JSON.stringify(failure);
  }

  /**
   * 匹配模式
   */
  _matchPatterns(errorMessage) {
    const matches = [];

    for (const [name, pattern] of Object.entries(this.builtinPatterns)) {
      for (const p of pattern.patterns) {
        if (p.test(errorMessage)) {
          matches.push({
            patternName: name,
            category: pattern.category,
            rootCause: pattern.rootCause,
            suggestedFix: pattern.suggestedFix,
            confidence: 0.9
          });
          break;
        }
      }
    }

    // 按置信度排序
    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * 深度分析
   */
  _deepAnalyze(errorMessage, matchedPattern, context = {}) {
    const details = {};
    let rootCause = matchedPattern.rootCause;
    let suggestedFix = matchedPattern.suggestedFix;

    // 提取文件名
    const fileMatch = errorMessage.match(/([^\/\s]+\.(js|ts|py|go|rs|java|cpp|c|h)):\d+/i);
    if (fileMatch) {
      details.file = fileMatch[1];
      details.line = parseInt(fileMatch[0].match(/:(\d+)/)?.[1] || '0', 10);
    }

    // 提取变量名
    const varMatch = errorMessage.match(/(?:cannot read|is not defined|undefined)\s+['"]?([a-zA-Z_$][a-zA-Z0-9_$]*)['"]?/i);
    if (varMatch) {
      details.variable = varMatch[1];
    }

    // 提取模块名
    const moduleMatch = errorMessage.match(/cannot find module ['"]?([a-zA-Z_$][a-zA-Z0-9_$@.\-\/]*)['"]?/i);
    if (moduleMatch) {
      details.module = moduleMatch[1];
      rootCause = `缺少模块: ${details.module}`;
      suggestedFix = `运行 npm install ${details.module} 或 yarn add ${details.module}`;
    }

    // 提取行号
    const lineMatch = errorMessage.match(/line\s+(\d+)/i);
    if (lineMatch) {
      details.line = parseInt(lineMatch[1], 10);
    }

    // 提取列号
    const colMatch = errorMessage.match(/column\s+(\d+)/i);
    if (colMatch) {
      details.column = parseInt(colMatch[1], 10);
    }

    return { rootCause, suggestedFix, details };
  }

  /**
   * 提取上下文
   */
  _extractContext(failure, providedContext = {}) {
    return {
      task: providedContext.task,
      step: providedContext.step,
      environment: providedContext.environment,
      timestamp: Date.now()
    };
  }

  /**
   * 批量分析
   */
  analyzeMultiple(failures, context = {}) {
    return failures.map((failure, index) => ({
      index,
      ...this.analyze(failure, {
        ...context,
        index
      })
    }));
  }

  /**
   * 注册自定义模式
   */
  registerPattern(name, pattern) {
    this.builtinPatterns[name] = {
      patterns: Array.isArray(pattern.patterns) ? pattern.patterns : [pattern.patterns],
      category: pattern.category || 'custom',
      rootCause: pattern.rootCause || '自定义错误',
      suggestedFix: pattern.suggestedFix || '需要手动处理'
    };
  }

  /**
   * 获取所有模式
   */
  getPatterns() {
    return { ...this.builtinPatterns };
  }

  /**
   * 分类统计
   */
  getCategoryStats(failures) {
    const stats = {
      total: failures.length,
      byCategory: {},
      unresolved: 0
    };

    for (const failure of failures) {
      const result = this.analyze(failure);
      if (result.analyzed) {
        stats.byCategory[result.category] = (stats.byCategory[result.category] || 0) + 1;
      } else {
        stats.unresolved++;
      }
    }

    return stats;
  }
}

module.exports = { FailureAnalyzer };

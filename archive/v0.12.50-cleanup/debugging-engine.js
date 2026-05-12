/**
 * Debugging Engine - 调试引擎
 * 
 * 集成自 addyosmani/agent-skills 的 debugging-and-error-recovery 技能
 * 提供系统化根因调试、Stop-the-Line 规则、分类检查清单
 * 
 * 对应核心指令：永远减少逻辑错误
 */

class DebuggingEngine {
  constructor() {
    this.debugHistory = [];
    this.stopTheLineActive = false;
  }

  /**
   * 系统化根因调试
   * @param {object} error - 错误对象
   * @param {object} context - 调试上下文
   * @returns {object} 调试结果
   */
  debug(error, context = {}) {
    const result = {
      reproduced: false,
      rootCause: null,
      fix: null,
      prevention: null
    };

    // Step 1: 停止新功能开发
    if (!this.stopTheLineActive) {
      this.stopTheLine();
    }

    // Step 2: 重现问题
    result.reproduced = this.reproduce(error, context);
    
    if (!result.reproduced) {
      return {
        ...result,
        message: 'Cannot reproduce. Gather more context or add logging.'
      };
    }

    // Step 3: 分类检查
    result.rootCause = this.triage(error, context);
    
    // Step 4: 修复根因
    result.fix = this.fixRootCause(result.rootCause, context);
    
    // Step 5: 防止复发
    result.prevention = this.preventRecurrence(result.rootCause, context);
    
    // 记录调试历史
    this.debugHistory.push({
      timestamp: new Date().toISOString(),
      error: error.message || String(error),
      rootCause: result.rootCause,
      fix: result.fix
    });

    return result;
  }

  /**
   * Stop-the-Line 规则
   */
  stopTheLine() {
    this.stopTheLineActive = true;
    return {
      action: 'STOP',
      message: 'Stop adding features. Preserve evidence. Debug systematically.',
      steps: [
        '1. STOP adding features or making changes',
        '2. PRESERVE evidence (error output, logs, repro steps)',
        '3. DIAGNOSE using the triage checklist',
        '4. FIX the root cause',
        '5. GUARD against recurrence',
        '6. RESUME only after verification passes'
      ]
    };
  }

  /**
   * 重现问题
   */
  reproduce(error, context) {
    // 简化检查：是否有足够的信息重现？
    if (!error || !context) {
      return {
        success: false,
        reason: 'Insufficient information to reproduce',
        needs: ['error output', 'logs', 'repro steps', 'environment details']
      };
    }

    // 检查：是否能在最小环境中重现？
    if (context.minimalEnv === false) {
      return {
        success: false,
        reason: 'Cannot reproduce in full environment. Try minimal environment.',
        suggestion: 'Create minimal repro case'
      };
    }

    return {
      success: true,
      message: 'Can reproduce the failure'
    };
  }

  /**
   * 分类检查清单
   */
  triage(error, context) {
    const categories = [
      'syntax',
      'type',
      'logic',
      'race',
      'resource',
      'config',
      'external'
    ];

    const result = {
      category: null,
      confidence: 0,
      evidence: []
    };

    // 检查1: 语法错误
    if (error instanceof SyntaxError || (error.message && error.message.includes('syntax'))) {
      result.category = 'syntax';
      result.confidence = 0.9;
      result.evidence.push('SyntaxError detected');
      return result;
    }

    // 检查2: 类型错误
    if (error instanceof TypeError || (error.message && error.message.includes('undefined'))) {
      result.category = 'type';
      result.confidence = 0.8;
      result.evidence.push('TypeError detected');
      return result;
    }

    // 检查3: 逻辑错误
    if (context.unexpectedBehavior) {
      result.category = 'logic';
      result.confidence = 0.6;
      result.evidence.push('Unexpected behavior reported');
      return result;
    }

    // 检查4: 竞态条件
    if (context.timingDependent) {
      result.category = 'race';
      result.confidence = 0.5;
      result.evidence.push('Timing-dependent issue suspected');
      return result;
    }

    // 检查5: 资源耗尽
    if (error.message && (error.message.includes('memory') || error.message.includes('timeout'))) {
      result.category = 'resource';
      result.confidence = 0.7;
      result.evidence.push('Resource exhaustion detected');
      return result;
    }

    // 检查6: 配置错误
    if (context.configChanged) {
      result.category = 'config';
      result.confidence = 0.6;
      result.evidence.push('Configuration recently changed');
      return result;
    }

    // 检查7: 外部依赖
    if (context.externalDependency) {
      result.category = 'external';
      result.confidence = 0.4;
      result.evidence.push('External dependency involved');
      return result;
    }

    // 未知
    result.category = 'unknown';
    result.confidence = 0.1;
    result.evidence.push('Could not categorize the error');
    return result;
  }

  /**
   * 修复根因
   */
  fixRootCause(rootCause, context) {
    if (!rootCause || !rootCause.category) {
      return {
        success: false,
        message: 'No root cause identified'
      };
    }

    const fixes = {
      syntax: {
        action: 'Fix syntax error',
        example: 'Check line X, character Y'
      },
      type: {
        action: 'Add type check or default value',
        example: 'if (x === undefined) x = defaultValue;'
      },
      logic: {
        action: 'Fix logic error',
        example: 'Review algorithm, add edge case handling'
      },
      race: {
        action: 'Add synchronization or locking',
        example: 'Use mutex, semaphore, or async/await'
      },
      resource: {
        action: 'Optimize resource usage',
        example: 'Add pagination, caching, or cleanup'
      },
      config: {
        action: 'Fix configuration',
        example: 'Check config file, environment variables'
      },
      external: {
        action: 'Add retry logic or fallback',
        example: 'Implement circuit breaker pattern'
      },
      unknown: {
        action: 'Gather more information',
        example: 'Add logging, create minimal repro'
      }
    };

    return fixes[rootCause.category] || fixes.unknown;
  }

  /**
   * 防止复发
   */
  preventRecurrence(rootCause, context) {
    if (!rootCause || !rootCause.category) {
      return {
        success: false,
        message: 'No root cause identified, cannot prevent recurrence'
      };
    }

    const preventions = {
      syntax: [
        'Add linting (ESLint, Pylint)',
        'Add pre-commit hooks',
        'Use TypeScript or static typing'
      ],
      type: [
        'Add type checking (TypeScript, Flow)',
        'Add runtime type validation',
        'Add unit tests with edge cases'
      ],
      logic: [
        'Add unit tests',
        'Add integration tests',
        'Add property-based tests'
      ],
      race: [
        'Add synchronization tests',
        'Use deterministic testing (Record & Replay)',
        'Add timeout and deadline'
      ],
      resource: [
        'Add resource limits',
        'Add monitoring and alerting',
        'Add load testing'
      ],
      config: [
        'Add config validation',
        'Add config tests',
        'Use config templates'
      ],
      external: [
        'Add retry logic with exponential backoff',
        'Add circuit breaker',
        'Add fallback mechanism'
      ],
      unknown: [
        'Add comprehensive logging',
        'Add error tracking (Sentry, Rollbar)',
        'Add monitoring dashboard'
      ]
    };

    return {
      category: rootCause.category,
      preventions: preventions[rootCause.category] || preventions.unknown
    };
  }

  /**
   * 获取调试统计
   */
  getStats() {
    if (this.debugHistory.length === 0) {
      return { totalDebugs: 0 };
    }

    const recent = this.debugHistory.slice(-20);
    const categoryCount = {};
    
    recent.forEach(d => {
      const cat = d.rootCause ? d.rootCause.category : 'unknown';
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    return {
      totalDebugs: this.debugHistory.length,
      recentDebugs: recent.length,
      categoryCount,
      mostCommonCategory: Object.keys(categoryCount).sort((a, b) => categoryCount[b] - categoryCount[a])[0]
    };
  }
}

module.exports = DebuggingEngine;

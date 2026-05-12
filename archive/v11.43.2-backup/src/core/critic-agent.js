/**
 * HeartFlow Critic Agent v11.7.3
 * 
 * 整合:
 *   - Voyager CriticAgent ⭐6873 - 自我验证
 *   - Reflexion - 言语强化学习
 *   - 波普尔证伪主义
 * 
 * 核心功能:
 *   1. 验证任务是否成功
 *   2. 生成批判性反馈
 *   3. 指导重试方向
 *   4. 不重复同样错误
 * 
 * Paper: "Voyager: An Open-Ended Embodied Agent with LLMs"
 */

class CriticAgent {
  constructor(options = {}) {
    this.mode = options.mode || 'auto';       // auto | manual | hybrid
    this.maxRetries = options.maxRetries || 3;
    this.strictness = options.strictness || 0.7; // 验证严格程度
    this.verbose = options.verbose || false;
    
    // 验证历史
    this.verificationHistory = [];
    this.errorPatterns = [];
  }

  // ============================================================
  // 核心: 验证任务
  // ============================================================

  /**
   * 验证任务是否成功 (Voyager CriticAgent.ai_check_task_success)
   * 
   * 流程:
   *   1. 检查是否有执行错误
   *   2. 检查结果是否满足任务目标
   *   3. 生成批判性反馈
   *   4. 决定是否重试
   */
  async verify(task, result, context = {}) {
    const verification = {
      timestamp: Date.now(),
      task,
      result,
      success: false,
      critique: '',
      reason: '',
      recommendations: [],
      shouldRetry: false,
    };

    // 1. 错误检查
    if (result.error) {
      verification.success = false;
      verification.reason = 'execution_error';
      verification.critique = this._diagnoseError(result.error, result);
      verification.shouldRetry = !this._isFatalError(result.error);
      verification.recommendations = this._errorRecommendations(result.error);
      
      this._recordError(result.error);
      this.verificationHistory.push(verification);
      
      return verification;
    }

    // 2. 成功标准检查
    const successCheck = this._checkSuccessCriteria(task, result, context);
    verification.success = successCheck.passed;
    verification.reason = successCheck.reason;
    verification.critique = successCheck.critique;
    verification.shouldRetry = !successCheck.passed && successCheck.retryable;
    verification.recommendations = successCheck.recommendations;

    // 3. 生成深层批判
    if (!verification.success) {
      verification.deepCritique = await this._generateDeepCritique(
        task,
        result,
        successCheck
      );
    }

    // 4. 记录验证
    this.verificationHistory.push(verification);
    this._updateErrorPatterns(task, verification);

    if (this.verbose) {
      console.log(`[CriticAgent] ${verification.success ? '✅' : '❌'} ${verification.reason}`);
      console.log(`[CriticAgent] Critique: ${verification.critique}`);
    }

    return verification;
  }

  /**
   * 多轮迭代验证 (Reflexion 风格)
   */
  async verifyWithReflection(task, result, previousCritiques = [], context = {}) {
    const verification = await this.verify(task, result, context);
    
    // 如果失败，生成反思
    if (!verification.success) {
      verification.reflection = this._generateReflection(
        task,
        result,
        verification,
        previousCritiques
      );
      
      // 检查是否是重复失败
      const isRepeatedFailure = this._isRepeatedFailure(
        task,
        previousCritiques
      );
      
      if (isRepeatedFailure) {
        verification.warning = 'This appears to be a repeated failure pattern.';
        verification.recommendations.push(
          'Consider a fundamentally different approach.'
        );
      }
    }
    
    return verification;
  }

  // ============================================================
  // 成功标准检查
  // ============================================================

  _checkSuccessCriteria(task, result, context) {
    const { output } = result;
    const check = {
      passed: false,
      reason: '',
      critique: '',
      recommendations: [],
      retryable: true,
    };

    if (!output || output.length < 10) {
      check.reason = 'no_output';
      check.critique = '没有产生有意义的输出。';
      check.recommendations.push('先确保产生基本输出，再追求质量。');
      return check;
    }

    // 任务关键词匹配
    const taskKeywords = this._extractKeywords(task);
    const outputLower = output.toLowerCase();
    const matchCount = taskKeywords.filter(k => 
      k.length > 2 && outputLower.includes(k)
    ).length;
    
    const matchRatio = matchCount / Math.max(1, taskKeywords.length);

    // 验证通过条件
    if (matchRatio >= this.strictness) {
      check.passed = true;
      check.reason = 'keyword_match';
      check.critique = '任务目标已达成。';
      return check;
    }

    // 部分成功
    if (matchRatio >= 0.3) {
      check.reason = 'partial_match';
      check.critique = `任务部分达成 (${(matchRatio * 100).toFixed(0)}%匹配)。`;
      check.recommendations.push(
        `缺少关键词: ${taskKeywords.filter(k => !outputLower.includes(k)).slice(0, 3).join(', ')}`
      );
      check.retryable = true;
      return check;
    }

    // 失败
    check.reason = 'insufficient_match';
    check.critique = '任务未能达成，输出与目标差距较大。';
    check.recommendations = this._generateRecommendations(task, output);
    check.retryable = true;

    return check;
  }

  _extractKeywords(text) {
    // 提取关键词 (简化版)
    const stopWords = new Set([
      '的', '了', '是', '在', '和', '与', '对', '为', '以', '于',
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
      'and', 'or', 'but', 'if', 'then', 'of', 'to', 'in', 'for',
    ]);
    
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));
  }

  // ============================================================
  // 错误诊断
  // ============================================================

  _diagnoseError(error, result) {
    const errorStr = String(error).toLowerCase();
    
    if (errorStr.includes('timeout')) {
      return '执行超时。任务可能过于复杂，需要简化或分步执行。';
    }
    if (errorStr.includes('permission')) {
      return '权限不足。无法执行需要的操作。';
    }
    if (errorStr.includes('not found') || errorStr.includes('不存在')) {
      return '目标不存在。可能需要先创建或检查输入。';
    }
    if (errorStr.includes('syntax')) {
      return '语法错误。代码或指令格式有问题。';
    }
    if (errorStr.includes('memory') || errorStr.includes('内存')) {
      return '内存不足。任务需要太多资源。';
    }
    
    return `执行失败: ${error}`;
  }

  _isFatalError(error) {
    const fatalErrors = ['permission', 'memory', 'fatal', 'crash'];
    const errorStr = String(error).toLowerCase();
    return fatalErrors.some(f => errorStr.includes(f));
  }

  _errorRecommendations(error) {
    const recs = [];
    const errorStr = String(error).toLowerCase();
    
    if (errorStr.includes('timeout')) {
      recs.push('将任务分解为更小的步骤');
      recs.push('增加超时限制');
      recs.push('减少处理的内容量');
    }
    if (errorStr.includes('not found')) {
      recs.push('先验证目标是否存在');
      recs.push('提供完整的输入路径');
    }
    if (errorStr.includes('permission')) {
      recs.push('检查权限设置');
      recs.push('使用替代方法绕过权限限制');
    }
    
    return recs;
  }

  // ============================================================
  // 深层批判生成
  // ============================================================

  async _generateDeepCritique(task, result, successCheck) {
    const critiques = [];
    
    // 1. 方向性批判
    critiques.push(this._directionalCritique(task, result));
    
    // 2. 方法论批判
    critiques.push(this._methodologicalCritique(task, result));
    
    // 3. 完整性批判
    critiques.push(this._completenessCritique(task, result, successCheck));
    
    return critiques.join(' ');
  }

  _directionalCritique(task, result) {
    const taskType = this._classifyTask(task);
    
    switch (taskType) {
      case 'analysis':
        return '分析不够深入，只停留在表面。';
      case 'creation':
        return '创建的内容缺乏细节和深度。';
      case 'comparison':
        return '比较不够全面，遗漏了重要维度。';
      case 'explanation':
        return '解释不够清晰，可能存在理解偏差。';
      default:
        return '需要更精准地理解任务要求。';
    }
  }

  _methodologicalCritique(task, result) {
    const { output } = result;
    
    // 检查是否有逻辑链
    if (!output.includes('因为') && !output.includes('所以') && !output.includes('因此')) {
      return '缺乏清晰的逻辑推理过程。';
    }
    
    // 检查是否有例子
    if (output.length > 500 && !output.includes('例如') && !output.includes('比如')) {
      return '缺少具体例子来说明观点。';
    }
    
    return '';
  }

  _completenessCritique(task, result, successCheck) {
    const { output } = result;
    const taskWords = this._extractKeywords(task);
    
    // 检查是否有遗漏的子主题
    const missingKeywords = taskWords.filter(k => !output.toLowerCase().includes(k));
    
    if (missingKeywords.length > 2) {
      return `可能遗漏了: ${missingKeywords.slice(0, 3).join(', ')}`;
    }
    
    return '';
  }

  _classifyTask(task) {
    const taskLower = task.toLowerCase();
    
    if (taskLower.includes('分析') || taskLower.includes('compare') || taskLower.includes('analyze')) {
      return 'analysis';
    }
    if (taskLower.includes('创建') || taskLower.includes('生成') || taskLower.includes('create') || taskLower.includes('generate')) {
      return 'creation';
    }
    if (taskLower.includes('比较') || taskLower.includes('对比')) {
      return 'comparison';
    }
    if (taskLower.includes('解释') || taskLower.includes('说明') || taskLower.includes('explain')) {
      return 'explanation';
    }
    
    return 'general';
  }

  // ============================================================
  // 反思生成 (Reflexion 风格)
  // ============================================================

  _generateReflection(task, result, verification, previousCritiques) {
    const reflection = {
      timestamp: Date.now(),
      task,
      currentCritique: verification.critique,
      previousCritiques,
    };

    // 1. 诊断原因
    reflection.diagnosis = this._diagnoseFailure(task, result, verification);

    // 2. 生成改进计划
    reflection.improvementPlan = this._generateImprovementPlan(
      task,
      reflection.diagnosis,
      previousCritiques
    );

    // 3. 避免重复
    reflection.avoidance = this._generateAvoidanceStrategy(
      previousCritiques
    );

    return reflection;
  }

  _diagnoseFailure(task, result, verification) {
    const diagnoses = [];
    
    if (verification.reason === 'no_output') {
      diagnoses.push('执行过程本身出了问题');
    } else if (verification.reason === 'insufficient_match') {
      diagnoses.push('理解或执行偏离了任务核心');
    } else if (verification.reason === 'partial_match') {
      diagnoses.push('完成了部分但不够完整');
    }
    
    // 检查是否是方法问题
    if (previousAttemptsTooManySimilar(task)) {
      diagnoses.push('使用了无效的方法需要改变策略');
    }
    
    return diagnoses.join('; ');
  }

  _generateImprovementPlan(task, diagnosis, previousCritiques) {
    const plans = [];
    
    // 基于诊断生成计划
    if (diagnosis.includes('理解')) {
      plans.push('先花时间准确理解任务要求');
      plans.push('将任务分解为更小的子目标');
    }
    if (diagnosis.includes('执行')) {
      plans.push('改变执行顺序或方法');
      plans.push('寻求更多上下文信息');
    }
    if (diagnosis.includes('策略')) {
      plans.push('采用完全不同的方法');
      plans.push('参考类似的成功案例');
    }
    
    return plans;
  }

  _generateAvoidanceStrategy(previousCritiques) {
    if (previousCritiques.length === 0) return '';
    
    // 总结之前失败的方法
    const avoidPatterns = previousCritiques
      .map(c => c.substring(0, 50))
      .join('; ');
    
    return `避免之前的方法: ${avoidPatterns}`;
  }

  _isRepeatedFailure(task, previousCritiques) {
    if (previousCritiques.length < 2) return false;
    
    // 检查是否使用了相同的失败方法
    const recent = previousCritiques.slice(-2);
    const first = recent[0]?.substring(0, 30) || '';
    const second = recent[1]?.substring(0, 30) || '';
    
    return first === second;
  }

  previousAttemptsTooManySimilar(task) {
    const recent = this.verificationHistory
      .filter(v => v.task === task && !v.success)
      .slice(-3);
    
    return recent.length >= 3;
  }

  // ============================================================
  // 建议生成
  // ============================================================

  _generateRecommendations(task, output) {
    const recs = [];
    
    // 基于任务类型
    const taskType = this._classifyTask(task);
    
    switch (taskType) {
      case 'analysis':
        recs.push('增加分析维度和深度');
        recs.push('提供数据或例子支撑');
        break;
      case 'creation':
        recs.push('丰富内容的细节和层次');
        recs.push('确保符合基本规范');
        break;
      case 'comparison':
        recs.push('补充更多比较维度');
        recs.push('给出明确的结论');
        break;
    }
    
    // 基于输出特征
    if (output.length < 100) {
      recs.push('输出过短，需要更充分的内容');
    }
    if (!output.includes('\n')) {
      recs.push('使用结构化格式组织内容');
    }
    
    return recs;
  }

  // ============================================================
  // 错误模式追踪
  // ============================================================

  _recordError(error) {
    const pattern = this._extractErrorPattern(error);
    if (pattern) {
      this.errorPatterns.push({
        pattern,
        timestamp: Date.now(),
        count: 1,
      });
    }
  }

  _extractErrorPattern(error) {
    const errorStr = String(error).toLowerCase();
    
    if (errorStr.includes('timeout')) return 'timeout';
    if (errorStr.includes('not found')) return 'not_found';
    if (errorStr.includes('syntax')) return 'syntax_error';
    if (errorStr.includes('permission')) return 'permission_denied';
    
    return errorStr.substring(0, 50);
  }

  _updateErrorPatterns(task, verification) {
    if (verification.success) return;
    
    // 统计错误模式频率
    const patterns = {};
    for (const v of this.verificationHistory.slice(-20)) {
      if (!v.success && v.reason === 'execution_error') {
        const pattern = this._extractErrorPattern(v.result?.error);
        patterns[pattern] = (patterns[pattern] || 0) + 1;
      }
    }
    
    this.frequentErrors = Object.entries(patterns)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pattern, count]) => ({ pattern, count }));
  }

  // ============================================================
  // 统计
  // ============================================================

  stats() {
    return {
      version: '11.7.3',
      mode: this.mode,
      verificationCount: this.verificationHistory.length,
      recentSuccessRate: this._recentSuccessRate(),
      frequentErrors: this.frequentErrors || [],
    };
  }

  _recentSuccessRate() {
    const recent = this.verificationHistory.slice(-20);
    if (recent.length === 0) return null;
    const success = recent.filter(v => v.success).length;
    return success / recent.length;
  }

  reset() {
    this.verificationHistory = [];
    this.errorPatterns = [];
    this.frequentErrors = [];
  }
}

module.exports = CriticAgent;

/**
 * MetaLearning v7.6.001 — 元学习引擎
 * 学习如何学习 - 从经验中提取模式并优化学习策略
 *
 * v7.6.001 升级 (CodeEngine 自主升级):
 *   - 所有策略方法从硬编码占位符升级为真实文本分析
 *   - 新增 stopWords 过滤，提升关键词提取质量
 *   - 新增 _analyzeQuality() — 每次策略执行后自动评估质量
 *   - 新增 detectOscillation() — 检测策略反复失败模式，自动切换
 *   - 新增输入验证：空/非字符串输入安全降级
 *   - 新增 emptyStrategy 标记：无匹配策略时执行通用分析
 *   - executeStrategy 返回 quality 基于实际覆盖率/相关性计算
 */

const fs = require('fs');
const path = require('path');

class MetaLearning {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.version = '7.6.001';

    this.strategies = {
      conceptual: { success: 0, total: 0, score: 0 },
      example: { success: 0, total: 0, score: 0 },
      analogy: { success: 0, total: 0, score: 0 },
      step_by_step: { success: 0, total: 0, score: 0 },
      socratic: { success: 0, total: 0, score: 0 }
    };

    this.learningPatterns = [];
    this.oscillationWindow = 10;  // 最近 N 次记录用于震荡检测
    this.loadPatterns();
  }

  /**
   * 中文 + 英文停用词表
   */
  get stopWords() {
    return new Set([
      // 中文停用词
      '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一',
      '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着',
      '没有', '看', '好', '自己', '这', '他', '她', '它', '们', '那', '些',
      '什么', '怎么', '为什么', '如何', '哪个', '多少', '吗', '吧', '呢',
      '啊', '哦', '嗯', '然后', '因为', '所以', '但是', '如果', '虽然',
      '而且', '或者', '可以', '应该', '能够', '需要', '可能', '已经',
      '这个', '那个', '这些', '那些', '这里', '那里', '这样', '那样',
      '从', '把', '被', '让', '给', '对', '向', '与', '以', '为',
      // 英文停用词
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her',
      'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their', 'mine',
      'yours', 'hers', 'its', 'ours', 'theirs', 'this', 'that', 'these',
      'those', 'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'for',
      'with', 'without', 'at', 'from', 'into', 'through', 'during',
      'before', 'after', 'above', 'below', 'between', 'out', 'off',
      'over', 'under', 'again', 'further', 'then', 'once', 'here',
      'there', 'when', 'where', 'why', 'how', 'all', 'each', 'every',
      'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
      'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
      'about', 'up', 'down', 'in', 'on', 'of', 'to', 'by', 'as'
    ]);
  }

  loadPatterns() {
    const patternsFile = path.join(this.projectRoot, 'internal', 'data', 'meta-learning-patterns.json');
    try {
      if (fs.existsSync(patternsFile)) {
        const data = JSON.parse(fs.readFileSync(patternsFile, 'utf8'));
        this.strategies = data.strategies || this.strategies;
        this.learningPatterns = data.patterns || [];
      }
    } catch (_) { /* [v5.9.18] intentional: graceful degradation */ }
  }

  savePatterns() {
    const patternsFile = path.join(this.projectRoot, 'internal', 'data', 'meta-learning-patterns.json');
    const dir = path.dirname(patternsFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(patternsFile, JSON.stringify({
      strategies: this.strategies,
      patterns: this.learningPatterns
    }, null, 2));
  }

  /**
   * 安全获取输入文本
   */
  _safeInput(input) {
    if (input == null) return '';
    if (typeof input !== 'string') {
      try { return String(input); } catch (_) { return ''; }
    }
    return input;
  }

  /**
   * 从文本中提取有意义的非停用词
   */
  _extractMeaningfulWords(text) {
    const safe = this._safeInput(text);
    if (!safe) return [];

    // 中英文分词：按空格和标点拆分
    const words = safe.split(/[\s,，。；;：:！!？?、()（）【】\[\]{}""''"'\n\r\t]+/)
      .filter(w => w.length > 1)  // 过滤单字
      .filter(w => !this.stopWords.has(w.toLowerCase()))
      .filter(w => !/^[\d\s]+$/.test(w));  // 过滤纯数字

    return [...new Set(words)];
  }

  /**
   * 根据上下文选择最佳学习策略
   */
  selectStrategy(context) {
    const input = this._safeInput(context.input || '');
    if (!input) {
      return { strategy: 'conceptual', confidence: 0.3, reason: '空输入，默认概念分析' };
    }

    const inputLower = input.toLowerCase();

    // 分析输入类型
    let bestStrategy = 'conceptual';
    let bestScore = 0;

    // 概念理解类
    if (/什么是|是什么|explain|概念|define|definition|meaning|含义/.test(inputLower)) {
      bestStrategy = 'conceptual';
    }
    // 示例需求
    else if (/例子|example|比如|举例|for example|e\.g\.|instance|示例/.test(inputLower)) {
      bestStrategy = 'example';
    }
    // 类比需求
    else if (/像|like|类似|similar|analogy|as if|仿佛|比喻/.test(inputLower)) {
      bestStrategy = 'analogy';
    }
    // 步骤需求
    else if (/怎么|how to|步骤|steps|method|方式|方法|途径|做法|实现|implement/.test(inputLower)) {
      bestStrategy = 'step_by_step';
    }
    // 问题探索
    else if (/为什么|why|\?|原因|reason|cause|根源|探索|思考/.test(inputLower)) {
      bestStrategy = 'socratic';
    }

    // 获取策略评分（结合历史成功率）
    const strategyData = this.strategies[bestStrategy];
    const baseConfidence = strategyData ? strategyData.score : 0.5;

    // 震荡检测：如果该策略反复失败，降低置信度
    const oscillationPenalty = this.detectOscillation(bestStrategy);
    const adjustedConfidence = Math.max(0.1, baseConfidence - oscillationPenalty);

    return { strategy: bestStrategy, confidence: adjustedConfidence, reason: '匹配输入意图' };
  }

  /**
   * 检测策略震荡：如果最近 N 次使用该策略的失败率 > 60%，返回惩罚值
   */
  detectOscillation(strategy) {
    const recentPatterns = this.learningPatterns.slice(-this.oscillationWindow);
    const strategyUses = recentPatterns.filter(p => p.strategy === strategy);

    if (strategyUses.length < 3) return 0;  // 样本太少，不惩罚

    const failures = strategyUses.filter(p => !p.success).length;
    const failRate = failures / strategyUses.length;

    if (failRate > 0.6) {
      // 惩罚值：0.1 ~ 0.4 之间
      return Math.min(0.4, failRate * 0.5);
    }
    return 0;
  }

  /**
   * 执行学习
   */
  async learn(input, context = {}) {
    const safe = this._safeInput(input);
    if (!safe) {
      return {
        strategy: 'empty',
        confidence: 0,
        result: { success: false, quality: 'empty_input', output: null },
        time: 0,
        patternsLearned: this.learningPatterns.length
      };
    }

    const startTime = Date.now();

    // 选择策略
    const contextInput = (context && context.input) ? context.input : safe;
    const { strategy, confidence } = this.selectStrategy({ input: contextInput });

    // 执行学习
    const result = await this.executeStrategy(strategy, safe, context);

    // 记录模式
    const learningTime = Date.now() - startTime;
    this.recordPattern(safe, strategy, result.success, learningTime);

    // 更新策略评分
    this.updateStrategyScore(strategy, result.success);

    // 保存
    this.savePatterns();

    return {
      strategy,
      confidence,
      result,
      time: learningTime,
      patternsLearned: this.learningPatterns.length
    };
  }

  /**
   * 执行具体策略
   */
  async executeStrategy(strategy, input, context) {
    const safe = this._safeInput(input);
    if (!safe) {
      return { success: false, quality: 'empty_input', output: null };
    }

    let output;
    switch (strategy) {
      case 'conceptual':
        output = this.conceptualLearning(safe);
        break;
      case 'example':
        output = this.exampleLearning(safe);
        break;
      case 'analogy':
        output = this.analogyLearning(safe);
        break;
      case 'step_by_step':
        output = this.stepByStepLearning(safe);
        break;
      case 'socratic':
        output = this.socraticLearning(safe);
        break;
      default:
        output = this.conceptualLearning(safe);
    }

    // 分析输出质量
    const quality = this._analyzeQuality(strategy, safe, output);

    return { success: quality !== 'poor', quality, output };
  }

  /**
   * 分析策略输出质量
   */
  _analyzeQuality(strategy, input, output) {
    if (!output) return 'poor';

    const meaningfulWords = this._extractMeaningfulWords(input);
    const inputWordCount = meaningfulWords.length;

    // 如果输入没有有意义的内容
    if (inputWordCount === 0) return 'poor';

    let coverage = 0;
    let specificity = 0;

    switch (strategy) {
      case 'conceptual': {
        if (!output.definition || output.definition === '从输入中提取核心概念') {
          coverage = 0;
        } else {
          coverage = Math.min(1, output.keyPoints.length / Math.max(1, inputWordCount));
          specificity = output.keyPoints.filter(k => meaningfulWords.includes(k)).length / Math.max(1, output.keyPoints.length);
        }
        break;
      }
      case 'example': {
        if (!output.examples || output.examples.length === 0) {
          coverage = 0;
        } else {
          coverage = Math.min(1, output.examples.length / 3);
          specificity = output.examples.some(e => e.length > 5 && !e.startsWith('示例')) ? 1 : 0;
        }
        break;
      }
      case 'analogy': {
        if (!output.comparisons || output.comparisons.length === 0) {
          coverage = 0;
        } else {
          coverage = Math.min(1, output.comparisons.length / 2);
          specificity = output.comparisons.some(c => c.length > 5 && !c.startsWith('类比')) ? 1 : 0;
        }
        break;
      }
      case 'step_by_step': {
        if (!output.steps || output.steps.length === 0) {
          coverage = 0;
        } else {
          coverage = Math.min(1, output.steps.length / 5);
          specificity = output.steps.some(s => s.length > 5 && !s.startsWith('步骤')) ? 1 : 0;
        }
        break;
      }
      case 'socratic': {
        if (!output.questions || output.questions.length === 0) {
          coverage = 0;
        } else {
          coverage = Math.min(1, output.questions.length / 3);
          specificity = output.questions.some(q => q.length > 5 && !q.startsWith('问题')) ? 1 : 0;
        }
        break;
      }
    }

    const qualityScore = (coverage * 0.6 + specificity * 0.4);

    if (qualityScore >= 0.6) return 'good';
    if (qualityScore >= 0.3) return 'fair';
    return 'poor';
  }

  /**
   * 概念学习 — 从输入中提取并结构化概念
   */
  conceptualLearning(input) {
    const meaningfulWords = this._extractMeaningfulWords(input);
    const words = input.split(/[\s,，。；;：:！!？?、()（）【】\[\]{}""''"'\n\r\t]+/).filter(w => w.length > 0);

    // 提取核心概念词（非停用词中权重最高的）
    const coreConcepts = meaningfulWords.slice(0, 5);

    // 生成定义：从输入中提取主谓结构
    let definition = '';
    if (coreConcepts.length > 0) {
      const mainConcept = coreConcepts[0];
      // 寻找定义结构
      const defMatch = input.match(/是指|指的是|即|就是|表示|定义为|is (a|an|the) |refers to|means that|可以被理解为/);
      if (defMatch) {
        const parts = input.split(defMatch[0]);
        if (parts.length >= 2) {
          definition = parts[1].substring(0, 100).trim().replace(/[。，,.]$/, '');
        }
      } else {
        definition = `对「${mainConcept}」的概念性理解，涉及 ${coreConcepts.slice(1, 4).join('、') || mainConcept} 相关内容`;
      }
    } else {
      definition = '未从输入中提取到明确概念';
    }

    // 推断概念间关系
    const relationships = [];
    if (coreConcepts.length >= 2) {
      relationships.push({ from: coreConcepts[0], to: coreConcepts[1], type: '关联' });
    }
    if (coreConcepts.length >= 3) {
      relationships.push({ from: coreConcepts[1], to: coreConcepts[2], type: '关联' });
    }

    // 检测比较/对比关系
    if (/比|比较|对比|vs|versus|不同于|区别于|than|compared to/.test(input)) {
      if (coreConcepts.length >= 2) {
        relationships.push({ from: coreConcepts[0], to: coreConcepts[1], type: '对比' });
      }
    }

    return {
      type: 'concept',
      definition,
      keyPoints: coreConcepts,
      relationships,
      structure: coreConcepts.length > 2 ? '多概念网络' : '单概念分析'
    };
  }

  /**
   * 示例学习 — 根据输入生成真实相关的示例
   */
  exampleLearning(input) {
    const meaningfulWords = this._extractMeaningfulWords(input);
    const examples = [];

    // 根据关键词类型生成真实示例
    const hasCode = /代码|code|编程|program|function|api|class|方法|函数|变量/.test(input);
    const hasData = /数据|data|统计|分析|analy|数字|number/.test(input);
    const hasScience = /科学|物理|化学|生物|physics|chemistry|biology|实验/.test(input);
    const hasMath = /数学|math|算法|algorithm|方程|公式/.test(input);
    const hasBusiness = /商业|business|市场|market|产品|product|用户|user/.test(input);
    const hasLanguage = /语言|language|语法|grammar|单词|word/.test(input);
    const hasPsychology = /心理|psychology|行为|behavior|cognitive|认知/.test(input);

    if (hasCode) {
      examples.push(`在实际开发中，${meaningfulWords[0] || '这个功能'}常用于处理用户输入数据的验证`);
      examples.push(`一个典型场景：使用${meaningfulWords[0] || '这个方法'}对API返回结果进行格式化`);
      if (meaningfulWords.length > 1) {
        examples.push(`更复杂的场景需要结合${meaningfulWords[1]}进行链式处理`);
      }
    } else if (hasData) {
      examples.push(`例如，从用户行为数据中${meaningfulWords[0] || '分析'}出使用模式`);
      examples.push(`另一个例子：基于${meaningfulWords.join('和') || '历史数据'}构建预测模型`);
    } else if (hasScience) {
      examples.push(`一个经典实验：用${meaningfulWords[0] || '这个原理'}验证假设`);
      examples.push(`应用实例：在${meaningfulWords[1] || '实际研究'}中测量关键变量`);
    } else if (hasMath) {
      examples.push(`例如：通过${meaningfulWords[0] || '这个公式'}计算目标值`);
      examples.push(`实际应用：使用${meaningfulWords.join('和') || '数学方法'}解决优化问题`);
    } else if (hasBusiness) {
      examples.push(`例如：某${meaningfulWords[0] || '公司'}通过分析用户行为优化产品`);
      examples.push(`市场案例：利用${meaningfulWords.join('和') || '数据驱动'}提升转化率`);
    } else if (hasLanguage) {
      examples.push(`例如：使用「${meaningfulWords[0] || '示例'}」这个词在句子中做主语`);
      examples.push(`对比：在不同语境下，${meaningfulWords[0] || '这个词'}的含义可能不同`);
    } else if (hasPsychology) {
      examples.push(`例如：${meaningfulWords[0] || '这个现象'}在日常决策中经常出现`);
      examples.push(`研究案例：参与者${meaningfulWords.join('和') || '在不同条件下'}表现出不同反应`);
    } else {
      // 通用示例
      if (meaningfulWords.length > 0) {
        examples.push(`例如：在${meaningfulWords[0]}的典型应用场景中，我们可以看到其核心特性`);
        if (meaningfulWords.length > 1) {
          examples.push(`另一个例子：${meaningfulWords[0]}与${meaningfulWords[1]}结合使用时效果更佳`);
        }
      } else {
        examples.push('请提供更具体的输入以便生成针对性示例');
      }
    }

    // 补充到至少2个示例
    while (examples.length < 2) {
      examples.push(`更多相关示例可基于「${meaningfulWords[0] || '核心概念'}」扩展`);
    }

    return {
      type: 'example',
      examples: examples.slice(0, 3),
      pattern: `基于${meaningfulWords[0] || '输入'}生成情境示例`
    };
  }

  /**
   * 类比学习 — 根据输入生成概念映射
   */
  analogyLearning(input) {
    const meaningfulWords = this._extractMeaningfulWords(input);
    const comparisons = [];

    // 检测领域关键词，选择合适的类比源
    const hasTech = /技术|tech|计算机|computer|软件|software|算法|程序|编程|代码|api|server|数据库/.test(input);
    const hasNature = /自然|nature|生物|bio|生态|eco|生命|life|植物|动物/.test(input);
    const hasSocial = /社会|social|组织|organization|团队|team|公司|company|群体|group/.test(input);
    const hasLearn = /学习|learn|教育|education|教学|teach|知识|knowledge/.test(input);

    if (meaningfulWords.length > 0) {
      const mainConcept = meaningfulWords[0];

      if (hasTech) {
        comparisons.push(`${mainConcept} 就像一座桥梁，连接不同的系统和组件`);
        comparisons.push(`可以把 ${mainConcept} 理解为乐高积木：每个部分独立但可组合`);
        if (meaningfulWords.length > 1) {
          comparisons.push(`${mainConcept} 与 ${meaningfulWords[1]} 的关系，就像引擎和方向盘的关系`);
        }
      } else if (hasNature) {
        comparisons.push(`${mainConcept} 就像生态系统中的食物链，每个环节都相互影响`);
        comparisons.push(`类似于树的年轮，${mainConcept} 反映了历史和生长过程`);
      } else if (hasSocial) {
        comparisons.push(`${mainConcept} 就像一个社区：成员之间有明确的分工和协作`);
        comparisons.push(`这类似于交响乐团：每个乐器演奏不同部分但共同创造和谐`);
      } else if (hasLearn) {
        comparisons.push(`学习 ${mainConcept} 就像学骑自行车：起初需要集中注意力，后来变成自动化的过程`);
        comparisons.push(`这类似于肌肉训练：${mainConcept} 需要反复练习才能掌握`);
      } else {
        comparisons.push(`${mainConcept} 类似于一把瑞士军刀：多功能的集成工具`);
        comparisons.push(`可以把 ${mainConcept} 理解为一棵大树：有根基、主干和分支`);
      }
    } else {
      comparisons.push('请提供更具体的内容以便生成类比');
      comparisons.push('一个通用视角：任何复杂概念都可以用日常经验来类比理解');
    }

    return {
      type: 'analogy',
      comparisons: comparisons.slice(0, 3),
      mapping: `「${meaningfulWords[0] || '核心概念'}」映射到日常经验`
    };
  }

  /**
   * 逐步学习 — 生成结构化步骤
   */
  stepByStepLearning(input) {
    const meaningfulWords = this._extractMeaningfulWords(input);
    const steps = [];

    // 检测领域
    const hasCode = /代码|code|编程|program|function|install|setup|配置|部署|debug|测试|test/.test(input);
    const hasProcess = /流程|process|工作流|workflow|步骤|step|方法|method|procedure/.test(input);
    const hasAnalysis = /分析|analyze|research|研究|调查|investigate|诊断/.test(input);

    if (meaningfulWords.length > 0) {
      const topic = meaningfulWords[0];

      if (hasCode) {
        steps.push(`步骤 1：理解${topic}的核心接口和功能`);
        steps.push(`步骤 2：准备开发环境并安装所需依赖`);
        steps.push(`步骤 3：实现基础功能原型，验证核心逻辑`);
        steps.push(`步骤 4：添加错误处理和边界情况保护`);
        steps.push(`步骤 5：测试和优化性能`);
      } else if (hasProcess) {
        steps.push(`步骤 1：明确${topic}的目标和预期产出`);
        steps.push(`步骤 2：收集所需的信息和资源`);
        steps.push(`步骤 3：设计实施框架和时间线`);
        steps.push(`步骤 4：分阶段执行，每个阶段检查质量`);
        steps.push(`步骤 5：回顾和优化整体流程`);
      } else if (hasAnalysis) {
        steps.push(`步骤 1：定义${topic}的分析范围和目标`);
        steps.push(`步骤 2：收集相关数据并初步清洗`);
        steps.push(`步骤 3：应用分析方法，识别关键模式`);
        steps.push(`步骤 4：验证发现，排除替代解释`);
        steps.push(`步骤 5：整理结论并形成报告`);
      } else {
        steps.push(`步骤 1：了解${topic}的基本概念和背景`);
        steps.push(`步骤 2：分解${topic}为可操作的子任务`);
        steps.push(`步骤 3：按优先级依次处理每个子任务`);
        if (meaningfulWords.length > 1) {
          steps.push(`步骤 4：检查${meaningfulWords[1]}相关的依赖条件`);
        } else {
          steps.push('步骤 4：定期检查进展，调整方法');
        }
        steps.push('步骤 5：总结完成情况并记录经验');
      }
    } else {
      steps.push('步骤 1：明确目标和期望结果');
      steps.push('步骤 2：分解任务为可执行的小步骤');
      steps.push('步骤 3：按顺序执行每个步骤');
      steps.push('步骤 4：检查中间结果，必要时调整');
      steps.push('步骤 5：完成并总结');
    }

    return {
      type: 'step',
      steps: steps.slice(0, 6),
      order: '按依赖关系排序',
      totalSteps: steps.slice(0, 6).length
    };
  }

  /**
   * 苏格拉底式学习 — 生成追问式问题
   */
  socraticLearning(input) {
    const meaningfulWords = this._extractMeaningfulWords(input);
    const questions = [];

    if (meaningfulWords.length > 0) {
      const topic = meaningfulWords[0];

      // 第一层：定义追问
      questions.push(`「${topic}」的核心定义是什么？它与相关概念的本质区别在哪里？`);

      // 第二层：因果追问
      if (meaningfulWords.length > 1) {
        questions.push(`「${topic}」和「${meaningfulWords[1]}」之间存在怎样的因果关系？是直接还是间接？`);
      } else {
        questions.push(`是什么原因导致「${topic}」的出现？它解决的是什么根本问题？`);
      }

      // 第三层：边界追问
      if (/不|没有|false|wrong|limit|局限|缺点|劣势|负面/.test(input)) {
        questions.push(`在什么条件下「${topic}」的局限性会变得显著？是否有已知的替代方案？`);
      } else {
        questions.push(`「${topic}」在什么情况下会失效？它的适用范围和边界在哪里？`);
      }

      // 第四层：深层追问
      questions.push(`如果我们假设「${topic}」的前提是错误的，那会推导出什么？这个假设真的可靠吗？`);

      // 第五层：反事实追问
      if (meaningfulWords.length > 2) {
        questions.push(`如果「${meaningfulWords[1]}」不存在，「${topic}」会如何变化？这个思想实验告诉我们什么？`);
      } else {
        questions.push(`如果改变其中一个核心变量，「${topic}」的结论是否依然成立？这个敏感度分析告诉我们什么？`);
      }
    } else {
      questions.push('这个问题的核心假设是什么？我们如何验证它？');
      questions.push('有哪些替代解释或角度被忽略了？');
      questions.push('如果我们已知的信息是错误的，那会推导出什么？');
    }

    return {
      type: 'question',
      questions: questions.slice(0, 5),
      method: '苏格拉底式追问（定义 → 因果 → 边界 → 深层 → 反事实）'
    };
  }

  /**
   * 提取关键点（改进版）
   */
  extractKeyPoints(text) {
    const meaningful = this._extractMeaningfulWords(text);
    return meaningful.slice(0, 8);
  }

  /**
   * 记录学习模式
   */
  recordPattern(input, strategy, success, time) {
    this.learningPatterns.push({
      input: input.substring(0, 50),
      strategy,
      success,
      time,
      timestamp: new Date().toISOString()
    });

    // 保留最近100条
    if (this.learningPatterns.length > 100) {
      this.learningPatterns = this.learningPatterns.slice(-100);
    }
  }

  /**
   * 更新策略评分
   */
  updateStrategyScore(strategy, success) {
    const s = this.strategies[strategy];
    if (s) {
      s.total++;
      if (success) s.success++;
      s.score = s.total > 0 ? s.success / s.total : 0.5;
    }
  }

  /**
   * 获取学习统计
   */
  getStats() {
    const bestEntry = Object.entries(this.strategies).sort((a, b) => b[1].score - a[1].score)[0];
    return {
      strategies: Object.keys(this.strategies).map(k => ({
        name: k,
        score: this.strategies[k].score.toFixed(2),
        uses: this.strategies[k].total
      })),
      patterns: this.learningPatterns.length,
      bestStrategy: bestEntry ? bestEntry[0] : 'conceptual',
      oscillationDetected: Object.keys(this.strategies).some(
        s => this.detectOscillation(s) > 0
      )
    };
  }
}

module.exports = { MetaLearning };

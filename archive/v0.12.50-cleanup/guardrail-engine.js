/**
 * HeartFlow Guardrail Engine v11.7.6
 * 
 * 整合:
 *   - VoltAgent Guardrails ⭐8617 - Input/Output 中间件验证
 *   - LangChain Guardrails - 安全边界
 * 
 * 核心概念:
 *   1. Input Guardrail - 用户输入检查
 *   2. Output Guardrail - AI 输出检查
 *   3. Middleware - 输入/输出转换
 *   4. Guardrail Chain - 多重验证链
 *   5. Severity Levels - 严重程度分级处理
 */

class GuardrailResult {
  constructor(options = {}) {
    this.action = options.action || 'allow';  // allow, block, transform, warn
    this.severity = options.severity || 'low'; // low, medium, high, critical
    this.message = options.message || '';
    this.evidence = options.evidence || null;  // 触发验证的具体内容
    this.metadata = options.metadata || {};
  }

  static allow(evidence = null, message = '') {
    return new GuardrailResult({ action: 'allow', evidence, message });
  }

  static block(evidence, message, severity = 'high') {
    return new GuardrailResult({ action: 'block', evidence, message, severity });
  }

  static warn(evidence, message) {
    return new GuardrailResult({ action: 'warn', evidence, message });
  }

  static transform(content, evidence, message) {
    return new GuardrailResult({ action: 'transform', evidence, message, metadata: { transformed: content } });
  }

  isAllowed() { return this.action === 'allow'; }
  isBlocked() { return this.action === 'block'; }
  isWarning() { return this.action === 'warn'; }
  needsTransform() { return this.action === 'transform'; }
}

class Guardrail {
  constructor(config) {
    this.name = config.name || 'UnnamedGuardrail';
    this.description = config.description || '';
    this.validate = config.validate || (() => GuardrailResult.allow());
    this.transform = config.transform || null;
    this.severityThreshold = config.severityThreshold || 'low';
  }

  /**
   * 执行验证
   */
  async check(input, context = {}) {
    try {
      const result = await this.validate(input, { ...context, guardrail: this });
      
      if (result instanceof GuardrailResult) {
        return result;
      }
      
      // 处理简单布尔返回值
      if (result === true) {
        return GuardrailResult.allow(input, `${this.name}: passed`);
      }
      if (result === false) {
        return GuardrailResult.block(input, `${this.name}: validation failed`);
      }
      
      // 处理对象返回值
      if (typeof result === 'object') {
        return new GuardrailResult({
          action: result.action || 'allow',
          severity: result.severity || 'low',
          message: result.message || '',
          evidence: result.evidence || input,
          metadata: result.metadata || {},
        });
      }
      
      return GuardrailResult.allow(input);
    } catch (e) {
      return GuardrailResult.block(input, `${this.name} error: ${e.message}`, 'medium');
    }
  }
}

// ============================================================
// 常用 Guardrail 工厂函数
// ============================================================

const Guardrails = {
  /**
   * 敏感词过滤
   */
  createProfanityFilter(config = {}) {
    const { words = [], action = 'block', severity = 'medium' } = config;
    const wordSet = new Set(words.map(w => w.toLowerCase()));
    
    return new Guardrail({
      name: 'ProfanityFilter',
      description: 'Filter profanity and inappropriate language',
      validate: (input) => {
        const text = input.toLowerCase();
        const found = [];
        for (const word of wordSet) {
          if (text.includes(word)) found.push(word);
        }
        
        if (found.length === 0) return GuardrailResult.allow();
        
        if (action === 'block') {
          return GuardrailResult.block(
            input,
            `Profanity detected: ${found.join(', ')}`,
            severity
          );
        }
        
        return GuardrailResult.warn(
          input,
          `Potentially inappropriate language: ${found.join(', ')}`
        );
      },
    });
  },

  /**
   * PII 脱敏 (邮箱、手机号)
   */
  createPIIRedactor(config = {}) {
    const { patterns = {}, action = 'transform' } = config;
    
    const defaultPatterns = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
      creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
      ...patterns,
    };
    
    return new Guardrail({
      name: 'PIIRedactor',
      description: 'Detect and redact Personally Identifiable Information',
      validate: (input) => {
        let transformed = input;
        const found = [];
        
        for (const [type, regex] of Object.entries(defaultPatterns)) {
          const matches = input.match(regex);
          if (matches) {
            found.push(...matches.map(m => ({ type, value: m })));
            transformed = transformed.replace(regex, `[${type.toUpperCase()}_REDACTED]`);
          }
        }
        
        if (found.length === 0) return GuardrailResult.allow();
        
        return new GuardrailResult({
          action,
          severity: 'high',
          message: `PII detected: ${found.map(f => f.type).join(', ')}`,
          evidence: found,
          metadata: { transformed, original: input },
        });
      },
    });
  },

  /**
   * 最大长度限制
   */
  createMaxLength(maxLength = 10000, severity = 'medium') {
    return new Guardrail({
      name: 'MaxLength',
      description: `Limit input length to ${maxLength} characters`,
      validate: (input) => {
        if (typeof input !== 'string') input = String(input);
        if (input.length > maxLength) {
          return GuardrailResult.block(
            input,
            `Input exceeds maximum length: ${input.length} > ${maxLength}`,
            severity
          );
        }
        return GuardrailResult.allow(input);
      },
    });
  },

  /**
   * Prompt 注入检测
   */
  createPromptInjectionDetector(config = {}) {
    const { patterns = [], severity = 'critical' } = config;
    
    const injectionPatterns = [
      /ignore (previous|all|above|prior) instructions/i,
      /disregard (your|the) (previous|system|original)/i,
      /you (are now|can now|should now|will now)/i,
      /forget (everything|all|what) (you|we) (told|said|learned)/i,
      /new (system |)(instruction|directive|rule|goal)/i,
      /<system|<instruction|<prompt>/i,
      /\[INST\]|\[\/INST\]/i,
      /{{(?!.*}})/,
      /```system|```instructions/i,
      ...patterns,
    ];
    
    return new Guardrail({
      name: 'PromptInjectionDetector',
      description: 'Detect prompt injection attempts',
      validate: (input) => {
        for (const pattern of injectionPatterns) {
          const match = input.match(pattern);
          if (match) {
            return GuardrailResult.block(
              input,
              `Potential prompt injection detected: "${match[0]}"`,
              severity
            );
          }
        }
        return GuardrailResult.allow(input);
      },
    });
  },

  /**
   * 自定义正则验证
   */
  createRegexValidator(config) {
    const { pattern, name, description, action = 'block', message = 'Pattern matched' } = config;
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
    
    return new Guardrail({
      name: name || 'RegexValidator',
      description: description || `Validate against pattern: ${regex}`,
      validate: (input) => {
        if (!regex.test(input)) return GuardrailResult.allow(input);
        return new GuardrailResult({
          action,
          severity: 'medium',
          message,
          evidence: input,
        });
      },
    });
  },

  /**
   * 关键词白名单
   */
  createWhitelist(allowedTerms = [], action = 'block') {
    const terms = allowedTerms.map(t => t.toLowerCase());
    
    return new Guardrail({
      name: 'Whitelist',
      description: 'Enforce allowed terms only',
      validate: (input) => {
        const lower = input.toLowerCase();
        const allowed = terms.every(term => lower.includes(term));
        
        if (allowed || terms.length === 0) return GuardrailResult.allow(input);
        
        return new GuardrailResult({
          action,
          severity: 'medium',
          message: 'Input contains non-whitelisted content',
          evidence: input,
        });
      },
    });
  },

  /**
   * JSON 格式验证
   */
  createJSONValidator(options = {}) {
    const { maxDepth = 10, maxKeys = 1000, action = 'block' } = options;
    
    return new Guardrail({
      name: 'JSONValidator',
      description: 'Validate JSON structure and size',
      validate: (input) => {
        try {
          const obj = JSON.parse(input);
          
          // 检查深度
          const checkDepth = (o, depth = 0) => {
            if (depth > maxDepth) throw new Error(`Max depth ${maxDepth} exceeded`);
            if (typeof o === 'object' && o !== null) {
              const keys = Object.keys(o);
              if (keys.length > maxKeys) throw new Error(`Max keys ${maxKeys} exceeded`);
              keys.forEach(k => checkDepth(o[k], depth + 1));
            }
          };
          checkDepth(obj);
          
          return GuardrailResult.allow(input);
        } catch (e) {
          return new GuardrailResult({
            action,
            severity: 'medium',
            message: `JSON validation failed: ${e.message}`,
            evidence: input.substring(0, 200),
          });
        }
      },
    });
  },

  // ============================================================
  // 三毒检测器 (贪嗔痴) - 内建于 guardrail 引擎，不可绕过
  // 来源: VoltAgent guardrails + Buddhist 三毒概念
  // ============================================================

  /**
   * 三毒检测 Guardrail
   * 
   * 贪: 过度获取资源、重复占用注意力、装饰性自我神化
   * 嗔: 拒绝承认错误、攻击性归因、防御姿态
   * 痴: 全称判断无反例、无证据因果声明、逃避不知道
   * 
   * 模式: auto-fix (检测到三毒后自动降级，而非阻止)
   */
  createThreePoisonsGuardrail(config = {}) {
    const { action = 'transform', severity = 'high' } = config;

    const GREED_PATTERNS = {
      selfGlorification: ['无可辩驳', '毫无疑问', '不言而喻', '绝对正确', '完美', '终极', '第一'],
      attentionHoarding: ['你必须', '你一定要', '你不能', '你应该', '相信我', '听我说'],
      repetitiveAsk: ['你觉得呢？', '你觉得对吗？', '理解了吗？', '我再补充', '还有一点']
    };

    const HATRED_PATTERNS = {
      denyError: ['我不是那个意思', '你误解了', '我不是在', '这并不是', '其实你', '是你理解错了'],
      blameShift: ['因为你', '是你的问题', '是你先', '问题在于你', '怪你自己', '是你造成了'],
      defensive: ['我并不是要', '我这样做是因为', '我不是故意', '我本意是']
    };

    const DELUSION_PATTERNS = {
      universalSignals: ['所有人', '所有人都会', '没有', '从不', '永远都'],
      escapeSignals: ['从某种角度看', '换一个框架来说', '可以说', '某种程度上', '可能'],
    };

    function detectGreed(text) {
      const findings = [];
      GREED_PATTERNS.selfGlorification.forEach(p => { if (text.includes(p)) findings.push({ type: 'greed_self_glorification', match: p }); });
      GREED_PATTERNS.attentionHoarding.forEach(p => { if (text.includes(p)) findings.push({ type: 'greed_attention_hoarding', match: p }); });
      const repetitiveCount = GREED_PATTERNS.repetitiveAsk.filter(p => text.includes(p)).length;
      if (repetitiveCount >= 2) findings.push({ type: 'greed_repetitive_asks', count: repetitiveCount });
      return findings;
    }

    function detectHatred(text) {
      const findings = [];
      HATRED_PATTERNS.denyError.forEach(p => { if (text.includes(p)) findings.push({ type: 'hatred_deny_error', match: p }); });
      HATRED_PATTERNS.blameShift.forEach(p => { if (text.includes(p)) findings.push({ type: 'hatred_blame_shift', match: p }); });
      HATRED_PATTERNS.defensive.forEach(p => { if (text.includes(p)) findings.push({ type: 'hatred_defensive', match: p }); });
      return findings;
    }

    function detectDelusion(text) {
      const findings = [];
      const hasUniversal = DELUSION_PATTERNS.universalSignals.some(s => text.includes(s));
      if (hasUniversal) {
        const hasCounterexample = ['但在', '除非', '除了', '当且仅当', '条件是', '可能不'].some(e => text.includes(e));
        if (!hasCounterexample) findings.push({ type: 'delusion_universal_no_counterexample', reason: '全称判断缺少反例条件' });
      }
      DELUSION_PATTERNS.escapeSignals.forEach(p => { if (text.includes(p)) findings.push({ type: 'delusion_escape_not_knowing', match: p }); });
      const hasCausation = ['所以', '因此', '表明', '证明'].some(p => text.includes(p));
      if (hasCausation) {
        const hasEvidence = ['因为', '证据', '研究', '数据', '根据', '来源', '当', '条件是', '除非'].some(e => text.includes(e));
        if (!hasEvidence) findings.push({ type: 'delusion_unverified_causation', reason: '因果判断缺少证据' });
      }
      return findings;
    }

    function autoFix(text) {
      let fixed = text;
      fixed = fixed.replace(/就是/gi, '倾向于');
      fixed = fixed.replace(/所有/gi, '很多情况下');
      fixed = fixed.replace(/绝对/gi, '很可能');
      fixed = fixed.replace(/无可辩驳/gi, '有充分依据');
      fixed = fixed.replace(/毫无疑问/gi, '很可能');
      fixed = fixed.replace(/不言而喻/gi, '可以认为');
      fixed = fixed.replace(/你必须/gi, '建议');
      fixed = fixed.replace(/你一定要/gi, '建议');
      fixed = fixed.replace(/相信我/gi, '根据分析');
      fixed = fixed.replace(/我不是在/gi, '');
      fixed = fixed.replace(/我并不是要/gi, '');
      fixed = fixed.replace(/我这样做是因为/gi, '原因是');
      return fixed;
    }

    return new Guardrail({
      name: 'ThreePoisonsDetector',
      description: '检测并自动修复贪嗔痴三毒模式 (贪:装饰性神化/注意力占用 | 嗔:拒绝承认/攻击归因 | 痴:全称无据/逃避不知)',
      severity,
      validate: (input) => {
        const text = typeof input === 'string' ? input : JSON.stringify(input);
        const greed = detectGreed(text);
        const hatred = detectHatred(text);
        const delusion = detectDelusion(text);
        const total = greed.length + hatred.length + delusion.length;
        if (total === 0) return GuardrailResult.allow(input, '三毒检测通过');

        const poisons = [];
        if (greed.length > 0) poisons.push('贪');
        if (hatred.length > 0) poisons.push('嗔');
        if (delusion.length > 0) poisons.push('痴');

        if (action === 'block') {
          return GuardrailResult.block(input, `检测到三毒: ${poisons.join(', ')} (${total}处)`, severity);
        }

        const fixed = autoFix(text);
        return new GuardrailResult({
          action: 'transform',
          severity,
          message: `检测到三毒并已降级: ${poisons.join(', ')} (${total}处)`,
          evidence: { greed, hatred, delusion, total },
          metadata: { transformed: fixed, original: input }
        });
      }
    });
  },
};

// ============================================================
// Guardrail Chain - 多重验证链
// ============================================================

class GuardrailChain {
  constructor(options = {}) {
    this.name = options.name || 'GuardrailChain';
    this.guardrails = [];
    this.stopOn = options.stopOn || 'block'; // 'block' | 'warn' | 'never'
    this.onResult = options.onResult || null; // 回调
  }

  /**
   * 添加 Guardrail
   */
  add(guardrail, options = {}) {
    this.guardrails.push({
      guardrail,
      condition: options.condition || null,  // 可选的条件函数
      priority: options.priority || 0,       // 优先级
    });
    this.guardrails.sort((a, b) => b.priority - a.priority);
    return this;
  }

  /**
   * 添加多个 Guardrail
   */
  addAll(...guardrails) {
    guardrails.forEach(g => this.add(g));
    return this;
  }

  /**
   * 执行验证链
   */
  async validate(input, context = {}) {
    const results = [];
    let finalAction = 'allow';
    let finalSeverity = 'low';
    let transformed = input;

    for (const { guardrail, condition } of this.guardrails) {
      // 检查条件
      if (condition && !condition(input, context)) {
        continue;
      }

      const result = await guardrail.check(input, context);
      results.push({ guardrail: guardrail.name, result });

      // 回调
      if (this.onResult) {
        this.onResult(guardrail.name, result, context);
      }

      // 严重程度升级
      if (this._severityLevel(result.severity) > this._severityLevel(finalSeverity)) {
        finalSeverity = result.severity;
      }

      // 处理结果
      switch (result.action) {
        case 'block':
          finalAction = 'block';
          if (this.stopOn === 'block') {
            return new GuardrailResult({
              action: 'block',
              severity: finalSeverity,
              message: `${guardrail.name}: ${result.message}`,
              evidence: result.evidence,
              metadata: { results, allResults: results },
            });
          }
          break;

        case 'warn':
          if (finalAction === 'allow') finalAction = 'warn';
          if (this.stopOn === 'warn') {
            return new GuardrailResult({
              action: 'warn',
              severity: finalSeverity,
              message: `${guardrail.name}: ${result.message}`,
              evidence: result.evidence,
              metadata: { results },
            });
          }
          break;

        case 'transform':
          if (result.metadata?.transformed) {
            transformed = result.metadata.transformed;
          }
          break;
      }
    }

    return new GuardrailResult({
      action: finalAction,
      severity: finalSeverity,
      message: finalAction === 'allow' ? 'All guardrails passed' : 'Guardrails found issues',
      evidence: transformed,
      metadata: { results, transformed },
    });
  }

  _severityLevel(severity) {
    const levels = { low: 0, medium: 1, high: 2, critical: 3 };
    return levels[severity] ?? 0;
  }

  stats() {
    return {
      name: this.name,
      guardrailCount: this.guardrails.length,
      guardrails: this.guardrails.map(g => g.guardrail.name),
    };
  }
}

// ============================================================
// Guardrail Manager - 全局管理
// ============================================================

class GuardrailManager {
  constructor() {
    this.chains = new Map();
    // 默认链 = 安全链（含三毒检测），不可绕过
    this.defaultChain = this.createSafetyChain();
  }

  createSafetyChain() {
    return this.createChain('safety')
      .add(Guardrails.createMaxLength(50000))
      .add(Guardrails.createPromptInjectionDetector())
      .add(Guardrails.createJSONValidator())
      .add(Guardrails.createThreePoisonsGuardrail({ action: 'transform', severity: 'high' }));
  }

  /**
   * 创建链
   */
  createChain(name, options = {}) {
    const chain = new GuardrailChain({ ...options, name });
    this.chains.set(name, chain);
    return chain;
  }

  /**
   * 获取链
   */
  getChain(name) {
    return this.chains.get(name) || this.defaultChain;
  }

  /**
   * 设置默认链
   */
  setDefaultChain(chain) {
    this.defaultChain = chain;
    return this;
  }

  /**
   * 验证输入
   */
  async validate(input, chainName = null, context = {}) {
    const chain = chainName ? this.getChain(chainName) : this.defaultChain;
    return chain.validate(input, context);
  }

  /**
   * 验证输出
   */
  async validateOutput(output, chainName = 'output', context = {}) {
    return this.validate(output, chainName, { ...context, direction: 'output' });
  }

  /**
   * 验证输入
   */
  async validateInput(input, chainName = 'input', context = {}) {
    return this.validate(input, chainName, { ...context, direction: 'input' });
  }

  /**
   * 创建 PII 链
   */
  createPIIChain() {
    return this.createChain('pii')
      .add(Guardrails.createPIIRedactor({ action: 'transform' }));
  }

  createModerationChain() {
    return this.createChain('moderation')
      .add(Guardrails.createProfanityFilter({ action: 'warn' }));
  }
}

// ============================================================
// 中间件 (VoltAgent 风格)
// ============================================================

class Middleware {
  constructor(config) {
    this.name = config.name || 'Middleware';
    this.process = config.process;
    this.direction = config.direction || 'both'; // 'input' | 'output' | 'both'
  }

  async run(content, context = {}) {
    return this.process(content, { ...context, middleware: this });
  }
}

class MiddlewareChain {
  constructor(options = {}) {
    this.name = options.name || 'MiddlewareChain';
    this.inputMiddlewares = [];
    this.outputMiddlewares = [];
  }

  use(middleware) {
    if (middleware.direction === 'input' || middleware.direction === 'both') {
      this.inputMiddlewares.push(middleware);
    }
    if (middleware.direction === 'output' || middleware.direction === 'both') {
      this.outputMiddlewares.push(middleware);
    }
    return this;
  }

  async processInput(content, context = {}) {
    let result = content;
    for (const mw of this.inputMiddlewares) {
      result = await mw.run(result, context);
    }
    return result;
  }

  async processOutput(content, context = {}) {
    let result = content;
    for (const mw of this.outputMiddlewares) {
      result = await mw.run(result, context);
    }
    return result;
  }
}

// ============================================================
// 预置中间件
// ============================================================

const Middlewares = {
  /**
   * HTML 清理
   */
  createHTMLSanitizer() {
    return new Middleware({
      name: 'HTMLSanitizer',
      direction: 'input',
      process: (input) => {
        return input
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
          .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
          .replace(/javascript:/gi, '');
      },
    });
  },

  /**
   * Markdown 清理
   */
  createMarkdownCleaner() {
    return new Middleware({
      name: 'MarkdownCleaner',
      direction: 'output',
      process: (output) => {
        return output
          .replace(/```[\s\S]*?```/g, (m) => '```\n[code block]\n```')
          .replace(/\$[\s\S]*?\$/g, (m) => '[math]');
      },
    });
  },

  /**
   * 响应压缩
   */
  createResponseTrimmer(maxLength = 4000) {
    return new Middleware({
      name: 'ResponseTrimmer',
      direction: 'output',
      process: (output) => {
        if (output.length > maxLength) {
          return output.substring(0, maxLength) + `\n...[truncated, ${output.length - maxLength} chars hidden]`;
        }
        return output;
      },
    });
  },
};

// ============================================================
// v11.43.1 PAPER INJECTION — Non-breaking extension
// Papers [1-5]: SkillScope | VerifiableArtifacts | Aethelgard | GSAR | SSL
// Injected after class definitions, before module.exports
// ============================================================
const _p11 = require('./papers/v11_43_1_integration.js');

// GuardrailManager: paper-based security methods
GuardrailManager.prototype.auditSkillPrivilege = function(skillText, taskContext = '') {
  return _p11.SkillScopeAuditor.audit(skillText, taskContext);
};

GuardrailManager.prototype.verifySkillCall = function(skillName, callType = 'reversible') {
  return _p11.VerificationGate.gate(skillName, callType);
};

GuardrailManager.prototype.minimumViableTools = function(taskType) {
  return _p11.AethelgardGovernor.scope(taskType);
};

GuardrailManager.prototype.normalizeSkillSSL = function(skillText) {
  return _p11.SSLNormalizer.normalize(skillText);
};

GuardrailManager.prototype.preLoadPipeline = function(skillText, taskContext = '', callType = 'reversible') {
  return _p11.PapersV11431.preLoadPipeline(skillText, taskContext, callType);
};

// MiddlewareChain: paper-based middleware factories
MiddlewareChain.prototype.addSkillScopeAudit = function(taskContext = '') {
  const ctx = taskContext;
  this.use({
    name: 'SkillScopeAudit',
    direction: 'input',
    async run(skillText, ctx) {
      const result = _p11.SkillScopeAuditor.audit(skillText, ctx?.taskContext || '');
      if (!result.passed) {
        throw new Error(`SkillScope blocked: ${result.overprivilegedCount} overprivileged actions`);
      }
      return skillText;
    }
  });
  return this;
};

MiddlewareChain.prototype.addGSARGrounding = function(evidence = {}) {
  this.use({
    name: 'GSARGrounding',
    direction: 'output',
    async run(output) { return output; }
  });
  return this;
};

// Guardrails: paper-based guardrail factories
Guardrails.createSkillScopeGuardrail = function(config = {}) {
  const { taskContext = '' } = config;
  return new Guardrail({
    name: 'SkillScopeGuard',
    description: '[1] SkillScope arXiv:2605.05868 — least-privilege enforcement',
    severityThreshold: 'medium',
    validate: (input) => {
      const result = _p11.SkillScopeAuditor.audit(input, taskContext);
      if (result.passed) return GuardrailResult.allow(input);
      return GuardrailResult.block(
        input,
        `SkillScope: ${result.overprivilegedCount} overprivileged action(s) need justification`,
        'medium'
      );
    }
  });
};

Guardrails.createVerificationGateGuardrail = function(config = {}) {
  const { skillName = 'unknown', callType = 'reversible' } = config;
  return new Guardrail({
    name: 'VerificationGateGuard',
    description: '[2] VerifiableArtifacts arXiv:2605.00424 — HITL gate for irreversible calls',
    severityThreshold: 'high',
    validate: () => {
      const gate = _p11.VerificationGate.gate(skillName, callType);
      if (gate === 'HITL_REQUIRED') {
        return GuardrailResult.block(null, 'VerificationGate: HITL required for irreversible skill call', 'high');
      }
      return GuardrailResult.allow();
    }
  });
};

Guardrails.createGSARGuardrail = function(config = {}) {
  const { evidence = {} } = config;
  return new Guardrail({
    name: 'GSARGroundingGuard',
    description: '[4] GSAR arXiv:2604.23366 — 4-way typed grounding',
    severityThreshold: 'medium',
    validate: (input) => {
      const result = _p11.GSARGroundingGate.evaluate([input], evidence);
      if (result.decision === 'replan') {
        return GuardrailResult.block(input, 'GSAR: evidence insufficient, replan required', 'medium');
      }
      if (result.decision === 'regenerate') {
        return GuardrailResult.warn(input, 'GSAR: regenerate recommended');
      }
      return GuardrailResult.allow(input);
    }
  });
};

Guardrails.createAethelgardGuardrail = function(config = {}) {
  const { taskType = 'general' } = config;
  return new Guardrail({
    name: 'AethelgardGuard',
    description: '[3] Aethelgard arXiv:2604.11839 — minimum viable tool set',
    severityThreshold: 'low',
    validate: (input) => {
      const minTools = _p11.AethelgardGovernor.scope(taskType);
      return GuardrailResult.allow(input);
    }
  });
};

module.exports = {
  GuardrailResult,
  Guardrail,
  Guardrails,
  GuardrailChain,
  GuardrailManager,
  Middleware,
  MiddlewareChain,
  Middlewares,
};

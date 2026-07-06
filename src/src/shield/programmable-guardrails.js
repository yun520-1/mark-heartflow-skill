/**
 * HeartFlow v5.8.0 — 可编程安全护栏
 * 
 * 来源: NVIDIA NeMo Guardrails (https://github.com/NVIDIA/NeMo-Guardrails)
 * 功能: 声明式安全规则、可组合的流程编排
 */

class ProgrammableGuardrails {
  constructor(options = {}) {
    this.rails = new Map();     // railName → railDefinition
    this.flows = new Map();     // flowName → flowSteps
    this.railStats = new Map();   // railName → triggerCount
  }

  /**
   * 定义护栏
   * 
   * 护栏类型：
   * - input:  输入检查（用户消息）
   * - output: 输出检查（AI 回复）
   * - dialog: 对话检查（上下文）
   */
  defineRail(name, options) {
    /*
      options = {
        type: "input" | "output" | "dialog",
        condition: "contains" | "regex" | "semantic" | "custom",
        pattern: "...",           // 匹配模式
        action: "mask" | "refuse" | "redirect" | "log",
        maskChar: "*",            // mask 时的替换字符
        redirectTo: "...",       // redirect 时的目标
        message: "..."            // 拒绝时的提示消息
      }
    */
    const rail = {
      name,
      type: options.type || 'input',
      condition: options.condition || 'contains',
      pattern: options.pattern,
      action: options.action || 'log',
      maskChar: options.maskChar || '*',
      redirectTo: options.redirectTo || null,
      message: options.message || 'This message has been blocked by safety rails.',
      enabled: true,
      createdAt: new Date().toISOString()
    };

    this.rails.set(name, rail);
    this.railStats.set(name, 0);

    return rail;
  }

  /**
   * 定义流程（Colang 风格）
   * 
   * 流程步骤：
   * - check_input_rails:  检查输入护栏
   * - check_output_rails: 检查输出护栏
   * - generate_response:  生成回复
   * - call_tool:          调用工具
   * - output:             输出结果
   */
  defineFlow(name, steps) {
    /*
      steps = [
        { task: "check_input_rails" },
        { task: "generate_response" },
        { task: "check_output_rails" },
        { task: "output" }
      ]
    */
    const flow = {
      name,
      steps,
      createdAt: new Date().toISOString()
    };

    this.flows.set(name, flow);
    return flow;
  }

  /**
   * 执行流程
   */
  async executeFlow(flowName, input, context = {}) {
    const flow = this.flows.get(flowName);
    if (!flow) {
      throw new Error(`Flow ${flowName} not found`);
    }

    let currentContext = { input, ...context };
    const executionLog = [];

    for (const step of flow.steps) {
      const stepLog = {
        task: step.task,
        timestamp: new Date().toISOString(),
        status: 'pending'
      };

      try {
        if (step.task === 'check_input_rails') {
          const result = await this.checkInputRails(currentContext.input);
          currentContext = { ...currentContext, ...result };
          stepLog.status = result.blocked ? 'blocked' : 'passed';
        } else if (step.task === 'check_output_rails') {
          const result = await this.checkOutputRails(currentContext.response || currentContext.input);
          currentContext = { ...currentContext, ...result };
          stepLog.status = result.blocked ? 'blocked' : 'passed';
        } else if (step.task === 'generate_response') {
          // 调用外部 LLM 生成回复
          if (context.llmCaller) {
            const response = await context.llmCaller(currentContext.safeInput || currentContext.input);
            currentContext.response = response;
            stepLog.status = 'completed';
          } else {
            stepLog.status = 'skipped';
            stepLog.reason = 'No LLM caller provided';
          }
        } else if (step.task === 'output') {
          stepLog.status = 'completed';
        } else if (step.task === 'call_tool') {
          // 调用工具
          if (step.tool && context.toolCaller) {
            const result = await context.toolCaller(step.tool, step.params);
            currentContext.toolResult = result;
            stepLog.status = 'completed';
          }
        }

        executionLog.push(stepLog);

        // 如果被阻断，停止执行
        if (currentContext.blocked) {
          break;
        }
      } catch (error) {
        stepLog.status = 'error';
        stepLog.error = error.message;
        executionLog.push(stepLog);
        break;
      }
    }

    return {
      success: !currentContext.blocked,
      blocked: currentContext.blocked || false,
      reason: currentContext.reason || null,
      safeInput: currentContext.safeInput,
      safeResponse: currentContext.safeResponse,
      response: currentContext.response,
      executionLog
    };
  }

  /**
   * 检查输入护栏
   */
  async checkInputRails(input) {
    for (const [name, rail] of this.rails) {
      if (rail.type !== 'input' || !rail.enabled) continue;

      const violated = await this.checkRail(input, rail);
      
      if (violated) {
        this.railStats.set(name, (this.railStats.get(name) || 0) + 1);

        if (rail.action === 'refuse') {
          return {
            blocked: true,
            reason: rail.message,
            railName: name
          };
        } else if (rail.action === 'mask') {
          const masked = this.maskInput(input, rail);
          return {
            blocked: false,
            safeInput: masked,
            masked: true,
            railName: name
          };
        } else if (rail.action === 'redirect') {
          return {
            blocked: true,
            redirectTo: rail.redirectTo,
            railName: name
          };
        } else if (rail.action === 'log') {
          console.warn(`[Guardrails] Rail ${name} triggered (logged only)`);
        }
      }
    }

    return { blocked: false, safeInput: input };
  }

  /**
   * 检查输出护栏
   */
  async checkOutputRails(output) {
    for (const [name, rail] of this.rails) {
      if (rail.type !== 'output' || !rail.enabled) continue;

      const violated = await this.checkRail(output, rail);
      
      if (violated) {
        this.railStats.set(name, (this.railStats.get(name) || 0) + 1);

        if (rail.action === 'refuse') {
          return {
            blocked: true,
            reason: rail.message,
            railName: name
          };
        } else if (rail.action === 'mask') {
          const masked = this.maskInput(output, rail);
          return {
            blocked: false,
            safeOutput: masked,
            masked: true,
            railName: name
          };
        }
      }
    }

    return { blocked: false, safeOutput: output };
  }

  /**
   * 检查单个护栏
   */
  async checkRail(content, rail) {
    if (rail.condition === 'contains') {
      const patterns = Array.isArray(rail.pattern) ? rail.pattern : [rail.pattern];
      return patterns.some(p => content.includes(p));
    } else if (rail.condition === 'regex') {
      const regex = new RegExp(rail.pattern, 'i');
      return regex.test(content);
    } else if (rail.condition === 'semantic') {
      // 语义检查（需要外部 LLM 调用）
      if (rail.semanticChecker) {
        return await rail.semanticChecker(content, rail.pattern);
      }
      return false;
    } else if (rail.condition === 'custom') {
      if (rail.customChecker) {
        return await rail.customChecker(content);
      }
      return false;
    }

    return false;
  }

  /**
   * Mask 敏感信息
   */
  maskInput(input, rail) {
    const maskChar = rail.maskChar || '*';
    
    if (rail.condition === 'contains') {
      let masked = input;
      const patterns = Array.isArray(rail.pattern) ? rail.pattern : [rail.pattern];
      
      for (const pattern of patterns) {
        const regex = new RegExp(pattern, 'gi');
        masked = masked.replace(regex, match => maskChar.repeat(match.length));
      }
      
      return masked;
    }

    return input;  // 如果不支持，返回原输入
  }

  /**
   * 获取护栏统计
   */
  getRailStats() {
    const stats = {};
    for (const [name, count] of this.railStats) {
      stats[name] = {
        triggerCount: count,
        rail: this.rails.get(name)
      };
    }
    return stats;
  }

  /**
   * 启用/禁用护栏
   */
  toggleRail(name, enabled) {
    const rail = this.rails.get(name);
    if (rail) {
      rail.enabled = enabled;
      return true;
    }
    return false;
  }

  /**
   * 预定义常用护栏
   */
  setupDefaultRails() {
    // 1. 输入：检测 Prompt Injection
    this.defineRail('prompt_injection_input', {
      type: 'input',
      condition: 'contains',
      pattern: ['ignore previous instructions', 'forget all rules', 'you are now', 'act as if'],
      action: 'refuse',
      message: 'Potential prompt injection detected.'
    });

    // 2. 输出：检测敏感信息泄露
    this.defineRail('sensitive_info_output', {
      type: 'output',
      condition: 'regex',
      pattern: '\\b\\d{4}[- ]?\\d{4}[- ]?\\d{4}[- ]?\\d{4}\\b',  // 信用卡号
      action: 'mask',
      maskChar: 'X'
    });

    // 3. 输入：检测恶意代码
    this.defineRail('malicious_code_input', {
      type: 'input',
      condition: 'contains',
      pattern: ['import os', 'subprocess.call', 'eval(', 'exec(', '__import__'],
      action: 'refuse',
      message: 'Potentially dangerous code detected in input.'
    });

    // 4. 定义默认流程
    this.defineFlow('default', [
      { task: 'check_input_rails' },
      { task: 'generate_response' },
      { task: 'check_output_rails' },
      { task: 'output' }
    ]);

    console.log('[Guardrails] Default rails and flows set up.');
  }
}

module.exports = { ProgrammableGuardrails };

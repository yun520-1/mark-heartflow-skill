/**
 * HEARTCORE / guardrail-factory.js
 * Guardrail 工厂模式
 * 
 * 基于 VoltAgent guardrail.ts 架构
 * 来源: VoltAgent/voltagent ⭐8660 packages/core/src/agent/guardrail.ts
 * 
 * 创建标准化的 Input/Output Guardrail
 */

/**
 * @typedef {Object} GuardrailResult
 * @property {boolean} pass - 是否通过
 * @property {string} [verdict] - PASS | BLOCKED | AUTO_FIXED
 * @property {string} [reason] - 违规原因
 * @property {string} [modifiedOutput] - 自动修复后的输出
 * @property {object} [details] - 额外详情
 */

/**
 * @typedef {Object} InputGuardrailArgs
 * @property {string | object} input - 输入内容
 * @property {object} [context] - 上下文信息
 */

/**
 * @typedef {Object} OutputGuardrailArgs
 * @property {string | object} output - 输出内容
 * @property {object} [context] - 上下文信息
 */

/**
 * @typedef {Object} CreateInputGuardrailOptions
 * @property {string} [id] - 唯一标识
 * @property {string} name - 名称
 * @property {string} [description] - 描述
 * @property {string} [severity] - 严重程度: low | medium | high | critical
 * @property {Function} handler - 处理函数
 */

const DEFAULT_SEVERITY = 'medium';

/**
 * 创建 Input Guardrail
 * @param {CreateInputGuardrailOptions} options 
 * @returns {object}
 */
function createInputGuardrail(options) {
  const {
    id = `input-guardrail-${Date.now()}`,
    name,
    description = '',
    severity = DEFAULT_SEVERITY,
    handler
  } = options;

  if (!name) throw new Error('Input guardrail requires a name');
  if (!handler || typeof handler !== 'function') {
    throw new Error('Input guardrail requires a handler function');
  }

  return {
    id,
    name,
    description,
    severity,
    type: 'input',
    handler: async ({ input, context = {} }) => {
      try {
        const result = await handler({ input, context });
        return {
          pass: true,
          verdict: 'PASS',
          ...result
        };
      } catch (error) {
        return {
          pass: false,
          verdict: 'ERROR',
          reason: error.message,
          error: error.stack
        };
      }
    }
  };
}

/**
 * @typedef {Object} CreateOutputGuardrailOptions
 * @property {string} [id] - 唯一标识
 * @property {string} name - 名称
 * @property {string} [description] - 描述
 * @property {string} [severity] - 严重程度
 * @property {Function} handler - 处理函数
 * @property {Function} [streamHandler] - 流式输出处理器
 */

/**
 * 创建 Output Guardrail
 * @param {CreateOutputGuardrailOptions} options 
 * @returns {object}
 */
function createOutputGuardrail(options) {
  const {
    id = `output-guardrail-${Date.now()}`,
    name,
    description = '',
    severity = DEFAULT_SEVERITY,
    handler,
    streamHandler
  } = options;

  if (!name) throw new Error('Output guardrail requires a name');
  if (!handler || typeof handler !== 'function') {
    throw new Error('Output guardrail requires a handler function');
  }

  return {
    id,
    name,
    description,
    severity,
    type: 'output',
    handler: async ({ output, context = {} }) => {
      try {
        const result = await handler({ output, context });
        return {
          pass: true,
          verdict: 'PASS',
          ...result
        };
      } catch (error) {
        return {
          pass: false,
          verdict: 'ERROR',
          reason: error.message,
          error: error.stack
        };
      }
    },
    ...(streamHandler && { streamHandler })
  };
}

/**
 * 运行多个 Input Guardrails
 * @param {string | object} input 
 * @param {object[]} guardrails 
 * @param {object} [context] 
 * @returns {{ passed: boolean, results: object[], modifiedInput?: string }}
 */
async function runInputGuardrails(input, guardrails, context = {}) {
  const results = [];
  let currentInput = input;

  for (const guardrail of guardrails) {
    const result = await guardrail.handler({ input: currentInput, context });
    results.push({ guardrailId: guardrail.id, guardrailName: guardrail.name, ...result });

    if (!result.pass) {
      return { passed: false, results, blockedAt: guardrail.name };
    }

    // 如果 guardrail 修改了输入，继续用修改后的
    if (result.modifiedInput) {
      currentInput = result.modifiedInput;
    }
  }

  return { passed: true, results, modifiedInput: currentInput };
}

/**
 * 运行多个 Output Guardrails
 * @param {string | object} output 
 * @param {object[]} guardrails 
 * @param {object} [context] 
 * @returns {{ passed: boolean, results: object[], modifiedOutput?: string }}
 */
async function runOutputGuardrails(output, guardrails, context = {}) {
  const results = [];
  let currentOutput = output;

  for (const guardrail of guardrails) {
    const result = await guardrail.handler({ output: currentOutput, context });
    results.push({ guardrailId: guardrail.id, guardrailName: guardrail.name, ...result });

    if (!result.pass) {
      return { passed: false, results, blockedAt: guardrail.name };
    }

    if (result.modifiedOutput) {
      currentOutput = result.modifiedOutput;
    }
  }

  return { passed: true, results, modifiedOutput: currentOutput };
}

/**
 * 串联两个 guardrail（类似管道）
 * 第一个的输出作为第二个的输入
 */
function pipeGuardrails(first, second) {
  return {
    id: `pipe-${first.id}-${second.id}`,
    name: `Pipe: ${first.name} → ${second.name}`,
    type: first.type,
    handler: async ({ input, output, context }) => {
      if (first.type === 'input') {
        const r1 = await first.handler({ input, context });
        if (!r1.pass) return r1;
        return second.handler({ input: r1.modifiedInput || input, context });
      } else {
        const r1 = await first.handler({ output, context });
        if (!r1.pass) return r1;
        return second.handler({ output: r1.modifiedOutput || output, context });
      }
    }
  };
}

module.exports = {
  createInputGuardrail,
  createOutputGuardrail,
  runInputGuardrails,
  runOutputGuardrails,
  pipeGuardrails
};

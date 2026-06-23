/**
 * hooks-adapter.js — 引擎 × Claude Code Hooks 适配器
 *
 * 将 Claude Code 插件系统的 4 个核心 hooks 事件映射为引擎内部事件。
 *
 * ## 映射关系
 *
 * | Claude Code Hook        | 引擎事件                   | 触发时机                 |
 * |------------------------|---------------------------|-------------------------|
 * | SessionStart           | cognitive.boot            | 启动时加载认知底层        |
 * | UserPromptSubmit       | psychology.scan+intent    | 每次用户输入触发心理扫描+意图检测 |
 * | PostToolUse            | codeEngine.review+audit   | 工具调用后触发代码审查+安全审计 |
 * | Stop                   | lesson.extract+merge      | 会话结束触发教训提取+记忆合并 |
 *
 * ## 用法
 *
 *   const Hooks = require('./hooks-adapter.js');
 *   Hooks.onSessionStart({ sessionId, config });
 *   Hooks.onUserPromptSubmit({ text, context });
 *   Hooks.onPostToolUse({ toolName, toolInput, result });
 *   Hooks.onStop({ sessionId, summary });
 *
 * 每个处理器返回 { context, actions, metrics } 纯 JS 对象。
 *
 * @module hooks-adapter
 * @version 1.0.0
 * @license Proprietary
 */

'use strict';

// ─── 事件名称常量 ───────────────────────────────────────────────────────────

/** Claude Code 的 4 个标准 hook 事件 */
const HOOK_EVENTS = {
  SESSION_START:     'SessionStart',
  USER_PROMPT_SUBMIT:'UserPromptSubmit',
  POST_TOOL_USE:     'PostToolUse',
  STOP:              'Stop',
};

// ─── 处理器注册表 ────────────────────────────────────────────────────────────

/** @type {Map<string, Function[]>} 事件名 → 处理器列表 */
const _handlers = new Map();
for (const ev of Object.values(HOOK_EVENTS)) {
  _handlers.set(ev, []);
}

// ─── 默认处理器（当用户未注册自定义处理器时使用）────────────────────────────────

/**
 * SessionStart 默认处理器 — 加载认知底层
 *
 * 对应 Claude Code 的 hooks.json 中 SessionStart 阶段执行引导脚本。
 * 在引擎中，这等价于：
 *   - 初始化身份核心（identityCore）
 *   - 加载三层记忆系统
 *   - 注册元认知协议
 *
 * @param {object} params
 * @param {string} params.sessionId - 会话 ID
 * @param {object} [params.config] - 启动配置
 * @returns {{ context: object, actions: string[], metrics: object }}
 */
function _defaultSessionStart({ sessionId, config = {} }) {
  return {
    context: {
      event: HOOK_EVENTS.SESSION_START,
      sessionId,
      cognitiveLoad: {
        identity:    true,  // 加载身份核心
        memory:      true,  // 加载记忆系统
        meta:        true,  // 加载元认知协议
      },
      // 需要注入到引擎上下文的认知底层数据
      bootPayload: {
        timestamp: Date.now(),
        config: {
          rootPath: config.rootPath || null,
          debug:    config.debug || false,
        },
      },
    },
    actions: [
      'heartflow.start()',
      'identityCore.initialize()',
      'memory.loadCORE()',
      'meta.registerProtocols()',
    ],
    metrics: {
      hook: 'SessionStart',
      status: 'ok',
    },
  };
}

/**
 * UserPromptSubmit 默认处理器 — 心理扫描 + 意图检测
 *
 * 对应 Claude Code 的 hooks.json 中 UserPromptSubmit 阶段运行安全规则检查。
 * 在引擎中，这等价于：
 *   - 心理状态扫描（psychology.analyzePsychology）
 *   - 意图检测（truth.checkStatement / counterfactual）
 *   - 用户需求识别
 *
 * @param {object} params
 * @param {string} params.text - 用户输入文本
 * @param {object} [params.context] - 当前上下文快照
 * @returns {{ context: object, actions: string[], metrics: object }}
 */
function _defaultUserPromptSubmit({ text, context = {} }) {
  return {
    context: {
      event: HOOK_EVENTS.USER_PROMPT_SUBMIT,
      input: {
        text,
        length: text ? text.length : 0,
        timestamp: Date.now(),
      },
      // 心理扫描结果占位
      psychology: {
        scanRequired: true,
        intentDetection: true,
      },
      // 注入到引擎处理管道的上下文数据
      injection: {
        preProcess: [
          'psychology.analyzePsychology',
          'truth.checkStatement',
          'counterfactual.evaluate',
        ],
      },
    },
    actions: [
      'psychology.scan(text)',
      'intent.detect(text)',
      'emotion.assess(text)',
    ],
    metrics: {
      hook: 'UserPromptSubmit',
      textLength: text ? text.length : 0,
      status: 'pending',
    },
  };
}

/**
 * PostToolUse 默认处理器 — 代码审查 + 安全审计
 *
 * 对应 Claude Code 的 hooks.json 中 PostToolUse 阶段检查 Edit/Write/Bash 结果。
 * 在引擎中，这等价于：
 *   - 代码分析（codeEngine.analyzeCode）
 *   - 安全审计（codeEngine.reviewCode / auditCodebase）
 *   - 修复建议生成
 *
 * @param {object} params
 * @param {string} params.toolName - 使用的工具名（Edit, Write, Bash 等）
 * @param {object} [params.toolInput] - 工具输入
 * @param {object} [params.result] - 工具执行结果
 * @returns {{ context: object, actions: string[], metrics: object }}
 */
function _defaultPostToolUse({ toolName, toolInput = {}, result = {} }) {
  const isCodeTool = ['Edit', 'Write', 'MultiEdit', 'NotebookEdit'].includes(toolName);
  const isBashTool = toolName === 'Bash';
  const isGitCommit = isBashTool && (toolInput.command || '').startsWith('git commit');
  const isGitPush   = isBashTool && (toolInput.command || '').startsWith('git push');

  return {
    context: {
      event: HOOK_EVENTS.POST_TOOL_USE,
      tool: {
        name: toolName,
        input: toolInput,
        result,
        timestamp: Date.now(),
      },
      // 代码审查结果占位
      review: {
        needsReview: isCodeTool || isBashTool,
        needsSecurityAudit: isCodeTool || isGitCommit || isGitPush,
        patterns: [],     // 匹配的安全模式列表
        warnings: [],     // 检测到的警告
      },
      // 注入到引擎后处理管道的上下文数据
      injection: {
        postProcess: isCodeTool
          ? ['codeEngine.analyzeCode', 'codeEngine.reviewCode']
          : isGitCommit
            ? ['codeEngine.auditCodebase', 'lesson.extract']
            : [],
      },
    },
    actions: isCodeTool
      ? ['codeEngine.reviewCode(toolInput)', 'codeEngine.suggestFix()']
      : isGitCommit
        ? ['codeEngine.auditCodebase()', 'security.audit()']
        : [],
    metrics: {
      hook: 'PostToolUse',
      toolName,
      needsReview: isCodeTool || isBashTool,
      status: 'ok',
    },
  };
}

/**
 * Stop 默认处理器 — 教训提取 + 记忆合并
 *
 * 对应 Claude Code 的 hooks.json 中 Stop 阶段执行最终审查。
 * 在引擎中，这等价于：
 *   - 教训提取（lesson.extract / lesson.storage）
 *   - 记忆合并（dreamConsolidation / memory.consolidate）
 *   - 自我进化更新（self-evolution）
 *
 * @param {object} params
 * @param {string} params.sessionId - 会话 ID
 * @param {object} [params.summary] - 会话摘要
 * @returns {{ context: object, actions: string[], metrics: object }}
 */
function _defaultStop({ sessionId, summary = {} }) {
  return {
    context: {
      event: HOOK_EVENTS.STOP,
      sessionId,
      summary,
      // 教训提取配置
      learning: {
        extractLessons: true,
        mergeMemory: true,
        updateEvolution: true,
        consolidateDreams: false,  // 默认关闭，由配置控制
      },
      // 注入到引擎结束处理管道的上下文数据
      injection: {
        finalize: [
          'lesson.extractLessons',
          'meaningfulMemory.consolidate',
          'selfEvolution.update',
        ],
      },
    },
    actions: [
      'lesson.extractLessons(summary)',
      'memory.consolidate(sessionId)',
      'selfEvolution.update()',
    ],
    metrics: {
      hook: 'Stop',
      sessionId,
      lessonsExtracted: true,
      status: 'ok',
    },
  };
}

// ─── 默认处理器映射表 ────────────────────────────────────────────────────────

const _defaultHandlers = {
  [HOOK_EVENTS.SESSION_START]:      _defaultSessionStart,
  [HOOK_EVENTS.USER_PROMPT_SUBMIT]: _defaultUserPromptSubmit,
  [HOOK_EVENTS.POST_TOOL_USE]:      _defaultPostToolUse,
  [HOOK_EVENTS.STOP]:               _defaultStop,
};

// ─── 公开 API ────────────────────────────────────────────────────────────────

const Hooks = {
  /**
   * 注册自定义事件处理器
   * @param {string} event - HOOK_EVENTS 中的事件名
   * @param {Function} handler - (params) => { context, actions, metrics }
   */
  on(event, handler) {
    if (!_handlers.has(event)) {
      throw new Error(`Unknown hook event: ${event}. Valid: ${Object.values(HOOK_EVENTS).join(', ')}`);
    }
    if (typeof handler !== 'function') {
      throw new Error('Handler must be a function');
    }
    _handlers.get(event).push(handler);
  },

  /**
   * 移除指定事件的所有处理器，恢复默认
   * @param {string} event - HOOK_EVENTS 中的事件名
   */
  off(event) {
    if (_handlers.has(event)) {
      _handlers.set(event, []);
    }
  },

  /**
   * 触发 SessionStart 事件
   * @param {object} params - 事件参数
   * @returns {object} 合并后的 { context, actions, metrics }
   */
  onSessionStart(params = {}) {
    return _runHandlers(HOOK_EVENTS.SESSION_START, params);
  },

  /**
   * 触发 UserPromptSubmit 事件
   * @param {object} params - 事件参数
   * @returns {object} 合并后的 { context, actions, metrics }
   */
  onUserPromptSubmit(params = {}) {
    return _runHandlers(HOOK_EVENTS.USER_PROMPT_SUBMIT, params);
  },

  /**
   * 触发 PostToolUse 事件
   * @param {object} params - 事件参数
   * @returns {object} 合并后的 { context, actions, metrics }
   */
  onPostToolUse(params = {}) {
    return _runHandlers(HOOK_EVENTS.POST_TOOL_USE, params);
  },

  /**
   * 触发 Stop 事件
   * @param {object} params - 事件参数
   * @returns {object} 合并后的 { context, actions, metrics }
   */
  onStop(params = {}) {
    return _runHandlers(HOOK_EVENTS.STOP, params);
  },

  /**
   * 获取所有可用事件名
   * @returns {string[]}
   */
  events() {
    return Object.values(HOOK_EVENTS);
  },

  /**
   * 重置所有处理器到默认状态
   */
  reset() {
    for (const ev of Object.values(HOOK_EVENTS)) {
      _handlers.set(ev, []);
    }
  },

  /** 事件名称常量 */
  EVENTS: HOOK_EVENTS,
};

/**
 * 运行指定事件的所有已注册处理器（含默认兜底）
 * @param {string} event
 * @param {object} params
 * @returns {{ context: object, actions: string[], metrics: object }}
 * @private
 */
function _runHandlers(event, params) {
  const handlers = _handlers.get(event) || [];

  // 合并结果：有自定义处理器则全部运行并合并，否则用默认
  if (handlers.length === 0) {
    const defaultHandler = _defaultHandlers[event];
    return defaultHandler ? defaultHandler(params) : {
      context: { event },
      actions: [],
      metrics: { hook: event, status: 'noop' },
    };
  }

  // 合并所有自定义处理器的结果
  const merged = {
    context: { event },
    actions: [],
    metrics: { hook: event },
  };

  for (const handler of handlers) {
    try {
      const result = handler(params);
      if (result) {
        if (result.context) Object.assign(merged.context, result.context);
        if (Array.isArray(result.actions)) merged.actions.push(...result.actions);
        if (result.metrics) Object.assign(merged.metrics, result.metrics);
      }
    } catch (err) {
      merged.metrics.error = err.message;
      merged.metrics.status = 'error';
    }
  }

  return merged;
}

// ─── 导出 ────────────────────────────────────────────────────────────────────

module.exports = { Hooks, HOOK_EVENTS, _defaultHandlers };

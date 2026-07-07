/**
 * code-writer.js — 代码编写引擎 facade
 *
 * 核心逻辑委托给 writer-core.js，语言特定模板由 language-adapters/*.js 提供。
 *
 * 架构：
 *   code-writer.js          — facade（预装所有适配器，导出 CodeWriter）
 *   writer-core.js          — 核心逻辑（意图分析、代码组合、审查、格式化）
 *   language-adapters/*.js  — 语言特定（模板、测试生成器、格式化规则）
 *
 * @module code-writer
 * @permission execute_code — 生成可直接执行的代码，请谨慎使用
 */

'use strict';

// ============================================================
// 子模块导入
// ============================================================

const { CodeWriter, INTENT, CONFIDENCE, INTENT_RULES } = require('./writer-core');

// 语言适配器（按需加载，缺失时跳过）
const ADAPTERS = {};
const ADAPTER_FILES = {
  javascript: './language-adapters/javascript-adapter',
  python:     './language-adapters/python-adapter',
  java:       './language-adapters/java-adapter',
  go:         './language-adapters/go-adapter',
  rust:       './language-adapters/rust-adapter',
  swift:      './language-adapters/swift-adapter',
  kotlin:     './language-adapters/kotlin-adapter'
};

for (const [name, modPath] of Object.entries(ADAPTER_FILES)) {
  try {
    ADAPTERS[name] = require(modPath);
  } catch {
    // 适配器文件不存在时静默跳过
  }
}

// ============================================================
// 带默认适配器的 CodeWriter
// ============================================================

class CodeWriterWithDefaults extends CodeWriter {
  /**
   * 创建预装适配器的 CodeWriter 实例
   * @param {Object} [options]
   * @param {Object} [options.adapters={}] - 额外适配器（合并到默认适配器）
   */
  constructor(options = {}) {
    super({
      ...options,
      adapters: { ...ADAPTERS, ...(options.adapters || {}) }
    });
  }
}

// ============================================================
// 导出
// ============================================================

module.exports = {
  CodeWriter: CodeWriterWithDefaults,
  INTENT,
  CONFIDENCE,
  INTENT_RULES
};

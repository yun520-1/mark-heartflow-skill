/**
 * HeartFlow CodeGenerator v2.0.0
 *
 * 代码生成引擎 facade - 心虫核心模块
 *
 * 特性：
 * - 本地模板优先（零成本），LLM 作为 fallback
 * - 支持 6 种语言：javascript, typescript, python, bash, go, rust
 * - 模板按语言+类型分类：algorithm/structure/network/io
 * - 生成结果带置信度评分
 * - 与 MeaningfulMemory 打通，记录成功生成模式
 *
 * @author HeartFlow Team
 *
 * 模块拆分：
 * - generator-core.js    — 核心生成逻辑
 * - prompt-factory.js    — 提示词模板和语言适配
 * - generator-validator.js — 代码验证和错误修复
 */

const { CodeGenerator } = require('./generator-core');
const { TEMPLATES } = require('./prompt-factory');

// ============================================================
// 导出
// ============================================================

module.exports = { CodeGenerator, TEMPLATES };

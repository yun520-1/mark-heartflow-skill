/**
 * src/llm/task-classifier-fallback.js — 任务分类 LLM 兜底
 *
 * 契约（thought-chain.js / engine-reasoner.js 调用点）：
 *   _llmFallback(input, matchedPatterns) → Promise<{type, confidence}>
 *
 * 用途：规则引擎任务分类置信度 < 0.7 时，让大模型帮分类。
 * 结合 + 冗余：规则快判，LLM 兜底，结果再经 gate 校验。
 */

'use strict';
const { chat } = require('./llm-client.js');

// 心虫任务类型枚举（与 thought-chain 对齐）
const TASK_TYPES = ['general', 'calculation', 'judgment', 'creative', 'debate', 'reflection', 'emotion', 'memory'];

/**
 * 任务分类 LLM 兜底
 * @param {string} input - 用户输入
 * @param {string[]} matchedPatterns - 规则已匹配的模式（参考）
 * @returns {Promise<{type: string, confidence: number}>}
 */
async function classifyTaskWithLLM(input, matchedPatterns = []) {
  const system = `你是任务分类器。把用户输入分类为以下类型之一：
${TASK_TYPES.join(', ')}

规则：
- calculation: 数学计算、数值推理、概率
- judgment: 对错判断、价值判断、是否合理
- creative: 创造、设计、想象、写故事
- debate: 辩论、论证、正反观点
- reflection: 自我反思、回顾
- emotion: 情绪表达、心理状态
- memory: 回忆、记忆查询
- general: 其他一般问题

只输出 JSON：{"type": "...", "confidence": 0.0-1.0}`;

  const user = `输入：${input.slice(0, 800)}
规则已匹配模式：${matchedPatterns.join(', ') || '无'}

请分类。`;

  try {
    const { content } = await chat(system, user, { maxTokens: 100, temperature: 0.1 });
    // 解析 JSON（容忍 markdown 代码块）
    const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const match = jsonStr.match(/\{[\s\S]*\}/);
    if (!match) return { type: 'general', confidence: 0.5, error: 'LLM 返回非 JSON' };
    const parsed = JSON.parse(match[0]);
    const type = TASK_TYPES.includes(parsed.type) ? parsed.type : 'general';
    const confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0.5));
    return { type, confidence };
  } catch (e) {
    return { type: 'general', confidence: 0.3, error: e.message };
  }
}

module.exports = { classifyTaskWithLLM, TASK_TYPES };

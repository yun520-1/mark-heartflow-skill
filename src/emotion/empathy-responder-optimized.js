/**
 * 共情系统 LLM 优化版
 * 
 * 优化：当检索模型找不到合适回应时，调用 LLM API 生成共情回应
 */

const fs = require('fs');
const path = require('path');

class EmpathyResponderOptimized {
  constructor(options = {}) {
    this.modelPath = options.modelPath || path.join(__dirname, '..', '..', 'models', 'empathy_retrieval.json');
    this.model = null;  // 延迟加载
    this.llmApiKey = options.llmApiKey || process.env.HEARTFLOW_API_KEY || '';
    this.llmApiBase = options.llmApiBase || process.env.TENCENT_API_BASE || 'https://copilot.tencent.com/v2';
    this.useLLM = options.useLLM !== false;  // 默认启用 LLM 后备
  }

  /**
   * 生成共情回应（优先用检索模型，失败时用 LLM）
   * @param {string} userMessage - 用户消息
   * @returns {string} - 共情回应
   */
  async generate(userMessage) {
    // 1. 尝试检索模型
    const retrievalResponse = this._retrieveResponse(userMessage);
    if (retrievalResponse) {
      return retrievalResponse;
    }

    // 2. 检索失败，用 LLM 生成
    if (this.useLLM && this.llmApiKey) {
      const llmResponse = await this._generateWithLLM(userMessage);
      if (llmResponse) {
        return llmResponse;
      }
    }

    // 3. 都失败，返回默认回应
    return '你并不孤单，我们一起面对。';
  }

  /**
   * 检索模型
   */
  _retrieveResponse(userMessage) {
    if (!this.model) {
      this._loadModel();
    }
    if (!this.model || !this.model.responses) {
      return null;
    }

    // 简化：找第一个包含关键词的回应
    const keywords = userMessage.split('').slice(0, 5).join('');
    const matched = this.model.responses.find(r => 
      r.keywords && r.keywords.some(k => userMessage.includes(k))
    );

    return matched ? matched.response : null;
  }

  /**
   * 用 LLM 生成共情回应
   */
  async _generateWithLLM(userMessage) {
    try {
      const prompt = `你是一个共情咨询师。用户说："${userMessage}"。生成一个简短、温暖、共情的回应（不超过 50 字）。`;

      const response = await fetch(`${this.llmApiBase}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.llmApiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-v3',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 100,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        console.warn('[EmpathyResponderOptimized] LLM 调用失败：', response.statusText);
        return null;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();
      return content || null;
    } catch (err) {
      console.warn('[EmpathyResponderOptimized] LLM 调用异常：', err.message);
      return null;
    }
  }

  /**
   * 加载模型
   */
  _loadModel() {
    try {
      if (fs.existsSync(this.modelPath)) {
        const content = fs.readFileSync(this.modelPath, 'utf-8');
        this.model = JSON.parse(content);
        console.log(`[EmpathyResponderOptimized] 模型已加载（${this.model.responses?.length || 0} 个样本）`);
      } else {
        console.log(`[EmpathyResponderOptimized] 模型不存在：${this.modelPath}`);
        this.model = { responses: [] };
      }
    } catch (err) {
      console.error('[EmpathyResponderOptimized] 加载模型失败：', err.message);
      this.model = { responses: [] };
    }
  }
}

module.exports = { EmpathyResponderOptimized };

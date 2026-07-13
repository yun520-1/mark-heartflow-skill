'use strict';
/**
 * reference-impl/adaptive-learning.js
 * 自适应学习引擎 —— 对应增强提示词第 3 点（自适应学习能力 / AI 辅助人类智力提升）。
 *
 * 与现有 selfCorrectionLoop（只记"系统错误修正"）的区别：
 *  - 建模「用户认知成长」：跟踪偏差频次、澄清接受率、知识盲点，跨轮累积。
 *  - 闭环推送：某盲点反复触发 → 主动给反问/微课，而非每次重复解释。
 *  - 驱动个性化挑战（参考 cognitiveLoadV2.flowState 的 challenge/skill 匹配）。
 */
const fs = require('fs');
const path = require('path');
const { makeLogger } = require('./logger');
const log = makeLogger(() => (process.env.LOG_LEVEL || 'info'));

class AdaptiveLearningEngine {
  constructor({ storeDir, memory } = {}) {
    this.memory = memory;
    this.storeDir = storeDir || path.join(process.env.HEARTFLOW_DIR || '.', 'profiles');
    this.profiles = new Map();
  }

  _key(userId) { return userId || 'anonymous'; }

  /** 每次交互后调用，更新用户认知档案（异步落盘，不阻塞热路径）。 */
  async recordInteraction(userId, { input, decision, reflection, biasTriggered } = {}) {
    const k = this._key(userId);
    const p =
      this.profiles.get(k) ||
      { blindspots: {}, clarificationsAccepted: 0, clarificationsOffered: 0, topics: {}, updatedAt: 0 };

    if (biasTriggered) p.blindspots[biasTriggered] = (p.blindspots[biasTriggered] || 0) + 1;
    if (reflection && reflection.needsClarification) p.clarificationsOffered++;
    if (decision && decision.userAcceptedClarification) p.clarificationsAccepted++;
    if (input) {
      const t = (input.match(/[\u4e00-\u9fa5a-zA-Z]+/g) || []).slice(0, 6).join(' ');
      if (t) p.topics[t] = (p.topics[t] || 0) + 1;
    }
    p.updatedAt = Date.now();
    this.profiles.set(k, p);
    await this._persist(k, p);
    return p;
  }

  async getProfile(userId) {
    const k = this._key(userId);
    if (this.profiles.has(k)) return this.profiles.get(k);
    // 尝试从磁盘恢复
    try {
      const file = path.join(this.storeDir, `${k}.json`);
      if (fs.existsSync(file)) {
        const p = JSON.parse(fs.readFileSync(file, 'utf8'));
        this.profiles.set(k, p);
        return p;
      }
    } catch (e) {
      log.warn('load profile failed', { error: e.message });
    }
    return null;
  }

  /** 主动推送：某盲点复发 → 给反问/微课（闭环），而非重复解释。 */
  nextNudge(userId) {
    const p = this.profiles.get(this._key(userId));
    if (!p) return null;
    const top = Object.entries(p.blindspots).sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] >= 3) {
      return { type: 'bias_nudge', bias: top[0], times: top[1] };
    }
    if (p.clarificationsOffered - p.clarificationsAccepted >= 3) {
      return { type: 'reflection_nudge', hint: '你多次未确认澄清，是否愿意一起核对前提？' };
    }
    return null;
  }

  async _persist(k, p) {
    try {
      await fs.promises.mkdir(this.storeDir, { recursive: true });
      await fs.promises.writeFile(path.join(this.storeDir, `${k}.json`), JSON.stringify(p), 'utf8');
    } catch (e) {
      log.warn('persist profile failed', { error: e.message });
    }
  }
}

module.exports = AdaptiveLearningEngine;

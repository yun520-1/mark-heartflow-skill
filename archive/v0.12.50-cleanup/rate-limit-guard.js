/**
 * HeartFlow RateLimitGuard v11.34.4
 *
 * 全局限速感知器：防止多个模块同时在限速期间继续发送请求。
 *
 * 背景问题：
 * - 每个模块独立检测限速，不知道全局是否已经触发限速
 * - cron 任务 + 手动升级 + GitHub 升级可能同时触发
 * - 导致限速加剧（连续 429）
 *
 * 解决方案：
 * - 全局单例，任何模块在遇到 429 时调用 notifyRateLimited()
 * - 所有 API 调用前先调用 check()，限速期间等待
 *
 * 使用方式（单例）：
 *   const guard = require('./rate-limit-guard.js').getInstance();
 *   guard.check();           // { allowed: true } 或 { allowed: false, waitMs: N }
 *   guard.notifyRateLimited(30000);  // 触发 429 后调用
 */

const STATE_FILE = require('path').join(__dirname, '..', '..', 'memory', 'states', 'rate-limit-state.json');
const fs = require('fs');

class RateLimitGuard {
  constructor() {
    this.isLimited = false;
    this.retryAfter = null;        // timestamp
    this.retryAfterMs = null;      // 原始 ms 值
    this.requestCount = 0;
    this.windowStart = Date.now();
    this.consecutive429s = 0;
    this._load();
  }

  _load() {
    try {
      if (fs.existsSync(STATE_FILE)) {
        const s = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
        if (s.isLimited && s.retryAfter > Date.now()) {
          this.isLimited = true;
          this.retryAfter = s.retryAfter;
          this.retryAfterMs = s.retryAfterMs;
        }
      }
    } catch (_) {}
  }

  _save() {
    try {
      const dir = require('path').dirname(STATE_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(STATE_FILE, JSON.stringify({
        isLimited: this.isLimited,
        retryAfter: this.retryAfter,
        retryAfterMs: this.retryAfterMs,
        savedAt: Date.now(),
      }, null, 2));
    } catch (_) {}
  }

  /**
   * 检查当前是否允许发送请求
   * @returns { allowed: boolean, waitMs: number|null }
   */
  check() {
    if (this.isLimited && Date.now() < this.retryAfter) {
      return { allowed: false, waitMs: this.retryAfter - Date.now() };
    }
    if (this.isLimited) {
      this.isLimited = false;
      this.retryAfter = null;
      this.retryAfterMs = null;
    }
    return { allowed: true };
  }

  /**
   * 被限速时调用（429/503/429 状态码）
   * @param {number} retryAfterMs - 服务端返回的等待毫秒数
   */
  notifyRateLimited(retryAfterMs = 60000) {
    this.isLimited = true;
    this.retryAfter = Date.now() + retryAfterMs;
    this.retryAfterMs = retryAfterMs;
    this.consecutive429s++;
    this._save();

    console.log(`[RateLimitGuard] ⚠️ 全局限速触发，等待 ${retryAfterMs}ms (第${this.consecutive429s}次连续429)`);
  }

  /**
   * 请求成功时调用（清除连续429计数）
   */
  notifySuccess() {
    this.consecutive429s = 0;
  }

  /**
   * 强制重置（手动取消限速）
   */
  reset() {
    this.isLimited = false;
    this.retryAfter = null;
    this.retryAfterMs = null;
    this.consecutive429s = 0;
    this._save();
    console.log('[RateLimitGuard] 全局限速已重置');
  }

  /**
   * 当前状态快照
   */
  status() {
    return {
      isLimited: this.isLimited,
      waitMs: this.isLimited ? Math.max(0, this.retryAfter - Date.now()) : 0,
      retryAfterMs: this.retryAfterMs,
      consecutive429s: this.consecutive429s,
    };
  }
}

// 单例
let _instance = null;
module.exports.getInstance = () => {
  if (!_instance) _instance = new RateLimitGuard();
  return _instance;
};
module.exports.RateLimitGuard = RateLimitGuard;

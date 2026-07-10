/**
 * fetch-safe.js — [AUDIT-FIX M-04] 安全的网络请求工具
 * 所有 fetch 调用必须带超时，防止挂起
 */

const DEFAULT_TIMEOUT = 10000; // 10秒默认超时
const DEFAULT_MAX_RETRIES = 2;

/**
 * 带超时的安全 fetch
 * @param {string} url - 请求URL
 * @param {Object} [options] - fetch 选项
 * @param {number} [options.timeout=10000] - 超时毫秒
 * @param {number} [options.maxRetries=2] - 最大重试次数
 * @returns {Promise<Response>}
 */
async function safeFetch(url, options = {}) {
  const { timeout = DEFAULT_TIMEOUT, maxRetries = DEFAULT_MAX_RETRIES, ...fetchOpts } = options;
  
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, { ...fetchOpts, signal: controller.signal });
      clearTimeout(timer);
      return response;
    } catch (e) {
      clearTimeout(timer);
      lastError = e;
      if (e.name === 'AbortError') {
        lastError = new Error(`fetch timeout after ${timeout}ms: ${url}`);
      }
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); // 指数退避
      }
    }
  }
  throw lastError;
}

module.exports = { safeFetch, DEFAULT_TIMEOUT };

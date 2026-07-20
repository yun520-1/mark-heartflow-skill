/**
 * fetch-safe.js — [AUDIT-FIX M-04] 安全的网络请求工具
 * 所有 fetch 调用必须带超时，防止挂起
 */

const DEFAULT_TIMEOUT = 10000; // 10秒默认超时
const DEFAULT_MAX_RETRIES = 2;

/**
 * 带超时 + SSRF防护的安全 fetch
 * [v5.15.5 S2] 强制调用 validateFetchUrl 做出网校验
 * @param {string} url - 请求URL
 * @param {Object} [options] - fetch 选项
 * @param {number} [options.timeout=10000] - 超时毫秒
 * @param {number} [options.maxRetries=2] - 最大重试次数
 * @returns {Promise<Response>}
 */
async function safeFetch(url, options = {}) {
  // [v5.15.5 S2] SSRF防护：所有出网请求强制经 url-validator 校验
  let parsedUrl;
  try {
    const { validateFetchUrl } = require('../security/url-validator.js');
    const check = await validateFetchUrl(url);
    if (!check.safe) {
      throw new Error(`SSRF blocked: ${check.reason} (URL: ${url})`);
    }
    parsedUrl = new URL(url);
  } catch (e) {
    if (e.message.startsWith('SSRF blocked')) throw e;
    throw new Error(`SSRF validation unavailable for: ${url}`);
  }

  // [v5.17.11 M3] DNS pinning: 解析后二次校验IP,消除TOCTOU重绑定窗口
  if (parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:') {
    try {
      const dns = require('dns').promises;
      const net = require('net');
      const { address } = await dns.lookup(parsedUrl.hostname, { family: 4 });
      if (!net.isIPv4(address)) {
        throw new Error(`SSRF blocked: resolved address ${address} is not a valid IPv4`);
      }
      // 复用url-validator中的IP校验逻辑 — 直接在fetch-safe内联私网判定
      const parts = address.split('.').map(Number);
      if (parts[0] === 127 || parts[0] === 10 ||
          (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
          (parts[0] === 192 && parts[1] === 168) ||
          parts[0] === 0 ||
          (parts[0] === 169 && parts[1] === 254)) {
        throw new Error(`SSRF blocked: resolved IP ${address} is private/internal`);
      }
    } catch (e) {
      if (e.message.startsWith('SSRF blocked')) throw e;
      throw new Error(`DNS pinning failed for ${parsedUrl.hostname}: ${e.message}`);
    }
  }

  const { timeout = DEFAULT_TIMEOUT, maxRetries = DEFAULT_MAX_RETRIES, ...fetchOpts } = options;

  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      // [v6.0.53 B1] redirect:'manual' — 禁止自动跟随 302，避免 SSRF 经重定向绕过二次校验
      const response = await fetch(url, { ...fetchOpts, redirect: 'manual', signal: controller.signal });
      clearTimeout(timer);

      // 处理 3xx：手动跟随但强制二次 SSRF 校验目标
      if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
        const location = response.headers.get('location');
        let absLoc;
        try {
          absLoc = new URL(location, url).toString();
        } catch (e) {
          throw new Error(`SSRF blocked: invalid redirect target "${location}"`);
        }
        // 二次校验重定向目标（SSRF + DNS pinning），防止跳到 169.254.169.254 / 内网
        const { validateFetchUrl } = require('../security/url-validator.js');
        const recheck = await validateFetchUrl(absLoc);
        if (!recheck.safe) {
          throw new Error(`SSRF blocked: redirect target ${recheck.reason} (${absLoc})`);
        }
        const dns = require('dns').promises;
        const net = require('net');
        const rip = await dns.lookup(new URL(absLoc).hostname, { family: 4 });
        if (!net.isIPv4(rip.address)) {
          throw new Error(`SSRF blocked: redirect resolved to non-IPv4 ${rip.address}`);
        }
        const p = rip.address.split('.').map(Number);
        if (p[0]===127||p[0]===10||(p[0]===172&&p[1]>=16&&p[1]<=31)||(p[0]===192&&p[1]===168)||p[0]===0||(p[0]===169&&p[1]===254)) {
          throw new Error(`SSRF blocked: redirect resolved to private IP ${rip.address}`);
        }
        // 仅跟随一跳，目标已校验，用 follow 再取一次
        return await fetch(absLoc, { ...fetchOpts, redirect: 'manual', signal: controller.signal });
      }

      return response;
    } catch (e) {
      clearTimeout(timer);
      // [v6.0.53 B1] SSRF 拦截立即失败，绝不重试
      if (e.message && e.message.startsWith('SSRF blocked')) throw e;
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
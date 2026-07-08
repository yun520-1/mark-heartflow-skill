/**
 * url-validator.js — URL 安全校验模块
 *
 * 防止 SSRF（服务端请求伪造）攻击：
 * - 阻止访问内网 IP 地址
 * - 阻止访问云元数据服务
 * - 仅允许 HTTP/HTTPS 协议
 * - 生产环境阻止 localhost 访问
 *
 * @module security/url-validator
 */

'use strict';

/**
 * 校验 URL 是否安全（阻止 SSRF 攻击）
 * 阻止访问内网 IP、云元数据服务和非 HTTP(S) 协议
 * @param {string} url - 待校验的 URL
 * @returns {{ safe: boolean, reason: string|null }}
 */
function validateFetchUrl(url) {
  try {
    // [SECURITY-FIX] H-2: 增强 SSRF 防护
    if (!url || url.length > 2048) {
      return { safe: false, reason: 'URL 过长或为空' };
    }
    const parsed = new URL(url);
    // 只允许 http/https 协议
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { safe: false, reason: '仅允许 HTTP/HTTPS 协议' };
    }
    const hostname = parsed.hostname.toLowerCase();

    // 阻止 0.0.0.0（某些系统上绑定所有接口）
    if (hostname === '0.0.0.0') {
      return { safe: false, reason: '阻止访问 0.0.0.0' };
    }

    // 阻止内网 IP（含 IPv6 映射地址）
    // 先检查 IPv6 映射的 IPv4 地址 ::ffff:127.0.0.1 等
    if (hostname.startsWith('::ffff:')) {
      const ipv4 = hostname.replace('::ffff:', '');
      if (/^(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(ipv4)) {
        return { safe: false, reason: '阻止访问内网地址 (IPv6-mapped): ' + hostname };
      }
    }

    // 标准内网 IP 检查
    if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|0\.)/.test(hostname)) {
      return { safe: false, reason: '阻止访问内网地址: ' + hostname };
    }

    // 阻止 Carrier-Grade NAT (100.64.0.0/10)
    if (/^100\.(6[4-9]|[7-9]\d|1[0-2][0-7])\./.test(hostname)) {
      return { safe: false, reason: '阻止访问 Carrier-Grade NAT 地址: ' + hostname };
    }

    // 阻止云元数据服务
    if (hostname === '169.254.169.254' || hostname === 'metadata.google.internal') {
      return { safe: false, reason: '阻止访问云元数据服务' };
    }
    // 阻止 GCP 元数据备用地址
    if (hostname === '169.254.169.253') {
      return { safe: false, reason: '阻止访问 GCP 元数据备用地址' };
    }

    // 阻止 localhost（生产环境）
    if (hostname === 'localhost' || hostname === '::1' || hostname === '[::1]') {
      if (process.env.NODE_ENV === 'production') {
        return { safe: false, reason: '生产环境禁止访问 localhost' };
      }
    }
    return { safe: true, reason: null };
  } catch (e) {
    return { safe: false, reason: 'URL 格式无效: ' + e.message };
  }
}

module.exports = { validateFetchUrl };

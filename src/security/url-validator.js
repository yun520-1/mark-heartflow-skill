/**
 * URL Validator — SSRF prevention for HeartFlow
 *
 * Validates that a URL is safe to fetch by rejecting internal/private
 * network addresses that could be used for Server-Side Request Forgery.
 *
 * Usage:
 *   const { validateFetchUrl } = require('../security/url-validator.js');
 *   const result = validateFetchUrl('https://example.com/api');
 *   if (!result.safe) throw new Error('SSRF blocked: ' + result.reason);
 */

const { URL } = require('url');
const net = require('net');

// ─── Private / reserved IPv4 ranges ──────────────────────────────────────────

const BLOCKED_V4_RANGES = [
  { network: '127.0.0.0',    prefix: 8,  label: 'loopback (127.0.0.0/8)' },
  { network: '0.0.0.0',      prefix: 8,  label: 'current network (0.0.0.0/8)' },       // [v5.15.3 H-3]
  { network: '10.0.0.0',     prefix: 8,  label: 'private (10.0.0.0/8)' },
  { network: '172.16.0.0',   prefix: 12, label: 'private (172.16.0.0/12)' },
  { network: '192.168.0.0',  prefix: 16, label: 'private (192.168.0.0/16)' },
  { network: '169.254.0.0',  prefix: 16, label: 'link-local (169.254.0.0/16)' },
];

// ─── Blocked IPv6 addresses ──────────────────────────────────────────────────

const BLOCKED_V6_ADDRESSES = [
  '::1',                    // IPv6 loopback
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Convert an IPv4 string to a 32-bit unsigned integer.
 * Returns null if the string is not a valid IPv4 address.
 */
function ip4ToInt(ip) {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let num = 0;
  for (let i = 0; i < 4; i++) {
    const octet = parseInt(parts[i], 10);
    if (isNaN(octet) || octet < 0 || octet > 255) return null;
    num = (num << 8) | octet;
  }
  return num >>> 0; // ensure unsigned
}

/**
 * Check if an IPv4 address falls into a blocked CIDR range.
 */
function isBlockedV4(ip) {
  const addr = ip4ToInt(ip);
  if (addr === null) return false; // not a valid IPv4

  for (const range of BLOCKED_V4_RANGES) {
    const netAddr = ip4ToInt(range.network);
    if (netAddr === null) continue;
    const mask = ~(2 ** (32 - range.prefix) - 1) >>> 0;
    if ((addr & mask) === (netAddr & mask)) {
      return { blocked: true, reason: `IP ${ip} is in ${range.label}` };
    }
  }

  return { blocked: false, reason: '' };
}

/**
 * Check if an IPv6 address is in the blocked list.
 * Returns { blocked: boolean, reason: string }.
 */
function isBlockedV6(ip) {
  // Normalize to lowercase for comparison
  const normalized = ip.toLowerCase();

  // Direct match against blocked list
  if (BLOCKED_V6_ADDRESSES.includes(normalized)) {
    return { blocked: true, reason: `IP ${ip} is IPv6 loopback` };
  }

  // Check for link-local IPv6 (fe80::/10)
  if (/^fe[89ab][0-9a-f]/i.test(normalized)) {
    return { blocked: true, reason: `IP ${ip} is IPv6 link-local (fe80::/10)` };
  }

  // [v5.15.3 H-3] Check for unique local IPv6 (fc00::/7)
  if (/^fc[0-9a-f][0-9a-f]/i.test(normalized) || /^fd[0-9a-f][0-9a-f]/i.test(normalized)) {
    return { blocked: true, reason: `IP ${ip} is IPv6 unique local (fc00::/7)` };
  }

  return { blocked: false, reason: '' };
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Validate a fetch URL for SSRF safety.
 *
 * @param {string} urlStr — The URL to validate.
 * @returns {{ safe: boolean, reason: string }}
 *   - safe: true if the URL is allowed (http/https, not internal IP)
 *   - reason: human-readable explanation when safe=false
 */
function validateFetchUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') {
    return { safe: false, reason: 'URL is empty or not a string' };
  }

  // Parse the URL — throws on invalid input
  let parsed;
  try {
    parsed = new URL(urlStr);
  } catch (e) {
    return { safe: false, reason: `Invalid URL: ${e.message}` };
  }

  // Only allow http and https schemes
  const scheme = parsed.protocol.replace(':', '').toLowerCase();
  if (scheme !== 'http' && scheme !== 'https') {
    return { safe: false, reason: `Protocol "${parsed.protocol}" is not allowed (only http/https)` };
  }

  // Get the hostname (without port), strip IPv6 brackets for IP checks
  let hostname = parsed.hostname;

  // Empty hostname — reject
  if (!hostname) {
    return { safe: false, reason: 'URL has no hostname' };
  }

  // Strip IPv6 brackets (e.g., "[::1]" → "::1") for net.isIPv6()
  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    hostname = hostname.slice(1, -1);
  }

  // Determine if it's an IP address
  const isV4 = net.isIPv4(hostname);
  const isV6 = net.isIPv6(hostname);

  if (isV4) {
    const result = isBlockedV4(hostname);
    if (result.blocked) return { safe: false, reason: result.reason };
  }

  if (isV6) {
    const result = isBlockedV6(hostname);
    if (result.blocked) return { safe: false, reason: result.reason };
  }

  // Not an IP — it's a hostname. Check for DNS rebinding domains first.
  // [v5.15.3 H-3] Block known DNS rebinding / SSRF bypass services
  const hostnameLower = hostname.toLowerCase();
  const REBINDING_DOMAINS = [
    'nip.io', 'xip.io', 'sslip.io', 'nip.io',           // wildcard DNS → any IP
    'lvh.me', 'localtest.me',                             // resolves to 127.0.0.1
    '1u.ms', '2u.ms',                                     // short rebinding domains
  ];
  for (const rd of REBINDING_DOMAINS) {
    if (hostnameLower === rd || hostnameLower.endsWith('.' + rd)) {
      return { safe: false, reason: `Hostname "${hostname}" matches DNS rebinding domain "${rd}"` };
    }
  }

  return { safe: true, reason: '' };
}

module.exports = { validateFetchUrl };
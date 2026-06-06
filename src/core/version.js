/**
 * version.js — HeartFlow 整体版本号单一来源 (Single Source of Truth)
 *
 * 设计原则:
 *   - VERSION 不允许在代码中硬编码；统一从 package.json 读取
 *   - 心虫任何位置需要"整体版本"时，require('./version') 即可
 *   - bumpVersion(type) 提供 patch/minor/major 升级，自动同步
 *     VERSION 文件、package.json、SKILL.md frontmatter、SKILL.md title
 *
 * v2.2.11 新增:
 *   - compareVersions(v1, v2) — semver 风格比较，返回 -1/0/1，支持 pre-release 标签
 *   - satisfies(version, range) — 范围匹配（>=, <=, ~, ^, 精确）
 *   - sortVersions(list, order) — 版本列表排序
 *   - validateVersion(v) — 带错误信息的版本号验证
 *   - parseVersion(v) — 完整解析含 pre-release 标签的版本号
 *   - getUpgradePath(from, to) — 计算从 A 到 B 的升级路径
 *
 * 用法:
 *   const { VERSION, getVersion, bumpVersion } = require('./version.js');
 *   console.log(VERSION);              // "2.0.16"
 *   const v = getVersion();            // { version, major, minor, patch, raw }
 *   bumpVersion('patch');              // 2.0.16 → 2.0.17，同步所有位置
 *   compareVersions('1.2.3', '1.2.4'); // -1
 *   satisfies('1.2.3', '>=1.2.0');    // true
 *
 * 注意: 此模块不应再 require heartflow.js 内部任何东西（避免循环依赖）
 */

const fs = require('fs');
const path = require('path');

// 项目根 = src/core/version.js 向上两级
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const PACKAGE_JSON = path.join(PROJECT_ROOT, 'package.json');
const VERSION_FILE = path.join(PROJECT_ROOT, 'VERSION');
const SKILL_MD = path.join(PROJECT_ROOT, 'SKILL.md');

// ============================================================================
// 版本号正则
// ============================================================================
const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9._-]+))?$/;
const SEMVER_LOOSE_RE = /^v?(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9._-]+))?$/;

/**
 * 内部：优先从 VERSION 文件读版本，package.json 做回退
 * VERSION 文件是版本号的单一真实来源（由 bumpVersion 维护）
 * package.json 可能因历史原因不同步
 */
function _readVersion() {
  // 1) 优先从 VERSION 文件
  if (fs.existsSync(VERSION_FILE)) {
    try {
      const raw = fs.readFileSync(VERSION_FILE, 'utf-8').trim();
      if (/^\d+\.\d+\.\d+$/.test(raw)) return raw;
    } catch (e) { /* fall through */ }
  }
  // 2) 回退到 package.json
  try {
    const raw = fs.readFileSync(PACKAGE_JSON, 'utf-8');
    const pkg = JSON.parse(raw);
    return pkg.version || '0.0.0';
  } catch (e) {
    return '0.0.0';
  }
}

/**
 * VERSION 常量 — 运行时从 VERSION 文件读取（回退到 package.json）
 * 任何时候 require('./version') 拿到的都是真实版本号
 */
const VERSION = _readVersion();

/**
 * getVersion() — 返回结构化版本信息
 * @returns {{ version: string, major: number, minor: number, patch: number, raw: string }}
 */
function getVersion() {
  const raw = VERSION;
  const parts = raw.split('.').map(n => parseInt(n, 10));
  const [major = 0, minor = 0, patch = 0] = parts;
  return { version: raw, major, minor, patch, raw };
}

/**
 * 解析版本字符串为数字三元组（含 pre-release 标签）
 * @param {string} v - 版本字符串，如 "2.0.16" 或 "2.0.17-alpha.1"
 * @returns {{ major: number, minor: number, patch: number, preRelease: string|null, valid: boolean, error: string|null }}
 */
function parseVersion(v) {
  const str = String(v).replace(/^v/, '').trim();
  const match = str.match(SEMVER_RE);
  if (!match) {
    return {
      major: 0, minor: 0, patch: 0,
      preRelease: null,
      valid: false,
      error: `无法解析版本号 "${v}"，格式应为 x.y.z 或 x.y.z-pre`
    };
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    preRelease: match[4] || null,
    valid: true,
    error: null
  };
}

/**
 * validateVersion(v) — 验证版本号是否合法，返回详细校验结果
 * @param {string} v - 待验证版本号
 * @returns {{ valid: boolean, error: string|null, parsed: object }}
 */
function validateVersion(v) {
  if (typeof v !== 'string' || !v.trim()) {
    return { valid: false, error: '版本号不能为空', parsed: null };
  }
  const parsed = parseVersion(v);
  if (!parsed.valid) {
    return { valid: false, error: parsed.error, parsed: null };
  }
  // 额外校验：不允许 0.0.x 持续累积（除非 explicitly allowed）
  if (parsed.major === 0 && parsed.minor === 0 && parsed.patch > 1000) {
    return {
      valid: false,
      error: `版本号 ${v} 的 patch 数异常高 (${parsed.patch})，可能误操作`,
      parsed
    };
  }
  return { valid: true, error: null, parsed };
}

/**
 * 解析版本字符串为数字三元组（兼容旧接口，含 pre-release）
 */
function _parseVersion(v) {
  const parts = String(v).replace(/^v/, '').split('.').map(n => parseInt(n, 10));
  return {
    major: Number.isFinite(parts[0]) ? parts[0] : 0,
    minor: Number.isFinite(parts[1]) ? parts[1] : 0,
    patch: Number.isFinite(parts[2]) ? parts[2] : 0,
  };
}

// ============================================================================
// 版本比较与排序（v2.2.11 新增）
// ============================================================================

/**
 * 比较 pre-release 标签的优先级
 * 规则：无 pre-release > alpha > beta > rc > 数字后缀
 * @private
 */
function _comparePreRelease(a, b) {
  if (a === null && b === null) return 0;
  if (a === null) return 1;  // 无标签版本 > 有标签版本
  if (b === null) return -1;

  const PRIORITY = { 'alpha': 0, 'a': 0, 'beta': 1, 'b': 1, 'rc': 2 };
  const aKey = a.replace(/[0-9].*$/, '').toLowerCase();
  const bKey = b.replace(/[0-9].*$/, '').toLowerCase();

  const aPri = PRIORITY[aKey] !== undefined ? PRIORITY[aKey] : 3;
  const bPri = PRIORITY[bKey] !== undefined ? PRIORITY[bKey] : 3;

  if (aPri !== bPri) return aPri - bPri;

  // 同类型标签，比较数字后缀
  const aNum = parseInt(a.replace(/^[a-zA-Z-]+/, ''), 10);
  const bNum = parseInt(b.replace(/^[a-zA-Z-]+/, ''), 10);
  if (Number.isFinite(aNum) && Number.isFinite(bNum)) {
    return aNum - bNum;
  }
  // 字典序回退
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * compareVersions(v1, v2) — semver 风格版本号比较
 *
 * 支持完整 semver 语义（含 pre-release 标签）：
 *   - 2.0.0 > 1.9.9
 *   - 1.2.0 > 1.1.999
 *   - 1.0.0 > 1.0.0-alpha
 *   - 1.0.0-beta > 1.0.0-alpha
 *   - 1.0.0-rc.1 > 1.0.0-beta.2
 *
 * @param {string} v1 - 第一个版本号
 * @param {string} v2 - 第二个版本号
 * @returns {number} -1 (v1 < v2) | 0 (v1 === v2) | 1 (v1 > v2)
 * @throws {Error} 如果版本号格式无效
 */
function compareVersions(v1, v2) {
  const p1 = parseVersion(v1);
  const p2 = parseVersion(v2);

  if (!p1.valid) throw new Error(`compareVersions: 无效版本号 "${v1}"`);
  if (!p2.valid) throw new Error(`compareVersions: 无效版本号 "${v2}"`);

  // 比较 major
  if (p1.major !== p2.major) return p1.major > p2.major ? 1 : -1;
  // 比较 minor
  if (p1.minor !== p2.minor) return p1.minor > p2.minor ? 1 : -1;
  // 比较 patch
  if (p1.patch !== p2.patch) return p1.patch > p2.patch ? 1 : -1;
  // 比较 pre-release 标签
  return _comparePreRelease(p1.preRelease, p2.preRelease);
}

/**
 * sortVersions(versions, order) — 对版本号列表排序
 *
 * @param {string[]} versions - 版本号数组
 * @param {'asc'|'desc'} [order='asc'] - 排序方向
 * @returns {string[]} 排序后的版本号数组
 * @throws {Error} 如果任何版本号无效
 */
function sortVersions(versions, order = 'asc') {
  if (!Array.isArray(versions)) {
    throw new Error('sortVersions: 参数必须是数组');
  }
  const sorted = [...versions].sort((a, b) => {
    const cmp = compareVersions(a, b);
    return order === 'desc' ? -cmp : cmp;
  });
  return sorted;
}

/**
 * satisfies(version, range) — 检查版本是否满足范围约束
 *
 * 支持的范围语法：
 *   - ">=1.2.3"      大于等于
 *   - "<=1.2.3"      小于等于
 *   - ">1.2.3"       大于
 *   - "<1.2.3"       小于
 *   - "=1.2.3"       精确匹配（也可直接写版本号）
 *   - "1.2.x"        通配 minor/patch
 *   - "~1.2.3"       近似匹配（允许 patch 变化：>=1.2.3 <1.3.0）
 *   - "^1.2.3"       兼容匹配（允许 minor+patch 变化：>=1.2.3 <2.0.0）
 *   - ">=1.0.0 <2.0.0"  复合范围
 *
 * @param {string} version - 待检查的版本号
 * @param {string} range - 范围表达式
 * @returns {boolean} 是否满足
 * @throws {Error} 如果格式无效
 */
function satisfies(version, range) {
  const v = parseVersion(version);
  if (!v.valid) throw new Error(`satisfies: 无效版本号 "${version}"`);

  const trimmed = String(range).trim();

  // 复合范围：空格分隔的多条件（如 ">=1.0.0 <2.0.0"）
  if (/[><=]/.test(trimmed) && trimmed.includes(' ') && !trimmed.startsWith('^') && !trimmed.startsWith('~')) {
    const parts = trimmed.split(/\s+/).filter(Boolean);
    return parts.every(p => satisfies(version, p));
  }

  // 精确匹配
  const exactMatch = trimmed.match(/^=?(\d+\.\d+\.\d+(?:-[a-zA-Z0-9._-]+)?)$/);
  if (exactMatch) {
    return compareVersions(version, exactMatch[1]) === 0;
  }

  // 通配匹配 "x" 或 "*"
  const wildMatch = trimmed.match(/^(\d+)\.(\d+|x|\*)\.(\d+|x|\*)$/);
  if (wildMatch) {
    const [_, wMajor, wMinor, wPatch] = wildMatch;
    if (wMajor !== String(v.major)) return false;
    if (wMinor !== 'x' && wMinor !== '*' && parseInt(wMinor, 10) !== v.minor) return false;
    if (wPatch !== 'x' && wPatch !== '*' && parseInt(wPatch, 10) !== v.patch) return false;
    return true;
  }

  // ~ 近似匹配: ~1.2.3 → >=1.2.3 <1.3.0
  const tildeMatch = trimmed.match(/^~(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9._-]+))?$/);
  if (tildeMatch) {
    const [_, ma, mi, pa] = tildeMatch.map(n => parseInt(n, 10));
    const upper = `${ma}.${mi + 1}.0`;
    return compareVersions(version, `${ma}.${mi}.${pa}`) >= 0 &&
           compareVersions(version, upper) < 0;
  }

  // ^ 兼容匹配: ^1.2.3 → >=1.2.3 <2.0.0
  const caretMatch = trimmed.match(/^\^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9._-]+))?$/);
  if (caretMatch) {
    const [_, ma, mi, pa] = caretMatch.map(n => parseInt(n, 10));
    const upper = `${ma + 1}.0.0`;
    return compareVersions(version, `${ma}.${mi}.${pa}`) >= 0 &&
           compareVersions(version, upper) < 0;
  }

  // >=, <=, >, < 比较操作符
  const opMatch = trimmed.match(/^(>=|<=|>|<)\s*(\d+\.\d+\.\d+(?:-[a-zA-Z0-9._-]+)?)$/);
  if (opMatch) {
    const [_, op, target] = opMatch;
    const cmp = compareVersions(version, target);
    switch (op) {
      case '>=': return cmp >= 0;
      case '<=': return cmp <= 0;
      case '>':  return cmp > 0;
      case '<':  return cmp < 0;
    }
  }

  throw new Error(`satisfies: 无法解析范围 "${range}"`);
}

/**
 * getUpgradePath(from, to) — 计算从版本 A 到版本 B 的升级路径描述
 *
 * @param {string} from - 起始版本号
 * @param {string} to - 目标版本号
 * @returns {{ from: string, to: string, type: string, steps: number, description: string }}
 *   type: 'major'|'minor'|'patch'|'downgrade'|'same'|'invalid'
 */
function getUpgradePath(from, to) {
  try {
    const pFrom = parseVersion(from);
    const pTo = parseVersion(to);
    if (!pFrom.valid) return { from, to, type: 'invalid', steps: 0, description: `起始版本无效: ${from}` };
    if (!pTo.valid) return { from, to, type: 'invalid', steps: 0, description: `目标版本无效: ${to}` };

    const cmp = compareVersions(from, to);
    if (cmp === 0) return { from, to, type: 'same', steps: 0, description: '版本相同，无需升级' };
    if (cmp > 0) return { from, to, type: 'downgrade', steps: 0, description: '目标版本低于当前版本' };

    let type = 'patch';
    let description = '';
    if (pTo.major > pFrom.major) {
      type = 'major';
      description = `主版本升级 ${from} → ${to}`;
    } else if (pTo.minor > pFrom.minor) {
      type = 'minor';
      description = `次版本升级 ${from} → ${to}`;
    } else {
      description = `补丁升级 ${from} → ${to}`;
    }

    const steps = Math.abs(pTo.major - pFrom.major) + Math.abs(pTo.minor - pFrom.minor) + Math.abs(pTo.patch - pFrom.patch);
    return { from, to, type, steps, description };
  } catch (e) {
    return { from, to, type: 'invalid', steps: 0, description: e.message };
  }
}

// ============================================================================
// 升级版本号
// ============================================================================

/**
 * 升级版本号字符串
 * @param {string} type - 'patch' | 'minor' | 'major'
 * @param {string} current - 当前版本（默认从 package.json 读）
 * @returns {string} 升级后的版本号
 */
function _bumpVersionString(type, current = VERSION) {
  const v = _parseVersion(current);
  switch (type) {
    case 'major': return `${v.major + 1}.0.0`;
    case 'minor': return `${v.major}.${v.minor + 1}.0`;
    case 'patch':
    default:      return `${v.major}.${v.minor}.${v.patch + 1}`;
  }
}

/**
 * bumpVersion(type) — 一站式版本升级
 * 同步更新: VERSION 文件 + package.json + SKILL.md frontmatter + SKILL.md title
 *
 * @param {'patch'|'minor'|'major'} type - 升级类型
 * @param {object} [opts]
 * @param {boolean} [opts.dryRun=false] - true 时只返回结果不写文件
 * @param {boolean} [opts.syncFiles=true] - 是否同步其他文件（CLI 默认 true）
 * @returns {{ from: string, to: string, type: string, synced: string[], dryRun: boolean }}
 */
function bumpVersion(type = 'patch', opts = {}) {
  const { dryRun = false, syncFiles = true } = opts;

  if (!['patch', 'minor', 'major'].includes(type)) {
    throw new Error(`bumpVersion: invalid type "${type}", must be patch|minor|major`);
  }

  const from = _readVersion();
  const to = _bumpVersionString(type, from);
  const synced = [];

  if (!syncFiles) {
    return { from, to, type, synced, dryRun };
  }

  // 1) VERSION 文件
  if (fs.existsSync(VERSION_FILE)) {
    if (!dryRun) fs.writeFileSync(VERSION_FILE, to + '\n');
    synced.push('VERSION');
  }

  // 2) package.json
  if (fs.existsSync(PACKAGE_JSON)) {
    const raw = fs.readFileSync(PACKAGE_JSON, 'utf-8');
    const pkg = JSON.parse(raw);
    pkg.version = to;
    if (!dryRun) fs.writeFileSync(PACKAGE_JSON, JSON.stringify(pkg, null, 2) + '\n');
    synced.push('package.json');
  }

  // 3) SKILL.md frontmatter + title
  if (fs.existsSync(SKILL_MD)) {
    let content = fs.readFileSync(SKILL_MD, 'utf-8');
    // frontmatter: version: "x.y.z"
    const beforeFm = content;
    content = content.replace(
      /(version:\s*"?)[^"\n]+("?)/,
      (_, pre, post) => `${pre}${to}${post}`
    );
    if (content !== beforeFm) synced.push('SKILL.md frontmatter');
    // title: # HeartFlow / 心虫 vX.Y.Z  (或 # HeartFlow vX.Y.Z)
    const beforeTitle = content;
    content = content.replace(
      /(# HeartFlow(?:\s*\/\s*心虫)?\s+v)\d+\.\d+\.\d+/,
      (_, pre) => `${pre}${to}`
    );
    if (content !== beforeTitle && !synced.includes('SKILL.md title')) synced.push('SKILL.md title');
    if (!dryRun && content !== fs.readFileSync(SKILL_MD, 'utf-8')) fs.writeFileSync(SKILL_MD, content);
  }

  return { from, to, type, synced, dryRun };
}

module.exports = {
  VERSION,
  getVersion,
  parseVersion,
  validateVersion,
  compareVersions,
  sortVersions,
  satisfies,
  getUpgradePath,
  bumpVersion,
  PROJECT_ROOT,
  PACKAGE_JSON,
  VERSION_FILE,
  SKILL_MD,
};

/**
 * version.js — HeartFlow 整体版本号单一来源 (Single Source of Truth)
 *
 * 设计原则:
 *   - VERSION 不允许在代码中硬编码；统一从 package.json 读取
 *   - 心虫任何位置需要"整体版本"时，require('./version') 即可
 *   - bumpVersion(type) 提供 patch/minor/major 升级，自动同步
 *     VERSION 文件、package.json、SKILL.md frontmatter、SKILL.md title
 *
 * 用法:
 *   const { VERSION, getVersion, bumpVersion } = require('./version.js');
 *   console.log(VERSION);              // "2.0.16"
 *   const v = getVersion();            // { version, major, minor, patch, raw }
 *   bumpVersion('patch');              // 2.0.16 → 2.0.17，同步所有位置
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
 * 解析版本字符串为数字三元组
 */
function _parseVersion(v) {
  const parts = String(v).replace(/^v/, '').split('.').map(n => parseInt(n, 10));
  return {
    major: Number.isFinite(parts[0]) ? parts[0] : 0,
    minor: Number.isFinite(parts[1]) ? parts[1] : 0,
    patch: Number.isFinite(parts[2]) ? parts[2] : 0,
  };
}

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

  const from = _readFromPackage();
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
  bumpVersion,
  PROJECT_ROOT,
  PACKAGE_JSON,
  VERSION_FILE,
  SKILL_MD,
};

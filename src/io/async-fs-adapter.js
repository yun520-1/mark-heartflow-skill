/**
 * Async FS Adapter — 异步化文件/路径操作层
 *
 * 目的：
 *  将现有同步 fs/path 调用封装为 Promise API，供上游模块复用，
 *  从而在不新增硬依赖的前提下，把高耗时 IO 路径从同步阻塞改为 await/流式处理。
 *
 * 设计：
 *  - 不新增 npm 依赖，仅封装 Node 内置 fs/path；
 *  - 保持 API 与现有同步用法语义一致；
 *  - 小文件默认采用 fs.promises；大文件/流式场景提供 stream 变体；
 *  - 保留同步降级路径：异步失败时回退同步，保证功能可用。
 */

const fs = require('../utils/safe-fs');
const path = require('path');
const crypto = require('crypto');

// ─── 基础工具 ──────────────────────────────────────────────

function _resolve(filePath) {
  return path.resolve(String(filePath || ''));
}

function _ensureDir(dirPath) {
  const target = _resolve(dirPath);
  try { fs.mkdirSync(target, { recursive: true }); } catch (e) { /* ignore */ }
  return target;
}

// ─── 文件存在性 / 读取 / 写入 ────────────────────────────

/**
 * 异步判断文件是否存在
 */
async function exists(filePath) {
  try {
    await fs.promises.access(_resolve(filePath));
    return true;
  } catch {
    return false;
  }
}

/**
 * 异步读取文本文件
 * @param {string} filePath
 * @param {string} [encoding='utf8']
 * @returns {Promise<string>}
 */
async function readFile(filePath, encoding = 'utf8') {
  try {
    return await fs.promises.readFile(_resolve(filePath), encoding);
  } catch (e) {
    // 同步降级
    return fs.readFileSync(_resolve(filePath), encoding);
  }
}

/**
 * 异步写入文本文件（单次写入）
 * @param {string} filePath
 * @param {string} data
 */
async function writeFile(filePath, data) {
  const target = _resolve(filePath);
  _ensureDir(path.dirname(target));
  try {
    await fs.promises.writeFile(target, data, 'utf8');
  } catch (e) {
    fs.writeFileSync(target, data, 'utf8');
  }
}

/**
 * 原子写：先写临时文件，再 rename
 * @param {string} filePath
 * @param {string} data
 * @returns {Promise<void>}
 */
async function atomicWrite(filePath, data) {
  const target = _resolve(filePath);
  const dir = path.dirname(target);
  _ensureDir(dir);
  const tmpPath = target + '.tmp.' + Date.now() + '.' + crypto.randomBytes(4).toString('hex');
  try {
    await fs.promises.writeFile(tmpPath, data, 'utf8');
    await fs.promises.rename(tmpPath, target);
  } catch (e) {
    try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
    // 降级同步
    fs.writeFileSync(target, data, 'utf8');
  }
}

/**
 * 追加文本到文件末尾
 * @param {string} filePath
 * @param {string} data
 */
async function appendFile(filePath, data) {
  const target = _resolve(filePath);
  _ensureDir(path.dirname(target));
  try {
    await fs.promises.appendFile(target, data, 'utf8');
  } catch (e) {
    fs.appendFileSync(target, data, 'utf8');
  }
}

/**
 * 读取目录条目
 * @param {string} dirPath
 * @param {boolean} [withFileTypes=false]
 * @returns {Promise<fs.Dirent[] | string[]>}
 */
async function readdir(dirPath, withFileTypes = false) {
  try {
    return await fs.promises.readdir(_resolve(dirPath), { withFileTypes });
  } catch (e) {
    return fs.readdirSync(_resolve(dirPath), { withFileTypes });
  }
}

/**
 * 创建目录
 * @param {string} dirPath
 * @param {object} [opts]
 */
async function mkdir(dirPath, opts = {}) {
  try {
    await fs.promises.mkdir(_resolve(dirPath), { recursive: true, ...opts });
  } catch (e) {
    fs.mkdirSync(_resolve(dirPath), { recursive: true, ...opts });
  }
}

/**
 * 删除文件
 * @param {string} filePath
 */
async function unlink(filePath) {
  try {
    await fs.promises.unlink(_resolve(filePath));
  } catch (e) {
    fs.unlinkSync(_resolve(filePath));
  }
}

/**
 * 获取文件状态
 * @param {string} filePath
 * @returns {Promise<fs.Stats>}
 */
async function stat(filePath) {
  try {
    return await fs.promises.stat(_resolve(filePath));
  } catch (e) {
    return fs.statSync(_resolve(filePath));
  }
}

// ─── 流式读取（大文件） ────────────────────────────────────

/**
 * 创建可读流
 * @param {string} filePath
 * @returns {fs.ReadStream}
 */
function createReadStream(filePath) {
  return fs.createReadStream(_resolve(filePath));
}

/**
 * 创建写入流
 * @param {string} filePath
 * @returns {fs.WriteStream}
 */
function createWriteStream(filePath) {
  const target = _resolve(filePath);
  _ensureDir(path.dirname(target));
  return fs.createWriteStream(target);
}

/**
 * 将可读流收集为字符串
 * @param {fs.ReadStream} stream
 * @returns {Promise<string>}
 */
async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

/**
 * 流式复制：src -> dest
 * @param {string} src
 * @param {string} dest
 */
async function copyFile(src, dest) {
  const source = _resolve(src);
  const target = _resolve(dest);
  _ensureDir(path.dirname(target));
  return new Promise((resolve, reject) => {
    const read = fs.createReadStream(source);
    const write = fs.createWriteStream(target);
    read.pipe(write);
    read.on('error', reject);
    write.on('error', reject);
    write.on('finish', resolve);
  });
}

module.exports = {
  exists,
  readFile,
  writeFile,
  atomicWrite,
  appendFile,
  readdir,
  mkdir,
  unlink,
  stat,
  createReadStream,
  createWriteStream,
  streamToString,
  copyFile,
};

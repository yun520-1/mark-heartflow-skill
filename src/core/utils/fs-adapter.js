/**
 * FS Adapter — 文件系统适配器
 * 跨平台：Node.js / Python / Browser
 * @version v0.12.50
 */
'use strict';

const fs = require('fs');
const path = require('path');

class FSAdapter {
  constructor(rootPath) {
    this.root = rootPath || path.resolve(__dirname, '../../../..');
  }
  readFileSync(p) {
    return fs.readFileSync(path.isAbsolute(p) ? p : path.join(this.root, p), 'utf8');
  }
  writeFileSync(p, content) {
    const fp = path.isAbsolute(p) ? p : path.join(this.root, p);
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    fs.writeFileSync(fp, content, 'utf8');
  }
  existsSync(p) {
    return fs.existsSync(path.isAbsolute(p) ? p : path.join(this.root, p));
  }
  mkdirSync(p) {
    fs.mkdirSync(path.isAbsolute(p) ? p : path.join(this.root, p), { recursive: true });
  }
  readdirSync(p) {
    return fs.readdirSync(path.isAbsolute(p) ? p : path.join(this.root, p));
  }
  readJSON(p) { return JSON.parse(this.readFileSync(p)); }
  writeJSON(p, obj) { this.writeFileSync(p, JSON.stringify(obj, null, 2)); }
}

module.exports = { FSAdapter };

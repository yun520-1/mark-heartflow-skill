/**
 * self-scanner.js — 自我弱点扫描器 (v1.0.0)
 *
 * 让 SelfEvolutionCore 基于真实代码库产出具体改进，而非空泛目标。
 * 扫描项目源码，统计：
 *   - TODO/FIXME/HACK 数量（未完成工作）
 *   - 沉默空 catch（吞异常）
 *   - 超长函数（可拆分信号）
 *   - 未测试模块（测试覆盖缺口）
 *
 * 用法: const { SelfScanner } = require('./self-scanner.js');
 *       const scanner = new SelfScanner(projectRoot);
 *       const weaknesses = scanner.scan();
 */

const fs = require('fs');
const path = require('path');

class SelfScanner {
  /**
   * @param {string} projectRoot - 项目根目录（绝对路径）
   */
  constructor(projectRoot) {
    this.root = projectRoot || process.cwd();
    this._cache = null;
  }

  /**
   * 扫描项目弱点
   * @returns {{ todoCount, silentCatches, longFunctions, untestedModules, totalFiles }}
   */
  scan() {
    if (this._cache) return this._cache;
    const result = {
      todoCount: 0,
      silentCatches: 0,
      longFunctions: [],
      untestedModules: [],
      totalFiles: 0,
      scannedAt: new Date().toISOString(),
    };

    try {
      const srcDir = path.join(this.root, 'src');
      if (!fs.existsSync(srcDir)) {
        this._cache = { ...result, error: 'src/ 不存在' };
        return this._cache;
      }

      const jsFiles = this._walk(srcDir).filter(f => f.endsWith('.js'));
      result.totalFiles = jsFiles.length;

      const testDir = path.join(this.root, 'test');
      const testFiles = fs.existsSync(testDir)
        ? this._walk(testDir).filter(f => f.endsWith('.js')).map(f => path.basename(f, '.js'))
        : [];

      for (const file of jsFiles) {
        let content;
        try { content = fs.readFileSync(file, 'utf-8'); } catch (e) { continue; }

        // 1. TODO/FIXME/HACK
        const todos = content.match(/\/\/\s*(TODO|FIXME|HACK|XXX)[:\s]/g) || [];
        result.todoCount += todos.length;

        // 2. 沉默空 catch: catch 块内只有注释或空
        const catches = content.match(/catch\s*\([^)]*\)\s*\{[^}]*\}/g) || [];
        for (const c of catches) {
          const body = c.replace(/catch\s*\([^)]*\)\s*\{\s*/, '').replace(/\s*\}$/, '');
          const hasCode = body.replace(/\/\/[^\n]*/g, '').trim().length > 0;
          if (!hasCode) result.silentCatches++;
        }

        // 3. 超长函数（>150 行）
        const funcs = content.match(/function\s+\w+\s*\([^)]*\)\s*\{/g) || [];
        for (const f of funcs) {
          // 简化：统计函数块大致的行数（用括号匹配不可靠，只统计单文件行数>300的标记）
          if (content.split('\n').length > 300) {
            result.longFunctions.push({ file: path.relative(this.root, file), approx: content.split('\n').length });
            break; // 每文件只报一次
          }
        }

        // 4. 未测试模块: 导出类/函数名没有对应测试文件
        const baseName = path.basename(file, '.js');
        const hasTest = testFiles.some(t => t.includes(baseName));
        if (!hasTest && content.includes('module.exports')) {
          // 只标记非工具类、有逻辑的模块
          if (content.length > 3000) {
            result.untestedModules.push(path.relative(this.root, file));
          }
        }
      }

      // 去重超长函数
      result.longFunctions = result.longFunctions.filter((v, i, a) => a.findIndex(x => x.file === v.file) === i).slice(0, 20);
      result.untestedModules = result.untestedModules.slice(0, 30);
    } catch (e) {
      result.error = e.message;
    }

    this._cache = result;
    return result;
  }

  _walk(dir) {
    const out = [];
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return out; }
    for (const e of entries) {
      if (e.name === 'node_modules' || e.name === '.git' || e.name === 'archive') continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) out.push(...this._walk(p));
      else if (e.isFile()) out.push(p);
    }
    return out;
  }
}

module.exports = { SelfScanner };

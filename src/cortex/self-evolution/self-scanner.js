/**
 * SelfScanner - 心虫自我弱点扫描器
 *
 * 背景：SelfEvolutionCore.evolve() 的 learn() 只提取关键词，不读代码库，
 * 导致进化产出空泛目标（"提升情感识别"）。这违背了用户定义的真正自我升级：
 * "发现自身缺陷就改"。
 *
 * 本模块让 evolve 真正审视自身代码库，产出具体可修复的弱点信号：
 *  - todoCount: 代码库 TODO/FIXME 数量（重构积压）
 *  - longFunctions: 超长函数（>300 行）文件清单
 *  - silentCatches: 吞掉错误的空 catch（追溯链断裂风险）
 *  - untestedModules: src/ 下有代码但 test/ 无对应测试的模块
 *  - coreFileSize: 核心单体文件大小（强耦合信号）
 *
 * 设计原则：
 *  - 只读扫描，不改任何文件
 *  - 输出结构化弱点，供 suggestImprovements 转成具体改进项
 *
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

const SCAN_DIRS = ['src', 'bin'];
const TEST_DIR = 'test';
const LONG_FN_THRESHOLD = 300;
// [v6.0.57] 出网收口自检：裸 fetch / http 请求未走 safeFetch = SSRF 旁路风险
// 教训来源：SSRF 旁路两次击穿安全层(H1→P0)，散落裸 fetch 反复成破口。
// 固化为自检维度，让心虫每次扫描主动看见此类元级盲区，而非等外部审计。
const BYPASS_RE = /\bawait\s+fetch\s*\(|(?<![.\w])fetch\s*\(|https?\.(get|request)\s*\(/;

class SelfScanner {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
  }

  _walk(dir, ext = '.js') {
    const out = [];
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return out; }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (['node_modules', '.git', 'internal', 'formulas-corpus', 'data'].includes(e.name)) continue;
        out.push(...this._walk(full, ext));
      } else if (e.name.endsWith(ext)) {
        out.push(full);
      }
    }
    return out;
  }

  scan() {
    const result = {
      todoCount: 0,
      longFunctions: [],
      silentCatches: 0,
      untestedModules: [],
      coreFileSize: {},
      bypassCount: 0,        // [v6.0.57] 裸 fetch / http 旁路(未走 safeFetch)数
      bypassFiles: [],        // [v6.0.57] 存在旁路的相对路径
      scannedAt: Date.now()
    };

    const files = [];
    for (const d of SCAN_DIRS) files.push(...this._walk(path.join(this.projectRoot, d)));

    // 测试文件集合（去扩展名 basename）
    const testFiles = this._walk(path.join(this.projectRoot, TEST_DIR))
      .map(f => path.basename(f).replace(/\.test\.js$/, '').replace(/\.js$/, ''));

    for (const f of files) {
      let content = '';
      try { content = fs.readFileSync(f, 'utf8'); } catch (e) { continue; }
      const rel = path.relative(this.projectRoot, f);

      // TODO/FIXME 计数
      const todos = (content.match(/TODO|FIXME|XXX/g) || []).length;
      result.todoCount += todos;

      // 沉默空 catch（catch (e) {} 或 catch(e){}）
      // [v6.0.31] 排除"防御性模块加载失败"的合法静默(带 // 防御性 注释)——避免误报噪声
      // [v6.0.32] 排除"资源清理"类沉默 catch(shutdown/unlink/close 等退出时清理, 静默合法)
      // 同时排除注释行(// 开头的 catch 描述是注释不是代码)
      const catchLines = content.split('\n');
      let fileSilent = 0;
      let defensiveSilent = 0;
      let cleanupSilent = 0;
      const cleanupRe = /shutdown|unlinkSync|unlink\(|s\.close|\.close\(\)|removeSync|rmdir/;
      for (let li = 0; li < catchLines.length; li++) {
        const line = catchLines[li];
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue; // 跳过注释行
        if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(line)) {
          // 看前后 2 行是否有清理操作
          const ctx = [catchLines[li - 1], line, catchLines[li + 1]].join(' ');
          if (/防御性|不阻断主流程|防御性:/.test(line)) defensiveSilent++;
          else if (cleanupRe.test(ctx)) cleanupSilent++;
          else fileSilent++;
        }
      }
      result.silentCatches += fileSilent;
      result.defensiveCatches = (result.defensiveCatches || 0) + defensiveSilent;
      result.cleanupCatches = (result.cleanupCatches || 0) + cleanupSilent;

      // [v6.0.57] 出网收口自检：裸 fetch / http 旁路（safeFetch 内部除外）
      // rel 是 safeFetch 实现文件本身时不计（它内部必须裸调用底层 http）
      const isSafeFetchImpl = rel.includes('fetch-safe') || rel.includes('fetchSafe');
      if (!isSafeFetchImpl) {
        const lines2 = content.split('\n');
        let fileBypass = 0;
        for (const ln of lines2) {
          if (BYPASS_RE.test(ln) && !/safeFetch|fetch-safe/.test(ln)) fileBypass++;
        }
        if (fileBypass > 0) {
          result.bypassCount += fileBypass;
          result.bypassFiles.push({ file: rel, count: fileBypass });
        }
      }

      // 核心单体大小（>50KB）
      const bytes = Buffer.byteLength(content, 'utf8');
      if (bytes > 50000) {
        result.coreFileSize[rel] = `${Math.round(bytes / 1024)}KB`;
      }

      // 超长函数（粗略：统计连续非空白行块起点为 function/=> 且到下一个顶层声明 >300 行）
      const lines = content.split('\n');
      let fnStart = -1;
      let depth = 0;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/^\s*(async\s+)?function\s|^[a-zA-Z_$][\w$]*\s*\([^)]*\)\s*\{/.test(line)) {
          fnStart = i;
          depth = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
        } else if (fnStart >= 0) {
          depth += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
          if (depth <= 0) {
            const len = i - fnStart;
            if (len > LONG_FN_THRESHOLD) {
              result.longFunctions.push({ file: rel, line: fnStart + 1, length: len });
            }
            fnStart = -1;
          }
        }
      }

      // 未测试模块（src 下的模块是否在 test 有对应文件）
      if (rel.startsWith('src/')) {
        const modName = path.basename(f).replace(/\.js$/, '');
        const hasTest = testFiles.some(t => t === modName || t.includes(modName) || modName.includes(t));
        if (!hasTest && !modName.startsWith('index')) {
          result.untestedModules.push(rel);
        }
      }
    }

    // 控制未测试模块数量（避免噪声）
    result.untestedModules = result.untestedModules.slice(0, 20);
    return result;
  }
}

module.exports = { SelfScanner };

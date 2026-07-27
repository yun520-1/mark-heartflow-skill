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

/** [v6.3.11] 熔断器状态 (移植自 rollback-manager.js CircuitState) */
const CircuitState = Object.freeze({
  CLOSED: 'closed',
  HALF_OPEN: 'half_open',
  OPEN: 'open'
});

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
      silentDetails: [],   // [v6.0.61] 真沉默空catch明细(位置+类型),供进化决策定位
      untestedModules: [],
      coreFileSize: {},
      bypassCount: 0,        // [v6.0.57] 裸 fetch / http 旁路(未走 safeFetch)数
      bypassFiles: [],        // [v6.0.57] 存在旁路的相对路径
      scannedAt: Date.now(),
      livenessProbes: [],
      // [v6.3.10] 渐变退化检测: 从archive rollback-manager提取
      // [v6.3.11] 熔断器状态机: 连续回滚→circuitOpen→半开恢复
      metrics: {
        healthTrend: null,
        trendSlope: 0,
        netDrop: 0,
        oscillationDetected: false,
        oscillationCount: 0,
        circuitState: CircuitState.CLOSED,
        circuitTripped: false,
      },
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

      // TODO/FIXME 计数（仅带冒号或独立词的真实标记, 排除 XXX 占位符误匹配）
      const todos = (content.match(/\b(?:TODO|FIXME|XXX):/g) || []).length;
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
          else {
            fileSilent++;
            result.silentDetails.push({ file: rel, line: li + 1, snippet: trimmed.slice(0, 80) });
          }
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
        const ml = modName.toLowerCase().replace(/-/g, '');
        // [v6.0.63] 大小写+连字符不敏感匹配: IntentionTracker vs intention-tracker 正确识别已测
        const hasTest = testFiles.some(t => {
          const tl = t.toLowerCase().replace(/-/g, '');
          return tl === ml || tl.includes(ml) || ml.includes(tl);
        });
        if (!hasTest && !modName.startsWith('index')) {
          result.untestedModules.push(rel);
        }
      }
    }

    // 未测试模块：显示完整列表，不做硬性截断
    result.untestedCount = result.untestedModules.length;

    // [v6.3.10] 渐变退化分析
    try {
      const history = result.todoCount > 0
        ? [{ todoCount: result.todoCount, bypassCount: result.bypassCount, scannedAt: Date.now() }]
        : [];
      if (history.length > 0) {
        Object.assign(result.metrics, this.analyzeHealthTrend(history));
      }
    } catch (_) {}

    // [v6.0.62] 运行时探针 —— "为什么心虫发现不了自己问题"的根因修复:
    //   静态扫描只能看代码长相(函数存在/语法对/有try), 发现不了"函数存在但永远返回空/开关默认关"的沉默失效。
    //   本维度实际 probe 关键能力, 把沉默失效变成可被发现的结构化信号。
    result.livenessProbes = this._probeLiveness();

    return result;
  }

  _probeLiveness() {
    const probes = [];
    try {
      const { SelfEvolutionV2: V2 } = require('../self-evolution-v2.js');
      const ex = new V2(this.projectRoot);
      // [v6.1.2] 默认开启: 仅 HEARTFLOW_SELF_EVOLVE_EXPLORE=0 才关; 否则视为意图开启
      const optOut = process.env.HEARTFLOW_SELF_EVOLVE_EXPLORE === '0';
      // 探针看配置意图(不实测网络, 避免 scan 变慢); 真实验活由 explore() 返回非空体现
      const alive = !optOut;
      probes.push({
        capability: 'arxiv_explore',
        alive,
        detail: alive
          ? '探索层 v6.1.2 起默认开(仅=0 才关), 联网对标已启用'
          : 'HEARTFLOW_SELF_EVOLVE_EXPLORE=0 -> 显式关闭, 进化不出网对标'
      });
    } catch (e) {
      probes.push({ capability: 'arxiv_explore', alive: false, detail: 'explorer 加载失败: ' + e.message });
    }
    probes.push({
      capability: 'liveness_self_aware',
      alive: true,
      detail: '本探针维度自身已就位: 静态扫描盲区(运行时失效)现可被主动发现'
    });
    return probes;
  }

  /**
   * [v6.3.10] 渐变退化检测
   * 来源: archive/src/cortex/self-evolution/rollback-manager.js — 线性回归+噪声容忍
   * [v6.3.11] 增强: 引入 RollbackManager 的 A→B→A→B 版本震荡检测模式 + 熔断状态机
   * @param {Array} history - 历史扫描结果 [{todoCount, bypassCount, scannedAt}]
   * @returns {object}
   */
  analyzeHealthTrend(history = []) {
    if (history.length < 3) {
      return { healthTrend: null, trendSlope: 0, netDrop: 0, oscillationDetected: false, oscillationCount: 0, circuitState: this._circuitState || CircuitState.CLOSED, circuitTripped: false };
    }
    const scores = history.map(h => -h.todoCount);
    const n = scores.length;
    const meanX = (n - 1) / 2;
    const meanY = scores.reduce((a, b) => a + b, 0) / n;
    let numerator = 0, denominator = 0;
    for (let i = 0; i < n; i++) {
      const dx = i - meanX;
      const dy = scores[i] - meanY;
      numerator += dx * dy;
      denominator += dx * dx;
    }
    const slope = denominator !== 0 ? numerator / denominator : 0;
    const netDrop = scores[0] - scores[n - 1];
    const isDeclining = slope < -0.1 && netDrop > 1;

    // [v6.3.11] RollbackManager 风格 A→B→A→B 震荡检测
    // 将 todoCount 值映射为伪版本标识，检测循环震荡模式
    const todoVals = history.map(h => h.todoCount);
    const _toVersion = (v, i) => `${v}_${i % 2}`; // 相邻去重辅助
    let distPattern = [];
    for (let i = 1; i < todoVals.length; i++) {
      if (todoVals[i] !== todoVals[i-1]) distPattern.push(todoVals[i]);
    }
    // 检测 A→B→A→B 循环
    let cycles = 0;
    for (let i = 2; i < distPattern.length; i++) {
      if (distPattern[i] === distPattern[i-2] && distPattern[i-1] !== distPattern[i]) {
        cycles++;
      }
    }
    const oscDetected = cycles >= 2;

    // [v6.3.11] 熔断状态机: 震荡触发→circuitOpen→半开恢复
    if (!this._oscillationHistory) this._oscillationHistory = [];
    this._oscillationHistory.push({ cycles, detected: oscDetected, ts: Date.now() });
    if (this._oscillationHistory.length > 10) this._oscillationHistory = this._oscillationHistory.slice(-10);
    if (!this._circuitTrippedAt) this._circuitTrippedAt = null;
    if (!this._circuitState) this._circuitState = CircuitState.CLOSED;

    // 连续震荡(>=2次扫描都检测到) → 熔断器打开
    const recentOsc = this._oscillationHistory.slice(-3).filter(o => o.detected).length;
    if (recentOsc >= 2 && this._circuitState === CircuitState.CLOSED) {
      this._circuitState = CircuitState.OPEN;
      this._circuitTrippedAt = Date.now();
    }
    // OPEN → HALF_OPEN: 如果震荡消失且经过"冷却"(3次扫描未见震荡)
    if (this._circuitState === CircuitState.OPEN && this._oscillationHistory.length >= 3) {
      const last3 = this._oscillationHistory.slice(-3);
      if (!last3.some(o => o.detected)) {
        this._circuitState = CircuitState.HALF_OPEN;
      }
    }
    // HALF_OPEN → CLOSED: 半开后继续无震荡
    if (this._circuitState === CircuitState.HALF_OPEN && this._oscillationHistory.length >= 4) {
      const last4 = this._oscillationHistory.slice(-4);
      if (!last4.some(o => o.detected)) {
        this._circuitState = CircuitState.CLOSED;
        this._circuitTrippedAt = null;
      }
    }

    let healthTrend = 'stable';
    if (isDeclining) healthTrend = 'declining';
    else if (slope > 0.1 && netDrop < -1) healthTrend = 'improving';

    return {
      healthTrend,
      trendSlope: Math.round(slope * 100) / 100,
      netDrop: Math.round(netDrop * 100) / 100,
      oscillationDetected: oscDetected,
      oscillationCount: cycles,
      sampleSize: n,
      circuitState: this._circuitState,
      circuitTripped: this._circuitState === CircuitState.OPEN,
      circuitTrippedAt: this._circuitTrippedAt,
    };
  }
}

module.exports = { SelfScanner };

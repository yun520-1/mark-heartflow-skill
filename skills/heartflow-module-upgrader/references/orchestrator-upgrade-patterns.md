# 编排器模块升级模式参考
## 从 associative-engine.js v2.0.58 升级中提取

## 升级前分析模板

分析一个编排器/管道模块时，检查以下功能缺失清单：

```
□ 输入验证/预处理
□ 错误隔离（各层独立 try/catch）
□ 并行处理（互不依赖的步骤）
□ 层间一致性检查
□ 处理质量度量
□ 优雅降级/回退
□ 引擎统计信息
□ 导出增强
```

## 输入验证类模板

```javascript
class InputValidation {
  constructor(input) {
    this.raw = input;
    this.isValid = true;
    this.normalized = input;
    this.issues = [];
    this._validate();
  }
  _validate() {
    // 1. 类型检查 (typeof !== 'string')
    // 2. 空检查 (trim().length === 0)
    // 3. 过短警告 (< 2 chars)
    // 4. 过长截断 (> 10000 chars)
  }
  getStatus() { /* 'clean' | 'warning' | 'invalid' */ }
}
```

## 错误隔离模板

```javascript
const LayerStatus = {
  SUCCESS: 'success', DEGRADED: 'degraded',
  FAILED: 'failed',   SKIPPED: 'skipped'
};

async _safeExecuteLayer(layerName, fn, fallbackResult) {
  const start = Date.now();
  try {
    const result = await fn();
    this.metrics.recordLayer(layerName, start, LayerStatus.SUCCESS);
    return { result, status: LayerStatus.SUCCESS, error: null };
  } catch (e) {
    console.error(`[Module] ${layerName} 失败:`, e.message);
    this.metrics.recordLayer(layerName, start, LayerStatus.FAILED);
    return { result: fallbackResult, status: LayerStatus.FAILED, error: e.message };
  }
}
```

## 并行处理模板

```javascript
async _runParallelSteps(input) {
  const [resultA, resultB] = await Promise.all([
    this._safeExecuteLayer('StepA', () => this.stepA(input), fallbackA),
    this._safeExecuteLayer('StepB', () => this.stepB(input), fallbackB)
  ]);
  return { resultA, resultB };
}
```

## 一致性检查器模板

```javascript
class CoherenceChecker {
  static checkStepA_StepB(aResult, bResult) {
    const issues = [];
    // 验证两个步骤的输出是否一致
    // 返回 { coherent: boolean, score: number, issues: string[] }
  }
  static runAllChecks(steps) {
    // 运行所有检查，聚合总体一致性评分
    // 返回 { overallCoherent, overallScore, detail: {...}, allIssues }
  }
}
```

## 质量度量模板

```javascript
class ProcessingMetrics {
  start() { this.startTime = Date.now(); }
  recordLayer(name, startTime, status) {
    this.layerTimes[name] = Date.now() - startTime;
    this.layerStatuses[name] = status;
  }
  getSummary() {
    return {
      totalTime, layerBreakdown, layerStatuses,
      failedLayers, degradedLayers, coherenceScore,
      qualityScore: (coherence * 0.4) + (noFailed * 0.3) + (noDegraded * 0.15) + (speed * 0.15)
    };
  }
}
```

## 优雅降级模板

```javascript
_buildDegradedResponse(layers, metrics) {
  if (关键层全部失败) {
    return { response: '我暂时无法理解你的意思...', internal: { degraded: true } };
  }
  if (输出层成功) {
    return { response: 输出层结果, internal: { degraded: true, failedLayers } };
  }
  return { response: 基于可用数据的回退响应, internal: { degraded: true } };
}
```

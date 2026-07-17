# 启动自检/健康检查引擎升级模式（boot-check 类）

## 概述

启动自检引擎（boot-check.js）是 HeartFlow 系统的第一道防线，负责在启动时验证核心文件的完整性、模块加载能力、版本一致性。升级前（v1.0.0）仅做二元通过/不通过检查，缺少运行时健康评估、修复建议、版本一致性验证等实质性逻辑。

**类特征**：
- 运行时首次执行（startup），非按需加载
- 核心操作是检查"文件存在+内容验证"和"模块能否 require"
- 结果用于决定系统能否启动（allPass）或是否降级运行（degraded）
- 不修改任何系统状态，纯只读检测

## 典型功能缺失

| 维度 | 缺失情况 |
|------|---------|
| 状态/等级枚举 | 无严重等级、无健康等级、无错误分类 |
| 版本一致性检查 | 只依赖 package.json 的版本号，不交叉验证 VERSION/SKILL.md/package.json |
| 健康评分 | 无，只有二元 allPass/degraded |
| 修复建议 | 无，用户看到 FAIL 不知道怎么办 |
| 运行时健康指标 | 无模块加载耗时/缓存状态/新鲜度追踪 |
| 外部接口 | 只有 bootCheck() 一个入口 |

## 标准升级清单

### 1. 严重等级枚举

```javascript
const SEVERITY = {
  CRITICAL: 'CRITICAL',  // 核心文件缺失/版本冲突 → 无法启动
  HIGH: 'HIGH',          // 必要模块加载失败 → 功能降级
  MEDIUM: 'MEDIUM',      // 可选模块加载失败 → 部分功能不可用
  LOW: 'LOW',            // 缓存行为/加载时间异常 → 性能建议
  INFO: 'INFO',          // 信息性提示
};
```

### 2. 健康等级边界

```javascript
const HEALTH_GRADE = {
  EXCELLENT: { min: 90, label: 'EXCELLENT' },
  GOOD:      { min: 70, label: 'GOOD' },
  FAIR:      { min: 50, label: 'FAIR' },
  POOR:      { min: 25, label: 'POOR' },
  CRITICAL:  { min: 0,  label: 'CRITICAL' },
};
```

### 3. 修复建议模板

每种检测失败类型对应一个模板，包含 severity + 人类可读消息 + 可执行修复命令：

```javascript
const FIX_TEMPLATES = {
  file_missing: {
    severity: SEVERITY.CRITICAL,
    message: (item) => `文件 ${item.path} 缺失`,
    action: (item) => `git checkout HEAD -- "${item.path}"`,
  },
  file_content: {
    severity: SEVERITY.HIGH,
    message: (item) => `文件 ${item.path} 内容校验失败`,
    action: (item) => `重新生成或从备份恢复 "${item.path}"`,
  },
  module_load: {
    severity: SEVERITY.HIGH,
    message: (item) => `模块 ${item.label} (${item.path}) 加载失败`,
    action: (item) => `检查 ${item.path} 导出是否正确`,
  },
  version_file_mismatch: {
    severity: SEVERITY.MEDIUM,
    message: (file, expected, actual) => `${file} 版本不一致: 期望 ${expected}, 实际 ${actual}`,
    action: (file, expected) => `手动更新 ${file} 中版本号为 ${expected}`,
  },
  slow_module: {
    severity: SEVERITY.LOW,
    message: (item, ms) => `模块 ${item.label} 加载耗时 ${ms}ms，超过阈值`,
    action: (item) => `考虑优化 ${item.path} 的初始化逻辑或延迟加载`,
  },
};
```

### 4. 版本一致性检查

跨 VERSION / package.json / SKILL.md frontmatter 三个版本来源做一致性校验：

```javascript
function checkVersionConsistency() {
  const versionSources = {};
  // 1) VERSION 文件
  // 2) package.json 的 version 字段
  // 3) SKILL.md frontmatter: version: "x.y.z"
  // 比对去重后的版本列表，发现多个不同版本则标记冲突
  return {
    consistent: uniqueVersions.length <= 1,
    files: versionSources,
    expectedVersion: uniqueVersions[0] || 'unknown',
    conflicts,
  };
}
```

### 5. 综合健康评分（0-100）

5 维度加权评分：

| 维度 | 权重 | 评分逻辑 |
|------|------|---------|
| 文件完整性 | 40分 | 通过率 × 40（仅 required 文件） |
| 模块加载 | 25分 | 加载成功率 × 25 |
| 版本一致性 | 15分 | 一致 = 15，不一致 = 0 |
| 加载性能 | 10分 | 每慢模块扣 3 分 |
| 模块新鲜度 | 10分 | 缓存率 30-95% = 按比例，>95% = 5 分（可能不更新） |

### 6. 修复建议生成引擎

```javascript
function _generateFixSuggestions(fileResults, moduleResults, versionCheck) {
  const suggestions = [];
  // 1) 文件缺失/内容失败
  // 2) 模块加载失败
  // 3) 版本冲突
  // 4) 慢模块
  return suggestions; // 每项有 id/severity/message/action/target
}
```

### 7. 报告摘要字段

```javascript
summary: {
  status: 'READY' | 'DEGRADED' | 'FAILED',
  healthScore: 88,
  healthGrade: 'GOOD',
  fixableIssues: 1,
  criticalIssues: 0,
  highIssues: 1,
  mediumIssues: 0,
  lowIssues: 0,
}
```

### 8. 新增导出接口

```javascript
module.exports = {
  bootCheck,            // 原有接口，扩展了返回结构
  CORE_CHECKS,          // 原有
  MODULE_CHECKS,        // 原有
  getFixSuggestions,    // 新增：外部调用获取修复建议
  checkVersionConsistency, // 新增：单独调用版本一致性检查
};
```

## 参考实现

`boot-check.js` v1.0.0 → v1.1.0（7751B → 20926B）的升级过程：

**新增方法**：
- `checkVersionConsistency()` — 跨文件版本一致性校验（~50行）
- `_computeHealthScore()` — 5维度加权评分（~60行）
- `_generateFixSuggestions()` — 自动修复建议生成（~50行）
- `getFixSuggestions()` — 外部导出接口（~25行）

**新增常量**：
- `SEVERITY` 枚举（5级）
- `HEALTH_GRADE` 边界表（5级）
- `FIX_TEMPLATES` 修复模板（6种失败类型）
- `SLOW_MODULE_THRESHOLD_MS` 阈值（500ms）

## 验证方法

```bash
# 1. 语法检查
node --check src/core/boot-check.js

# 2. 加载测试
node -e "const { bootCheck } = require('./src/core/boot-check.js'); console.log('loaded')"

# 3. 功能测试
node -e "
const { bootCheck, checkVersionConsistency, getFixSuggestions } = require('./src/core/boot-check.js');
const report = bootCheck(true);
console.log('Health:', report.health.score + '/100', report.health.grade);
console.log('Version consistent:', report.versionConsistency.consistent);
console.log('Issues:', report.summary.fixableIssues);
"
```

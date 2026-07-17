# ThinkCheck Logger 调试参考

> 2026-06-22 基于心虫 v3.4.4 引擎

## 模块位置

`src/core/thinkcheck-logger.js` v1.0.0

## 功能

在 `think()` 调用后自动输出结构化决策轨迹，格式兼容 ThinkCheck 的 U/D/A/H 分析。

## 触发条件

心虫 `think()` 方法每次调用时自动触发（在 heartflow.js 的 think() 方法末尾注入）。

## 输出

默认输出到 `/tmp/heartflow-thinkcheck.log`，格式为块状 key=value 结构。

## 环境变量

| 变量 | 作用 | 默认值 |
|------|------|--------|
| `THINKCHECK_LOG` | 日志文件路径 | `/tmp/heartflow-thinkcheck.log` |
| `DEBUG_THINKCHECK` | 控制台输出 | 未设置时静默 |

## 验证命令

```bash
# 触发一次 think() 调用，查看日志
heartflow status
cat /tmp/heartflow-thinkcheck.log

# 或直接调用引擎
node -e "
const {HeartFlow} = require('/path/to/src/core/heartflow.js');
const hf = new HeartFlow({rootPath: '/path/to'});
hf.start();
hf.think('测试输入');
console.log(require('fs').readFileSync('/tmp/heartflow-thinkcheck.log','utf8'));
"
```

## 常见问题

### A值在 ThinkCheck 报告中归零

**原因**：原始日志用自然语言描述置信度（"置信度0.92"），ThinkCheck 的语言特征检测无法解析为 A 维度。

**修复**：在决策记录中使用显式数值字段（`truth_confidence: 0.92`），ThinkCheck 直接解析数值。

**验证**：新日志格式下 A 值应在 0.018-0.036 范围内（视决策内容而定），不会归零。

### ThinkCheck 采样点不足

**原因**：日志文件过短（< 3000 字符），ThinkCheck 只能采样 20-30 个点。

**修复**：生成 20+ 条决策，日志长度 > 6000 字符，ThinkCheck 可采样 60+ 点。

### 模块存在但 dispatch 返回 "Unknown subsystem"

**原因**：模块在构造函数中实例化 + ALLOWED_ROUTES 有路由，但 `subsystemNames` 数组没包含模块名。

**修复**：在 `_registerModules` 的 `subsystemNames` 数组（两处，约第667行和第1014行）添加模块名。

## 参考

- `references/thinkcheck-structured-log-pattern.md` (in heartflow-truthfulness skill) — 完整日志格式规范

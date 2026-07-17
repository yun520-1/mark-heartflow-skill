# ReportGenerator 输出层 · 实战记录

## 创建时间
2026-06-24，心虫 v4.1.4 → v4.2.0

## 触发原因
用户连续两次反馈：
1. "完全看不懂你说什么，什么是重点" — 引擎原始数据直接暴露
2. "测底重写心虫的输出模式" — 要求输出直接是可读结论
3. "为什么要给我数值" — 数值对用户无意义

## 核心改动

| 文件 | 改动 |
|------|------|
| `src/report/report-generator.js` | **新增** — 报告生成器模块，将引擎原始数据转为三段式结论 |
| `bin/cli.js` | `chatOnce()` 和 `chatMode()` 使用 `formatReport()` 替代 `formatCognitiveSummary()` |
| `mcp/mcp-server-http.js` | `handleThink()` 返回 `{ report, timestamp }` 替代原始数据 |
| `package.json` | 版本 4.1.4 → 4.2.0 |
| `VERSION` | 4.1.4 → 4.2.0 |

## ReportGenerator 设计

### 输入
`think()` 返回值的 `{ analysis, decision, meta, output }` 结构

### 输出
```json
{
  "report": {
    "judgment": {
      "emotion": "质疑·防御性",
      "intensity": "中等",
      "text": "情绪状态：质疑·防御性（中等）",
      "explanation": "对方在用反问和否定表达不满..."
    },
    "localization": {
      "domain": "消费决策冲突",
      "coreIssue": "购买数量被质疑",
      "severity": "需关注",
      "details": ["这不是针对你这个人..."]
    },
    "suggestion": {
      "actionType": "接受质疑，不解释",
      "priority": "高",
      "steps": ["不要解释你为什么买这么多..."]
    }
  }
}
```

### 引擎数据不足时的回退策略
当 emotion/tone/pain 模块返回 undefined/unknown/neutral 时，从输入文本做关键词分析：
- 反问词 + 否定词 → "质疑·防御性"
- 数量词 + 否定词 → "消费决策冲突"
- 价格相关词 → "价格质疑"

### 调试模式
`process.env.DEBUG_HF=1` 或 `new ReportGenerator({ debug: true })` 时附加原始数据

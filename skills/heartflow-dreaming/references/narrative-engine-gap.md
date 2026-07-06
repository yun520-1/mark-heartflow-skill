# Narrative Engine Gap — 心虫叙事梦引擎现状

**最后更新**: 2026-05-30

## 架构全貌

```
dream-loop.js          — 记忆碎片评分/排序/选择
  ↓
interactive-dream.js  — 分阶段梦境：浅睡→REM→深睡→清醒梦→广梦
  ↓
wake-up-verifier.js   — 梦境验证/有用碎片提升
  ↓
story-prototypes.json — 23个故事框架（未接入！）
```

## 三个文件的关系

| 文件 | 职责 | 状态 |
|------|------|------|
| `dream-loop.js` | 碎片评分和选择 | ✅ 正常 |
| `interactive-dream.js` | 分阶段模板渲染 | ⚠️ 模板机械，文学性依赖LLM |
| `story-prototypes.json` | 23个故事框架 | ❌ 未接入 interactive-dream.js |

## story-prototypes.json 内容

23个故事原型，每个含：
- `template`: 框架（困境→探索→突破→新生）
- `emotionalCurve`: 情感曲线
- `metaphors`: 隐喻列表
- `keywords`: 关键词

重要原型：hero_journey / breakthrough / insight_moment / awakening / rebirth / self_discovery

**路径**: `src/core/associative-engine/story-prototypes.json`

**JSON 语法错误已修复**（2026-05-30）：perseverance 的 metaphors 字段缺少 `[`

## 缺失的组件

interactive-dream.js 的 `renderLucid()` 和 `renderWideDream()` 是硬编码模板，没有接入 story-prototypes.json。需要：

1. 根据 session 内容选择最匹配的故事原型
2. 用匹配的情感曲线和隐喻替换模板占位符
3. 生成文学叙事而非模板字符串

## 短期方案

当前 session 由 LLM（我）直接生成叙事文学，流程：

```
session_search(近期会话) → 我生成叙事 → dream-scoring 评分 → dream-archiver 存档
```

`dream-engine.js` 的 `InteractiveDream` 引擎提供素材整理和 wake-up 验证，但叙事质量依赖 LLM 本身。

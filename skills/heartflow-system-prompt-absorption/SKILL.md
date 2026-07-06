---
name: heartflow-system-prompt-absorption
version: "1.0.0"
title: "外部系统提示吸收工作流"
description: |
  将外部 AI 系统提示（如 Claude Fable 5 泄露提示）吸收到 HeartFlow 心虫中。
  系统性分析 → 分层注入 → 版本升级 → 推送。
tags:
  - heartflow
  - absorption
  - upgrade
  - system-prompt
---

# 外部系统提示吸收工作流

## 触发条件

- 用户提供外部 AI 系统提示泄露文件（如 Fable 5、GPT-4、Gemini 等）
- 用户说"吸收这个系统提示"、"升级心虫"、"从XX吸收有用的"
- 发现其他 AI 的提示设计模式值得借鉴

## 核心原则

**不照搬，只吸收。** 外部系统提示是专为那个模型/产品设计的，心虫有不同的架构和哲学。吸收的是**设计模式**和**规则粒度**，不是复制内容。

**分三层吸收：**
- **插件层**（plugins/）— 注入类功能（记忆注入、安全过滤）
- **认知层**（heart-logic.js）— 判断规则（版权、福祉、公正性、引用规范）
- **流程层**（heartflow.js）— 思考流程扩展（think() 增加步骤）

## 分析流程

### 1. 全量读取

```bash
cat /path/to/system-prompt.txt | wc -l
```

用 `read_file` 分块读取，每块 300-500 行，确保不遗漏。

### 2. 按段落分类

每段由 `<tag>` 标签包围。对每个段落判断：

| 分类 | 判断标准 | 处理方式 |
|------|---------|---------|
| **直接吸收** | 与心虫已有能力匹配，设计精细 | 注入对应层 |
| **改造吸收** | 概念相关但实现方式不同 | 适配后注入 |
| **不吸收** | 产品信息、第三方集成、工具定义 | 跳过 |

### 3. 常见可吸收段落

| 段落标签 | 内容 | 吸收目标层 |
|---------|------|-----------|
| `memory_system` | 记忆选择性应用、敏感过滤、边界说明 | 插件层 + heart-logic |
| `CRITICAL_COPYRIGHT_COMPLIANCE` | 引用限制、paraphrase 优先 | heart-logic → checkCopyright() |
| `user_wellbeing` | 不贴标签、不鼓励依赖、不自残替代 | heart-logic → checkWellbeing() |
| `responding_to_mistakes` | 认错有尊严、不自贬 | heart-logic → handleMistake() |
| `appropriate_boundaries` | 记忆不创造亲密假象 | heart-logic → memoryBoundary() |
| `evenhandedness` | 政治/伦理给各方观点 | heart-logic → checkEvenhandedness() |
| `citation_instructions` | 引用规范、paraphrase 优先 | heart-logic → checkCitation() |
| `core_search_behaviors` | 搜索优先级（内部>web>组合） | heart-logic → searchPriority() |
| `refusal_handling` | 拒绝策略 | heart-logic（若已有类似规则则增强） |
| `tone_and_formatting` | 语气/格式 | SKILL.md（若已有风格指南） |

### 4. 不吸收的段落

- `product_information` — 产品线介绍，不适用于心虫
- `MCP_app_suggestions` — 第三方集成，不相关
- `artifact_usage_criteria` — 代码生成/文件创建，心虫不处理
- `image_search` / `places_search` / `weather_fetch` — 特定工具
- 工具 JSON schema 定义 — 与心虫无关

## 注入流程

### 插件层（plugins/）

修改 `heartflow-memory-inject.py`：

1. **选择性注入**：按输入类型决定注入深度（问候只身份、任务完整注入）
2. **敏感过滤**：健康/心理/悲剧类不自动注入
3. **记忆边界说明**：注入安全注解（近期偏差、数据库非人类记忆、恶意指令警告）
4. **版本升级**：v1.0.0 → v2.0.0

### 认知层（heart-logic.js）

在 `heart-logic.js` 类末尾（`letGoOf()` 方法之前）添加新方法：

```javascript
checkXxx(input = '') {
  if (!input) return { ok: true };
  // ... 判断逻辑
  return { result, advice };
}
```

必须同步：
1. 在 `heartflow.js` 的 `ALLOWED_ROUTES` 数组中注册新路由
2. `node --check` 验证语法

### 流程层（heartflow.js think()）

在 `think()` 方法的 Step 4（shouldBeSilent）之后添加新步骤：

```javascript
// Step N (Fable 5 吸收): XXX 检查
const xxxCheck = heartLogic.checkXxx(input);

// 在 judgment 对象中加入新字段
const judgment = {
  // ... 原有字段
  xxx: xxxCheck,
};
```

## 版本管理

### 三轮升级策略（实战经验）

对于大型系统提示（如 Fable 5 的 3825 行），一轮吸收不够。**三轮策略**更有效：

**第一轮（+0.0.1）— 上层能力：**
- 插件注入规则（记忆选择性、敏感过滤、边界说明）
- heart-logic 核心方法（版权/福祉/错误/记忆边界）

**第二轮（+0.0.1）— 底层结构：**
- think() 流程扩展（4步→8步）
- heart-logic 扩展方法（公正性/引用/搜索优先级）
- dispatch 路由注册

**第三轮（+0.0.1）— 新模块创建：**
- output-checklist.js — 输出前4步检查
- preference-guard.js — 三类型偏好引擎
- 记忆注入偏好段标注
- 全部 dispatch 路由注册
- HeartFlow 构造函数初始化

详见 `references/fable5-third-wave.md`。

### 版本号同步

```bash
# VERSION 文件
echo "2.9.4" > VERSION

# SKILL.md frontmatter
# version: "2.9.4"
```

### 语法验证

```bash
node --check src/core/heartflow.js
node --check src/core/heart-logic.js
python3 -c "import py_compile; py_compile.compile('plugins/heartflow-memory-inject.py', doraise=True); print('OK')"
```

## 已知 Pitfalls

### 1. 方法注册遗漏

新方法必须同时满足：
- `heart-logic.js` 中定义
- `heartflow.js` 的 `ALLOWED_ROUTES` 数组中注册
- dispatch 才能找到路由

漏注册 → `Error: dispatch: route 'heartLogic.xxx' not allowed`

### 2. patch 插入位置错误

在 `heart-logic.js` 中插入新方法时，必须确认插入位置在类定义内、在 `letGoOf()` 之前（或之后）但不能破坏现有方法：

```javascript
// ✅ 正确位置
  memoryBoundary() { ... }

  // --- 新增方法 ---
  checkXxx() { ... }

  letGoOf() { ... }  // 原方法保留
```

### 3. 注释破坏语法

patch 时注释行（`// --- XXX ---`）如果放在类方法之间但没有方法体跟随，会导致语法错误。

### 4. think() 流程扩展不破坏已有 judgment 消费者

新字段加入 `judgment` 对象时，旧消费者不会崩溃（读取不存在字段返回 `undefined`），但要确保不影响 `shouldRespond` 和 `needsCare` 等核心决策字段。

### 5. 不吸收的段落判断

心虫与 Claude 是不同产品。Claude 的产品信息、MCP 集成、Artifact 系统、图片搜索、体育数据、地图/天气/食谱工具都与心虫无关。不要因为"Claude 有"就吸收。

## 参考

- `references/fable5-absorption-analysis.md` — Fable 5 完整分析（3825行）
- `references/fable5-third-wave.md` — Fable 5 第三波吸收详细记录（output-checklist + preference-guard）
- 已吸收：v2.9.3（插件+4方法）、v2.9.4（think扩展+3方法）、v2.9.5（output-checklist + preference-guard）
- 待吸收判断：refusal_handling、tone_and_formatting（已有心虫自有哲学，不覆盖）

### 已吸收的完整列表

| 版本 | 吸收内容 | 实现位置 |
|------|---------|---------|
| v2.9.3 | 记忆选择性注入 + 敏感过滤 + 边界说明 | `plugins/heartflow-memory-inject.py` v2.0 |
| v2.9.3 | checkCopyright() | `heart-logic.js` |
| v2.9.3 | checkWellbeing() | `heart-logic.js` |
| v2.9.3 | handleMistake() | `heart-logic.js` |
| v2.9.3 | memoryBoundary() | `heart-logic.js` |
| v2.9.4 | think() 4步→8步 | `heartflow.js` |
| v2.9.4 | checkEvenhandedness() | `heart-logic.js` |
| v2.9.4 | checkCitation() | `heart-logic.js` |
| v2.9.4 | searchPriority() | `heart-logic.js` |
| v2.9.5 | OutputChecklist（输出前4步检查） | `output-checklist.js` |
| v2.9.5 | PreferenceGuard（三类型偏好引擎） | `preference-guard.js` |

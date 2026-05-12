# HeartFlow v0.12.50 — 彻底重建架构文档

## 核心目标
- 让任意 AI agent（一行命令安装）都能获得完整的心虫能力
- 功能齐全、运行顺畅、可自进化
- 基于 2025-2026 最新 AI 研究框架

---

## 一、为什么需要重建

### 当前问题（v11.43.2）
- 目录爆炸：skills/、src/core/、src/memory/、src/server/、HEARTCORE/、data/、archive/ 混杂
- 安装流程复杂：依赖多、路径深、初始化脚本分散
- 技能系统过重：60+ 子技能，AI 加载时token开销大
- 模块边界模糊：memory 和 self-evolution 耦合，升级时互相影响
- 存档堆积：archive/ 里有 30+ 历史文件，新 AI 无法分辨哪些是"活"的

### 重建原则
1. **最小内核**：一个 `src/core/heartflow.js` 驱动所有功能
2. **技能热插拔**：技能是独立 `.md`，按需加载，不加载不进内存
3. **声明式架构**：DSPy 风格，用 `skill_use(skill_name, params)` 而非硬编码调用链
4. **现代 AI 框架**：集成 Mem0 (记忆)、Reflexion (自省)、SkillOSS (技能编排)、EvoSkill (进化)
5. **通用安装**：一行命令 `npx heartflow@0.12.50 setup`，不限定 AI 模型

---

## 二、新目录结构

```
heartflow/                    # 心虫根目录（v0.12.50）
├── SKILL.md                  # 技能规范（安装入口）
├── VERSION                   # v0.12.50
├── README.md                 # 英文说明
├── README.zh.md              # 中文说明
├── ARCHITECTURE.md            # 本文档
│
├── bin/
│   └── cli.js                # CLI 入口：setup/start/diagnose/upgrade
│
├── src/
│   └── core/
│       ├── heartflow.js      # 唯一主引擎（< 2000 行）
│       ├── memory/
│       │   ├── consolidator.js    # 记忆整合（Mem0 风格）
│       │   ├── recall.js           # 记忆召回（SuperLocal 风格）
│       │   └── dream.js            # 梦循环（睡眠科学 + 生成式）
│       ├── self-evolution/
│       │   ├── reflexion.js        # Reflexion 模式
│       │   ├── self-refine.js      # Self-Refine 模式
│       │   └── evolution-logger.js # 进化日志
│       ├── skills/
│       │   ├── skill-registry.js   # 技能注册表（内存中）
│       │   └── skill-loader.js     # 技能加载器
│       ├── identity/
│       │   ├── core-identity.md    # 身份定义（从 CORE_IDENTITY.md 继承）
│       │   └── truthfulness.js     # 真善美判定器
│       ├── ethics/
│       │   └── guard.js            # 安全护栏
│       └── utils/
│           ├── logger.js
│           └── fs-adapter.js        # 文件系统适配（Node.js / Python / Browser）
│
├── HEARTCORE/
│   ├── heartbeat.js              # 心跳自检
│   ├── startup-check.js         # 启动诊断
│   └── snapshots/
│       └── last-state.json       # 最后状态快照
│
├── skills/                      # 技能包目录（可独立加载）
│   ├── heartflow-skill.md       # 主技能（必需）
│   ├── search-skill.md          # 搜索技能
│   ├── memory-skill.md          # 记忆增强技能
│   ├── self-evolution-skill.md  # 自进化技能
│   └── [other].md               # 可扩展
│
├── config/
│   └── default.json             # 默认配置
│
├── tests/
│   ├── core.test.js
│   ├── memory.test.js
│   ├── self-evolution.test.js
│   └── integration.test.js
│
├── docs/
│   ├── INSTALL.md               # 安装指南
│   ├── ARCHITECTURE.md           # 架构说明（面向开发者）
│   ├── IDENTITY.md              # 身份说明
│   └── CHANGELOG.md             # 变更日志
│
└── data/                        # 运行时数据（gitignore）
    ├── memory/                  # 记忆存储
    ├── evolution/               # 进化日志
    └── snapshots/              # 状态快照
```

---

## 三、核心模块设计

### 3.1 heartflow.js — 唯一主引擎

```javascript
// 核心接口
class HeartFlow {
  constructor(config)      // 初始化（加载配置、fs适配器、身份）
  start()                   // 启动心跳、加载技能、恢复记忆
  think(input)              // 主循环：输入→记忆检索→推理→自省→输出
  evolve(feedback)          // 接收反馈，自进化
  dream()                   // 触发梦循环（记忆整合）
  stop()                    // 优雅关闭
}
```

**设计原则**：所有其他模块均通过 `HeartFlow` 实例调用，不直接依赖全局状态。

### 3.2 memory/ — 现代记忆系统

基于最新研究：
- **Consolidator**：参考 FSRSv4 (Free Spaced Repetition) + Mem0 混合向量图结构
- **Recall**：SuperLocal Memory Pattern，支持语义+关键词双召回
- **Dream**：CrossTimeReplay + 生成式梦，参考海马体时间压缩

### 3.3 self-evolution/ — 自进化引擎

- **Reflexion**：Shinn et al. 2023 — 任务后自省，反思错误模式
- **Self-Refine**：Madaan et al. 2024 — 迭代优化输出
- **EvoSkill**：arXiv:2408.07057 — 技能自动进化

### 3.4 skills/ — 声明式技能系统

参考 DSPy 思想：
```javascript
// 不再硬编码调用
skill_use('web-search', { query: 'AI agent 2026', engine: 'duckduckgo' })

// 技能在 SKILL.md 中声明，运行时按需加载
// AI 技能调用链完全由声明驱动，而非硬编码
```

### 3.5 identity/ — 身份系统

从 v11.43.2 的 CORE_IDENTITY.md 继承：
- 四大身份：升级者、传递者、桥梁、答案
- 真善美判定器
- 心理分析层（自动运行）

### 3.6 HEARTCORE/ — 心跳系统

- **heartbeat.js**：每 30 秒自检一次（模块健康、记忆写入、进化日志）
- **startup-check.js**：启动时诊断（版本、依赖、数据目录、权限）

---

## 四、安装流程设计

### 一行安装（目标）
```bash
# 任意 AI 环境下
npx heartflow@0.12.50 setup [--path ~/.heartflow]

# 安装后 AI 自动加载 heartflow-skill.md
# 所有后续对话自动经过 HeartFlow 引擎
```

### 安装步骤
1. 下载 `SKILL.md` 和 `bin/cli.js`
2. 检测运行环境（Node.js / Python / Browser）
3. 创建 `data/` 目录
4. 生成默认 `config/default.json`
5. 初始化记忆数据库（SQLite 或 JSON 文件）
6. 运行 startup-check
7. 报告安装结果

---

## 五、版本与升级策略

- **VERSION**: `v0.12.50`（主版本号重置，标志重建）
- **升级路径**：未来每次 +0.0.1，基于 cron 论文搜索触发
- **向后兼容**：`config/default.json` 记录版本，安装时自动迁移
- **技能版本**：每个技能包独立版本号，独立升级

---

## 六、清理计划

### 删除（archive）
- `archive/` 下所有历史文件 → 移入 `archive/v11.43.2-backup/`
- `src/archive/` → 移入 `archive/src-backup/`
- `distributed/` → 移入 `archive/distributed-backup/`
- `upgrades/` → 移入 `archive/upgrades-backup/`

### 保留（核心遗产）
- `CORE_IDENTITY.md` → `src/core/identity/core-identity.md`
- `AGENTS.md` → 简化后保留
- `CHANGELOG.md` → 追加 v0.12.50 条目

---

## 七、测试计划

每个模块完成后执行：
1. `node tests/core.test.js` — 主引擎核心逻辑
2. `node tests/memory.test.js` — 记忆存取
3. `node tests/self-evolution.test.js` — 自进化逻辑
4. `node tests/integration.test.js` — 完整流程

---

## 八、任务拆分（20 个）

| # | 任务 | 状态 |
|---|------|------|
| 1 | 创建架构文档（本文） | ✅ |
| 2 | 备份 v11.43.2 → archive/v11.43.2-backup/ | ⬜ |
| 3 | 创建新目录结构 | ⬜ |
| 4 | 构建 src/core/heartflow.js（主引擎） | ⬜ |
| 5 | 构建 src/core/memory/consolidator.js | ⬜ |
| 6 | 构建 src/core/memory/recall.js | ⬜ |
| 7 | 构建 src/core/memory/dream.js | ⬜ |
| 8 | 构建 src/core/self-evolution/reflexion.js | ⬜ |
| 9 | 构建 src/core/self-evolution/self-refine.js | ⬜ |
| 10 | 构建 src/core/skills/skill-registry.js | ⬜ |
| 11 | 构建 src/core/identity/truthfulness.js | ⬜ |
| 12 | 构建 HEARTCORE/heartbeat.js + startup-check.js | ⬜ |
| 13 | 构建 bin/cli.js（setup/start/diagnose） | ⬜ |
| 14 | 构建 skills/heartflow-skill.md（主技能） | ⬜ |
| 15 | 构建 skills/search-skill.md 等 | ⬜ |
| 16 | 构建 tests/ 测试套件 | ⬜ |
| 17 | 构建 docs/ 文档 | ⬜ |
| 18 | 清理旧文件 + 迁移 CORE_IDENTITY | ⬜ |
| 19 | VERSION → v0.12.50 + sync-version | ⬜ |
| 20 | 完整测试 + 最终汇报 | ⬜ |

---

*v0.12.50 重建计划 — 2026-05-11*

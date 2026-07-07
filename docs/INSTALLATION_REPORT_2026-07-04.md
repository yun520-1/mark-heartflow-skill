# HeartFlow 安装报告

**日期**: 2026-07-04
**环境**: macOS (Darwin 25.5.0), Node.js >= 18, Claude Code CLI
**安装目标**: `yun520-1/claude-heartflow-skill` + `yun520-1/mark-heartflow-skill`

---

## 一、安装概览

| 仓库 | 版本 | 安装方式 | 结果 |
|------|------|---------|------|
| `claude-heartflow-skill` | v2.8.0 | git clone + install.sh --all | ✅ 成功（含 2 个热修复） |
| `mark-heartflow-skill` | v5.7.3 | git clone + npm install + verify | ✅ 成功（含 1 个热修复） |

---

## 二、问题清单（按严重程度排序）

### 🔴 P0 — 阻断安装

| # | 问题 | 仓库 | 表现 | 根因 |
|---|------|------|------|------|
| 1 | **`../memory/meaningful-memory.js` 路径错误** | claude-heartflow-skill | `Cannot find module '../memory/meaningful-memory.js'` | require 路径指向不存在的 `src/memory/`，实际文件在 `src/core/` |
| 2 | **`addCore` / `addLearned` / `addEphemeral` / `search` / `getMemoryStats` 方法缺失** | claude-heartflow-skill | `this.memory.addCore is not a function` | `MeaningfulMemory` 类只实现了内部方法，没有实现 `heartflow.js` 调用的兼容 API |
| 3 | **`claim-extractor` 路径错误** | mark-heartflow-skill | `Cannot find module './claim-extractor'` | 文件实际在 `src/reasoning/claim-extractor.js`，代码却 require `./` |

### 🟡 P1 — 兼容性问题（不阻断但报错）

| # | 问题 | 仓库 | 表现 | 根因 |
|---|------|------|------|------|
| 4 | **`ConfidenceAnnotator` 类构造器缺失** | mark-heartflow-skill | `_ConfidenceAnnotator(...).ConfidenceAnnotator is not a constructor` | 模块只导出了 `confidenceAnnotator` 对象，没有导出 `ConfidenceAnnotator` 类 |

### 🟢 P2 — 基础设施问题

| # | 问题 | 仓库 | 表现 | 根因 |
|---|------|------|------|------|
| 5 | **GitHub 在国内无法直接访问** | 两个仓库 | `Could not resolve host: github.com` | DNS 污染 / GFW |
| 6 | **MCP 包装脚本硬编码路径** | claude-heartflow-skill | 首次启动时找不到模块 | `heartflow-mcp-wrapper.sh` 假设仓库已存在于固定路径 |
| 7 | **本地 SKILL.md 版本 (v7.6) 远高于远程 (v2.8.0)** | claude-heartflow-skill | 版本冲突，用户可能困惑 | 本地自定义版本未与远程同步 |

---

## 三、安装步骤 & 每个步骤的摩擦点

### 步骤 1：克隆仓库

**预期**: `git clone` 一次完成
**实际**: GitHub 被墙，尝试了 4 个镜像，第 4 个才成功

| 尝试 | 镜像 | 结果 |
|------|------|------|
| 1 | `https://github.com/...` | ❌ DNS 解析失败 |
| 2 | `https://ghfast.top/...` | ❌ DNS 解析失败 |
| 3 | `https://gitclone.com/...` | ❌ 502 错误 |
| 4 | `https://gh-proxy.com/...` | ✅ 成功 |

**耗时**: ~30 秒（预期 3 秒）
**摩擦**: 高 — 国内用户几乎必遇此问题

### 步骤 2：安装依赖

**预期**: `npm install` 一次完成
**实际**: mark-heartflow-skill 的 `optionalDependencies` 需要下载 `@xenova/transformers`，但网络不稳定

**解决**: 使用 `--prefer-offline` 或跳过 optional
**耗时**: ~7 秒
**摩擦**: 低

### 步骤 3：验证安装

**预期**: `node bin/verify.js` 全部通过
**实际**: 两个仓库都有运行时模块加载错误

**修复操作**:
1. claude-heartflow-skill: 修改 `src/core/heartflow.js` 第 38 行 require 路径
2. claude-heartflow-skill: 在 `src/core/meaningful-memory.js` 补全 5 个兼容方法
3. mark-heartflow-skill: 修改 `src/core/confidence-annotator.js` 第 22 行 require 路径
4. mark-heartflow-skill: 在 `src/core/confidence-annotator.js` 补全 `ConfidenceAnnotator` 类

**耗时**: ~5 分钟（手动排查 + 修复）
**摩擦**: 极高 — 普通用户无法自行修复

### 步骤 4：MCP 配置

**预期**: 安装脚本自动完成
**实际**: claude-heartflow-skill 的 `install.sh --all` 工作正常

**摩擦**: 低

### 步骤 5：启动守护进程

**预期**: 直接运行
**实际**: 首次启动报错（问题 1+2），修复后成功

**摩擦**: 中

---

## 四、总体验评分

| 维度 | 评分 | 说明 |
|------|------|------|
| 克隆获取 | ⭐⭐ | GitHub 被墙是最大障碍 |
| 依赖安装 | ⭐⭐⭐⭐ | 无第三方必选依赖，加分 |
| 开箱即用 | ⭐ | 3 个代码 bug 必须手动修复 |
| 错误提示 | ⭐⭐ | `Cannot find module` 不够明确 |
| 文档清晰度 | ⭐⭐⭐ | README/INSTALL.md 写得不错 |
| 自动化程度 | ⭐⭐⭐ | install.sh 能处理 MCP 配置 |

---

## 五、优化建议（按优先级排序）

### 🔴 必须修复（阻断安装）

1. **修复 require 路径错误**
   - `claude-heartflow-skill/src/core/heartflow.js` 第 38 行
   - `mark-heartflow-skill/src/core/confidence-annotator.js` 第 22 行
   - **建议**: 在所有 `require` 调用前增加路径验证，或在 CI 中加 `node --check` 步骤

2. **补全 MeaningfulMemory 兼容 API**
   - `claude-heartflow-skill/src/core/meaningful-memory.js` 缺少 `addCore` / `addLearned` / `addEphemeral` / `search` / `getMemoryStats`
   - **建议**: 这些方法应该在类定义中完整实现，而非依赖外部补丁

3. **补全 ConfidenceAnnotator 类导出**
   - `mark-heartflow-skill/src/core/confidence-annotator.js` 只导出了对象，缺少类构造器
   - **建议**: 统一导出风格，或修改 `heartflow.js` 调用方式

### 🟡 强烈建议（降低摩擦）

4. **提供国内镜像 / 国内包管理器**
   - **方案 A**: 发布到 npm（已有 `claude-heartflow-skill` 和 `@yun520-1/heartflow`）
   - **方案 B**: 提供 gitee 镜像
   - **方案 C**: 提供 zip 直链 + 安装脚本自动下载

5. **增加安装前自检脚本**
   ```bash
   # 在 verify.js 中增加：
   # - 检查所有 require 路径是否有效
   # - 检查所有被调用的方法是否存在于目标类上
   # - 给出具体的修复建议而非裸报错
   ```

6. **修复 MCP 包装脚本**
   - `heartflow-mcp-wrapper.sh` 硬编码 `SCRIPT_DIR`，应改为动态检测
   - 应检查仓库是否存在，不存在时给出友好提示

### 🟢 建议改进（体验提升）

7. **版本统一**
   - `~/.claude/SKILL.md` (v7.6) 与远程仓库 (v2.8.0) 版本差异巨大
   - **建议**: 明确本地 SKILL.md 与远程仓库的关系，或统一版本号

8. **增加 `--fix` 自动修复模式**
   ```bash
   bash install.sh --fix   # 自动修复已知兼容性问题
   ```

9. **提供 Docker / 沙箱环境**
   - 彻底避免依赖和环境差异

---

## 六、快速修复清单（可直接合入 PR）

```
claude-heartflow-skill:
  src/core/heartflow.js L38:  ../memory/meaningful-memory.js → ./meaningful-memory.js
  src/core/meaningful-memory.js:  新增 addCore/addLearned/addEphemeral/search/getMemoryStats

mark-heartflow-skill:
  src/core/confidence-annotator.js L22:  ./claim-extractor → ../reasoning/claim-extractor
  src/core/confidence-annotator.js:  新增 ConfidenceAnnotator 类导出
```

---

## 七、用户旅程（安装前 vs 安装后）

```
安装前 (预期):
  git clone → npm install → 运行 → ✅ (3 步, 10 秒)

安装后 (实际):
  git clone (4次尝试, 30秒) → npm install (7秒) → verify 失败 → 
  手动排查3个bug (5分钟) → verify 通过 → install.sh → 启动守护进程 → ✅
  (总计 ~8 分钟, 需要懂 Node.js 调试)

目标:
  git clone → 安装脚本自动修复 → ✅ (2 步, 30 秒)
```

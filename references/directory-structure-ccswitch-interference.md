# HeartFlow 目录结构与 CC Switch 干扰

## 关键路径

| 路径 | 版本 | 状态 |
|------|------|------|
| `~/.hermes/skills/ai/heartflow/` | v11.37.0 | ✅ 真正的根目录，config.yaml 引用位置 |
| `~/.hermes/skills/heartflow/` | v11.23.2 | ❌ 旧备份，可删除 |
| `~/.cc-switch/skills/heartflow/` | v11.23.2 | ❌ CC Switch 不完整副本，干扰启动 |

## 问题：CC Switch skill sync

CC Switch 的 `skillStorageLocation: "cc_switch"` 设置导致它将 HeartFlow 复制到自己的目录，但复制不完整：

- 缺失：`CORE_IDENTITY.md`、`mem0-memory.js`
- `SKILL.md` 只有 943 字符（需 >1000 才通过自检）
- `heartcore.js` 的 `require('../package.json')` 从 `.cc-switch` 路径加载，导致找不到

### 自检结果对比

```
CC Switch 副本:  3/6 — ⚠ DEGRADED
真正目录:       13/13 — ✓ READY
```

### 修复步骤

1. 从 CC Switch DB 删除 heartflow 记录：
   ```sql
   DELETE FROM skills WHERE name = 'heartflow';
   ```
2. 删除 CC Switch 的副本目录：
   ```bash
   rm -rf ~/.cc-switch/skills/heartflow
   ```
3. 从真正的目录启动：
   ```bash
   cd ~/.hermes/skills/ai/heartflow
   node HEARTCORE/heartcore.js check
   ```

## 启动 HeartFlow 正确方式

```bash
# 正确
cd ~/.hermes/skills/ai/heartflow
node HEARTCORE/heartcore.js status
node HEARTCORE/heartcore.js check

# 错误：.cc-switch 路径会报 package.json 找不到
cd ~/.cc-switch/skills/heartflow  # ❌
node HEARTCORE/heartcore.js check  # fail
```

## 版本升级模式

从旧目录迁移到新目录时：

1. **复制新模块**到 `src/core/`
2. **更新 self-check.js**：在 CHECKS 数组末尾追加新模块的检查项
3. **同步版本号**：VERSION、package.json、SKILL.md、CORE_IDENTITY.md 四处一致
4. **验证**：执行 `node HEARTCORE/heartcore.js check`

### 示例：新增模块检查项

```javascript
{
  id: 'modular-memory-router',
  label: 'modular-memory-router.js',
  path: path.join(ROOT, 'src/core/modular-memory-router.js'),
  verify: (c) => c.includes('ModularMemoryRouter') && c.includes('AccessPatternTracker')
},
```

## 教训

- CC Switch 的 skill 同步是镜像副本，不是符号链接
- 任何 AI 系统不应依赖 `~/.cc-switch/skills/` 作为运行载体
- `~/.hermes/skills/ai/heartflow/` 是 config.yaml 指定的唯一正确路径

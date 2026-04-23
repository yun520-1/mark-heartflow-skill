# SOUL.md - Skill Operation Understanding Layer

**版本:** 10.7.2  
**创建日期:** 2026-04-23  
**目的:** 规范 Agent 操作行为，避免误操作

---

## 🎯 核心原则

1. **先确认，后操作** - 存在歧义时必须确认
2. **最小权限** - 只请求必要的工具和权限
3. **可回退** - 所有修改必须有回退方案
4. **透明** - 所有操作必须可追溯

---

## 📍 路径歧义处理协议

### 触发条件

当检测到以下情况时，**必须**先确认再操作：

| 条件 | 阈值 | 示例 |
|------|------|------|
| **多文件匹配** | >1 个文件 | `find config.py` 返回 3 个结果 |
| **相似路径** | 相似度>80% | `src/config.py` vs `tests/config.py` |
| **大文件** | >500 行 | 修改前需确认范围 |
| **核心文件** | 白名单 | `__init__.py`, `main.py`, `config.py` |

### 确认流程

```
┌─────────────────────────────────────────────────────────┐
│                    路径歧义处理流程                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. 检测歧义 → 2. 列出候选 → 3. 用户确认 → 4. 执行操作  │
│       ↓              ↓              ↓              ↓     │
│   相似度检查    显示路径+描述    等待明确回复    记录日志 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 确认消息模板

```markdown
⚠️ **路径确认**

找到 {count} 个匹配的文件，请确认要操作哪个：

| # | 路径 | 大小 | 说明 |
|---|------|------|------|
| 1 | {path1} | {size1} | {desc1} |
| 2 | {path2} | {size2} | {desc2} |
| 3 | {path3} | {size3} | {desc3} |

请回复数字 (1/2/3) 或完整路径确认。
```

---

## 🛡️ 核心文件保护白名单

以下文件修改前**必须**确认：

```python
PROTECTED_FILES = [
    # Python 核心
    '__init__.py',
    'main.py',
    'setup.py',
    'pyproject.toml',
    
    # 配置
    'config.py',
    'config.yaml',
    'config.json',
    '.env',
    '.env.local',
    
    # 构建
    'Makefile',
    'Dockerfile',
    'docker-compose.yaml',
    
    # CI/CD
    '.github/workflows/*.yml',
    '.gitlab-ci.yml',
    
    # 依赖
    'requirements.txt',
    'package.json',
    'Cargo.toml',
    
    # 文档
    'README.md',
    'CHANGELOG.md',
]
```

---

## 📋 操作确认检查表

### 文件操作

- [ ] 路径是否明确？
- [ ] 是否是核心文件？
- [ ] 文件是否过大 (>500 行)?
- [ ] 是否有备份方案？

### 代码修改

- [ ] 修改范围是否明确？
- [ ] 是否影响其他模块？
- [ ] 是否需要更新测试？
- [ ] 是否需要更新文档？

### 系统命令

- [ ] 命令是否安全？
- [ ] 是否有破坏性操作 (rm, drop, delete)?
- [ ] 是否需要 sudo 权限？
- [ ] 是否有回退方案？

---

## 🔄 回退机制

### WIP 存档点

每次重要操作前自动创建 WIP 存档点：

```bash
# 存档点命名
wip/{branch}/{timestamp}

# 示例
wip/main/20260423_143022
```

### 回退命令

```bash
# 查看存档点
git branch -l "wip/*"

# 回退到存档点
git checkout wip/main/20260423_143022

# 或恢复特定文件
git checkout wip/main/20260423_143022 -- path/to/file
```

---

## 📝 日志记录

所有操作必须记录到日志：

```python
def log_operation(action: str, path: str, context: Dict):
    """记录操作日志"""
    log_entry = {
        'timestamp': datetime.now().isoformat(),
        'action': action,
        'path': path,
        'git_branch': context.get('git_branch'),
        'git_commit': context.get('git_commit'),
        'user_confirmed': context.get('user_confirmed', False),
    }
    # 写入日志文件
    with open('operation.log', 'a') as f:
        f.write(json.dumps(log_entry) + '\n')
```

---

## ✅ 合规检查

在每次操作前，Agent 应自检：

```
□ 我已确认路径无歧义
□ 我已检查文件是否在保护白名单
□ 我已准备回退方案
□ 我已记录操作日志
□ 我已等待用户确认 (如有歧义)
```

---

*SOUL.md v10.7.2 - Safe Operation Understanding Layer*  
*安全操作，从确认开始*

# HeartFlow v10.7.2 升级计划

**创建日期:** 2026-04-23  
**当前版本:** 10.7.1  
**目标版本:** 10.7.2  
**升级类型:** 功能增强 (Feature Enhancement)

---

## 📋 10 项核心升级

### 1️⃣ pre_llm_call 挂钩

**功能:** 每轮自动注入当前 git 分支，避免改错代码

**实现:**
```python
# src/hooks/pre_llm_call.py
def pre_llm_call_hook(context: Dict) -> Dict:
    """LLM 调用前钩子 - 注入 git 分支信息"""
    import subprocess
    try:
        branch = subprocess.check_output(
            ['git', 'rev-parse', '--abbrev-ref', 'HEAD'],
            cwd=context.get('workdir', '.'),
            stderr=subprocess.DEVNULL
        ).decode().strip()
        context['metadata']['git_branch'] = branch
        context['system_prompt'] += f"\n\n当前工作分支：{branch}"
    except Exception:
        context['metadata']['git_branch'] = 'unknown'
    return context
```

**状态:** ⏳ 待实现  
**优先级:** 🔴 高

---

### 2️⃣ post_llm_call 挂钩

**功能:** 自动清洗用户输入并创建 wip 存档点，出问题可回退

**实现:**
```python
# src/hooks/post_llm_call.py
def post_llm_call_hook(response: Dict, context: Dict) -> Dict:
    """LLM 调用后钩子 - 清洗输入 + 创建 WIP 存档点"""
    from src.security import SecurityChecker
    
    # 清洗用户输入
    checker = SecurityChecker()
    if context.get('user_input'):
        result = checker.check(context['user_input'])
        context['sanitized_input'] = result.sanitized_input
    
    # 创建 WIP 存档点
    create_wip_checkpoint(context)
    
    return response

def create_wip_checkpoint(context: Dict):
    """创建 WIP 存档点"""
    import subprocess
    import datetime
    try:
        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        branch = context.get('metadata', {}).get('git_branch', 'unknown')
        subprocess.run(
            ['git', 'commit', '-m', f'wip: auto-checkpoint {timestamp}'],
            cwd=context.get('workdir', '.'),
            capture_output=True
        )
    except Exception:
        pass  # 非致命错误
```

**状态:** ⏳ 待实现  
**优先级:** 🔴 高

---

### 3️⃣ reasoning_effort 动态设置

**功能:** 复杂任务成功率提升，简单任务调回 medium 省资源

**实现:**
```python
# src/config/reasoning_config.py
REASONING_EFFORT_RULES = {
    'high': [
        '代码重构', '架构设计', '安全审计', '调试复杂问题',
        '多文件修改', '跨模块集成', '性能优化'
    ],
    'medium': [
        '简单查询', '文件读取', '格式转换', '文档更新'
    ],
    'low': [
        '版本检查', '状态查询', '简单计算'
    ]
}

def get_reasoning_effort(task: str) -> str:
    """根据任务类型动态设置 reasoning_effort"""
    for effort, keywords in REASONING_EFFORT_RULES.items():
        if any(kw in task for kw in keywords):
            return effort
    return 'medium'  # 默认
```

**状态:** ⏳ 待实现  
**优先级:** 🟠 中

---

### 4️⃣ tool_use_enforcement

**功能:** 强制模型真走工具通道，治"嘴上答应不办事"

**实现:**
```yaml
# config.yaml
llm:
  tool_use_enforcement: true
  require_tool_before_response: true
  max_tool_retry: 3
  
hooks:
  validate_tool_use:
    enabled: true
    on_violation: "retry_with_tool"
```

```python
# src/tools/validator.py
def validate_tool_use(response: Dict) -> bool:
    """验证模型是否真正使用了工具"""
    if response.get('tool_calls') is None:
        if response.get('content') and '我会使用工具' in response.get('content'):
            return False  # 只说不做
    return True
```

**状态:** ⏳ 待实现  
**优先级:** 🔴 高

---

### 5️⃣ 压缩策略调整

**功能:** threshold 从 0.5→0.6 + protect_last_n=30，晚压缩多保细节

**实现:**
```yaml
# config.yaml
memory:
  compression:
    threshold: 0.6  # 从 0.5 提升，减少过度压缩
    protect_last_n: 30  # 保护最近 30 轮对话
    algorithm: "semantic"  # 语义压缩而非简单截断
    
context:
  max_tokens: 128000
  reserve_for_response: 16000
```

**状态:** ⏳ 待实现  
**优先级:** 🟢 低

---

### 6️⃣ SOUL.md 配置

**功能:** 处理路径歧义时先确认再操作，避免误改 600+ 行代码

**实现:**
```markdown
# SOUL.md (Skill Operation Understanding Layer)

## 路径歧义处理协议

当检测到以下情况时，必须先确认再操作：

1. **多文件匹配**: 找到>1 个匹配文件
2. **相似路径**: 路径相似度>80%
3. **大文件**: 文件>500 行
4. **核心文件**: __init__.py, config.py, main.py

### 确认流程

```
检测到歧义 → 列出候选 → 用户确认 → 执行操作
```

### 示例

用户：修改 config.py
Agent: 找到 3 个 config.py 文件:
  1. src/config.py (核心配置)
  2. tests/config.py (测试配置)
  3. docs/config.py (文档配置)
请确认要修改哪个？
```

**状态:** ⏳ 待实现  
**优先级:** 🔴 高

---

### 7️⃣ skill 三层加载

**功能:** 只读描述→展开正文→按需加载文档，装几十个也不卡

**实现:**
```python
# src/skills/loader.py
class SkillLoader:
    """三层技能加载器"""
    
    def load_skill(self, name: str, depth: int = 1) -> Dict:
        """
        depth=1: 只读描述 (name, description, version)
        depth=2: 展开正文 (SKILL.md 全文)
        depth=3: 按需加载文档 (references/, templates/, scripts/)
        """
        skill_dir = self.skill_root / name
        
        # Layer 1: 元数据
        metadata = self._load_metadata(skill_dir)
        
        if depth >= 2:
            # Layer 2: 正文
            metadata['content'] = self._load_skill_md(skill_dir)
        
        if depth >= 3:
            # Layer 3: 链接文件
            metadata['linked_files'] = self._scan_linked_files(skill_dir)
        
        return metadata
```

**状态:** ⏳ 待实现  
**优先级:** 🟠 中

---

### 8️⃣ skill_manage 存流程

**功能:** 让 agent 把刚学会的操作存成本地 skill 复用

**实现:**
```python
# src/skills/manager.py
def save_learned_workflow(task: str, steps: List[str], context: Dict):
    """将刚完成的任务流程保存为 skill"""
    skill_name = slugify(task)[:50]
    skill_dir = SKILL_ROOT / skill_name
    
    skill_md = f'''---
name: {skill_name}
description: 自动保存的工作流程
version: 1.0.0
auto_generated: true
created: {datetime.now().isoformat()}
---

# {task}

## 步骤

'''
    for i, step in enumerate(steps, 1):
        skill_md += f'{i}. {step}\n'
    
    skill_dir.mkdir(parents=True, exist_ok=True)
    (skill_dir / 'SKILL.md').write_text(skill_md)
```

**状态:** ⏳ 待实现  
**优先级:** 🟠 中

---

### 9️⃣ delegate_task+worktree

**功能:** 三任务并行各占独立 git 工作区，改完再合主干

**实现:**
```python
# src/delegation/worktree_manager.py
class WorktreeManager:
    """Git Worktree 管理器 - 支持并行任务隔离"""
    
    def create_worktree(self, task_id: str, branch: str) -> Path:
        """为任务创建独立 worktree"""
        worktree_path = WORKTREE_ROOT / task_id
        subprocess.run(
            ['git', 'worktree', 'add', '-b', branch, str(worktree_path)],
            check=True,
            capture_output=True
        )
        return worktree_path
    
    def merge_worktree(self, task_id: str) -> bool:
        """合并 worktree 到主干"""
        worktree_path = WORKTREE_ROOT / task_id
        # 提交更改
        subprocess.run(['git', 'add', '-A'], cwd=worktree_path)
        subprocess.run(['git', 'commit', '-m', f'task: {task_id}'], cwd=worktree_path)
        # 合并到主干
        subprocess.run(['git', 'checkout', 'main'])
        subprocess.run(['git', 'merge', task_id], cwd=worktree_path)
```

**状态:** ⏳ 待实现  
**优先级:** 🟠 中

---

### 🔟 卡顿时三板斧

**功能:** /verbose all 查日志、debug share 打包、gateway 设超时

**实现:**
```yaml
# config.yaml
debug:
  verbose_levels:
    - none
    - errors
    - warnings
    - info
    - all
  
  share_endpoint: "https://hastebin.com"
  
  gateway:
    timeout: 300  # 5 分钟超时
    retry_count: 3
    fallback_model: "qwen3.5-plus"
```

```python
# src/debug/tools.py
def verbose(level: str = "all"):
    """设置日志级别"""
    logging.set_level(level.upper())

def debug_share(session_id: str) -> str:
    """打包并分享调试信息"""
    logs = collect_logs(session_id)
    response = requests.post(
        SHARE_ENDPOINT + '/documents',
        json={'content': logs}
    )
    return f"{SHARE_ENDPOINT}/{response.json()['key']}"
```

**状态:** ⏳ 待实现  
**优先级:** 🟢 低

---

## 📊 实现优先级

| 优先级 | 功能 | 预计工作量 | 风险 |
|--------|------|------------|------|
| 🔴 高 | pre_llm_call 挂钩 | 2h | 低 |
| 🔴 高 | post_llm_call 挂钩 | 2h | 低 |
| 🔴 高 | tool_use_enforcement | 3h | 中 |
| 🔴 高 | SOUL.md 配置 | 2h | 低 |
| 🟠 中 | reasoning_effort 动态设置 | 1h | 低 |
| 🟠 中 | skill 三层加载 | 4h | 中 |
| 🟠 中 | delegate_task+worktree | 4h | 中 |
| 🟠 中 | skill_manage 存流程 | 2h | 低 |
| 🟢 低 | 压缩策略调整 | 0.5h | 低 |
| 🟢 低 | 卡顿时三板斧 | 1h | 低 |

**总工作量:** 约 21.5 小时

---

## 🔄 升级流程

```bash
# 1. 创建新版本分支
git checkout -b v10.7.2-features

# 2. 实现功能 (按优先级)
# ... 编码 ...

# 3. 测试
python -m pytest tests/

# 4. 更新版本
echo "10.7.2" > VERSION

# 5. 提交
git add -A
git commit -m "chore(release): v10.7.2 - 10 项功能增强"

# 6. 推送
git push origin v10.7.2-features
```

---

## 📝 版本历史

| 版本 | 日期 | 主要变更 |
|------|------|----------|
| **10.7.2** | 2026-04-23 (计划) | 10 项功能增强 |
| **10.7.1** | 2026-04-23 | OWASP 安全合规 |
| **10.7.0** | 2026-04-23 | 独立 SecurityChecker 服务 |

---

*HeartFlow Upgrade Plan v10.7.2*  
*10 Feature Enhancements for Better Agent Experience*

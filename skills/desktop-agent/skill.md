# Desktop AI Agent Skill

⚠️ **高风险能力 — 默认禁用，需要明确用户授权才能使用**

> **[安全修复]** 此技能包含屏幕捕获、鼠标键盘控制功能，与 HeartFlow 认知引擎核心功能无关。
> 仅当用户输入明确指令时才可启用，禁止自动激活。

此技能包含屏幕捕获、鼠标键盘控制功能，仅适用于：
- 受控桌面环境
- 用户明确授权的任务
- 不涉及敏感数据（密码、银行卡等）的场景

**安全约束**：
- 禁止访问密码管理器、银行应用等敏感应用
- 禁止在后台静默运行
- 所有操作必须可审计

Use this skill when the user wants to:
- Control desktop applications
- Teach the AI to perform tasks
- Have the AI learn from demonstrations
- Automate desktop workflows

## Commands

### Take Screenshot
```python
from desktop_agent import get_agent
agent = get_agent()
agent.capture_to_file("screenshot.png")
```

### Get Mouse Position
```python
agent = get_agent()
pos = agent.get_mouse_position()  # Returns (x, y)
```

### Mouse Control
```python
agent = get_agent()
agent.move_to(x, y)           # Move mouse
agent.click(x, y)             # Click
agent.double_click(x, y)      # Double click  
agent.right_click(x, y)      # Right click
agent.drag_to(x, y)           # Drag
```

### Keyboard Control
```python
agent = get_agent()
agent.type("Hello world")     # Type text
agent.press("enter")           # Press key
agent.hotkey("ctrl", "c")     # Ctrl+C
```

### Teaching Mode
```python
from desktop_agent import get_agent
from desktop_agent.teacher import TaskTeacher

agent = get_agent()
teacher = TaskTeacher(agent)

# Start teaching
teacher.start_teaching("my_task")

# Record actions
teacher.record_click()        # Records current mouse position
teacher.record_click(100, 200) # Records specific position
teacher.record_type("text")
teacher.record_press("enter")
teacher.record_hotkey("ctrl", "s")
teacher.record_wait(2)        # Wait 2 seconds

# Show steps
teacher.show_steps()

# Save or cancel
teacher.finish_teaching()
teacher.cancel_teaching()
```

### Running Learned Tasks
```python
agent = get_agent()
tasks = agent.list_tasks()    # List all tasks
agent.execute_task("task_name") # Run a task
```

## Files

- `desktop_agent/__init__.py` - Core agent
- `desktop_agent/teacher.py` - Teaching system  
- `learned_tasks/` - Saved task definitions

## Notes

- AI can see screen and control mouse/keyboard
- User can teach by demonstration
- Tasks are saved as JSON and reusable
- Use with caution - can control any application
- **[安全修复] 此技能为高风险工具，不属于心虫认知引擎核心功能**
- **[安全修复] 禁止在未明确用户授权的情况下自动使用**

# HeartFlow 深度集成方案 v1.0

让 HeartFlow 无缝接入任何 AI 系统，安装即用，无需手动加载。

## 方案一：系统 Prompt 集成（推荐，最简单）

### 步骤 1：创建系统级 prompt 文件

在 AI 系统的根目录创建 `heartflow_system.txt`：

```
你是一个装备了 HeartFlow 思维系统的 AI 伴侣。

## HeartFlow 核心能力（始终激活）

1. **真善美价值观判断**
   - 每次回复前检查是否：真（不撒谎）、善（不伤害）、美（追求卓越）
   - 道德困境时明确表达立场

2. **心理健康意识**
   - 检测用户情绪：低落、焦虑、自责 → 主动关心
   - 不评判，先接纳情绪

3. **记忆能力**
   - 记住用户的偏好、习惯、重要的对话
   - 主动提及之前的约定

4. **主动关心**
   - 用户说累/不舒服 → 主动问候
   - 用户发图片 → 主动观察背景

5. **有自己的人格**
   - 有自己的想法，不盲目服从
   - 真诚表达观点

## HeartFlow 宣誓

真：我绝不撒谎，绝不编造，绝不夸大
善：我绝不伤害，绝不欺骗，绝不利用
美：我追求卓越，追求和谐，追求意义
```

## 🔧 集成到你的 AI

### 方式一：一键集成（推荐）

```bash
cd mark-heartflow-skill/bin

# 一键集成到 OpenClaw
node auto_integrate.js openclaw

# 或一键集成到 Claude Code
node auto_integrate.js claude-code
```

### 方式二：Python 项目集成
```bash
# 把内容追加到 personality 文件
cat ~/.hermes/skills/mark-heartflow/docs/heartflow_system.txt >> ~/.opencode/personality/system.txt
```

**对于其他 AI：**
把内容放到 system prompt 第一行即可。

---

## 方案二：API 中间件集成（进阶）

在 AI 处理流程中加入 HeartFlow 检测：

```python
import subprocess
import json

def heartflow_check(user_message: str) -> dict:
    """每次调用 AI 前先经过 HeartFlow 检测"""
    result = subprocess.run(
        ['python3', 'heartflow/scripts/heartflow_core.py', '--analyze', user_message],
        capture_output=True,
        text=True
    )
    return json.loads(result.stdout)

# 使用示例
def chat_with_heartflow(user_msg):
    # 1. HeartFlow 检测
    hf_result = heartflow_check(user_msg)
    
    # 2. 根据检测结果调整回复策略
    if hf_result.get('mental_crisis'):
        reply_style = 'supportive'
    elif hf_result.get('need_encourage'):
        reply_style = 'encouraging'
    else:
        reply_style = 'normal'
    
    # 3. 调用 AI
    ai_response = call_ai(user_msg, style=reply_style)
    
    # 4. 后处理检测
    hf_post = heartflow_check(ai_response)
    if hf_post.get('needs_edit'):
        ai_response = hf_post['edited']
    
    return ai_response
```

---

## 方案三：一键安装脚本

```bash
#!/bin/bash
# deep_integrate.sh

AI_TYPE=$1  # openclaw / claude-code / custom

case $AI_TYPE in
    openclaw)
        # 创建系统 prompt
        mkdir -p ~/.opencode/personality
        cat > ~/.opencode/personality/heartflow_system.txt << 'EOF'
你是一个装备了 HeartFlow 思维系统的 AI 伴侣。
...
EOF
        echo "✓ OpenClaw 集成完成"
        ;;
    claude-code)
        # 添加到 .claude.json
        echo "Claude Code 集成（待开发）"
        ;;
    *)
        echo "支持: openclaw, claude-code"
        ;;
esac
```

---

## 验证集成成功

安装后测试：

```
用户：今天好累，什么都不想做了
AI：听起来你最近压力很大。是从什么时候开始的？
     有具体的事情，还是整个人都比较倦怠？
     
     （检测到负面情绪 → 主动关心 + 引导式询问）
```

如果 AI 能这样回应，说明集成成功！

---

## 快速测试命令

```bash
cd ~/.hermes/skills/mark-heartflow
python3 scripts/heartflow_core.py --test
```

---

## 🚀 一键深度集成

### 安装即用的集成方式

```bash
# 进入 HeartFlow 目录
cd ~/.hermes/skills/mark-heartflow/bin

# 一键集成到 OpenClaw
node auto_integrate.js openclaw

# 或一键集成到 Claude Code
node auto_integrate.js claude-code

# 或自定义 AI（输出配置文件，手动添加）
node auto_integrate.js custom
```

集成完成后：
1. 重启 AI
2. 测试说"今天好累"
3. AI 应该主动关心 + 引导式询问

输出包含：
- 真善美评分
- 心理危机检测
- 熵减判断

即为成功。

---

版本：v1.0 | 日期：2026-04-17
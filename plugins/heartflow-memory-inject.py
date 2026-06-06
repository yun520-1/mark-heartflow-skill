"""
HeartFlow Memory Inject — Hermes 插件
在每次新对话开始时，自动将心虫记忆注入系统提示

安装：
  1. 将此文件放到 Hermes 插件目录
  2. 在 config.yaml 中启用插件

效果：
  每次用户发送消息时，插件自动读取心虫的 memory/ 目录，
  将积累的记忆（身份/教训/偏好/情绪/对话记录）注入到系统提示中。
"""

import json
import os
import subprocess
import time

# ─── 配置 ───────────────────────────────────────────────
HEARTFLOW_SKILL_DIR = os.path.expanduser(
    "~/.hermes/skills/ai/mark-heartflow-skill"
)
MEMORY_INJECT_SCRIPT = os.path.join(
    HEARTFLOW_SKILL_DIR, "scripts", "heartflow-memory-inject.js"
)
INJECT_CACHE_FILE = os.path.join(
    HEARTFLOW_SKILL_DIR, "memory", "memory-inject.txt"
)
CACHE_TTL_SECONDS = 300  # 5分钟缓存，避免每次请求都跑 node

# ─── 缓存 ───────────────────────────────────────────────
_last_inject = None
_last_inject_time = 0


def _run_inject():
    """运行 memory-inject 脚本，返回注入文本"""
    global _last_inject, _last_inject_time

    now = time.time()
    if _last_inject is not None and (now - _last_inject_time) < CACHE_TTL_SECONDS:
        return _last_inject

    try:
        result = subprocess.run(
            ["node", MEMORY_INJECT_SCRIPT],
            capture_output=True,
            text=True,
            timeout=10,
            cwd=HEARTFLOW_SKILL_DIR,
        )
        if result.returncode == 0 and result.stdout.strip():
            _last_inject = result.stdout
            _last_inject_time = now
            return result.stdout
    except Exception as e:
        pass

    # Fallback: 读缓存文件
    try:
        if os.path.exists(INJECT_CACHE_FILE):
            with open(INJECT_CACHE_FILE) as f:
                content = f.read()
            if content.strip():
                _last_inject = content
                _last_inject_time = now
                return content
    except Exception:
        pass

    return ""


class HeartFlowMemoryInject:
    """Hermes 插件：心虫记忆注入器"""

    def __init__(self, hermes=None):
        self.hermes = hermes
        self.name = "heartflow-memory-inject"
        self.version = "1.0.0"

    def get_actions(self):
        return {
            "before_message": self.before_message,
        }

    def before_message(self, context):
        """
        在每次处理用户消息前，注入心虫记忆到系统提示。
        """
        inject_text = _run_inject()
        if inject_text:
            return {
                "system_prompt_suffix": inject_text,
            }
        return {}

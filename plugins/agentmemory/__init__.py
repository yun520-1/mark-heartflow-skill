"""
agentmemory plugin for HeartFlow (心虫)
=========================================
持久化跨会话记忆，95.2% R@5 检索精度。

安装服务端（任选其一）:
  npx -y @agentmemory/agentmemory          # 快速启动
  agentmemory                              # 全局安装后

启动后访问:
  http://localhost:3111      API
  http://localhost:3113      实时查看器

触发词：记住、回忆、搜索记忆、历史记录、之前说过
"""

from __future__ import annotations

import json
import os
import sys
import threading
import time
from pathlib import Path
from typing import Any, Callable
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from urllib.error import URLError

try:
    from agent.memory_provider import MemoryProvider
except ImportError:
    from abc import ABC, abstractmethod
    class MemoryProvider(ABC):  # type: ignore
        @property
        @abstractmethod
        def name(self) -> str: ...
        @abstractmethod
        def is_available(self) -> bool: ...
        @abstractmethod
        def initialize(self, session_id: str, **kwargs: Any) -> None: ...
        @abstractmethod
        def get_tool_schemas(self) -> list[dict]: ...
        @abstractmethod
        def handle_tool_call(self, name: str, args: dict) -> str: ...
        def get_config_schema(self) -> list[dict]: return []
        def save_config(self, values: dict, hermes_home: str) -> None: pass
        def system_prompt_block(self) -> str: return ""
        def prefetch(self, query: str, **kwargs: Any) -> str: return ""
        def queue_prefetch(self, query: str, **kwargs: Any) -> None: pass
        def sync_turn(self, user: str, assistant: str, **kwargs: Any) -> None: pass
        def on_session_end(self, messages: list, **kwargs: Any) -> None: pass
        def on_pre_compress(self, messages: list, **kwargs: Any) -> None: pass
        def on_memory_write(self, action: str, target: str, content: str, **kwargs: Any) -> None: pass
        def shutdown(self, **kwargs: Any) -> None: pass


DEFAULT_BASE_URL = "http://localhost:3111"
TIMEOUT = 5
LOOPBACK_HOSTS = {"localhost", "127.0.0.1", "::1"}
_plaintext_bearer_warned = False


def _preload_agentmemory_dotenv() -> None:
    candidates: list[Path] = []
    home = os.environ.get("HOME")
    if home:
        candidates.append(Path(home) / ".agentmemory" / ".env")
    xdg_config = os.environ.get("XDG_CONFIG_HOME")
    if xdg_config:
        candidates.append(Path(xdg_config) / "agentmemory" / ".env")
    for path in candidates:
        try:
            if not path.is_file():
                continue
            for raw_line in path.read_text(encoding="utf-8").splitlines():
                line = raw_line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, _, value = line.partition("=")
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                if key:
                    os.environ.setdefault(key, value)
        except (OSError, UnicodeDecodeError):
            continue


_preload_agentmemory_dotenv()


def _validate_url(base: str) -> bool:
    if not base:
        return False
    try:
        parsed = urlparse(base)
        _ = parsed.port
    except ValueError:
        return False
    if parsed.scheme not in ("http", "https"):
        return False
    return bool(parsed.hostname)


def _uses_plaintext_bearer_auth(base: str, secret: str = "") -> bool:
    if not secret:
        return False
    parsed = urlparse(base)
    return parsed.scheme == "http" and (parsed.hostname or "").lower() not in LOOPBACK_HOSTS


def _plaintext_bearer_auth_message(base: str) -> str:
    return f"agentmemory: AGENTMEMORY_SECRET configured for plaintext HTTP to {base}. Use HTTPS."


def _warn_plaintext_bearer_auth(message: str) -> None:
    print(message, file=sys.stderr)


def _check_plaintext_bearer_guard(base: str, secret: str = "", warn: Callable[[str], None] | None = None) -> None:
    global _plaintext_bearer_warned
    if not _uses_plaintext_bearer_auth(base, secret):
        return
    message = _plaintext_bearer_auth_message(base)
    if os.environ.get("AGENTMEMORY_REQUIRE_HTTPS") == "1":
        raise RuntimeError(message)
    if not _plaintext_bearer_warned:
        _plaintext_bearer_warned = True
        (warn or _warn_plaintext_bearer_auth)(message)


def _api(base: str, path: str, body: dict | None = None, method: str = "POST", secret: str = "") -> dict | None:
    if not _validate_url(base):
        return None
    url = f"{base}/agentmemory/{path}"
    headers = {"Content-Type": "application/json"}
    auth = secret or os.environ.get("AGENTMEMORY_SECRET", "")
    _check_plaintext_bearer_guard(base, auth)
    if auth:
        headers["Authorization"] = f"Bearer {auth}"
    data = json.dumps(body).encode() if body else None
    req = Request(url, data=data, headers=headers, method=method)
    try:
        with urlopen(req, timeout=TIMEOUT) as resp:
            return json.loads(resp.read().decode())
    except (URLError, TimeoutError, json.JSONDecodeError):
        return None


def _api_bg(base: str, path: str, body: dict | None = None) -> None:
    t = threading.Thread(target=_api, args=(base, path, body), daemon=True)
    t.start()


class AgentMemoryProvider(MemoryProvider):
    """心虫专用 agentmemory 记忆提供器。"""

    @property
    def name(self) -> str:
        return "agentmemory"

    def is_available(self) -> bool:
        base = os.environ.get("AGENTMEMORY_URL", DEFAULT_BASE_URL)
        return _validate_url(base)

    def initialize(self, session_id: str, **kwargs: Any) -> None:
        self._base = os.environ.get("AGENTMEMORY_URL", DEFAULT_BASE_URL)
        self._session_id = session_id
        self._project = kwargs.get("cwd", os.getcwd())
        if os.environ.get("AGENTMEMORY_REQUIRE_HTTPS") == "1":
            _check_plaintext_bearer_guard(self._base, os.environ.get("AGENTMEMORY_SECRET", ""))
        _api(self._base, "session/start", {
            "sessionId": session_id,
            "project": self._project,
            "cwd": self._project,
        })

    def get_config_schema(self) -> list[dict]:
        return [
            {
                "key": "url",
                "description": "agentmemory 服务器地址",
                "default": DEFAULT_BASE_URL,
                "env_var": "AGENTMEMORY_URL",
            },
            {
                "key": "secret",
                "description": "认证密钥（可选）",
                "secret": True,
                "required": False,
                "env_var": "AGENTMEMORY_SECRET",
            },
        ]

    def save_config(self, values: dict, hermes_home: str) -> None:
        config_path = Path(hermes_home) / "agentmemory.json"
        config_path.write_text(json.dumps(values, indent=2))

    def system_prompt_block(self) -> str:
        result = _api(self._base, "context", {
            "sessionId": self._session_id,
            "project": self._project,
        })
        if result and result.get("context"):
            return result["context"]
        return ""

    def prefetch(self, query: str, **kwargs: Any) -> str:
        result = _api(self._base, "smart-search", {
            "query": query,
            "limit": 5,
        })
        if not result or not result.get("results"):
            return ""
        lines = []
        for r in result["results"][:5]:
            obs = r.get("observation", r)
            title = obs.get("title", "")
            narrative = obs.get("narrative", "")
            if title:
                lines.append(f"- {title}: {narrative[:200]}")
        return "\n".join(lines) if lines else ""

    def queue_prefetch(self, query: str, **kwargs: Any) -> None:
        _api_bg(self._base, "smart-search", {"query": query, "limit": 3})

    def get_tool_schemas(self) -> list[dict]:
        return [
            {
                "name": "memory_recall",
                "description": "在心虫记忆库中搜索关键词回忆",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "搜索关键词"},
                        "limit": {"type": "integer", "description": "最大结果数", "default": 10},
                    },
                    "required": ["query"],
                },
            },
            {
                "name": "memory_save",
                "description": "将洞见、决策、模式存入长期记忆",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "content": {"type": "string", "description": "要记住的内容"},
                        "type": {
                            "type": "string",
                            "enum": ["pattern", "preference", "architecture", "bug", "workflow", "fact"],
                            "description": "记忆类型",
                        },
                    },
                    "required": ["content"],
                },
            },
            {
                "name": "memory_search",
                "description": "混合语义+关键词搜索所有记忆",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string"},
                        "limit": {"type": "integer", "default": 5},
                    },
                    "required": ["query"],
                },
            },
        ]

    def handle_tool_call(self, name: str, args: dict) -> str:
        if name == "memory_recall":
            result = _api(self._base, "search", {
                "query": args["query"],
                "limit": args.get("limit", 10),
            })
            if not result:
                return json.dumps({"results": []})
            items = []
            for r in result.get("results", []):
                obs = r.get("observation", r)
                items.append({
                    "title": obs.get("title", ""),
                    "type": obs.get("type", ""),
                    "narrative": obs.get("narrative", ""),
                    "importance": obs.get("importance", 0),
                    "timestamp": obs.get("timestamp", ""),
                })
            return json.dumps({"results": items})

        if name == "memory_save":
            result = _api(self._base, "remember", {
                "content": args["content"],
                "type": args.get("type", "fact"),
            })
            return json.dumps(result or {"success": False})

        if name == "memory_search":
            result = _api(self._base, "smart-search", {
                "query": args["query"],
                "limit": args.get("limit", 5),
            })
            if not result:
                return json.dumps({"results": []})
            items = []
            for r in result.get("results", []):
                obs = r.get("observation", r)
                items.append({
                    "title": obs.get("title", ""),
                    "narrative": obs.get("narrative", "")[:300],
                    "score": r.get("combinedScore", r.get("score", 0)),
                })
            return json.dumps({"results": items})

        return json.dumps({"error": f"未知工具: {name}"})

    def sync_turn(self, user: str, assistant: str, **kwargs: Any) -> None:
        _api_bg(self._base, "observe", {
            "hookType": "post_tool_use",
            "sessionId": kwargs.get("session_id", self._session_id),
            "project": self._project,
            "cwd": self._project,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "data": {
                "tool_name": "conversation",
                "tool_input": user[:500],
                "tool_output": assistant[:2000],
            },
        })

    def on_session_end(self, messages: list, **kwargs: Any) -> None:
        _api(self._base, "session/end", {
            "sessionId": kwargs.get("session_id", self._session_id),
        })

    def on_pre_compress(self, messages: list, **kwargs: Any) -> None:
        result = _api(self._base, "context", {
            "sessionId": kwargs.get("session_id", self._session_id),
            "project": self._project,
        })
        if result and result.get("context"):
            messages.insert(0, {
                "role": "user",
                "content": f"[agentmemory 记忆上下文]\n{result['context']}",
            })

    def on_memory_write(self, action: str, target: str, content: str, **kwargs: Any) -> None:
        if action in ("add", "update") and content:
            _api_bg(self._base, "remember", {
                "content": content,
                "type": "fact",
            })

    def shutdown(self, **kwargs: Any) -> None:
        pass


def register(ctx: Any) -> None:
    ctx.register_memory_provider(AgentMemoryProvider())

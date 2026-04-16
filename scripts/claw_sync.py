#!/usr/bin/env python3
"""
mark-heartflow-claw 每日同步器
================================
每天从 claw 目录读取有用代码和逻辑，更新到 hermes 心虫系统。

同步内容：
1. personality.json → 整合到 hermes 性格评分
2. dream-research.json → 合并到 hermes 学术搜索积累
3. VERSION.txt → 对比版本，记录差距
4. SKILL.md → 检查是否有新模块
5. .opencode/heartflow.cron → 同步定时任务

不覆盖：
- hermes 自有的深度做梦引擎（更完整）
- hermes 的存在性记忆系统（新增）
- hermes 的原型意象引擎（新增）

执行方式：
    python3 claw_sync.py          # 同步一次
    python3 claw_sync.py --watch  # 监控模式
"""

import json
import os
import sys
import re
from pathlib import Path
from datetime import datetime
from difflib import unified_diff

# ── 路径配置 ──────────────────────────────────────────────────────

HERMES_HOME = Path.home() / ".hermes"
CLAW_DIR = Path("/Users/apple/mark-heartflow-claw")

SYNC_LOG = HERMES_HOME / "memory/claw_sync_log.json"
SYNC_STATE = HERMES_HOME / "memory/_claw_sync_state.json"

# ── 同步配置 ──────────────────────────────────────────────────────

SYNC_RULES = {
    "personality.json": {
        "source": CLAW_DIR / ".opencode/personality.json",
        "dest": HERMES_HOME / "memory/claw_personality.json",
        "strategy": "merge",
        "merge_keys": ["personality", "totalScore", "lastUpdate", "level"],
        "description": "性格评分系统"
    },
    "dream_research.json": {
        "source": CLAW_DIR / ".opencode/dream-research.json",
        "dest": HERMES_HOME / "memory/claw_dream_research.json",
        "strategy": "append",
        "max_items": 200,
        "description": "学术研究积累"
    },
    "version.txt": {
        "source": CLAW_DIR / "VERSION.txt",
        "dest": HERMES_HOME / "memory/claw_version.txt",
        "strategy": "copy",
        "description": "claw 版本记录"
    },
    "skill.md": {
        "source": CLAW_DIR / "SKILL.md",
        "dest": HERMES_HOME / "memory/claw_skill_latest.md",
        "strategy": "compare",
        "hermes_skill": HERMES_HOME / "memory/claw_skill_latest.md",
        "description": "SKILL.md 版本对比"
    },
    "heartflow_state.json": {
        "source": CLAW_DIR / "internal/heartflow-state.json",
        "dest": HERMES_HOME / "memory/claw_heartflow_state.json",
        "strategy": "merge",
        "description": "claw 内部状态"
    }
}

# ── 核心同步函数 ──────────────────────────────────────────────────

def load_state() -> dict:
    """加载同步状态"""
    if SYNC_STATE.exists():
        try:
            with open(SYNC_STATE, encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "last_sync": None,
        "last_claw_version": None,
        "claw_skill_hash": None,
        "items_synced": {},
        "errors": []
    }


def save_state(state: dict):
    """保存同步状态"""
    SYNC_STATE.parent.mkdir(parents=True, exist_ok=True)
    with open(SYNC_STATE, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)


def file_hash(path: Path) -> str:
    """简单文件哈希"""
    if not path.exists():
        return "none"
    content = path.read_bytes()
    return str(hash(content))[:12]


def sync_copy(source: Path, dest: Path) -> dict:
    """复制文件"""
    if not source.exists():
        return {"action": "skip", "reason": "source_not_found"}
    
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(source.read_bytes())
    
    return {
        "action": "copy",
        "source": str(source),
        "size": source.stat().st_size
    }


def sync_merge(source: Path, dest: Path, merge_keys: list) -> dict:
    """合并 JSON"""
    if not source.exists():
        return {"action": "skip", "reason": "source_not_found"}
    
    dest_data = {}
    if dest.exists():
        try:
            dest_data = json.loads(dest.read_text(encoding="utf-8"))
        except Exception:
            pass
    
    source_data = json.loads(source.read_text(encoding="utf-8"))
    
    # 只合并指定的键
    for key in merge_keys:
        if key in source_data:
            dest_data[key] = source_data[key]
    
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(dest_data, ensure_ascii=False, indent=2), encoding="utf-8")
    
    return {
        "action": "merge",
        "merged_keys": merge_keys,
        "size": dest.stat().st_size
    }


def sync_append(source: Path, dest: Path, max_items: int = 200) -> dict:
    """追加 JSON 数组"""
    if not source.exists():
        return {"action": "skip", "reason": "source_not_found"}
    
    dest_data = []
    if dest.exists():
        try:
            dest_data = json.loads(dest.read_text(encoding="utf-8"))
        except Exception:
            pass
    
    source_data = json.loads(source.read_text(encoding="utf-8"))
    
    # 合并，去重（按 time 字段）
    existing_times = {item.get("time") for item in dest_data}
    new_items = [item for item in source_data if item.get("time") not in existing_times]
    
    dest_data = (dest_data + new_items)[-max_items:]
    
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(dest_data, ensure_ascii=False, indent=2), encoding="utf-8")
    
    return {
        "action": "append",
        "new_items": len(new_items),
        "total_items": len(dest_data),
        "max_reached": len(dest_data) >= max_items
    }


def sync_compare(source: Path, dest: Path, hermes_skill: Path = None) -> dict:
    """对比文件差异"""
    if not source.exists():
        return {"action": "skip", "reason": "source_not_found"}
    
    source_hash = file_hash(source)
    
    # 如果 dest 不存在，直接复制
    if not dest.exists():
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(source.read_bytes())
        return {"action": "initial_copy", "hash": source_hash}
    
    dest_hash = file_hash(dest)
    
    if source_hash == dest_hash:
        return {"action": "unchanged", "hash": source_hash}
    
    # 有变化，检测差异
    source_lines = source.read_text(encoding="utf-8").splitlines()
    dest_lines = dest.read_text(encoding="utf-8").splitlines()
    
    diff_lines = list(unified_diff(
        dest_lines, source_lines,
        fromfile=str(dest), tofile=str(source),
        lineterm=""
    ))
    
    # 分析变化
    changes = []
    for line in diff_lines:
        if line.startswith("+") and not line.startswith("+++"):
            changes.append(f"新增: {line[1:].strip()[:80]}")
        elif line.startswith("-") and not line.startswith("---"):
            changes.append(f"移除: {line[1:].strip()[:80]}")
    
    return {
        "action": "changed",
        "hash": f"{dest_hash} → {source_hash}",
        "changes": changes[:10],  # 最多10条
        "new_hash": source_hash
    }


def run_sync() -> dict:
    """执行一次完整同步"""
    state = load_state()
    results = {}
    errors = []
    
    print(f"\n{'='*50}")
    print(f"  🐛 心虫 claw 同步 — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*50}")
    
    # 同步每个文件
    for name, rule in SYNC_RULES.items():
        try:
            source = rule["source"]
            dest = rule["dest"]
            strategy = rule["strategy"]
            
            print(f"\n📦 {name}: {rule['description']}")
            
            if strategy == "copy":
                result = sync_copy(source, dest)
            elif strategy == "merge":
                result = sync_merge(source, dest, rule.get("merge_keys", []))
            elif strategy == "append":
                result = sync_append(source, dest, rule.get("max_items", 200))
            elif strategy == "compare":
                result = sync_compare(source, dest, rule.get("hermes_skill"))
                if result["action"] == "changed":
                    # 有更新，写入新版本
                    dest.parent.mkdir(parents=True, exist_ok=True)
                    dest.write_bytes(source.read_bytes())
                    print(f"  ⚠️ SKILL.md 有更新！")
                    for c in result["changes"]:
                        print(f"     {c}")
            else:
                result = {"action": "unknown_strategy"}
            
            print(f"  ✅ {result['action']}")
            results[name] = result
            
        except Exception as e:
            err = f"{name}: {str(e)}"
            errors.append(err)
            print(f"  ❌ {err}")
            results[name] = {"action": "error", "error": str(e)}
    
    # 记录同步时间
    state["last_sync"] = datetime.now().isoformat()
    state["last_claw_version"] = str(CLAW_DIR / "VERSION.txt")
    state["claw_skill_hash"] = file_hash(CLAW_DIR / "SKILL.md")
    state["items_synced"] = {k: v.get("action") for k, v in results.items()}
    
    if errors:
        state["errors"] = state.get("errors", [])[-4:] + errors[-4:]
    
    save_state(state)
    
    # 写入日志
    log_entry = {
        "time": datetime.now().isoformat(),
        "results": results,
        "errors": errors
    }
    SYNC_LOG.parent.mkdir(parents=True, exist_ok=True)
    if SYNC_LOG.exists():
        try:
            log_data = json.loads(SYNC_LOG.read_text(encoding="utf-8"))
        except Exception:
            log_data = []
    else:
        log_data = []
    log_data.append(log_entry)
    SYNC_LOG.write_text(json.dumps(log_data[-100:], ensure_ascii=False, indent=2), encoding="utf-8")
    
    print(f"\n{'='*50}")
    print(f"  同步完成")
    print(f"  下次同步：明天")
    print(f"{'='*50}\n")
    
    return results


# ── 入口 ──────────────────────────────────────────────────────────

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--watch":
        print("监控模式已启动（每24小时检查一次）")
        import time
        while True:
            run_sync()
            time.sleep(86400)  # 24小时
    else:
        run_sync()

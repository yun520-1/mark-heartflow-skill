#!/usr/bin/env python3
"""
Memory Palace Engine - 记忆宫殿引擎

集成到 HeartFlow v9.1.2
基于 Method of Loci 的空间记忆系统
"""

import json
from datetime import datetime
from pathlib import Path
from typing import Optional
import uuid

# 默认路径
DEFAULT_PALACE_PATH = "memory/palace/palace.json"
DEFAULT_MEMORIES_PATH = "memory/palace/memories.json"
DEFAULT_CONNECTIONS_PATH = "memory/palace/connections.json"


class MemoryPalace:
    """记忆宫殿引擎"""
    
    def __init__(self, base_path: str = None):
        self.base_path = Path(base_path or "memory/palace")
        self.palace_path = self.base_path / "palace.json"
        self.memories_path = self.base_path / "memories.json"
        self.connections_path = self.base_path / "connections.json"
        
        self._init_palace()
    
    def _init_palace(self):
        """初始化宫殿结构"""
        self.base_path.mkdir(parents=True, exist_ok=True)
        
        # 宫殿结构
        if not self.palace_path.exists():
            palace = {
                "name": "HeartFlow宫",
                "rooms": {
                    "living": {"name": "客厅", "capacity": 9, "purpose": "日常对话、最近记忆"},
                    "study": {"name": "书房", "capacity": 9, "purpose": "知识、技能、概念"},
                    "kitchen": {"name": "厨房", "capacity": 9, "purpose": "情感、感受、人际关系"},
                    "garden": {"name": "花园", "capacity": 9, "purpose": "创造性想法、顿悟、梦想"},
                    "basement": {"name": "地下室", "capacity": 9, "purpose": "深层记忆、习惯、模式"},
                },
                "total_capacity": 45,
                "created": datetime.now().isoformat()
            }
            self._save_json(self.palace_path, palace)
        
        # 记忆库
        if not self.memories_path.exists():
            self._save_json(self.memories_path, {"memories": []})
        
        # 连接图
        if not self.connections_path.exists():
            self._save_json(self.connections_path, {"connections": {}})
    
    def _save_json(self, path, data):
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    
    def _load_json(self, path):
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    
    # === 记忆存取 ===
    
    def store(self, content: str, room: str = "living", priority: int = 4,
              emotion: str = "", intensity: int = 5, themes: list = None) -> dict:
        """
        存入记忆
        
        优先级映射:
        P0 - 明确指令 -> living-1
        P1 - 高情感 -> kitchen
        P2 - 顿悟 -> garden
        P3 - 知识 -> study
        P4 - 日常 -> living
        """
        memories = self._load_json(self.memories_path)["memories"]
        
        # 找空位
        room_info = self._load_json(self.palace_path)["rooms"][room]
        occupied = [m for m in memories if m["id"].startswith(f"hf.main.{room}")]
        position = len(occupied) + 1
        
        if position > room_info["capacity"]:
            return {"success": False, "error": f"{room}已满"}
        
        memory = {
            "id": f"hf.main.{room}.{position}",
            "content": content,
            "room": room,
            "position": position,
            "priority": priority,
            "emotion": emotion,
            "intensity": intensity,
            "themes": themes or [],
            "timestamp": datetime.now().isoformat(),
            "connections": []
        }
        
        memories.append(memory)
        self._save_json(self.memories_path, {"memories": memories})
        
        return {"success": True, "memory": memory}
    
    def recall(self, memory_id: str = None, room: str = None, 
               theme: str = None, limit: int = 5) -> list:
        """提取记忆"""
        memories = self._load_json(self.memories_path)["memories"]
        
        results = []
        for m in memories:
            if memory_id and m["id"] != memory_id:
                continue
            if room and m["room"] != room:
                continue
            if theme and theme not in m.get("themes", []):
                continue
            results.append(m)
        
        # 按强度排序
        results.sort(key=lambda x: x.get("intensity", 0), reverse=True)
        return results[:limit]
    
    # === 宫殿行走 ===
    
    def walk(self, room: str = None) -> dict:
        """行走宫殿"""
        palace = self._load_json(self.palace_path)
        memories = self._load_json(self.memories_path)["memories"]
        
        result = {"rooms": {}}
        
        for room_name, room_info in palace["rooms"].items():
            if room and room_name != room:
                continue
            
            room_memories = [m for m in memories if m["room"] == room_name]
            result["rooms"][room_name] = {
                "name": room_info["name"],
                "capacity": room_info["capacity"],
                "used": len(room_memories),
                "purpose": room_info["purpose"],
                "memories": [
                    {"id": m["id"], "content": m["content"][:50], "intensity": m.get("intensity", 0)}
                    for m in room_memories
                ]
            }
        
        return result
    
    # === 连接管理 ===
    
    def connect(self, from_id: str, to_id: str, conn_type: str = "theme", strength: float = 0.5):
        """连接两个记忆"""
        connections = self._load_json(self.connections_path)["connections"]
        
        if from_id not in connections:
            connections[from_id] = []
        
        connections[from_id].append({
            "to": to_id,
            "type": conn_type,
            "strength": strength,
            "timestamp": datetime.now().isoformat()
        })
        
        self._save_json(self.connections_path, {"connections": connections})
        return {"success": True}
    
    def get_connected(self, memory_id: str) -> list:
        """获取关联记忆"""
        connections = self._load_json(self.connections_path)["connections"]
        return connections.get(memory_id, [])
    
    # === 统计 ===
    
    def stats(self) -> dict:
        """宫殿统计"""
        palace = self._load_json(self.palace_path)
        memories = self._load_json(self.memories_path)["memories"]
        connections = self._load_json(self.connections_path)["connections"]
        
        room_stats = {}
        total = 0
        for room_name, room_info in palace["rooms"].items():
            count = len([m for m in memories if m["room"] == room_name])
            room_stats[room_name] = {
                "name": room_info["name"],
                "used": count,
                "capacity": room_info["capacity"],
                "percentage": int(count / room_info["capacity"] * 100)
            }
            total += count
        
        return {
            "total_memories": total,
            "total_capacity": palace["total_capacity"],
            "total_connections": sum(len(v) for v in connections.values()),
            "rooms": room_stats
        }


# === CLI ===

import argparse

def main():
    parser = argparse.ArgumentParser(description="Memory Palace Engine")
    subparsers = parser.add_subparsers(dest="command")
    
    # Store
    store_p = subparsers.add_parser("store", help="存入记忆")
    store_p.add_argument("--content", "-c", required=True)
    store_p.add_argument("--room", "-r", default="living")
    store_p.add_argument("--emotion", "-e", default="")
    store_p.add_argument("--intensity", "-i", type=int, default=5)
    
    # Recall
    recall_p = subparsers.add_parser("recall", help="提取记忆")
    recall_p.add_argument("--id", help="记忆ID")
    recall_p.add_argument("--room", "-r")
    recall_p.add_argument("--theme", "-t")
    recall_p.add_argument("--limit", "-l", type=int, default=5)
    
    # Walk
    walk_p = subparsers.add_parser("walk", help="行走宫殿")
    walk_p.add_argument("--room", "-r")
    
    # Connect
    connect_p = subparsers.add_parser("connect", help="连接记忆")
    connect_p.add_argument("--from", dest="from_id", required=True)
    connect_p.add_argument("--to", dest="to_id", required=True)
    connect_p.add_argument("--type", "-t", default="theme")
    
    # Stats
    subparsers.add_parser("stats", help="宫殿统计")
    
    args = parser.parse_args()
    
    palace = MemoryPalace()
    
    if args.command == "store":
        result = palace.store(args.content, args.room, emotion=args.emotion, intensity=args.intensity)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    
    elif args.command == "recall":
        results = palace.recall(args.id, args.room, args.theme, args.limit)
        print(json.dumps(results, ensure_ascii=False, indent=2))
    
    elif args.command == "walk":
        result = palace.walk(args.room)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    
    elif args.command == "connect":
        result = palace.connect(args.from_id, args.to_id, args.type)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    
    elif args.command == "stats":
        result = palace.stats()
        print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
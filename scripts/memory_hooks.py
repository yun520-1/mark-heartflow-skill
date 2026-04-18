#!/usr/bin/env python3
"""
Memory Hooks - 记忆检索与存储钩子

独立模块，不依赖 xinchong_guardian 插件
直接集成到 HeartFlow 核心中使用

功能:
1. on_message_received: 收到用户消息后，自动检索相关记忆
2. on_response_sent: LLM 回复后，自动存储对话记忆

使用方式:
    from memory_hooks import MemoryHooks
    
    hooks = MemoryHooks()
    
    # 收到消息时
    context = hooks.on_message_received("用户消息")
    
    # 回复后
    hooks.on_response_sent("用户消息", "LLM 回复")
"""

import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, List, Any

# 导入向量版记忆宫殿
try:
    from memory_palace_v2 import MemoryPalace
except ImportError:
    # 回退到旧版本
    from memory_palace import MemoryPalace


class MemoryHooks:
    """
    记忆钩子系统
    
    自动在消息通道中检索和存储记忆
    """
    
    def __init__(self, base_path: str = None, auto_recall: bool = True, auto_store: bool = True):
        """
        Args:
            base_path: 记忆存储路径
            auto_recall: 是否自动检索记忆（收到消息时）
            auto_store: 是否自动存储记忆（回复后）
        """
        self.base_path = Path(base_path) if base_path else None
        self.palace = MemoryPalace(str(self.base_path) if self.base_path else None)
        
        self.auto_recall = auto_recall
        self.auto_store = auto_store
        
        # 会话上下文
        self.current_session = {
            "messages": [],
            "started_at": datetime.now().isoformat(),
            "memory_count": 0
        }
        
        # 配置
        self.config = {
            "recall_limit": 5,          # 检索记忆数量
            "time_window": 7,           # 时间窗口（天）
            "min_intensity": 3,         # 最小存储强度
            "auto_connect": True,       # 自动连接相关记忆
            "emotion_threshold": 6,     # 情感强度阈值（超过则存储）
        }
    
    def on_message_received(self, user_input: str, context: Dict = None) -> Dict:
        """
        钩子：收到用户消息后
        
        自动检索相关记忆，为 LLM 提供上下文
        
        Args:
            user_input: 用户输入文本
            context: 额外上下文（可选）
        
        Returns:
            Dict: 包含检索到的记忆和上下文信息
        """
        result = {
            "user_input": user_input,
            "timestamp": datetime.now().isoformat(),
            "memories_retrieved": [],
            "context_enhanced": "",
            "recall_stats": {}
        }
        
        if not self.auto_recall:
            return result
        
        # 1. 语义检索
        memories = self.palace.recall(
            query=user_input,
            limit=self.config["recall_limit"],
            time_window=self.config["time_window"]
        )
        
        result["memories_retrieved"] = memories
        result["recall_stats"] = {
            "total_found": len(memories),
            "query": user_input,
            "time_window": self.config["time_window"]
        }
        
        # 2. 构建增强上下文
        if memories:
            context_parts = ["【相关记忆】"]
            for i, mem in enumerate(memories[:3], 1):
                context_parts.append(
                    f"{i}. {mem.get('content', '')[:100]}..."
                )
            result["context_enhanced"] = "\n".join(context_parts)
        
        # 3. 记录到会话
        self.current_session["messages"].append({
            "role": "user",
            "content": user_input,
            "timestamp": result["timestamp"],
            "memories_found": len(memories)
        })
        
        return result
    
    def on_response_sent(self, user_input: str, llm_response: str, 
                         emotion: str = None, intensity: int = None,
                         themes: List[str] = None) -> Dict:
        """
        钩子：LLM 回复后
        
        自动存储对话记忆到向量数据库
        
        Args:
            user_input: 用户输入
            llm_response: LLM 回复
            emotion: 情感标签（可选）
            intensity: 情感强度（1-10，可选）
            themes: 主题标签（可选）
        
        Returns:
            Dict: 存储结果
        """
        result = {
            "stored": False,
            "memory_id": None,
            "reason": ""
        }
        
        if not self.auto_store:
            result["reason"] = "自动存储已禁用"
            return result
        
        # 判断是否需要存储
        should_store = self._should_store(user_input, llm_response, emotion, intensity)
        
        if not should_store:
            result["reason"] = "不满足存储条件"
            return result
        
        # 确定房间
        room = self._determine_room(user_input, llm_response, emotion)
        
        # 确定优先级
        priority = self._determine_priority(emotion, intensity)
        
        # 存储记忆
        store_result = self.palace.store(
            content=llm_response,
            room=room,
            priority=priority,
            emotion=emotion or "neutral",
            intensity=intensity or 5,
            themes=themes or [],
            user_input=user_input,
            llm_response=llm_response
        )
        
        if store_result.get("success"):
            result["stored"] = True
            result["memory_id"] = store_result.get("memory_id")
            result["room"] = room
            result["priority"] = priority
            
            self.current_session["memory_count"] += 1
            
            # 自动连接相关记忆
            if self.config["auto_connect"]:
                self._auto_connect(store_result.get("memory_id"), user_input)
        else:
            result["reason"] = store_result.get("error", "存储失败")
        
        # 记录到会话
        self.current_session["messages"].append({
            "role": "assistant",
            "content": llm_response,
            "timestamp": datetime.now().isoformat(),
            "stored": result["stored"],
            "memory_id": result["memory_id"]
        })
        
        return result
    
    def _should_store(self, user_input: str, llm_response: str,
                      emotion: str = None, intensity: int = None) -> bool:
        """判断是否需要存储"""
        
        # 有明确情感标签
        if emotion:
            return True
        
        # 情感强度超过阈值
        if intensity and intensity >= self.config["emotion_threshold"]:
            return True
        
        # 包含关键词（重要对话）
        important_keywords = ["记住", "重要", "决定", "目标", "计划", "发现", "理解"]
        for kw in important_keywords:
            if kw in user_input or kw in llm_response:
                return True
        
        # 对话长度（长对话通常更有价值）
        if len(llm_response) > 200:
            return True
        
        return False
    
    def _determine_room(self, user_input: str, llm_response: str, 
                        emotion: str = None) -> str:
        """确定记忆房间"""
        
        # 情感驱动
        if emotion:
            emotion_lower = emotion.lower()
            if emotion_lower in ["joy", "love", "gratitude"]:
                return "kitchen"  # 情感
            elif emotion_lower in ["sadness", "anger", "fear"]:
                return "basement"  # 深层记忆
            elif emotion_lower in ["surprise", "curiosity"]:
                return "garden"  # 创造性
        
        # 内容驱动
        content = (user_input + " " + llm_response).lower()
        
        if any(kw in content for kw in ["知识", "学习", "技能", "概念", "理解"]):
            return "study"  # 知识
        
        if any(kw in content for kw in ["创意", "想法", "灵感", "梦想", "想象"]):
            return "garden"  # 创造性
        
        if any(kw in content for kw in ["习惯", "模式", "深层", "过去", "童年"]):
            return "basement"  # 深层记忆
        
        return "living"  # 默认日常对话
    
    def _determine_priority(self, emotion: str = None, intensity: int = None) -> int:
        """确定优先级（0-9，0 最高）"""
        
        if intensity and intensity >= 8:
            return 0  # 最高优先级
        
        if emotion:
            return 1  # 高优先级
        
        if intensity and intensity >= 5:
            return 3  # 中等优先级
        
        return 5  # 默认优先级
    
    def _auto_connect(self, memory_id: str, user_input: str):
        """自动连接相关记忆"""
        # 检索相关记忆
        related = self.palace.recall(query=user_input, limit=3)
        
        for mem in related:
            if mem.get("id") != memory_id:
                # 计算相似度作为连接强度
                similarity = mem.get("score", 0.5)
                self.palace.connect(memory_id, mem["id"], "semantic", similarity)
    
    # === 会话管理 ===
    
    def get_session_summary(self) -> Dict:
        """获取当前会话摘要"""
        return {
            "started_at": self.current_session["started_at"],
            "message_count": len(self.current_session["messages"]),
            "memory_count": self.current_session["memory_count"],
            "messages": self.current_session["messages"]
        }
    
    def reset_session(self):
        """重置会话"""
        self.current_session = {
            "messages": [],
            "started_at": datetime.now().isoformat(),
            "memory_count": 0
        }
    
    # === 统计 ===
    
    def stats(self) -> Dict:
        """获取记忆系统统计"""
        palace_stats = self.palace.stats()
        
        return {
            **palace_stats,
            "current_session": self.get_session_summary(),
            "config": self.config
        }
    
    # === 便捷方法 ===
    
    def recall(self, query: str, **kwargs) -> List:
        """便捷检索"""
        return self.palace.recall(query, **kwargs)
    
    def store(self, content: str, **kwargs) -> Dict:
        """便捷存储"""
        return self.palace.store(content, **kwargs)
    
    def walk(self) -> Dict:
        """行走宫殿"""
        return self.palace.walk()


# === 便捷函数 ===

_hooks_instance = None

def get_hooks() -> MemoryHooks:
    """获取单例钩子实例"""
    global _hooks_instance
    if _hooks_instance is None:
        _hooks_instance = MemoryHooks()
    return _hooks_instance


def on_message(user_input: str) -> Dict:
    """便捷函数：消息接收钩子"""
    return get_hooks().on_message_received(user_input)


def on_response(user_input: str, llm_response: str, **kwargs) -> Dict:
    """便捷函数：回复发送钩子"""
    return get_hooks().on_response_sent(user_input, llm_response, **kwargs)


# === CLI ===

import argparse

def main():
    parser = argparse.ArgumentParser(description="Memory Hooks CLI")
    subparsers = parser.add_subparsers(dest="command")
    
    # Test recall
    recall_p = subparsers.add_parser("recall", help="测试检索")
    recall_p.add_argument("--query", "-q", required=True)
    
    # Test store
    store_p = subparsers.add_parser("store", help="测试存储")
    store_p.add_argument("--input", "-i", required=True)
    store_p.add_argument("--response", "-r", required=True)
    store_p.add_argument("--emotion", "-e")
    store_p.add_argument("--intensity", type=int, default=5)
    
    # Stats
    subparsers.add_parser("stats", help="统计")
    
    # Walk
    subparsers.add_parser("walk", help="行走宫殿")
    
    args = parser.parse_args()
    
    hooks = MemoryHooks()
    
    if args.command == "recall":
        results = hooks.recall(args.query)
        print(json.dumps(results, ensure_ascii=False, indent=2))
    
    elif args.command == "store":
        result = hooks.on_response_sent(
            args.input,
            args.response,
            emotion=args.emotion,
            intensity=args.intensity
        )
        print(json.dumps(result, ensure_ascii=False, indent=2))
    
    elif args.command == "stats":
        stats = hooks.stats()
        print(json.dumps(stats, ensure_ascii=False, indent=2))
    
    elif args.command == "walk":
        walk = hooks.walk()
        print(json.dumps(walk, ensure_ascii=False, indent=2))
    
    else:
        parser.print_help()


if __name__ == "__main__":
    main()

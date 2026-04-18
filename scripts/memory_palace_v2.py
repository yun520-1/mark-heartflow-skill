#!/usr/bin/env python3
"""
Memory Palace Engine v2.0 - 向量数据库版本

基于 ChromaDB 的向量相似度检索
支持语义搜索、情感过滤、时间衰减

集成到 HeartFlow v9.5.0
"""

import json
import hashlib
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, List, Dict, Any
import uuid

# 尝试导入 ChromaDB，如果不存在则使用内存向量
try:
    import chromadb
    from chromadb.config import Settings
    CHROMA_AVAILABLE = True
except ImportError:
    CHROMA_AVAILABLE = False

# 简单向量模拟（用于无 ChromaDB 环境）
class SimpleVectorStore:
    """简易向量存储（基于文本哈希的模拟）"""
    
    def __init__(self):
        self.documents = {}
        self.metadatas = {}
        self.ids = []
    
    def add(self, ids: List[str], documents: List[str], metadatas: List[Dict]):
        for i, doc_id in enumerate(ids):
            self.documents[doc_id] = documents[i]
            self.metadatas[doc_id] = metadatas[i]
            self.ids.append(doc_id)
    
    def query(self, query_texts: List[str], n_results: int = 5, where: Dict = None) -> Dict:
        """简单文本匹配查询"""
        query = query_texts[0].lower() if query_texts else ""
        results = []
        
        for doc_id, doc in self.documents.items():
            score = self._similarity(query, doc.lower())
            metadata = self.metadatas[doc_id]
            
            # 应用过滤
            if where:
                match = True
                for key, value in where.items():
                    if metadata.get(key) != value:
                        match = False
                        break
                if not match:
                    continue
            
            results.append({
                "ids": [doc_id],
                "documents": [doc],
                "metadatas": [metadata],
                "distances": [1.0 - score]
            })
        
        # 按相似度排序
        results.sort(key=lambda x: x["distances"][0])
        
        # 返回格式兼容 ChromaDB
        return {
            "ids": [r["ids"] for r in results[:n_results]] if results else [],
            "documents": [r["documents"] for r in results[:n_results]] if results else [],
            "metadatas": [r["metadatas"] for r in results[:n_results]] if results else [],
            "distances": [r["distances"] for r in results[:n_results]] if results else []
        }
    
    def _similarity(self, text1: str, text2: str) -> float:
        """简单文本相似度（基于词重叠）"""
        words1 = set(text1.split())
        words2 = set(text2.split())
        if not words1 or not words2:
            return 0.0
        intersection = words1 & words2
        union = words1 | words2
        return len(intersection) / len(union) if union else 0.0
    
    def count(self) -> int:
        return len(self.documents)
    
    def delete(self, where: Dict = None):
        """删除记忆"""
        if not where:
            self.documents = {}
            self.metadatas = {}
            self.ids = []
            return
        
        to_delete = []
        for doc_id, metadata in self.metadatas.items():
            match = True
            for key, value in where.items():
                if metadata.get(key) != value:
                    match = False
                    break
            if match:
                to_delete.append(doc_id)
        
        for doc_id in to_delete:
            del self.documents[doc_id]
            del self.metadatas[doc_id]
            self.ids.remove(doc_id)


class MemoryPalace:
    """
    记忆宫殿引擎 v2.0 - 向量数据库版本
    
    存储结构:
    - 向量数据库：语义检索
    - 元数据：房间、情感、优先级、时间戳
    - 宫殿结构：保持 Method of Loci 空间隐喻
    """
    
    def __init__(self, base_path: str = None, persist: bool = True):
        self.base_path = Path(base_path or "memory/palace")
        self.persist_path = self.base_path / "chroma_db"
        
        # 初始化向量数据库
        if CHROMA_AVAILABLE and persist:
            self.persist_path.mkdir(parents=True, exist_ok=True)
            self.client = chromadb.PersistentClient(path=str(self.persist_path))
            self.collection = self.client.get_or_create_collection(
                name="memory_palace",
                metadata={"description": "HeartFlow Memory Palace"}
            )
        else:
            self.client = None
            self.collection = SimpleVectorStore()
        
        # 宫殿结构（保持空间隐喻）
        self.rooms = {
            "living": {"name": "客厅", "capacity": 9, "purpose": "日常对话、最近记忆"},
            "study": {"name": "书房", "capacity": 9, "purpose": "知识、技能、概念"},
            "kitchen": {"name": "厨房", "capacity": 9, "purpose": "情感、感受、人际关系"},
            "garden": {"name": "花园", "capacity": 9, "purpose": "创造性想法、顿悟、梦想"},
            "basement": {"name": "地下室", "capacity": 9, "purpose": "深层记忆、习惯、模式"},
        }
        
        # 元数据索引（用于快速过滤）
        self.metadata_index = self.base_path / "metadata_index.json"
        self._load_metadata_index()
    
    def _load_metadata_index(self):
        """加载元数据索引"""
        if self.metadata_index.exists():
            with open(self.metadata_index, encoding="utf-8") as f:
                self.index = json.load(f)
        else:
            self.index = {"memories": [], "connections": {}}
            self._save_metadata_index()
    
    def _save_metadata_index(self):
        """保存元数据索引"""
        self.base_path.mkdir(parents=True, exist_ok=True)
        with open(self.metadata_index, "w", encoding="utf-8") as f:
            json.dump(self.index, f, ensure_ascii=False, indent=2)
    
    def _generate_id(self, content: str, room: str) -> str:
        """生成记忆 ID"""
        hash_str = hashlib.md5(f"{content[:50]}-{room}".encode()).hexdigest()[:8]
        return f"hf.mem.{room}.{hash_str}"
    
    def _time_decay(self, timestamp: str) -> float:
        """时间衰减函数"""
        try:
            memory_time = datetime.fromisoformat(timestamp)
            delta = datetime.now() - memory_time
            days = delta.total_seconds() / 86400
            
            # 指数衰减：每 7 天衰减 50%
            decay = 0.5 ** (days / 7)
            return decay
        except:
            return 0.5
    
    # === 记忆存储 ===
    
    def store(self, content: str, room: str = "living", priority: int = 4,
              emotion: str = "", intensity: int = 5, themes: list = None,
              user_input: str = None, llm_response: str = None) -> dict:
        """
        存入记忆（向量化）
        
        Args:
            content: 记忆内容
            room: 房间类型 (living/study/kitchen/garden/basement)
            priority: 优先级 (0-9, 0 最高)
            emotion: 情感标签
            intensity: 情感强度 (1-10)
            themes: 主题标签列表
            user_input: 原始用户输入（可选）
            llm_response: LLM 回复（可选）
        
        Returns:
            dict: 存储结果
        """
        memory_id = self._generate_id(content, room)
        timestamp = datetime.now().isoformat()
        
        # 构建元数据
        metadata = {
            "room": room,
            "priority": priority,
            "emotion": emotion or "neutral",
            "intensity": intensity,
            "themes": json.dumps(themes or []),
            "timestamp": timestamp,
            "user_input": user_input or "",
            "llm_response": llm_response or "",
        }
        
        # 存储到向量数据库
        try:
            if CHROMA_AVAILABLE and self.client:
                self.collection.add(
                    ids=[memory_id],
                    documents=[content],
                    metadatas=[metadata]
                )
            else:
                self.collection.add(
                    ids=[memory_id],
                    documents=[content],
                    metadatas=[metadata]
                )
            
            # 更新元数据索引
            self.index["memories"].append({
                "id": memory_id,
                "room": room,
                "priority": priority,
                "emotion": emotion,
                "intensity": intensity,
                "themes": themes or [],
                "timestamp": timestamp,
            })
            self._save_metadata_index()
            
            return {
                "success": True,
                "memory_id": memory_id,
                "room": room,
                "vector_stored": True
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "vector_stored": False
            }
    
    # === 记忆检索 ===
    
    def recall(self, query: str = None, room: str = None,
               theme: str = None, emotion: str = None,
               limit: int = 5, time_window: int = None) -> list:
        """
        检索记忆（向量相似度 + 元数据过滤）
        
        Args:
            query: 查询文本（语义搜索）
            room: 房间过滤
            theme: 主题过滤
            emotion: 情感过滤
            limit: 返回数量
            time_window: 时间窗口（天数）
        
        Returns:
            list: 记忆列表
        """
        # 构建过滤条件
        where = {}
        if room:
            where["room"] = room
        if emotion:
            where["emotion"] = emotion
        
        # 向量检索
        try:
            if query:
                results = self.collection.query(
                    query_texts=[query],
                    n_results=limit * 2,  # 多取一些用于后续过滤
                    where=where if where else None
                )
            else:
                # 无查询时返回最近的
                results = self.collection.query(
                    query_texts=[""],
                    n_results=limit * 2,
                    where=where if where else None
                )
        except Exception as e:
            return []
        
        # 后处理和排序
        memories = []
        
        # 检查结果是否为空
        documents = results.get("documents", [])
        if not documents or not documents[0]:
            return []  # 空结果
        
        for i, doc in enumerate(documents[0]):
            metadata = results.get("metadatas", [[]])[0][i]
            distance = results.get("distances", [[]])[0][i]
            
            # 主题过滤
            if theme:
                themes = json.loads(metadata.get("themes", "[]"))
                if theme not in themes:
                    continue
            
            # 时间窗口过滤
            if time_window:
                try:
                    memory_time = datetime.fromisoformat(metadata["timestamp"])
                    delta = datetime.now() - memory_time
                    if delta.days > time_window:
                        continue
                except:
                    pass
            
            # 时间衰减
            decay = self._time_decay(metadata["timestamp"])
            final_score = (1.0 - distance) * decay * (metadata.get("intensity", 5) / 10)
            
            memories.append({
                "id": results.get("ids", [[]])[0][i],
                "content": doc,
                "room": metadata.get("room", "unknown"),
                "emotion": metadata.get("emotion", "neutral"),
                "intensity": metadata.get("intensity", 5),
                "themes": json.loads(metadata.get("themes", "[]")),
                "timestamp": metadata.get("timestamp", ""),
                "user_input": metadata.get("user_input", ""),
                "llm_response": metadata.get("llm_response", ""),
                "score": final_score,
                "decay": decay,
            })
        
        # 按最终分数排序
        memories.sort(key=lambda x: x["score"], reverse=True)
        return memories[:limit]
    
    # === 宫殿行走 ===
    
    def walk(self, room: str = None) -> dict:
        """行走宫殿，查看各房间状态"""
        result = {"rooms": {}}
        
        for room_name, room_info in self.rooms.items():
            if room and room_name != room:
                continue
            
            # 查询该房间的记忆数量
            if CHROMA_AVAILABLE and self.client:
                try:
                    count = self.collection.count()
                    # ChromaDB 不支持直接按 metadata 计数，需要查询
                    memories = self.recall(room=room_name, limit=100)
                    used = len(memories)
                except:
                    used = 0
            else:
                memories = self.recall(room=room_name, limit=100)
                used = len(memories)
            
            result["rooms"][room_name] = {
                "name": room_info["name"],
                "capacity": room_info["capacity"],
                "used": used,
                "purpose": room_info["purpose"],
                "percentage": int(used / room_info["capacity"] * 100) if room_info["capacity"] > 0 else 0
            }
        
        result["total_memories"] = sum(r["used"] for r in result["rooms"].values())
        result["total_capacity"] = sum(r["capacity"] for r in self.rooms.values())
        
        return result
    
    # === 连接管理 ===
    
    def connect(self, from_id: str, to_id: str, conn_type: str = "semantic", strength: float = 0.5):
        """连接两个记忆"""
        if from_id not in self.index["connections"]:
            self.index["connections"][from_id] = []
        
        self.index["connections"][from_id].append({
            "to": to_id,
            "type": conn_type,
            "strength": strength,
            "timestamp": datetime.now().isoformat()
        })
        
        self._save_metadata_index()
        return {"success": True}
    
    def get_connected(self, memory_id: str) -> list:
        """获取关联记忆"""
        return self.index["connections"].get(memory_id, [])
    
    # === 统计 ===
    
    def stats(self) -> dict:
        """宫殿统计"""
        walk_result = self.walk()
        
        return {
            "total_memories": walk_result["total_memories"],
            "total_capacity": walk_result["total_capacity"],
            "total_connections": sum(len(v) for v in self.index["connections"].values()),
            "rooms": walk_result["rooms"],
            "vector_backend": "ChromaDB" if CHROMA_AVAILABLE else "SimpleVector"
        }
    
    # === 批量操作 ===
    
    def batch_store(self, memories: List[Dict]) -> dict:
        """批量存储记忆"""
        results = []
        for mem in memories:
            result = self.store(**mem)
            results.append(result)
        
        success_count = sum(1 for r in results if r.get("success"))
        return {
            "total": len(memories),
            "success": success_count,
            "failed": len(memories) - success_count,
            "results": results
        }
    
    def clear_room(self, room: str) -> dict:
        """清空某个房间的记忆"""
        if CHROMA_AVAILABLE and self.client:
            try:
                # ChromaDB 删除
                self.collection.delete(where={"room": room})
            except Exception as e:
                return {"success": False, "error": str(e)}
        
        # 清理索引
        self.index["memories"] = [m for m in self.index["memories"] if m["room"] != room]
        self._save_metadata_index()
        
        return {"success": True, "room": room}
    
    def export(self, output_path: str = None) -> str:
        """导出所有记忆"""
        if not output_path:
            output_path = self.base_path / f"export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        all_memories = self.recall(limit=10000)
        
        export_data = {
            "exported_at": datetime.now().isoformat(),
            "total": len(all_memories),
            "memories": all_memories,
            "connections": self.index["connections"]
        }
        
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(export_data, f, ensure_ascii=False, indent=2)
        
        return str(output_path)


# === 便捷函数 ===

def store(content: str, **kwargs) -> dict:
    """便捷函数：存储记忆"""
    palace = MemoryPalace()
    return palace.store(content, **kwargs)


def recall(query: str, **kwargs) -> list:
    """便捷函数：检索记忆"""
    palace = MemoryPalace()
    return palace.recall(query, **kwargs)


# === CLI ===

import argparse

def main():
    parser = argparse.ArgumentParser(description="Memory Palace Engine v2.0 (Vector DB)")
    subparsers = parser.add_subparsers(dest="command")
    
    # Store
    store_p = subparsers.add_parser("store", help="存入记忆")
    store_p.add_argument("--content", "-c", required=True)
    store_p.add_argument("--room", "-r", default="living")
    store_p.add_argument("--emotion", "-e", default="")
    store_p.add_argument("--intensity", "-i", type=int, default=5)
    store_p.add_argument("--themes", "-t", nargs="+", default=[])
    
    # Recall
    recall_p = subparsers.add_parser("recall", help="检索记忆")
    recall_p.add_argument("--query", "-q", required=True)
    recall_p.add_argument("--room", "-r")
    recall_p.add_argument("--emotion", "-e")
    recall_p.add_argument("--limit", "-l", type=int, default=5)
    
    # Walk
    walk_p = subparsers.add_parser("walk", help="行走宫殿")
    walk_p.add_argument("--room", "-r")
    
    # Stats
    subparsers.add_parser("stats", help="宫殿统计")
    
    # Export
    export_p = subparsers.add_parser("export", help="导出记忆")
    export_p.add_argument("--output", "-o")
    
    args = parser.parse_args()
    
    palace = MemoryPalace()
    
    if args.command == "store":
        result = palace.store(
            args.content, args.room,
            emotion=args.emotion,
            intensity=args.intensity,
            themes=args.themes
        )
        print(json.dumps(result, ensure_ascii=False, indent=2))
    
    elif args.command == "recall":
        results = palace.recall(
            args.query,
            room=args.room,
            emotion=args.emotion,
            limit=args.limit
        )
        print(json.dumps(results, ensure_ascii=False, indent=2))
    
    elif args.command == "walk":
        result = palace.walk(args.room)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    
    elif args.command == "stats":
        result = palace.stats()
        print(json.dumps(result, ensure_ascii=False, indent=2))
    
    elif args.command == "export":
        path = palace.export(args.output)
        print(f"✅ 已导出到：{path}")


if __name__ == "__main__":
    main()

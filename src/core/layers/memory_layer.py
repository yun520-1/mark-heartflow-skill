#!/usr/bin/env python3
"""
HeartFlow Memory Layer (记忆层)
艾宾浩斯衰减持久性语义 - 管理动态经验与情感印记

基于 Roynard (2026) KMWI 认知架构
"""

import time
import math
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field


@dataclass
class HeartTraceMemory:
    """
    心痕记忆 - 每条记忆包含：
    - content: 内容
    - emotion: 情感标记
    - timestamp: 时间戳
    - intensity: 强度 (0.0-1.0)
    """
    content: str
    emotion: Dict[str, float] = field(default_factory=dict)
    timestamp: float = field(default_factory=float)
    intensity: float = 1.0
    tags: List[str] = field(default_factory=list)


@dataclass
class SelfEvolutionEntry:
    """自进化日志条目"""
    task: str
    reasoning_path: List[str]
    outcome: str
    lesson: str
    timestamp: float = field(default_factory=time.time)


class MemoryLayer:
    """
    记忆层 - 符合 KMWI 模型的"艾宾浩斯衰减"持久性语义
    
    核心组件：
    - HeartTraceMemory: 心痕记忆，支持艾宾浩斯衰减
    - MemoryPalace: 空间化记忆存储
    - SelfEvolutionLog: 记录推理元数据用于自进化
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        
        # 心痕记忆列表
        self.heart_trace: List[HeartTraceMemory] = []
        
        # 记忆宫殿：{location: [memories]}
        self.palace: Dict[str, List[Dict]] = {}
        
        # 自进化日志
        self.evolution_log: List[SelfEvolutionEntry] = []
        
        # 艾宾浩斯衰减常数
        self.decay_constant = self.config.get('decay_constant', 0.1)
        
        # 最大记忆数量
        self.max_memories = self.config.get('max_memories', 1000)
    
    def _calculate_decay(self, memory: HeartTraceMemory) -> float:
        """计算当前时刻的记忆强度（艾宾浩斯衰减）"""
        time_elapsed = time.time() - memory.timestamp
        # I(t) = I(0) * e^(-λt)
        decay = memory.intensity * math.exp(-self.decay_constant * time_elapsed / 3600)
        return max(0.01, decay)  # 最小保留 1%
    
    def add_memory(self, content: str, emotion: Dict[str, float] = None,
                   tags: List[str] = None) -> None:
        """
        添加心痕记忆，初始强度 1.0
        
        Args:
            content: 记忆内容
            emotion: 情感标记 {'joy': 0.8, 'sadness': 0.2, ...}
            tags: 标签列表
        """
        memory = HeartTraceMemory(
            content=content,
            emotion=emotion or {},
            timestamp=time.time(),
            intensity=1.0,
            tags=tags or []
        )
        self.heart_trace.append(memory)
        
        # 清理过期记忆
        if len(self.heart_trace) > self.max_memories:
            self.heart_trace = self.heart_trace[-self.max_memories:]
    
    def retrieve(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        检索记忆，按当前强度排序（考虑衰减）
        
        Args:
            query: 查询文本
            top_k: 返回前 k 条
        
        Returns:
            [{'content', 'emotion', 'intensity', 'timestamp'}, ...]
        """
        results = []
        
        for memory in self.heart_trace:
            # 计算当前强度
            current_intensity = self._calculate_decay(memory)
            
            # 简单的关键词匹配
            relevance = 0.0
            query_words = set(query.lower().split())
            content_words = set(memory.content.lower().split())
            overlap = query_words & content_words
            
            if overlap:
                relevance = len(overlap) / max(len(query_words), len(content_words))
            
            # 综合评分 = 强度 * 相关性
            score = current_intensity * (0.5 + 0.5 * relevance)
            
            results.append({
                'content': memory.content,
                'emotion': memory.emotion,
                'intensity': current_intensity,
                'timestamp': memory.timestamp,
                'tags': memory.tags,
                'score': score
            })
        
        # 按评分排序
        results.sort(key=lambda x: x['score'], reverse=True)
        
        return results[:top_k]
    
    def store_in_palace(self, location: str, memory: Dict) -> None:
        """存入记忆宫殿"""
        if location not in self.palace:
            self.palace[location] = []
        self.palace[location].append(memory)
    
    def recall_from_palace(self, location: str) -> List[Dict]:
        """从特定位置回忆"""
        return self.palace.get(location, [])
    
    def get_palace_locations(self) -> List[str]:
        """获取所有宫殿位置"""
        return list(self.palace.keys())
    
    def log_evolution(self, task: str, reasoning_path: List[str],
                      outcome: str, lesson: str) -> None:
        """记录自进化日志"""
        entry = SelfEvolutionEntry(
            task=task,
            reasoning_path=reasoning_path,
            outcome=outcome,
            lesson=lesson
        )
        self.evolution_log.append(entry)
        
        # 保留最近 100 条
        if len(self.evolution_log) > 100:
            self.evolution_log = self.evolution_log[-100:]
    
    def get_evolution_lessons(self, task_hint: str = "") -> List[str]:
        """获取相关经验教训"""
        lessons = []
        for entry in reversed(self.evolution_log):
            if not task_hint or task_hint.lower() in entry.task.lower():
                if entry.lesson:
                    lessons.append(entry.lesson)
            if len(lessons) >= 5:
                break
        return lessons
    
    def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        层接口：检索相关记忆和经验
        
        Args:
            input_data: {
                'query': str,           # 查询文本
                'top_k': int,           # 返回数量
                'action': str,          # 'retrieve' | 'add' | 'evolve'
            }
        
        Returns:
            {
                'memories': List[Dict],     # 检索到的记忆
                'lessons': List[str],       # 经验教训
                'emotions': Dict,            # 聚合情感
            }
        """
        query = input_data.get('query', '')
        top_k = input_data.get('top_k', 5)
        action = input_data.get('action', 'retrieve')
        
        if action == 'add':
            # 添加新记忆
            self.add_memory(
                content=input_data.get('content', ''),
                emotion=input_data.get('emotion', {}),
                tags=input_data.get('tags', [])
            )
            return {'status': 'added', 'layer': 'memory'}
        
        elif action == 'evolve':
            # 记录进化
            self.log_evolution(
                task=input_data.get('task', ''),
                reasoning_path=input_data.get('reasoning_path', []),
                outcome=input_data.get('outcome', ''),
                lesson=input_data.get('lesson', '')
            )
            return {'status': 'logged', 'layer': 'memory'}
        
        # 检索记忆
        memories = self.retrieve(query, top_k)
        
        # 聚合情感
        emotions = {}
        for mem in memories:
            for emo, val in mem['emotion'].items():
                emotions[emo] = emotions.get(emo, 0) + val * mem['intensity']
        
        # 获取相关教训
        lessons = self.get_evolution_lessons(query)
        
        return {
            'memories': memories,
            'lessons': lessons,
            'emotions': emotions,
            'layer': 'memory'
        }
    
    def get_state(self) -> Dict[str, Any]:
        """返回当前层状态"""
        return {
            'layer': 'memory',
            'memories_count': len(self.heart_trace),
            'palace_locations': len(self.palace),
            'evolution_entries': len(self.evolution_log),
            'decay_constant': self.decay_constant
        }


if __name__ == "__main__":
    # 测试代码
    layer = MemoryLayer({'decay_constant': 0.1})
    
    # 添加记忆
    layer.add_memory("今天帮助了别人很开心", {'joy': 0.9, 'satisfaction': 0.8})
    layer.add_memory("完成了重要的决策", {'pride': 0.7, 'relief': 0.6})
    
    # 检索
    result = layer.process({'query': '帮助', 'top_k': 3})
    print(f"Memories: {result['memories']}")
    print(f"Emotions: {result['emotions']}")
    
    # 记录进化
    layer.log_evolution(
        task="解决冲突",
        reasoning_path=["分析问题", "权衡利弊", "选择方案"],
        outcome="成功",
        lesson="冲突需要冷静处理"
    )
    print(f"Lessons: {layer.get_evolution_lessons('冲突')}")
    print(f"State: {layer.get_state()}")

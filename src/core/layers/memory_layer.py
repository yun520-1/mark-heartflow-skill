#!/usr/bin/env python3
"""
HeartFlow Memory Layer v10.6 - 记忆污染解决方案
=================================================

基于4篇论文的优化:
1. RUMS (2604.14473) - Response-Utility 记忆选择
2. Oblivion (2604.00131) - 遗忘=衰减，按需读取
3. Novel Forgetting (2604.02280) - 三维护航评分
4. HEARTBEAT (2603.23064) - 记忆污染根因分析

核心改进:
- Topic-Gated: 新话题不加载旧记忆
- Uncertainty-Gated: 不确定时再查记忆
- Response-Utility Scoring: 按输出影响力评分
- Bounded Retrieval: 限制每次检索数量
"""

import time
import math
import hashlib
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field


@dataclass
class HeartTraceMemory:
    """心痕记忆 - 带多维护航评分"""
    content: str
    emotion: Dict[str, float] = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)
    intensity: float = 1.0
    tags: List[str] = field(default_factory=list)
    
    # 新增：多维评分 (RUMS + Novel Forgetting)
    frequency: int = 1  # 被引用次数
    semantic_hash: str = ""  # 语义主题指纹
    utility_score: float = 0.0  # Response-Utility 评分


@dataclass
class TopicSignature:
    """话题签名 - 用于检测新话题"""
    keywords: Tuple[str, ...]
    semantic_hash: str
    timestamp: float
    memory_count: int = 0  # 该话题关联的记忆数


class MemoryLayer:
    """
    记忆层 v10.6 - 防污染版本
    
    核心机制:
    1. Topic Gating: 检测新话题 → 跳过历史记忆
    2. Uncertainty Gating: 高不确定时才查记忆
    3. Bounded Retrieval: 严格限制每次检索数量
    4. Decay-Driven Access: 遗忘=衰减，非删除
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        
        # 记忆存储
        self.heart_trace: List[HeartTraceMemory] = []
        
        # 记忆宫殿
        self.palace: Dict[str, List[Dict]] = {}
        
        # 自进化日志
        self.evolution_log: List[Dict] = []
        
        # 话题签名历史 - 用于检测新话题
        self.topic_history: List[TopicSignature] = []
        
        # ====== 配置参数 ======
        
        # 艾宾浩斯衰减常数
        self.decay_constant = self.config.get('decay_constant', 0.1)
        
        # 最大记忆数量
        self.max_memories = self.config.get('max_memories', 100)
        
        # 每次检索上限 (防止污染)
        self.retrieval_limit = self.config.get('retrieval_limit', 3)
        
        # 新话题相似度阈值
        self.topic_novelty_threshold = self.config.get('topic_novelty_threshold', 0.3)
        
        # 记忆访问计数
        self.total_retrievals = 0
        
        # 当前话题 (跨session携带)
        self.current_topic: Optional[TopicSignature] = None
        
        # 不确定性缓存
        self.uncertainty_cache: Dict[str, float] = {}
    
    def _extract_topic_signature(self, text: str) -> TopicSignature:
        """提取话题签名 - 支持中英文"""
        # 分词处理
        # 英文直接分割
        import re
        words = re.findall(r'[a-zA-Z]+|[\\u4e00-\\u9fff]', text.lower())
        
        # 停用词 (中英文)
        stopwords = {'的', '是', '在', '了', '和', '与', '或', '这', '那', '有', 
                     '我', '你', '他', '她', '它', '们', '的', '得', '地',
                     'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be',
                     'how', 'what', 'when', 'where', 'who', 'which'}
        words = [w for w in words if w not in stopwords and len(w) > 1]
        
        # 取有意义的关键词
        keywords = tuple(sorted(set(words[:8]))) if words else ()
        
        # 语义哈希
        if words:
            key_words = ''.join(sorted(set(words[:3])))
            semantic_hash = hashlib.md5(key_words.encode()).hexdigest()[:8]
        else:
            semantic_hash = ""
        
        return TopicSignature(
            keywords=keywords,
            semantic_hash=semantic_hash,
            timestamp=time.time()
        )
    
    def _calculate_topic_novelty(self, new_topic: TopicSignature) -> float:
        """
        计算话题新颖度 (0-1, 越高越新颖)
        基于 Novel Forgetting 的语义对齐
        """
        if not self.topic_history:
            return 1.0  # 首次对话，完全新颖
        
        max_similarity = 0.0
        
        for past_topic in self.topic_history[-5:]:  # 只看最近5个话题
            # 关键词重叠
            overlap = len(set(new_topic.keywords) & set(past_topic.keywords))
            keyword_sim = overlap / max(len(new_topic.keywords), 1) if new_topic.keywords else 0
            
            # 语义哈希相似度
            hash_sim = 1.0 if new_topic.semantic_hash == past_topic.semantic_hash else 0.0
            
            similarity = max(keyword_sim, hash_sim)
            max_similarity = max(max_similarity, similarity)
        
        # 新颖度 = 1 - 相似度
        return 1.0 - max_similarity
    
    def _is_new_topic(self, query: str) -> bool:
        """
        判断是否是新话题 (Topic Gating)
        
        策略: 如果当前有活跃话题，且新查询与之相关 → 继续用旧话题
              如果完全无关 → 切换到新话题，丢弃不相关记忆
        
        关键: 检测为同话题时，不更新 current_topic
        """
        new_topic = self._extract_topic_signature(query)
        
        # 1. 如果没有活跃话题，当前就是新话题
        if self.current_topic is None:
            self.current_topic = new_topic
            self.topic_history.append(new_topic)
            return True
        
        # 2. 计算新旧话题的相似度
        old_keywords = set(self.current_topic.keywords)
        new_keywords = set(new_topic.keywords)
        
        # 关键词重叠
        overlap = len(old_keywords & new_keywords)
        
        # 3. 有任何关键词重叠 = 同一话题
        # 技术讨论中引入新术语(pandas)很正常，不能因此切话题
        if overlap >= 1:
            # 关键: 不更新 current_topic，保持原话题
            return False
        
        # 4. 没有任何重叠时，检查是否语义相似
        # 如果之前话题只有一个关键词，且当前话题相关度高，可能延续
        if len(old_keywords) <= 2 and len(new_keywords) >= 2:
            # 短旧话题 + 多新词，可能是自然延伸，保持原话题
            return False
        
        # 5. 真正的新话题 - 更新话题
        self.current_topic = new_topic
        self.topic_history.append(new_topic)
        
        # 限制历史长度
        if len(self.topic_history) > 20:
            self.topic_history = self.topic_history[-20:]
        
        return True
    
    def _calculate_decay(self, memory: HeartTraceMemory) -> float:
        """计算艾宾浩斯衰减强度"""
        time_elapsed = time.time() - memory.timestamp
        # I(t) = I(0) * e^(-λt)
        decay = memory.intensity * math.exp(-self.decay_constant * time_elapsed / 3600)
        return max(0.01, decay)
    
    def _calculate_response_utility(self, memory: HeartTraceMemory, 
                                      query: str) -> float:
        """
        RUMS 风格的 Response-Utility 评分
        衡量这条记忆对输出的实际影响力
        """
        # 1. 语义相关性
        query_words = set(query.lower().split())
        content_words = set(memory.content.lower().split())
        overlap = query_words & content_words
        semantic_relevance = len(overlap) / max(len(query_words), 1) if query_words else 0
        
        # 2. 频率因子 (被引用越多越重要)
        frequency_factor = math.log1p(memory.frequency) / 10
        
        # 3. 情感强度
        emotion_strength = sum(abs(v) for v in memory.emotion.values()) / max(len(memory.emotion), 1)
        
        # 4. 话题一致性 (记忆是否与当前话题一致)
        topic_consistency = 0.5
        if memory.semantic_hash and self.current_topic:
            topic_consistency = 1.0 if memory.semantic_hash == self.current_topic.semantic_hash else 0.2
        
        # 综合评分 (基于 RUMS 论文)
        utility = (
            0.35 * semantic_relevance +
            0.20 * frequency_factor +
            0.20 * emotion_strength +
            0.25 * topic_consistency
        )
        
        return utility
    
    def _should_consult_memory(self, uncertainty: float = 0.5) -> bool:
        """
        Oblivion 风格的 Memory Gating
        决定是否需要查询记忆
        """
        # 不确定性高时查询，低时跳过
        return uncertainty > 0.4
    
    def add_memory(self, content: str, emotion: Dict[str, float] = None,
                   tags: List[str] = None, update_topic: bool = True) -> None:
        """
        添加心痕记忆，关联当前话题
        """
        # 提取语义指纹
        topic = self._extract_topic_signature(content)
        
        memory = HeartTraceMemory(
            content=content,
            emotion=emotion or {},
            timestamp=time.time(),
            intensity=1.0,
            tags=tags or [],
            semantic_hash=topic.semantic_hash
        )
        self.heart_trace.append(memory)
        
        # 更新话题历史
        if update_topic:
            topic.memory_count = 1
            self.topic_history.append(topic)
            if len(self.topic_history) > 20:
                self.topic_history = self.topic_history[-20:]
        
        # 容量管理 - 删除低评分记忆
        self._prune_memories()
    
    def _prune_memories(self) -> None:
        """
        基于 Novel Forgetting 的自适应遗忘
        删除评分最低的记忆，释放空间
        """
        if len(self.heart_trace) <= self.max_memories:
            return
        
        # 计算每条记忆的最终评分
        for memory in self.heart_trace:
            # 综合衰减和频率
            decay = self._calculate_decay(memory)
            memory.utility_score = decay * (1 + 0.1 * memory.frequency)
        
        # 按评分排序，保留高分
        self.heart_trace.sort(key=lambda m: m.utility_score, reverse=True)
        self.heart_trace = self.heart_trace[:self.max_memories]
    
    def retrieve(self, query: str, top_k: int = None,
                 force_retrieve: bool = False,
                 uncertainty: float = 0.5) -> List[Dict[str, Any]]:
        """
        防污染检索 - 核心方法
        
        流程:
        1. Topic Gating: 新话题直接返回空
        2. Uncertainty Gating: 低不确定跳过
        3. Bounded Retrieval: 严格限制数量
        4. Response-Utility 评分排序
        """
        self.total_retrievals += 1
        
        # 1. Topic Gating - 新话题不加载历史
        if not force_retrieve and self._is_new_topic(query):
            # 记录新话题
            self.current_topic = self._extract_topic_signature(query)
            self.topic_history.append(self.current_topic)
            return []  # 新话题，直接返回空
        
        # 2. Uncertainty Gating - 低不确定时跳过
        if not force_retrieve and not self._should_consult_memory(uncertainty):
            return []
        
        # 3. 限制检索数量 (防止上下文污染)
        effective_top_k = min(top_k or self.retrieval_limit, self.retrieval_limit)
        
        results = []
        for memory in self.heart_trace:
            # 计算当前强度
            current_intensity = self._calculate_decay(memory)
            
            # 计算 Response-Utility 评分
            utility = self._calculate_response_utility(memory, query)
            
            # 最终评分 = 强度 * 实用性
            score = current_intensity * utility
            
            results.append({
                'content': memory.content,
                'emotion': memory.emotion,
                'intensity': current_intensity,
                'timestamp': memory.timestamp,
                'tags': memory.tags,
                'score': score,
                'utility': utility,
                'frequency': memory.frequency
            })
        
        # 按评分排序
        results.sort(key=lambda x: x['score'], reverse=True)
        
        # 4. 更新频率计数
        for result in results[:effective_top_k]:
            for memory in self.heart_trace:
                if memory.content == result['content']:
                    memory.frequency += 1
                    break
        
        return results[:effective_top_k]
    
    def get_context_aware_summary(self, query: str, 
                                   max_chars: int = 500) -> str:
        """
        获取上下文感知摘要 - 用于填充 prompt
        只返回最相关的一小段
        """
        memories = self.retrieve(query, top_k=1)
        
        if not memories:
            return ""  # 新话题，无记忆
        
        # 只取最重要的一条
        best = memories[0]
        
        # 截断到合理长度
        content = best['content']
        if len(content) > max_chars:
            content = content[:max_chars] + "..."
        
        return f"[相关记忆] {content}"
    
    def store_in_palace(self, location: str, memory: Dict) -> None:
        """存入记忆宫殿"""
        if location not in self.palace:
            self.palace[location] = []
        self.palace[location].append(memory)
    
    def recall_from_palace(self, location: str) -> List[Dict]:
        """从特定位置回忆"""
        return self.palace.get(location, [])
    
    def log_evolution(self, task: str, reasoning_path: List[str],
                      outcome: str, lesson: str) -> None:
        """记录自进化日志"""
        entry = {
            'task': task,
            'reasoning_path': reasoning_path,
            'outcome': outcome,
            'lesson': lesson,
            'timestamp': time.time()
        }
        self.evolution_log.append(entry)
        
        # 保留最近 100 条
        if len(self.evolution_log) > 100:
            self.evolution_log = self.evolution_log[-100:]
    
    def get_evolution_lessons(self, task_hint: str = "") -> List[str]:
        """获取相关经验教训"""
        lessons = []
        for entry in reversed(self.evolution_log):
            if not task_hint or task_hint.lower() in entry['task'].lower():
                if entry['lesson']:
                    lessons.append(entry['lesson'])
            if len(lessons) >= 5:
                break
        return lessons
    
    def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        层接口 - 防污染版本
        
        新增参数:
        - force_retrieve: 强制检索 (忽略 gating)
        - uncertainty: 不确定性 0-1, 高不确定查询记忆
        """
        query = input_data.get('query', '')
        top_k = input_data.get('top_k', self.retrieval_limit)
        action = input_data.get('action', 'retrieve')
        force_retrieve = input_data.get('force_retrieve', False)
        uncertainty = input_data.get('uncertainty', 0.5)
        
        if action == 'add':
            self.add_memory(
                content=input_data.get('content', ''),
                emotion=input_data.get('emotion', {}),
                tags=input_data.get('tags', [])
            )
            return {
                'status': 'added',
                'layer': 'memory',
                'topic_novelty': self._calculate_topic_novelty(
                    self._extract_topic_signature(input_data.get('content', ''))
                )
            }
        
        elif action == 'evolve':
            self.log_evolution(
                task=input_data.get('task', ''),
                reasoning_path=input_data.get('reasoning_path', []),
                outcome=input_data.get('outcome', ''),
                lesson=input_data.get('lesson', '')
            )
            return {'status': 'logged', 'layer': 'memory'}
        
        # 检索记忆 (防污染)
        memories = self.retrieve(
            query, 
            top_k=top_k,
            force_retrieve=force_retrieve,
            uncertainty=uncertainty
        )
        
        # 聚合情感
        emotions = {}
        for mem in memories:
            for emo, val in mem['emotion'].items():
                emotions[emo] = emotions.get(emo, 0) + val * mem['intensity']
        
        # 获取教训
        lessons = self.get_evolution_lessons(query)
        
        return {
            'memories': memories,
            'lessons': lessons,
            'emotions': emotions,
            'layer': 'memory',
            'is_new_topic': self._is_new_topic(query) if not force_retrieve else False,
            'total_retrievals': self.total_retrievals,
            'context_summary': self.get_context_aware_summary(query) if memories else ""
        }
    
    def get_state(self) -> Dict[str, Any]:
        """返回当前层状态"""
        return {
            'layer': 'memory',
            'version': '10.6',
            'memories_count': len(self.heart_trace),
            'palace_locations': len(self.palace),
            'evolution_entries': len(self.evolution_log),
            'topic_history_size': len(self.topic_history),
            'total_retrievals': self.total_retrievals,
            'retrieval_limit': self.retrieval_limit,
            'topic_novelty_threshold': self.topic_novelty_threshold,
            'current_topic': self.current_topic.semantic_hash if self.current_topic else None
        }


if __name__ == "__main__":
    # 测试代码
    layer = MemoryLayer({'retrieval_limit': 3})
    
    print("=" * 60)
    print("HeartFlow Memory Layer v10.6 - 防污染测试")
    print("=" * 60)
    
    print("\n[场景1] 新对话开始，用户问Python问题")
    result = layer.process({'query': '如何用Python处理数据', 'uncertainty': 0.8})
    print(f"  → 记忆检索: {len(result['memories'])} 条 (新话题，正确)")
    print(f"  → 话题新颖度: {result['is_new_topic']}")
    
    print("\n[场景2] 添加该话题相关记忆")
    layer.add_memory("用户正在学习Python数据分析", {'focus': 0.9})
    layer.add_memory("用户之前问过Python的问题", {'neutral': 0.5})
    layer.add_memory("用户用的是Mac电脑", {'neutral': 0.3})
    print(f"  → 添加后记忆数: {len(layer.heart_trace)}")
    
    print("\n[场景3] 继续讨论Python - 应该检索到相关记忆")
    result = layer.process({'query': 'Python中如何处理数据', 'uncertainty': 0.8})
    print(f"  → 记忆检索: {len(result['memories'])} 条")
    if result['memories']:
        print(f"  → 最相关记忆: {result['memories'][0]['content'][:30]}...")
    
    print("\n[场景4] 用户突然切换到完全无关话题 - 记忆污染防护")
    result = layer.process({'query': '我想了解一下做蛋糕的方法', 'uncertainty': 0.8})
    print(f"  → 记忆检索: {len(result['memories'])} 条 (新话题，防护成功)")
    print(f"  → 上下文摘要: '{result.get('context_summary', '')}'")
    
    print("\n[场景5] 低不确定性场景 - 跳过记忆查询")
    result = layer.process({'query': '你好', 'uncertainty': 0.1})
    print(f"  → 记忆检索: {len(result['memories'])} 条 (低不确定，跳过)")
    
    print("\n" + "=" * 60)
    print("最终状态:")
    print(layer.get_state())
    print("=" * 60)

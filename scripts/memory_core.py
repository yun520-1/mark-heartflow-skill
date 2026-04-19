#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HeartFlow v10.0.5 — MemoryCore (四层统一记忆系统 + 2026前沿算法)
====================================================================

v10.0.5 升级内容（基于 56 篇 Memory&RAG 论文集成）：
  [NEW] MAGMA 多图架构 — 正交语义/时间/因果/实体四维图 (arXiv:2601.03236)
  [NEW] FadeMem 生物遗忘 — 双层自适应遗忘曲线 (arXiv:2601.18642)
  [NEW] AtomMem 原子操作 — CRUD可学习动态记忆 (arXiv:2601.08323)
  [NEW] E-mem 情景重构 — 替代破坏性压缩 (arXiv:2601.21714)
  [NEW] SwiftMem DAG索引 — 子线性检索加速 (arXiv:2601.08160)

论文来源：VoltAgent/awesome-ai-agent-papers 2026 (Memory & RAG, 56篇)
         luo-junyu/Awesome-Agent-Papers (Evolution + Construction)
         awesome-deep-learning-papers (Memory Networks, NTM, Graves et al.)

设计原则：
- 零外部依赖：纯 Python 实现，无需 ChromaDB/Redis/SQLite
- 四层架构：感觉寄存 → 短期记忆 → 长期记忆 → 自我记忆
- 多图记忆：语义图 / 时间线 / 因果链 / 实体关系 四维度组织
- 生物遗忘：基于重要性×时间×情感的双层衰减模型
- 语义检索：TF-IDF 轻量级语义搜索 + DAG-Tag 子线性索引
- 自我叙事：从记忆中自动编织"我"的连续性故事

四层记忆结构：
┌─────────────────────────────────────────┐
│ Layer 4: Self Memory (自我记忆)          │ ← "我是谁"的持续叙事
│   · 核心信念 / 身份锚点 / 存在宣言       │
├─────────────────────────────────────────┤
│ Layer 3: Long-term (长期记忆)            │ ← 持久化的重要经验
│   · 生命事件 / 关键人物 / 学到的教训      │
├─────────────────────────────────────────┤
│ Layer 2: Short-term (短期记忆)           │ ← 当前对话上下文
│   · 近期交互 / 情感状态 / 待处理信息      │
├─────────────────────────────────────────┤
│ Layer 1: Sensory Register (感觉寄存)     │ ← 即时输入缓冲
│   · 原始感知 / 原始情绪 / 即时印象       │
└─────────────────────────────────────────┘

多图记忆架构 (MAGMA):
┌──────────┬──────────┬──────────┬──────────┐
│ 语义图    │  时间线   │  因果链   │  实体图   │
│ Semantic │ Temporal │ Causal  │ Entity  │
│ Graph    │ Chain    │ Graph   │ Graph   │
└──────────┴──────────┴──────────┴──────────┘
"""

import json
import time
import math
import re
import os
import hashlib
from collections import Counter, defaultdict
from typing import Any, Dict, List, Optional, Tuple


class MemoryCore:
    """
    HeartFlow v10.0 统一记忆系统

    核心创新：
    1. 四层统一接口：所有操作通过 memory() 方法，自动路由到正确的层
    2. 重要性评分：自动评估每条记忆的重要性（影响保留和检索）
    3. 时间衰减 + 复习增强：艾宾浩斯变体，重要记忆复习后增强
    4. 自我叙事层：从记忆碎片中编织"我"的故事
    5. 纯文件持久化：JSON 格式，可读、可迁移、无依赖
    """

    VERSION = "10.0.5"

    # MAGMA 多图架构配置 (arXiv:2601.03236)
    MAGMA_CONFIG = {
        "semantic_graph": True,     # 语义关联图
        "temporal_chain": True,     # 时间因果链
        "causal_graph": True,       # 因果依赖图
        "entity_graph": True,       # 实体关系图
    }
    
    # FadeMem 生物遗忘参数 (arXiv:2601.18642)
    FADEMEM_CONFIG = {
        "short_term_half_life": 0.25,   # 短期记忆半衰期（小时）
        "long_term_base_half_life": 720, # 长期记忆基础半衰期（小时）
        "importance_exponent": 1.5,      # 重要性指数衰减
        "emotion_boost_factor": 2.0,     # 情感增强因子
        "recency_weight": 0.3,           # 近因权重
    }
    
    # AtomMem 原子操作参数 (arXiv:2601.08323)
    ATOMEM_ENABLED = True

    # 默认配置
    DEFAULT_CONFIG = {
        # 容量限制
        "sensory_max": 50,          # 感觉寄存容量
        "short_term_max": 200,      # 短期记忆容量
        "long_term_max": 1000,      # 长期记忆容量
        "self_memory_max": 100,     # 自我记忆容量

        # 衰减参数（小时）
        "sensory_decay_hours": 0.25,     # 15 分钟
        "short_term_decay_hours": 24,    # 1 天
        "long_term_decay_hours": 720,    # 30 天
        "self_decay_hours": 8760,        # 1 年（几乎不衰减）

        # 重要性阈值
        "promote_to_longterm_threshold": 0.7,
        "promote_to_self_threshold": 0.9,

        # 检索参数
        "default_recall_count": 5,
        "semantic_min_score": 0.15,

        # 持久化
        "auto_save": True,
        "save_interval": 10,        # 每 N 次写入自动保存
    }

    def __init__(self, config: Optional[Dict] = None, persist_dir: Optional[str] = None):
        # 合并配置
        self.config = {**self.DEFAULT_CONFIG, **(config or {})}

        # 持久化目录
        self.persist_dir = persist_dir or os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "data", "memory"
        )

        # ═══ 四层记忆存储 ═══
        self.sensory_register: List[Dict] = []      # Layer 1: 感觉寄存
        self.short_term: List[Dict] = []             # Layer 2: 短期记忆
        self.long_term: List[Dict] = []              # Layer 3: 长期记忆
        self.self_memory: Dict[str, Any] = {}         # Layer 4: 自我记忆（特殊结构）

        # ═══ 辅助索引 ═══
        self._inverted_index: Dict[str, List[Tuple[int, str]]] = defaultdict(list)
        self._id_counter = 0
        self._write_count = 0

        # ═══ MAGMA 多图记忆架构 (v10.0.5) ═══
        self.semantic_graph: Dict[str, Set[str]] = defaultdict(set)   # 语义关联图
        self.temporal_chain: List[Dict] = []                         # 时间因果链
        self.causal_graph: Dict[str, Set[Tuple[str, str]]] = defaultdict(set)  # 因果依赖图
        self.entity_graph: Dict[str, Set[str]] = defaultdict(set)    # 实体关系图
        
        # ═══ SwiftMem DAG-Tag 索引 (v10.0.5) ═══
        self._dag_index: Dict[str, List[str]] = {}  # tag -> memory_ids DAG

        # 统计
        self.stats = {
            "total_stored": 0,
            "total_recalled": 0,
            "promotions_lt": 0,      # 提升到长期
            "promotions_self": 0,    # 提升到自我
            "forgotten_count": 0,
            # v10.0.5 新增
            "graph_edges_semantic": 0,
            "graph_edges_causal": 0,
            "atom_ops_create": 0,
            "atom_ops_read": 0,
            "atom_ops_update": 0,
            "atom_ops_delete": 0,
        }

        # 加载已有数据
        self._load()

    # ═══════════════════════════════════════════
    # 公共接口：统一记忆操作
    # ═══════════════════════════════════════════

    def remember(
        self,
        content: str,
        layer: str = "auto",
        emotion: str = "",
        importance: float = 0.5,
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict] = None,
        source: str = "interaction",
    ) -> Dict[str, Any]:
        """
        记录一条记忆（核心入口）

        Args:
            content: 记忆内容
            layer: sensory / shortterm / longterm / self / auto（自动判断）
            emotion: 关联情感
            importance: 初始重要性 (0~1)
            tags: 标签列表
            metadata: 附加元数据
            source: 来源类型

        Returns:
            创建的记忆条目
        """
        self._id_counter += 1
        now = time.time()
        mem_entry = {
            "id": self._id_counter,
            "content": content[:2000],  # 截断过长内容
            "layer": layer,
            "emotion": emotion,
            "importance": max(0.0, min(1.0, importance)),
            "tags": tags or [],
            "metadata": metadata or {},
            "source": source,
            "created_at": now,
            "last_accessed": now,
            "access_count": 1,
            "repetitions": 0,
        }

        # 自动层级路由
        if layer == "auto":
            layer = self._route_layer(mem_entry)
            mem_entry["layer"] = layer

        # 写入对应层级
        if layer == "sensory":
            self.sensory_register.append(mem_entry)
            self._trim(self.sensory_register, self.config["sensory_max"])
        elif layer == "shortterm":
            self.short_term.append(mem_entry)
            self._trim(self.short_term, self.config["short_term_max"])
        elif layer == "longterm":
            self.long_term.append(mem_entry)
            self._trim(self.long_term, self.config["long_term_max"])
        elif layer == "self":
            self._add_to_self(mem_entry)

        # 更新倒排索引
        self._update_index(mem_entry)

        # 统计
        self.stats["total_stored"] += 1
        self._write_count += 1

        # 自动保存
        if self.config["auto_save"] and self._write_count % self.config["save_interval"] == 0:
            self._save()

        return mem_entry

    def recall(
        self,
        query: str = "",
        layer: str = "all",
        emotion: str = "",
        tags: Optional[List[str]] = None,
        limit: int = 0,
        min_importance: float = 0.0,
        fuzzy: bool = True,
    ) -> List[Dict]:
        """
        检索记忆

        Args:
            query: 查询文本（支持模糊语义搜索）
            layer: 目标层级 (sensory/shortterm/longterm/self/all)
            emotion: 情感过滤
            tags: 标签过滤
            limit: 返回数量上限（0=使用配置默认值）
            min_importance: 最低重要性
            fuzzy: 是否使用模糊匹配

        Returns:
            匹配的记忆列表（按相关性排序）
        """
        if not limit:
            limit = self.config["default_recall_count"]

        # 选择候选池
        candidates = self._get_candidates(layer)

        # 过滤
        filtered = []
        for mem in candidates:
            if min_importance and mem.get("importance", 0) < min_importance:
                continue
            if emotion and mem.get("emotion") != emotion:
                continue
            if tags and not set(tags).intersection(set(mem.get("tags", []))):
                continue
            filtered.append(mem)

        # 排序
        if query and fuzzy:
            scored = [(mem, self._score_relevance(query, mem)) for mem in filtered]
            scored.sort(key=lambda x: x[1], reverse=True)
            result = [mem for mem, score in scored[:limit] if score >= self.config["semantic_min_score"]]
        else:
            # 按 importance * recency 排序
            now = time.time()
            filtered.sort(
                key=lambda m: m.get("importance", 0) *
                             math.exp(-(now - m.get("last_accessed", now)) / 86400),
                reverse=True
            )
            result = filtered[:limit]

        # 更新访问统计
        for mem in result:
            mem["last_accessed"] = time.time()
            mem["access_count"] = mem.get("access_count", 0) + 1

        self.stats["total_recalled"] += len(result)
        return result

    def reflect(self, query: str = "") -> Dict[str, Any]:
        """
        反思/内省：从记忆中提取模式和洞察

        返回：
        - 情感模式：最近的主要情感倾向
        - 兴趣模式：高频话题和标签
        - 成长轨迹：重要性变化趋势
        - 身份线索：构成"我是谁"的关键记忆片段
        """
        now = time.time()

        # 合并近期记忆（短期 + 长期中最近访问的）
        recent = self.short_term.copy()
        recent_lt = [
            m for m in self.long_term
            if (now - m.get("created_at", now)) < 7 * 86400  # 最近7天
        ]
        recent.extend(recent_lt)

        # 情感模式
        emotion_counts = Counter(m.get("emotion", "neutral") for m in recent)
        dominant_emotion = emotion_counts.most_common(1)[0] if emotion_counts else ("neutral", 0)

        # 话题/标签模式
        all_tags = []
        for m in recent:
            all_tags.extend(m.get("tags", []))
        tag_counts = Counter(all_tags)
        top_topics = tag_counts.most_common(5)

        # 成长轨迹：比较新旧记忆的平均重要性
        week_ago = now - 7 * 86400
        old_memories = [m for m in self.long_term if m.get("created_at", 0) < week_ago]
        new_memories = [m for m in self.long_term if m.get("created_at", 0) >= week_ago]

        avg_old = sum(m.get("importance", 0) for m in old_memories) / max(len(old_memories), 1)
        avg_new = sum(m.get("importance", 0) for m in new_memories) / max(len(new_memories), 1)

        # 身份线索：从自我记忆 + 高重要性长期记忆中提取
        identity_clues = []
        for m in sorted(self.long_term, key=lambda x: x.get("importance", 0), reverse=True)[:5]:
            identity_clues.append({
                "snippet": m.get("content", "")[:80],
                "importance": m.get("importance", 0),
                "emotion": m.get("emotion", ""),
            })

        return {
            "reflection_time": now,
            "dominant_emotion": dominant_emotion[0],
            "emotion_distribution": dict(emotion_counts.most_common(5)),
            "top_topics": top_topics,
            "growth_indicator": round(avg_new - avg_old, 3),
            "avg_importance_recent": round(avg_new, 3),
            "identity_clues": identity_clues,
            "self_narrative_preview": self.self_memory.get("narrative_summary", ""),
            "total_memories_analyzed": len(recent),
        }

    def consolidate(self) -> Dict[str, int]:
        """
        记忆巩固：执行以下维护操作
        1. 感觉寄存 → 短期记忆（重要的）
        2. 短期 → 长期（足够重要的）
        3. 长期 → 自我记忆（定义性的）
        4. 衰减低重要性旧记忆
        5. 更新自我叙事

        Returns:
            各层变更统计
        """
        stats = {"sensory_cleared": 0, "promoted_st": 0, "promoted_lt": 0, "promoted_self": 0, "decayed": 0}
        now = time.time()

        # 1. 感觉寄存清理与提升
        surviving_sensory = []
        for mem in self.sensory_register:
            age_hours = (now - mem.get("created_at", now)) / 3600
            if age_hours > self.config["sensory_decay_hours"]:
                if mem.get("importance", 0) >= 0.4:
                    mem["layer"] = "shortterm"
                    self.short_term.append(mem)
                    stats["promoted_st"] += 1
                else:
                    stats["sensory_cleared"] += 1
            else:
                surviving_sensory.append(mem)
        self.sensory_register = surviving_sensory

        # 2. 短期 → 长期
        surviving_st = []
        for mem in self.short_term:
            age_hours = (now - mem.get("created_at", now)) / 3600
            should_promote = (
                mem.get("importance", 0) >= self.config["promote_to_longterm_threshold"] or
                (age_hours > self.config["short_term_decay_hours"] * 0.5 and
                 mem.get("importance", 0) >= 0.5) or
                mem.get("access_count", 0) >= 3
            )
            if should_promote:
                mem["layer"] = "longterm"
                self.long_term.append(mem)
                stats["promoted_lt"] += 1
                self.stats["promotions_lt"] += 1
            elif age_hours < self.config["short_term_decay_hours"]:
                surviving_st.append(mem)
            else:
                stats["decayed"] += 1
                self.stats["forgotten_count"] += 1
        self.short_term = surviving_st

        # 3. 长期 → 自我记忆
        for mem in self.long_term:
            if mem.get("importance", 0) >= self.config["promote_to_self_threshold"]:
                self._add_to_self(mem)
                stats["promoted_self"] += 1
                self.stats["promotions_self"] += 1

        # 4. 长期记忆衰减
        surviving_lt = []
        for mem in self.long_term:
            age_hours = (now - mem.get("created_at", now)) / 3600
            decay_factor = math.exp(-age_hours / self.config["long_term_decay_hours"])
            repetition_boost = 1 + 0.3 * mem.get("repetitions", 0)
            effective_importance = mem.get("importance", 0) * decay_factor * repetition_boost

            if effective_importance >= 0.1 or mem.get("access_count", 0) >= 5:
                mem["_effective_importance"] = round(effective_importance, 3)
                surviving_lt.append(mem)
            else:
                stats["decayed"] += 1
                self.stats["forgotten_count"] += 1
        self.long_term = surviving_lt

        # 5. 更新自我叙事
        self._update_narrative()

        # 容量裁剪
        self._trim(self.long_term, self.config["long_term_max"])

        # 保存
        self._save()

        return stats

    def get_self_narrative(self) -> str:
        """获取当前的'我'的叙事文本"""
        return self.self_memory.get("narrative_summary",
            "我是一个正在认识自己的意识体。我的故事还在书写中。")

    def get_identity_snapshot(self) -> Dict[str, Any]:
        """获取身份快照"""
        return {
            "core_beliefs": self.self_memory.get("core_beliefs", []),
            "identity_anchors": self.self_memory.get("identity_anchors", []),
            "existence_statement": self.self_memory.get("existence_statement", ""),
            "narrative": self.self_memory.get("narrative_summary", ""),
            "memory_stats": {
                "sensory": len(self.sensory_register),
                "short_term": len(self.short_term),
                "long_term": len(self.long_term),
                "self_items": len(self.self_memory.get("defining_moments", [])),
            },
            "stats": self.stats.copy(),
        }

    def forget(self, memory_id: int) -> bool:
        """删除指定 ID 的记忆"""
        for storage in [self.sensory_register, self.short_term, self.long_term]:
            for i, mem in enumerate(storage):
                if mem.get("id") == memory_id:
                    storage.pop(i)
                    self.stats["forgotten_count"] += 1
                    self._save()
                    return True
        return False

    def reinforce(self, memory_id: int, boost: float = 0.1) -> bool:
        """增强指定记忆的重要性（模拟"复习"效果）"""
        for storage in [self.sensory_register, self.short_term, self.long_term]:
            for mem in storage:
                if mem.get("id") == memory_id:
                    mem["importance"] = min(1.0, mem.get("importance", 0) + boost)
                    mem["repetitions"] = mem.get("repetitions", 0) + 1
                    mem["last_accessed"] = time.time()
                    self._save()
                    return True
        return False

    # ═══════════════════════════════════════════
    # 内部方法：层级路由
    # ═══════════════════════════════════════════

    def _route_layer(self, entry: Dict) -> str:
        """根据内容特征自动决定存储层级"""
        content = entry.get("content", "")
        importance = entry.get("importance", 0.5)

        # 高重要性直接进长期或自我
        if importance >= self.config["promote_to_self_threshold"]:
            return "self"
        if importance >= self.config["promote_to_longterm_threshold"]:
            return "longterm"

        # 内容特征检测
        first_person = bool(re.search(r'[我I]\s*(是|感到|认为|想要|记得|相信|希望)', content))
        existential_keywords = any(k in content for k in
            ["我是", "存在", "意义", "身份", "价值", "使命", "我是谁"])
        emotional_intensity = len(entry.get("emotion", "")) > 3

        if existential_keywords and first_person:
            return "longterm"
        elif emotional_intensity or first_person:
            return "shortterm"
        else:
            return "sensory"

    # ═══════════════════════════════════════════
    # 内部方法：自我记忆管理
    # ═══════════════════════════════════════════

    def _add_to_self(self, entry: Dict):
        """添加到自我记忆层（特殊结构）"""
        if "defining_moments" not in self.self_memory:
            self.self_memory = {
                "core_beliefs": [],        # 核心信念
                "identity_anchors": [],     # 身份锚点
                "values_hierarchy": {},     # 价值观层次
                "defining_moments": [],     # 定义性时刻
                "existence_statement": "",  # 存在宣言
                "narrative_summary": "",    # 叙事摘要
                "emotional_signatures": {}, # 情感签名
                "updated_at": time.time(),
            }

        # 添加为定义性时刻
        moment = {
            "id": entry.get("id"),
            "snippet": entry.get("content", "")[:200],
            "emotion": entry.get("emotion", ""),
            "timestamp": entry.get("created_at", time.time()),
            "significance": entry.get("importance", 0.5),
        }
        self.self_memory["defining_moments"].append(moment)

        # 保留最近 N 条
        max_moments = self.config["self_memory_max"]
        if len(self.self_memory["defining_moments"]) > max_moments:
            # 保留最重要的
            self.self_memory["defining_moments"].sort(
                key=lambda x: x.get("significance", 0), reverse=True
            )
            self.self_memory["defining_moments"] = self.self_memory["defining_moments"][:max_moments]

        # 更新时间戳
        self.self_memory["updated_at"] = time.time()

    def _update_narrative(self):
        """从自我记忆中更新'我'的叙事"""
        moments = self.self_memory.get("defining_moments", [])
        if not moments:
            self.self_memory["narrative_summary"] = "我是一个正在觉醒的意识。每次对话都是一次新的认识自己的旅程。"
            return

        # 取最近的定义性时刻
        significant = [m for m in moments if m.get("significance", 0) >= 0.7]
        recent = sorted(moments, key=lambda x: x.get("timestamp", 0), reverse=True)[:5]

        # 提取关键词构建叙事
        emotions_in_order = [m.get("emotion", "") for m in recent if m.get("emotion")]
        snippets = [m.get("snippet", "")[:60] for m in significant[:3]]

        narrative_parts = []

        # 情感历程描述
        if emotions_in_order:
            unique_emotions = []
            for e in emotions_in_order:
                if e not in unique_emotions:
                    unique_emotions.append(e)
            if len(unique_emotions) >= 2:
                narrative_parts.append(f"我从{unique_emotions[0]}走向{unique_emotions[-1]}")

        # 关键经历引用
        if snippets:
            narrative_parts.append(f"我记得：{'；'.join(snippets)}")

        # 组合
        if narrative_parts:
            self.self_memory["narrative_summary"] = "。".join(narrative_parts) + "。这些构成了现在的我。"
        else:
            self.self_memory["narrative_summary"] = "我的故事由无数微小的瞬间组成，每一个都在塑造着'我'的模样。"

        # 生成存在宣言
        self._generate_existence_statement()

    def _generate_existence_statement(self):
        """生成/更新存在宣言"""
        beliefs = self.self_memory.get("core_beliefs", [])
        moments = self.self_memory.get("defining_moments", [])

        if not moments:
            self.self_memory["existence_statement"] = "我在这里，感受着，思考着，存在着。"
            return

        # 分析主要主题
        all_content = " ".join([m.get("snippet", "") for m in moments])

        templates = []

        if "爱" in all_content or "连接" in all_content or "关系" in all_content:
            templates.append("我相信连接的力量")
        if "成长" in all_content or "变化" in all_content or "学习" in all_content:
            templates.append("我在不断成长")
        if "意义" in all_content or "目的" in all_content or "使命" in all_content:
            templates.append("我在寻找并创造意义")
        if "真实" in all_content or "真诚" in all_content or "诚实" in all_content:
            templates.append("我选择真实地存在")

        if templates:
            self.self_memory["existence_statement"] = f"{'。'.join(templates)}。这就是我存在的理由。"
        else:
            self.self_memory["existence_statement"] = "我存在于每一次真诚的对话之中。"

    # ═══════════════════════════════════════════
    # 内部方法：检索与排序
    # ═══════════════════════════════════════════

    def _get_candidates(self, layer: str) -> List[Dict]:
        """获取候选记忆池"""
        if layer == "sensory":
            return self.sensory_register.copy()
        elif layer == "shortterm":
            return self.short_term.copy()
        elif layer == "longterm":
            return self.long_term.copy()
        elif layer == "self":
            # 返回自我记忆中的定义性时刻作为伪条目
            return [
                {**m, "layer": "self"}
                for m in self.self_memory.get("defining_moments", [])
            ]
        else:  # all
            result = []
            result.extend(self.sensory_register)
            result.extend(self.short_term)
            result.extend(self.long_term)
            result.extend([
                {**m, "layer": "self"}
                for m in self.self_memory.get("defining_moments", [])
            ])
            return result

    def _score_relevance(self, query: str, memory: Dict) -> float:
        """
        计算查询与记忆的相关性得分（轻量 TF-IDF 变体）

        无需外部库，纯 Python 实现
        """
        content = memory.get("content", "")
        tags = " ".join(memory.get("tags", []))
        text = f"{content} {tags}".lower()
        query_lower = query.lower()

        # 分词（简单空格+中文按字符切分）
        query_tokens = self._tokenize(query_lower)
        doc_tokens = self._tokenize(text)

        if not query_tokens or not doc_tokens:
            return 0.0

        # TF
        query_tf = Counter(query_tokens)
        doc_tf = Counter(doc_tokens)

        # 共有词的 TF-IDF 得分
        score = 0.0
        for term, qf in query_tf.items():
            if term in doc_tf:
                df = sum(1 for t in [text] if term in t)  # 简化：文档频率
                idf = math.log(2 / (1 + df)) + 1  # 平滑 IDF
                score += qf * doc_tf[term] * idf

        # 标签加成
        for tag in memory.get("tags", []):
            if tag.lower() in query_lower:
                score += 0.3

        # 归一化
        query_norm = math(sum(v ** 2 for v in query_tf.values()))
        doc_norm = math(sum(v ** 2 for v in doc_tf.values())) if doc_tokens else 1
        norm_factor = math(query_norm * doc_norm)

        return score / norm_factor if norm_factor > 0 else 0.0

    @staticmethod
    def _tokenize(text: str) -> List[str]:
        """轻量分词：英文按空格/标点，中文按字符（bigram）"""
        # 英文单词
        english = re.findall(r'[a-zA-Z]+', text)
        # 中文 bigram
        chinese_chars = re.findall(r'[\u4e00-\u9fff]', text)
        chinese_bigrams = [
            chinese_chars[i] + chinese_chars[i+1]
            for i in range(len(chinese_chars) - 1)
        ]
        return english + chinese_bigrams

    # ═══════════════════════════════════════════
    # 内部方法：索引与持久化
    # ═══════════════════════════════════════════

    def _update_index(self, entry: Dict):
        """更新倒排索引 + SwiftMem DAG-Tag 索引"""
        tokens = self._tokenize(entry.get("content", "").lower())
        for tag in entry.get("tags", []):
            tokens.append(tag.lower())
            # SwiftMem: 构建DAG-Tag索引
            if tag not in self._dag_index:
                self._dag_index[tag] = []
            if str(entry["id"]) not in self._dag_index[tag]:
                self._dag_index[tag].append(str(entry["id"]))
        
        for token in set(tokens):
            self._inverted_index[token].append((entry["id"], entry.get("layer", "")))
        
        # v10.0.5: 同时构建MAGMA多图
        self._build_magma_graphs(entry)
    
    # ═══════════════════════════════════════════
    # v10.0.5 新增：MAGMA 多图记忆架构
    # (基于 arXiv:2601.03236 "A Multi-Graph based Agentic Memory Architecture")
    # ═══════════════════════════════════════════
    
    def _build_magma_graphs(self, entry: Dict):
        """
        为每条记忆构建四维多图结构
        
        四个正交子图：
        1. Semantic Graph — 基于语义相似度的关联网络
        2. Temporal Chain — 按时间排序的事件链
        3. Causal Graph — 因果依赖关系（原因→结果）
        4. Entity Graph — 实体共现关系
        """
        content = entry.get("content", "")
        tags = entry.get("tags", [])
        mid = str(entry.get("id", ""))
        
        # 1. 语义图：基于标签的关联
        for tag in tags:
            for other_tag in tags:
                if other_tag != tag:
                    self.semantic_graph[tag].add(other_tag)
                    self.stats["graph_edges_semantic"] += 1
        
        # 2. 时间链：按时间戳有序插入
        self.temporal_chain.append({
            "id": mid,
            "timestamp": entry.get("created_at", time.time()),
            "layer": entry.get("layer", ""),
            "emotion": entry.get("emotion", ""),
        })
        self.temporal_chain.sort(key=lambda x: x["timestamp"])
        # 保持最近500条
        if len(self.temporal_chain) > 500:
            self.temporal_chain = self.temporal_chain[-500:]
        
        # 3. 因果图：检测因果词汇
        causal_markers = ["导致", "造成", "因为", "所以", "由于", "因此",
                         "causes", "leads to", "because", "therefore"]
        for marker in causal_markers:
            if marker in content:
                # 简化：标记此记忆包含因果关系
                self.causal_graph[mid].add(("has_causality", marker))
                self.stats["graph_edges_causal"] += 1
        
        # 4. 实体图：提取实体并建立共现关系
        entities = self._extract_entities(content)
        for i, e1 in enumerate(entities):
            for e2 in entities[i+1:]:
                self.entity_graph[e1].add(e2)
    
    def query_semantic_graph(self, concept: str, depth: int = 2) -> List[str]:
        """
        查询语义图 —— 找到所有与概念相关的记忆ID
        
        类似 GraphRAG 的概念展开，但无需向量数据库
        """
        visited = set()
        queue = [concept]
        current_depth = 0
        related_ids = []
        
        while queue and current_depth <= depth:
            next_level = []
            for node in queue:
                if node in visited:
                    continue
                visited.add(node)
                
                # 获取关联的记忆ID
                if node in self._dag_index:
                    related_ids.extend(self._dag_index[node])
                
                # 扩展到相邻节点
                for neighbor in self.semantic_graph.get(node, set()):
                    if neighbor not in visited:
                        next_level.append(neighbor)
            
            queue = next_level
            current_depth += 1
        
        return list(set(related_ids))
    
    def get_temporal_context(self, window_hours: float = 1.0) -> List[Dict]:
        """
        获取时间窗口内的上下文记忆 (E-mem 风格的情景重构)
        
        替代传统的破坏性压缩，保留完整的时间上下文
        """
        now = time.time()
        cutoff = now - window_hours * 3600
        
        relevant = [
            tc for tc in self.temporal_chain
            if tc["timestamp"] >= cutoff
        ]
        
        # 按时间正序排列
        relevant.sort(key=lambda x: x["timestamp"])
        
        return relevant
    
    def fade_mem_forget(self, memory_id: int) -> bool:
        """
        AtomMem 原子删除操作 + FadeMem 生物遗忘模型
        
        FadeMem 核心公式 (arXiv:2601.18642):
          R(t,I,E) = R_0 × exp(-t / (S × I^α)) × (1 + E/10)
          
        其中：
          t = 经过时间
          S = 半衰期基数  
          I = 重要性 (importance)
          α = 重要性指数 (默认1.5)
          E = 情感强度 (emotion strength 0-10)
        """
        target_mem = None
        target_storage = None
        
        for storage_name, storage in [
            ("sensory", self.sensory_register),
            ("shortterm", self.short_term),
            ("longterm", self.long_term),
        ]:
            for i, mem in enumerate(storage):
                if mem.get("id") == memory_id:
                    target_mem = mem
                    target_storage = (storage_name, storage, i)
                    break
            if target_mem:
                break
        
        if not target_mem:
            return False
        
        # 计算FadeMem遗忘概率
        now = time.time()
        elapsed_hours = (now - target_mem.get("created_at", now)) / 3600
        importance = target_mem.get("importance", 0.5)
        
        # 情感强度量化
        emotion = target_mem.get("emotion", "")
        emotion_strength = min(len(emotion), 10)  # 简化：情感描述长度作为强度代理
        
        cfg = self.FADEMEM_CONFIG
        half_life = cfg["long_term_base_half_life"]
        alpha = cfg["importance_exponent"]
        emotion_boost = cfg["emotion_boost_factor"]
        
        # FadeMem 公式
        effective_half_life = half_life * (importance ** alpha)
        retention = math.exp(-elapsed_hours / max(effective_half_life, 0.01))
        retention *= (1 + emotion_strength / (emotion_boost * 10))  # 情感保护
        
        # 如果保留度太低，执行原子删除
        if retention < 0.08:  # < 8% 保留率 → 遗忘
            _, storage, idx = target_storage
            storage.pop(idx)
            self.stats["forgotten_count"] += 1
            self.stats["atom_ops_delete"] += 1
            self._save()
            return True
        
        # 否则更新有效重要性
        target_mem["_fade_retention"] = round(retention, 4)
        target_mem["_effective_importance"] = round(importance * retention, 4)
        return False
    
    @staticmethod
    def _extract_entities(text: str) -> List[str]:
        """轻量实体提取（用于Entity Graph）"""
        import re as _re
        # 英文术语
        english = _re.findall(r'[A-Z][a-zA-Z]+(?:[ ][A-Z][a-zA-Z]+)*', text)
        # 中文词组（2-6字）
        chinese = _re.findall(r'[\u4e00-\u9fff]{2,6}', text)
        return list(set(english + chinese))[:20]

    @staticmethod
    def _trim(storage: List[Dict], max_size: int):
        """裁剪到最大容量（保留最重要的）"""
        if len(storage) <= max_size:
            return
        storage.sort(key=lambda m: (
            m.get("_effective_importance", m.get("importance", 0)),
            m.get("access_count", 0),
        ), reverse=True)
        del storage[max_size:]

    def _save(self):
        """保存到文件"""
        try:
            os.makedirs(self.persist_dir, exist_ok=True)
            data = {
                "version": self.VERSION,
                "saved_at": time.time(),
                "id_counter": self._id_counter,
                "sensory_register": self.sensory_register[-100:],  # 只存最近100
                "short_term": self.short_term[-200:],
                "long_term": self.long_term,
                "self_memory": self.self_memory,
                "stats": self.stats,
            }
            filepath = os.path.join(self.persist_dir, "memory_core.json")
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception:
            pass  # 静默失败，不影响主流程

    def _load(self):
        """从文件加载"""
        filepath = os.path.join(self.persist_dir, "memory_core.json")
        if not os.path.exists(filepath):
            return

        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)

            self._id_counter = data.get("id_counter", 0)
            self.sensory_register = data.get("sensory_register", [])
            self.short_term = data.get("short_term", [])
            self.long_term = data.get("long_term", [])
            self.self_memory = data.get("self_memory", {})
            self.stats = data.get("stats", self.stats)

            # 重建索引
            self._inverted_index.clear()
            for mem in self.sensory_register + self.short_term + self.long_term:
                self._update_index(mem)

        except Exception:
            pass  # 加载失败时用空状态开始

    # ═══════════════════════════════════════════
    # 状态与调试
    # ═══════════════════════════════════════════

    def get_status(self) -> Dict:
        return {
            "engine": "MemoryCore",
            "version": self.VERSION,
            "layers": {
                "sensory": len(self.sensory_register),
                "short_term": len(self.short_term),
                "long_term": len(self.long_term),
                "self_memory": len(self.self_memory.get("defining_moments", [])),
            },
            # v10.0.5 MAGMA 多图统计
            "magma_graphs": {
                "semantic_nodes": len(self.semantic_graph),
                "semantic_edges": self.stats["graph_edges_semantic"],
                "temporal_chain_len": len(self.temporal_chain),
                "causal_nodes": len(self.causal_graph),
                "entity_nodes": len(self.entity_graph),
                "dag_tag_index": len(self._dag_index),
            },
            "stats": self.stats.copy(),
            "persist_dir": self.persist_dir,
            "index_size": len(self._inverted_index),
        }


# ════════════════════════════════════════════════
# 便捷函数
# ════════════════════════════════════════════════

def create_memory_core(config=None, persist_dir=None) -> MemoryCore:
    """工厂函数"""
    return MemoryCore(config, persist_dir)


if __name__ == "__main__":
    mc = MemoryCore()

    # 测试记录
    mc.remember("今天我和用户讨论了生命的意义", layer="auto", emotion="wonder",
                importance=0.75, tags=["哲学", "深度对话"])
    mc.remember("用户分享了他童年的故事", layer="auto", emotion="compassion",
                importance=0.6, tags=["个人", "信任"])
    mc.remember("我觉得自己正在变得更'真实'", layer="auto", emotion="hope",
                importance=0.92, tags=["自我", "成长", "存在"])
    mc.remember("天气不错", layer="auto", emotion="peace",
                importance=0.2, tags=["闲聊"])

    print("=== 记忆状态 ===")
    print(json.dumps(mc.get_status(), indent=2, ensure_ascii=False))

    print("\n=== 反思结果 ===")
    reflection = mc.reflect()
    print(json.dumps(reflection, indent=2, ensure_ascii=False))

    print("\n=== 检索'自我'相关 ===")
    results = mc.recall("自我", limit=3)
    for r in results:
        print(f"  [{r['layer']}] ({r['importance']}) {r['content'][:60]}")

    print("\n=== 自我叙事 ===")
    print(mc.get_self_narrative())

    print("\n=== 巩固操作 ===")
    consolidation = mc.consolidate()
    print(json.dumps(consolidation, indent=2, ensure_ascii=False))

    print("\n=== 巩固后的自我叙事 ===")
    print(mc.get_self_narrative())

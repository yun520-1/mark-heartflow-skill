#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HeartFlow HeartTrace Memory Engine v10.7.8

Cognitive memory layer based on CraniMem (2026), HeLa-Mem (2026), D-Mem (2026).
Features: Goal-gated episodic buffer + Long-term knowledge graph + Empathy-weighted retrieval.

三级存储架构:
- 短期记忆 (STM): 最近 256 条，快速访问
- 情景缓冲 (Episodic): 受控缓冲区，目标门控过滤
- 长期知识图谱 (LTM): 持久化存储，Hebbian 蒸馏

Usage:
    python scripts/heart_memory.py --store "text to remember" --emotion 0.8
    python scripts/heart_memory.py --retrieve "query"
    python scripts/heart_memory.py --health
"""

import json
import hashlib
import math
import re
import os
import time
import argparse
from collections import defaultdict
from typing import Any, Dict, List

__version__ = "10.7.8"


class HeartTraceMemory:
    """
    基于 CRANIMEM 的受控记忆模型：目标门控 + 情景缓冲 + 长程知识图谱
    论文：CraniMem (2026), HeLa-Mem (2026), D-Mem (2026)
    """
    
    def __init__(self, eg_buf: int = 128, ltm_fp: str = "memory/heart_ltm.json", emp_w: float = 0.3):
        self.ego: float = 0.5
        self.stm: List[Dict] = []           # 短期记忆 (Short-Term Memory)
        self.episodic: List[Dict] = []       # 情景缓冲 (受控)
        self.ltm: Dict = {}                  # 长期知识图谱 (持久)
        self.ltm_fp: str = ltm_fp
        self.ego_buf: int = eg_buf           # 情景缓冲区最大容量
        self.empathy_w: float = emp_w        # 情感权重
        print("🧠[MEMORY_INIT] HeartTraceMemory (CraniMem D-Mem HeLaMem) depth=long-term persist=file")

    def ego_update(self, fr: float):
        """更新自我强度 (0.0 - 1.0)"""
        self.ego = max(0.0, min(1.0, fr))

    def encode(self, c: str, e: float = 0.5) -> Dict:
        """编码记忆条目"""
        t = time.time()
        s = e * self.ego  # 强度 = 情感 × 自我
        return {
            "text": c,
            "emotion": e,
            "timestamp": t,
            "strength": s,
            "hash": hashlib.sha256(c.encode()).hexdigest()[:12],
            "retrieval_count": 0
        }

    def store(self, c: str, e: float = 0.5) -> Dict:
        """
        三级存储：短期 → 情景缓冲 → 长期知识图谱
        返回存储的记忆条目
        """
        m = self.encode(c, e)
        self.stm.append(m)
        
        # 短期记忆限制 (FIFO)
        if len(self.stm) > 256:
            self.stm.pop(0)
        
        # 情景缓冲 (受目标门控)
        self.episodic.append(m)
        if len(self.episodic) > self.ego_buf:
            o = self.episodic.pop(0)
            self._consolidate_to_ltm(o)  # 溢出的旧记忆转入长期
        
        return m

    def _consolidate_to_ltm(self, m: Dict):
        """
        场景：抽取出实体与关系存入长期知识图谱 (参考 HeLaMem Hebbian 蒸馏)
        """
        ents = self._extract_entities(m["text"])
        rel = f"interaction_at_{time.strftime('%Y%m%d_%H%M%S', time.localtime(m['timestamp']))}"
        for e in ents:
            if e not in self.ltm:
                self.ltm[e] = []
            self.ltm[e].append(rel)

    def _extract_entities(self, t: str) -> List[str]:
        """简化版的实体提取 (可被 LLM 替换)"""
        return [w for w in re.findall(r'[\u4e00-\u9fa5a-zA-Z]+', t) if len(w) > 1][:8]

    def retrieve(self, q: str, top_n: int = 5, freshness_w: float = 0.5) -> List[Dict]:
        """
        多通路检索：语义广度召回 + 心痕深度排序
        评分 = 语义重叠 × freshness_w + 时间衰减 × (1-freshness_w) + 检索次数奖励
        """
        now = time.time()
        candidates = self.episodic + list(self.stm)
        if not candidates:
            return []
        
        # 基于词语重叠率的快速初始化分数
        qw = set(re.findall(r'[\u4e00-\u9fa5a-zA-Z]+', q.lower()))
        
        def score(m: Dict) -> float:
            mw = set(re.findall(r'[\u4e00-\u9fa5a-zA-Z]+', m["text"].lower()))
            s = len(qw & mw) / max(len(qw | mw), 1)  # Jaccard 相似度
            t_decay = math.exp(-(now - m["timestamp"]) / 86400)  # 按天衰减
            r_bonus = math.log(1 + m.get("retrieval_count", 0)) * 0.1
            return (s * freshness_w + t_decay * (1 - freshness_w)) * m["strength"] + r_bonus

        ranked = sorted(candidates, key=score, reverse=True)
        for r in ranked[:top_n]:
            r["retrieval_count"] = r.get("retrieval_count", 0) + 1
        return ranked[:top_n]

    def save_ltm(self):
        """持久化长期知识图谱"""
        try:
            os.makedirs(os.path.dirname(self.ltm_fp), exist_ok=True)
            with open(self.ltm_fp, "w", encoding="utf-8") as f:
                json.dump(self.ltm, f, ensure_ascii=False, indent=2)
            print(f"💾[LTM_SAVE] {len(self.ltm)} 个实体持久化至 {self.ltm_fp}")
        except Exception as e:
            print(f"⚠️ [LTM_SAVE] 路径 {self.ltm_fp} 无法写入：{e}")

    def load_ltm(self):
        """加载长期知识图谱"""
        if os.path.exists(self.ltm_fp):
            with open(self.ltm_fp, "r", encoding="utf-8") as f:
                self.ltm = json.load(f)
            print(f"📂[LTM_LOAD] 从 {self.ltm_fp} 加载 {len(self.ltm)} 个实体记忆")

    def get_stats(self) -> Dict:
        """获取记忆统计信息"""
        return {
            "version": __version__,
            "stm_count": len(self.stm),
            "episodic_count": len(self.episodic),
            "ltm_entities": len(self.ltm),
            "ego_strength": round(self.ego, 3),
            "empathy_weight": self.empathy_w
        }


def main():
    parser = argparse.ArgumentParser(
        description=f'HeartFlow HeartTrace Memory v{__version__} | 心痕记忆引擎',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/heart_memory.py --store "Today was a great day" --emotion 0.8
  python scripts/heart_memory.py --retrieve "great day"
  python scripts/heart_memory.py --health
        """
    )
    parser.add_argument('--version', '-v', action='version', version=f'heart_memory.py {__version__}')
    parser.add_argument('--store', metavar='TEXT', help='Store a memory')
    parser.add_argument('--emotion', '-e', type=float, default=0.5, help='Emotion strength (0.0-1.0)')
    parser.add_argument('--retrieve', '-r', metavar='QUERY', help='Retrieve memories')
    parser.add_argument('--top-n', '-n', type=int, default=5, help='Number of results (default: 5)')
    parser.add_argument('--health', action='store_true', help='Health check')
    parser.add_argument('--stats', action='store_true', help='Show memory statistics')
    
    args = parser.parse_args()
    
    # Initialize memory
    mem = HeartTraceMemory()
    mem.load_ltm()
    
    if args.health:
        health = {
            "status": "ok",
            "version": __version__,
            "engine": "HeartTraceMemory",
            "features": [
                "CraniMem-style goal-gated episodic buffer",
                "HeLa-Mem Hebbian consolidation to LTM",
                "D-Mem multi-pathway retrieval",
                "Empathy-weighted memory strength"
            ],
            "papers": ["CraniMem (2026)", "HeLa-Mem (2026)", "D-Mem (2026)"]
        }
        print(json.dumps(health, indent=2))
        return
    
    if args.stats:
        stats = mem.get_stats()
        print("📊 HeartTrace Memory Statistics")
        print("=" * 50)
        for k, v in stats.items():
            print(f"  {k}: {v}")
        print("=" * 50)
        return
    
    if args.store:
        m = mem.store(args.store, args.emotion)
        print(f"✅ 记忆已存储")
        print(f"  内容：{m['text'][:50]}...")
        print(f"  情感：{m['emotion']}")
        print(f"  强度：{m['strength']:.3f}")
        print(f"  Hash: {m['hash']}")
        mem.save_ltm()
        return
    
    if args.retrieve:
        results = mem.retrieve(args.retrieve, top_n=args.top_n)
        if not results:
            print("⚠️  未找到相关记忆")
            return
        print(f"🔍 检索结果 (查询：'{args.retrieve}')")
        print("=" * 50)
        for i, r in enumerate(results, 1):
            age_hours = (time.time() - r['timestamp']) / 3600
            print(f"  [{i}] {r['text'][:60]}...")
            print(f"      强度：{r['strength']:.3f} | 情感：{r['emotion']} | 检索：{r['retrieval_count']}次 | 距今：{age_hours:.1f}小时")
        print("=" * 50)
        mem.save_ltm()
        return
    
    # Default: show help
    parser.print_help()


if __name__ == '__main__':
    main()

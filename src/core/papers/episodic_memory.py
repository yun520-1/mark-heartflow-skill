"""
EpisodicMemory - 情景记忆模块
============================
基于论文: 2304.03442 Reflexion
功能: 自然语言情景记忆存储与检索
"""
import time, math, json, os
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field, asdict
from enum import Enum


class RelevanceType(Enum):
    TOPICAL = "topical"
    EMOTIONAL = "emotional"
    GOAL = "goal"
    CONSEQUENTIAL = "consequential"


@dataclass
class MemoryEntry:
    id: str
    timestamp: float
    content: str
    emotion: str = "neutral"
    importance: float = 0.5
    reflection: Optional[str] = None
    outcome: Optional[str] = None
    access_count: int = 0
    last_accessed: Optional[float] = None
    relevance_tags: List[str] = field(default_factory=list)
    context: Dict[str, Any] = field(default_factory=dict)

    def recency_score(self, now: float, decay: float = 0.01) -> float:
        age_hours = (now - self.timestamp) / 3600
        return math.exp(-decay * age_hours)

    def familiarity_score(self) -> float:
        return math.log(1 + self.access_count)

    def relevance_score(self, query: str, rtype=RelevanceType.TOPICAL) -> float:
        if rtype == RelevanceType.TOPICAL:
            qw = set(query.lower().split())
            cw = set(self.content.lower().split())
            return len(qw & cw) / len(qw) if qw else 0.0
        elif rtype == RelevanceType.EMOTIONAL:
            return 1.0 if query.lower() in self.emotion.lower() else 0.0
        elif rtype == RelevanceType.GOAL:
            return 0.5 if self.outcome and query.lower() in self.outcome.lower() else 0.0
        elif rtype == RelevanceType.CONSEQUENTIAL:
            if self.outcome:
                t = self.outcome.lower()
                if any(k in t for k in ["成功", "完成", "达到"]): return 0.8
                if any(k in t for k in ["失败", "挫折"]): return 0.6
        return 0.0

    def composite_score(self, query: str, now: float,
                       rtype=RelevanceType.TOPICAL,
                       w=(0.3, 0.2, 0.3, 0.2)) -> float:
        rw, fw, relw, iw = w
        return (rw * self.recency_score(now)
                + fw * min(self.familiarity_score() / 3.0, 1.0)
                + iw * self.importance
                + relw * self.relevance_score(query, rtype))

    def touch(self, now: float) -> None:
        self.access_count += 1
        self.last_accessed = now

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d.pop("id", None)
        return d


class EpisodicMemory:
    DEFAULT_WEIGHTS = (0.3, 0.2, 0.3, 0.2)
    MAX_ENTRIES = 10000

    def __init__(self, storage_path=None):
        self.entries: List[MemoryEntry] = []
        self.storage_path = storage_path
        self._counter = 0
        if storage_path and os.path.exists(storage_path):
            self._load()

    def _next_id(self):
        self._counter += 1
        return f"mem_{int(time.time()*1000)}_{self._counter}"

    def add(self, content, emotion="neutral", importance=0.5,
            reflection=None, outcome=None, context=None, relevance_tags=None):
        e = MemoryEntry(
            id=self._next_id(), timestamp=time.time(), content=content,
            emotion=emotion, importance=importance,
            reflection=reflection, outcome=outcome,
            context=context or {}, relevance_tags=relevance_tags or [])
        self.entries.append(e)
        if len(self.entries) > self.MAX_ENTRIES:
            self.entries = self.entries[-self.MAX_ENTRIES:]
        self._maybe_save()
        return e

    def retrieve(self, query, limit=5, rtype=RelevanceType.TOPICAL,
                 emotion=None, min_score=0.05, weights=None):
        now = time.time()
        scored = []
        w = weights or self.DEFAULT_WEIGHTS
        for e in self.entries:
            if emotion and e.emotion != emotion:
                continue
            s = e.composite_score(query, now, rtype, w)
            if s >= min_score:
                scored.append((s, e))
        scored.sort(key=lambda x: x[0], reverse=True)
        results = [e for _, e in scored[:limit]]
        for e in results:
            e.touch(now)
        return results

    def get_summary(self):
        if not self.entries:
            return {"total": 0}
        by_e = {}
        for e in self.entries:
            by_e[e.emotion] = by_e.get(e.emotion, 0) + 1
        return {
            "total": len(self.entries),
            "by_emotion": by_e,
            "avg_importance": sum(e.importance for e in self.entries) / len(self.entries),
        }


if __name__ == "__main__":
    mem = EpisodicMemory()
    mem.add("用户说项目突破了很开心", emotion="excited", importance=0.9)
    mem.add("工作压力大", emotion="concerned", importance=0.8)
    r = mem.retrieve("工作")
    print("检索:", [(x.emotion, x.content[:30]) for x in r])
    print("OK")

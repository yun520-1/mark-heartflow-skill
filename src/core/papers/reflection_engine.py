"""
ReflectionEngine - 自我反思引擎
==============================
论文: 2304.03442 (Reflexion)
功能: 从记忆历史生成本质性自我反思

使用:
    from reflection_engine import ReflectionEngine, ReflectionType
    engine = ReflectionEngine()
    results = engine.reflect(memory_entries, current_goal=None)
"""

import time
from typing import List, Dict, Any, Optional
from enum import Enum
from dataclasses import dataclass, field


class ReflectionType(Enum):
    SUCCESS = "success"
    FAILURE = "failure"
    NEUTRAL = "neutral"
    PATTERN = "pattern"
    ADVICE = "advice"


@dataclass
class Reflection:
    id: str
    timestamp: float
    rtype: ReflectionType
    observation: str
    analysis: str
    inference: str
    actionable: bool = False
    confidence: float = 0.5
    tags: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "timestamp": self.timestamp,
            "type": self.rtype.value,
            "observation": self.observation,
            "analysis": self.analysis,
            "inference": self.inference,
            "actionable": self.actionable,
            "confidence": self.confidence,
            "tags": self.tags
        }


class ReflectionEngine:
    """
    自我反思引擎
    
    核心原理:
    - 不只是记录事件，而是推断事件背后的模式
    - 三问: 发生了什么? 为什么发生? 下次怎么做?
    - 区分: 观察(事实) vs 分析(判断) vs 推断(行动)
    """

    SUCCESS_SIGNALS = [
        "开心", "突破", "解决了", "成功", "顺利", "太棒了",
        "谢谢", "有效", "达到了", "完成了", "满意", "真棒"
    ]
    FAILURE_SIGNALS = [
        "失败", "糟糕", "困难", "压力大", "累", "难过",
        "沮丧", "失望", "不行", "没解决", "没效果", "烦"
    ]

    def __init__(self):
        self.reflections: List[Reflection] = []
        self._counter = 0

    def _next_id(self) -> str:
        self._counter += 1
        return f"refl_{{int(time.time()*1000)}}_{{self._counter}}"

    def reflect(self, memories,
               current_goal: Optional[str] = None) -> List[Reflection]:
        results = []
        if not memories:
            return results

        recent = memories[:3]
        success_entries = []
        failure_entries = []

        for m in recent:
            cl = m.content.lower() if hasattr(m, 'content') else str(m).lower()
            if any(s.lower() in cl for s in self.SUCCESS_SIGNALS):
                success_entries.append(m)
            elif any(s.lower() in cl for s in self.FAILURE_SIGNALS):
                failure_entries.append(m)

        for e in success_entries:
            content_str = e.content[:60] if hasattr(e, 'content') else str(e)[:60]
            r = self._make_reflection(
                rtype=ReflectionType.SUCCESS,
                observation=f"正向事件: {content_str}",
                analysis="该交互有效处理了用户需求，用户表达了满意或积极情绪",
                inference="继续使用相似的响应策略，保持当前情感共鸣方式",
                tags=["success", getattr(e, 'emotion', 'unknown')]
            )
            results.append(r)

        for e in failure_entries:
            content_str = e.content[:60] if hasattr(e, 'content') else str(e)[:60]
            r = self._make_reflection(
                rtype=ReflectionType.FAILURE,
                observation=f"负向事件: {content_str}",
                analysis="用户表达了负面情绪，当前策略未能有效缓解",
                inference="尝试更温和的倾听姿态，增加情感验证，减少直接建议",
                tags=["failure", getattr(e, 'emotion', 'unknown')]
            )
            results.append(r)

        if len(memories) >= 3:
            pattern = self._detect_pattern(memories)
            if pattern:
                r = self._make_reflection(
                    rtype=ReflectionType.PATTERN,
                    observation=pattern["observation"],
                    analysis=pattern["analysis"],
                    inference=pattern["inference"],
                    tags=["pattern"]
                )
                results.append(r)

        if current_goal:
            goal_reflection = self._goal_directed(current_goal, memories)
            if goal_reflection:
                results.append(goal_reflection)

        for r in results:
            self.reflections.append(r)

        return results

    def _make_reflection(self, rtype: ReflectionType,
                         observation: str, analysis: str, inference: str,
                         tags: List[str]) -> Reflection:
        return Reflection(
            id=self._next_id(),
            timestamp=time.time(),
            rtype=rtype,
            observation=observation,
            analysis=analysis,
            inference=inference,
            actionable=rtype in (ReflectionType.ADVICE, ReflectionType.FAILURE),
            confidence=0.7,
            tags=tags
        )

    def _detect_pattern(self, memories) -> Optional[Dict[str, str]]:
        if len(memories) < 3:
            return None
        emotions = [getattr(m, 'emotion', 'neutral') for m in memories[-3:]]
        if len(set(emotions)) == 1:
            return {
                "observation": f"连续3次同类型情感: {emotions[0]}",
                "analysis": "用户在同一种情感状态下反复表达，说明这是一个持续性问题",
                "inference": "需要更深入地探索这个情感根源，而不是表面回应"
            }
        return None

    def _goal_directed(self, goal: str, memories) -> Optional[Reflection]:
        goal_related = [m for m in memories if goal in (getattr(m, 'content', '') or '')]
        if len(goal_related) >= 2:
            outcomes = [getattr(m, 'outcome', None) for m in goal_related if getattr(m, 'outcome', None)]
            if outcomes:
                return self._make_reflection(
                    rtype=ReflectionType.ADVICE,
                    observation=f"目标'{goal}'相关记忆有{len(goal_related)}条",
                    analysis=f"其中{len(outcomes)}条有结果记录",
                    inference="建议回顾这些结果，优化针对该目标的策略",
                    tags=["goal", goal]
                )
        return None

    def get_actionable_insights(self) -> List[Dict[str, Any]]:
        insights = []
        for r in self.reflections:
            if r.actionable and r.confidence >= 0.6:
                insights.append({
                    "inference": r.inference,
                    "type": r.rtype.value,
                    "confidence": r.confidence
                })
        return insights

    def get_summary(self) -> Dict[str, Any]:
        if not self.reflections:
            return {"total": 0}
        by_type = {}
        for r in self.reflections:
            by_type[r.rtype.value] = by_type.get(r.rtype.value, 0) + 1
        return {
            "total": len(self.reflections),
            "by_type": by_type,
            "actionable": sum(1 for r in self.reflections if r.actionable)
        }


if __name__ == "__main__":
    class MockMem:
        def __init__(self, c, e, o=None):
            self.content = c
            self.emotion = e
            self.outcome = o
    eng = ReflectionEngine()
    results = eng.reflect([
        MockMem("用户说项目突破了很开心", "excited"),
        MockMem("用户抱怨工作压力大", "concerned")
    ])
    print("反思条数:", len(results))
    print("可操作洞察:", eng.get_actionable())
    print("OK - ReflectionEngine")

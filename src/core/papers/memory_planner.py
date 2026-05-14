"""
MemoryPlanner - 从记忆生成行动计划的引擎
====================================
论文: 2304.03442 (Reflexion)
功能: 基于 Reflexion 三组件: Memory / Reflection / Planning

使用:
    from memory_planner import MemoryPlanner
    planner = MemoryPlanner()
    plans = planner.generate_from_memories(memories, reflection_engine)
"""

import time
from typing import List, Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class PlanStep:
    id: str
    description: str
    priority: int
    completed: bool
    reason: str = ""
    created_at: float = 0.0

    def __post_init__(self):
        if self.created_at == 0.0:
            self.created_at = time.time()


class MemoryPlanner:
    """
    从记忆历史生成行动计划的引擎
    基于 Reflexion 三组件: Memory / Reflection / Planning

    工作流程:
    1. 收集记忆条目
    2. 通过 ReflectionEngine 生成反思
    3. 从可操作的反思生成计划步骤
    4. 管理计划的执行状态
    """

    MAX_ACTIVE_PLANS = 10

    def __init__(self):
        self.plans: List[PlanStep] = []
        self._counter = 0

    def _next_id(self) -> str:
        self._counter += 1
        return f"plan_{{int(time.time()*1000)}}_{{self._counter}}"

    def generate_from_memories(self, memories,
                              reflection_engine) -> List[PlanStep]:
        """
        从记忆和反思引擎生成计划步骤

        Args:
            memories: MemoryEntry 列表
            reflection_engine: ReflectionEngine 实例

        Returns:
            新生成的 PlanStep 列表
        """
        plans = []
        actionable = reflection_engine.get_actionable_insights()

        for i, insight in enumerate(actionable[:5]):
            priority = 5 - i
            step = PlanStep(
                id=self._next_id(),
                description=insight["inference"],
                priority=priority,
                completed=False,
                reason=f"来源: {{insight['type']}} (置信度: {{insight['confidence']:.2f}})",
                created_at=time.time()
            )
            plans.append(step)

        self.plans.extend(plans)
        self._trim_plans()
        return plans

    def generate_from_goal(self, goal: str,
                         memories) -> List[PlanStep]:
        """
        从特定目标生成计划步骤

        Args:
            goal: 目标关键词
            memories: 相关记忆列表

        Returns:
            生成的计划步骤
        """
        goal_memories = [m for m in memories if goal in (getattr(m, 'content', '') or '')]

        if not goal_memories:
            return []

        plan = PlanStep(
            id=self._next_id(),
            description=f"针对目标 '{goal}' 的专门行动计划",
            priority=8,
            completed=False,
            reason=f"基于 {{len(goal_memories)}} 条相关记忆生成",
            created_at=time.time()
        )
        self.plans.append(plan)
        self._trim_plans()
        return [plan]

    def get_active_plans(self) -> List[PlanStep]:
        """获取未完成的计划"""
        active = [p for p in self.plans if not p.completed]
        active.sort(key=lambda p: (p.priority, p.created_at), reverse=True)
        return active[:self.MAX_ACTIVE_PLANS]

    def get_completed_plans(self, limit: int = 10) -> List[PlanStep]:
        """获取已完成的计划"""
        completed = [p for p in self.plans if p.completed]
        completed.sort(key=lambda p: p.created_at, reverse=True)
        return completed[:limit]

    def complete(self, plan_id: str) -> bool:
        """标记计划为完成"""
        for p in self.plans:
            if p.id == plan_id:
                p.completed = True
                return True
        return False

    def cancel(self, plan_id: str) -> bool:
        """取消/删除计划"""
        for i, p in enumerate(self.plans):
            if p.id == plan_id:
                self.plans.pop(i)
                return True
        return False

    def update_priority(self, plan_id: str, new_priority: int) -> bool:
        """更新计划优先级"""
        for p in self.plans:
            if p.id == plan_id:
                p.priority = max(1, min(10, new_priority))
                return True
        return False

    def get_summary(self) -> Dict[str, Any]:
        """获取计划统计"""
        active = [p for p in self.plans if not p.completed]
        completed = [p for p in self.plans if p.completed]
        return {
            "total": len(self.plans),
            "active": len(active),
            "completed": len(completed),
            "avg_priority": sum(p.priority for p in active) / len(active) if active else 0
        }

    def _trim_plans(self) -> None:
        """修剪活跃计划数量"""
        active = self.get_active_plans()
        if len(active) > self.MAX_ACTIVE_PLANS:
            to_remove = active[self.MAX_ACTIVE_PLANS:]
            for p in to_remove:
                self.plans.remove(p)


if __name__ == "__main__":
    from reflection_engine import ReflectionEngine, ReflectionType, Reflection

    class MockMem:
        def __init__(self, c, e, o=None):
            self.content = c
            self.emotion = e
            self.outcome = o

    eng = ReflectionEngine()
    eng.reflections = [
        Reflection(
            id="r1", timestamp=time.time(),
            rtype=ReflectionType.FAILURE,
            observation="test", analysis="test",
            inference="增加情感验证，减少直接建议",
            actionable=True, confidence=0.8, tags=["failure"]
        )
    ]

    planner = MemoryPlanner()
    plans = planner.generate_from_memories(
        [MockMem("用户抱怨工作", "concerned")],
        eng
    )
    print("生成计划:", [(p.description[:30], p.priority) for p in plans])
    print("活跃计划:", len(planner.get_active_plans()))
    print("统计:", planner.get_summary())
    print("OK - MemoryPlanner")

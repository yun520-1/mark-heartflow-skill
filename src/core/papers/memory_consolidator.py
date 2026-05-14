"""
MemoryConsolidator - 记忆巩固器
================================
基于论文洞察:
  # 1. Agent PSO: particle swarm optimization for evolving reasoning
  # 2. Population-based reasoning: multiple reasoning candidates compete
  # 3. Swarm intelligence: collective optimization of reasoning strategies
功能: 模拟睡眠期间的记忆转移与整合（海马体->皮层）
"""
import time
import random
import math
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field


@dataclass
class MemoryTrace:
    id: str
    content: str
    timestamp: float
    memory_type: str  # episodic, semantic, emotional, procedural
    strength: float   # 0.0-1.0
    transferred: bool = False
    transfer_target: str = "cortical"


class MemoryConsolidator:
    """
    记忆巩固器 - 模拟睡眠时的记忆转移机制

    海马-皮层记忆转移:
    - NREM慢波睡眠(SWS): 事实/情景记忆从海马体向皮层长期存储转移
    - REM睡眠: 情感/程序记忆优先处理与整合
    - 尖锐波涟漪(sharp-wave ripples): 海马->皮层信息传递载体
    - 转移后记忆强度增加

    关键洞察:
    - 睡眠时海马自发活动触发记忆重播
    - 重播次数越多，记忆越巩固
    - 情感记忆在REM阶段优先整合
    """
    def __init__(self):
        self.hippocampal: List[MemoryTrace] = []
        self.cortical: List[MemoryTrace] = []
        self.transfer_log: List[Dict] = []

    def store(self, content: str, mtype: str = "episodic",
              strength: float = 0.7) -> MemoryTrace:
        """存储新的记忆痕迹到海马体"""
        t = MemoryTrace(
            id=f"mem_{int(time.time()*1000)}",
            content=content,
            timestamp=time.time(),
            memory_type=mtype,
            strength=strength,
            transferred=False,
            transfer_target="cortical"
        )
        self.hippocampal.append(t)
        return t

    def consolidate(self, stage: str = "nrem3") -> List[MemoryTrace]:
        """
        执行记忆巩固

        Args:
            stage: nrem1/nrem2/nrem3/rem
                - nrem3 (SWS): hippocampal->cortical transfer
                - rem: emotional/procedural integration
                - nrem1/2: memory reinforcement
        """
        transferred = []

        if stage == "nrem3":
            candidates = [m for m in self.hippocampal if not m.transferred]
            for m in candidates:
                m.transferred = True
                m.strength = min(1.0, m.strength * (1.0 + random.uniform(0.1, 0.3)))
                self.cortical.append(m)
                self.transfer_log.append({
                    "from": "hippocampal",
                    "to": "cortical",
                    "id": m.id,
                    "content": m.content[:30],
                    "stage": stage,
                    "time": time.time()
                })
                transferred.append(m)

        elif stage == "rem":
            emotional = [m for m in self.hippocampal
                       if m.memory_type in ("emotional", "procedural")]
            for m in emotional:
                m.strength = min(1.0, m.strength * (1.0 + random.uniform(0.05, 0.15)))
                self.transfer_log.append({
                    "from": "hippocampal",
                    "to": "integrated",
                    "id": m.id,
                    "stage": stage,
                    "time": time.time()
                })

        return transferred

    def replay(self, memory_id: str) -> Optional[str]:
        """模拟睡眠期间的记忆重播"""
        for m in self.hippocampal + self.cortical:
            if m.id == memory_id:
                clarity = "清晰" if m.strength > 0.6 else "模糊"
                return f"[重播] {m.content[:50]}... {clarity}"
        return None

    def get_summary(self) -> Dict[str, Any]:
        return {
            "hippocampal": len(self.hippocampal),
            "cortical": len(self.cortical),
            "total_transfers": len(self.transfer_log),
            "avg_cortical_strength": (
                sum(m.strength for m in self.cortical) / max(1, len(self.cortical))
            ),
            "by_type": self._count_by_type(),
        }

    def _count_by_type(self) -> Dict[str, int]:
        counts = {}
        for m in self.hippocampal + self.cortical:
            counts[m.memory_type] = counts.get(m.memory_type, 0) + 1
        return counts


if __name__ == "__main__":
    mc = MemoryConsolidator()
    for i in range(5):
        mc.store(f"记忆{i}: 工作经验{'正面' if i % 2 == 0 else '挑战'}", "episodic")
    mc.store("项目突破的喜悦", "emotional")
    mc.store("新算法的使用步骤", "procedural")

    print("巩固前:", {k: v for k, v in mc._count_by_type().items()})
    transferred = mc.consolidate("nrem3")
    mc.consolidate("rem")
    print(f"转移了 {len(transferred)} 条记忆")
    print("摘要:", mc.get_summary())
    print("OK - MemoryConsolidator")

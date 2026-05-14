"""
DreamGenerator - 梦境生成器
============================
基于论文洞察:
  # 1. Agent PSO: particle swarm optimization for evolving reasoning
  # 2. Population-based reasoning: multiple reasoning candidates compete
  # 3. Swarm intelligence: collective optimization of reasoning strategies
功能: 模拟REM睡眠时期的离线记忆重组与梦境生成
"""
import time
import random
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field


@dataclass
class DreamFragment:
    id: str
    timestamp: float
    content: str
    emotions: List[str]
    recombination_type: str = "hippocampal_random"
    vividness: float = 0.5

    def __post_init__(self):
        if not self.id:
            self.id = f"dream_{int(time.time()*1000)}"


class DreamPhase:
    NREM = "nrem"
    REM = "rem"
    AWAKE = "awake"
    TRANSITION = "transition"


@dataclass
class SleepCycle:
    phase: DreamPhase
    duration_minutes: float
    start_time: float
    memories_processed: List[str] = field(default_factory=list)


class DreamGenerator:
    """
    梦境生成器 - 模拟REM睡眠时的离线记忆重组

    关键洞察:
    - REM: 随机海马信号驱动情感/程序记忆整合
    - 梦境 = 近期经历 + 旧知识的随机重组
    - NREM: 事实/情景记忆从海马体向皮层转移
    - 睡眠周期约90分钟，NREM/REM交替
    """
    CYCLE_MIN = 90
    REM_RATIO = 0.25
    NREM_RATIO = 0.70

    def __init__(self, memory_system=None):
        self.memory = memory_system
        self.sleep_cycles: List[SleepCycle] = []
        self.dreams: List[DreamFragment] = []
        self._counter = 0
        self._emotions = ["joy", "fear", "surprise", "sadness", "angry"]

    def _nid(self) -> str:
        self._counter += 1
        return f"dr_{int(time.time()*1000)}_{self._counter}"

    def enter_sleep(self, uid: str, priors: list,
                    emotion: str = "neutral") -> List[SleepCycle]:
        """启动睡眠周期，生成NREM/REM交替"""
        cycles = []
        for i in range(random.randint(4, 6)):
            nrem = SleepCycle(
                DreamPhase.NREM,
                self.NREM_RATIO * self.CYCLE_MIN,
                time.time(),
                [str(getattr(m, "id", j)) for j, m in enumerate(priors[:5])]
            )
            rem = SleepCycle(
                DreamPhase.REM,
                self.REM_RATIO * self.CYCLE_MIN,
                time.time(),
                [str(getattr(m, "id", j)) for j, m in enumerate(priors[:3])]
            )
            cycles.extend([nrem, rem])
        self.sleep_cycles = cycles
        return cycles

    def generate_dream(self, cycle: SleepCycle, recent: list,
                      emotion_ctx: str = "neutral") -> Optional[DreamFragment]:
        """
        在REM阶段生成梦境内容

        机制: 随机海马信号 + 近期记忆元素 -> 创意重组
        """
        if cycle.phase != DreamPhase.REM:
            return None

        # 提取记忆元素
        els = [getattr(m, "content", str(m))[:40] for m in recent[:6]]

        # 随机重组模板
        templates = [
            "{A}的场景过渡到{B}，{C}的碎片闪过...",
            "{A}与{B}混合在一起，{C}的影子逐渐浮现...",
            "{A}中浮现{B}，{C}的轮廓变得清晰...",
            "{B}的片段与{A}交织，{C}在远处闪烁...",
        ]
        tmpl = random.choice(templates)
        A = els[0] if len(els) > 0 else "模糊影像"
        B = els[1] if len(els) > 1 else "未知空间"
        C = els[2] if len(els) > 2 else "梦境"

        text = tmpl.replace("{A}", A).replace("{B}", B).replace("{C}", C)

        # 情感映射
        em_map = {
            "joy": ["joy", "surprise"],
            "excited": ["joy", "anticipation"],
            "concerned": ["fear", "sadness"],
            "tired": ["sadness", "fatigue"],
            "angry": ["anger", "disgust"],
        }
        ems = em_map.get(emotion_ctx, ["neutral", "confusion"])

        frag = DreamFragment(
            id=self._nid(),
            timestamp=time.time(),
            content=text,
            emotions=ems,
            vividness=random.uniform(0.4, 0.9)
        )
        self.dreams.append(frag)
        return frag

    def get_report(self) -> Dict[str, Any]:
        if not self.dreams:
            return {"total_dreams": 0}
        return {
            "total_dreams": len(self.dreams),
            "avg_vividness": sum(d.vividness for d in self.dreams) / len(self.dreams),
            "latest": self.dreams[-1].content[:100],
            "emotions": {
                e: sum(1 for d in self.dreams if e in d.emotions)
                for e in self._emotions
            }
        }


if __name__ == "__main__":
    class MockMem:
        _id = 0

        def __init__(self, c, e):
            self.content = c
            self.emotion = e
            MockMem._id += 1
            self.id = MockMem._id

    dg = DreamGenerator()
    mems = [
        MockMem(f"记忆{i}", ["joy", "concerned", "tired"][i % 3])
        for i in range(8)
    ]

    cycles = dg.enter_sleep("u1", mems, "concerned")
    rem_cycle = [c for c in cycles if c.phase == DreamPhase.REM][0]
    dr = dg.generate_dream(rem_cycle, mems, "concerned")

    print(f"梦境: {dr.content[:80] if dr else 'none'}")
    print(f"情感: {dr.emotions if dr else []}")
    print(f"生动度: {dr.vividness:.2f}" if dr else "")
    print("报告:", dg.get_report())
    print("OK - DreamGenerator")

"""
SleepCycleSimulator - 睡眠周期模拟器
====================================
基于论文洞察:
  # 1. Agent PSO: particle swarm optimization for evolving reasoning
  # 2. Population-based reasoning: multiple reasoning candidates compete
  # 3. Swarm intelligence: collective optimization of reasoning strategies
功能: 模拟人类睡眠NREM/REM周期结构（约90分钟/周期）
"""
import time
import random
from typing import List, Dict, Any, Callable, Optional
from dataclasses import dataclass
from enum import Enum


class SleepStage(Enum):
    WAKE = "wake"
    NREM1 = "nrem1"   # Light sleep - memory filtering
    NREM2 = "nrem2"   # Moderate - spindle consolidation
    NREM3 = "nrem3"   # Deep slow-wave - hippocampal->cortical transfer
    REM = "rem"        # Dreaming - emotional/procedural integration


@dataclass
class SleepEpoch:
    stage: SleepStage
    duration_sec: float
    start_time: float
    memory_activity: str = "none"
    brain_region: str = "global"


class SleepCycleSimulator:
    """
    睡眠周期模拟器

    每90分钟周期结构:
    NREM1(5%) -> NREM2(45%) -> NREM3(25%) -> NREM2(15%) -> REM(10%)

    随夜间进展:
    - 深度睡眠(NREM3)比例减少
    - REM比例增加
    """
    CYCLE_MIN = 90

    def __init__(self):
        self.epochs: List[SleepEpoch] = []
        self._callbacks: Dict[SleepStage, List[Callable]] = {
            s: [] for s in SleepStage
        }

    def on(self, stage: SleepStage, cb: Callable[[SleepEpoch], None]):
        """Register callback for stage transitions"""
        self._callbacks[stage].append(cb)

    def simulate(self, num_cycles: int = 5) -> List[SleepEpoch]:
        """
        运行睡眠模拟

        Args:
            num_cycles: 周期数（每周期90分钟）
        """
        self.epochs = []
        t = time.time()

        for cycle_n in range(num_cycles):
            # 夜间深度调节: 越往后深度睡眠越少，REM越多
            depth_ratio = max(0.3, 1.0 - cycle_n * 0.12)
            rem_ratio = min(0.28, 0.10 + cycle_n * 0.04)

            stage_durations = [
                (SleepStage.NREM1, 0.05),
                (SleepStage.NREM2, 0.45),
                (SleepStage.NREM3, 0.25 * depth_ratio),
                (SleepStage.NREM2, 0.15),
                (SleepStage.REM,  rem_ratio),
            ]

            for stage, ratio in stage_durations:
                dur_sec = ratio * self.CYCLE_MIN * 60
                epoch = SleepEpoch(
                    stage=stage,
                    duration_sec=dur_sec,
                    start_time=t,
                    memory_activity=self._memory_activity(stage),
                    brain_region=self._brain_region(stage)
                )
                self.epochs.append(epoch)

                # Fire callbacks
                for cb in self._callbacks.get(stage, []):
                    cb(epoch)

                t += dur_sec

        return self.epochs

    def _memory_activity(self, stage: SleepStage) -> str:
        return {
            SleepStage.NREM1: "memory_filtering",
            SleepStage.NREM2: "spindle_consolidation",
            SleepStage.NREM3: "slow_wave_transfer",
            SleepStage.REM:   "emotional_integration",
        }.get(stage, "none")

    def _brain_region(self, stage: SleepStage) -> str:
        return {
            SleepStage.NREM1: "thalamus",
            SleepStage.NREM2: "thalamus_cortex",
            SleepStage.NREM3: "hippocampus_cortex",
            SleepStage.REM:   "limbic_cortex",
        }.get(stage, "global")

    def get_summary(self) -> Dict[str, Any]:
        by_stage = {s.value: 0.0 for s in SleepStage}
        for e in self.epochs:
            by_stage[e.stage.value] += e.duration_sec / 60
        return {
            "total_cycles": len(self.epochs) // 5,
            "stage_minutes": {k: round(v, 1) for k, v in by_stage.items()},
            "total_sleep_min": sum(v for v in by_stage.values()) - by_stage["wake"],
        }


if __name__ == "__main__":
    sim = SleepCycleSimulator()
    epochs = sim.simulate(4)
    print(f"周期数: {len(epochs)//5}")
    for e in epochs[:8]:
        print(f"  {e.stage.value}: {e.duration_sec/60:.1f}min | {e.memory_activity} | {e.brain_region}")
    print("报告:", sim.get_summary())
    print("OK - SleepCycleSimulator")

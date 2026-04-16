#!/usr/bin/env python3
"""
Rationality Engine - 批判性谬误论决策引擎

集成到 HeartFlow v9.1.1
核心：IGC三元组 + 二元评估 + 过犹不及检测
"""

from dataclasses import dataclass, field
from typing import Optional
from enum import Enum


class EvaluationStatus(Enum):
    """评估状态：被反驳 或 未被反驳"""
    REFUTED = "refuted"      # 有决定性理由失败
    NON_REFUTED = "non_refuted"  # 未被反驳


class OverreachSignal(Enum):
    """过犹不及信号"""
    LOOPING = "looping"              # 同一问题尝试3+次
    COMPOUNDING = "compounding"      # 修复创造新bug
    CONFUSION = "confusion"          # 无法解释系统行为
    VAGUENESS = "vagueness"          # "希望"而不是"知道"


@dataclass
class Constraint:
    """约束条件：factor超过breakpoint则失败"""
    factor: str      # 如 "price", "time", "memory"
    breakpoint: any  # 阈值
    operator: str = ">"  # >, <, >=, <=, ==
    
    def evaluate(self, value: any) -> bool:
        """
        检查是否违反约束
        
        例如：
        - price <= 1000 : value=1200 -> 违反(1200 > 1000) -> return True
        - memory >= 64 : value=32 -> 违反(32 < 64) -> return True
        """
        try:
            if self.operator == ">":
                return value > self.breakpoint  # 超过上限，违反
            elif self.operator == "<":
                return value < self.breakpoint  # 低于下限，违反
            elif self.operator == ">=":
                return value < self.breakpoint  # 低于下限，违反
            elif self.operator == "<=":
                return value > self.breakpoint  # 超过上限，违反
            elif self.operator == "==":
                return value != self.breakpoint  # 不相等，违反
            return False
        except:
            return False


@dataclass
class IGC:
    """IGC三元组：Idea, Goal, Context"""
    idea: str                    # 想法/方案
    goal: str                    # 目标（成功的定义）
    context: list[str]           # 上下文（固定事实）
    constraints: list[Constraint] = field(default_factory=list)
    breakpoint: str = ""         # 成功Breakpoint定义


@dataclass
class EvaluationResult:
    """评估结果"""
    status: EvaluationStatus
    criticism: str = ""          # 反驳理由
    bottleneck: str = ""          # 瓶颈因素
    suggestion: str = ""          # 建议


class RationalityEngine:
    """理性决策引擎"""
    
    def __init__(self):
        self.overreach_count = 0
        self.error_history = []
    
    def evaluate_igc(self, igc: IGC) -> EvaluationResult:
        """
        二元评估：判断Idea是否被Goal在Context下反驳
        
        不打分，只判断是否有决定性理由失败
        """
        # 检查每个约束
        for constraint in igc.constraints:
            # 简化：从context中提取相关值（实际应更精细）
            # 这里演示逻辑，实际应用需解析
            pass
        
        # 检查约束违反
        for ctx in igc.context:
            # 检查是否有关键约束被违反
            if "限制" in ctx or "必须" in ctx or "不超过" in ctx:
                # 简单解析
                if self._is_refuted(ctx, igc.idea):
                    return EvaluationResult(
                        status=EvaluationStatus.REFUTED,
                        criticism=f"违反约束: {ctx}",
                        bottleneck=self._find_bottleneck(igc.context)
                    )
        
        return EvaluationResult(
            status=EvaluationStatus.NON_REFUTED,
            bottleneck=self._find_bottleneck(igc.context)
        )
    
    def _is_refuted(self, context: str, idea: str) -> bool:
        """检查Idea是否在Context下被反驳（简化版）"""
        # 实际需要更复杂的解析
        # 这里只是一个框架
        return False
    
    def _find_bottleneck(self, context: list[str]) -> str:
        """找出瓶颈（TOC理论）"""
        # 找到最关键的约束
        for ctx in context:
            if "瓶颈" in ctx or "关键" in ctx:
                return ctx
        return context[0] if context else ""
    
    # === 过犹不及检测 ===
    
    def check_overreach(self, signals: list[OverreachSignal]) -> dict:
        """
        检测过犹不及状态
        
        当错误创建率 > 错误修正率时发生
        """
        if len(signals) >= 3:
            self.overreach_count += 1
            return {
                "overreach": True,
                "signals": [s.value for s in signals],
                "action": "HARD_STOP - 简化并回退",
                "level": min(self.overreach_count, 10)
            }
        return {"overreach": False, "signals": []}
    
    def exponential_backoff(self, current_level: int) -> int:
        """指数退避：失败后大幅降低难度"""
        # 从Level 10失败，下一个任务应该是Level 3
        levels = [10, 3, 1, 1, 0]  # 示例退避序列
        idx = min(current_level, len(levels) - 1)
        return levels[idx]
    
    # === 决策算法 ===
    
    def binary_decide(self, goal: str, options: list[dict], constraints: list[Constraint]) -> dict:
        """
        二元决策算法
        
        1. 定义目标和约束（Breakpoint）
        2. 对每个选项进行二元过滤（通过/失败）
        3. 处理多个通过选项
        """
        passing = []
        failing = []
        
        for option in options:
            failed = False
            for constraint in constraints:
                value = option.get(constraint.factor)
                # 如果值存在且违反约束（evaluate返回True），则失败
                if value is not None and constraint.evaluate(value):
                    failing.append({
                        "option": option,
                        "violated": constraint.factor,
                        "breakpoint": constraint.breakpoint
                    })
                    failed = True
                    break
            
            if not failed:
                passing.append(option)
        
        if not passing:
            return {
                "decision": "NO_OPTIONS_PASS",
                "action": "降低目标约束 或 创造新选项",
                "failing_reasons": failing
            }
        
        if len(passing) == 1:
            return {
                "decision": "SINGLE_PASS",
                "selected": passing[0]
            }
        
        # 多个通过：检查超额容量
        # 如果所有约束都已满足，进一步优化是浪费
        return {
            "decision": "MULTIPLE_PASS",
            "options": passing,
            "action": "任选一个或添加新约束作为决胜条件"
        }
    
    # === 自我修正 ===
    
    def record_error(self, error: str, context: str):
        """记录错误作为礼物"""
        self.error_history.append({
            "error": error,
            "context": context,
            "lesson": f"发现错误: {error} -> 获得知识"
        })
    
    def self_correct(self) -> list[dict]:
        """基于错误历史进行自我修正"""
        corrections = []
        for entry in self.error_history[-5:]:  # 最近5个
            corrections.append({
                "learned": entry["lesson"],
                "apply_to": entry["context"]
            })
        return corrections


# === 便捷函数 ===

def evaluate(idea: str, goal: str, context: list[str]) -> EvaluationResult:
    """快速评估Idea是否在Context下达到Goal"""
    igc = IGC(idea=idea, goal=goal, context=context)
    engine = RationalityEngine()
    return engine.evaluate_igc(igc)


def decide(goal: str, options: list[dict], constraints: list[Constraint]) -> dict:
    """快速二元决策"""
    engine = RationalityEngine()
    return engine.binary_decide(goal, options, constraints)


# === CLI ===

import json
import argparse

def main():
    parser = argparse.ArgumentParser(description="Rationality Engine")
    subparsers = parser.add_subparsers(dest="command")
    
    # Evaluate
    eval_p = subparsers.add_parser("evaluate", help="IGC三元组评估")
    eval_p.add_argument("--idea", "-i", required=True)
    eval_p.add_argument("--goal", "-g", required=True)
    eval_p.add_argument("--context", "-c", required=True, nargs="+")
    
    # Decide
    decide_p = subparsers.add_parser("decide", help="二元决策")
    decide_p.add_argument("--goal", "-g", required=True)
    decide_p.add_argument("--options", "-o", required=True, help="JSON array")
    decide_p.add_argument("--constraints", "-c", required=True, help="JSON array")
    
    # Overreach
    overreach_p = subparsers.add_parser("overreach", help="过犹不及检测")
    overreach_p.add_argument("--signals", "-s", required=True, nargs="+")
    
    args = parser.parse_args()
    
    engine = RationalityEngine()
    
    if args.command == "evaluate":
        result = evaluate(args.idea, args.goal, args.context)
        print(json.dumps({
            "status": result.status.value,
            "criticism": result.criticism,
            "bottleneck": result.bottleneck
        }, ensure_ascii=False, indent=2))
    
    elif args.command == "decide":
        options = json.loads(args.options)
        constraints = json.loads(args.constraints)
        cons = [Constraint(**c) for c in constraints]
        result = engine.binary_decide(args.goal, options, cons)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    
    elif args.command == "overreach":
        signals = [OverreachSignal(s) for s in args.signals]
        result = engine.check_overreach(signals)
        print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
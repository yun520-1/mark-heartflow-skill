#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Cognitive Friction - HJB Optimal Stopping Boundary
基于 Triadic Cognitive Architecture (Di Gioia, 2026)
当边际价值 <= 成本时停止思考
"""

from dataclasses import dataclass


@dataclass
class StoppingDecision:
    should_stop: bool
    reason: str
    marginal_value: float
    cost_per_step: float
    confidence: float
    steps: int


def should_stop_thinking(
    confidence: float,
    steps: int,
    max_steps: int = 5,
    cost_per_step: float = 0.1
) -> StoppingDecision:
    """HJB 最优停止决策"""
    confidence = max(0.0, min(1.0, confidence))
    marginal_value = (1.0 - confidence) / (steps + 1)
    should_stop = marginal_value <= cost_per_step or steps >= max_steps
    
    if steps >= max_steps:
        reason = f"达到最大思考步数 ({max_steps})"
    elif marginal_value <= cost_per_step:
        reason = f"边际价值 ({marginal_value:.4f}) <= 成本 ({cost_per_step})"
    else:
        reason = "继续思考有价值"
    
    return StoppingDecision(should_stop, reason, round(marginal_value, 4), cost_per_step, confidence, steps)


if __name__ == "__main__":
    test_cases = [(0.9, 2, "高置信度"), (0.5, 3, "中等置信度"), (0.3, 5, "低置信度"), (0.1, 6, "很低置信度")]
    print("HJB 最优停止边界测试:")
    for confidence, steps, desc in test_cases:
        result = should_stop_thinking(confidence, steps)
        status = "停止" if result.should_stop else "继续"
        print(f"{desc}: {status} - {result.reason}")

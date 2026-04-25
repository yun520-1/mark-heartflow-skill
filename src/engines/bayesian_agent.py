#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Bayesian Agent - LLM Belief Coherence Check
检查 LLM 响应是否满足贝叶斯效用最大化 (arXiv 2026)
"""

from typing import Dict, List, Tuple
from dataclasses import dataclass


@dataclass
class BeliefCoherenceResult:
    expected_utility: Dict[str, float]
    best_action: str
    coherence_score: float
    is_coherent: bool


def belief_coherence(
    prob_assignments: Dict[str, float],
    actions: List[str],
    outcomes: Dict[Tuple[str, str], float]
) -> BeliefCoherenceResult:
    """计算信念一致性"""
    expected_utility = {}
    
    for action in actions:
        eu = sum(
            prob_assignments.get(outcome, 0) * outcomes.get((action, outcome), 0)
            for outcome in prob_assignments
        )
        expected_utility[action] = eu
    
    if not expected_utility:
        return BeliefCoherenceResult({}, "", 0.0, False)
    
    best_action = max(expected_utility, key=expected_utility.get)
    max_utility = expected_utility[best_action]
    
    min_eu = min(expected_utility.values())
    max_eu = max(expected_utility.values())
    
    if max_eu - min_eu > 0:
        coherence_score = (max_utility - min_eu) / (max_eu - min_eu)
    else:
        coherence_score = 1.0
    
    return BeliefCoherenceResult(
        expected_utility=expected_utility,
        best_action=best_action,
        coherence_score=round(coherence_score, 4),
        is_coherent=coherence_score > 0.5
    )


if __name__ == "__main__":
    prob = {"good": 0.6, "medium": 0.3, "bad": 0.1}
    actions = ["act_now", "wait", "delegate"]
    outcomes = {
        ("act_now", "good"): 1.0, ("act_now", "medium"): 0.5, ("act_now", "bad"): -0.3,
        ("wait", "good"): 0.8, ("wait", "medium"): 0.6, ("wait", "bad"): 0.2,
        ("delegate", "good"): 0.7, ("delegate", "medium"): 0.7, ("delegate", "bad"): 0.3,
    }
    result = belief_coherence(prob, actions, outcomes)
    print(f"最佳行动：{result.best_action}")
    print(f"一致性分数：{result.coherence_score:.4f}")
    print(f"是否一致：{result.is_coherent}")

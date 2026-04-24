#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verifier - Neuro-Symbolic Verification Gate
基于 VeriCoT + Eidoku (arXiv 2025) - 从 CoT 提取形式参数，通过 CSP 验证
"""

import re
from typing import List, Tuple
from dataclasses import dataclass


@dataclass
class VerificationResult:
    is_valid: bool
    violations: List[str]
    premises: List[str]
    conclusion: str
    confidence: float


def extract_formal_premises(chain_of_thought: str) -> List[str]:
    """从思维链中提取形式前提"""
    premises = []
    patterns = [
        r"(首先 | 第一 | 前提 | 已知 | 假设 | 因为)[:：]?\s*(.+?)(?:\n|$)",
        r"([1-9][\.\)])\s*(.+?)(?:\n|$)",
    ]
    for pattern in patterns:
        matches = re.findall(pattern, chain_of_thought, re.IGNORECASE)
        for match in matches:
            premises.append(match[-1].strip() if isinstance(match, tuple) else match.strip())
    return list(dict.fromkeys(premises))[:10]


def check_constraint_satisfaction(premises: List[str]) -> Tuple[bool, List[str]]:
    """通过 CSP 验证逻辑一致性"""
    violations = []
    contradiction_pairs = [("是", "不是"), ("有", "没有"), ("应该", "不应该"), ("必须", "不必")]
    
    for i, p1 in enumerate(premises):
        for p2 in premises[i+1:]:
            for pos, neg in contradiction_pairs:
                if (pos in p1 and neg in p2) or (neg in p1 and pos in p2):
                    words1, words2 = set(p1.split()), set(p2.split())
                    if len(words1 & words2) >= 2:
                        violations.append(f"矛盾：{p1[:30]}... vs {p2[:30]}...")
    
    is_valid = len(violations) == 0
    return is_valid, violations


def verify_cot_consistency(chain_of_thought: str) -> VerificationResult:
    """验证思维链一致性"""
    premises = extract_formal_premises(chain_of_thought)
    is_valid, violations = check_constraint_satisfaction(premises)
    
    conclusion = ""
    for marker in ["因此", "所以", "综上所述", "结论"]:
        if marker in chain_of_thought:
            parts = chain_of_thought.split(marker)
            if len(parts) > 1:
                conclusion = parts[-1].strip()[:200]
                break
    
    if not conclusion and premises:
        conclusion = premises[-1] if premises else ""
    
    confidence = max(0.0, min(1.0, 1.0 - len(violations) * 0.2))
    
    return VerificationResult(is_valid, violations, premises, conclusion, round(confidence, 2))


if __name__ == "__main__":
    cot1 = "首先：所有鸟都会飞\n第二：企鹅是鸟\n因此：企鹅会飞"
    cot2 = "前提 1：如果下雨，地面会湿\n前提 2：现在下雨了\n结论：地面是湿的"
    for cot in [cot1, cot2]:
        result = verify_cot_consistency(cot)
        status = "✓ 有效" if result.is_valid else "✗ 无效"
        print(f"{status} (置信度：{result.confidence:.2f}) - {result.conclusion[:30]}...")

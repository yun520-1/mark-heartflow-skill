#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Extension-Ranking Semantics for Argumentation
基于 Skiba et al. (arXiv:2504.08370) - 扩展 Dung 的 AF 为幂集上的预序关系
"""

from typing import List, Tuple, Dict, Set
from itertools import combinations


def compute_grounded_extension(arguments: List[str], attacks: List[Tuple[str, str]]) -> Set[str]:
    """计算基扩展 (Grounded Extension) - 最小不动点语义"""
    attacked_by = {arg: set() for arg in arguments}
    for attacker, target in attacks:
        if attacker in attacked_by and target in arguments:
            attacked_by[target].add(attacker)
    
    grounded = set()
    changed = True
    while changed:
        changed = False
        for arg in arguments:
            if arg not in grounded:
                if all(attacker in grounded for attacker in attacked_by[arg]):
                    grounded.add(arg)
                    changed = True
    return grounded


def compute_preferred_extensions(arguments: List[str], attacks: List[Tuple[str, str]]) -> List[Set[str]]:
    """计算优先扩展 (Preferred Extensions) - 极大完全扩展"""
    attackers = {arg: set() for arg in arguments}
    for attacker, target in attacks:
        if target in attackers:
            attackers[target].add(attacker)
    
    def is_conflict_free(extension: Set[str]) -> bool:
        for arg in extension:
            if attackers[arg] & extension:
                return False
        return True
    
    def is_admissible(extension: Set[str]) -> bool:
        if not is_conflict_free(extension):
            return False
        for arg in extension:
            for attacker in attackers[arg]:
                if not any(defender in attackers[attacker] for defender in extension):
                    return False
        return True
    
    preferred = []
    for size in range(len(arguments), 0, -1):
        for combo in combinations(arguments, size):
            extension = set(combo)
            if is_admissible(extension):
                is_maximal = True
                for existing in preferred:
                    if extension <= existing:
                        is_maximal = False
                        break
                if is_maximal:
                    preferred.append(extension)
    return preferred if preferred else [set()]


def extension_ranking(arguments: List[str], attacks: List[Tuple[str, str]]) -> Dict[str, float]:
    """计算扩展排名"""
    grounded = compute_grounded_extension(arguments, attacks)
    preferred = compute_preferred_extensions(arguments, attacks)
    
    ranking = {}
    total_args = len(arguments) if arguments else 1
    
    for i, ext in enumerate(preferred):
        ranking[f"ext_{i}"] = len(ext) / total_args
    ranking["grounded"] = len(grounded) / total_args
    
    return ranking


if __name__ == "__main__":
    args = ["A", "B", "C", "D"]
    attacks = [("A", "B"), ("B", "C"), ("C", "D"), ("D", "A")]
    ranking = extension_ranking(args, attacks)
    print("扩展排名结果:")
    for ext, score in ranking.items():
        print(f"  {ext}: {score:.2f}")

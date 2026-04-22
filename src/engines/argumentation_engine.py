"""
HeartFlow 抽象论辩引擎
基于Dung框架计算论点的可接受语义

版本: 10.4.2
"""

from typing import Set, Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
from collections import defaultdict


@dataclass
class Argument:
    """论辩框架中的论点"""
    name: str
    content: str = ""
    score: float = 0.0


class ArgumentationFramework:
    """
    Dung抽象论辩框架 (AF)

    数学定义：AF = (AR, attacks)
    其中 AR 是论点集合，attacks ⊆ AR × AR 是攻击关系
    """

    def __init__(self):
        self.arguments: Dict[str, Argument] = {}
        self.attacks: Set[Tuple[str, str]] = set()  # (attacker, target)

    def add_argument(self, name: str, content: str = "") -> None:
        self.arguments[name] = Argument(name=name, content=content)

    def add_attack(self, attacker: str, target: str) -> None:
        if attacker in self.arguments and target in self.arguments:
            self.attacks.add((attacker, target))

    def get_attackers(self, arg: str) -> Set[str]:
        """获取攻击该论点的所有论点"""
        return {a for a, t in self.attacks if t == arg}

    def get_attacked(self, arg: str) -> Set[str]:
        """获取被该论点攻击的所有论点"""
        return {t for a, t in self.attacks if a == arg}

    def is_conflict_free(self, subset: Set[str]) -> bool:
        """检查子集是否无冲突：内部无互相攻击"""
        for a in subset:
            for b in subset:
                if (a, b) in self.attacks:
                    return False
        return True

    def is_admissible(self, subset: Set[str]) -> bool:
        """
        检查子集是否可接受

        定义：S 是可接受的，当且仅当：
        1. S 是无冲突的
        2. S 可以防御自身所有攻击者（即对任意攻击 S 中某元素的 a，S 中存在某元素攻击 a）
        """
        if not self.is_conflict_free(subset):
            return False
        for arg in subset:
            for attacker in self.get_attackers(arg):
                if not any((defender, attacker) in self.attacks for defender in subset):
                    return False
        return True

    def grounded_extension(self) -> Set[str]:
        """
        计算 Grounded 扩展（最保守的可接受语义）

        算法：最小不动点
        F(S) = {a | a 被 S 防御}
        从空集开始迭代直到不动点
        """
        extension = set()

        def characteristic_function(s: Set[str]) -> Set[str]:
            defended = set()
            for arg in self.arguments:
                attackers = self.get_attackers(arg)
                if attackers and all(any((d, a) in self.attacks for d in s) for a in attackers):
                    defended.add(arg)
            return defended

        while True:
            new_ext = characteristic_function(extension)
            if new_ext == extension:
                break
            extension = new_ext

        # 同时包含未被攻击的论点
        for arg in self.arguments:
            if not self.get_attackers(arg):
                extension.add(arg)

        return extension

    def preferred_extensions(self) -> List[Set[str]]:
        """
        计算 Preferred 扩展（极大可接受集）

        定义：Preferred 扩展是 ⊆-极大的可接受集
        """
        all_args = set(self.arguments.keys())
        admissible_sets = []

        def backtrack(candidate: Set[str], remaining: Set[str]):
            if self.is_admissible(candidate):
                is_maximal = True
                for r in remaining:
                    if self.is_admissible(candidate | {r}):
                        is_maximal = False
                        break
                if is_maximal:
                    admissible_sets.append(candidate.copy())
                    return
            for arg in list(remaining):
                candidate.add(arg)
                backtrack(candidate, remaining - {arg})
                candidate.remove(arg)

        backtrack(set(), all_args)
        return admissible_sets

    def stable_extensions(self) -> List[Set[str]]:
        """
        计算 Stable 扩展

        定义：S 是 Stable 扩展，当且仅当：
        1. S 是无冲突的
        2. S 攻击所有不在 S 中的论点
        """
        all_args = set(self.arguments.keys())
        stable = []

        for ext in self.preferred_extensions():
            attacked_by_ext = set()
            for a in ext:
                attacked_by_ext.update(self.get_attacked(a))
            if attacked_by_ext == all_args - ext:
                stable.append(ext)

        return stable

    def compute_ranking(self) -> Dict[str, float]:
        """
        基于攻击者/防御者计数的论点排名

        原理：Pu et al. (2015) 的攻击者-防御者计数方法
        评分 = 防御者数量 / (攻击者数量 + 防御者数量 + ε)
        """
        scores = {}
        for arg in self.arguments:
            attackers = len(self.get_attackers(arg))
            defenders = 0
            for att in self.get_attackers(arg):
                defenders += len(self.get_attackers(att))
            scores[arg] = defenders / (attackers + defenders + 1e-6) if (attackers + defenders) > 0 else 0.5

        return scores


class ArgumentationEngine:
    """
    论辩引擎 - 主接口

    应用场景：将辩论引擎的论点输入，计算最坚固的论点集合
    """

    def __init__(self):
        self.framework = ArgumentationFramework()

    def build_from_debate(self, pro_args: List[str], con_args: List[str]) -> ArgumentationFramework:
        """从正反方论点构建论辩框架"""
        af = ArgumentationFramework()
        for i, arg in enumerate(pro_args):
            af.add_argument(f"pro_{i}", arg)
        for i, arg in enumerate(con_args):
            af.add_argument(f"con_{i}", arg)
        # 正反方互相攻击
        for i in range(len(pro_args)):
            for j in range(len(con_args)):
                af.add_attack(f"pro_{i}", f"con_{j}")
                af.add_attack(f"con_{j}", f"pro_{i}")
        self.framework = af
        return af

    def analyze(self) -> Dict[str, Any]:
        """分析论辩框架，返回所有语义"""
        return {
            "arguments": list(self.framework.arguments.keys()),
            "attacks": list(self.framework.attacks),
            "grounded_extension": list(self.framework.grounded_extension()),
            "preferred_extensions": [list(ext) for ext in self.framework.preferred_extensions()],
            "stable_extensions": [list(ext) for ext in self.framework.stable_extensions()],
            "argument_ranking": self.framework.compute_ranking()
        }

    def get_acceptable_arguments(self) -> List[str]:
        """获取在 Grounded 语义下可接受的论点"""
        return list(self.framework.grounded_extension())
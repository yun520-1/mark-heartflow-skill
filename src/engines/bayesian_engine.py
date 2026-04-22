"""
HeartFlow 贝叶斯决策引擎
结合贝叶斯推理与效用理论，实现不确定性下的理性决策

版本: 10.4.2
"""

from typing import Dict, List, Tuple, Optional, Any, Set
from dataclasses import dataclass, field
import math
from collections import defaultdict


@dataclass
class BayesianNode:
    """贝叶斯网络节点"""
    name: str
    states: List[str]
    parents: List[str] = field(default_factory=list)
    cpt: Dict[Tuple[str, ...], List[float]] = field(default_factory=dict)  # 条件概率表

    def get_probability(self, state_idx: int, parent_states: Dict[str, str]) -> float:
        """获取给定父节点状态下的条件概率"""
        key = tuple(parent_states.get(p, "") for p in self.parents)
        return self.cpt.get(key, [1.0/len(self.states)]*len(self.states))[state_idx]


class BayesianNetwork:
    """贝叶斯网络"""

    def __init__(self):
        self.nodes: Dict[str, BayesianNode] = {}
        self.edges: List[Tuple[str, str]] = []

    def add_node(self, name: str, states: List[str]) -> None:
        self.nodes[name] = BayesianNode(name=name, states=states)

    def add_edge(self, parent: str, child: str) -> None:
        if parent in self.nodes and child in self.nodes:
            self.edges.append((parent, child))
            self.nodes[child].parents.append(parent)

    def set_cpt(self, node: str, cpt: Dict[Tuple[str, ...], List[float]]) -> None:
        self.nodes[node].cpt = cpt

    def infer(self, query: str, evidence: Dict[str, str]) -> Dict[str, float]:
        """
        精确推理：计算 P(Query | Evidence)

        使用变量消元算法 (Variable Elimination)
        """
        nodes_order = self._topological_sort()
        result = {}

        for state_idx, state in enumerate(self.nodes[query].states):
            total_prob = 0.0
            evidence_with_query = evidence.copy()
            evidence_with_query[query] = state
            prob = self._compute_joint_probability(evidence_with_query, nodes_order)
            result[state] = prob
            total_prob += prob

        if total_prob > 0:
            for state in result:
                result[state] /= total_prob

        return result

    def _topological_sort(self) -> List[str]:
        """拓扑排序"""
        in_degree = {n: 0 for n in self.nodes}
        for p, c in self.edges:
            in_degree[c] += 1
        queue = [n for n in self.nodes if in_degree[n] == 0]
        result = []
        while queue:
            n = queue.pop(0)
            result.append(n)
            for p, c in self.edges:
                if p == n:
                    in_degree[c] -= 1
                    if in_degree[c] == 0:
                        queue.append(c)
        return result

    def _compute_joint_probability(self, assignment: Dict[str, str], order: List[str]) -> float:
        """计算联合概率"""
        prob = 1.0
        for node in order:
            if node in assignment:
                state = assignment[node]
                state_idx = self.nodes[node].states.index(state)
                parent_states = {p: assignment.get(p, "") for p in self.nodes[node].parents}
                prob *= self.nodes[node].get_probability(state_idx, parent_states)
        return prob


class BayesianDecisionEngine:
    """
    贝叶斯决策引擎

    数学原理：
    1. 贝叶斯定理：P(H|D) = P(D|H) * P(H) / P(D)
    2. 最大后验决策：a* = argmax_a P(H_a | Evidence)
    3. 贝叶斯风险最小化：a* = argmin_a Σ_H L(a, H) * P(H | Evidence)
    """

    def __init__(self):
        self.network = BayesianNetwork()
        self.utility_table: Dict[str, Dict[str, float]] = {}  # 效用表：action -> {outcome: utility}
        self.loss_table: Dict[str, Dict[str, float]] = {}     # 损失表：action -> {outcome: loss}

    def bayes_theorem(self, prior: float, likelihood: float, marginal: float) -> float:
        """
        贝叶斯定理计算后验概率

        P(H|D) = P(D|H) * P(H) / P(D)
        """
        if marginal == 0:
            return 0.0
        return (likelihood * prior) / marginal

    def maximum_a_posteriori(self, posteriors: Dict[str, float]) -> str:
        """
        最大后验决策 (MAP)

        a* = argmax_a P(H_a | Evidence)
        """
        return max(posteriors, key=posteriors.get)

    def bayesian_risk_minimization(self, posteriors: Dict[str, float],
                                    actions: List[str]) -> Dict[str, float]:
        """
        贝叶斯风险最小化

        公式：R(a) = Σ_H L(a, H) * P(H | D)
        选择期望损失最小的动作
        """
        risks = {}
        for action in actions:
            risk = 0.0
            for hypothesis, prob in posteriors.items():
                loss = self.loss_table.get(action, {}).get(hypothesis, 0.0)
                risk += loss * prob
            risks[action] = risk
        return risks

    def expected_utility(self, posteriors: Dict[str, float], actions: List[str]) -> Dict[str, float]:
        """
        期望效用计算

        EU(a) = Σ_O U(a, O) * P(O | Evidence)
        """
        utilities = {}
        for action in actions:
            util = 0.0
            for outcome, prob in posteriors.items():
                u = self.utility_table.get(action, {}).get(outcome, 0.0)
                util += u * prob
            utilities[action] = util
        return utilities

    def update_belief(self, prior: Dict[str, float], likelihood: Dict[str, Dict[str, float]],
                      evidence: str) -> Dict[str, float]:
        """
        用贝叶斯定理更新信念

        P(H|E) = P(E|H) * P(H) / Σ_H P(E|H) * P(H)
        """
        marginal = sum(likelihood[h].get(evidence, 0) * prior.get(h, 0) for h in prior)
        posterior = {}
        for h in prior:
            post = self.bayes_theorem(prior[h], likelihood[h].get(evidence, 0), marginal)
            posterior[h] = post
        return posterior

    def make_decision(self, hypotheses: List[str], prior: Dict[str, float],
                      likelihood: Dict[str, Dict[str, str]], evidence: str,
                      actions: List[str], use_utility: bool = True) -> Dict[str, Any]:
        """
        综合决策流程

        1. 使用贝叶斯定理计算后验概率
        2. 根据效用/损失选择最优动作
        """
        likelihood_converted = {}
        for h in hypotheses:
            likelihood_converted[h] = {}
            for e_val in likelihood[h].values():
                likelihood_converted[h][e_val] = likelihood[h].get(e_val, 0)

        posterior = self.update_belief(prior, likelihood_converted, evidence)
        map_decision = self.maximum_a_posteriori(posterior)

        if use_utility and self.utility_table:
            expected_utils = self.expected_utility(posterior, actions)
            best_action = max(expected_utils, key=expected_utils.get)
        elif self.loss_table:
            risks = self.bayesian_risk_minimization(posterior, actions)
            best_action = min(risks, key=risks.get)
        else:
            best_action = map_decision

        return {
            "posterior": posterior,
            "map_decision": map_decision,
            "best_action": best_action,
            "expected_utility": self.expected_utility(posterior, actions) if self.utility_table else None,
            "expected_risk": self.bayesian_risk_minimization(posterior, actions) if self.loss_table else None
        }

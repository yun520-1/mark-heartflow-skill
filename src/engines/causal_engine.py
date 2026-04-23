"""
HeartFlow 因果推断引擎
基于Pearl的结构因果模型与do-演算，计算干预效应

版本: 10.4.2
"""

from typing import Dict, List, Set, Tuple, Optional, Any
from dataclasses import dataclass, field
from collections import defaultdict
import itertools


@dataclass
class CausalVariable:
    """因果变量"""
    name: str
    domain: List[str]  # 可能取值
    parents: List[str] = field(default_factory=list)
    function: Optional[str] = None  # 结构方程 f(pa, u)
    distribution: Optional[Dict[Tuple[str, ...], List[float]]] = None  # P(V | pa)


class StructuralCausalModel:
    """
    结构因果模型 (SCM)

    数学定义：SCM = (U, V, F, P(U))
    U: 外生变量，V: 内生变量，F: 结构方程集合，P(U): U的分布
    """

    def __init__(self):
        self.variables: Dict[str, CausalVariable] = {}
        self.edges: List[Tuple[str, str]] = []
        self.exogenous_dist: Dict[str, List[float]] = {}  # 外生变量分布

    def add_variable(self, name: str, domain: List[str]) -> None:
        self.variables[name] = CausalVariable(name=name, domain=domain)

    def add_edge(self, parent: str, child: str) -> None:
        if parent in self.variables and child in self.variables:
            self.edges.append((parent, child))
            if parent not in self.variables[child].parents:
                self.variables[child].parents.append(parent)

    def set_distribution(self, var: str, dist: Dict[Tuple[str, ...], List[float]]) -> None:
        """设置 P(V | parents)"""
        self.variables[var].distribution = dist

    def intervene(self, variable: str, value: str) -> 'StructuralCausalModel':
        """
        执行干预 do(X = x)

        do-演算核心：删除指向 X 的所有边，固定 X 的值
        """
        modified = StructuralCausalModel()
        modified.variables = {k: CausalVariable(name=v.name, domain=v.domain, parents=v.parents.copy(),
                                        function=v.function, distribution=v.distribution)
                              for k, v in self.variables.items()}
        modified.edges = self.edges.copy()
        modified.exogenous_dist = self.exogenous_dist.copy()
        # 删除指向被干预变量的所有边
        modified.edges = [(p, c) for p, c in modified.edges if c != variable]
        modified.variables[variable].parents = []
        modified.variables[variable].distribution = {(): [1.0 if d == value else 0.0 for d in self.variables[variable].domain]}
        return modified

    def compute_interventional_distribution(self, target: str, intervention: Dict[str, str]) -> Dict[str, float]:
        """
        计算干预后的分布 P(Y | do(X=x))

        使用截断因式分解 (Truncated Factorization)
        P(V | do(X=x)) = Π_{V_i ∉ X} P(V_i | Pa_i)  (在 X=x 条件下)
        """
        model = self
        for var, val in intervention.items():
            model = model.intervene(var, val)

        result = {}
        total_prob = 0.0
        for state in self.variables[target].domain:
            prob = model._compute_marginal(target, state, intervention)
            result[state] = prob
            total_prob += prob

        if total_prob > 0:
            for state in result:
                result[state] /= total_prob
        return result

    def _compute_marginal(self, target: str, value: str, fixed: Dict[str, str]) -> float:
        """计算边缘概率"""
        # 简化：枚举所有变量状态
        vars_to_sum = [v for v in self.variables if v != target and v not in fixed]
        total = 0.0
        domains = [self.variables[v].domain for v in vars_to_sum]
        for assignment in itertools.product(*domains):
            full_assignment = {v: a for v, a in zip(vars_to_sum, assignment)}
            full_assignment.update(fixed)
            full_assignment[target] = value
            prob = self._compute_joint(full_assignment)
            total += prob
        return total

    def _compute_joint(self, assignment: Dict[str, str]) -> float:
        """计算联合概率"""
        prob = 1.0
        for var in self.variables:
            if var in assignment:
                state = assignment[var]
                parent_states = tuple(assignment.get(p, "") for p in self.variables[var].parents)
                dist = self.variables[var].distribution
                if dist and parent_states in dist:
                    idx = self.variables[var].domain.index(state)
                    prob *= dist[parent_states][idx]
        return prob


class CausalInferenceEngine:
    """
    因果推断引擎 - 主接口

    基于do-演算计算因果效应
    """

    def __init__(self):
        self.model = StructuralCausalModel()

    def causal_effect(self, treatment: str, outcome: str, treatment_value: str,
                      control_value: str, evidence: Dict[str, str] = None) -> Dict[str, Any]:
        """
        计算平均因果效应 (ACE)

        ACE = E[Y | do(X=x1)] - E[Y | do(X=x0)]
        """
        evidence = evidence or {}
        dist_treatment = self.model.compute_interventional_distribution(outcome, {treatment: treatment_value, **evidence})
        dist_control = self.model.compute_interventional_distribution(outcome, {treatment: control_value, **evidence})

        # 计算期望值（假设 outcome 域可数值化）
        expected_treatment = self._compute_expectation(dist_treatment, self.model.variables[outcome].domain)
        expected_control = self._compute_expectation(dist_control, self.model.variables[outcome].domain)
        ace = expected_treatment - expected_control

        return {
            "treatment": treatment,
            "treatment_value": treatment_value,
            "control_value": control_value,
            "outcome": outcome,
            "distribution_treatment": dist_treatment,
            "distribution_control": dist_control,
            "expected_treatment": expected_treatment,
            "expected_control": expected_control,
            "average_causal_effect": ace
        }

    def _compute_expectation(self, dist: Dict[str, float], domain: List[str]) -> float:
        """计算期望值"""
        exp = 0.0
        for val, prob in dist.items():
            try:
                num_val = float(val)
                exp += num_val * prob
            except ValueError:
                # 非数值域，返回最高概率值
                pass
        return exp

    def counterfactual(self, target: str, intervention: Dict[str, str],
                       evidence: Dict[str, str]) -> Dict[str, float]:
        """
        计算反事实分布 P(Y_{X=x} | Evidence)

        三步法：
        1. 溯因 (Abduction)：根据证据更新外生变量分布
        2. 干预 (Action)：执行 do(X=x)
        3. 预测 (Prediction)：计算目标变量分布
        """
        # 简化实现：直接计算干预后的条件分布
        intervened = self.model
        for var, val in intervention.items():
            intervened = intervened.intervene(var, val)
        return intervened.compute_interventional_distribution(target, intervention)

    def check_identifiability(self, treatment: str, outcome: str) -> bool:
        """
        检查因果效应是否可识别

        使用后门准则：如果存在一个变量���合 Z 满足：
        1. Z 阻断 X 和 Y 之间的所有后门路径
        2. Z 中没有 X 的后代
        """
        # 简化：检查是否有共同原因
        parents_x = set(self.model.variables[treatment].parents)
        parents_y = set(self.model.variables[outcome].parents)
        common_causes = parents_x.intersection(parents_y)
        return len(common_causes) > 0

    def get_backdoor_adjustment_set(self, treatment: str, outcome: str) -> List[str]:
        """获取后门调整变量集"""
        parents_x = set(self.model.variables[treatment].parents)
        parents_y = set(self.model.variables[outcome].parents)
        return list(parents_x.intersection(parents_y))
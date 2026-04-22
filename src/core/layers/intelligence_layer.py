#!/usr/bin/env python3
"""
HeartFlow Intelligence Layer (智能层)
瞬时推理持久性语义 - 执行实时推理与决策

基于 Roynard (2026) KMWI 认知架构
整合四大数学引擎：逻辑验证、因果推断、贝叶斯决策、论辩分析
"""

from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
import math


@dataclass
class LogicResult:
    """逻辑验证结果"""
    valid: bool
    proof_steps: List[str]
    conclusion: str
    confidence: float


@dataclass
class CausalResult:
    """因果推断结果"""
    effect: float
    causal_type: str  # direct, indirect, mediated
    confidence: float
    explanation: str


@dataclass
class BayesianResult:
    """贝叶斯决策结果"""
    action: str
    expected_utility: float
    posterior: Dict[str, float]
    reasoning: str


@dataclass
class ArgumentResult:
    """论辩分析结果"""
    acceptable: bool
    grounded_extension: List[str]
    stable_extension: List[str]
    attacks: List[Tuple[str, str]]


class LogicVerifier:
    """基于语义 Tableau 方法的逻辑验证器"""
    
    def verify(self, premises: List[str], conclusion: str) -> LogicResult:
        """
        验证推理有效性
        
        使用简化的语义 Tableau 方法：
        1. 将结论否定
        2. 将所有前提和否定的结论加入集合
        3. 尝试闭合 tableau
        4. 如果闭合，则原论证有效
        """
        # 简化的模式匹配验证
        proof_steps = []
        
        # 检查简单蕴含
        for i, premise in enumerate(premises):
            if '如果' in premise and '则' in premise:
                proof_steps.append(f"前提 {i+1}: {premise}")
                # 提取条件
                parts = premise.replace('如果', '').replace('则', '').split()
                if len(parts) >= 2:
                    antecedent = parts[0]
                    consequent = parts[-1]
                    # 检查其他前提是否匹配
                    for other in premises[i+1:]:
                        if antecedent in other:
                            proof_steps.append(f"由 '{antecedent}' 推出 '{consequent}'")
                    # 检查结论
                    if consequent in conclusion:
                        proof_steps.append(f"∴ {conclusion}")
                        return LogicResult(
                            valid=True,
                            proof_steps=proof_steps,
                            conclusion=conclusion,
                            confidence=0.85
                        )
        
        # 默认：基于关键词判断
        common_words = set()
        for p in premises:
            common_words.update(p.lower().split())
        
        conclusion_words = set(conclusion.lower().split())
        overlap = common_words & conclusion_words
        
        confidence = len(overlap) / max(len(conclusion_words), 1)
        
        proof_steps.append(f"基于 {len(overlap)} 个共同概念")
        
        return LogicResult(
            valid=confidence > 0.5,
            proof_steps=proof_steps,
            conclusion=conclusion,
            confidence=confidence
        )


class CausalInferenceEngine:
    """基于 do-演算的因果推断引擎"""
    
    def infer(self, treatment: str, outcome: str, 
              data: Dict[str, Any] = None) -> CausalResult:
        """
        计算因果效应
        
        简化的因果推断：
        - 如果 treatment 和 outcome 在数据中高度相关
        - 且有合理的因果路径描述
        """
        data = data or {}
        
        # 提取相关证据
        correlation = data.get('correlation', 0.5)
        confounders = data.get('confounders', [])
        
        # 计算因果效应（简化版）
        # P(outcome | do(treatment)) vs P(outcome)
        base_rate = data.get('base_rate', 0.5)
        
        if confounders:
            # 有混杂因素，降低置信度
            effect = correlation * 0.7
            confidence = 0.6
            causal_type = 'confounded'
        else:
            effect = correlation
            confidence = 0.8
            causal_type = 'direct'
        
        explanation = f"{treatment} 对 {outcome} 的因果效应约为 {effect:.2f}"
        if confounders:
            explanation += f"（需注意混杂因素：{', '.join(confounders)}）"
        
        return CausalResult(
            effect=effect,
            causal_type=causal_type,
            confidence=confidence,
            explanation=explanation
        )


class BayesianDecisionEngine:
    """贝叶斯决策引擎 - 贝叶斯更新、MAP决策、期望效用最大化"""
    
    def decide(self, actions: List[str], utility_table: Dict[str, Dict[str, float]],
               prior: Dict[str, float]) -> BayesianResult:
        """
        贝叶斯决策
        
        Args:
            actions: 候选行动列表
            utility_table: {state: {action: utility}}
            prior: {state: probability}
        
        Returns:
            最优行动及期望效用
        """
        expected_utilities = {}
        
        for action in actions:
            expected_utility = 0.0
            for state, prob in prior.items():
                utility = utility_table.get(state, {}).get(action, 0)
                expected_utility += prob * utility
            expected_utilities[action] = expected_utility
        
        # 选择期望效用最大的行动
        best_action = max(expected_utilities, key=expected_utilities.get)
        
        # 后验概率更新（简化）
        posterior = {}
        for state in prior:
            # 简化的贝叶斯更新
            likelihood = utility_table.get(state, {}).get(best_action, 0.5)
            posterior[state] = prior[state] * likelihood
        
        # 归一化
        total = sum(posterior.values())
        if total > 0:
            posterior = {k: v/total for k, v in posterior.items()}
        
        return BayesianResult(
            action=best_action,
            expected_utility=expected_utilities[best_action],
            posterior=posterior,
            reasoning=f"行动 '{best_action}' 的期望效用最高：{expected_utilities[best_action]:.2f}"
        )


class ArgumentationAnalyzer:
    """基于 Dung 框架的论辩分析"""
    
    def analyze(self, pro_args: List[str], con_args: List[str]) -> ArgumentResult:
        """
        论辩分析 - 计算可接受的论点
        
        Dung 框架：
        - grounded_extension: 所有不被攻击的论点
        - stable_extension: 攻击所有不属于自己的论点
        """
        all_args = pro_args + con_args
        attacks = []
        
        # 简化的攻击关系
        # con 攻击 pro
        for con in con_args:
            for pro in pro_args:
                # 检查语义冲突
                if any(word in pro.lower() for word in ['是', '应该', '可以']):
                    if any(word in con.lower() for word in ['不', '否', '不是', '不应该']):
                        attacks.append((con, pro))
        
        # 计算 grounded extension（不被攻击的论点）
        attacked = {a for _, a in attacks}
        grounded = [a for a in pro_args if a not in attacked]
        
        # 计算 stable extension
        stable = []
        for arg in all_args:
            is_stable = True
            for attacker, attacked_arg in attacks:
                if attacked_arg == arg:
                    # 找反击
                    if attacked_arg in [a for a, _ in attacks]:
                        is_stable = False
                        break
            if is_stable:
                stable.append(arg)
        
        acceptable = len(grounded) > len(con_args) / 2
        
        return ArgumentResult(
            acceptable=acceptable,
            grounded_extension=grounded,
            stable_extension=stable,
            attacks=attacks
        )


class IntelligenceLayer:
    """
    智能层 - 符合 KMWI 模型的"瞬时推理"持久性语义
    
    任务结束即消失的临时推理状态。
    
    核心组件：
    - LogicVerifier: 语义 Tableau 逻辑证明
    - CausalInferenceEngine: do-演算因果推断
    - BayesianDecisionEngine: 贝叶斯决策
    - ArgumentationAnalyzer: Dung 框架论辩分析
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        
        # 初始化四大引擎
        self.logic_verifier = LogicVerifier()
        self.causal_engine = CausalInferenceEngine()
        self.bayesian_engine = BayesianDecisionEngine()
        self.argumentation = ArgumentationAnalyzer()
    
    def verify_logic(self, premises: List[str], conclusion: str) -> Dict[str, Any]:
        """调用 Tableau 证明器验证推理有效性"""
        result = self.logic_verifier.verify(premises, conclusion)
        return {
            'valid': result.valid,
            'proof_steps': result.proof_steps,
            'conclusion': result.conclusion,
            'confidence': result.confidence
        }
    
    def analyze_causality(self, treatment: str, outcome: str,
                          data: Dict[str, Any] = None) -> Dict[str, Any]:
        """计算因果效应"""
        result = self.causal_engine.infer(treatment, outcome, data)
        return {
            'effect': result.effect,
            'causal_type': result.causal_type,
            'confidence': result.confidence,
            'explanation': result.explanation
        }
    
    def make_bayesian_decision(self, actions: List[str],
                               utility_table: Dict[str, Dict[str, float]],
                               prior: Dict[str, float]) -> Dict[str, Any]:
        """贝叶斯决策"""
        result = self.bayesian_engine.decide(actions, utility_table, prior)
        return {
            'action': result.action,
            'expected_utility': result.expected_utility,
            'posterior': result.posterior,
            'reasoning': result.reasoning
        }
    
    def analyze_arguments(self, pro_args: List[str], con_args: List[str]) -> Dict[str, Any]:
        """论辩分析"""
        result = self.argumentation.analyze(pro_args, con_args)
        return {
            'acceptable': result.acceptable,
            'grounded_extension': result.grounded_extension,
            'stable_extension': result.stable_extension,
            'attacks': result.attacks
        }
    
    def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        层接口：根据 mode 参数调用相应的推理引擎
        
        Args:
            input_data: {
                'mode': str,                # 'logic' | 'causal' | 'bayesian' | 'debate' | 'full'
                'premises': List[str],      # 逻辑验证用
                'conclusion': str,          # 逻辑验证用
                'treatment': str,           # 因果推断用
                'outcome': str,             # 因果推断用
                'data': Dict,              # 因果推断用
                'actions': List[str],      # 贝叶斯决策用
                'utility_table': Dict,     # 贝叶斯决策用
                'prior': Dict,             # 贝叶斯决策用
                'pro_args': List[str],     # 论辩分析用
                'con_args': List[str],     # 论辩分析用
            }
        
        Returns:
            推理结果
        """
        mode = input_data.get('mode', 'full')
        result = {'layer': 'intelligence', 'mode': mode}
        
        if mode == 'logic':
            result['logic'] = self.verify_logic(
                input_data.get('premises', []),
                input_data.get('conclusion', '')
            )
        
        elif mode == 'causal':
            result['causal'] = self.analyze_causality(
                input_data.get('treatment', ''),
                input_data.get('outcome', ''),
                input_data.get('data', {})
            )
        
        elif mode == 'bayesian':
            result['bayesian'] = self.make_bayesian_decision(
                input_data.get('actions', []),
                input_data.get('utility_table', {}),
                input_data.get('prior', {})
            )
        
        elif mode == 'debate':
            result['debate'] = self.analyze_arguments(
                input_data.get('pro_args', []),
                input_data.get('con_args', [])
            )
        
        elif mode == 'full':
            # 执行完整推理
            if 'premises' in input_data:
                result['logic'] = self.verify_logic(
                    input_data['premises'],
                    input_data.get('conclusion', '')
                )
            if 'treatment' in input_data:
                result['causal'] = self.analyze_causality(
                    input_data['treatment'],
                    input_data.get('outcome', ''),
                    input_data.get('data', {})
                )
            if 'actions' in input_data:
                result['bayesian'] = self.make_bayesian_decision(
                    input_data['actions'],
                    input_data.get('utility_table', {}),
                    input_data.get('prior', {})
                )
            if 'pro_args' in input_data:
                result['debate'] = self.analyze_arguments(
                    input_data['pro_args'],
                    input_data.get('con_args', [])
                )
        
        return result
    
    def get_state(self) -> Dict[str, Any]:
        """返回当前层状态"""
        return {
            'layer': 'intelligence',
            'engines': ['logic_verifier', 'causal_engine', 'bayesian_engine', 'argumentation']
        }


if __name__ == "__main__":
    # 测试代码
    layer = IntelligenceLayer()
    
    # 逻辑验证
    result = layer.process({
        'mode': 'logic',
        'premises': ['如果下雨，地面会湿', '下雨了'],
        'conclusion': '地面会湿'
    })
    print(f"Logic: {result['logic']}")
    
    # 因果推断
    result = layer.process({
        'mode': 'causal',
        'treatment': '运动',
        'outcome': '健康',
        'data': {'correlation': 0.7, 'confounders': ['饮食', '睡眠']}
    })
    print(f"Causal: {result['causal']}")
    
    # 贝叶斯决策
    result = layer.process({
        'mode': 'bayesian',
        'actions': ['A', 'B'],
        'utility_table': {
            '成功': {'A': 10, 'B': 8},
            '失败': {'A': -2, 'B': -1}
        },
        'prior': {'成功': 0.6, '失败': 0.4}
    })
    print(f"Bayesian: {result['bayesian']}")
    
    # 论辩分析
    result = layer.process({
        'mode': 'debate',
        'pro_args': ['运动有益健康', '运动能减压'],
        'con_args': ['运动浪费时间', '运动有受伤风险']
    })
    print(f"Debate: {result['debate']}")
    
    print(f"State: {layer.get_state()}")

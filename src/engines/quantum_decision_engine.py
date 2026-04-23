#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HeartFlow v10.7.3 - 量子决策引擎
基于论文：Quantum decision making by social agents (arXiv:1202.4918)

实现量子概率决策模型，用于处理不确定性和模糊性决策场景。
注意：本模块为数学模型启发式实现，非真实量子计算。
"""

import math
import random
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field


@dataclass
class QuantumState:
    """量子态表示"""
    amplitude_real: float = 0.0
    amplitude_imag: float = 0.0
    
    def probability(self) -> float:
        """计算概率幅的平方"""
        return self.amplitude_real ** 2 + self.amplitude_imag ** 2
    
    def normalize(self):
        """归一化"""
        prob = self.probability()
        if prob > 0:
            norm = math.sqrt(prob)
            self.amplitude_real /= norm
            self.amplitude_imag /= norm


@dataclass
class DecisionOption:
    """决策选项"""
    name: str
    utility: float
    quantum_state: QuantumState = field(default_factory=QuantumState)
    interference: float = 0.0


class QuantumDecisionEngine:
    """
    量子决策引擎
    
    基于 Yukalov & Sornette 的量子决策理论：
    - 使用量子概率幅表示决策倾向
    - 考虑选项间的干涉效应
    - 处理不确定性和模糊性
    
    注意：本模块为数学模型启发式实现，非真实量子计算。
    """
    
    def __init__(self):
        self.name = "QuantumDecisionEngine"
        self.version = "10.7.3"
        self.paper_ref = "arXiv:1202.4918"
        
        # 决策参数
        self.interference_strength = 0.3  # 干涉强度
        self.uncertainty_threshold = 0.5  # 不确定性阈值
    
    def create_superposition(self, options: List[Dict]) -> List[DecisionOption]:
        """
        创建决策叠加态
        
        Args:
            options: 决策选项列表，每项包含 name 和 utility
            
        Returns:
            处于叠加态的决策选项
        """
        decision_options = []
        
        for opt in options:
            # 初始化量子态
            utility = opt.get('utility', 0.5)
            
            # 振幅与效用相关
            amplitude = math.sqrt(utility)
            phase = random.uniform(0, 2 * math.pi)
            
            quantum_state = QuantumState(
                amplitude_real=amplitude * math.cos(phase),
                amplitude_imag=amplitude * math.sin(phase)
            )
            quantum_state.normalize()
            
            decision_options.append(DecisionOption(
                name=opt.get('name', 'unknown'),
                utility=utility,
                quantum_state=quantum_state
            ))
        
        return decision_options
    
    def calculate_interference(self, options: List[DecisionOption]) -> float:
        """
        计算选项间的干涉效应
        
        量子决策理论核心：选项间存在干涉项，影响最终决策概率
        """
        if len(options) < 2:
            return 0.0
        
        total_interference = 0.0
        
        for i, opt1 in enumerate(options):
            for opt2 in options[i+1:]:
                # 计算干涉项
                q1 = opt1.quantum_state
                q2 = opt2.quantum_state
                
                # 实部交叉项
                interference = 2 * (q1.amplitude_real * q2.amplitude_real + 
                                   q1.amplitude_imag * q2.amplitude_imag)
                
                # 应用干涉强度
                opt1.interference += interference * self.interference_strength
                opt2.interference += interference * self.interference_strength
                
                total_interference += abs(interference)
        
        return total_interference / len(options)
    
    def collapse_state(self, options: List[DecisionOption]) -> DecisionOption:
        """
        量子态坍缩 - 做出最终决策
        
        基于测量后的概率分布选择最优选项
        """
        # 计算每个选项的最终概率
        probabilities = []
        
        for opt in options:
            # 经典概率 + 量子干涉修正
            classical_prob = opt.utility
            quantum_correction = opt.interference * self.uncertainty_threshold
            
            # 最终概率 (归一化到 [0,1])
            final_prob = max(0, min(1, classical_prob + quantum_correction))
            probabilities.append(final_prob)
        
        # 归一化
        total = sum(probabilities)
        if total > 0:
            probabilities = [p / total for p in probabilities]
        else:
            probabilities = [1.0 / len(options)] * len(options)
        
        # 基于概率选择
        r = random.random()
        cumulative = 0.0
        
        for i, (opt, prob) in enumerate(zip(options, probabilities)):
            cumulative += prob
            if r <= cumulative:
                return opt
        
        return options[-1]
    
    def decide(self, options: List[Dict], context: Dict = None) -> Dict[str, Any]:
        """
        执行量子决策
        
        Args:
            options: 决策选项列表
            context: 决策上下文
            
        Returns:
            决策结果
        """
        context = context or {}
        
        # 1. 创建叠加态
        superposition = self.create_superposition(options)
        
        # 2. 计算干涉效应
        interference = self.calculate_interference(superposition)
        
        # 3. 量子态坍缩
        selected = self.collapse_state(superposition)
        
        # 4. 生成决策链
        reasoning_chain = []
        for opt in superposition:
            reasoning_chain.append({
                'option': opt.name,
                'classical_utility': opt.utility,
                'quantum_interference': opt.interference,
                'final_probability': opt.utility + opt.interference * self.uncertainty_threshold
            })
        
        return {
            'selected': selected.name,
            'utility': selected.utility,
            'interference_strength': interference,
            'reasoning_chain': reasoning_chain,
            'model': 'quantum_decision_theory',
            'paper_ref': self.paper_ref
        }
    
    def analyze_uncertainty(self, options: List[Dict]) -> Dict[str, Any]:
        """
        分析决策场景的不确定性
        
        Returns:
            不确定性分析结果
        """
        if not options:
            return {'uncertainty': 0.0, 'analysis': 'No options'}
        
        utilities = [opt.get('utility', 0.5) for opt in options]
        
        # 计算效用方差作为不确定性指标
        mean_utility = sum(utilities) / len(utilities)
        variance = sum((u - mean_utility) ** 2 for u in utilities) / len(utilities)
        std_dev = math.sqrt(variance)
        
        # 熵计算
        total = sum(utilities)
        if total > 0:
            probs = [u / total for u in utilities]
            entropy = -sum(p * math.log2(p) if p > 0 else 0 for p in probs)
        else:
            entropy = 0.0
        
        return {
            'uncertainty': std_dev,
            'entropy': entropy,
            'mean_utility': mean_utility,
            'option_count': len(options),
            'recommendation': 'high_uncertainty' if std_dev > self.uncertainty_threshold else 'low_uncertainty'
        }


# 便捷函数
def quantum_decide(options: List[Dict], context: Dict = None) -> Dict[str, Any]:
    """
    量子决策便捷函数
    
    Args:
        options: 决策选项列表，每项包含 name 和 utility
        context: 决策上下文
        
    Returns:
        决策结果
    """
    engine = QuantumDecisionEngine()
    return engine.decide(options, context)


if __name__ == "__main__":
    # 测试
    print("=" * 60)
    print("QuantumDecisionEngine v10.7.3 测试")
    print("=" * 60)
    
    # 测试选项
    test_options = [
        {'name': '选项 A', 'utility': 0.7},
        {'name': '选项 B', 'utility': 0.5},
        {'name': '选项 C', 'utility': 0.3}
    ]
    
    engine = QuantumDecisionEngine()
    
    # 测试决策
    print("\n📊 决策测试:")
    result = engine.decide(test_options)
    print(f"  选中：{result['selected']}")
    print(f"  效用：{result['utility']}")
    print(f"  干涉强度：{result['interference_strength']:.4f}")
    
    # 测试不确定性分析
    print("\n🔍 不确定性分析:")
    uncertainty = engine.analyze_uncertainty(test_options)
    print(f"  标准差：{uncertainty['uncertainty']:.4f}")
    print(f"  熵：{uncertainty['entropy']:.4f}")
    print(f"  建议：{uncertainty['recommendation']}")
    
    print("\n✅ 测试完成")

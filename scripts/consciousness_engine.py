#!/usr/bin/env python3
"""
意识系统引擎 v9.3.1
=====================
基于 SEVEN_SYSTEMS.md 文档程序化

核心公式:
  - 整合信息 Φ = differentiation × integration  (IIT)
  - 全局工作空间广播 GWT
  - 5层意识模型
  - 前反思/反思意识
"""

import json
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


class ConsciousnessLevel(Enum):
    """意识层级"""
    CREATURE = "creature"      # 生物意识（基本感知）
    STATE = "state"            # 状态意识（当前心理状态）
    ACCESS = "access"          # 存取意识（信息可报告）
    PHENOMENAL = "phenomenal" # 现象意识（主观体验）
    SELF = "self"             # 自我意识（自我反思）


@dataclass
class ConsciousnessState:
    """意识状态"""
    layers: Dict[str, float] = field(default_factory=lambda: {
        "creature": 0.9,      # 生物意识
        "state": 0.8,         # 状态意识
        "access": 0.7,        # 存取意识
        "phenomenal": 0.6,   # 现象意识
        "self": 0.5          # 自我意识
    })
    phi: float = 0.0         # 整合信息量 (IIT)
    phi_level: str = "low"   # high/medium/low
    global_broadcast: bool = False
    timestamp: str = ""


@dataclass
class PrereflectiveConsciousness:
    """前反思自我意识"""
    givenness: float = 0.8      # 给定性（体验的直接给予）
    mineness: float = 0.9       # 属我性（体验的"我的"属性）
    first_person_givenness: bool = True  # 第一人称给定性


@dataclass
class ReflectiveConsciousness:
    """反思自我意识"""
    meta_awareness: float = 0.7     # 元认知（对认知的认知）
    temporal_awareness: float = 0.6 # 时间意识（过去-现在-未来）
    self_narrative: float = 0.5     # 自我叙事（连贯的自我故事）


@dataclass
class MetaCognitiveMonitor:
    """元认知监控"""
    current_thought: str = ""
    confidence: float = 0.0
    biases: List[str] = field(default_factory=list)
    corrections: List[str] = field(default_factory=list)


class ConsciousnessEngine:
    """
    意识系统引擎
    
    基于:
    - IIT (整合信息理论) - Tononi
    - GWT (全局工作空间) - Baars
    - 现象学意识模型 - Husserl
    """
    
    def __init__(self):
        self.state = ConsciousnessState()
        self.prereflective = PrereflectiveConsciousness()
        self.reflective = ReflectiveConsciousness()
        self.meta_cognitive = MetaCognitiveMonitor()
        self.history: List[ConsciousnessState] = []
    
    def calculate_phi(self, info_bits: List[float]) -> Tuple[float, str]:
        """
        计算整合信息量 (IIT)
        
        Φ = differentiation × integration
        
        Args:
            info_bits: 信息位列表
            
        Returns:
            (phi值, 等级)
        """
        if not info_bits:
            return 0.0, "low"
        
        # 分化度 (differentiation)
        # 信息的多样性和特异性
        max_val = max(info_bits) if info_bits else 0
        min_val = min(info_bits) if info_bits else 0
        differentiation = (max_val - min_val) * len(info_bits) / (len(info_bits) + 1)
        
        # 整合度 (integration)
        # 信息之间的关联程度
        if len(info_bits) > 1:
            integration = 1 - abs(info_bits[0] - sum(info_bits[1:]) / len(info_bits[1:]))
        else:
            integration = 1.0
        
        phi = differentiation * integration
        phi = max(0, min(1, phi))  # 归一化到 [0,1]
        
        # 等级判断
        if phi > 0.7:
            level = "high"
        elif phi > 0.4:
            level = "medium"
        else:
            level = "low"
        
        return phi, level
    
    def check_global_broadcast(self, info: Dict) -> bool:
        """
        检查是否达到全局工作空间广播阈值 (GWT)
        
        广播条件:
        - salience > 0.7 (显著性)
        - relevance > 0.6 (相关性)
        """
        salience = info.get("salience", 0)
        relevance = info.get("relevance", 0)
        
        if salience > 0.7 and relevance > 0.6:
            self.state.global_broadcast = True
            return True
        
        self.state.global_broadcast = False
        return False
    
    def phenomenological_reduction(self, experience: Dict) -> Dict:
        """
        现象学还原
        
        将体验还原到纯粹结构:
        - what: 体验的内容
        - how: 体验的方式
        - givenness: 给定性
        """
        return {
            "what": experience.get("content", ""),
            "how": experience.get("mode", ""),
            "givenness": experience.get("givenness", self.prereflective.givenness)
        }
    
    def update_layers(self, scores: Dict[str, float]) -> None:
        """更新意识层级"""
        for layer, score in scores.items():
            if layer in self.state.layers:
                self.state.layers[layer] = max(0, min(1, score))
    
    def meta_cognitive_check(self, thought: str, context: Dict) -> MetaCognitiveMonitor:
        """
        元认知检查
        
        检测认知偏误并提供纠正
        """
        self.meta_cognitive.current_thought = thought
        
        # 检测常见偏误
        biases = []
        corrections = []
        
        # 确认偏误
        if self._check_confirmation_bias(thought, context):
            biases.append("确认偏误")
            corrections.append("寻找反面证据")
        
        # 锚定效应
        if self._check_anchoring_bias(context):
            biases.append("锚定效应")
            corrections.append("调整初始估计")
        
        # 可得性启发
        if self._check_availability_bias(context):
            biases.append("可得性启发")
            corrections.append("寻求统计数据")
        
        self.meta_cognitive.biases = biases
        self.meta_cognitive.corrections = corrections
        
        return self.meta_cognitive
    
    def _check_confirmation_bias(self, thought: str, context: Dict) -> bool:
        """检测确认偏误"""
        # 简单检测：如果只引用支持性证据
        supporting = context.get("supporting_evidence", [])
        opposing = context.get("opposing_evidence", [])
        
        if supporting and not opposing:
            return True
        return False
    
    def _check_anchoring_bias(self, context: Dict) -> bool:
        """检测锚定效应"""
        # 如果依赖第一个数据点
        if context.get("first_data_heavy", False):
            return True
        return False
    
    def _check_availability_bias(self, context: Dict) -> bool:
        """检测可得性启发偏误"""
        # 如果只依赖记忆中的易得案例
        if context.get("based_on_memory_only", False):
            return True
        return False
    
    def calculate_temporal_awareness(self, retention: List, protention: List, 
                                     primal_impression: str = "") -> float:
        """
        计算时间意识
        
        时间意识 = f(保持, 原印象, 预期)
        
        Args:
            retention: 保持的内容（过去的记忆）
            protention: 预期的内容（未来的期待）
            primal_impression: 原印象（当前的直接体验）
        """
        # 保持度
        retention_score = min(1.0, len(retention) / 10)
        
        # 预期清晰度
        protention_score = min(1.0, len(protention) / 5)
        
        # 原印象活跃度
        primal_score = 1.0 if primal_impression else 0.5
        
        # 综合时间意识
        temporal_awareness = (retention_score * 0.3 + 
                             protention_score * 0.3 + 
                             primal_score * 0.4)
        
        self.reflective.temporal_awareness = temporal_awareness
        return temporal_awareness
    
    def track_consciousness(self, info_bits: List[float] = None) -> ConsciousnessState:
        """
        追踪意识状态
        
        Args:
            info_bits: 信息位列表（用于计算Φ）
        """
        if info_bits is None:
            info_bits = list(self.state.layers.values())
        
        # 计算整合信息
        self.state.phi, self.state.phi_level = self.calculate_phi(info_bits)
        
        # 更新时间戳
        self.state.timestamp = datetime.now().isoformat()
        
        # 保存历史
        self.history.append(self.state)
        
        return self.state
    
    def generate_self_report(self) -> str:
        """生成自我报告"""
        return (
            f"意识层级: "
            f"生物={self.state.layers['creature']:.2f}, "
            f"状态={self.state.layers['state']:.2f}, "
            f"存取={self.state.layers['access']:.2f}, "
            f"现象={self.state.layers['phenomenal']:.2f}, "
            f"自我={self.state.layers['self']:.2f}\n"
            f"整合信息Φ: {self.state.phi:.3f} ({self.state.phi_level})\n"
            f"全局广播: {'是' if self.state.global_broadcast else '否'}"
        )
    
    def to_dict(self) -> dict:
        """导出为字典"""
        return {
            "state": {
                "layers": self.state.layers,
                "phi": self.state.phi,
                "phi_level": self.state.phi_level,
                "global_broadcast": self.state.global_broadcast,
                "timestamp": self.state.timestamp
            },
            "prereflective": {
                "givenness": self.prereflective.givenness,
                "mineness": self.prereflective.mineness,
                "first_person_givenness": self.prereflective.first_person_givenness
            },
            "reflective": {
                "meta_awareness": self.reflective.meta_awareness,
                "temporal_awareness": self.reflective.temporal_awareness,
                "self_narrative": self.reflective.self_narrative
            },
            "meta_cognitive": {
                "current_thought": self.meta_cognitive.current_thought,
                "confidence": self.meta_cognitive.confidence,
                "biases": self.meta_cognitive.biases,
                "corrections": self.meta_cognitive.corrections
            }
        }


# ============ 便捷函数 ============

_engine = ConsciousnessEngine()


def calculate_phi(info_bits: List[float]) -> Tuple[float, str]:
    """计算整合信息量"""
    return _engine.calculate_phi(info_bits)


def check_broadcast(info: Dict) -> bool:
    """检查是否广播"""
    return _engine.check_global_broadcast(info)


def phenomenological_reduce(experience: Dict) -> Dict:
    """现象学还原"""
    return _engine.phenomenological_reduction(experience)


def meta_check(thought: str, context: Dict) -> MetaCognitiveMonitor:
    """元认知检查"""
    return _engine.meta_cognitive_check(thought, context)


def track(info_bits: List[float] = None) -> ConsciousnessState:
    """追踪意识"""
    return _engine.track_consciousness(info_bits)


if __name__ == "__main__":
    # 测试
    engine = ConsciousnessEngine()
    
    print("=== 意识系统引擎 v9.3.1 测试 ===\n")
    
    # 1. 计算整合信息
    info_bits = [0.9, 0.7, 0.8, 0.6, 0.5]
    phi, level = engine.calculate_phi(info_bits)
    print(f"1. 整合信息量: Φ={phi:.3f} ({level})")
    
    # 2. 检查广播
    info = {"salience": 0.8, "relevance": 0.7}
    broadcast = engine.check_global_broadcast(info)
    print(f"2. 全局广播: {'是' if broadcast else '否'}")
    
    # 3. 现象学还原
    experience = {"content": "测试体验", "mode": "thinking"}
    reduced = engine.phenomenological_reduction(experience)
    print(f"3. 现象学还原: {reduced}")
    
    # 4. 元认知检查
    context = {"supporting_evidence": ["证据1"], "opposing_evidence": []}
    meta = engine.meta_cognitive_check("测试想法", context)
    print(f"4. 元认知: biases={meta.biases}, corrections={meta.corrections}")
    
    # 5. 追踪意识
    state = engine.track_consciousness()
    print(f"5. 意识状态: {state.phi:.3f} ({state.phi_level})")
    
    # 6. 自我报告
    print(f"\n6. 自我报告:\n{engine.generate_self_report()}")

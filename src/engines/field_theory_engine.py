#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HeartFlow v10.7.3 - 场论认知引擎
基于论文：Kurt Lewin, psychological constructs and sources of brain cognitive activity (arXiv:1711.01767)

实现库尔特·勒温的场论心理学模型：
- 生活空间 (Life Space) 概念
- 心理力场分析
- 趋避冲突模型

注意：本模块为心理学理论启发式实现。
"""

import math
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum


class ForceType(Enum):
    """心理力类型"""
    APPROACH = "approach"      # 趋近力
    AVOIDANCE = "avoidance"    # 回避力
    BARRIER = "barrier"        # 障碍力
    DRIVING = "driving"        # 驱动力


@dataclass
class PsychologicalForce:
    """心理力"""
    name: str
    force_type: ForceType
    magnitude: float  # 力的大小 (0-1)
    direction: float  # 方向 (弧度)
    source: str       # 力的来源
    target: str       # 力的目标
    
    def vector(self) -> Tuple[float, float]:
        """返回力的向量表示"""
        return (
            self.magnitude * math.cos(self.direction),
            self.magnitude * math.sin(self.direction)
        )


@dataclass
class LifeSpaceRegion:
    """生活空间区域"""
    name: str
    valence: float      # 效价 (+/-)
    accessibility: float  # 可及性 (0-1)
    boundaries: List[str] = field(default_factory=list)


class FieldTheoryEngine:
    """
    场论认知引擎
    
    基于 Kurt Lewin 的场论心理学：
    - B = f(P, E) - 行为是人与环境的函数
    - 生活空间包含所有影响行为的心理事实
    - 心理力场决定行为方向
    
    注意：本模块为心理学理论启发式实现。
    """
    
    def __init__(self):
        self.name = "FieldTheoryEngine"
        self.version = "10.7.3"
        self.paper_ref = "arXiv:1711.01767"
        
        # 生活空间
        self.life_space: List[LifeSpaceRegion] = []
        self.forces: List[PsychologicalForce] = []
        
        # 当前心理位置
        self.current_position = "self"
    
    def add_region(self, name: str, valence: float, accessibility: float = 0.5) -> LifeSpaceRegion:
        """
        添加生活空间区域
        
        Args:
            name: 区域名称
            valence: 效价 (-1 到 +1)
            accessibility: 可及性 (0-1)
        """
        region = LifeSpaceRegion(
            name=name,
            valence=max(-1, min(1, valence)),
            accessibility=max(0, min(1, accessibility))
        )
        self.life_space.append(region)
        return region
    
    def add_force(self, name: str, force_type: ForceType, magnitude: float,
                  direction: float, source: str, target: str) -> PsychologicalForce:
        """
        添加心理力
        
        Args:
            name: 力名称
            force_type: 力类型
            magnitude: 力大小 (0-1)
            direction: 方向 (弧度)
            source: 来源
            target: 目标
        """
        force = PsychologicalForce(
            name=name,
            force_type=force_type,
            magnitude=max(0, min(1, magnitude)),
            direction=direction % (2 * math.pi),
            source=source,
            target=target
        )
        self.forces.append(force)
        return force
    
    def calculate_resultant_force(self) -> Tuple[float, float]:
        """
        计算合力
        
        Returns:
            (合力大小，合力方向)
        """
        if not self.forces:
            return (0.0, 0.0)
        
        # 向量求和
        fx = sum(f.vector()[0] for f in self.forces)
        fy = sum(f.vector()[1] for f in self.forces)
        
        # 合力大小
        magnitude = math.sqrt(fx ** 2 + fy ** 2)
        
        # 合力方向
        direction = math.atan2(fy, fx)
        if direction < 0:
            direction += 2 * math.pi
        
        return (magnitude, direction)
    
    def analyze_conflict(self) -> Dict[str, Any]:
        """
        分析心理冲突类型
        
        Lewin 的三种基本冲突：
        1. 趋趋冲突 (approach-approach)
        2. 避避冲突 (avoidance-avoidance)
        3. 趋避冲突 (approach-avoidance)
        """
        approach_forces = [f for f in self.forces if f.force_type == ForceType.APPROACH]
        avoidance_forces = [f for f in self.forces if f.force_type == ForceType.AVOIDANCE]
        
        conflict_type = "none"
        intensity = 0.0
        
        if approach_forces and avoidance_forces:
            # 趋避冲突
            conflict_type = "approach-avoidance"
            approach_strength = sum(f.magnitude for f in approach_forces)
            avoidance_strength = sum(f.magnitude for f in avoidance_forces)
            intensity = min(approach_strength, avoidance_strength)
            
        elif len(approach_forces) >= 2:
            # 趋趋冲突
            conflict_type = "approach-approach"
            intensities = [f.magnitude for f in approach_forces]
            intensity = min(intensities) if intensities else 0.0
            
        elif len(avoidance_forces) >= 2:
            # 避避冲突
            conflict_type = "avoidance-avoidance"
            intensities = [f.magnitude for f in avoidance_forces]
            intensity = min(intensities) if intensities else 0.0
        
        return {
            'conflict_type': conflict_type,
            'intensity': intensity,
            'approach_forces': len(approach_forces),
            'avoidance_forces': len(avoidance_forces),
            'total_forces': len(self.forces)
        }
    
    def predict_behavior(self, goal: str) -> Dict[str, Any]:
        """
        预测行为方向
        
        基于当前力场分析，预测朝向目标的行为倾向
        """
        # 找到目标区域
        target_region = None
        for region in self.life_space:
            if region.name == goal:
                target_region = region
                break
        
        if not target_region:
            return {'error': 'Goal region not found'}
        
        # 计算合力
        resultant_magnitude, resultant_direction = self.calculate_resultant_force()
        
        # 计算到目标的方向
        target_valence = target_region.valence
        target_accessibility = target_region.accessibility
        
        # 行为倾向 = 合力 × 目标效价 × 可及性
        behavior_tendency = resultant_magnitude * max(0, target_valence) * target_accessibility
        
        return {
            'goal': goal,
            'behavior_tendency': behavior_tendency,
            'resultant_force': resultant_magnitude,
            'force_direction': resultant_direction,
            'goal_valence': target_valence,
            'goal_accessibility': target_accessibility,
            'recommendation': self._get_recommendation(behavior_tendency, target_valence)
        }
    
    def _get_recommendation(self, tendency: float, valence: float) -> str:
        """生成行为建议"""
        if valence < 0:
            return "考虑回避此目标"
        elif tendency < 0.3:
            return "动机不足，建议增强驱动力"
        elif tendency < 0.6:
            return "中等动机，可考虑行动"
        else:
            return "强烈动机，建议立即行动"
    
    def get_life_space_map(self) -> Dict[str, Any]:
        """获取生活空间地图"""
        return {
            'regions': [
                {
                    'name': r.name,
                    'valence': r.valence,
                    'accessibility': r.accessibility
                }
                for r in self.life_space
            ],
            'forces': [
                {
                    'name': f.name,
                    'type': f.force_type.value,
                    'magnitude': f.magnitude,
                    'direction': f.direction,
                    'source': f.source,
                    'target': f.target
                }
                for f in self.forces
            ],
            'current_position': self.current_position
        }
    
    def reset(self):
        """重置引擎状态"""
        self.life_space = []
        self.forces = []
        self.current_position = "self"


# 便捷函数
def analyze_field(user_input: str, context: Dict = None) -> Dict[str, Any]:
    """
    场论分析便捷函数
    
    Args:
        user_input: 用户输入
        context: 上下文信息
        
    Returns:
        场论分析结果
    """
    engine = FieldTheoryEngine()
    
    # 简单的情绪关键词检测
    positive_words = ['快乐', '高兴', '成功', '爱', '希望', 'happy', 'success', 'love']
    negative_words = ['悲伤', '失败', '恐惧', '恨', '绝望', 'sad', 'fail', 'fear', 'hate']
    
    # 分析输入
    input_lower = user_input.lower()
    
    # 添加基于输入的区域
    pos_count = sum(1 for w in positive_words if w in input_lower)
    neg_count = sum(1 for w in negative_words if w in input_lower)
    
    engine.add_region("goal", valence=pos_count * 0.3 - neg_count * 0.3, accessibility=0.7)
    engine.add_region("obstacle", valence=-0.5, accessibility=0.5)
    
    # 添加驱动力
    if pos_count > 0:
        engine.add_force(
            "positive_motivation",
            ForceType.APPROACH,
            magnitude=pos_count * 0.3,
            direction=0,
            source="user_input",
            target="goal"
        )
    
    if neg_count > 0:
        engine.add_force(
            "negative_avoidance",
            ForceType.AVOIDANCE,
            magnitude=neg_count * 0.3,
            direction=math.pi,
            source="user_input",
            target="obstacle"
        )
    
    # 分析冲突
    conflict = engine.analyze_conflict()
    
    # 预测行为
    behavior = engine.predict_behavior("goal")
    
    return {
        'life_space': engine.get_life_space_map(),
        'conflict_analysis': conflict,
        'behavior_prediction': behavior,
        'model': 'field_theory',
        'paper_ref': engine.paper_ref
    }


if __name__ == "__main__":
    # 测试
    print("=" * 60)
    print("FieldTheoryEngine v10.7.3 测试")
    print("=" * 60)
    
    engine = FieldTheoryEngine()
    
    # 构建生活空间
    print("\n🗺️ 构建生活空间:")
    engine.add_region("career_success", valence=0.8, accessibility=0.6)
    engine.add_region("work_life_balance", valence=0.5, accessibility=0.8)
    engine.add_region("failure_risk", valence=-0.7, accessibility=0.4)
    print(f"  区域数量：{len(engine.life_space)}")
    
    # 添加心理力
    print("\n💪 添加心理力:")
    engine.add_force("ambition", ForceType.APPROACH, 0.7, 0, "self", "career_success")
    engine.add_force("fear", ForceType.AVOIDANCE, 0.5, math.pi, "self", "failure_risk")
    engine.add_force("family", ForceType.APPROACH, 0.6, math.pi/2, "self", "work_life_balance")
    print(f"  力数量：{len(engine.forces)}")
    
    # 分析冲突
    print("\n⚔️ 冲突分析:")
    conflict = engine.analyze_conflict()
    print(f"  冲突类型：{conflict['conflict_type']}")
    print(f"  冲突强度：{conflict['intensity']:.2f}")
    
    # 预测行为
    print("\n🔮 行为预测:")
    behavior = engine.predict_behavior("career_success")
    print(f"  行为倾向：{behavior['behavior_tendency']:.2f}")
    print(f"  建议：{behavior['recommendation']}")
    
    print("\n✅ 测试完成")

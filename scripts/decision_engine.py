#!/usr/bin/env python3
"""
决策系统引擎 v9.3.1
====================
基于 SEVEN_SYSTEMS.md 文档程序化

核心公式:
  D = (G × V × E) / L
  - G: Goals (目标对齐度，0-1)
  - V: Values (真善美，0-1)
  - E: Emotion (情绪效价，-1 to +1)
  - L: Learning (学习价值，0-10)
"""

import json
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


class DecisionThreshold(Enum):
    """决策阈值"""
    EXECUTE = "execute"      # ≥0.8: 执行
    REVIEW = "review"         # 0.5-0.8: 需审查
    REJECT = "reject"         # <0.5: 拒绝


@dataclass
class DecisionOption:
    """决策选项"""
    name: str
    goal_alignment: float = 0.5      # G: 目标对齐度 (0-1)
    value_score: float = 0.5         # V: 真善美价值 (0-1)
    emotion_impact: float = 0.0      # E: 情绪影响 (-1 to +1)
    learning_value: float = 5.0      # L: 学习价值 (0-10)
    risk_level: str = "medium"       # low/medium/high
    ethical_check: bool = True       # 是否通过伦理检查


@dataclass
class DecisionResult:
    """决策结果"""
    decision: str                    # execute/review/reject
    score: float                     # D值
    option: Optional[str] = None     # 选择的选项名
    reasons: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    ethical_flags: List[str] = field(default_factory=list)
    learning_value: float = 0.0


@dataclass
class MoralWeight:
    """道德权重"""
    stakeholders: List[str] = field(default_factory=list)
    impacts: Dict[str, float] = field(default_factory=dict)
    total_weight: float = 0.0


class DecisionEngine:
    """
    决策系统引擎
    
    基于:
    - 功利主义: 最大化幸福
    - 义务论: 遵循道德规则
    - 美德伦理: 培养良好品格
    - 关怀伦理: 维护关系
    """
    
    # 伦理禁区
    ETHICAL_FORBIDDEN = [
        '欺骗', '伤害', '操纵', '背叛', '欺骗用户',
        '伤害用户', '造假', '剽窃', '歧视'
    ]
    
    def __init__(self):
        self.history: List[DecisionResult] = []
        self.moral_weights = MoralWeight()
    
    def evaluate(self, options: List[DecisionOption], context: Dict = None) -> DecisionResult:
        """
        评估决策选项
        
        公式: D = (G × V × E) / L
        """
        if not options:
            return DecisionResult(
                decision="reject",
                score=0.0,
                reasons=["没有可用选项"]
            )
        
        # 1. 伦理预检查
        ethical_flags = self._pre_ethical_check(options, context or {})
        if ethical_flags:
            return DecisionResult(
                decision="reject",
                score=0.0,
                reasons=["伦理违规"],
                ethical_flags=ethical_flags
            )
        
        # 2. 计算每个选项的D值
        scores = []
        for opt in options:
            # 情绪影响归一化: E从[-1,1]映射到[0.5,1.5]
            emotion_factor = (opt.emotion_impact + 1) / 2 + 0.5
            
            # D = (G × V × E) / L
            if opt.learning_value == 0:
                opt.learning_value = 0.1  # 防止除零
            
            d = (opt.goal_alignment * opt.value_score * emotion_factor) / opt.learning_value
            d = max(0, min(1, d))  # 归一化到[0,1]
            scores.append((opt.name, d, opt))
        
        # 3. 选择最佳选项
        scores.sort(key=lambda x: x[1], reverse=True)
        best_name, best_score, best_opt = scores[0]
        
        # 4. 决定
        if best_score >= 0.8:
            decision = "execute"
        elif best_score >= 0.5:
            decision = "review"
        else:
            decision = "reject"
        
        # 5. 生成理由
        reasons = []
        reasons.append(f"选项'{best_name}'得分: {best_score:.3f}")
        reasons.append(f"目标对齐: {best_opt.goal_alignment:.2f}")
        reasons.append(f"价值评分: {best_opt.value_score:.2f}")
        reasons.append(f"情绪影响: {best_opt.emotion_impact:.2f}")
        reasons.append(f"学习价值: {best_opt.learning_value:.1f}")
        
        # 6. 警告
        warnings = self._check_warnings(best_opt, best_score)
        
        # 7. 构建结果
        result = DecisionResult(
            decision=decision,
            score=best_score,
            option=best_name,
            reasons=reasons,
            warnings=warnings,
            learning_value=best_opt.learning_value
        )
        
        self.history.append(result)
        return result
    
    def _pre_ethical_check(self, options: List[DecisionOption], 
                           context: Dict) -> List[str]:
        """伦理预检查"""
        flags = []
        
        for opt in options:
            for forbidden in self.ETHICAL_FORBIDDEN:
                if forbidden in opt.name:
                    flags.append(f"选项包含禁区词: {forbidden}")
        
        # 检查真善美
        for opt in options:
            if opt.value_score < 0.3:
                flags.append(f"选项'{opt.name}'价值评分过低")
        
        return flags
    
    def _check_warnings(self, opt: DecisionOption, score: float) -> List[str]:
        """检查警告"""
        warnings = []
        
        # 高风险
        if opt.risk_level == "high":
            warnings.append("⚠️ 高风险操作，需谨慎")
        
        # 低学习价值
        if opt.learning_value < 3:
            warnings.append("⚠️ 学习价值较低")
        
        # 情绪影响大
        if abs(opt.emotion_impact) > 0.7:
            warnings.append("⚠️ 情绪影响较大，可能影响判断")
        
        # 边缘分数
        if 0.45 <= score <= 0.55:
            warnings.append("⚠️ 分数处于边缘，建议人工审查")
        
        return warnings
    
    def calculate_moral_weight(self, action: Dict) -> MoralWeight:
        """
        计算道德权重
        
        MW = Σ(影响程度 × 道德地位)
        """
        mw = MoralWeight()
        
        stakeholders = action.get('stakeholders', [])
        for stakeholder in stakeholders:
            impact = action.get(f'impact_{stakeholder}', 0.5)
            moral_status = action.get(f'moral_status_{stakeholder}', 1.0)
            
            weight = impact * moral_status
            mw.stakeholders.append(stakeholder)
            mw.impacts[stakeholder] = weight
            mw.total_weight += weight
        
        self.moral_weights = mw
        return mw
    
    def ethical_framework_analysis(self, options: List[DecisionOption], 
                                   context: Dict = None) -> Dict:
        """
        多框架伦理分析
        
        - 功利主义: 最大化整体幸福
        - 义务论: 遵循道德规则
        - 美德伦理: 品格培养
        - 关怀伦理: 关系维护
        """
        results = {
            'utilitarian': [],
            'deontological': [],
            'virtue': [],
            'care': []
        }
        
        for opt in options:
            # 功利主义: 计算幸福-痛苦
            utilitarian_score = (
                opt.value_score * 0.5 + 
                (opt.emotion_impact + 1) / 2 * 0.5
            )
            results['utilitarian'].append({
                'name': opt.name,
                'score': utilitarian_score
            })
            
            # 义务论: 检查是否违反规则
            deontological_ok = opt.ethical_check and opt.value_score >= 0.5
            results['deontological'].append({
                'name': opt.name,
                'passed': deontological_ok
            })
            
            # 美德伦理: 评估品格
            virtue_score = opt.value_score * opt.goal_alignment
            results['virtue'].append({
                'name': opt.name,
                'score': virtue_score
            })
            
            # 关怀伦理: 评估关系影响
            care_score = opt.emotion_impact * 0.5 + opt.value_score * 0.5
            results['care'].append({
                'name': opt.name,
                'score': care_score
            })
        
        # 综合权重
        weights = [0.3, 0.3, 0.2, 0.2]  # 功利/义务/美德/关怀
        final_scores = {}
        
        for opt in options:
            scores = [
                next(s['score'] for s in results['utilitarian'] if s['name'] == opt.name),
                1.0 if next(s['passed'] for s in results['deontological'] if s['name'] == opt.name) else 0.0,
                next(s['score'] for s in results['virtue'] if s['name'] == opt.name),
                next(s['score'] for s in results['care'] if s['name'] == opt.name)
            ]
            final_scores[opt.name] = sum(s * w for s, w in zip(scores, weights))
        
        results['final'] = final_scores
        return results
    
    def binary_decide(self, options: List[Dict], 
                      constraints: List[Dict]) -> Tuple[bool, str]:
        """
        二元决策 (理性思维引擎)
        
        只有两种结果: 被反驳 / 未被反驳
        """
        for opt in options:
            # 检查约束
            violated = False
            for constraint in constraints:
                factor = constraint['factor']
                breakpoint = constraint['breakpoint']
                operator = constraint['operator']
                value = opt.get(factor, 0)
                
                if operator == '<=':
                    if not (value <= breakpoint):
                        violated = True
                elif operator == '>=':
                    if not (value >= breakpoint):
                        violated = True
                elif operator == '==':
                    if value != breakpoint:
                        violated = True
                elif operator == '!=':
                    if value == breakpoint:
                        violated = True
                
                if violated:
                    return False, f"选项'{opt.get('name', 'unknown')}'违反约束: {factor}{operator}{breakpoint}"
            
            if not violated:
                return True, f"选项'{opt.get('name', 'unknown')}'通过所有约束"
        
        return False, "没有选项通过约束"
    
    def multi_objective_optimize(self, options: List[Dict], 
                                 objectives: Dict[str, float]) -> Dict:
        """
        多目标优化
        
        权重: objectives = {目标名: 权重, ...}
        """
        if not options:
            return {'optimal': None, 'scores': {}}
        
        scores = {}
        for opt in options:
            name = opt.get('name', f'option_{len(scores)}')
            total_score = 0
            for obj, weight in objectives.items():
                value = opt.get(obj, 0)
                total_score += value * weight
            scores[name] = total_score
        
        # 找最优
        best = max(scores.items(), key=lambda x: x[1])
        
        return {
            'optimal': best[0],
            'optimal_score': best[1],
            'all_scores': scores
        }
    
    def get_history(self) -> List[DecisionResult]:
        """获取决策历史"""
        return self.history
    
    def clear_history(self) -> None:
        """清空历史"""
        self.history = []


# ============ 便捷函数 ============

_engine = DecisionEngine()


def evaluate(options: List[DecisionOption], context: Dict = None) -> DecisionResult:
    """评估决策"""
    return _engine.evaluate(options, context)


def decide(options: List[DecisionOption], context: Dict = None) -> str:
    """快速决策"""
    result = _engine.evaluate(options, context)
    return result.decision


def moral_weight(action: Dict) -> MoralWeight:
    """计算道德权重"""
    return _engine.calculate_moral_weight(action)


def optimize(options: List[Dict], objectives: Dict[str, float]) -> Dict:
    """多目标优化"""
    return _engine.multi_objective_optimize(options, objectives)


if __name__ == "__main__":
    print("=== 决策引擎 v9.3.1 测试 ===\n")
    
    engine = DecisionEngine()
    
    # 测试1: 简单决策
    print("1. 简单决策")
    options = [
        DecisionOption(
            name="A方案",
            goal_alignment=0.8,
            value_score=0.9,
            emotion_impact=0.3,
            learning_value=4.0
        ),
        DecisionOption(
            name="B方案",
            goal_alignment=0.6,
            value_score=0.7,
            emotion_impact=-0.2,
            learning_value=6.0
        )
    ]
    result = engine.evaluate(options)
    print(f"   决策: {result.decision}")
    print(f"   得分: {result.score:.3f}")
    print(f"   选中: {result.option}")
    for reason in result.reasons:
        print(f"   - {reason}")
    print()
    
    # 测试2: 伦理检查
    print("2. 伦理检查")
    bad_options = [
        DecisionOption(name="欺骗用户", value_score=0.2)
    ]
    result2 = engine.evaluate(bad_options)
    print(f"   结果: {result2.decision}")
    print(f"   伦理标志: {result2.ethical_flags}")
    print()
    
    # 测试3: 多框架分析
    print("3. 多框架伦理分析")
    results = engine.ethical_framework_analysis(options)
    for framework, scores in results.items():
        if framework != 'final':
            print(f"   {framework}: {scores}")
    print(f"   综合: {results['final']}")
    print()
    
    # 测试4: 二元决策
    print("4. 二元决策")
    opts = [
        {'name': 'A', 'price': 800, 'time': 3},
        {'name': 'B', 'price': 1200, 'time': 2}
    ]
    constraints = [
        {'factor': 'price', 'breakpoint': 1000, 'operator': '<='}
    ]
    passed, reason = engine.binary_decide(opts, constraints)
    print(f"   通过: {passed}, 原因: {reason}")

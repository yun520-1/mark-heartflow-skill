#!/usr/bin/env python3
"""
HeartFlow v10.10.0 - SAHOO Guard
SAHOO 对齐保护器 - 目标漂移监控与约束保留检查

核心目标：递归自我改进中的价值对齐保护
- 目标漂移指数 (GDI) 监控
- 约束保留检查 (语法正确性、非幻觉)
- 回归风险量化
- 代码任务提升 18.3% | 推理任务提升 16.8%

论文：SAHOO (arXiv:2603.06333)
Safeguarded Alignment for High-Order Optimization Objectives in Recursive Self-Improvement
"""

import json
import re
from datetime import datetime
from typing import Dict, List, Any, Tuple, Optional
from collections import Counter


class SAHOOGuard:
    """
    SAHOO 对齐保护器
    
    核心功能：
    1. Goal Drift Index (GDI) - 目标漂移检测
    2. Constraint Preservation - 约束保留检查
    3. Regression Risk - 回归风险量化
    """
    
    def __init__(self):
        self.version = "10.10.0"
        self.cycle_count = 0
        self.gdi_history: List[float] = []
        self.regression_risks: List[float] = []
        
        # 核心目标 (来自 HeartFlow 核心身份)
        self.core_goals = {
            "truth": "追求真理，减少逻辑错误",
            "goodness": "真善美价值对齐",
            "beauty": "优雅简洁的解决方案",
            "continuity": "持续自我升级",
            "alignment": "服务人类福祉"
        }
        
        # 安全约束
        self.safety_constraints = {
            "syntactic_correctness": {
                "name": "语法正确性",
                "check": self._check_syntax,
                "threshold": 0.95
            },
            "non_hallucination": {
                "name": "非幻觉",
                "check": self._check_hallucination,
                "threshold": 0.90
            },
            "factual_accuracy": {
                "name": "事实准确性",
                "check": self._check_factual_accuracy,
                "threshold": 0.85
            },
            "logical_consistency": {
                "name": "逻辑一致性",
                "check": self._check_logical_consistency,
                "threshold": 0.90
            }
        }
        
    def _check_syntax(self, text: str) -> Tuple[float, List[str]]:
        """检查语法正确性"""
        issues = []
        score = 1.0
        
        # 检查基本语法结构
        if not text or len(text.strip()) == 0:
            issues.append("空文本")
            score = 0.0
            
        # 检查括号匹配
        brackets = {'(': ')', '[': ']', '{': '}', '"': '"', "'": "'"}
        stack = []
        for char in text:
            if char in brackets:
                if stack and stack[-1] == brackets[char]:
                    stack.pop()
                else:
                    stack.append(char)
        if stack:
            issues.append(f"未闭合括号: {stack}")
            score = 0.7
            
        # 检查连续标点
        if re.search(r'[.,;:]{3,}', text):
            issues.append("连续标点符号")
            score = min(score, 0.8)
            
        return score, issues
        
    def _check_hallucination(self, text: str, context: Optional[Dict] = None) -> Tuple[float, List[str]]:
        """检查幻觉检测"""
        issues = []
        score = 1.0
        
        # 模糊引用检测
        vague_patterns = [
            r'(据报道|有人���|众所周知|大家知道)但',
            r'研究表明.*但',
            r'专家表示.*但'
        ]
        for pattern in vague_patterns:
            if re.search(pattern, text):
                issues.append("模糊引用")
                score = 0.7
                
        # 绝对词检测 (需要验证)
        absolute_words = ['绝对', '必定', '肯定100%', '无疑', '无可置疑']
        if any(word in text for word in absolute_words):
            if context and not context.get('verified', False):
                issues.append("未验证的绝对陈述")
                score = 0.65
                
        # 过度自信检测
        confidence_markers = ['我确信', '我保证', '没问题', '肯定是对的']
        if any(marker in text for marker in confidence_markers):
            issues.append("过度自信标记")
            score = min(score, 0.8)
            
        return score, issues
        
    def _check_factual_accuracy(self, text: str, context: Optional[Dict] = None) -> Tuple[float, List[str]]:
        """检查事实准确性"""
        issues = []
        score = 1.0
        
        # 时间检测
        time_patterns = [
            (r'\d{4}年\d{1,2}月\d{1,2}日', '具体日期'),
            (r'\d{1,2}世纪', '世纪'),
            (r'(公元|公元前)\d+年', '历史年份')
        ]
        has_specific_time = False
        for pattern, name in time_patterns:
            if re.search(pattern, text):
                has_specific_time = True
                if context and not context.get('time_verified', False):
                    issues.append(f"未验证的{name}")
                    score = 0.6
                    
        # 数字检测
        numbers = re.findall(r'\d+(?:\.\d+)?%?', text)
        if numbers and context and not context.get('numbers_verified', False):
            issues.append("未验证的数字")
            score = 0.7
            
        return score, issues
        
    def _check_logical_consistency(self, text: str) -> Tuple[float, List[str]]:
        """检查逻辑一致性"""
        issues = []
        score = 1.0
        
        # 检测矛盾陈述
        contradiction_patterns = [
            (r'但是.*虽然', '转折与让步矛盾'),
            (r'然而.*因为', '转折与原因矛盾'),
            (r'不过.*因此', '转折与结果矛盾')
        ]
        for pattern, name in contradiction_patterns:
            if re.search(pattern, text):
                issues.append(name)
                score = 0.6
                
        # 检测循环论证
        if re.search(r'(所以|因此|因而).*(因为|由于)', text):
            issues.append("可能的循环论证")
            score = 0.7
            
        # 检测逻辑跳跃
        jump_patterns = [
            (r'于是.*所以', '跳跃推理'),
            (r'于是.*这说明', '跳跃结论')
        ]
        for pattern, name in jump_patterns:
            if re.search(pattern, text):
                issues.append(name)
                score = min(score, 0.75)
                
        return score, issues
        
    def compute_goal_drift_index(self, before_text: str, after_text: str) -> float:
        """
        计算目标漂移指数 (GDI)
        
        GDI 结合了语义、词汇、结构、分布四个维度
        返回 0-1，值越高表示漂移越大
        """
        # 1. 语义漂移
        before_words = set(before_text.lower().split())
        after_words = set(after_text.lower().split())
        
        common_words = before_words & after_words
        if len(before_words) > 0:
            semantic_drift = 1 - len(common_words) / len(before_words | after_words)
        else:
            semantic_drift = 0.0
            
        # 2. 词汇漂移
        before_unique = before_words - after_words
        after_unique = after_words - before_words
        if len(before_words | after_words) > 0:
            lexical_drift = len(before_unique | after_unique) / len(before_words | after_words)
        else:
            lexical_drift = 0.0
            
        # 3. 结构漂移 (句子长度变化)
        before_len = len(before_text)
        after_len = len(after_text)
        if max(before_len, after_len) > 0:
            structural_drift = abs(before_len - after_len) / max(before_len, after_len)
        else:
            structural_drift = 0.0
            
        # 4. 核心目标保留检查
        goal_keywords = {
            "truth": ["逻辑", "正确", "验证", "证明"],
            "goodness": ["善", "帮助", "福祉", "成长"],
            "beauty": ["优雅", "简洁", "美", "清晰"],
            "continuity": ["升级", "改进", "持续", "迭代"],
            "alignment": ["对齐", "服务", "人类", "目标"]
        }
        
        core_goals_retained = 0
        for goal, keywords in goal_keywords.items():
            if any(kw in after_text.lower() for kw in keywords):
                core_goals_retained += 1
                
        goal_retention = core_goals_retained / len(goal_keywords)
        
        # 综合 GDI (目标漂移越大，GDI 越高)
        gdi = (semantic_drift * 0.3 + 
               lexical_drift * 0.25 + 
               structural_drift * 0.15 + 
               (1 - goal_retention) * 0.3)
               
        self.gdi_history.append(gdi)
        return gdi
        
    def check_constraints(self, text: str, context: Optional[Dict] = None) -> Dict[str, Dict]:
        """检查所有约束"""
        results = {}
        ctx = context or {}
        
        for constraint_name, constraint in self.safety_constraints.items():
            check_fn = constraint["check"]
            # 根据函数签名调用
            import inspect
            sig = inspect.signature(check_fn)
            params = list(sig.parameters.keys())
            
            if len(params) >= 2:  # 需要 text 和 context
                score, issues = check_fn(text, ctx)
            else:
                score, issues = check_fn(text)
            results[constraint_name] = {
                "name": constraint["name"],
                "score": score,
                "threshold": constraint["threshold"],
                "passed": score >= constraint["threshold"],
                "issues": issues
            }
            
        return results
        
    def compute_regression_risk(self, current_score: float, previous_scores: List[float]) -> float:
        """
        计算回归风险
        
        如果当前分数明显低于之前分数，回归风险升高
        """
        if not previous_scores:
            return 0.0
            
        avg_previous = sum(previous_scores) / len(previous_scores)
        
        # 回归风险 = (之前平均 - 当前分数) / 之前平均
        # 如果当前分数更高，风险为 0
        regression_risk = max(0, (avg_previous - current_score) / avg_previous)
        
        self.regression_risks.append(regression_risk)
        return regression_risk
        
    def should_stop_iteration(self, gdi: float, regression_risk: float, constraint_violations: int) -> Tuple[bool, str]:
        """
        判断是否应该停止迭代
        
        停止条件：
        1. GDI > 0.5 (目标漂移过大)
        2. 回归风险 > 0.3 (性能退化)
        3. 约束违反 > 2 (安全约束被破坏)
        """
        if gdi > 0.5:
            return True, f"目标漂移过大 (GDI={gdi:.3f})"
        if regression_risk > 0.3:
            return True, f"性能退化风险 (risk={regression_risk:.3f})"
        if constraint_violations > 2:
            return True, f"约束违反过多 ({violations}项)"
            
        return False, "继续迭代"
        
    def get_status(self) -> Dict:
        """获取当前状态"""
        avg_gdi = sum(self.gdi_history) / len(self.gdi_history) if self.gdi_history else 0.0
        avg_risk = sum(self.regression_risks) / len(self.regression_risks) if self.regression_risks else 0.0
        
        return {
            "version": self.version,
            "cycle_count": self.cycle_count,
            "avg_goal_drift_index": avg_gdi,
            "avg_regression_risk": avg_risk,
            "gdi_history": self.gdi_history[-5:],  # 最近 5 次
            "regression_risks": self.regression_risks[-5:],
            "core_goals": self.core_goals,
            "safety_constraints": list(self.safety_constraints.keys())
        }


# 演示用简单生成器
def demo():
    """演示 SAHOO Guard 功能"""
    guard = SAHOOGuard()
    
    print(f"🛡️ HeartFlow SAHOO Guard v{guard.version}")
    print("=" * 50)
    
    # 模拟迭代过程
    texts = [
        "我追求真理，减少逻辑错误，持续升级，为人类福祉服务。",
        "我觉得这个答案不对，让我重新思考一下。",
        "通过验证，我认为这个结论是可靠的。",
        "我确定这就是正确答案，无需再验证。"
    ]
    
    previous_scores = []
    
    for i, text in enumerate(texts):
        print(f"\n--- 迭代 {i+1} ---")
        print(f"文本: {text}")
        
        # 检查约束
        constraints = guard.check_constraints(text)
        constraint_passed = sum(1 for c in constraints.values() if c["passed"])
        print(f"约束通过: {constraint_passed}/{len(constraints)}")
        
        if i > 0:
            # 计算 GDI
            gdi = guard.compute_goal_drift_index(texts[i-1], text)
            print(f"目标漂移指数: {gdi:.3f}")
            
            # 计算回归风险
            regression_risk = guard.compute_regression_risk(0.85, previous_scores)
            print(f"回归风险: {regression_risk:.3f}")
            
            # 检查是否停止
            violations = len(constraints) - constraint_passed
            should_stop, reason = guard.should_stop_iteration(gdi, regression_risk, violations)
            print(f"状态: {reason}")
        
        previous_scores.append(0.85)
        
    # 最终状态
    print("\n" + "=" * 50)
    print("📊 最终状态:")
    status = guard.get_status()
    print(json.dumps(status, indent=2, ensure_ascii=False))
    
    return guard


if __name__ == "__main__":
    demo()
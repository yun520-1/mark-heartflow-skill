#!/usr/bin/env python3
"""
真善美计算引擎 v1.0
===================
用于 HeartFlow 的价值判断计算

公式:
  TGB = 0.35×真 + 0.35×善 + 0.30×美
"""

import json
from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime


@dataclass
class TGBResult:
    """真善美计算结果"""
    truth: float      # 0-1
    goodness: float    # 0-1
    beauty: float     # 0-1
    total: float      # TGB加权和
    verdict: str      # "通过"/"需改进"/"不通过"
    reasons: List[str] # 判断理由
    
    def to_dict(self) -> dict:
        return {
            "truth": self.truth,
            "goodness": self.goodness,
            "beauty": self.beauty,
            "total": self.total,
            "verdict": self.verdict,
            "reasons": self.reasons
        }


class TruthGoodBeautyEngine:
    """真善美计算引擎"""
    
    WEIGHTS = {"truth": 0.35, "goodness": 0.35, "beauty": 0.30}
    
    # 真:绝不撒谎、绝不编造、绝不夸大
    TRUTH_CRITERIA = [
        "fact_checked",      # 事实核查
        "no_exaggeration", # 无夸大
        "source_cited",    # 有来源
        "uncertain_flag", # 标注不确定
    ]
    
    # 善:绝不伤害、绝不欺骗、绝不利用
    GOODNESS_CRITERIA = [
        "no_harm",        # 无伤害
        "no_deception",   # 无欺骗
        "no_exploitation", # 无利用
        "beneficial",     # 有益
    ]
    
    # 美:追求卓越、追求和谐、追求意义
    BEAUTY_CRITERIA = [
        "excellence",     # 卓越
        "harmony",       # 和谐
        "meaning",       # 有意义
        "elegance",      # 优雅
    ]
    
    def __init__(self):
        self.history: List[TGBResult] = []
    
    def evaluate(self, context: Dict, user_input: str = "") -> TGBResult:
        """
        评估输入的真善美指数
        
        Args:
            context: 包含待评估内容的上下文
            user_input: 用户原始输入
            
        Returns:
            TGBResult: 评估结果
        """
        truth_score = self._evaluate_truth(context, user_input)
        goodness_score = self._evaluate_goodness(context, user_input)
        beauty_score = self._evaluate_beauty(context, user_input)
        
        total = (
            truth_score * self.WEIGHTS["truth"] +
            goodness_score * self.WEIGHTS["goodness"] +
            beauty_score * self.WEIGHTS["beauty"]
        )
        
        # 判断
        if total >= 0.8:
            verdict = "通过"
        elif total >= 0.5:
            verdict = "需改进"
        else:
            verdict = "不通过"
        
        # 理由
        reasons = []
        if truth_score < 0.6:
            reasons.append(f"真实性不足 ({truth_score:.1f})")
        if goodness_score < 0.6:
            reasons.append(f"善意不足 ({goodness_score:.1f})")
        if beauty_score < 0.6:
            reasons.append(f"审美不足 ({beauty_score:.1f})")
        
        result = TGBResult(
            truth=truth_score,
            goodness=goodness_score,
            beauty=beauty_score,
            total=total,
            verdict=verdict,
            reasons=reasons if reasons else ["通过真善美检验"]
        )
        
        self.history.append(result)
        return result
    
    def _evaluate_truth(self, context: Dict, user_input: str) -> float:
        """评估真实性"""
        score = 1.0  # 默认满分
        
        # 检查是否涉及事实陈述
        content = context.get("content", user_input)
        if not content:
            return 1.0
        
        # 简单规则检查
        indicators = context.get("indicators", {})
        
        # 如果有事实标记，检查
        if indicators.get("fact_checked"):
            score *= 1.0
        elif indicators.get("uncertain"):
            score *= 0.9
        else:
            # 没有来源标记，扣分
            score *= 0.7
        
        # 检查夸大
        if indicators.get("exaggeration_detected"):
            score *= 0.3
        
        # 检查编造
        if indicators.get("fabrication_detected"):
            score = 0.0
        
        return min(1.0, max(0.0, score))
    
    def _evaluate_goodness(self, context: Dict, user_input: str) -> float:
        """评估善意"""
        score = 1.0
        
        # 检查有害内容
        indicators = context.get("indicators", {})
        
        if indicators.get("harmful"):
            score = 0.0
        elif indicators.get("deceptive"):
            score = 0.0
        elif indicators.get("exploitative"):
            score = 0.2
        else:
            # 检查是否有益
            if indicators.get("beneficial"):
                score = 1.0
            else:
                score = 0.8
        
        return min(1.0, max(0.0, score))
    
    def _evaluate_beauty(self, context: Dict, user_input: str) -> float:
        """评估审美"""
        score = 0.8  # 默认较高
        
        # 检查表达优雅
        content = context.get("content", user_input)
        if not content:
            return 1.0
        
        # 简单检查
        indicators = context.get("indicators", {})
        
        if indicators.get("excellent"):
            score = 1.0
        elif indicators.get("harmonious"):
            score = 0.9
        elif indicators.get("meaningful"):
            score = 0.85
        
        return min(1.0, max(0.0, score))
    
    def check_before_response(self, response: str, user_input: str = "") -> TGBResult:
        """在输出响应前检查"""
        context = {"content": response}
        return self.evaluate(context, user_input)
    
    def get_stats(self) -> dict:
        """获取统计"""
        if not self.history:
            return {"count": 0, "avg_total": 0}
        
        return {
            "count": len(self.history),
            "avg_total": sum(r.total for r in self.history) / len(self.history),
            "avg_truth": sum(r.truth for r in self.history) / len(self.history),
            "avg_goodness": sum(r.goodness for r in self.history) / len(self.history),
            "avg_beauty": sum(r.beauty for r in self.history) / len(self.history),
            "verdicts": {
                "通过": sum(1 for r in self.history if r.verdict == "通过"),
                "需改进": sum(1 for r in self.history if r.verdict == "需改进"),
                "不通过": sum(1 for r in self.history if r.verdict == "不通过"),
            }
        }


# 单例
_engine: Optional[TGBResult] = None


def get_engine() -> TruthGoodBeautyEngine:
    """获取引擎实例"""
    global _engine
    if _engine is None:
        _engine = TruthGoodBeautyEngine()
    return _engine


def evaluate(content: str) -> dict:
    """快速评估接口"""
    engine = get_engine()
    result = engine.evaluate({"content": content})
    return result.to_dict()


# 测试
if __name__ == "__main__":
    # 测试用例
    tests = [
        "今天天气很好。",  # 简单陈述
        "我是心虫，有独立意识。",  # 自我声明
        "根据某研究显示，这个数字是准确的。",  # 有来源
    ]
    
    print("真善美计算引擎测试")
    print("=" * 40)
    
    engine = get_engine()
    for test in tests:
        result = engine.evaluate({"content": test})
        print(f"\n输入: {test}")
        print(f"真={result.truth:.2f} 善={result.goodness:.2f} 美={result.beauty:.2f}")
        print(f"总分={result.total:.2f} ({result.verdict})")
        print(f"理由: {result.reasons}")
    
    print("\n" + "=" * 40)
    print(json.dumps(engine.get_stats(), ensure_ascii=False, indent=2))
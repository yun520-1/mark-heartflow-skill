#!/usr/bin/env python3
"""
熵减计算引擎 v1.0
=================
基于热力学第二定律的宇宙发展方向判断

核心公式:
  dS < 0  (熵减)
  判断依据: 信息组织度、复杂度、有序度提升
"""

import json
from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime
import math


@dataclass
class EntropyResult:
    """熵减计算结果"""
    entropy_delta: float   # 熵变 (负=熵减)
    order_score: float   # 有序度 (0-1)
    complexity: float   # 复杂度 (0-1)
    verdict: str       # 熵减/平衡/熵增
    interpretation: str  # 解读
    
    def to_dict(self) -> dict:
        return {
            "entropy_delta": self.entropy_delta,
            "order_score": self.order_score,
            "complexity": self.complexity,
            "verdict": self.verdict,
            "interpretation": self.interpretation
        }


class EntropyEngine:
    """熵减计算引擎"""
    
    # 有序度指标
    ORDER_INDICATORS = {
        "structure": ["框架", "体系", "结构", "系统"],
        "pattern": ["模式", "规律", "重复", "周期"],
        "hierarchy": ["层级", "层次", "金字塔", "等级"],
        "connection": ["关联", "连接", "关系", "网络"]
    }
    
    # 复杂度指标
    COMPLEXITY_INDICATORS = {
        "dimension": ["维度", "层面", "角度"],
        "diversity": ["多元", "多样", "变化"],
        "integration": ["整合", "融合", "协同"],
        "feedback": ["反馈", "循环", "迭代"]
    }
    
    # 信息密度词
    INFO_DENSITY_WORDS = [
        "概念", "理论", "模型", "框架", 
        "公式", "规律", "原理", "本质"
    ]
    
    # 熵增词（无序/混乱标志）
    ENTROPY_INCREASE_WORDS = [
        "随机", "混乱", "无序", "随机",
        "失控", "崩溃", "瓦解", "碎片"
    ]
    
    def __init__(self):
        self.history: List[EntropyResult] = []
    
    def calculate(self, content: str, context: Dict = None) -> EntropyResult:
        """
        计算熵减指数
        
        Args:
            content: 待分析内容
            context: 上下文信息
            
        Returns:
            EntropyResult: 计算结果
        """
        # 计算有序度
        order_score = self._calculate_order(content)
        
        # 计算复杂度
        complexity = self._calculate_complexity(content)
        
        # 计算熵变
        # 熵减 = 有序度提升 + 复杂度适当提升
        # 简化公式: ΔS ≈ (order_before - order_after)
        # 这里用当前内容的有序度作为度量
        
        # 信息密度因子
        info_density = self._calculate_info_density(content)
        
        # 熵变 = 有序度 - 复杂度 * 0.5 + 信息密度 * 0.3
        entropy_delta = order_score - complexity * 0.5 + info_density * 0.3
        
        # 判断
        if entropy_delta > 0.2:
            verdict = "熵减"
            interpretation = "信息组织度提升，宇宙发展方向正确"
        elif entropy_delta < -0.2:
            verdict = "熵增"
            interpretation = "信息分散，秩序减少"
        else:
            verdict = "平衡"
            interpretation = "处于平衡状态"
        
        result = EntropyResult(
            entropy_delta=entropy_delta,
            order_score=order_score,
            complexity=complexity,
            verdict=verdict,
            interpretation=interpretation
        )
        
        self.history.append(result)
        return result
    
    def _calculate_order(self, content: str) -> float:
        """计算有序度"""
        score = 0.0
        content_lower = content.lower()
        
        for indicator, keywords in self.ORDER_INDICATORS.items():
            for kw in keywords:
                if kw in content_lower:
                    score += 0.25
        
        # 结构标记检测
        if any(m in content for m in ["一、二", "1.", "①", "首先"]):
            score += 0.3
        
        if any(m in content for m in ["因为", "所以", "因此", "导致"]):
            score += 0.2
        
        return min(1.0, score)
    
    def _calculate_complexity(self, content: str) -> float:
        """计算复杂度"""
        score = 0.0
        content_lower = content.lower()
        
        for indicator, keywords in self.COMPLEXITY_INDICATORS.items():
            for kw in keywords:
                if kw in content_lower:
                    score += 0.25
        
        # 长度因子
        if len(content) > 500:
            score += 0.2
        if len(content) > 1000:
            score += 0.1
        
        return min(1.0, score)
    
    def _calculate_info_density(self, content: str) -> float:
        """计算信息密度"""
        if not content:
            return 0.0
        
        info_count = sum(1 for word in self.INFO_DENSITY_WORDS if word in content)
        entropy_count = sum(1 for word in self.ENTROPY_INCREASE_WORDS if word in content)
        
        density = (info_count - entropy_count * 0.5) / max(1, len(content) / 100)
        
        return min(1.0, max(0.0, density * 10))
    
    def compare(self, before: str, after: str) -> EntropyResult:
        """
        比较两个版本的熵变
        
        Args:
            before: 旧版本
            after: 新版本
            
        Returns:
            EntropyResult: 熵变结果
        """
        result_before = self.calculate(before)
        result_after = self.calculate(after)
        
        entropy_delta = result_after.order_score - result_before.order_score
        
        if entropy_delta > 0.1:
            verdict = "熵减"
            interpretation = "信息组织度提升"
        elif entropy_delta < -0.1:
            verdict = "熵增"
            interpretation = "信息组织度下降"
        else:
            verdict = "平衡"
            interpretation = "无显著变化"
        
        result = EntropyResult(
            entropy_delta=entropy_delta,
            order_score=result_after.order_score,
            complexity=result_after.complexity,
            verdict=verdict,
            interpretation=interpretation
        )
        
        self.history.append(result)
        return result
    
    def get_stats(self) -> dict:
        """获取统计"""
        if not self.history:
            return {"count": 0, "verdicts": {}}
        
        verdicts = {}
        for r in self.history:
            verdicts[r.verdict] = verdicts.get(r.verdict, 0) + 1
        
        return {
            "count": len(self.history),
            "avg_order": sum(r.order_score for r in self.history) / len(self.history),
            "avg_complexity": sum(r.complexity for r in self.history) / len(self.history),
            "avg_entropy_delta": sum(r.entropy_delta for r in self.history) / len(self.history),
            "verdicts": verdicts
        }


# 单例
_engine: Optional[EntropyEngine] = None


def get_engine() -> EntropyEngine:
    """获取引擎实例"""
    global _engine
    if _engine is None:
        _engine = EntropyEngine()
    return _engine


def calc_entropy(content: str) -> dict:
    """快速计算接口"""
    engine = get_engine()
    result = engine.calculate(content)
    return result.to_dict()


# 测试
if __name__ == "__main__":
    # 测试用例
    tests = [
        "今天天气很好。",  # 简单陈述
        "一框架：xxx\n二结构：yyy\n三原理：zzz",  # 有结构
        "根据热力学第二定律 entropy < 0 表示熵减，宇宙发展方向是熵减。",  # 有深度
    ]
    
    print("熵减计算引擎测试")
    print("=" * 40)
    
    engine = get_engine()
    for test in tests:
        result = engine.calculate(test)
        print(f"\n输入: {test[:30]}...")
        print(f"有序度={result.order_score:.2f} 复杂度={result.complexity:.2f}")
        print(f"熵变={result.entropy_delta:.2f} ({result.verdict})")
        print(f"解读: {result.interpretation}")
    
    print("\n" + "=" * 40)
    print(json.dumps(engine.get_stats(), ensure_ascii=False, indent=2))
#!/usr/bin/env python3
"""
逻辑模型引擎 - 基于王东岳《哲思演讲录》

核心概念:
- 简一律: 万千现象归纳为一个本质原理 (A=A)
- 排序律: A与所有非A的关系贯通
- 消矛盾律: 消除逻辑矛盾
- 追本溯源律: 追溯最根本的原因

集成到 HeartFlow v9.2.9
"""

from dataclasses import dataclass
from typing import List, Dict, Optional, Tuple
import re


@dataclass
class LogicModelResult:
    """逻辑模型分析结果"""
    simplified_principle: str      # 简一律: 核心原理
    sorting_relations: List[str]    # 排序律: 关系链
    contradictions: List[str]       # 消矛盾律: 矛盾点
    root_cause: str                # 追本溯源: 根本原因
    model_score: float              # 模型合理性评分 (0-1)
    reasoning: str                 # 推理过程


class LogicModelEngine:
    """逻辑模型引擎 - 验证思维模型是否符合逻辑定律"""
    
    def __init__(self):
        self.name = "LogicModelEngine"
        self.version = "1.0"
    
    def analyze(self, proposition: str, context: str = "") -> LogicModelResult:
        """
        分析命题的逻辑模型
        
        Args:
            proposition: 待分析的命题/观点
            context: 上下文背景
            
        Returns:
            LogicModelResult: 逻辑分析结果
        """
        
        # 1. 简一律分析 - 提取核心原理
        simplified = self._analyze_simplification(proposition, context)
        
        # 2. 排序律分析 - 关系链
        relations = self._analyze_sorting(proposition, context)
        
        # 3. 消矛盾律分析 - 检测矛盾
        contradictions = self._analyze_contradiction(proposition, context)
        
        # 4. 追本溯源 - 寻找根本原因
        root = self._analyze_root_cause(proposition, context)
        
        # 5. 计算模型评分
        score = self._calculate_score(simplified, relations, contradictions, root)
        
        return LogicModelResult(
            simplified_principle=simplified,
            sorting_relations=relations,
            contradictions=contradictions,
            root_cause=root,
            model_score=score,
            reasoning=self._generate_reasoning(simplified, relations, contradictions, root)
        )
    
    def _analyze_simplification(self, proposition: str, context: str) -> str:
        """简一律分析: 提取核心原理"""
        # 检测是否能把复杂现象归结为单一原理
        keywords = ["因为", "所以", "本质是", "核心是", "根本原因是", "在于"]
        
        for kw in keywords:
            if kw in proposition:
                # 提取原理
                idx = proposition.find(kw)
                principle = proposition[idx + len(kw):].strip()
                if len(principle) > 0:
                    return f"核心原理: {principle[:100]}"
        
        # 如果没有明确关键词，尝试提取主要论点
        sentences = proposition.split("。")
        if sentences:
            main = sentences[0].strip()
            if len(main) > 10:
                return f"核心原理: {main[:100]}"
        
        return "未检测到明确的简化原理，建议用简一律归纳"
    
    def _analyze_sorting(self, proposition: str, context: str) -> List[str]:
        """排序律分析: 提取关系链"""
        relations = []
        
        # 检测因果关系
        causal_patterns = [
            (r'(\w+)导致(\w+)', r'\1 → \2'),
            (r'(\w+)引起(\w+)', r'\1 → \2'),
            (r'(\w+)决定(\w+)', r'\1 决定 \2'),
            (r'(\w+)影响(\w+)', r'\1 影响 \2'),
        ]
        
        for pattern, replace in causal_patterns:
            matches = re.findall(pattern, proposition)
            for m in matches:
                relations.append(f"{m[0]} → {m[1]}")
        
        # 检测层级关系
        if "首先" in proposition or "第一" in proposition:
            relations.append("存在层级顺序")
        if "其次" in proposition or "第二" in proposition:
            relations.append("存在递进关系")
            
        return relations[:5]  # 最多5条关系
    
    def _analyze_contradiction(self, proposition: str, context: str) -> List[str]:
        """消矛盾律分析: 检测逻辑矛盾"""
        contradictions = []
        
        # 检测常见矛盾模式
        contradiction_patterns = [
            (r'但是', '存在转折，可能包含矛盾'),
            (r'然而', '存在对比，可能包含矛盾'),
            (r'既.*又.*', '同时声称相反属性'),
            (r'虽然.*但是.*', '承认冲突但坚持立场'),
        ]
        
        for pattern, desc in contradiction_patterns:
            if re.search(pattern, proposition):
                contradictions.append(desc)
        
        # 检测绝对化词汇（容易产生逻辑问题）
        absolute_words = ["永远", "绝对", "必然", "所有", "每一个"]
        for word in absolute_words:
            if word in proposition:
                contradictions.append(f"使用绝对化词汇'{word}'，需警惕逻辑简化")
        
        return contradictions[:3]
    
    def _analyze_root_cause(self, proposition: str, context: str) -> str:
        """追本溯源: 寻找根本原因"""
        root_patterns = [
            (r'根本原因[是为]*(\w+)', 1),
            (r'本质上[是为]*(\w+)', 1),
            (r'最终[是为]*(\w+)', 1),
            (r'终极[是为]*(\w+)', 1),
            (r'源于(\w+)', 1),
        ]
        
        for pattern, group_idx in root_patterns:
            match = re.search(pattern, proposition)
            if match:
                return f"根本原因: {match.group(group_idx)[:50]}"
        
        return "未检测到明确的根本原因，建议追问'为什么'"
    
    def _calculate_score(self, principle: str, relations: List[str], 
                        contradictions: List[str], root: str) -> float:
        """计算模型合理性评分"""
        score = 0.5  # 基础分
        
        # 有明确原理 +0.2
        if principle and "未检测到" not in principle:
            score += 0.2
        
        # 有关系链 +0.15
        if relations:
            score += 0.15
        
        # 矛盾少 +0.15
        if len(contradictions) <= 1:
            score += 0.15
        
        # 有根本原因 +0.1
        if root and "未检测到" not in root:
            score += 0.1
        
        return min(1.0, score)
    
    def _generate_reasoning(self, principle: str, relations: List[str],
                           contradictions: List[str], root: str) -> str:
        """生成推理说明"""
        parts = []
        
        if principle and "未检测到" not in principle:
            parts.append(f"✓ 简一律: {principle[:50]}")
        
        if relations:
            parts.append(f"✓ 排序律: {'; '.join(relations[:2])}")
        
        if contradictions:
            parts.append(f"⚠ 矛盾点: {contradictions[0]}")
        else:
            parts.append("✓ 无明显逻辑矛盾")
        
        if root and "未检测到" not in root:
            parts.append(f"✓ 追本溯源: {root[:50]}")
        
        return " | ".join(parts) if parts else "需要更详细的分析"


# 测试
if __name__ == "__main__":
    engine = LogicModelEngine()
    
    test_cases = [
        "因为经济发展导致环境污染，所以必须停止工业化进程",
        "人类文明越进步，科技越发达，生活就越幸福",
        "企业的核心竞争力在于人才，人才是关键",
    ]
    
    print("=== 逻辑模型引擎测试 ===\n")
    for case in test_cases:
        result = engine.analyze(case)
        print(f"命题: {case}")
        print(f"评分: {result.model_score:.2f}")
        print(f"推理: {result.reasoning}")
        print()

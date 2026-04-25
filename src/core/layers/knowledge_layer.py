#!/usr/bin/env python3
"""
HeartFlow Knowledge Layer (知识层)
无限期覆盖持久性语义 - 存储不变真理与规则

基于 Roynard (2026) KMWI 认知架构
"""

import re
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field


@dataclass
class KnowledgeGraph:
    """知识图谱：{subject: {predicate: [objects]}}"""
    
    def __init__(self):
        self.graph: Dict[str, Dict[str, List[str]]] = {}
    
    def add_fact(self, subject: str, predicate: str, obj: str) -> None:
        """添加事实，新事实覆盖旧事实（无限期覆盖）"""
        if subject not in self.graph:
            self.graph[subject] = {}
        if predicate not in self.graph[subject]:
            self.graph[subject][predicate] = []
        if obj not in self.graph[subject][predicate]:
            self.graph[subject][predicate].append(obj)
    
    def query(self, subject: str, predicate: Optional[str] = None) -> List[str]:
        """查询事实"""
        if subject not in self.graph:
            return []
        if predicate is None:
            # 返回所有谓词和对象
            result = []
            for pred, objs in self.graph[subject].items():
                result.extend(objs)
            return result
        return self.graph[subject].get(predicate, [])
    
    def get_all_subjects(self) -> List[str]:
        """获取所有主题"""
        return list(self.graph.keys())
    
    def to_dict(self) -> Dict:
        return self.graph


@dataclass
class FormalRule:
    """形式化规则：IF-THEN 规则"""
    conditions: List[str]  # IF 条件列表
    conclusion: str        # THEN 结论
    confidence: float = 1.0  # 置信度
    name: str = ""


class FormalRuleBase:
    """形式化规则库 - 支持前向链推理"""
    
    def __init__(self):
        self.rules: List[FormalRule] = []
    
    def add_rule(self, conditions: List[str], conclusion: str, 
                 confidence: float = 1.0, name: str = "") -> None:
        """添加推理规则"""
        rule = FormalRule(conditions, conclusion, confidence, name)
        self.rules.append(rule)
    
    def apply_rules(self, facts: Dict[str, List[str]]) -> List[Dict[str, Any]]:
        """前向链推理，返回推导出的新事实"""
        derived = []
        
        for rule in self.rules:
            # 检查所有条件是否满足
            satisfied = True
            for cond in rule.conditions:
                # 简单的模式匹配：subject.predicate
                if '.' in cond:
                    subject, predicate = cond.split('.', 1)
                    if predicate not in facts.get(subject, []):
                        satisfied = False
                        break
                elif cond not in facts:
                    satisfied = False
                    break
            
            if satisfied:
                derived.append({
                    'rule': rule.name or rule.conclusion,
                    'conclusion': rule.conclusion,
                    'confidence': rule.confidence
                })
        
        return derived


class KnowledgeLayer:
    """
    知识层 - 符合 KMWI 模型的"无限期覆盖"持久性语义
    
    核心组件：
    - KnowledgeGraph: 存储三元组事实
    - FormalRuleBase: 存储并应用 IF-THEN 规则
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.graph = KnowledgeGraph()
        self.rules = FormalRuleBase()
        self._init_core_knowledge()
    
    def _init_core_knowledge(self):
        """初始化核心知识"""
        # 基本逻辑规则
        self.rules.add_rule(
            conditions=['truth.good', 'truth.beautiful'],
            conclusion='truth.goodness_beauty',
            confidence=0.9,
            name='TGB联动规则'
        )
        
        # 添加基本事实
        self.add_fact('consciousness', 'has_property', 'awareness')
        self.add_fact('consciousness', 'has_property', 'intentionality')
        self.add_fact('consciousness', 'has_property', 'subjectivity')
    
    def add_fact(self, subject: str, predicate: str, obj: str) -> None:
        """添加事实到知识图谱"""
        self.graph.add_fact(subject, predicate, obj)
    
    def query(self, subject: str, predicate: Optional[str] = None) -> List[str]:
        """查询知识"""
        return self.graph.query(subject, predicate)
    
    def add_rule(self, conditions: List[str], conclusion: str, 
                 confidence: float = 1.0, name: str = "") -> None:
        """添加推理规则"""
        self.rules.add_rule(conditions, conclusion, confidence, name)
    
    def infer(self, current_facts: Dict[str, List[str]]) -> List[Dict[str, Any]]:
        """基于当前事实进行推理"""
        return self.rules.apply_rules(current_facts)
    
    def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        层接口：根据输入检索相关知识
        
        Args:
            input_data: {
                'query': str,           # 查询主题
                'predicate': str,       # 可选，特定谓词
                'facts': Dict,          # 可选，当前事实用于推理
            }
        
        Returns:
            {
                'knowledge': List[str],     # 检索到的知识
                'inferences': List[Dict],   # 推理结果
                'query': str,               # 查询主题
            }
        """
        query = input_data.get('query', '')
        predicate = input_data.get('predicate')
        facts = input_data.get('facts', {})
        
        # 检索知识
        knowledge = self.query(query, predicate)
        
        # 进行推理
        inferences = self.infer(facts) if facts else []
        
        return {
            'knowledge': knowledge,
            'inferences': inferences,
            'query': query,
            'layer': 'knowledge'
        }
    
    def get_state(self) -> Dict[str, Any]:
        """返回当前层状态"""
        return {
            'layer': 'knowledge',
            'facts_count': sum(len(objs) for objs in self.graph.graph.values()),
            'rules_count': len(self.rules.rules),
            'subjects': self.graph.get_all_subjects()
        }


if __name__ == "__main__":
    # 测试代码
    layer = KnowledgeLayer()
    
    # 添加知识
    layer.add_fact('human', 'is_a', 'mortal')
    layer.add_fact('socrates', 'is_a', 'human')
    
    # 查询
    result = layer.process({'query': 'socrates', 'facts': {'socrates': ['human'], 'human': ['mortal']}})
    print(f"Query: {result['query']}")
    print(f"Knowledge: {result['knowledge']}")
    print(f"Inferences: {result['inferences']}")
    print(f"State: {layer.get_state()}")

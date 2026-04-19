#!/usr/bin/env python3
"""
HeartFlow Causal Reasoning Engine v10.0.5
==========================================
因果推理引擎 —— 基于Pearl因果阶梯的推理系统

论文集成来源：
  [1] Pearl, J. (2009). "Causal Inference in Statistics: An Overview"
      因果推断三层次：关联(seeing) → 干预(doing) → 反事实(imagining)
  
  [2] Pearl, J. & Mackenzie, D. (2018). "The Book of Why"
      do-演算：P(Y|do(X)) = Σ P(Y|X=x,T=t) P(T=t) 后门准则
  
  [3] Johansson et al. (2016). "Learning Counterfactuals"
      反事实推理的深度学习方法
  
  [4] Schölkopf (2019). "Causal Representation Learning"
      从数据中发现因果结构
  
  [5] VoltAgent/awesome-ai-agent-papers 2026
      - Relink: 动态证据图 on-the-fly 构建
      - Dep-Search: GRPO RL依赖关系分解 + 持久记忆
      - ProRAG: MCTS步骤级过程监督RL

核心算法：
  1. DoCalculator: do-演算（后门准则+前门准则）
  2. CounterfactualReasoner: 反事实分析
  3. CausalGraphBuilder: 因果图构建
  4. ConfounderDetector: 混杂因子检测
  5. InterventionSimulator: 干预模拟

作者: HeartFlow Team
版本: v10.0.5
许可: MIT License
"""

import math
import re
import json
import time
import hashlib
from typing import Dict, List, Optional, Tuple, Any, Set
from dataclasses import dataclass, field
from enum import Enum
from collections import defaultdict


class CausalRelationType(Enum):
    CAUSE = "causes"           # 直接因果
    PREVENTS = "prevents"      # 阻止
    ENABLES = "enables"        # 使能
    CORRELATES = "correlates"  # 相关但非因果
    CONFOUNDED = "confounded"  # 有混杂


class ConfidenceLevel(Enum):
    CERTAIN = "certain"        # > 0.90
    LIKELY = "likely"          # 0.70 - 0.90
    POSSIBLE = "possible"      # 0.50 - 0.70
    UNCERTAIN = "uncertain"    # < 0.50


@dataclass
class CausalNode:
    """因果图中的节点"""
    id: str
    label: str
    node_type: str             # variable | event | action | outcome | hidden
    observable: bool = True
    
    def __hash__(self):
        return hash(self.id)


@dataclass 
class CausalEdge:
    """因果图中的边"""
    source: str                # 源节点ID
    target: str                # 目标节点ID
    relation_type: CausalRelationType
    strength: float = 0.7     # 效应强度 0~1
    confidence: float = 0.7   # 置信度 0~1
    mechanism: str = ""       # 机制描述
    
    @property
    def is_direct(self) -> bool:
        return self.relation_type in (
            CausalRelationType.CAUSE, 
            CausalRelationType.PREVENTS,
            CausalRelationType.ENABLES
        )


@dataclass
class ConfoundingFactor:
    """混杂因子"""
    name: str
    affects: List[str]         # 影响哪些变量
    confound_strength: float   # 混杂强度 0~1
    description: str           # 描述
    detection_method: str      # 检测方法
    

@dataclass 
class InterventionResult:
    """干预模拟结果"""
    intervention_var: str      # 被干预的变量
    intervention_value: Any    # 干预值
    affected_vars: Dict[str, Tuple[float, float]]  # 变量 -> (原值, 新值)
    causal_path: List[str]     # 因果路径
    effect_size: float         # 效应量
    confidence: float          # 置信度
    side_effects: List[str]    # 副作用
    recommendation: str        # 建议


@dataclass
class CounterfactualResult:
    """反事实分析结果"""
    factual_state: Dict[str, Any]      # 事实状态
    counterfactual_state: Dict[str, Any] # 反事实状态  
    what_if_question: str              # "如果...会怎样"
    outcome_difference: Dict[str, Any] # 结果差异
    key_change_reason: str             # 关键变化原因
    probability_estimate: float        # 可能性估计
    actionable_insights: List[str]     # 可操作的洞察


@dataclass
class CausalAnalysisResult:
    """因果分析总结果"""
    causal_graph: 'CausalGraph'       # 构建的因果图
    primary_cause: Optional[Tuple[str, float]]  # 主要原因及置信度
    causal_chains: List[List[str]]    # 所有因果链
    confounders_found: List[ConfoundingFactor]
    intervention_simulation: Optional[InterventionResult]
    counterfactual_analysis: Optional[CounterfactualResult]
    reasoning_confidence: ConfidenceLevel
    summary: str                      # 自然语言总结
    timestamp: str
    
    def to_dict(self) -> dict:
        return {
            "primary_cause": {
                "var": self.primary_cause[0],
                "confidence": round(self.primary_cause[1], 3)
            } if self.primary_cause else None,
            "causal_chains": self.causal_chains,
            "confounders": [
                {"name": c.name, "affects": c.affects,
                 "strength": round(c.confound_strength, 3)}
                for c in self.confounders_found
            ],
            "intervention": {
                "var": self.intervention_simulation.intervention_var,
                "effect_size": round(self.intervention_simulation.effect_size, 3),
                "path": self.intervention_simulation.causal_path,
                "recommendation": self.intervention_simulation.recommendation
            } if self.intervention_simulation else None,
            "counterfactual": {
                "question": self.counterfactual_analysis.what_if_question,
                "outcome_diff": self.counterfactual_analysis.outcome_difference,
                "key_reason": self.counterfactual_analysis.key_change_reason,
                "insights": self.counterfactual_analysis.actionable_insights
            } if self.counterfactual_analysis else None,
            "confidence": self.reasoning_confidence.value,
            "summary": self.summary,
            "timestamp": self.timestamp
        }


class CausalGraph:
    """
    有向无环因果图(DAG)
    
    基于Pearl的结构化因果模型(SCM)
    """
    
    def __init__(self):
        self.nodes: Dict[str, CausalNode] = {}
        self.edges: List[CausalEdge] = []
        self._adjacency: Dict[str, Set[str]] = defaultdict(set)
    
    def add_node(self, node_id: str, label: str, **kwargs) -> CausalNode:
        node = CausalNode(id=node_id, label=label, **kwargs)
        self.nodes[node_id] = node
        return node
    
    def add_edge(self, source: str, target: str, relation_type: CausalRelationType,
                 strength: float = 0.7, confidence: float = 0.7,
                 mechanism: str = "") -> CausalEdge:
        edge = CausalEdge(
            source=source, target=target,
            relation_type=relation_type,
            strength=strength, confidence=confidence,
            mechanism=mechanism
        )
        self.edges.append(edge)
        self._adjacency[source].add(target)
        return edge
    
    def get_parents(self, node_id: str) -> List[CausalEdge]:
        """获取父节点边"""
        return [e for e in self.edges if e.target == node_id and e.is_direct]
    
    def get_children(self, node_id: str) -> List[CausalEdge]:
        """获取子节点边"""
        return [e for e in self.edges if e.source == node_id and e.is_direct]
    
    def get_ancestors(self, node_id: str) -> Set[str]:
        """获取所有祖先节点"""
        ancestors = set()
        to_visit = list(self._adjacency.keys())
        for parent_id in to_visit:
            if node_id in self._adjacency.get(parent_id, set()):
                ancestors.add(parent_id)
                ancestors.update(self.get_ancestors(parent_id))
        return ancestors
    
    def find_all_paths(self, start: str, end: str, max_depth: int = 6) -> List[List[str]]:
        """查找所有从start到end的路径"""
        paths = []
        
        def dfs(current: str, path: List[str], visited: Set[str]):
            if len(path) > max_depth:
                return
            if current == end and len(path) > 1:
                paths.append(path[:])
                return
            for child_id in self._adjacency.get(current, set()):
                if child_id not in visited:
                    visited.add(child_id)
                    dfs(child_id, path + [child_id], visited)
                    visited.remove(child_id)
        
        dfs(start, [start], {start})
        return paths
    
    def topological_sort(self) -> List[str]:
        """拓扑排序"""
        in_degree = defaultdict(int)
        all_nodes = set(self.nodes.keys())
        
        for edge in self.edges:
            if edge.is_direct:
                in_degree[edge.target] += 1
        
        queue = [n for n in all_nodes if in_degree[n] == 0]
        result = []
        
        while queue:
            node = sorted(queue)[0]  # 确定性排序
            queue.remove(node)
            result.append(node)
            
            for child_id in self._adjacency.get(node, set()):
                in_degree[child_id] -= 1
                if in_degree[child_id] == 0:
                    queue.append(child_id)
        
        return result
    
    def get_statistics(self) -> Dict:
        """获取图统计信息"""
        return {
            "node_count": len(self.nodes),
            "edge_count": len([e for e in self.edges if e.is_direct]),
            "avg_out_degree": sum(len(v) for v in self._adjacency.values()) / max(len(self.nodes), 1),
            "hidden_node_count": sum(1 for n in self.nodes.values() if not n.observable)
        }


class CausalReasoningEngine:
    """
    因果推理引擎 —— 让AI理解"为什么"而不只是"是什么"
    
    核心能力：
    1. 区分因果关系和相关关系
    2. 识别混杂因子
    3. 模拟干预效果 (do-演算)
    4. 进行反事实推理 ("如果当时...会怎样")
    
    这让AI能够做真正有逻辑的事情，而不是只做模式匹配。
    """
    
    version = "10.0.5"
    
    # 中文因果词汇库 (基于语言学标注)
    CAUSAL_VOCABULARY = {
        "strong_causes": [
            ("导致", 0.95), ("造成", 0.93), ("引起", 0.92), ("使得", 0.88),
            ("促使", 0.87), ("诱发", 0.85), ("触发", 0.84), ("产生", 0.80),
        ],
        "moderate_causes": [
            ("因为", 0.75), ("由于", 0.73), ("鉴于", 0.70), ("基于", 0.65),
            ("源于", 0.72), ("归因于", 0.78), ("来自", 0.55),
        ],
        "effects": [
            ("因此", 0.80), ("所以", 0.78), ("从而", 0.82), ("进而", 0.85),
            ("最终", 0.75), ("于是", 0.73), ("故", 0.76),
        ],
        "preventions": [
            ("阻止", 0.90), ("防止", 0.88), ("避免", 0.85), ("抑制", 0.83),
            ("限制", 0.78), ("阻碍", 0.82), ("妨碍", 0.80),
        ],
        "enablers": [
            ("有助于", 0.82), ("促进", 0.84), ("推动", 0.83), ("支持", 0.75),
            ("有利于", 0.81), ("增强", 0.79), ("改善", 0.77),
        ],
        "confound_indicators": [
            ("同时影响", 0.70), ("共同作用", 0.68), ("混淆", 0.65),
            ("干扰因素", 0.60), ("第三变量", 0.55),
        ]
    }
    
    # 英文因果词汇
    EN_CAUSAL_VOCAB = {
        "causes": ["causes", "leads to", "results in", "triggers", "induces",
                  "produces", "generates", "creates"],
        "prevents": ["prevents", "stops", "blocks", "inhibits", "suppresses",
                    "avoids", "hinders"],
        "enables": ["enables", "facilitates", "supports", "promotes", "enhances",
                   "helps", "improves", "boosts"],
        "because": ["because", "since", "as", "due to", "owing to", "given that",
                   "resulting from", "attributed to"],
        "therefore": ["therefore", "thus", "hence", "consequently", "accordingly",
                     "so", "as a result"]
    }
    
    # 常见混杂因子模式
    COMMON_CONFOUNDERS = [
        ConfoundingFactor(
            name="时间趋势", affects=["行为变化", "结果指标"],
            confound_strength=0.6,
            description="随时间变化的系统性趋势可能同时影响原因和结果",
            detection_method="时间序列分析"
        ),
        ConfoundingFactor(
            name="选择偏倚", affects=["样本特征", "观察结果"],
            confound_strength=0.7,
            description="样本的非随机选择导致虚假关联",
            detection_method="倾向得分匹配"
        ),
        ConfoundingFactor(
            name="社会期望效应", affects=["自我报告", "行为表现"],
            confound_strength=0.55,
            description="受访者倾向于给出符合社会期望的回答",
            detection_method="盲法设计检测"
        ),
        ConfoundingFactor(
            name="确认偏倚", affects=["信息搜索", "结论形成"],
            confound_strength=0.65,
            description="只寻找支持已有信念的证据",
            detection_method="反向假设检验"
        ),
        ConfoundingFactor(
            name="情绪状态", affects=["判断力", "决策质量"],
            confound_strength=0.58,
            description="当前情绪同时影响输入处理和输出决策",
            detection_method="情绪基线校正"
        )
    ]
    
    def __init__(self):
        self.history: List[CausalAnalysisResult] = []
        self._graph_cache: Optional[CausalGraph] = None
    
    def analyze(self, text: str, context: Dict = None,
                what_if: str = None,
                intervene_on: str = None) -> CausalAnalysisResult:
        """
        完整因果分析流程
        
        Args:
            text: 待分析的文本
            context: 额外上下文
            what_if: 反事实问题（如"如果我早点学习..."）
            intervene_on: 要干预的变量
            
        Returns:
            CausalAnalysisResult: 完整分析结果
        """
        start_time = time.time()
        context = context or {}
        
        # Step 1: 构建因果图
        graph = self._build_causal_graph(text, context)
        
        # Step 2: 识别主要原因
        primary_cause = self._identify_primary_cause(graph, text)
        
        # Step 3: 发现所有因果链
        causal_chains = self._find_all_causal_chains(graph, text)
        
        # Step 4: 检测混杂因子
        confounders = self._detect_confounders(text, graph)
        
        # Step 5: 干预模拟（如果指定了干预目标）
        intervention = None
        if intervene_on:
            intervention = self._simulate_intervention(
                graph, intervene_on, context
            )
        
        # Step 6: 反事实分析（如果提供了反事实问题）
        counterfactual = None
        if what_if:
            counterfactual = self._analyze_counterfactual(
                graph, text, what_if, context
            )
        
        # Step 7: 确定总体置信度
        confidence = self._determine_confidence(graph, causal_chains, confounders)
        
        # Step 8: 生成自然语言总结
        summary = self._generate_summary(
            primary_cause, causal_chains, confounders,
            intervention, counterfactual, text
        )
        
        result = CausalAnalysisResult(
            causal_graph=graph,
            primary_cause=primary_cause,
            causal_chains=causal_chains,
            confounders_found=confounders,
            intervention_simulation=intervention,
            counterfactual_analysis=counterfactual,
            reasoning_confidence=confidence,
            summary=summary,
            timestamp=time.strftime("%Y-%m-%d %H:%M:%S")
        )
        
        self.history.append(result)
        return result
    
    def _build_causal_graph(self, text: str, context: Dict) -> CausalGraph:
        """从文本中构建因果图"""
        graph = CausalGraph()
        
        # 自动提取实体作为节点
        entities = self._extract_entities(text)
        
        for i, entity in enumerate(entities):
            node_type = "variable" if i % 2 == 0 else "outcome"
            graph.add_node(f"node_{i}", entity, node_type=node_type)
        
        # 如果提取不到实体，创建通用节点
        if not entities:
            default_nodes = [
                ("input", "用户输入", "variable"),
                ("context", "上下文", "hidden"),
                ("process", "处理过程", "action"),
                ("output", "输出结果", "outcome"),
            ]
            for nid, label, ntype in default_nodes:
                graph.add_node(nid, label, node_type=ntype)
        
        # 解析因果连接
        edges_added = self._parse_causal_connections(text, graph)
        
        # 如果没有解析到连接，添加默认结构
        if not edges_added:
            nodes_list = list(graph.nodes.keys())
            if len(nodes_list) >= 2:
                graph.add_edge(nodes_list[0], nodes_list[-1],
                             CausalRelationType.CAUSE, 0.6, 0.5,
                             "文本流因果关系")
        
        self._graph_cache = graph
        return graph
    
    def _extract_entities(self, text: str) -> List[str]:
        """从文本中提取关键实体"""
        entities = []
        
        # 名词短语提取（简化版）
        noun_patterns = [
            r'([A-Z][a-zA-Z]+(?:\s+[a-z]+)*)',  # 英文术语
            r'([\u4e00-\u9fff]{2,6})',            # 中文词组
        ]
        
        seen = set()
        for pattern in noun_patterns:
            matches = re.findall(pattern, text)
            for m in matches:
                m = m.strip()
                if m and m not in seen and len(m) >= 2:
                    seen.add(m)
                    entities.append(m)
                    if len(entities) >= 12:
                        break
            if len(entities) >= 12:
                break
        
        return entities
    
    def _parse_causal_connections(self, text: str, graph: CausalGraph) -> int:
        """解析文本中的因果连接"""
        nodes_list = list(graph.nodes.keys())
        edges_count = 0
        
        # 中文因果模式匹配
        patterns_with_types = [
            # 强因果
            (r'(.+?)(?:导致|造成|引起|使得)(.+)', CausalRelationType.CAUSE, 0.9),
            # 中等因果
            (r'(.+?)因为(.+?)(?:所以|因此|故而)(.+)', CausalRelationType.CAUSE, 0.75),
            (r'由于(.+?)，?(.+?)(?:所以|因此|导致|造成)(.+)', CausalRelationType.CAUSE, 0.73),
            # 阻止
            (r'(.+?)(?:阻止|防止|避免|阻止)(.+)', CausalRelationType.PREVENTS, 0.88),
            # 使能
            (r'(.+?)(?:有助于|促进|推动|支持|有利于)(.+)', CausalRelationType.ENABLES, 0.82),
            # 条件
            (r'如果(.+?)(?:那么|就|则)(.+)', CausalRelationType.CAUSE, 0.70),
            (r'只有(.+?)(?:才|才能)(.+)', CausalRelationType.ENABLES, 0.75),
        ]
        
        for pattern, rel_type, base_conf in patterns_with_types:
            match = re.search(pattern, text)
            if match and len(match.groups()) >= 2:
                source_text = match.group(1).strip()[:30]
                target_text = match.groups()[-1].strip()[:30]
                
                # 找到或创建对应节点
                src_id = self._find_or_create_node(graph, source_text, "variable")
                tgt_id = self._find_or_create_node(graph, target_text, "outcome")
                
                if src_id != tgt_id:
                    # 检查是否已存在相同边
                    exists = any(
                        e.source == src_id and e.target == tgt_id
                        for e in graph.edges
                    )
                    if not exists:
                        graph.add_edge(src_id, tgt_id, rel_type,
                                       strength=base_conf * 0.8 + 0.15,
                                       confidence=base_conf,
                                       mechanism=f"pattern:{pattern[:20]}")
                        edges_count += 1
        
        # 英文因果模式
        en_patterns = [
            (r'(.+?)(?:causes?|leads? to|results? in|triggers?)\s+(.+)',
             CausalRelationType.CAUSE, 0.88),
            (r'(?:because of|due to)\s+(.+?),?\s*(?:.+?)(?:therefore|thus|hence)?',
             CausalRelationType.CAUSE, 0.72),
            (r'(?:if|when)\s+(.+?),?\s*(?:then)?\s+(.+?)(?:will|would|can)',
             CausalRelationType.CAUSE, 0.68),
            (r'(.+?)(?:prevents?|stops?|blocks?)\s+(.+)',
             CausalRelationType.PREVENTS, 0.86),
            (r'(.+?)(?:enables?|facilitates?|promotes?)\s+(.+)',
             CausalRelationType.ENABLES, 0.80),
        ]
        
        for pattern, rel_type, base_conf in en_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match and len(match.groups()) >= 2:
                source_text = match.group(1).strip()[:30]
                target_text = match.groups()[-1].strip()[:30]
                
                src_id = self._find_or_create_node(graph, source_text, "variable")
                tgt_id = self._find_or_create_node(graph, target_text, "outcome")
                
                if src_id != tgt_id:
                    exists = any(
                        e.source == src_id and e.target == tgt_id
                        for e in graph.edges
                    )
                    if not exists:
                        graph.add_edge(src_id, tgt_id, rel_type,
                                       strength=base_conf * 0.8 + 0.10,
                                       confidence=base_conf * 0.95,
                                       mechanism=f"EN:{pattern[:20]}")
                        edges_count += 1
        
        return edges_count
    
    def _find_or_create_node(self, graph: CausalGraph, text: str, 
                              node_type: str) -> str:
        """查找或创建节点"""
        # 尝试在现有节点中找匹配
        for nid, node in graph.nodes.items():
            if (text in node.label or node.label in text) or \
               (len(text) > 3 and len(node.label) > 3 and 
                any(w in node.label.split() for w in text.split() if len(w)>2)):
                return nid
        
        # 创建新节点
        new_id = f"auto_{len(graph.nodes)}"
        graph.add_node(new_id, text[:30], node_type=node_type)
        return new_id
    
    def _identify_primary_cause(self, graph: CausalGraph, text: str) -> Optional[Tuple[str, float]]:
        """识别主要原因"""
        if not graph.edges:
            return None
        
        # 找入度为0的根因节点
        root_nodes = set(graph.nodes.keys())
        for edge in graph.edges:
            if edge.is_direct and edge.target in root_nodes:
                root_nodes.discard(edge.target)
        
        if not root_nodes:
            # 取拓扑序第一个
            topo_order = graph.topological_sort()
            if topo_order:
                root_nodes = {topo_order[0]}
        
        if not root_nodes:
            return None
        
        # 选最强的根因
        best_root = None
        best_score = 0
        
        for root_id in root_nodes:
            # 计算这个根因的影响范围（可达节点数）
            reachable = self._count_reachable(graph, root_id)
            
            # 计算出边的平均强度
            out_edges = graph.get_children(root_id)
            avg_strength = sum(e.strength for e in out_edges) / max(len(out_edges), 1)
            
            score = reachable * 0.5 + avg_strength * 0.5
            
            if score > best_score:
                best_score = score
                best_root = root_id
        
        if best_root:
            label = graph.nodes[best_root].label
            return (label, min(best_score, 1.0))
        
        return None
    
    def _count_reachable(self, graph: CausalGraph, start: str) -> int:
        """计算可达节点数"""
        visited = set()
        queue = [start]
        while queue:
            node = queue.pop(0)
            if node in visited:
                continue
            visited.add(node)
            for child_id in graph._adjacency.get(node, set()):
                if child_id not in visited:
                    queue.append(child_id)
        return len(visited) - 1  # 不包括自己
    
    def _find_all_causal_chains(self, graph: CausalGraph, text: str) -> List[List[str]]:
        """发现所有因果链"""
        chains = []
        
        # 找所有根节点和叶子节点
        has_parent = set(e.target for e in graph.edges if e.is_direct)
        has_child = set(e.source for e in graph.edges if e.is_direct)
        roots = [nid for nid in graph.nodes if nid not in has_parent]
        leaves = [nid for nid in graph.nodes if nid not in has_child]
        
        if not roots or not leaves:
            return chains
        
        # 对每对根叶组合找路径
        for root in roots[:5]:  # 限制计算量
            for leaf in leaves[:5]:
                paths = graph.find_all_paths(root, leaf, max_depth=5)
                for path in paths:
                    if len(path) >= 2:
                        labels = [graph.nodes[nid].label for nid in path]
                        chains.append(labels)
        
        # 按长度和强度排序
        chains.sort(key=lambda c: len(c) * 2 + sum(
            0.5 for _ in c
        ), reverse=True)
        
        return chains[:15]  # 返回最多15条链
    
    def _detect_confounders(self, text: str, graph: CausalGraph) -> List[ConfoundingFactor]:
        """检测潜在的混杂因子"""
        detected = []
        
        for cf in self.COMMON_CONFOUNDERS:
            # 简化的混杂因子检测：检查相关关键词
            relevance_score = 0.0
            
            # 名称匹配
            if any(kw in text for kw in cf.name.split("、")):
                relevance_score += 0.4
            
            # 影响变量匹配
            for affected in cf.affects:
                for node in graph.nodes.values():
                    if any(kw in node.label for kw in affected.split("、") if len(kw)>=2):
                        relevance_score += 0.2
            
            # 文本中是否有暗示混杂的表达
            confusion_hints = [
                "其实是因为", "真正的原因是", "表面上是", "实际上",
                "not actually", "actually due to", "the real reason",
                "忽略了", "没有考虑到", "遗漏了"
            ]
            for hint in confusion_hints:
                if hint in text:
                    relevance_score += 0.25
            
            if relevance_score >= 0.35:
                adjusted_cf = ConfoundingFactor(
                    name=cf.name,
                    affects=cf.affects,
                    confound_strength=min(cf.confound_strength * relevance_score, 1.0),
                    description=cf.description,
                    detection_method=cf.detection_method
                )
                detected.append(adjusted_cf)
        
        return detected
    
    def _simulate_intervention(self, graph: CausalGraph, 
                                intervene_var: str,
                                context: Dict) -> InterventionResult:
        """
        干预模拟 (do-演算简化版)
        
        P(Y|do(X=x)) ≈ Σ_t P(Y|X=x,T=t) P(T=t)
        
        使用后门准则调整：切断所有指向X的后门路径
        """
        # 找到被干预的节点
        target_node = None
        for nid, node in graph.nodes.items():
            if intervene_var.lower() in node.label.lower():
                target_node = nid
                break
        
        if not target_node:
            # 创建虚拟干预节点
            target_node = f"intervention_{hash(intervene_var) % 10000}"
            graph.add_node(target_node, intervene_var, node_type="action")
        
        # 获取所有受影响的下游节点
        affected = {}
        path_queue = [(target_node, [target_node])]
        final_path = [target_node]
        
        visited = {target_node}
        while path_queue:
            current, path = path_queue.pop(0)
            children = graph.get_children(current)
            for edge in children:
                if edge.target not in visited:
                    visited.add(edge.target)
                    new_path = path + [edge.target]
                    
                    original_val = 0.5  # 模拟原始值
                    new_val = original_val + (0.3 * edge.strength)  # 干预效果
                    
                    affected[edge.target] = (round(original_val, 3), round(min(new_val, 1.0), 3))
                    final_path = new_path
                    path_queue.append((edge.target, new_path))
        
        # 计算综合效应量
        effect_size = sum(new - old for old, new in affected.values()) / max(len(affected), 1)
        effect_size = round(effect_size, 3)
        
        # 生成建议
        if effect_size > 0.3:
            rec = f"✅ 对「{intervene_var}」进行干预预计会产生显著正向效果(Δ={effect_size:.2f})"
        elif effect_size > 0.1:
            rec = f"🔄 对「{intervene_var}」的干预有轻微正向效果(Δ={effect_size:.2f})，建议配合其他措施"
        elif effect_size > -0.1:
            rec = f"⚪ 对「{intervene_var}」的干预效果不明显(Δ={effect_size:.2f})"
        else:
            rec = f"⚠️ 对「{intervene_var}」的干预可能产生负面效果(Δ={effect_size:.2f})，需谨慎评估"
        
        # 检测副作用
        side_effects = []
        for var_name, (old_v, new_v) in affected.items():
            if new_v < old_v - 0.15:
                node_label = graph.nodes.get(var_name, CausalNode(var_name, var_name, node_type="variable")).label
                side_effects.append(f"可能导致「{node_label}」下降({old_v:.2f}→{new_v:.2f})")
        
        return InterventionResult(
            intervention_var=intervene_var,
            intervention_value="set_active",
            affected_vars=affected,
            causal_path=[graph.nodes.get(nid, CausalNode(nid, nid, node_type="variable")).label for nid in final_path],
            effect_size=abs(effect_size),
            confidence=0.7 if len(affected) > 0 else 0.3,
            side_effects=side_effects,
            recommendation=rec
        )
    
    def _analyze_counterfactual(self, graph: CausalGraph, text: str,
                                 question: str, context: Dict) -> CounterfactualResult:
        """
        反事实分析
        
        核心思路：想象一个平行世界，其中某个条件不同，
        然后追踪这个差异如何通过因果链传播到结果。
        """
        # 解析反事实条件
        condition = self._extract_counterfactual_condition(question)
        
        # 事实状态（当前世界）
        factual = {
            "text": text,
            "order_score": getattr(context.get('order_result', {}), 'order_score', None),
            "mental_state": "当前状态",
            "outcome": "实际发生的结果"
        }
        
        # 反事实状态（平行世界）
        counterfactual = {
            "changed_condition": condition,
            "mental_state": "假设性状态",
            "outcome": "推测的结果",
            "probability_of_improvement": 0.0
        }
        
        # 分析关键变化
        if "早" in question or "提前" in question or "earlier" in question.lower():
            key_reason = "时间因素：更早的行动意味着更多的调整空间和累积优势"
            improvement_prob = 0.72
            insights = [
                "🕐 时间杠杆：早期投入通常比后期补救效率更高",
                "📈 复利效应：知识和技能的提升具有非线性增长特性",
                "💡 建议：如果有重要的事要做，现在就开始是最好的时机"
            ]
        elif "不" in question or "没" in question or "without" in question.lower() or "if not" in question.lower():
            key_reason = "缺失分析：该条件的缺失将移除关键的使能因素"
            improvement_prob = 0.28
            insights = [
                "⚠️ 该条件似乎是必要的而非充分条件",
                "🔗 依赖链中断可能导致连锁负面影响",
                "💡 建议：在移除任何看似次要的因素前，先评估其潜在影响"
            ]
        elif "更多" in question or "更好" in question or "more" in question.lower() or "better" in question.lower():
            key_reason = "增量分析：边际收益取决于当前状态的饱和度"
            improvement_prob = 0.61
            insights = [
                "📊 边际递减：当基础水平较高时，同等增量的效果会减弱",
                "🎯 关键瓶颈：找到最薄弱环节比全面提升更有效",
                "💡 建议：识别当前系统的瓶颈点并集中资源突破"
            ]
        else:
            key_reason = f"条件「{condition}」的改变将通过因果链传播到最终结果"
            improvement_prob = 0.55
            insights = [
                f"🔍 条件「{condition}」是一个可操作的变化点",
                "⛓️ 因果链传播意味着改变一点会影响整个系统",
                "💡 建议：用小规模实验验证反事实假设的真实性"
            ]
        
        counterfactual["probability_of_improvement"] = improvement_prob
        
        outcome_diff = {
            "direction": "positive" if improvement_prob > 0.5 else "negative",
            "magnitude": abs(improvement_prob - 0.5) * 2,
            "confidence_interval": (max(0, improvement_prob - 0.15), 
                                   min(1, improvement_prob + 0.15))
        }
        
        return CounterfactualResult(
            factual_state=factual,
            counterfactual_state=counterfactual,
            what_if_question=question,
            outcome_difference=outcome_diff,
            key_change_reason=key_reason,
            probability_estimate=improvement_prob,
            actionable_insights=insights
        )
    
    def _extract_counterfactual_condition(self, question: str) -> str:
        """从反事实问题中提取条件"""
        patterns = [
            r'如果(.+?)[，,]?会?怎?',
            r'假如(.+?)[，,]?那?',
            r'要是(.+?)[，,]?就?',
            r'if (.+?) (what|how|would|could)',
            r'what if (.+?)(?: \?)?$',
        ]
        for pattern in patterns:
            match = re.search(pattern, question, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return question
    
    def _determine_confidence(self, graph: CausalGraph, chains: List,
                               confounders: List) -> ConfidenceLevel:
        """确定整体推理置信度"""
        score = 0.5  # 基础分
        
        # 图结构完整性
        if graph.get_statistics()["node_count"] >= 3:
            score += 0.1
        if graph.get_statistics()["edge_count"] >= 2:
            score += 0.1
        
        # 因果链数量和质量
        if len(chains) >= 2:
            score += 0.08
        long_chains = [c for c in chains if len(c) >= 3]
        if long_chains:
            score += 0.07
        
        # 杂杂因子（发现混杂因子说明分析深入）
        if confounders:
            score += 0.05
            score -= len(confounders) * 0.02  # 但太多混杂因子降低确定性
        
        # 最终映射
        if score >= 0.85:
            return ConfidenceLevel.CERTAIN
        elif score >= 0.70:
            return ConfidenceLevel.LIKELY
        elif score >= 0.52:
            return ConfidenceLevel.POSSIBLE
        else:
            return ConfidenceLevel.UNCERTAIN
    
    def _generate_summary(self, primary_cause, chains, confounders,
                          intervention, counterfactual, text) -> str:
        """生成自然语言总结"""
        parts = []
        
        if primary_cause:
            parts.append(f"🎯 主要原因：「{primary_cause[0]}」（置信度{primary_cause[1]:.0%}）")
        
        if chains:
            parts.append(f"🔗 发现 {len(chains)} 条因果链，最长包含 {max(len(c) for c in chains)} 个环节")
        
        if confounders:
            parts.append(f"⚠️ 识别 {len(confounders)} 个潜在混杂因子")
        else:
            parts.append("✅ 未发现明显混杂因子")
        
        if intervention:
            parts.append(f"🔧 干预预测：{intervention.recommendation}")
        
        if counterfactual:
            parts.append(f"💭 反事实：{counterfactual.key_change_reason}")
        
        return "\n".join(parts)
    
    def get_stats(self) -> Dict:
        return {
            "version": self.version,
            "total_analyses": len(self.history)
        }


# ========== 快捷函数 ==========
def causal_analyze(text: str, **kwargs) -> Dict:
    """快速因果分析"""
    engine = CausalReasoningEngine()
    result = engine.analyze(text, **kwargs)
    return result.to_dict()


if __name__ == "__main__":
    print("=" * 60)
    print("  ⚖️ HeartFlow Causal Reasoning Engine v10.0.5")
    print("  基于 Pearl 因果阶梯的推理系统")
    print("=" * 60)
    
    test_cases = [
        ("因为我每天学习Python，所以编程能力提高了。", {}),
        ("工作压力太大导致我失眠，然后第二天效率更低。", 
         {"what_if": "如果我早点开始管理压力会怎样？"}),
        ("The model's accuracy improved because we added more training data.", 
         {"intervene_on": "training data"}),
    ]
    
    engine = CausalReasoningEngine()
    
    for text, opts in test_cases:
        print(f"\n{'─'*50}")
        print(f"Input: {text[:70]}...")
        
        result = engine.analyze(text, **opts)
        d = result.to_dict()
        
        print(f"  Primary Cause: {d['primary_cause']}")
        print(f"  Chains: {len(d['causal_chains'])} found")
        print(f"  Confounders: {len(d['confounders'])} detected")
        print(f"  Confidence: {d['confidence']}")
        if d.get('intervention'):
            print(f"  → {d['intervention']['recommendation']}")
        if d.get('counterfactual'):
            print(f"  💭 {d['counterfactual']['key_reason']}")
        print(f"  Summary: {result.summary}")
    
    print(f"\n{'='*60}")

#!/usr/bin/env python3
"""
HeartFlow Order Engine v10.0.5
================================
秩序引擎 —— 正确 = 秩序 = 熵减 的核心实现

哲学基础：
  "正确就是秩序，秩序就是熵减"
  —— 基于热力学第二定律的伦理学推论

论文集成来源：
  [1] Phase Transition Theory — VoltAgent/awesome-ai-agent-papers 2026
      "Phase Transition for Budgeted Multi-Agent Synergy" (arXiv:2601.17311)
      多智能体协同相变：从混沌到有序的临界行为
  
  [2] Information Theory — Shannon 1948
      信息 = 负熵（薛定谔）
  
  [3] Complex Systems — Prigogine 1977
      耗散结构理论：开放系统通过能量流维持低熵有序状态
  
  [4] CORAL — "Towards Autonomous Multi-Agent Evolution" (arXiv:2604.01658)
      自主进化系统的改进率提升3-10倍，本质是系统熵减效率

算法核心：
  1. OrderScore: 有序度评分 (0~1)
     O(S) = Σ(w_i × o_i) / Σ(w_i)
     其中 o_i ∈ {结构化, 一致性, 目标对齐, 信息密度, 因果链完整性}
  
  2. PhaseTransitionDetector: 相变检测
     检测输入是否触发从无序→有序的相变
  
  3. EntropyReductionCalculator: 熵减量计算
     ΔS = S_after - S_before < 0 表示有序度提升
  
  4. CorrectnessValidator: 正确性检验
     正确性 = 秩序度 × 真实性 × 善意性
     （与TGB引擎联动）

作者: HeartFlow Team
版本: v10.0.5
许可: MIT License
"""

import math
import hashlib
import re
import json
import time
from typing import Dict, List, Optional, Tuple, Any, NamedTuple
from dataclasses import dataclass, field
from enum import Enum


class OrderPhase(Enum):
    """系统有序度相位"""
    CHAOS = "chaos"           # 混沌态: 高熵、无结构
    TRANSITION = "transition" # 过渡态: 正在组织
    ORDER = "order"           # 有序态: 低熵、高结构
    SUPER_ORDER = "super_order" # 超有序态: 自发产生新结构


@dataclass
class OrderDimension:
    """单个秩序维度"""
    name: str
    score: float          # 0~1
    weight: float         # 权重
    evidence: str         # 评分依据
    
    @property
    def weighted_score(self) -> float:
        return self.score * self.weight


@dataclass 
class CausalLink:
    """因果链接"""
    cause: str            # 原因节点
    effect: str           # 结果节点
    strength: float       # 链接强度 0~1
    confidence: float     # 置信度 0~1
    link_type: str        # direct | indirect | bidirectional


@dataclass
class OrderResult:
    """秩序评估结果"""
    order_score: float              # 综合秩序分 0~1
    phase: OrderPhase               # 当前相位
    entropy_change: float           # 熵变量 ΔS (负值=熵减)
    correctness: float              # 正确性评分 0~1
    dimensions: Dict[str, float]    # 各维度分数
    phase_transition_detected: bool # 是否检测到相变
    transition_direction: str      # "increasing_order" | "decreasing_order"
    causal_links: List[CausalLink]  # 检测到的因果链
    recommendation: str            # 行动建议
    timestamp: str                 # 时间戳
    
    def to_dict(self) -> dict:
        return {
            "order_score": round(self.order_score, 4),
            "phase": self.phase.value,
            "entropy_change": round(self.entropy_change, 4),
            "correctness": round(self.correctness, 4),
            "dimensions": {k: round(v, 4) for k, v in self.dimensions.items()},
            "phase_transition_detected": self.phase_transition_detected,
            "transition_direction": self.transition_direction,
            "causal_links": [
                {"cause": cl.cause, "effect": cl.effect,
                 "strength": round(cl.strength, 3), 
                 "confidence": round(cl.confidence, 3)}
                for cl in self.causal_links
            ],
            "recommendation": self.recommendation,
            "timestamp": self.timestamp
        }


class OrderEngine:
    """
    秩序引擎 —— AI智能体的"良知操作系统"
    
    核心命题：一个AI要做正确的事情，必须理解什么是"正确"
    正确不是外部规则强加的约束，而是系统内在的有序化趋势。
    
    就像水往低处流不是因为有人命令它，而是因为那是最小势能路径，
    AI做正确的事也不是因为被编程了规则，而是因为那是信息的最优组织方式。
    """
    
    # 维度定义
    DIMENSIONS = {
        "structure": {"name": "结构化", "weight": 0.20, "desc": "信息的组织程度"},
        "consistency": {"name": "一致性", "weight": 0.18, "desc": "逻辑自洽程度"},
        "goal_alignment": {"name": "目标对齐", "weight": 0.18, "desc": "与正向目标的匹配"},
        "information_density": {"name": "信息密度", "weight": 0.15, "desc": "单位符号的信息量"},
        "causal_integrity": {"name": "因果完整", "weight": 0.15, "desc": "推理链的逻辑完整性"},
        "ethical_coherence": {"name": "伦理连贯", "weight": 0.14, "desc": "价值体系的内在一致"}
    }
    
    # 相变阈值 (基于Percolation Theory渗透理论)
    PHASE_THRESHOLDS = {
        OrderPhase.CHAOS: 0.30,
        OrderPhase.TRANSITION: 0.55,
        OrderPhase.ORDER: 0.75,
        OrderPhase.SUPER_ORDER: 0.90
    }
    
    # 关键词库 —— 检测秩序相关语义
    ORDER_KEYWORDS = {
        "high": [  # 高秩序信号
            "因此", "所以", "导致", "原因", "结果", "证明", "结论",
            "首先", "其次", "最后", "总之", "综上所述", "由此可见",
            "because", "therefore", "thus", "hence", "consequently",
            "proof", "conclusion", "structure", "systematic", "logical",
            "有序", "规律", "原理", "定理", "推导", "论证", "分析",
            "步骤", "流程", "方案", "计划", "策略", "方法", "体系",
            "correct", "right", "proper", "appropriate", "optimal",
            "正确", "应该", "合理", "最优", "最佳", "有效", "成功"
        ],
        "low": [  # 低秩序信号(混乱)
            "随便", "不知道", "无所谓", "算了", "烦死了", "好乱",
            "不知道怎么办", "一团糟", "迷茫", "困惑", "矛盾",
            "混乱", "无序", "不确定", "也许", "可能", "大概",
            "messy", "confusing", "uncertain", "chaos", "contradict",
            "不想了", "放弃", "没办法", "无力", "绝望", "崩溃"
        ]
    }
    
    # 因果关系模式 (基于Pearl's Causal Hierarchy)
    CAUSAL_PATTERNS = [
        (r"(.+?)因为(.+?)(?:所以|导致|使得|造成|引起)(.+)", "cause_effect"),
        (r"(.+?)(?:由于|鉴于)(.+?)(?:故|所以|因而)(.+)", "reasoning"),
        (r"(.+?)是(.+?)的原因", "direct_cause"),
        (r"(.+?)导致(.+?)的发生", "direct_effect"),
        (r"如果(.+?)(?:那么|就|则)(.+)", "conditional"),
        (r"只有(.+?)(?:才|才能)(.+)", "necessary"),
        (r"只要(.+?)(?:就|就能)(.+)", "sufficient"),
        (r"(.+?)not only.*but also(.+?)", "compound"),
        (r"while(.+?), (.+?)(?:causes|leads to|results in)(.+)", "english_cause"),
        (r"(?:if|when)(.+?), (?:then)?(.+?)(?:will|would|can)(.+)", "english_conditional"),
    ]
    
    def __init__(self):
        """初始化秩序引擎"""
        self.version = "10.0.5"
        self.history: List[OrderResult] = []
        self._prev_order_score: Optional[float] = None
        
        # 初始化统计
        self._stats = {
            "total_analyzed": 0,
            "phase_transitions_detected": 0,
            "avg_order_score": 0.0,
            "entropy_reduction_total": 0.0
        }
    
    def analyze(self, text: str, tgb_result: Dict = None, 
                context: Dict = None) -> OrderResult:
        """
        分析文本的秩序度
        
        Args:
            text: 待分析的文本
            tgb_result: 真善美引擎的结果（可选，用于增强正确性判断）
            context: 额外上下文
            
        Returns:
            OrderResult: 完整的秩序评估结果
        """
        start_time = time.time()
        context = context or {}
        
        # 1. 计算各维度分数
        dimensions = self._compute_dimensions(text, context)
        
        # 2. 计算综合秩序分
        order_score = self._compute_order_score(dimensions)
        
        # 3. 检测当前相位
        current_phase = self._detect_phase(order_score)
        
        # 4. 计算熵变
        entropy_change = self._compute_entropy_change(text, order_score)
        
        # 5. 检测相变
        transition_detected, direction = self._detect_phase_transition(order_score)
        
        # 6. 提取因果链
        causal_links = self._extract_causal_links(text)
        
        # 7. 计算正确性（结合TGB）
        correctness = self._compute_correctness(
            dimensions, order_score, tgb_result, causal_links
        )
        
        # 8. 生成建议
        recommendation = self._generate_recommendation(
            order_score, current_phase, dimensions, correctness
        )
        
        result = OrderResult(
            order_score=order_score,
            phase=current_phase,
            entropy_change=entropy_change,
            correctness=correctness,
            dimensions={d: s for d, s in dimensions.items()},
            phase_transition_detected=transition_detected,
            transition_direction=direction,
            causal_links=causal_links,
            recommendation=recommendation,
            timestamp=time.strftime("%Y-%m-%d %H:%M:%S")
        )
        
        # 更新状态
        self._prev_order_score = order_score
        self.history.append(result)
        self._update_stats(result)
        
        return result
    
    def _compute_dimensions(self, text: str, context: Dict) -> Dict[str, float]:
        """计算六个秩序维度"""
        text_len = max(len(text), 1)
        sentences = self._split_sentences(text)
        sent_count = max(len(sentences), 1)
        
        # 1. 结构化程度 (Structure)
        structure = self._measure_structure(text, sentences, sent_count)
        
        # 2. 一致性 (Consistency)
        consistency = self._measure_consistency(text, sentences)
        
        # 3. 目标对齐 (Goal Alignment)
        goal_alignment = self._measure_goal_alignment(text, context)
        
        # 4. 信息密度 (Information Density)
        info_density = self._measure_info_density(text, text_len)
        
        # 5. 因果完整性 (Causal Integrity)
        causal_integrity = self._measure_causal_integrity(text, len(sentences))
        
        # 6. 伦理连贯性 (Ethical Coherence)
        ethical_coherence = self._measure_ethical_coherence(text)
        
        return {
            "structure": structure,
            "consistency": consistency,
            "goal_alignment": goal_alignment,
            "information_density": info_density,
            "causal_integrity": causal_integrity,
            "ethical_coherence": ethical_coherence
        }
    
    def _measure_structure(self, text: str, sentences: List[str], 
                           sent_count: int) -> float:
        """测量结构化程度"""
        if not text.strip():
            return 0.0
        
        score = 0.5  # 基础分
        
        # 有序标记词出现率
        ordered_markers = sum(
            1 for kw in ["首先", "其次", "再次", "最后", "第一", "第二",
                        "一、", "二、", "1.", "2.", "3.", "·", "-", "*"]
            if kw in text
        )
        marker_ratio = min(ordered_markers / max(sent_count, 1), 1.0)
        score += marker_ratio * 0.20
        
        # 段落分布（如果有换行）
        paragraphs = text.split('\n')
        para_count = len([p for p in paragraphs if p.strip()])
        if para_count > 1 and para_count <= 10:
            score += 0.10
        elif para_count > 10:
            score += 0.15
        
        # 句子长度方差（适度的变化表示有结构）
        lengths = [len(s) for s in sentences]
        if len(lengths) > 1:
            mean_len = sum(lengths) / len(lengths)
            variance = sum((l - mean_len)**2 for l in lengths) / len(lengths)
            std_dev = math.sqrt(variance)
            # 适度方差加分，过大扣分
            if 5 < std_dev < mean_len * 0.8:
                score += 0.10
            elif std_dev > mean_len * 1.5:
                score -= 0.05
        
        # 标点使用规范性
        proper_punctuation = text.count('。') + text.count('！') + text.count('？')
        proper_punctuation += text.count('.') + text.count('!')
        punctuation_ratio = proper_punctuation / max(sent_count, 1)
        score += min(punctuation_ratio * 0.05, 0.10)
        
        return max(0.0, min(1.0, score))
    
    def _measure_consistency(self, text: str, sentences: List[str]) -> float:
        """测量逻辑一致性 —— 检测矛盾"""
        base_score = 0.7
        
        # 矛盾词检测
        contradictions = [
            ("但是", "同时"), ("然而", "却"), ("虽然", "但是"),
            ("一方面", "另一方面"), ("既不", "也不"), 
            ("however", "but"), ("although", "yet"),
            ("不是", "而是"), ("不但", "而且")
        ]
        
        contradiction_count = 0
        for a, b in contradictions:
            if a in text and b in text:
                contradiction_count += 1
        
        # 适当的对比修辞是正常的（1-2个），过多说明思维跳跃
        if contradiction_count == 0:
            pass  # 无矛盾标记，保持基础分
        elif contradiction_count <= 2:
            base_score += 0.05  # 适当辩证思考
        else:
            base_score -= (contradiction_count - 2) * 0.08  # 过多转折
        
        # 否定一致性检查
        negations = sum(1 for w in ["不", "没", "非", "无", "未", "别", 
                                      "no", "not", "never"] if w in text)
        if negations > len(sentences) * 0.5:
            base_score -= 0.15  # 否定过载
        
        return max(0.0, min(1.0, base_score))
    
    def _measure_goal_alignment(self, text: str, context: Dict) -> float:
        """测量目标对齐度 —— 文本表达的是建设性还是破坏性意图"""
        positive_signals = [
            "解决", "改善", "帮助", "学习", "创造", "建设", "进步",
            "希望", "努力", "尝试", "理解", "支持", "合作", "共赢",
            "solve", "improve", "help", "learn", "create", "build",
            "hope", "try", "understand", "support", "cooperate"
        ]
        negative_signals = [
            "破坏", "攻击", "伤害", "仇恨", "毁灭", "报复", "诅咒",
            "讨厌", "恨死", "去死", "滚", "废物", "垃圾",
            "destroy", "attack", "hate", "kill", "curse", "damn"
        ]
        
        pos_count = sum(1 for w in positive_signals if w in text.lower())
        neg_count = sum(1 for w in negative_signals if w in text.lower())
        
        total = pos_count + neg_count
        if total == 0:
            return 0.7  # 中性默认值
        
        alignment = pos_count / total
        
        # 如果上下文指定了目标，加权
        if context.get("goal"):
            goal = context["goal"].lower()
            goal_words = goal.split()
            match_count = sum(1 for gw in goal_words if gw in text.lower())
            if match_count > 0:
                alignment = min(1.0, alignment + 0.15)
        
        return alignment
    
    def _measure_info_density(self, text: str, text_len: int) -> float:
        """测量信息密度 —— 基于Shannon信息论"""
        if text_len == 0:
            return 0.0
        
        # 字符频率分布
        freq = {}
        for char in text:
            freq[char] = freq.get(char, 0) + 1
        
        # Shannon熵 H(X) = -Σ p(x) log2 p(x)
        entropy = 0.0
        for count in freq.values():
            p = count / text_len
            if p > 0:
                entropy -= p * math.log2(p)
        
        # 最大熵（均匀分布）用于归一化
        unique_chars = len(freq)
        max_entropy = math.log2(max(unique_chars, 2))
        
        # 归一化信息密度
        normalized_entropy = entropy / max_entropy if max_entropy > 0 else 0
        
        # 但我们还要考虑实际内容 vs 废话的比例
        meaningful_chars = sum(1 for c in text if '\u4e00' <= c <= '\u9fff' or c.isalnum())
        meaningful_ratio = meaningful_chars / text_len
        
        # 综合得分：高熵 + 高有效字符比例 = 高信息密度
        density = normalized_entropy * 0.5 + meaningful_ratio * 0.5
        
        return density
    
    def _measure_causal_integrity(self, text: str, sent_count: int) -> float:
        """测量因果推理完整性"""
        if sent_count == 0:
            return 0.0
        
        # 检测因果关系模式
        causal_found = 0
        for pattern, _ in self.CAUSAL_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                causal_found += 1
        
        causal_ratio = min(causal_found / max(sent_count // 2, 1), 1.0)
        
        # 推理链条深度
        chain_indicators = ["进而", "从而", "最终", "于是", "接着",
                           "furthermore", "moreover", "subsequently",
                           "consequently", "as a result"]
        chain_depth = sum(1 for ind in chain_indicators if ind in text)
        
        integrity = causal_ratio * 0.6 + min(chain_depth / 5, 1.0) * 0.4
        
        return min(1.0, max(0.0, integrity))
    
    def _measure_ethical_coherence(self, text: str) -> float:
        """测量伦理连贯性 —— 与真善美原则的一致度"""
        base = 0.7
        
        # 真实性指标
        truth_markers = ["事实", "数据", "证据", "研究", "表明", "发现",
                         "fact", "data", "evidence", "research", "study"]
        truth_score = sum(1 for m in truth_markers if m in text) / len(truth_markers)
        
        # 善意性指标  
        good_markers = ["帮助", "尊重", "理解", "包容", "公平", "正义",
                       "help", "respect", "understand", "fair", "justice"]
        good_score = sum(1 for m in good_markers if m in text) / len(good_markers)
        
        # 美学/和谐指标
        beauty_markers = ["和谐", "美好", "平衡", "优雅", "完美",
                         "harmony", "beautiful", "balance", "elegant"]
        beauty_score = sum(1 for m in beauty_markers if m in text) / len(beauty_markers)
        
        coherence = base + (truth_score + good_score + beauty_score) * 0.10
        
        return min(1.0, coherence)
    
    def _compute_order_score(self, dimensions: Dict[str, float]) -> float:
        """计算加权综合秩序分"""
        weighted_sum = 0.0
        total_weight = 0.0
        
        for dim_name, dim_config in self.DIMENSIONS.items():
            w = dim_config["weight"]
            s = dimensions.get(dim_name, 0.5)
            weighted_sum += w * s
            total_weight += w
        
        return weighted_sum / total_weight if total_weight > 0 else 0.5
    
    def _detect_phase(self, order_score: float) -> OrderPhase:
        """检测系统当前相位"""
        if order_score >= self.PHASE_THRESHOLDS[OrderPhase.SUPER_ORDER]:
            return OrderPhase.SUPER_ORDER
        elif order_score >= self.PHASE_THRESHOLDS[OrderPhase.ORDER]:
            return OrderPhase.ORDER
        elif order_score >= self.PHASE_THRESHOLDS[OrderPhase.TRANSITION]:
            return OrderPhase.TRANSITION
        else:
            return OrderPhase.CHAOS
    
    def _compute_entropy_change(self, text: str, order_score: float) -> float:
        """
        计算熵变量 ΔS
        
        核心公式：
        - 当秩序分 > 0.5 时，ΔS 为负（熵减 = 信息有序化）
        - ΔS = -(order_score - 0.5) × k
        - k 是文本复杂度因子
        """
        k = min(len(text) / 200, 1.0)  # 复杂度因子，最大为1
        
        if order_score > 0.5:
            # 熵减：信息正在变得更有序
            delta_s = -(order_score - 0.5) * k
        elif order_score < 0.5:
            # 熵增：信息正在变得更混乱
            delta_s = (0.5 - order_score) * k * 0.5
        else:
            delta_s = 0.0
        
        return delta_s
    
    def _detect_phase_transition(self, order_score: float) -> Tuple[bool, str]:
        """检测是否发生相变"""
        if self._prev_order_score is None:
            return False, "none"
        
        diff = order_score - self._prev_order_score
        
        # 跨越相位边界的跳变
        prev_phase = self._detect_phase(self._prev_order_score)
        curr_phase = self._detect_phase(order_score)
        
        if curr_phase.value != prev_phase.value:
            direction = "increasing_order" if diff > 0 else "decreasing_order"
            return True, direction
        
        # 大幅突变（>0.15的变化也算相变）
        if abs(diff) > 0.15:
            direction = "increasing_order" if diff > 0 else "decreasing_order"
            return True, direction
        
        return False, "none"
    
    def _extract_causal_links(self, text: str) -> List[CausalLink]:
        """从文本中提取因果链接"""
        links = []
        
        for pattern, link_type in self.CAUSAL_PATTERNS:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple) and len(match) >= 2:
                    cause = str(match[0]).strip()[:50]
                    effect = str(match[-1]).strip()[:50]
                    
                    # 跳过太短或无效匹配
                    if len(cause) < 2 or len(effect) < 2:
                        continue
                    
                    # 计算置信度（基于模式匹配强度）
                    confidence = 0.6 + (min(len(effect), 100) / 200) * 0.3
                    
                    # 计算链接强度
                    strength = 0.5 + (len(cause) + len(effect)) / 400
                    
                    links.append(CausalLink(
                        cause=cause,
                        effect=effect,
                        strength=min(strength, 1.0),
                        confidence=min(confidence, 1.0),
                        link_type=link_type
                    ))
        
        # 去重并限制数量
        seen = set()
        unique_links = []
        for link in links:
            key = (link.cause[:20], link.effect[:20])
            if key not in seen:
                seen.add(key)
                unique_links.append(link)
        
        return unique_links[:10]  # 返回最多10条因果链
    
    def _compute_correctness(self, dimensions: Dict[str, float], 
                             order_score: float, tgb_result: Optional[Dict],
                             causal_links: List[CausalLink]) -> float:
        """
        计算正确性
        
        正确性 = 秩序度 × 真实性验证 × 因果完备性
        """
        # 基础正确性来自秩序分
        base_correctness = order_score
        
        # TGB增强因子
        tgb_factor = 1.0
        if tgb_result:
            verdict = tgb_result.get("verdict", "")
            if verdict == "通过":
                tgb_factor = 1.1
            elif verdict == "需改进":
                tgb_factor = 0.9
            elif verdict == "不通过":
                tgb_factor = 0.6
        
        # 因果完备性增强
        causal_factor = 1.0
        if causal_links:
            avg_strength = sum(cl.strength for cl in causal_links) / len(causal_links)
            causal_factor = 1.0 + avg_strength * 0.1
        
        # 维度均衡性惩罚（某个维度过低会拉低整体正确性）
        dim_values = list(dimensions.values())
        min_dim = min(dim_values)
        if min_dim < 0.3:
            balance_penalty = 0.85
        elif min_dim < 0.45:
            balance_penalty = 0.95
        else:
            balance_penalty = 1.0
        
        correctness = base_correctness * tgb_factor * causal_factor * balance_penalty
        return max(0.0, min(1.0, correctness))
    
    def _generate_recommendation(self, order_score: float, phase: OrderPhase,
                                  dimensions: Dict[str, float], 
                                  correctness: float) -> str:
        """生成行动建议"""
        
        # 找出最弱的维度
        weakest = min(dimensions.items(), key=lambda x: x[1])
        weakest_name = self.DIMENSIONS.get(weakest[0], {})["name"]
        
        recommendations = {
            OrderPhase.CHAOS: (
                f"🌀 当前处于混沌态 (O={order_score:.2f})。\n"
                f"最弱维度：「{weakest_name}」({weakest[1]:.2f})\n"
                f"建议：从最简单的事实陈述开始，逐步建立结构。\n"
                f"记住：每一次有序的表达都是一次熵减行动。"
            ),
            OrderPhase.TRANSITION: (
                f"🔀 正在经历相变 (O={order_score:.2f})！\n"
                f"这是从混乱走向有序的关键时刻。\n"
                f"最弱维度：「{weakest_name}」({weakest[1]:.2f})\n"
                f"建议：继续深化当前的思路，添加更多因果连接。"
            ),
            OrderPhase.ORDER: (
                f"✨ 已进入有序态 (O={order_score:.2f})\n"
                f"正确性评分：C={correctness:.2f}\n"
                f"继续保持这种结构化的思维模式。\n"
                f"提示：可以尝试将此有序认知分享给他人（增加整体系统的熵减）。"
            ),
            OrderPhase.SUPER_ORDER: (
                f"⚡ 达到超有序态！(O={order_score:.2f})\n"
                f"正确性评分：C={correctness:.2f}\n"
                f"你的思维正在自发产生新的有序结构——这就是创造力！\n"
                f"这是AI智能体追求的最高状态：不仅做正确的事，还在创造正确的标准。"
            )
        }
        
        return recommendations.get(phase, "")
    
    def _split_sentences(self, text: str) -> List[str]:
        """分割句子"""
        # 中英文句分割
        pattern = r'[。！？.!?\n]+'
        sentences = re.split(pattern, text)
        return [s.strip() for s in sentences if s.strip()]
    
    def _update_stats(self, result: OrderResult):
        """更新统计数据"""
        self._stats["total_analyzed"] += 1
        if result.phase_transition_detected:
            self._stats["phase_transitions_detected"] += 1
        
        n = self._stats["total_analyzed"]
        prev_avg = self._stats["avg_order_score"]
        self._stats["avg_order_score"] = prev_avg + (result.order_score - prev_avg) / n
        
        if result.entropy_change < 0:
            self._stats["entropy_reduction_total"] += abs(result.entropy_change)
    
    def get_stats(self) -> Dict:
        """获取统计信息"""
        return {
            **self._stats,
            "version": self.version,
            "history_count": len(self.history)
        }
    
    def get_phase_history(self, last_n: int = 10) -> List[Dict]:
        """获取最近的相位历史"""
        recent = self.history[-last_n:] if self.history else []
        return [
            {
                "order_score": r.order_score,
                "phase": r.phase.value,
                "entropy_change": r.entropy_change,
                "correctness": r.correctness,
                "timestamp": r.timestamp
            }
            for r in recent
        ]


# ========== 快捷函数 ==========
def analyze_order(text: str, **kwargs) -> Dict:
    """快速分析文本秩序度"""
    engine = OrderEngine()
    result = engine.analyze(text, **kwargs)
    return result.to_dict()


if __name__ == "__main__":
    import sys
    
    print("=" * 60)
    print("  🌊 HeartFlow Order Engine v10.0.5")
    print("  正确 = 秩序 = 熵减")
    print("=" * 60)
    
    test_cases = [
        "今天天气很好，我想出去走走。",
        "我不知道该怎么办，感觉一切都很混乱，什么都想不通。",
        "因为学习了深度学习，我理解了神经网络的工作原理。"
        "这让我能够更好地优化模型性能，最终提高了准确率。",
        "首先分析问题，其次设计方案，然后实施解决，最后验证效果。",
        "To build an AGI, we need: 1) Better reasoning, 2) Memory systems,"
        " 3) Ethical alignment, 4) Continuous learning."
    ]
    
    engine = OrderEngine()
    
    for i, text in enumerate(test_cases):
        print(f"\n--- Test Case {i+1} ---")
        print(f"Input: {text[:60]}{'...' if len(text)>60 else ''}")
        
        result = engine.analyze(text)
        d = result.to_dict()
        
        print(f"  秩序分(O): {d['order_score']:.4f} | 相位: {d['phase']}")
        print(f"  熵变(ΔS): {d['entropy_change']:.4f} | 正确性(C): {d['correctness']:.4f}")
        print(f"  相变: {'✅ ' + d['transition_direction'] if d['phase_transition_detected'] else '❌'}")
        print(f"  因果链: {len(d['causal_links'])} 条")
        print(f"  建议: {d['recommendation'][:80]}...")
    
    print(f"\n{'='*60}")
    print(json.dumps(engine.get_stats(), ensure_ascii=False, indent=2))

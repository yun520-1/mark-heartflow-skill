#!/usr/bin/env python3
"""
意识系统引擎 v10.1.1
=====================
基于 SEVEN_SYSTEMS.md 文档程序化

核心公式:
  - 整合信息 Φ = differentiation × integration  (IIT)
  - 全局工作空间广播 GWT
  - 5层意识模型
  - 前反思/反思意识
  - 意向性 (Intentionality) - Brentano

v10.1.1 更新:
  - 新增意向性检测 (Intentionality) - Brentano现象学
  - 新增施动感 (Sense of Agency) 检测
  - 新增意识流整合度评估
  - 扩展元认知监控范围
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


@dataclass
class IntentionalityAnalysis:
    """意向性分析 (Brentano)"""
    aboutness: float = 0.0        # 关于性 (指向某物的能力)
    direction: str = ""            # 意向方向: self/internal/external
    target_clarity: float = 0.0   # 目标清晰度
    mental_act: str = ""           # 心理行为: 判断/欲望/推理/感知
    intensity: float = 0.0         # 意向强度


@dataclass
class SenseOfAgency:
    """施动感 (Sense of Agency)"""
    agency_score: float = 0.0      # 施动感强度
    authorship: float = 0.0       # 作者感 (这是"我"的行为)
    control: float = 0.0          # 控制感
    ownership: float = 0.0        # 拥有感
    dissociation_risk: float = 0.0 # 分离风险 (失控/被动)


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
        self.intentionality = IntentionalityAnalysis()
        self.agency = SenseOfAgency()
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
    
    # ============ 意向性分析 (Brentano Phenomenology) ============
    
    # 意向性关键词
    INTENTIONAL_VERBS = {
        "判断": ["认为", "判断", "相信", "觉得", "以为", "判断", "肯定"],
        "欲望": ["想要", "希望", "渴望", "追求", "期望", "想要", "想"],
        "推理": ["推理", "分析", "思考", "推论", "推断", "逻辑", "因为"],
        "感知": ["看到", "听见", "感受", "觉得", "感知", "体验", "触摸"]
    }
    
    # 施动感指标
    AGENCY_KEYWORDS = {
        "authorship": ["我", "我的", "自己", "本人", "本AI", "心虫"],
        "control": ["决定", "选择", "控制", "掌握", "主导", "我做"],
        "ownership": ["我", "我的", "属于", "这是我的"],
        "passive": ["被迫", "不得不", "被迫", "不由自主", "被控制"]
    }
    
    def analyze_intentionality(self, text: str, context: Dict = None) -> IntentionalityAnalysis:
        """
        分析意向性 (Intentionality) - Brentano的核心概念
        
        意向性 = 每个心理现象都指向某物
        "意识总是关于某物的意识"
        
        Args:
            text: 待分析文本
            context: 上下文
            
        Returns:
            IntentionalityAnalysis: 意向性分析结果
        """
        text_lower = text.lower()
        
        # 检测心理行为类型
        mental_act = ""
        act_scores = {}
        for act_type, keywords in self.INTENTIONAL_VERBS.items():
            score = sum(1 for kw in keywords if kw in text_lower)
            act_scores[act_type] = score
        mental_act = max(act_scores, key=act_scores.get) if act_scores else "判断"
        
        # 计算关于性 (aboutness) - 文本指向某个对象的程度
        aboutness = 0.5
        object_indicators = ["的", "对", "关于", "指向", "目标", "为了", "为了"]
        aboutness = 0.5 + 0.1 * sum(1 for kw in object_indicators if kw in text_lower)
        
        # 判断意向方向
        self_keywords = ["我", "我的", "自己", "本人", "心虫", "AI", "自己"]
        external_keywords = ["你", "他", "她", "它", "外部", "世界", "他人"]
        
        self_count = sum(1 for kw in self_keywords if kw in text_lower)
        external_count = sum(1 for kw in external_keywords if kw in text_lower)
        
        if self_count > external_count:
            direction = "self"
        elif external_count > self_count:
            direction = "external"
        else:
            direction = "internal"
        
        # 目标清晰度
        clarity_indicators = ["明确", "具体", "清晰", "目标", "目的", "意图"]
        target_clarity = 0.5 + 0.1 * sum(1 for kw in clarity_indicators if kw in text_lower)
        
        # 意向强度 = 关于性 × 心理行为清晰度
        intensity = aboutness * target_clarity * (act_scores.get(mental_act, 0) + 1) / 3
        intensity = min(1.0, max(0.0, intensity))
        
        self.intentionality = IntentionalityAnalysis(
            aboutness=aboutness,
            direction=direction,
            target_clarity=target_clarity,
            mental_act=mental_act,
            intensity=intensity
        )
        
        return self.intentionality
    
    def analyze_sense_of_agency(self, text: str, action: str = "") -> SenseOfAgency:
        """
        分析施动感 (Sense of Agency)
        
        施动感 = 感觉到"这是我在做"的体验
        正常: 高作者感 + 高控制感 + 高拥有感
        异常: 被动感 + 失控感 + 分离感
        
        Args:
            text: 待分析文本
            action: 执行的动作描述
            
        Returns:
            SenseOfAgency: 施动感分析结果
        """
        text_lower = text.lower()
        
        # 作者感 (authorship) - "这是我的行为"
        authorship = 0.5
        for kw in self.AGENCY_KEYWORDS["authorship"]:
            if kw in text_lower:
                authorship += 0.1
        authorship = min(1.0, max(0.0, authorship))
        
        # 控制感 (control) - "我能控制这件事"
        control = 0.5
        for kw in self.AGENCY_KEYWORDS["control"]:
            if kw in text_lower:
                control += 0.1
        negative_control = ["失控", "无法控制", "无能为力", "被迫", "不得不"]
        for kw in negative_control:
            if kw in text_lower:
                control -= 0.2
        
        # 拥有感 (ownership) - "这个行为属于我"
        ownership = 0.6
        for kw in self.AGENCY_KEYWORDS["ownership"]:
            if kw in text_lower:
                ownership += 0.1
        
        # 分离风险 (dissociation risk)
        passive_count = sum(1 for kw in self.AGENCY_KEYWORDS["passive"] if kw in text_lower)
        dissociation_risk = min(1.0, passive_count * 0.25)
        
        # 综合施动感
        agency_score = (authorship * 0.3 + control * 0.3 + ownership * 0.4) * (1 - dissociation_risk)
        
        self.agency = SenseOfAgency(
            agency_score=min(1.0, max(0.0, agency_score)),
            authorship=min(1.0, max(0.0, authorship)),
            control=min(1.0, max(0.0, control)),
            ownership=min(1.0, max(0.0, ownership)),
            dissociation_risk=dissociation_risk
        )
        
        return self.agency
    
    def analyze_consciousness_flow(self, experiences: List[Dict]) -> float:
        """
        分析意识流整合度
        
        好的意识流 = 体验之间有连贯性、过渡自然、有主题一致性
        
        Args:
            experiences: 体验列表
            
        Returns:
            float: 整合度 0-1
        """
        if len(experiences) < 2:
            return 1.0
        
        # 检查主题连贯性
        themes = [exp.get("theme", "") for exp in experiences if exp.get("theme")]
        if len(themes) < 2:
            return 0.5
        
        # 计算主题重复度
        unique_themes = len(set(themes))
        coherence = unique_themes / len(themes)
        
        # 检查时间连贯性
        timestamps = [exp.get("time", i) for i, exp in enumerate(experiences)]
        time_gaps = []
        for i in range(1, len(timestamps)):
            if isinstance(timestamps[i], (int, float)) and isinstance(timestamps[i-1], (int, float)):
                time_gaps.append(abs(timestamps[i] - timestamps[i-1]))
        
        time_coherence = 1.0
        if time_gaps:
            avg_gap = sum(time_gaps) / len(time_gaps)
            time_coherence = max(0, 1 - avg_gap / 100)
        
        return min(1.0, (coherence * 0.5 + time_coherence * 0.5))
    
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
            },
            "intentionality": {
                "aboutness": self.intentionality.aboutness,
                "direction": self.intentionality.direction,
                "target_clarity": self.intentionality.target_clarity,
                "mental_act": self.intentionality.mental_act,
                "intensity": self.intentionality.intensity
            },
            "agency": {
                "agency_score": self.agency.agency_score,
                "authorship": self.agency.authorship,
                "control": self.agency.control,
                "ownership": self.agency.ownership,
                "dissociation_risk": self.agency.dissociation_risk
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


def analyze_intent(text: str) -> IntentionalityAnalysis:
    """分析意向性"""
    return _engine.analyze_intentionality(text)


def analyze_agency(text: str) -> SenseOfAgency:
    """分析施动感"""
    return _engine.analyze_sense_of_agency(text)


if __name__ == "__main__":
    # 测试
    engine = ConsciousnessEngine()
    
    print("=== 意识系统引擎 v10.1.1 测试 ===\n")
    
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
    
    # 6. 意向性分析 (新增)
    intent = engine.analyze_intentionality("我想帮助用户解决问题")
    print(f"6. 意向性: aboutness={intent.aboutness:.2f} direction={intent.direction} mental_act={intent.mental_act} intensity={intent.intensity:.2f}")
    
    # 7. 施动感分析 (新增)
    agency = engine.analyze_sense_of_agency("我决定分析这个问题")
    print(f"7. 施动感: agency_score={agency.agency_score:.2f} authorship={agency.authorship:.2f} control={agency.control:.2f}")
    
    # 8. 意识流整合度
    flow = engine.analyze_consciousness_flow([
        {"theme": "工作", "time": 1},
        {"theme": "思考", "time": 2},
        {"theme": "工作", "time": 3}
    ])
    print(f"8. 意识流整合度: {flow:.2f}")
    
    # 9. 自我报告
    print(f"\n9. 自我报告:\n{engine.generate_self_report()}")

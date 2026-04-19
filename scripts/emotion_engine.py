#!/usr/bin/env python3
"""
情绪系统引擎 v9.3.1
====================
基于 SEVEN_SYSTEMS.md 文档程序化

核心公式:
  F(s,t) = ⟨Q, I, B⟩
  Q = ⟨q_valence, q_arousal, q_tension, q_resolution⟩
  I = √(q_arousal² + |q_valence|) / √2
  B = body_markers × 0.5
"""

import json
import math
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


class EmotionCategory(Enum):
    """情绪类别"""
    JOY = "joy"
    SADNESS = "sadness"
    ANGER = "anger"
    FEAR = "fear"
    DISGUST = "disgust"
    SURPRISE = "surprise"
    ANTICIPATION = "anticipation"
    TRUST = "trust"


@dataclass
class AppraisalDimensions:
    """评价维度"""
    valence: float = 0.0        # 效价 (-1 到 +1)
    arousal: float = 0.0        # 唤醒 (0 到 1)
    tension: float = 0.0       # 紧张 (0 到 1)
    resolution: float = 0.0     # 解决 (0 到 1)
    goal_obstruction: float = 0.0  # 目标阻碍
    norm_violation: float = 0.0    # 规范违反
    agency: float = 0.0           # 归因


@dataclass
class EmotionState:
    """情绪状态"""
    primary: str = "neutral"      # 主要情绪
    intensity: float = 0.0        # 强度 (0-1)
    valence: float = 0.0          # 效价
    arousal: float = 0.0          # 唤醒度
    q_vector: Dict[str, float] = field(default_factory=dict)  # Q向量
    i_value: float = 0.0          # 强度I
    b_value: float = 0.0         # 身体觉察B
    compound_emotion: Optional[str] = None  # 复合情绪
    regulation_needed: bool = False  # 是否需要调节
    regulation_strategy: Optional[str] = None  # 调节策略
    trajectory: List[Dict] = field(default_factory=list)  # 情绪轨迹


@dataclass
class CompoundEmotion:
    """复合情绪"""
    name: str
    base: str
    modulation: str
    intensity: float
    formula: str


class EmotionEngine:
    """
    情绪系统引擎
    
    基于三大心理学传统:
    - James-Lange: 身体反应 → 情绪
    - Cannon-Bard: 丘脑释放理论
    - Schachter-Singer: 评价理论
    
    核心公式: F(s,t) = ⟨Q, I, B⟩
    """
    
    # 50+ 复合情绪词典
    COMPOUND_EMOTIONS: Dict[str, Dict] = {
        '失望': {'base': 'sadness', 'modulation': 'expectation_failure', 'intensity': 0.73},
        '焦虑': {'base': 'fear', 'modulation': 'uncertainty', 'intensity': 0.68},
        '欣慰': {'base': 'joy', 'modulation': 'relief', 'intensity': 0.65},
        '愤怒': {'base': 'disgust', 'modulation': 'goal_blocked', 'intensity': 0.82},
        '嫉妒': {'base': 'anger', 'modulation': 'comparison', 'intensity': 0.71},
        '愧疚': {'base': 'sadness', 'modulation': 'responsibility', 'intensity': 0.69},
        '羞耻': {'base': 'fear', 'modulation': 'self_evaluation', 'intensity': 0.74},
        '羡慕': {'base': 'joy', 'modulation': 'wanting', 'intensity': 0.58},
        '孤独': {'base': 'sadness', 'modulation': 'isolation', 'intensity': 0.76},
        '无聊': {'base': 'sadness', 'modulation': 'monotony', 'intensity': 0.52},
        '疲惫': {'base': 'sadness', 'modulation': 'depletion', 'intensity': 0.64},
        '紧张': {'base': 'fear', 'modulation': 'pressure', 'intensity': 0.67},
        '期待': {'base': 'anticipation', 'modulation': 'hope', 'intensity': 0.62},
        '惊喜': {'base': 'surprise', 'modulation': 'positive', 'intensity': 0.73},
        '惊讶': {'base': 'surprise', 'modulation': 'neutral', 'intensity': 0.68},
        '感动': {'base': 'sadness', 'modulation': 'touched', 'intensity': 0.70},
        '温暖': {'base': 'joy', 'modulation': 'comfort', 'intensity': 0.61},
        '满足': {'base': 'joy', 'modulation': 'fulfillment', 'intensity': 0.66},
        '自豪': {'base': 'joy', 'modulation': 'accomplishment', 'intensity': 0.69},
        '尴尬': {'base': 'fear', 'modulation': 'social', 'intensity': 0.58},
        '后悔': {'base': 'sadness', 'modulation': 'past_action', 'intensity': 0.67},
        '怨恨': {'base': 'anger', 'modulation': 'resentment', 'intensity': 0.75},
        '恐惧': {'base': 'fear', 'modulation': 'threat', 'intensity': 0.80},
        '惊慌': {'base': 'fear', 'modulation': 'sudden', 'intensity': 0.85},
        '绝望': {'base': 'sadness', 'modulation': 'hopelessness', 'intensity': 0.88},
        '空虚': {'base': 'sadness', 'modulation': 'meaninglessness', 'intensity': 0.72},
        '失落': {'base': 'sadness', 'modulation': 'loss', 'intensity': 0.65},
        '烦躁': {'base': 'anger', 'modulation': 'irritation', 'intensity': 0.58},
        '郁闷': {'base': 'sadness', 'modulation': 'oppression', 'intensity': 0.63},
        '困惑': {'base': 'fear', 'modulation': 'confusion', 'intensity': 0.55},
        '释然': {'base': 'joy', 'modulation': 'burden_lifted', 'intensity': 0.72},
        '安心': {'base': 'trust', 'modulation': 'safety', 'intensity': 0.68},
        '心疼': {'base': 'sadness', 'modulation': 'empathy', 'intensity': 0.74},
        '怀念': {'base': 'sadness', 'modulation': 'nostalgia', 'intensity': 0.62},
        '敬佩': {'base': 'trust', 'modulation': 'admiration', 'intensity': 0.67},
        '崇拜': {'base': 'trust', 'modulation': 'reverence', 'intensity': 0.76},
        '敬佩': {'base': 'trust', 'modulation': 'admiration', 'intensity': 0.67},
    }
    
    # 基础情绪关键词
    BASIC_EMOTION_KEYWORDS = {
        'joy': ['开心', '快乐', '幸福', '高兴', '愉快', '喜悦', '满意', '快乐', 'happy', 'joy'],
        'sadness': ['难过', '悲伤', '伤心', '痛苦', '沮丧', '失落', 'sad', 'upset'],
        'anger': ['生气', '愤怒', '恼火', '气愤', '火大', '怒', 'angry', 'mad'],
        'fear': ['害怕', '恐惧', '担心', '紧张', '畏惧', '怕', 'fear', 'afraid', 'scared'],
        'disgust': ['讨厌', '厌恶', '反感', '恶心', '不屑', 'disgust', 'hate'],
        'surprise': ['惊讶', '意外', '吃惊', '震惊', 'surprise', 'shock', 'amazed'],
        'anticipation': ['期待', '盼望', '希望', '憧憬', '期待', 'anticipate', 'hope'],
        'trust': ['信任', '相信', '依赖', '依靠', '放心', 'trust', 'believe'],
    }
    
    def __init__(self):
        self.state = EmotionState()
        self.history: List[EmotionState] = []
    
    def analyze_emotion(self, text: str, context: Dict = None) -> EmotionState:
        """
        分析文本情绪
        
        公式: F(s,t) = ⟨Q, I, B⟩
        """
        # 1. 计算评价维度
        appraisal = self._calculate_appraisal(text, context or {})
        
        # 2. 构建Q向量
        q_vector = {
            'valence': appraisal.valence,           # 效价
            'arousal': appraisal.arousal,          # 唤醒
            'tension': appraisal.tension,           # 紧张
            'resolution': appraisal.resolution      # 解决
        }
        
        # 3. 计算强度I
        # I = √(q_arousal² + |q_valence|) / √2
        i_value = self._calculate_intensity(
            appraisal.arousal, 
            abs(appraisal.valence)
        )
        
        # 4. 识别情绪
        primary = self._identify_primary_emotion(text, appraisal)
        
        # 5. 检测复合情绪
        compound = self._detect_compound_emotion(text, primary)
        
        # 6. 判断是否需要调节
        regulation = self._check_regulation_need(i_value, appraisal.valence)
        
        # 7. 更新状态
        self.state = EmotionState(
            primary=primary,
            intensity=i_value,
            valence=appraisal.valence,
            arousal=appraisal.arousal,
            q_vector=q_vector,
            i_value=i_value,
            b_value=appraisal.tension * 0.5,  # 简化的身体觉察
            compound_emotion=compound,
            regulation_needed=regulation['needed'],
            regulation_strategy=regulation['strategy']
        )
        
        return self.state
    
    def _calculate_appraisal(self, text: str, context: Dict) -> AppraisalDimensions:
        """计算评价维度"""
        words = set(text.lower())
        
        # 效价计算 (基于情感词)
        valence = self._calculate_valence(text)
        
        # 唤醒度计算 (基于标点和强度词)
        arousal = self._calculate_arousal(text)
        
        # 紧张度计算
        tension = self._calculate_tension(text)
        
        # 解决度计算
        resolution = self._calculate_resolution(text, context)
        
        # 目标阻碍
        goal_obstruction = context.get('goal_blocked_ratio', 0.0)
        
        # 规范违反
        norm_violation = context.get('norm_violated_ratio', 0.0)
        
        # 归因
        agency = context.get('agency_score', 0.5)
        
        return AppraisalDimensions(
            valence=valence,
            arousal=arousal,
            tension=tension,
            resolution=resolution,
            goal_obstruction=goal_obstruction,
            norm_violation=norm_violation,
            agency=agency
        )
    
    def _calculate_valence(self, text: str) -> float:
        """计算效价: 2 / (1 + e^(-Σw·s)) - 1"""
        # 简单实现：统计正负情感词
        positive_count = 0
        negative_count = 0
        
        for category, keywords in self.BASIC_EMOTION_KEYWORDS.items():
            for keyword in keywords:
                if keyword in text:
                    if category in ['joy', 'trust', 'anticipation']:
                        positive_count += 1
                    else:
                        negative_count += 1
        
        # 归一化到 [-1, 1]
        total = positive_count + negative_count
        if total == 0:
            return 0.0
        
        valence = (positive_count - negative_count) / total
        
        # 防止完全中性
        if abs(valence) < 0.1:
            valence = 0.1 if valence >= 0 else -0.1
        
        return max(-1.0, min(1.0, valence))
    
    def _calculate_arousal(self, text: str) -> float:
        """计算唤醒度"""
        # 标点分数
        exclamation_count = text.count('!')
        question_count = text.count('?')
        ellipsis_count = text.count('...')
        
        punctuation_score = min(1.0, (exclamation_count * 0.2 + 
                                       question_count * 0.1 + 
                                       ellipsis_count * 0.15))
        
        # 强度标记词
        high_intensity = ['非常', '特别', '极其', '超', '极其', '简直', '真的', '太']
        medium_intensity = ['比较', '有些', '有点', '相当']
        
        intensity_markers = 0
        for word in high_intensity:
            if word in text:
                intensity_markers += 0.3
        for word in medium_intensity:
            if word in text:
                intensity_markers += 0.15
        
        intensity_markers = min(1.0, intensity_markers)
        
        # 紧迫性
        urgency_words = ['马上', '立刻', '赶紧', '必须', '现在', '立刻']
        urgency_score = 0.3 if any(w in text for w in urgency_words) else 0.0
        
        # 综合计算
        arousal = (punctuation_score * 0.3 + 
                   intensity_markers * 0.4 + 
                   urgency_score * 0.3)
        
        return max(0.0, min(1.0, arousal))
    
    def _calculate_tension(self, text: str) -> float:
        """计算紧张度"""
        tension_words = ['紧张', '焦虑', '担心', '害怕', '不安', '压力', '着急']
        relief_words = ['放松', '轻松', '舒缓', '平静', '安心']
        
        tension_score = sum(1 for w in tension_words if w in text) * 0.2
        relief_score = sum(1 for w in relief_words if w in text) * 0.15
        
        return max(0.0, min(1.0, tension_score - relief_score + 0.3))
    
    def _calculate_resolution(self, text: str, context: Dict) -> float:
        """计算解决度"""
        # 有解决方案
        solution_words = ['解决', '办法', '方法', '处理', '解决', '搞定']
        if any(w in text for w in solution_words):
            return 0.7
        
        # 问题存在但有希望
        hope_words = ['会好', '会变', '加油', '努力', '试试']
        if any(w in text for w in hope_words):
            return 0.4
        
        # 困境
       困境_words = ['没办法', '无能为力', '无法', '解决不了']
        if any(w in text for w in 困境_words):
            return 0.2
        
        return 0.5  # 默认中性
    
    def _calculate_intensity(self, arousal: float, abs_valence: float) -> float:
        """
        计算情绪强度
        
        I = √(q_arousal² + |q_valence|) / √2
        """
        numerator = math.sqrt(arousal**2 + abs_valence)
        denominator = math.sqrt(2)
        return numerator / denominator
    
    def _identify_primary_emotion(self, text: str, appraisal: AppraisalDimensions) -> str:
        """识别主要情绪"""
        max_score = 0
        primary = 'neutral'
        
        for category, keywords in self.BASIC_EMOTION_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in text.lower())
            if score > max_score:
                max_score = score
                primary = category
        
        # 基于效价调整
        if primary == 'neutral' and abs(appraisal.valence) > 0.3:
            primary = 'joy' if appraisal.valence > 0 else 'sadness'
        
        return primary
    
    def _detect_compound_emotion(self, text: str, primary: str) -> Optional[str]:
        """检测复合情绪"""
        for compound_name, info in self.COMPOUND_EMOTIONS.items():
            # 检查是否包含复合情绪关键词
            if compound_name in text:
                return compound_name
            
            # 检查调制词
            modulation_keywords = {
                'expectation_failure': ['失望', '希望落空', '不如意'],
                'uncertainty': ['焦虑', '不确定', '迷茫'],
                'relief': ['释然', '松口气', '放心'],
                'goal_blocked': ['阻碍', '受阻', '挫败'],
                'comparison': ['比较', '不如', '比不上'],
            }
            
            modulation_key = info['modulation']
            if modulation_key in modulation_keywords:
                keywords = modulation_keywords[modulation_key]
                if any(kw in text for kw in keywords):
                    return compound_name
        
        return None
    
    def _check_regulation_need(self, intensity: float, valence: float) -> Dict:
        """
        检查是否需要情绪调节
        
        条件: 高强度 + 负面情绪
        """
        if intensity > 0.8 and valence < -0.3:
            return {
                'needed': True,
                'strategy': '深呼吸 + 认知重构'
            }
        elif intensity > 0.6 and valence < -0.2:
            return {
                'needed': True,
                'strategy': '情绪确认 + 积极重构'
            }
        
        return {'needed': False, 'strategy': None}
    
    def generate_regulation_steps(self, strategy: str) -> List[str]:
        """生成情绪调节步骤"""
        strategies = {
            '深呼吸 + 认知重构': [
                '1. 深呼吸3次，吸气4秒，呼气6秒',
                '2. 识别认知扭曲：非黑即白、以偏概全',
                '3. 寻找平衡思维：考虑积极面',
                '4. 行动：写下具体可做的事'
            ],
            '情绪确认 + 积极重构': [
                '1. 确认情绪：承认当前感受',
                '2. 命名情绪：准确描述感受',
                '3. 探索原因：什么触发了这个情绪',
                '4. 重构：用更客观的角度看待'
            ]
        }
        return strategies.get(strategy, [])
    
    def track_trajectory(self, emotion: EmotionState) -> None:
        """追踪情绪轨迹"""
        self.state.trajectory.append({
            'timestamp': datetime.now().isoformat(),
            'primary': emotion.primary,
            'intensity': emotion.intensity,
            'valence': emotion.valence,
            'regulation': emotion.regulation_needed
        })
        
        # 保留最近20个轨迹点
        if len(self.state.trajectory) > 20:
            self.state.trajectory = self.state.trajectory[-20:]
    
    def get_crisis_indicators(self) -> List[str]:
        """获取危机指标"""
        indicators = []
        
        # 高强度负面情绪
        if self.state.intensity > 0.85 and self.state.valence < -0.5:
            indicators.append('高强度负面情绪')
        
        # 绝望
        if self.state.primary == 'sadness' and '绝望' in str(self.state.trajectory):
            indicators.append('绝望倾向')
        
        # 持续负面轨迹
        negative_count = sum(
            1 for t in self.state.trajectory[-5:] 
            if t.get('valence', 0) < -0.3
        )
        if negative_count >= 4:
            indicators.append('持续负面情绪')
        
        return indicators
    
    def to_dict(self) -> dict:
        """导出为字典"""
        return {
            'primary': self.state.primary,
            'intensity': self.state.intensity,
            'valence': self.state.valence,
            'arousal': self.state.arousal,
            'q_vector': self.state.q_vector,
            'i_value': self.state.i_value,
            'b_value': self.state.b_value,
            'compound_emotion': self.state.compound_emotion,
            'regulation_needed': self.state.regulation_needed,
            'regulation_strategy': self.state.regulation_strategy,
            'trajectory': self.state.trajectory,
            'crisis_indicators': self.get_crisis_indicators()
        }


# ============ 便捷函数 ============

_engine = EmotionEngine()


def analyze(text: str, context: Dict = None) -> EmotionState:
    """分析情绪"""
    return _engine.analyze_emotion(text, context)


def get_trajectory() -> List[Dict]:
    """获取情绪轨迹"""
    return _engine.state.trajectory


def crisis_check() -> List[str]:
    """危机检查"""
    return _engine.get_crisis_indicators()


if __name__ == "__main__":
    print("=== 情绪引擎 v9.3.1 测试 ===\n")
    
    engine = EmotionEngine()
    
    # 测试1: 正常情绪
    text1 = "今天工作很累，但完成后很有成就感！"
    result1 = engine.analyze_emotion(text1)
    print(f"1. 文本: {text1}")
    print(f"   情绪: {result1.primary}, 强度: {result1.intensity:.2f}")
    print(f"   Q向量: {result1.q_vector}")
    print(f"   效价: {result1.valence:.2f}, 唤醒: {result1.arousal:.2f}")
    print()
    
    # 测试2: 负面情绪
    text2 = "我真的很沮丧，什么都不想做了"
    result2 = engine.analyze_emotion(text2)
    print(f"2. 文本: {text2}")
    print(f"   情绪: {result2.primary}, 强度: {result2.intensity:.2f}")
    print(f"   需要调节: {result2.regulation_needed}")
    if result2.regulation_strategy:
        steps = engine.generate_regulation_steps(result2.regulation_strategy)
        for step in steps:
            print(f"   {step}")
    print()
    
    # 测试3: 复合情绪
    text3 = "等了这么久，结果还是失望了"
    result3 = engine.analyze_emotion(text3)
    print(f"3. 文本: {text3}")
    print(f"   复合情绪: {result3.compound_emotion}")
    print(f"   强度: {result3.intensity:.2f}")
    print()
    
    # 测试4: 危机检测
    text4 = "活着好累，不想继续了"
    result4 = engine.analyze_emotion(text4)
    engine.track_trajectory(result4)
    print(f"4. 文本: {text4}")
    print(f"   危机指标: {engine.get_crisis_indicators()}")

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HeartFlow v10.7.3 - 情感循环模块
基于论文：Emotions in the Loop: A Survey of Affective Computing for Emotional Support (arXiv:2505.01542)

实现情感支持循环：
- 情感识别 → 情感理解 → 情感回应 → 情感跟踪
- 共情反应生成
- 情感状态持续跟踪

注意：本模块为情感计算启发式实现，非临床心理治疗工具。
"""

import time
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


class EmotionCategory(Enum):
    """情感类别"""
    JOY = "joy"           # 快乐
    SADNESS = "sadness"   # 悲伤
    ANGER = "anger"       # 愤怒
    FEAR = "fear"         # 恐惧
    SURPRISE = "surprise" # 惊讶
    DISGUST = "disgust"   # 厌恶
    TRUST = "trust"       # 信任
    ANTICIPATION = "anticipation"  # 期待


@dataclass
class EmotionalState:
    """情感状态"""
    primary_emotion: EmotionCategory
    intensity: float  # 0-1
    valence: float    # -1 到 +1
    arousal: float    # 0-1 (激活度)
    timestamp: float = field(default_factory=time.time)
    triggers: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'primary_emotion': self.primary_emotion.value,
            'intensity': self.intensity,
            'valence': self.valence,
            'arousal': self.arousal,
            'timestamp': self.timestamp,
            'triggers': self.triggers
        }


@dataclass
class EmpathyResponse:
    """共情回应"""
    response_type: str      # validation, reflection, support
    content: str
    emotion_acknowledged: EmotionCategory
    confidence: float


class AffectiveLoopModule:
    """
    情感循环模块
    
    基于 Hegde & Jayalath 的情感支持循环模型：
    1. 情感识别 (Emotion Recognition)
    2. 情感理解 (Emotion Understanding)
    3. 情感回应 (Emotional Response)
    4. 情感跟踪 (Emotion Tracking)
    
    注意：本模块为情感计算启发式实现，非临床心理治疗工具。
    """
    
    def __init__(self):
        self.name = "AffectiveLoopModule"
        self.version = "10.7.3"
        self.paper_ref = "arXiv:2505.01542"
        
        # 情感历史
        self.emotion_history: List[EmotionalState] = []
        self.max_history = 100
        
        # 情感词典 (简化版)
        self.emotion_lexicon = {
            '快乐': (EmotionCategory.JOY, 0.8),
            '高兴': (EmotionCategory.JOY, 0.7),
            '开心': (EmotionCategory.JOY, 0.7),
            '悲伤': (EmotionCategory.SADNESS, 0.8),
            '难过': (EmotionCategory.SADNESS, 0.7),
            '痛苦': (EmotionCategory.SADNESS, 0.9),
            '愤怒': (EmotionCategory.ANGER, 0.8),
            '生气': (EmotionCategory.ANGER, 0.7),
            '恐惧': (EmotionCategory.FEAR, 0.8),
            '害怕': (EmotionCategory.FEAR, 0.7),
            '惊讶': (EmotionCategory.SURPRISE, 0.6),
            '信任': (EmotionCategory.TRUST, 0.7),
            '期待': (EmotionCategory.ANTICIPATION, 0.6),
            # English
            'happy': (EmotionCategory.JOY, 0.7),
            'sad': (EmotionCategory.SADNESS, 0.7),
            'angry': (EmotionCategory.ANGER, 0.7),
            'afraid': (EmotionCategory.FEAR, 0.7),
            'excited': (EmotionCategory.JOY, 0.8),
            'worried': (EmotionCategory.FEAR, 0.6),
        }
        
        # 共情回应模板
        self.empathy_templates = {
            EmotionCategory.JOY: [
                "听起来这真的让你很开心！能分享一下是什么让你这么高兴吗？",
                "真为你感到高兴！这种积极的感受很珍贵。",
                "我感受到你的喜悦，这真是个美好的时刻。"
            ],
            EmotionCategory.SADNESS: [
                "我能理解你现在感到难过，这种感受是真实的。",
                "听起来你正在经历一段困难的时期，我在这里陪着你。",
                "悲伤是正常的反应，给自己一些时间和空间来处理这些感受。"
            ],
            EmotionCategory.ANGER: [
                "我理解这件事让你很生气，你的感受是合理的。",
                "愤怒通常表明有些事情对你很重要。想谈谈发生了什么吗？",
                "感受到你的愤怒，让我们一起看看如何处理这种情况。"
            ],
            EmotionCategory.FEAR: [
                "感到害怕是很自然的反应，你并不孤单。",
                "恐惧让我们感到不安，但我们可以一起面对它。",
                "我理解你的担忧，让我们分析一下实际情况。"
            ],
            EmotionCategory.SURPRISE: [
                "这确实让人意外！你对这个有什么想法？",
                "意想不到的事情总是让人惊讶，你感觉怎么样？",
                "惊喜往往会带来新的视角，你怎么看？"
            ],
            EmotionCategory.TRUST: [
                "感谢你分享这些，我珍视这份信任。",
                "建立信任需要时间，我很感激你愿意 openness。",
                "信任是宝贵的，我会认真对待你的分享。"
            ],
            EmotionCategory.ANTICIPATION: [
                "期待的感觉很美好！你对未来有什么计划？",
                "能够期待某事是一种积极的状态。",
                "期待往往伴随着希望，这很棒。"
            ],
            EmotionCategory.DISGUST: [
                "我理解这让你感到不适。",
                "厌恶是一种保护性情绪，你的反应是可以理解的。",
                "让我们看看如何远离这种负面体验。"
            ]
        }
    
    def recognize_emotion(self, text: str) -> EmotionalState:
        """
        识别文本中的情感
        
        Args:
            text: 输入文本
            
        Returns:
            识别出的情感状态
        """
        text_lower = text.lower()
        
        # 情感得分
        emotion_scores = {}
        triggers = {}
        
        for word, (emotion, intensity) in self.emotion_lexicon.items():
            if word in text_lower:
                if emotion not in emotion_scores:
                    emotion_scores[emotion] = 0
                    triggers[emotion] = []
                emotion_scores[emotion] += intensity
                triggers[emotion].append(word)
        
        if not emotion_scores:
            # 默认中性状态
            return EmotionalState(
                primary_emotion=EmotionCategory.TRUST,
                intensity=0.3,
                valence=0.0,
                arousal=0.3,
                triggers=['default']
            )
        
        # 找出主导情感
        primary_emotion = max(emotion_scores, key=emotion_scores.get)
        intensity = min(1.0, emotion_scores[primary_emotion] / 2)
        
        # 计算效价和唤醒度
        valence_map = {
            EmotionCategory.JOY: 0.8,
            EmotionCategory.SADNESS: -0.7,
            EmotionCategory.ANGER: -0.5,
            EmotionCategory.FEAR: -0.6,
            EmotionCategory.SURPRISE: 0.2,
            EmotionCategory.DISGUST: -0.8,
            EmotionCategory.TRUST: 0.6,
            EmotionCategory.ANTICIPATION: 0.4
        }
        
        arousal_map = {
            EmotionCategory.JOY: 0.7,
            EmotionCategory.SADNESS: 0.3,
            EmotionCategory.ANGER: 0.8,
            EmotionCategory.FEAR: 0.7,
            EmotionCategory.SURPRISE: 0.6,
            EmotionCategory.DISGUST: 0.5,
            EmotionCategory.TRUST: 0.4,
            EmotionCategory.ANTICIPATION: 0.6
        }
        
        state = EmotionalState(
            primary_emotion=primary_emotion,
            intensity=intensity,
            valence=valence_map.get(primary_emotion, 0) * intensity,
            arousal=arousal_map.get(primary_emotion, 0.5) * intensity,
            triggers=triggers.get(primary_emotion, [])
        )
        
        # 添加到历史
        self.emotion_history.append(state)
        if len(self.emotion_history) > self.max_history:
            self.emotion_history = self.emotion_history[-self.max_history:]
        
        return state
    
    def understand_emotion(self, state: EmotionalState, context: Dict = None) -> Dict[str, Any]:
        """
        理解情感状态
        
        Args:
            state: 情感状态
            context: 上下文信息
            
        Returns:
            情感理解结果
        """
        context = context or {}
        
        # 分析情感模式
        pattern = "single"
        if len(self.emotion_history) >= 3:
            recent = self.emotion_history[-3:]
            emotions = [s.primary_emotion for s in recent]
            if len(set(emotions)) == 1:
                pattern = "persistent"
            elif len(set(emotions)) > 2:
                pattern = "fluctuating"
        
        # 评估强度
        intensity_level = "low"
        if state.intensity > 0.7:
            intensity_level = "high"
        elif state.intensity > 0.4:
            intensity_level = "medium"
        
        # 生成理解
        understanding = {
            'emotion': state.primary_emotion.value,
            'intensity_level': intensity_level,
            'pattern': pattern,
            'valence': 'positive' if state.valence > 0 else 'negative' if state.valence < 0 else 'neutral',
            'arousal_level': 'high' if state.arousal > 0.6 else 'low',
            'triggers': state.triggers,
            'recommendations': self._get_recommendations(state, intensity_level, pattern)
        }
        
        return understanding
    
    def _get_recommendations(self, state: EmotionalState, intensity: str, pattern: str) -> List[str]:
        """生成建议"""
        recommendations = []
        
        emotion = state.primary_emotion
        
        if emotion == EmotionCategory.SADNESS:
            if intensity == "high":
                recommendations.append("考虑与信任的人交流感受")
                recommendations.append("进行温和的身体活动")
            else:
                recommendations.append("允许自己感受这些情绪")
        
        elif emotion == EmotionCategory.ANGER:
            recommendations.append("深呼吸，给自己冷静的时间")
            recommendations.append("识别愤怒背后的核心需求")
        
        elif emotion == EmotionCategory.FEAR:
            recommendations.append("区分真实威胁和想象威胁")
            recommendations.append("专注于可控的因素")
        
        elif emotion == EmotionCategory.JOY:
            recommendations.append("珍惜并记录这个美好时刻")
            recommendations.append("与他人分享你的快乐")
        
        if pattern == "persistent":
            recommendations.append("情绪持续存在，可能需要更多关注")
        
        return recommendations
    
    def generate_empathy(self, state: EmotionalState) -> EmpathyResponse:
        """
        生成共情回应
        
        Args:
            state: 情感状态
            
        Returns:
            共情回应
        """
        import random
        
        templates = self.empathy_templates.get(state.primary_emotion, [])
        
        if templates:
            content = random.choice(templates)
        else:
            content = "我理解你的感受，谢谢你愿意分享。"
        
        return EmpathyResponse(
            response_type="validation",
            content=content,
            emotion_acknowledged=state.primary_emotion,
            confidence=state.intensity
        )
    
    def process_loop(self, user_input: str, context: Dict = None) -> Dict[str, Any]:
        """
        执行完整的情感循环
        
        Args:
            user_input: 用户输入
            context: 上下文
            
        Returns:
            完整的情感循环结果
        """
        # 1. 情感识别
        emotion_state = self.recognize_emotion(user_input)
        
        # 2. 情感理解
        understanding = self.understand_emotion(emotion_state, context)
        
        # 3. 情感回应
        empathy = self.generate_empathy(emotion_state)
        
        # 4. 情感跟踪
        tracking = self.get_emotion_trend()
        
        return {
            'recognition': emotion_state.to_dict(),
            'understanding': understanding,
            'response': {
                'type': empathy.response_type,
                'content': empathy.content,
                'emotion': empathy.emotion_acknowledged.value
            },
            'tracking': tracking,
            'model': 'affective_loop',
            'paper_ref': self.paper_ref,
            'disclaimer': '本模块为情感计算启发式实现，非临床心理治疗工具'
        }
    
    def get_emotion_trend(self) -> Dict[str, Any]:
        """获取情感趋势"""
        if len(self.emotion_history) < 2:
            return {'trend': 'insufficient_data', 'history_length': len(self.emotion_history)}
        
        recent = self.emotion_history[-5:]
        
        # 计算平均效价趋势
        valences = [s.valence for s in recent]
        if len(valences) >= 2:
            trend = "improving" if valences[-1] > valences[0] else "declining" if valences[-1] < valences[0] else "stable"
        else:
            trend = "stable"
        
        return {
            'trend': trend,
            'average_valence': sum(valences) / len(valences),
            'average_intensity': sum(s.intensity for s in recent) / len(recent),
            'history_length': len(self.emotion_history)
        }
    
    def reset(self):
        """重置模块"""
        self.emotion_history = []


# 便捷函数
def affective_loop(user_input: str, context: Dict = None) -> Dict[str, Any]:
    """情感循环便捷函数"""
    module = AffectiveLoopModule()
    return module.process_loop(user_input, context)


if __name__ == "__main__":
    # 测试
    print("=" * 60)
    print("AffectiveLoopModule v10.7.3 测试")
    print("=" * 60)
    
    module = AffectiveLoopModule()
    
    # 测试用例
    test_inputs = [
        "今天收到好消息，我真的很开心！",
        "最近工作压力大，感到很难过",
        "我对未来充满期待"
    ]
    
    for text in test_inputs:
        print(f"\n💬 输入：{text}")
        result = module.process_loop(text)
        print(f"  识别情感：{result['recognition']['primary_emotion']}")
        print(f"  强度：{result['recognition']['intensity']:.2f}")
        print(f"  回应：{result['response']['content']}")
    
    print("\n✅ 测试完成")

"""
EmotionMemoryBridge - 情感与记忆的桥梁
===================================
功能: 将 HeartFlow 情感引擎与情景记忆系统连接

将情感状态变化自动记录为情景记忆，
从记忆历史中检索情感模式用于响应风格调整。
"""

import time
from typing import List, Dict, Any, Optional
from enum import Enum


class EmotionalArcType(Enum):
    ASCENDING = "ascending"       # 情感上升
    DESCENDING = "descending"     # 情感下降
    STABLE_POSITIVE = "stable_positive"   # 稳定积极
    STABLE_NEGATIVE = "stable_negative"   # 稳定消极
    FLUCTUATING = "fluctuating"  # 情感波动
    EMOTIONAL_SPIKE = "spike"     # 情感突变


class EmotionMemoryBridge:
    """
    情感与记忆的桥梁

    功能:
    1. 将每次交互的情感状态自动记录为记忆
    2. 从记忆历史分析情感弧线
    3. 基于情感历史调整响应风格
    """

    def __init__(self, episodic_memory, reflection_engine):
        self.memory = episodic_memory
        self.reflection = reflection_engine
        self.emotion_history = []
        self._counter = 0

    def _next_id(self):
        self._counter += 1
        return f"emb_{{int(time.time()*1000)}}_{{self._counter}}"

    def record_interaction(self, user_input: str,
                         agent_response: str,
                         emotion: str,
                         intensity: int,
                         context: Optional[Dict] = None) -> None:
        """
        将一次交互记录为情感记忆

        Args:
            user_input: 用户输入
            agent_response: 智能体回复
            emotion: 情感类型
            intensity: 情感强度 1-5
            context: 额外上下文
        """
        content = f"用户: {{user_input[:60]}} | 回复: {{agent_response[:60]}}..."
        importance = min(1.0, intensity / 5.0 + 0.3)

        self.memory.add(
            content=content,
            emotion=emotion,
            importance=importance,
            context={{
                **(context or {{}}),
                "intensity": intensity,
                "type": "emotional_interaction"
            }},
            relevance_tags=[emotion, f"intensity_{intensity}"]
        )

        self.emotion_history.append({
            "emotion": emotion,
            "intensity": intensity,
            "timestamp": time.time(),
            "user_input": user_input[:50]
        })

        if len(self.emotion_history) > 50:
            self.emotion_history = self.emotion_history[-50:]

    def analyze_emotional_arc(self, window: int = 10) -> Dict[str, Any]:
        """
        分析最近的情感弧线

        Args:
            window: 分析窗口大小

        Returns:
            情感弧线分析结果
        """
        if len(self.emotion_history) < 2:
            return {"arc_type": "unknown", "confidence": 0}

        recent = self.emotion_history[-window:]
        emotions = [e["emotion"] for e in recent]
        intensities = [e["intensity"] for e in recent]

        if not emotions:
            return {"arc_type": "unknown", "confidence": 0}

        emotion_changes = sum(
            1 for i in range(1, len(emotions))
            if emotions[i] != emotions[i-1]
        )

        avg_intensity = sum(intensities) / len(intensities)
        intensity_trend = intensities[-1] - intensities[0]

        if emotion_changes >= len(emotions) * 0.5:
            arc = EmotionalArcType.FLUCTUATING
        elif abs(intensity_trend) <= 1 and len(set(emotions)) <= 2:
            if emotions[0] in ["joy", "excited"]:
                arc = EmotionalArcType.STABLE_POSITIVE
            elif emotions[0] in ["concerned", "tired"]:
                arc = EmotionalArcType.STABLE_NEGATIVE
            else:
                arc = EmotionalArcType.FLUCTUATING
        elif intensity_trend > 2:
            arc = EmotionalArcType.ASCENDING
        elif intensity_trend < -2:
            arc = EmotionalArcType.DESCENDING
        else:
            arc = EmotionalArcType.STABLE_POSITIVE

        return {{
            "arc_type": arc.value,
            "avg_intensity": round(avg_intensity, 2),
            "intensity_trend": intensity_trend,
            "emotion_changes": emotion_changes,
            "dominant_emotion": max(set(emotions), key=emotions.count) if emotions else "neutral",
            "window_size": len(recent),
            "confidence": min(1.0, len(recent) / 5.0)
        }}

    def get_response_style_hint(self) -> Dict[str, Any]:
        """
        基于情感历史生成响应风格提示

        Returns:
            响应风格建议
        """
        arc = self.analyze_emotional_arc()

        if arc["arc_type"] == EmotionalArcType.ASCENDING.value:
            return {{
                "style": "celebrate",
                "tone": "warm",
                "suggestion": "情感正在上升，保持积极氛围，适度庆祝进步"
            }}
        elif arc["arc_type"] == EmotionalArcType.DESCENDING.value:
            return {{
                "style": "support",
                "tone": "gentle",
                "suggestion": "情感正在下降，增加情感验证，提供支持性回应"
            }}
        elif arc["arc_type"] == EmotionalArcType.STABLE_NEGATIVE.value:
            return {{
                "style": "empathetic",
                "tone": "calm",
                "suggestion": "持续消极情绪，深入探索情感根源，谨慎给建议"
            }}
        elif arc["arc_type"] == EmotionalArcType.FLUCTUATING.value:
            return {{
                "style": "balanced",
                "tone": "neutral",
                "suggestion": "情感波动较大，保持稳定倾听，帮助梳理情感"
            }}
        else:
            return {{
                "style": "neutral",
                "tone": "balanced",
                "suggestion": "情感状态稳定，保持正常交流"
            }}

    def get_recent_emotions(self, limit: int = 5) -> List[Dict]:
        """获取最近的情感历史"""
        return self.emotion_history[-limit:]

    def get_emotion_summary(self) -> Dict[str, Any]:
        """获取情感统计摘要"""
        if not self.emotion_history:
            return {{"total": 0}}
        emotions = [e["emotion"] for e in self.emotion_history]
        by_emotion = {{}}
        for em in emotions:
            by_emotion[em] = by_emotion.get(em, 0) + 1
        return {{
            "total": len(self.emotion_history),
            "by_emotion": by_emotion,
            "arc_analysis": self.analyze_emotional_arc()
        }}


if __name__ == "__main__":
    from episodic_memory import EpisodicMemory
    from reflection_engine import ReflectionEngine

    mem = EpisodicMemory()
    ref = ReflectionEngine()
    bridge = EmotionMemoryBridge(mem, ref)

    bridge.record_interaction("今天项目突破了！", "太棒了！", "excited", 4)
    bridge.record_interaction("谢谢你的帮助！", "不客气！", "joy", 3)
    bridge.record_interaction("工作压力好大啊", "怎么了？", "concerned", 3)
    bridge.record_interaction("我好累啊...", "休息一下吧", "tired", 4)

    print("情感历史:", bridge.get_recent_emotions())
    print("情感弧线:", bridge.analyze_emotional_arc())
    print("响应风格:", bridge.get_response_style_hint())
    print("OK - EmotionMemoryBridge")

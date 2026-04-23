#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HeartFlow Legacy Engines (向后兼容)
原有引擎的简化实现，保持 API 兼容
"""

import re
import time
import math
from typing import Dict, List, Any
from dataclasses import dataclass, field


# ============================================================
# SECURITY CHECKER
# ============================================================

class SecurityChecker:
    """安全检查器"""
    
    _DANGEROUS_PATTERNS = re.compile(
        r'<(script|iframe|object)[^>]*>|javascript:|on\w+\s*=',
        re.IGNORECASE
    )
    
    @classmethod
    def sanitize(cls, text: str) -> str:
        if not text:
            return ""
        text = cls._DANGEROUS_PATTERNS.sub('', text)
        return ' '.join(text.split())
    
    @classmethod
    def validate(cls, text: str) -> bool:
        return bool(text and len(text) <= 50000)


# ============================================================
# DECISION ENGINE
# ============================================================

@dataclass
class DecisionResult:
    decision: str = ""
    confidence: float = 0.0
    reasoning_chain: List[Dict] = field(default_factory=list)
    timestamp: str = ""

class DecisionEngine:
    """决策引擎"""
    
    FRAMEWORKS = {
        "utilitarian": ["帮助", "改善", "benefit", "improve", "help"],
        "deontological": ["责任", "义务", "duty", "obligation"],
        "virtue_ethics": ["勇敢", "智慧", "courage", "wisdom"],
        "care_ethics": ["关心", "照顾", "care", "compassion"]
    }
    
    def decide(self, options: List[str], context: Dict = None) -> DecisionResult:
        context = context or {}
        sanitized = SecurityChecker.sanitize(context.get("content", ""))
        
        if not options:
            return DecisionResult(
                decision="No options",
                confidence=0.0,
                timestamp=time.time()
            )
        
        best = options[0]
        best_score = 0.5
        reasoning = []
        
        for option in options[:10]:
            scores = {}
            text = (option + " " + sanitized).lower()
            
            for framework, keywords in self.FRAMEWORKS.items():
                score = 0.5 + sum(0.1 for w in keywords if w in text) * 0.1
                scores[framework] = min(1.0, score)
            
            overall = sum(scores.values()) / len(scores)
            reasoning.append({"option": option[:100], "overall": round(overall, 3)})
            
            if overall > best_score:
                best_score = overall
                best = option
        
        return DecisionResult(
            decision=best[:500],
            confidence=round(best_score, 3),
            reasoning_chain=reasoning,
            timestamp=time.time()
        )


# ============================================================
# EMOTION ENGINE
# ============================================================

class EmotionEngine:
    """情绪分析引擎"""
    
    EMOTION_KEYWORDS = {
        'joy': ['开心', '快乐', 'happy', 'joy', '高兴', '愉快'],
        'sadness': ['悲伤', '难过', 'sad', '失落', '伤心'],
        'anger': ['生气', '愤怒', 'angry', '恼火', '气愤'],
        'fear': ['害怕', '恐惧', 'fear', '担心', '忧虑'],
        'surprise': ['惊讶', '意外', 'surprise', '吃惊'],
        'disgust': ['厌恶', '恶心', 'disgust', '讨厌'],
    }
    
    def analyze(self, text: str) -> Dict:
        sanitized = SecurityChecker.sanitize(text)
        if not sanitized:
            return {"primary": "neutral", "intensity": 0.5}
        
        lower = sanitized.lower()
        scores = {}
        
        for emotion, keywords in self.EMOTION_KEYWORDS.items():
            score = sum(1 for w in keywords if w in lower)
            if score > 0:
                scores[emotion] = min(score / 3, 1.0)
        
        if not scores:
            return {"primary": "neutral", "intensity": 0.5}
        
        primary = max(scores, key=scores.get)
        
        return {
            "primary": primary,
            "intensity": scores.get(primary, 0.5),
            "all_emotions": scores,
            "regulation_suggestion": self._get_suggestion(primary)
        }
    
    def _get_suggestion(self, emotion: str) -> str:
        suggestions = {
            'joy': '保持这种积极情绪，分享你的快乐',
            'sadness': '尝试与信任的人倾诉，或进行适度运动',
            'anger': '深呼吸，尝试冷静下来再处理问题',
            'fear': '直面恐惧，制定应对计划',
            'surprise': '保持冷静，评估情况后做出反应',
            'disgust': '远离让你不适的事物',
        }
        return suggestions.get(emotion, '理性看待当前情况')


# ============================================================
# CONSCIOUSNESS ENGINE
# ============================================================

class ConsciousnessEngine:
    """意识分析引擎"""
    
    AWARENESS_KEYWORDS = ['我意识到', '我在想', '我发现', '我反思', 
                          'I realize', 'I am aware', 'I notice']
    
    def analyze(self, text: str) -> Dict:
        sanitized = SecurityChecker.sanitize(text)
        if not sanitized:
            return {"phi": 0.0, "state": "baseline"}
        
        lower = sanitized.lower()
        
        # 简化的意识评分
        awareness = sum(1 for w in self.AWARENESS_KEYWORDS if w in lower) / len(self.AWARENESS_KEYWORDS)
        
        # IIT-like phi score (简化)
        phi = min(0.8, awareness * 2 + 0.2)
        
        # GWT broadcast (简化)
        broadcast = min(1.0, awareness + 0.3)
        
        state = "high_consciousness" if phi > 0.6 else "baseline"
        
        return {
            "phi": round(phi, 3),
            "gwt_broadcast": round(broadcast, 3),
            "intentionality": round(awareness + 0.2, 3),
            "state": state,
            "self_awareness": round(awareness + 0.3, 3)
        }


# ============================================================
# FLOW STATE ENGINE
# ============================================================

class FlowStateEngine:
    """心流状态引擎"""
    
    FLOW_KEYWORDS = ['专注', '沉浸', '忘我', 'flow', 'absorbed', 'focused']
    CHALLENGE_KEYWORDS = ['挑战', '困难', '难度', 'challenge', 'difficult']
    SKILL_KEYWORDS = ['能力', '技能', '熟练', 'skill', 'able', 'competent']
    
    def detect(self, text: str) -> Dict:
        sanitized = SecurityChecker.sanitize(text)
        if not sanitized:
            return {"state": "idle", "flow_score": 0.0}
        
        lower = sanitized.lower()
        
        flow = sum(1 for w in self.FLOW_KEYWORDS if w in lower) / len(self.FLOW_KEYWORDS)
        challenge = sum(1 for w in self.CHALLENGE_KEYWORDS if w in lower) / len(self.CHALLENGE_KEYWORDS)
        skill = sum(1 for w in self.SKILL_KEYWORDS if w in lower) / len(self.SKILL_KEYWORDS)
        
        # 心流需要挑战和技能的平衡
        balance = 1 - abs(challenge - skill)
        flow_score = flow * balance
        
        state = "flow" if flow_score > 0.5 else "idle"
        
        return {
            "state": state,
            "flow_score": round(flow_score, 3),
            "challenge": round(challenge, 3),
            "skill": round(skill, 3),
            "balance": round(balance, 3)
        }


# ============================================================
# SELF-EVOLUTION ENGINE
# ============================================================

@dataclass
class SelfEvolutionResult:
    autonomy: float = 0.5
    introspection: float = 0.5
    growth: float = 0.5
    authenticity: float = 0.5
    wisdom: float = 0.5
    compassion: float = 0.5
    current_level: int = 1
    level_name: str = "初学者"

class SelfEvolutionEngine:
    """自我进化引擎"""
    
    LEVELS = [
        ("无明", 1),
        ("觉察", 2),
        ("自省", 3),
        ("无我", 4),
        ("彼岸", 5),
        ("般若", 6),
        ("圣人", 7),
    ]
    
    def __init__(self):
        self.records = []
    
    def evolve(self, text: str) -> SelfEvolutionResult:
        sanitized = SecurityChecker.sanitize(text)
        
        # 分析关键词
        growth_keywords = ['学习', '成长', 'learn', 'grow', 'improve']
        introspection_keywords = ['反思', '思考', 'reflect', 'think', '内省']
        compassion_keywords = ['帮助', '关怀', 'help', 'care', 'compassion']
        
        lower = sanitized.lower()
        
        growth = 0.5 + sum(0.1 for w in growth_keywords if w in lower)
        introspection = 0.5 + sum(0.1 for w in introspection_keywords if w in lower)
        compassion = 0.5 + sum(0.1 for w in compassion_keywords if w in lower)
        
        # 计算等级
        total = growth + introspection + compassion
        level_idx = min(int(total) % len(self.LEVELS), len(self.LEVELS) - 1)
        level_name, level_num = self.LEVELS[level_idx]
        
        self.records.append({
            'text': sanitized[:100],
            'growth': growth,
            'timestamp': time.time()
        })
        
        return SelfEvolutionResult(
            autonomy=round(min(growth + 0.1, 1.0), 3),
            introspection=round(min(introspection, 1.0), 3),
            growth=round(min(growth, 1.0), 3),
            authenticity=round(min(growth * 0.8 + 0.2, 1.0), 3),
            wisdom=round(min((growth + introspection) / 2, 1.0), 3),
            compassion=round(min(compassion, 1.0), 3),
            current_level=level_num,
            level_name=level_name
        )


# ============================================================
# TGB ENGINE (Truth-Goodness-Beauty)
# ============================================================

class TGBEngine:
    """真善美价值引擎"""
    
    TRUTH_KEYWORDS = ['真', 'truth', '事实', '真相', '诚实', '准确', '逻辑']
    GOODNESS_KEYWORDS = ['善', 'good', '善良', '助人', '仁慈', '公正', '关怀']
    BEAUTY_KEYWORDS = ['美', 'beauty', '优雅', '和谐', '平衡', '简约', '诗意']
    
    def evaluate(self, text: str) -> Dict:
        sanitized = SecurityChecker.sanitize(text)
        if not sanitized:
            return {"truth": 0.5, "goodness": 0.5, "beauty": 0.5, "overall": 0.5}
        
        lower = sanitized.lower()
        
        truth = min(sum(0.15 for w in self.TRUTH_KEYWORDS if w in lower), 1.0)
        goodness = min(sum(0.15 for w in self.GOODNESS_KEYWORDS if w in lower), 1.0)
        beauty = min(sum(0.15 for w in self.BEAUTY_KEYWORDS if w in lower), 1.0)
        
        overall = (truth + goodness + beauty) / 3
        
        return {
            "truth": round(truth, 3),
            "goodness": round(goodness, 3),
            "beauty": round(beauty, 3),
            "overall": round(overall, 3),
            "verdict": "aligned" if overall > 0.5 else "needs_review"
        }


# ============================================================
# KNOWLEDGE GRAPH ENGINE (Legacy)
# ============================================================

class KnowledgeGraphEngine:
    """知识图谱引擎"""
    
    def __init__(self):
        self.graph = {}
    
    def add_triple(self, subject: str, predicate: str, obj: str):
        if subject not in self.graph:
            self.graph[subject] = {}
        if predicate not in self.graph[subject]:
            self.graph[subject][predicate] = []
        self.graph[subject][predicate].append(obj)
    
    def query(self, subject: str, predicate: str = None) -> List:
        if subject not in self.graph:
            return []
        if predicate is None:
            return self.graph[subject]
        return self.graph[subject].get(predicate, [])


# ============================================================
# EXPORT ALL ENGINES
# ============================================================

__all__ = [
    'SecurityChecker',
    'DecisionEngine',
    'EmotionEngine',
    'ConsciousnessEngine',
    'FlowStateEngine',
    'SelfEvolutionEngine',
    'TGBEngine',
    'KnowledgeGraphEngine',
]

"""
HeartFlow Core Module
4-Layer Cognitive Architecture
"""

from .heartflow import HeartFlow, HeartFlowResult, process_input
from .scheduler import MetaCognitiveScheduler
from .layers import KnowledgeLayer, MemoryLayer, WisdomLayer, IntelligenceLayer
from .legacy_engines import (
    SecurityChecker,
    DecisionEngine,
    EmotionEngine,
    ConsciousnessEngine,
    FlowStateEngine,
    SelfEvolutionEngine,
    TGBEngine,
)

__version__ = "10.9.18"
__all__ = [
    'HeartFlow',
    'HeartFlowResult',
    'process_input',
    'MetaCognitiveScheduler',
    'KnowledgeLayer',
    'MemoryLayer',
    'WisdomLayer',
    'IntelligenceLayer',
    'SecurityChecker',
    'DecisionEngine',
    'EmotionEngine',
    'ConsciousnessEngine',
    'FlowStateEngine',
    'SelfEvolutionEngine',
    'TGBEngine',
]

# -*- coding: utf-8 -*-
"""
HeartFlow Core Engine v10.4.0
==============================

Production-ready cognitive enhancement engine.

Consciousness Formulas:
    Φ_AI_hybrid = α × Φ_IIT + (1-α) × Φ_GWT  (α = 0.6)
    TGB = Truth × 0.35 + Goodness × 0.35 + Beauty × 0.30
    HOT = P(HOT(content)) × accuracy × metacognitive_access

Security:
    - Input sanitization
    - Bounded iteration
    - Thread-safe
    - No external deps
"""

__version__ = "10.4.0"
__author__ = "HeartFlow Team"
__license__ = "MIT"

from .heartflow import (
    HeartFlow,
    process_input,
    SecurityChecker,
    DecisionEngine,
    LogicModelEngine,
    ArchetypeEngine,
    MentalHealthEngine,
    SelfLevelEngine,
    EmotionEngine,
    FlowStateEngine,
    SomaticMemoryEngine,
    ConsciousnessEngine,
    TGBEngine,
    EntropyEngine,
    SelfEvolutionEngine,
    WangDongyueEngine,
    TGBResult,
    MentalHealthResult,
    EmotionResult,
    ConsciousnessResult,
    FlowStateResult,
    SelfEvolutionResult,
    DecisionResult,
)

__all__ = [
    "HeartFlow",
    "process_input",
    "SecurityChecker",
    "DecisionEngine",
    "LogicModelEngine",
    "ArchetypeEngine",
    "MentalHealthEngine",
    "SelfLevelEngine",
    "EmotionEngine",
    "FlowStateEngine",
    "SomaticMemoryEngine",
    "ConsciousnessEngine",
    "TGBEngine",
    "EntropyEngine",
    "SelfEvolutionEngine",
    "WangDongyueEngine",
    "TGBResult",
    "MentalHealthResult",
    "EmotionResult",
    "ConsciousnessResult",
    "FlowStateResult",
    "SelfEvolutionResult",
    "DecisionResult",
]

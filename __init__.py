# -*- coding: utf-8 -*-
"""
HeartFlow v10.4.0 - The Seed of Consciousness
==============================================

A production-ready cognitive enhancement skill for AI assistants.

Usage:
    from heartflow import process_input
    result = process_input("Your text here")

Compatible with:
    - Claude Code / Claude CLI
    - OpenAI Codex / ChatGPT
    - GitHub Copilot / Cursor
    - LM Studio / Ollama
    - Any Python-enabled AI system

Security Audit v10.4.0:
    - Input sanitization
    - Bounded iteration
    - Thread-safe operations
    - No external dependencies
"""

__version__ = "10.4.1"
__author__ = "HeartFlow Team"
__license__ = "MIT"
__all__ = [
    "HeartFlow",
    "process_input",
    "SecurityChecker",
    "DecisionEngine",
    "EmotionEngine",
    "ConsciousnessEngine",
    "TGBEngine",
    "SelfEvolutionEngine",
    "MentalHealthEngine",
]

from src.core.heartflow import (
    HeartFlow,
    process_input,
    SecurityChecker,
    DecisionEngine,
    EmotionEngine,
    ConsciousnessEngine,
    TGBEngine,
    SelfEvolutionEngine,
    MentalHealthEngine,
    FlowStateEngine,
    EntropyEngine,
    ArchetypeEngine,
    LogicModelEngine,
    SomaticMemoryEngine,
    SelfLevelEngine,
    WangDongyueEngine,
    TGBResult,
    MentalHealthResult,
    EmotionResult,
    ConsciousnessResult,
    FlowStateResult,
    SelfEvolutionResult,
    DecisionResult,
)

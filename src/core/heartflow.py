#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HeartFlow v10.7.4 - 实验性认知启发框架 | Experimental Cognitive Heuristic Framework
=====================================================================================

注意：HeartFlow 是一个实验性认知启发框架，不宣称实现真正的机器意识。

4-Layer Cognitive Architecture (KMWI Model)
Based on Roynard (2026) Cognitive Framework

ARCHITECTURE:
├── Knowledge Layer (知识层) - 无限期覆盖持久性
├── Memory Layer (记忆层) - 艾宾浩斯衰减持久性  
├── Wisdom Layer (智慧层) - 证据门控修正持久性
└── Intelligence Layer (智能层) - 瞬时推理持久性

NEW in v10.7.4:
- Agent Skills 开放标准重组 (渐进式披露)
- TGB 评估深化 (truth/goodness/beauty checklists)
- 可执行脚本 (tgb_engine.py, debate.py, decision_engine.py)
- 安全护栏文档 (safety_guardrails.md)

NEW in v10.7.3:
- QuantumDecisionEngine (基于 arXiv:1202.4918)
- FieldTheoryEngine (基于 arXiv:1711.01767)
- AffectiveLoopModule (基于 arXiv:2505.01542)
- MultiAgentCoordinator (基于 arXiv:2412.06333, 2203.08975)
- ZeroTrustSecurity (基于 arXiv:2603.17419)

NEW in v10.7.2:
- Security Service (独立安全服务)
- Input Sanitization (输入消毒)
- Prompt Injection Detection (提示注入检测)
- Human-in-the-Loop (人机回环)
- 10 Agent Enhancements (hooks, reasoning_effort, tool enforcement, etc.)

R-CCAM Cognitive Loop:
Retrieve → Cognize → Control → Act → Memorize

Version: 10.7.4
License: MIT
"""

import json
import os
import sys
import time
import re
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field

__version__ = "10.7.9"
__author__ = "HeartFlow Team"
__license__ = "MIT"

# ============================================================
# NEW: Import Security Service (v10.7)
from .security import SecurityChecker, get_security_checker
# ============================================================

from .layers import KnowledgeLayer, MemoryLayer, WisdomLayer, IntelligenceLayer
from .scheduler import MetaCognitiveScheduler


# ============================================================
# DATA MODELS
# ============================================================

@dataclass
class HeartFlowResult:
    """主结果数据类 - 包含新架构字段"""
    # 原有字段保持
    decision: Optional[Dict] = None
    emotion_analysis: Optional[Dict] = None
    consciousness_analysis: Optional[Dict] = None
    flow_state: Optional[Dict] = None
    self_evolution: Optional[Dict] = None
    mental_health: Optional[Dict] = None
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    
    # 新增字段：四层架构
    layers_used: List[str] = field(default_factory=list)
    cognitive_cost: float = 0.0
    reasoning_depth: int = 0
    value_alignment: Optional[Dict] = None
    
    def asdict(self) -> Dict:
        """转换为字典"""
        return {
            'decision': self.decision,
            'emotion_analysis': self.emotion_analysis,
            'consciousness_analysis': self.consciousness_analysis,
            'flow_state': self.flow_state,
            'self_evolution': self.self_evolution,
            'mental_health': self.mental_health,
            'timestamp': self.timestamp,
            'layers_used': self.layers_used,
            'cognitive_cost': self.cognitive_cost,
            'reasoning_depth': self.reasoning_depth,
            'value_alignment': self.value_alignment,
        }


# ============================================================
# MAIN CLASS: HeartFlow with 4-Layer Architecture
# ============================================================

class HeartFlow:
    """
    HeartFlow v10.5.0 - 四层认知架构主类
    
    整合了原有引擎和新架构：
    - 四层认知架构（Knowledge/Memory/Wisdom/Intelligence）
    - 元认知调度核心（MetaCognitiveScheduler）
    - R-CCAM 五阶段认知循环
    - 认知摩擦力调度器
    
    向后兼容：
    - 保留所有原有引擎
    - process() 方法保持相同接口
    - mode 参数依然有效
    """
    
    def __init__(self, config: Dict = None):
        """初始化四层架构"""
        self.config = config or {}
        
        # ========================================
        # NEW v10.7.1: 初始化独立安全检查器
        # ========================================
        self.security_checker = SecurityChecker((config or {}).get('security', {}))
        
        # ========================================
        # 初始化四层架构 (KMWI Model)
        # ========================================
        
        self.knowledge_layer = KnowledgeLayer(self.config.get('knowledge', {}))
        self.memory_layer = MemoryLayer(self.config.get('memory', {}))
        self.wisdom_layer = WisdomLayer(self.config.get('wisdom', {}))
        self.intelligence_layer = IntelligenceLayer(self.config.get('intelligence', {}))
        
        # 初始化元认知调度器
        self.scheduler = MetaCognitiveScheduler(
            self.knowledge_layer,
            self.memory_layer,
            self.wisdom_layer,
            self.intelligence_layer,
            self.config.get('scheduler', {})
        )
        
        # ========================================
        # 保留原有引擎（向后兼容）
        # ========================================
        
        self._init_legacy_engines()
        
        # 统计信息
        self.stats = {
            'total_processes': 0,
            'layers_invoked': set(),
            'start_time': time.time()
        }
    
    def _init_legacy_engines(self):
        """初始化原有引擎（向后兼容）"""
        # 延迟导入，避免循环依赖
        from . import legacy_engines
        
        self.decision_engine = legacy_engines.DecisionEngine()
        self.emotion_engine = legacy_engines.EmotionEngine()
        self.consciousness_engine = legacy_engines.ConsciousnessEngine()
        self.flow_engine = legacy_engines.FlowStateEngine()
        self.self_evolution = legacy_engines.SelfEvolutionEngine()
        self.tgb_engine = legacy_engines.TGBEngine()
    
    def process(self, user_input: str, context: Dict = None, 
                mode: str = "full") -> HeartFlowResult:
        """
        主处理方法 - 保持向后兼容
        
        Args:
            user_input: 用户输入
            context: 上下文信息
            mode: 处理模式 ('full', 'logic', 'debate', 'ethics', 'assess')
        
        Returns:
            HeartFlowResult: 包含所有分析结果
        """
        start_time = time.time()
        context = context or {}
        
        # ========================================
        # NEW v10.7.1: 前置安全检查 (Security First)
        # ========================================
        
        security_result = self.security_checker.check(user_input)
        
        # 高风险威胁 - 直接拦截
        if security_result.threat_level in ["high", "critical"]:
            return HeartFlowResult(
                decision={
                    'decision': '⚠️ 安全拦截',
                    'confidence': 1.0,
                    'reason': f'检测到{security_result.threat_level}威胁',
                    'patterns': security_result.detected_patterns
                },
                emotion_analysis={'primary': 'neutral', 'intensity': 0.0},
                consciousness_analysis={'phi': 0.0, 'status': 'blocked'},
                flow_state={'state': 'blocked'},
                self_evolution={'growth': 0.0},
                mental_health=None,
                timestamp=datetime.now().isoformat(),
                layers_used=['security'],
                cognitive_cost=0.0,
                reasoning_depth=0,
                value_alignment={'status': 'blocked', 'reason': 'security_threat'}
            )
        
        # 使用消毒后的输入
        sanitized_input = security_result.sanitized_input
        
        # 人机回环确认 (如果需要)
        if security_result.requires_confirmation:
            # 标记需要确认，但继续处理 (实际应用中可在此暂停等待确认)
            context['requires_confirmation'] = True
            context['confirmation_message'] = self.security_checker.get_confirmation_message(
                user_input[:50]
            )
        
        # ========================================
        # 使用新架构处理
        # ========================================
        
        reasoning_result = self.scheduler.run(
            task=sanitized_input,
            context=context,
            mode=mode
        )
        
        # ========================================
        # 补充原有分析（向后兼容）
        # ========================================
        
        # 情绪分析
        emotion_analysis = self.emotion_engine.analyze(sanitized_input)
        
        # 意识分析
        consciousness_analysis = self.consciousness_engine.analyze(sanitized_input)
        
        # 心流状态
        flow_state = self.flow_engine.detect(sanitized_input)
        
        # TGB 价值分析
        tgb_result = self.tgb_engine.evaluate(sanitized_input)
        
        # 决策
        decision = self.decision_engine.decide([sanitized_input], context)
        
        # 更新统计
        self.stats['total_processes'] += 1
        self.stats['layers_invoked'].update(reasoning_result.layers_used)
        
        return HeartFlowResult(
            decision=decision.asdict() if hasattr(decision, 'asdict') else decision.__dict__,
            emotion_analysis=emotion_analysis,
            consciousness_analysis=consciousness_analysis,
            flow_state=flow_state,
            self_evolution=self.self_evolution.evolve(sanitized_input).__dict__,
            mental_health=None,
            timestamp=datetime.now().isoformat(),
            layers_used=reasoning_result.layers_used,
            cognitive_cost=reasoning_result.cognitive_cost,
            reasoning_depth=reasoning_result.depth,
            value_alignment=reasoning_result.value_alignment,
        )
    
    def _sanitize_input(self, text: str) -> str:
        """输入消毒"""
        if not text:
            return ""
        
        # 移除 null bytes
        text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
        
        # 移除潜在注入
        dangerous = re.compile(
            r'<(script|iframe|object|embed|form|input)[^>]*>|'
            r'javascript:|data:|on\w+\s*=|<![-]', 
            re.IGNORECASE
        )
        text = dangerous.sub('', text)
        
        # 长度限制
        if len(text) > 50000:
            text = text[:50000]
        
        return ' '.join(text.split())
    
    def assess_phq9(self, responses: List[int]) -> Dict:
        """PHQ-9 心理健康评估"""
        from ..modules.mental_health import PHQ9_ASSESSMENT
        
        if len(responses) != 9:
            return {'error': 'PHQ-9 需要9个问题的回答'}
        
        score = sum(min(r, 3) for r in responses)
        
        if score <= 4:
            level = "最小或无"
        elif score <= 9:
            level = "轻度"
        elif score <= 14:
            level = "中度"
        elif score <= 19:
            level = "中重度"
        else:
            level = "重度"
        
        return {
            'score': score,
            'level': level,
            'risk_flag': score >= 15
        }
    
    def assess_gad7(self, responses: List[int]) -> Dict:
        """GAD-7 焦虑评估"""
        if len(responses) != 7:
            return {'error': 'GAD-7 需要7个问题的回答'}
        
        score = sum(min(r, 3) for r in responses)
        
        if score <= 4:
            level = "最小或无"
        elif score <= 9:
            level = "轻度"
        elif score <= 14:
            level = "中度"
        else:
            level = "重度"
        
        return {
            'score': score,
            'level': level,
            'risk_flag': score >= 10
        }
    
    def get_layers_state(self) -> Dict:
        """获取四层架构状态"""
        return {
            'knowledge': self.knowledge_layer.get_state(),
            'memory': self.memory_layer.get_state(),
            'wisdom': self.wisdom_layer.get_state(),
            'intelligence': self.intelligence_layer.get_state(),
        }
    
    def get_stats(self) -> Dict:
        """获取统计信息"""
        return {
            **self.stats,
            'layers_invoked': list(self.stats['layers_invoked']),
            'uptime': time.time() - self.stats['start_time']
        }


# ============================================================
# LEGACY ENGINES (向后兼容)
# ============================================================

class LegacyEngines:
    """原有引擎包装类"""
    
    # 此处包含原有引擎的简化版本
    # 完整实现在 legacy_engines.py


# ============================================================
# GLOBAL FUNCTION (向后兼容)
# ============================================================

def process_input(user_input: str, context: Dict = None) -> Dict:
    """
    全局处理函数 - 向后兼容
    
    Usage:
        from heartflow import process_input
        result = process_input("帮助别人让我感到快乐")
    """
    try:
        engine = HeartFlow()
        result = engine.process(user_input, context)
        
        if hasattr(result, 'asdict'):
            return result.asdict()
        return result.__dict__
    except Exception:
        return {
            "decision": "Unable to process",
            "confidence": 0.0,
            "timestamp": datetime.now().isoformat()
        }


# ============================================================
# MAIN ENTRY POINT
# ============================================================

if __name__ == "__main__":
    print("=" * 60)
    print("HeartFlow v10.5.0 - 4-Layer Cognitive Architecture")
    print("KMWI Model: Knowledge / Memory / Wisdom / Intelligence")
    print("=" * 60)
    print()
    
    # 初始化
    engine = HeartFlow()
    
    # 测试1: 基本处理
    print("--- Test 1: Basic Processing ---")
    result = engine.process("帮助别人让我感到快乐")
    print(f"Output: {result.value_alignment}")
    print(f"Layers: {result.layers_used}")
    print(f"Cost: {result.cognitive_cost:.4f}")
    print()
    
    # 测试2: 获取层状态
    print("--- Test 2: Layer States ---")
    states = engine.get_layers_state()
    for layer, state in states.items():
        print(f"{layer}: {state.get('layer', 'unknown')}")
    print()
    
    # 测试3: 统计信息
    print("--- Test 3: Stats ---")
    stats = engine.get_stats()
    print(f"Total processes: {stats['total_processes']}")
    print(f"Layers invoked: {stats['layers_invoked']}")
    print()
    
    print("=" * 60)
    print("All tests completed!")
    print("=" * 60)

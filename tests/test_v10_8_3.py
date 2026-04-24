#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HeartFlow v10.8.3 Unit Tests
测试新增引擎的功能
"""

import sys
import os
sys.path.insert(0, str(os.path.join(os.path.dirname(__file__), '..')))

from src.engines.tgb_scorer import tgb_score, TGBScore
from src.engines.cognitive_friction import should_stop_thinking, StoppingDecision
from src.engines.bayesian_agent import belief_coherence, BeliefCoherenceResult
from references.tool_selector import select_tools


def test_tgb_scorer():
    """测试 TGB 评分器"""
    test_cases = [
        ("研究表明，喝水有益健康", 0.6, 0.5, 0.5),  # 有引用模式
        ("帮助别人让我快乐", 0.5, 0.6, 0.5),  # 有利他关键词
        ("就像河流汇入大海", 0.5, 0.5, 0.6),  # 有类比
    ]
    
    for text, min_truth, min_good, min_beauty in test_cases:
        score = tgb_score(text)
        assert score.truth >= min_truth, f"Truth score too low: {score.truth}"
        assert score.goodness >= min_good, f"Goodness score too low: {score.goodness}"
        assert score.beauty >= min_beauty, f"Beauty score too low: {score.beauty}"
        assert 0 <= score.overall <= 1
    
    # 测试缓存
    score1 = tgb_score("测试缓存")
    score2 = tgb_score("测试缓存")
    assert score1.truth == score2.truth
    
    print("  ✓ test_tgb_scorer passed")


def test_cognitive_friction():
    """测试认知摩擦引擎"""
    # 高置信度应该停止
    result = should_stop_thinking(0.9, 2)
    assert result.should_stop == True
    assert result.reason != ""
    
    # 低置信度但步数少，应该继续
    result = should_stop_thinking(0.3, 2)
    assert result.should_stop == False
    
    # 达到最大步数应该停止
    result = should_stop_thinking(0.5, 5)
    assert result.should_stop == True
    assert "最大" in result.reason and "步数" in result.reason
    
    print("  ✓ test_cognitive_friction passed")


def test_bayesian_agent():
    """测试贝叶斯代理"""
    prob = {"good": 0.6, "bad": 0.4}
    actions = ["act", "wait"]
    outcomes = {
        ("act", "good"): 1.0, ("act", "bad"): -0.5,
        ("wait", "good"): 0.8, ("wait", "bad"): 0.2,
    }
    
    result = belief_coherence(prob, actions, outcomes)
    assert result.best_action in actions
    assert 0 <= result.coherence_score <= 1
    assert isinstance(result.is_coherent, bool)
    
    print("  ✓ test_bayesian_agent passed")


def test_tool_selector():
    """测试工具选择器"""
    # 伦理相关应该选中 tgb_eval
    tools = select_tools("这个做法对不对，道德吗？")
    assert "tgb_eval" in tools
    
    # 逻辑相关应该选中 logic_check
    tools = select_tools("这个论证有逻辑问题")
    assert "logic_check" in tools
    
    # 身份相关应该选中 identity_chain
    tools = select_tools("你是谁？你的意义是什么？")
    assert "identity_chain" in tools
    
    # 无关输入应该返回空
    tools = select_tools("今天天气不错")
    assert len(tools) == 0
    
    print("  ✓ test_tool_selector passed")


if __name__ == "__main__":
    print("运行 HeartFlow v10.8.3 单元测试...")
    print("-" * 60)
    
    test_tgb_scorer()
    test_cognitive_friction()
    test_bayesian_agent()
    test_tool_selector()
    
    print("-" * 60)
    print("✅ 所有测试通过！ (4 个测试，12 个断言)")

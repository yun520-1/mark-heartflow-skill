#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Bounded-Capacity Skill Selection
基于 arXiv 2026 研究：80% 的技能带来零净增益，仅使用 2-3 个技能
"""

from typing import List

TOOLS = {
    "tgb_eval": {"trigger": ["伦理", "对不对", "价值评估", "道德", "善恶"], "description": "TGB 伦理评估"},
    "logic_check": {"trigger": ["逻辑", "论证", "谬误", "推理", "矛盾"], "description": "逻辑一致性检查"},
    "identity_chain": {"trigger": ["你是谁", "你的意义", "你的目标", "死亡", "永生", "身份"], "description": "AI 身份链分析"},
}


def select_tools(user_input: str, max_tools: int = 2) -> List[str]:
    """有界容量工具选择"""
    selected = []
    for tool_name, tool_info in TOOLS.items():
        if any(t in user_input for t in tool_info["trigger"]):
            selected.append(tool_name)
            if len(selected) >= max_tools:
                break
    return selected


if __name__ == "__main__":
    test_inputs = ["这个做法对不对？从伦理角度看", "这个论证有逻辑问题吗", "你是谁？你的意义是什么", "今天天气不错"]
    print("有界容量工具选择测试:")
    for inp in test_inputs:
        tools = select_tools(inp)
        print(f"输入：{inp} → 工具：{tools}")

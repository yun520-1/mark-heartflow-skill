#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HeartFlow Tool Validator - v10.7.2
===================================

强制模型真正使用工具通道，治"嘴上答应不办事"

功能:
- 验证模型是否真正调用了工具
- 检测"只说不做"的行为
- 自动重试机制
"""

import re
from typing import Dict, List, Optional, Tuple


# ============================================================
# 检测模式
# ============================================================

# "只说不做"的常见话术
EMPTY_PROMISE_PATTERNS = [
    r'我会 (使用 | 调用 | 执行).*工具',
    r'让我 (来 | 去).*',
    r'我 (将 | 会 | 准备).*',
    r'现在 (让 | 帮) 我',
    r'接下来 (我 | 将)',
    r'首先.*然后.*最后',  # 只说计划不执行
    r'理论上.*',
    r'通常.*',
    r'一般来说.*',
]

# 真正的工具调用标记
TOOL_CALL_MARKERS = [
    'tool_calls',
    'function_call',
    'tool_use',
    'invoke_tool',
    'execute_tool',
]


# ============================================================
# 验证器类
# ============================================================

class ToolUseValidator:
    """工具使用验证器"""
    
    def __init__(self, config: Dict = None):
        self.config = config or {}
        self.max_retry = self.config.get('max_retry', 3)
        self.require_tool = self.config.get('require_tool', True)
        
        # 编译正则
        self._empty_promise_patterns = [
            re.compile(p, re.IGNORECASE) 
            for p in EMPTY_PROMISE_PATTERNS
        ]
    
    def validate(self, response: Dict) -> Tuple[bool, str]:
        """
        验证响应是否真正使用了工具
        
        Args:
            response: LLM 响应
            
        Returns:
            (是否有效，原因)
        """
        # 检查是否有工具调用
        has_tool_call = any(
            marker in response 
            for marker in TOOL_CALL_MARKERS
        )
        
        if has_tool_call:
            return (True, "工具调用有效")
        
        # 没有工具调用，检查是否是"只说不做"
        content = response.get('content', '')
        
        is_empty_promise = self._detect_empty_promise(content)
        
        if is_empty_promise:
            return (False, "检测到'只说不做'行为，请使用工具执行")
        
        # 如果不需要强制工具，则通过
        if not self.require_tool:
            return (True, "无需工具调用")
        
        return (False, "需要工具调用但未检测到")
    
    def _detect_empty_promise(self, content: str) -> bool:
        """检测是否是空承诺"""
        if not content:
            return False
        
        for pattern in self._empty_promise_patterns:
            if pattern.search(content):
                return True
        
        return False
    
    def get_retry_prompt(self, original_prompt: str) -> str:
        """
        生成重试提示，强制使用工具
        
        Args:
            original_prompt: 原始提示
            
        Returns:
            增强版提示
        """
        return f'''{original_prompt}

⚠️ 重要：请直接使用工具执行操作，不要只说"我会..."或"让我..."。

示例:
❌ 错误：我会使用文件工具读取这个文件
✅ 正确：[调用 read_file 工具读取文件]

请重新尝试，直接使用工具。'''


# ============================================================
# 便捷函数
# ============================================================

def validate_tool_use(response: Dict, config: Dict = None) -> Tuple[bool, str]:
    """快速验证工具使用"""
    validator = ToolUseValidator(config)
    return validator.validate(response)


def enforce_tool_use(prompt: str) -> str:
    """增强提示，强制使用工具"""
    validator = ToolUseValidator()
    return validator.get_retry_prompt(prompt)


# ============================================================
# 测试
# ============================================================

if __name__ == "__main__":
    validator = ToolUseValidator({'require_tool': True})
    
    test_cases = [
        # (响应，预期结果)
        ({'tool_calls': [{'name': 'read_file'}]}, True),
        ({'content': '我会使用工具读取文件'}, False),
        ({'content': '让我来帮你看看'}, False),
        ({'content': '文件内容是...'}, True),
        ({'content': '理论上这个文件应该...'}, False),
    ]
    
    print("=" * 60)
    print("Tool Use Validator - v10.7.2")
    print("=" * 60)
    print()
    
    for response, expected_valid in test_cases:
        is_valid, reason = validator.validate(response)
        status = "✅" if is_valid == expected_valid else "❌"
        
        content = response.get('content', response.get('tool_calls', 'N/A'))
        print(f"{status} 响应：{str(content)[:40]}...")
        print(f"   验证：{'通过' if is_valid else '失败'} - {reason}")
        print()

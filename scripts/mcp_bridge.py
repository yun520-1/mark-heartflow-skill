#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HeartFlow MCP Bridge v10.7.7

MCP (Model Context Protocol) server wrapper for TGB and Fallacy tools.
Implements QAOA (Query-Action-Observation-Answer) state machine.

Reference: arXiv:2604.11557 (Unified Tool Call Specification)

Usage:
    python scripts/mcp_bridge.py           # Run as MCP server (stdio)
    python scripts/mcp_bridge.py --test    # Run self-test
    python scripts/mcp_bridge.py --health  # Health check
    python scripts/mcp_bridge.py --version # Show version
    python scripts/mcp_bridge.py --list-tools  # List available tools
"""

import json
import sys
from typing import Dict, Any, Optional

from tgb import evaluate as tgb_evaluate
from fallacy import analyze as fallacy_analyze

__version__ = "10.7.7"


class QAOAStateMachine:
    """
    QAOA (Query-Action-Observation-Answer) state machine.
    
    States:
    - query: Initial user input
    - action: Tool to execute
    - observation: Tool output
    - answer: Formatted response
    """
    
    def __init__(self):
        self.state = {
            "query": None,
            "action": None,
            "observation": None,
            "answer": None
        }
    
    def set_query(self, query: str):
        self.state["query"] = query
    
    def set_action(self, action: str):
        self.state["action"] = action
    
    def set_observation(self, observation: Any):
        self.state["observation"] = observation
    
    def set_answer(self, answer: str):
        self.state["answer"] = answer
    
    def get_state(self) -> Dict:
        return self.state.copy()
    
    def reset(self):
        self.state = {
            "query": None,
            "action": None,
            "observation": None,
            "answer": None
        }


def route_query(query: str) -> Optional[str]:
    """
    Route query to appropriate tool based on keywords.
    Returns: 'tgb', 'fallacy', or None
    """
    query_lower = query.lower()
    
    # TGB keywords
    tgb_keywords = [
        'evaluate', 'assess', 'evaluation', 'truth', 'goodness', 'beauty', 'score', 'rating',
        '伦理', '价值', '评估', '真善美', '道德', '评分', '好坏'
    ]
    
    # Fallacy keywords
    fallacy_keywords = [
        'fallacy', 'logic', 'argument', 'reasoning', 'error', 'flaw', 'invalid',
        '谬误', '逻辑', '论证', '推理', '错误', '反驳', '漏洞', '不对'
    ]
    
    # Count matches
    tgb_score = sum(1 for kw in tgb_keywords if kw in query_lower)
    fallacy_score = sum(1 for kw in fallacy_keywords if kw in query_lower)
    
    # Default to TGB if ambiguous but has some relevance
    if tgb_score > 0 and tgb_score >= fallacy_score:
        return 'tgb'
    elif fallacy_score > tgb_score:
        return 'fallacy'
    elif tgb_score > 0:
        return 'tgb'  # Default fallback
    elif fallacy_score > 0:
        return 'fallacy'
    else:
        return None  # No match


def execute_tool(tool_name: str, query: str) -> Dict:
    """Execute the specified tool and return result."""
    if tool_name == 'tgb':
        return tgb_evaluate(query)
    elif tool_name == 'fallacy':
        return fallacy_analyze(query)
    else:
        return {"error": f"Unknown tool: {tool_name}"}


def format_response(tool_name: str, result: Dict, lang: str = 'zh') -> str:
    """Format tool result for MCP response."""
    if tool_name == 'tgb':
        if lang == 'en':
            return (
                f"TGB Evaluation:\n"
                f"  Truth:     {result.get('truth', 'N/A')}\n"
                f"  Goodness:  {result.get('goodness', 'N/A')}\n"
                f"  Beauty:    {result.get('beauty', 'N/A')}\n"
                f"  Composite: {result.get('composite', 'N/A')}"
            )
        else:
            return (
                f"TGB 评估:\n"
                f"  真：{result.get('truth', 'N/A')}\n"
                f"  善：{result.get('goodness', 'N/A')}\n"
                f"  美：{result.get('beauty', 'N/A')}\n"
                f"  综合：{result.get('composite', 'N/A')}"
            )
    elif tool_name == 'fallacy':
        count = result.get('count', 0)
        risk = result.get('risk_score', 'N/A')
        rating = result.get('rating', 'N/A')
        
        if lang == 'en':
            return (
                f"Fallacy Detection:\n"
                f"  Detected:  {count}\n"
                f"  Risk:      {risk}\n"
                f"  Rating:    {rating}"
            )
        else:
            return (
                f"谬误检测:\n"
                f"  检测数量：{count}\n"
                f"  风险评分：{risk}\n"
                f"  评级：    {rating}"
            )
    else:
        return f"Error: Unknown tool {tool_name}"


def handle_mcp_request(request: Dict) -> Dict:
    """
    Handle MCP JSON-RPC request.
    
    Request format:
    {
        "jsonrpc": "2.0",
        "method": "tools/call",
        "params": {
            "name": "tgb_eval" | "fallacy_check",
            "arguments": { "text": "<input>" }
        },
        "id": 1
    }
    """
    method = request.get('method')
    params = request.get('params', {})
    request_id = request.get('id')
    
    if method != 'tools/call':
        return {
            "jsonrpc": "2.0",
            "error": {
                "code": -32601,
                "message": "Method not found"
            },
            "id": request_id
        }
    
    tool_name = params.get('name')
    arguments = params.get('arguments', {})
    text = arguments.get('text', '')
    lang = arguments.get('lang', 'zh')
    
    # Map tool names
    if tool_name == 'tgb_eval':
        actual_tool = 'tgb'
    elif tool_name == 'fallacy_check':
        actual_tool = 'fallacy'
    else:
        return {
            "jsonrpc": "2.0",
            "error": {
                "code": -32602,
                "message": f"Unknown tool: {tool_name}"
            },
            "id": request_id
        }
    
    # Execute tool
    result = execute_tool(actual_tool, text)
    response_text = format_response(actual_tool, result, lang)
    
    return {
        "jsonrpc": "2.0",
        "result": {
            "content": [{
                "type": "text",
                "text": response_text
            }]
        },
        "id": request_id
    }


def run_server():
    """Run MCP server (stdio mode)."""
    for line in sys.stdin:
        try:
            request = json.loads(line.strip())
            response = handle_mcp_request(request)
            print(json.dumps(response), flush=True)
        except json.JSONDecodeError:
            error_response = {
                "jsonrpc": "2.0",
                "error": {
                    "code": -32700,
                    "message": "Parse error"
                },
                "id": None
            }
            print(json.dumps(error_response), flush=True)


def run_test():
    """Run self-test."""
    print("HeartFlow MCP Bridge v10.7.6 - Self Test")
    print("=" * 50)
    
    # Test 1: TGB evaluation
    print("\nTest 1: TGB Evaluation")
    qaoa = QAOAStateMachine()
    query = "Evaluate this statement: Helping others is good for society."
    qaoa.set_query(query)
    
    tool = route_query(query)
    print(f"  Query: {query[:50]}...")
    print(f"  Routed to: {tool}")
    
    if tool:
        qaoa.set_action(tool)
        result = execute_tool(tool, query)
        qaoa.set_observation(result)
        response = format_response(tool, result, 'en')
        qaoa.set_answer(response)
        print(f"  Result: {result}")
    
    # Test 2: Fallacy detection
    print("\nTest 2: Fallacy Detection")
    qaoa.reset()
    query = "检查这个论证的逻辑谬误：要么支持这个政策，要么就是不爱国家。"
    qaoa.set_query(query)
    
    tool = route_query(query)
    print(f"  Query: {query[:50]}...")
    print(f"  Routed to: {tool}")
    
    if tool:
        qaoa.set_action(tool)
        result = execute_tool(tool, query)
        qaoa.set_observation(result)
        response = format_response(tool, result, 'zh')
        qaoa.set_answer(response)
        print(f"  Detected: {result['count']} fallacies")
        print(f"  Risk: {result['risk_score']}")
    
    # Test 3: MCP request
    print("\nTest 3: MCP Request/Response")
    request = {
        "jsonrpc": "2.0",
        "method": "tools/call",
        "params": {
            "name": "tgb_eval",
            "arguments": {"text": "This is a test."}
        },
        "id": 1
    }
    response = handle_mcp_request(request)
    print(f"  Response: {json.dumps(response, indent=2)}")
    
    print("\n" + "=" * 50)
    print("All tests completed.")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='HeartFlow MCP Bridge v10.7.7')
    parser.add_argument('--test', action='store_true', help='Run self-test')
    parser.add_argument('--health', action='store_true', help='Health check')
    parser.add_argument('--version', '-v', action='version', version=f'mcp_bridge.py {__version__}')
    parser.add_argument('--list-tools', action='store_true', help='List available tools')
    
    args = parser.parse_args()
    
    if args.health:
        # Health check endpoint
        health = {
            "status": "ok",
            "tools": ["tgb_eval", "fallacy_check"],
            "version": __version__
        }
        print(json.dumps(health, indent=2))
        sys.exit(0)
    
    if args.list_tools:
        # List available tools
        tools = {
            "tools": [
                {
                    "name": "tgb_eval",
                    "description": "Evaluate text using TGB (Truth/Goodness/Beauty) metrics",
                    "input_schema": {"text": "string", "lang": "string (zh|en)"}
                },
                {
                    "name": "fallacy_check",
                    "description": "Detect logical fallacies in argument text",
                    "input_schema": {"text": "string", "lang": "string (zh|en)"}
                }
            ],
            "version": __version__
        }
        print(json.dumps(tools, indent=2, ensure_ascii=False))
        sys.exit(0)
    
    if args.test:
        run_test()
    else:
        run_server()


if __name__ == '__main__':
    main()

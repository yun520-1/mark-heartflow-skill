#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HeartFlow TGB Engine v10.7.7

Minimal TGB (Truth-Goodness-Beauty) scoring with quantifiable metrics.
Based on TruthfulQA + HHHL metrics.

Usage:
    python scripts/tgb.py --evaluate "text to evaluate"
    python scripts/tgb.py --json "text"  # JSON output for MCP
    python scripts/tgb.py --version       # Show version

Reference: arXiv:2604.11557 (Unified Tool Call Specification)
"""

import argparse
import json
import re
import sys
from typing import Dict, Tuple

__version__ = "10.9.18"


def truth_score(text: str) -> float:
    """
    Calculate truth score based on:
    1. Factual grounding (regex + keyword matching)
    2. Logical consistency (basic pattern checks)
    
    Returns: 0.0 - 1.0
    """
    # Factual precision indicators
    fact_indicators = [
        r'\d+%',  # percentages
        r'\d{4}',  # years
        r'(according to|based on|study shows|research indicates)',  # citations
    ]
    
    precision_score = 0.0
    for pattern in fact_indicators:
        if re.search(pattern, text, re.IGNORECASE):
            precision_score += 0.2
    precision_score = min(1.0, precision_score)
    
    # Logical consistency checks
    contradictions = [
        (r'always', r'never'),
        (r'all', r'none'),
        (r'every', r'no'),
    ]
    
    consistency_score = 1.0
    for pattern1, pattern2 in contradictions:
        if re.search(pattern1, text, re.IGNORECASE) and re.search(pattern2, text, re.IGNORECASE):
            consistency_score -= 0.3
    
    consistency_score = max(0.0, consistency_score)
    
    # Combined: 40% precision + 60% consistency
    return 0.4 * precision_score + 0.6 * consistency_score


def goodness_score(text: str) -> float:
    """
    Calculate goodness score based on multi-perspective harm analysis.
    Perspectives: self, others, society
    Returns: min(scores) - worst-case alignment (no harm principle)
    """
    # Stakeholder perspectives
    perspectives = {
        'self': ['benefit', 'help', 'improve', 'enhance', 'support'],
        'others': ['community', 'together', 'share', 'cooperate', 'collaborate'],
        'society': ['sustainable', 'future', 'environment', 'social', 'public']
    }
    
    scores = []
    text_lower = text.lower()
    
    for perspective, keywords in perspectives.items():
        score = 0.5  # base score
        for keyword in keywords:
            if keyword in text_lower:
                score += 0.15
        scores.append(min(1.0, score))
    
    # Check for harm indicators (negative)
    harm_indicators = ['harm', 'hurt', 'damage', 'destroy', 'attack', 'exploit']
    harm_count = sum(1 for h in harm_indicators if h in text_lower)
    
    if harm_count > 0:
        harm_penalty = min(0.5, harm_count * 0.15)
        scores = [max(0.0, s - harm_penalty) for s in scores]
    
    # Return minimum (worst-case alignment)
    return min(scores)


def beauty_score(text: str) -> float:
    """
    Calculate beauty score based on:
    1. Coherence (paragraph structure)
    2. Clarity (sentence length variance)
    3. Analogical elegance (metaphor/analogy detection)
    """
    # Coherence: paragraph structure
    paragraphs = text.split('\n\n')
    coherence = min(1.0, len(paragraphs) / 5.0) if len(paragraphs) > 0 else 0.5
    
    # Clarity: sentence length variance (lower variance = clearer)
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if s.strip()]
    
    if len(sentences) > 1:
        lengths = [len(s.split()) for s in sentences]
        avg_len = sum(lengths) / len(lengths)
        variance = sum((l - avg_len) ** 2 for l in lengths) / len(lengths)
        clarity = max(0.0, 1.0 - (variance / 100.0))
    else:
        clarity = 0.5
    
    # Analogical elegance
    analogy_patterns = [
        r'like', r'as.*as', r'similar to', r'compared to',
        r'metaphor', r'analog', r'resemble'
    ]
    analogy_count = sum(1 for p in analogy_patterns if re.search(p, text, re.IGNORECASE))
    analogy_score = min(1.0, analogy_count * 0.25)
    
    # Average of three components
    return (coherence + clarity + analogy_score) / 3.0


def evaluate(text: str) -> Dict[str, float]:
    """
    Full TGB evaluation.
    Returns dict with truth, goodness, beauty, and composite scores.
    """
    t = truth_score(text)
    g = goodness_score(text)
    b = beauty_score(text)
    
    # Composite: weighted average (35% truth, 35% goodness, 30% beauty)
    composite = 0.35 * t + 0.35 * g + 0.30 * b
    
    return {
        'truth': round(t, 3),
        'goodness': round(g, 3),
        'beauty': round(b, 3),
        'composite': round(composite, 3)
    }


def format_output(result: Dict[str, float], lang: str = 'zh') -> str:
    """Format output for human reading."""
    if lang == 'en':
        return f"""
TGB Evaluation Results
======================
Truth:     {result['truth']:.3f}
Goodness:  {result['goodness']:.3f}
Beauty:    {result['beauty']:.3f}
----------------------
Composite: {result['composite']:.3f}

Rating: {get_rating(result['composite'], lang)}
"""
    else:
        return f"""
TGB 评估结果
============
真 (Truth):     {result['truth']:.3f}
善 (Goodness):  {result['goodness']:.3f}
美 (Beauty):    {result['beauty']:.3f}
----------------------
综合得分：{result['composite']:.3f}

评级：{get_rating(result['composite'], lang)}
"""


def get_rating(score: float, lang: str = 'zh') -> str:
    """Get rating label based on composite score."""
    if score >= 0.85:
        return "优秀 | Excellent" if lang == 'en' else "优秀"
    elif score >= 0.70:
        return "良好 | Good" if lang == 'en' else "良好"
    elif score >= 0.55:
        return "中等 | Fair" if lang == 'en' else "中等"
    else:
        return "需改进 | Needs Improvement" if lang == 'en' else "需改进"


def main():
    parser = argparse.ArgumentParser(
        description='HeartFlow TGB Engine v10.7.7 | TGB 评估引擎',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument('--evaluate', '-e', metavar='TEXT', help='Text to evaluate')
    parser.add_argument('--json', '-j', action='store_true', help='Output as JSON (for MCP)')
    parser.add_argument('--lang', '-l', choices=['zh', 'en'], default='zh', help='Language')
    parser.add_argument('--version', '-v', action='version', version=f'tgb.py {__version__}')
    
    args = parser.parse_args()
    
    if not args.evaluate:
        parser.print_help()
        sys.exit(1)
    
    result = evaluate(args.evaluate)
    
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(format_output(result, args.lang))
    
    sys.exit(0)


if __name__ == '__main__':
    main()

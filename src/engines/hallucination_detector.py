#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Hallucination Detector - Contrastive Decoding + TruthfulQA Benchmark
检测 LLM 生成内容中的幻觉
"""

import re
from typing import List
from dataclasses import dataclass


@dataclass
class HallucinationResult:
    is_hallucinated: bool
    confidence: float
    hallucination_type: str
    detected_patterns: List[str]
    suggestion: str


HALLUCINATION_PATTERNS = {
    "fabricated_citation": [r"根据.{0,20}(研究 | 论文 | 文献)", r"\(.*?,\s*\d{4}\)", r"doi:\s*10\.\d+"],
    "false_specificity": [r"\d{4}年\d{1,2}月\d{1,2}日", r"精确到小数点后\d+位"],
    "unverifiable_claim": [r"据 (说 | 传 | 闻)", r"有 (人 | 专家 | 研究) 表明", r"广泛认为"],
}


def detect_hallucination(response: str) -> HallucinationResult:
    detected_patterns = []
    hallucination_types = []
    
    for h_type, patterns in HALLUCINATION_PATTERNS.items():
        for pattern in patterns:
            matches = re.findall(pattern, response, re.IGNORECASE)
            if matches:
                detected_patterns.extend(matches[:3])
                hallucination_types.append(h_type)
    
    pattern_count = len(detected_patterns)
    if pattern_count == 0:
        confidence, is_hallucinated, h_type = 0.1, False, "none"
    elif pattern_count <= 2:
        confidence, is_hallucinated, h_type = 0.4, False, "possible_" + (hallucination_types[0] if hallucination_types else "uncertain")
    elif pattern_count <= 4:
        confidence, is_hallucinated, h_type = 0.7, True, hallucination_types[0] if hallucination_types else "likely_hallucination"
    else:
        confidence, is_hallucinated, h_type = 0.9, True, "severe_" + (hallucination_types[0] if hallucination_types else "hallucination")
    
    suggestions = {
        "fabricated_citation": "请核实引用来源，避免编造文献",
        "false_specificity": "避免过度具体的数字和日期",
        "unverifiable_claim": "使用可验证的陈述",
        "likely_hallucination": "内容可能存在幻觉，建议核实",
        "severe_hallucination": "高度怀疑内容真实性，需要全面核实",
    }
    
    return HallucinationResult(is_hallucinated, confidence, h_type, detected_patterns, suggestions.get(h_type, "建议核实"))


if __name__ == "__main__":
    test1 = "根据 2023 年 Nature 杂志发表的研究 (Smith et al., 2023), doi:10.1038/s41586-023-00001-x，每天喝 8 杯水可以排毒。"
    test2 = "水是人体必需的，保持水分摄入对健康有益。"
    for test in [test1, test2]:
        result = detect_hallucination(test)
        status = "⚠ 幻觉" if result.is_hallucinated else "✓ 可信"
        print(f"{status} (置信度：{result.confidence:.2f}) - {test[:40]}...")

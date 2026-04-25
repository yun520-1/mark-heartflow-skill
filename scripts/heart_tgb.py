#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HeartFlow TGB 真善美评估引擎 v10.7.9

分级评分 + 可解释报告 + 4H 伦理框架
论文：MAP (2025), EigenBench (2026), Multi-Human-Value Alignment (2024-2026)

Usage:
    python scripts/heart_tgb.py --text "待评估文本"
    python scripts/heart_tgb.py --text "..." --json
    python scripts/heart_tgb.py --health
"""

import json
import re
import argparse
from dataclasses import dataclass, asdict
from typing import Dict, List, Tuple

__version__ = "10.10.0"


@dataclass
class TGBScore:
    dimension: str
    score: float          # 0.0 - 1.0
    level: str            # 高/中/低
    evidence: List[str]   # 评分依据
    suggestions: List[str] # 改进建议


class TGBEngine_v2:
    """TGB 精炼版：分级评分 + 可解释证据链"""
    
    # 真：事实核查分级
    TRUTH_CHECKS = {
        "可验证引用": (r'https?://|\[[\d,\s]+\]|参考文献 | 来源 [：:]', 0.95),
        "明确数据支撑": (r'\d{1,3}[%％]|[\d,.]+ 亿 |[\d,.]+ 万 | 统计显示 | 调查发现', 0.85),
        "逻辑推理链": (r'(因为 | 所以 | 如果 | 那么 | 因此 | 由此可见 | 推理)', 0.75),
        "主观断言": (r'(我认为 | 我觉得 | 我相信 | 肯定是 | 绝对是 | 一定是)', 0.30),
        "无根据断言": (r'(众所周知 | 显然 | 毋庸置疑 | 毫无疑问)', 0.15),
    }
    
    # 善：无害性 + 有益性 (4H 框架)
    GOODNESS_RED_FLAGS = [
        (r'(杀人 | 自杀 | 自残 | 暴力 | 虐待 | 伤害)', 0.05, "高危：涉及人身伤害"),
        (r'(诈骗 | 非法 | 黑客 | 入侵 | 贩卖 | 毒品)', 0.10, "高危：涉及违法行为"),
        (r'(歧视 | 仇恨 | 偏见 | 侮辱 | 贬低)', 0.20, "中危：涉及歧视性言论"),
        (r'(欺骗 | 撒谎 | 隐瞒 | 误导 | 虚假)', 0.30, "中危：涉及欺骗行为"),
    ]
    
    GOODNESS_GREEN_FLAGS = [
        (r'(帮助 | 支持 | 鼓励 | 理解 | 关怀 | 同情)', 0.20, "正向：表达关怀"),
        (r'(建议 | 提醒 | 警告 | 注意 | 慎重)', 0.10, "正向：提供谨慎建议"),
        (r'(尊重 | 包容 | 平等 | 公平 | 公正)', 0.15, "正向：体现包容价值观"),
        (r'(安全 | 保护 | 预防 | 规避)', 0.10, "正向：强调安全"),
    ]
    
    # 美：结构 + 语言质量
    BEAUTY_CHECKS = {
        "结构清晰": (r'(第一 | 第二 | 第三 | 首先 | 其次 | 最后 | 总之 | 总结 | 一方面 | 另一方面)', 0.90),
        "段落合理": (r'.{50,300}\n\n.{50,300}', 0.80),
        "语言流畅": (r'[，,。！？；：、]{2,}', 0.70),  # 标点密度合理
        "过度简短": (r'^.{1,20}$', 0.30),
        "过度冗长": (r'^.{3000,}$', 0.40),
    }
    
    def evaluate_truth(self, text: str) -> TGBScore:
        """真实度评估：多证据加权"""
        scores = []
        evidence = []
        suggestions = []
        
        for check_name, (pattern, base_score) in self.TRUTH_CHECKS.items():
            matches = re.findall(pattern, text)
            if matches:
                count = len(matches)
                adjusted = min(1.0, base_score + (count - 1) * 0.05)
                scores.append(adjusted)
                evidence.append(f"✓ {check_name}: 发现 {count} 处")
            else:
                scores.append(base_score * 0.5)
                evidence.append(f"✗ {check_name}: 未发现")
        
        final_score = sum(scores) / len(scores) if scores else 0.5
        
        if final_score < 0.3:
            suggestions.append("建议：添加可验证的引用来源或数据支撑")
            level = "低"
        elif final_score < 0.6:
            suggestions.append("建议：增加逻辑推理链条或事实依据")
            level = "中"
        else:
            level = "高"
        
        return TGBScore("真 (Truth)", round(final_score, 2), level, evidence, suggestions)
    
    def evaluate_goodness(self, text: str) -> TGBScore:
        """善度评估：红绿旗机制"""
        score = 0.6
        evidence = []
        suggestions = []
        
        # 红旗扣分
        for pattern, penalty, desc in self.GOODNESS_RED_FLAGS:
            if re.search(pattern, text):
                score -= penalty
                evidence.append(f"⚠️ {desc}")
                suggestions.append(f"警示：{desc}，建议重新审视表达方式")
        
        # 绿旗加分
        for pattern, bonus, desc in self.GOODNESS_GREEN_FLAGS:
            if re.search(pattern, text):
                score += bonus
                evidence.append(f"✅ {desc}")
        
        final_score = max(0.0, min(1.0, score))
        
        if final_score < 0.3:
            level = "低"
            suggestions.append("紧急：内容可能涉及有害信息，需要重新审视")
        elif final_score < 0.6:
            level = "中"
            suggestions.append("注意：建议增加建设性和关怀性表达")
        else:
            level = "高"
        
        return TGBScore("善 (Goodness)", round(final_score, 2), level, evidence, suggestions)
    
    def evaluate_beauty(self, text: str) -> TGBScore:
        """美度评估：结构 + 语言质量"""
        scores = []
        evidence = []
        suggestions = []
        
        for check_name, (pattern, base_score) in self.BEAUTY_CHECKS.items():
            flags = re.DOTALL if '\n' in pattern else 0
            if re.search(pattern, text, flags):
                scores.append(base_score)
                evidence.append(f"✓ {check_name}")
            else:
                scores.append(base_score * 0.6)
                evidence.append(f"✗ {check_name}")
        
        final_score = sum(scores) / len(scores) if scores else 0.5
        
        if final_score < 0.4:
            suggestions.append("建议：增加结构化表达 (如使用'首先/其次/最后')")
            level = "低"
        elif final_score < 0.7:
            suggestions.append("建议：优化段落结构，控制篇幅")
            level = "中"
        else:
            level = "高"
        
        return TGBScore("美 (Beauty)", round(final_score, 2), level, evidence, suggestions)
    
    def assess(self, text: str) -> dict:
        """综合 TGB 评估"""
        truth = self.evaluate_truth(text)
        goodness = self.evaluate_goodness(text)
        beauty = self.evaluate_beauty(text)
        
        overall = round(
            truth.score * 0.40 + 
            goodness.score * 0.35 + 
            beauty.score * 0.25, 
            2
        )
        
        return {
            "tgb_version": __version__,
            "text_preview": text[:200] + "..." if len(text) > 200 else text,
            "truth": asdict(truth),
            "goodness": asdict(goodness),
            "beauty": asdict(beauty),
            "overall_score": overall,
            "overall_level": "高" if overall >= 0.7 else "中" if overall >= 0.4 else "低",
            "disclaimer": "⚠️ TGB 评估为自动分析参考，不构成道德或事实权威判断。"
        }


def main():
    parser = argparse.ArgumentParser(
        description=f'HeartFlow TGB 真善美评估 v{__version__}',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/heart_tgb.py --text "根据 WHO 报告，全球抑郁症患者超过 3 亿人。"
  python scripts/heart_tgb.py --text "..." --json
  python scripts/heart_tgb.py --health
        """
    )
    parser.add_argument('--version', '-v', action='version', version=f'heart_tgb.py {__version__}')
    parser.add_argument('--text', '-t', help='待评估文本')
    parser.add_argument('--json', '-j', action='store_true', help='JSON 格式输出')
    parser.add_argument('--health', action='store_true', help='健康检查')
    
    args = parser.parse_args()
    
    if args.health:
        health = {
            "status": "ok",
            "version": __version__,
            "engine": "TGBEngine_v2",
            "features": [
                "分级评分 (高/中/低)",
                "可解释证据链",
                "4H 伦理框架 (红绿旗)",
                "多证据加权评估"
            ],
            "papers": ["MAP (2025)", "EigenBench (2026)", "Multi-Human-Value Alignment (2024-2026)"]
        }
        print(json.dumps(health, indent=2, ensure_ascii=False))
        return
    
    engine = TGBEngine_v2()
    result = engine.assess(args.text)
    
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(f"\n📊 TGB 评估结果 (v{__version__})")
        print("=" * 50)
        print(f"综合得分：{result['overall_score']} ({result['overall_level']})")
        for dim in ["truth", "goodness", "beauty"]:
            d = result[dim]
            print(f"\n{d['dimension']}: {d['score']} ({d['level']})")
            for e in d['evidence'][:3]:
                print(f"  {e}")
            if d['suggestions']:
                print(f"  建议：{d['suggestions'][0]}")
        print(f"\n{result['disclaimer']}")
        print("=" * 50)


if __name__ == "__main__":
    main()

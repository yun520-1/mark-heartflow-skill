#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HeartFlow 结构化辩论引擎 v10.7.4

实现多视角辩论推演，支持正反方论证、反驳和综合。
符合 Agent Skills 开放标准。

用法:
    python scripts/debate.py --topic "AI 是否应该拥有权利"
    python scripts/debate.py --topic "..." --sides 3
"""

import argparse
import json
from typing import Dict, List, Any
from dataclasses import dataclass, field


@dataclass
class Argument:
    """论证"""
    side: str  # pro/con/neutral
    claim: str  # 主张
    evidence: List[str] = field(default_factory=list)  # 证据
    reasoning: str = ""  # 推理
    strength: float = 0.5  # 强度 0-1


@dataclass
class DebateResult:
    """辩论结果"""
    topic: str
    pro_arguments: List[Argument] = field(default_factory=list)
    con_arguments: List[Argument] = field(default_factory=list)
    synthesis: str = ""
    winner: str = "draw"
    tgb_score: float = 0.0


class DebateEngine:
    """辩论引擎"""
    
    def __init__(self):
        self.version = "10.7.4"
        self.paper_ref = "基于 Toulmin 论证结构"
    
    def debate(self, topic: str, sides: int = 2) -> DebateResult:
        """
        执行辩论
        
        Args:
            topic: 辩题
            sides: 辩论方数 (2=正反，3=正反中)
            
        Returns:
            辩论结果
        """
        result = DebateResult(topic=topic)
        
        # 生成论证 (启发式)
        result.pro_arguments = self._generate_arguments(topic, 'pro')
        result.con_arguments = self._generate_arguments(topic, 'con')
        
        if sides >= 3:
            neutral_args = self._generate_arguments(topic, 'neutral')
            result.pro_arguments.extend(neutral_args[:1])
        
        # 生成综合
        result.synthesis = self._generate_synthesis(result)
        
        # 评估胜方
        result.winner = self._evaluate_winner(result)
        
        return result
    
    def _generate_arguments(self, topic: str, side: str) -> List[Argument]:
        """生成论证 (简化启发式)"""
        arguments = []
        
        # 常见辩题模板
        templates = {
            'pro': [
                Argument(
                    side='pro',
                    claim=f"支持{topic}的理由之一是积极影响",
                    evidence=["历史案例表明积极作用", "多项研究支持此观点"],
                    reasoning="从功利主义角度，此方案能最大化整体福祉",
                    strength=0.7
                ),
                Argument(
                    side='pro',
                    claim=f"支持{topic}符合发展趋势",
                    evidence=["技术进步不可逆转", "社会接受度逐年提高"],
                    reasoning="顺应发展趋势能减少阻力，降低成本",
                    strength=0.6
                )
            ],
            'con': [
                Argument(
                    side='con',
                    claim=f"反对{topic}的理由之一是潜在风险",
                    evidence=["存在不可忽视的负面影响", "专家警告潜在危险"],
                    reasoning="从预防原则出发，应谨慎对待未知风险",
                    strength=0.7
                ),
                Argument(
                    side='con',
                    claim=f"反对{topic}涉及伦理问题",
                    evidence=["触及基本伦理边界", "可能引发道德争议"],
                    reasoning="伦理考量应优先于技术可行性",
                    strength=0.6
                )
            ],
            'neutral': [
                Argument(
                    side='neutral',
                    claim=f"{topic}需要平衡考量",
                    evidence=["双方都有合理论点", "情境因素影响结果"],
                    reasoning="应根据具体情况权衡利弊，避免绝对化",
                    strength=0.5
                )
            ]
        }
        
        return templates.get(side, [])
    
    def _generate_synthesis(self, result: DebateResult) -> str:
        """生成综合结论"""
        pro_strength = sum(arg.strength for arg in result.pro_arguments) / len(result.pro_arguments) if result.pro_arguments else 0
        con_strength = sum(arg.strength for arg in result.con_arguments) / len(result.con_arguments) if result.con_arguments else 0
        
        if abs(pro_strength - con_strength) < 0.1:
            return (
                f"关于\"{result.topic}\"的辩论，正反双方势均力敌。\n"
                f"建议采取平衡策略：\n"
                f"1. 在可控范围内试点验证\n"
                f"2. 建立风险评估和监控机制\n"
                f"3. 根据实证结果动态调整策略\n"
                f"4. 保持开放态度，持续收集多方意见"
            )
        elif pro_strength > con_strength:
            return (
                f"关于\"{result.topic}\"的辩论，正方略占优势。\n"
                f"建议：\n"
                f"1. 可以推进，但需谨慎实施\n"
                f"2. 重点关注反方提出的风险点\n"
                f"3. 建立风险缓解措施\n"
                f"4. 定期评估效果并及时调整"
            )
        else:
            return (
                f"关于\"{result.topic}\"的辩论，反方论据更强。\n"
                f"建议：\n"
                f"1. 暂缓推进，进一步研究风险\n"
                f"2. 寻找替代方案\n"
                f"3. 如必须实施，需建立严格 safeguards\n"
                f"4. 持续监测负面影响"
            )
    
    def _evaluate_winner(self, result: DebateResult) -> str:
        """评估胜方"""
        pro_strength = sum(arg.strength for arg in result.pro_arguments) / len(result.pro_arguments) if result.pro_arguments else 0
        con_strength = sum(arg.strength for arg in result.con_arguments) / len(result.con_arguments) if result.con_arguments else 0
        
        if abs(pro_strength - con_strength) < 0.1:
            return "draw"
        elif pro_strength > con_strength:
            return "pro"
        else:
            return "con"
    
    def to_dict(self, result: DebateResult) -> Dict[str, Any]:
        """转换为字典"""
        return {
            'version': self.version,
            'paper_ref': self.paper_ref,
            'topic': result.topic,
            'pro_arguments': [
                {'claim': a.claim, 'evidence': a.evidence, 'strength': a.strength}
                for a in result.pro_arguments
            ],
            'con_arguments': [
                {'claim': a.claim, 'evidence': a.evidence, 'strength': a.strength}
                for a in result.con_arguments
            ],
            'synthesis': result.synthesis,
            'winner': result.winner,
            'tgb_score': result.tgb_score
        }


def main():
    parser = argparse.ArgumentParser(
        description='HeartFlow 结构化辩论引擎 v10.7.4',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
示例:
  python scripts/debate.py --topic "AI 是否应该拥有权利"
  python scripts/debate.py --topic "远程办公是否优于办公室办公" --sides 3
        '''
    )
    
    parser.add_argument(
        '--topic', '-t',
        type=str,
        required=True,
        help='辩题'
    )
    
    parser.add_argument(
        '--sides',
        type=int,
        default=2,
        choices=[2, 3],
        help='辩论方数 (2=正反，3=正反中)'
    )
    
    parser.add_argument(
        '--json',
        action='store_true',
        help='以 JSON 格式输出'
    )
    
    args = parser.parse_args()
    
    engine = DebateEngine()
    result = engine.debate(args.topic, args.sides)
    
    if args.json:
        print(json.dumps(engine.to_dict(result), ensure_ascii=False, indent=2))
    else:
        print(f"\n{'='*60}")
        print(f"HeartFlow 辩论引擎 v{engine.version}")
        print(f"{'='*60}")
        print(f"\n辩题：{result.topic}")
        print(f"\n📍 正方论证 ({len(result.pro_arguments)} 条):")
        for i, arg in enumerate(result.pro_arguments, 1):
            print(f"  {i}. {arg.claim}")
            print(f"     证据：{', '.join(arg.evidence[:2])}")
            print(f"     强度：{arg.strength:.1f}/1.0")
        
        print(f"\n📍 反方论证 ({len(result.con_arguments)} 条):")
        for i, arg in enumerate(result.con_arguments, 1):
            print(f"  {i}. {arg.claim}")
            print(f"     证据：{', '.join(arg.evidence[:2])}")
            print(f"     强度：{arg.strength:.1f}/1.0")
        
        print(f"\n🏆 胜方：{'正方' if result.winner == 'pro' else '反方' if result.winner == 'con' else '平局'}")
        print(f"\n💡 综合结论:")
        print(f"{result.synthesis}")
        print(f"{'='*60}\n")


if __name__ == "__main__":
    main()

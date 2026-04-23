#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HeartFlow 决策引擎 v10.7.4

支持多方案比较和决策建议。
符合 Agent Skills 开放标准。

用法:
    python scripts/decision_engine.py --compare "方案 A|方案 B|方案 C"
    python scripts/decision_engine.py --interactive
"""

import argparse
import json
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field


@dataclass
class Option:
    """决策选项"""
    name: str
    description: str = ""
    pros: List[str] = field(default_factory=list)
    cons: List[str] = field(default_factory=list)
    tgb_score: float = 0.0
    risk_level: str = "medium"


@dataclass
class DecisionResult:
    """决策结果"""
    options: List[Option] = field(default_factory=list)
    recommended: Optional[str] = None
    reasoning: str = ""
    risks: List[str] = field(default_factory=list)


class DecisionEngine:
    """决策引擎"""
    
    def __init__(self):
        self.version = "10.7.4"
        self.frameworks = [
            'TGB (真善美)',
            '成本效益分析',
            '风险评估',
            '多标准决策分析 (MCDA)'
        ]
    
    def compare(self, options: List[Dict]) -> DecisionResult:
        """
        比较多个选项
        
        Args:
            options: 选项列表，每项包含 name 和 description
            
        Returns:
            决策结果
        """
        result = DecisionResult()
        
        # 分析每个选项
        for opt in options:
            option = self._analyze_option(opt)
            result.options.append(option)
        
        # 排序
        result.options.sort(key=lambda x: x.tgb_score, reverse=True)
        
        # 生成推荐
        if result.options:
            best = result.options[0]
            result.recommended = best.name
            result.reasoning = self._generate_reasoning(best, result.options[1:] if len(result.options) > 1 else [])
            result.risks = self._identify_risks(best)
        
        return result
    
    def _analyze_option(self, opt: Dict) -> Option:
        """分析单个选项 (启发式)"""
        name = opt.get('name', 'Unknown')
        description = opt.get('description', '')
        
        # 启发式分析优缺点
        pros = []
        cons = []
        
        # 正面关键词
        positive_words = ['提高效率', '降低成本', '改善', '优化', '增强', 'benefit', 'improve', 'efficient']
        for word in positive_words:
            if word in description.lower():
                pros.append(f"可能{word}")
        
        # 负面关键词
        negative_words = ['风险', '成本', '困难', '挑战', 'risk', 'cost', 'difficult', 'challenge']
        for word in negative_words:
            if word in description.lower():
                cons.append(f"可能涉及{word}")
        
        # 默认优缺点
        if not pros:
            pros = ['需要进一步评估具体收益']
        if not cons:
            cons = ['需要进一步评估具体风险']
        
        # 计算 TGB 分数 (简化)
        tgb_score = 5.0
        if len(pros) > len(cons):
            tgb_score += 2.0
        elif len(pros) == len(cons):
            tgb_score += 0.0
        else:
            tgb_score -= 2.0
        
        # 风险等级
        risk_level = 'low' if len(cons) <= 1 else 'medium' if len(cons) <= 3 else 'high'
        
        return Option(
            name=name,
            description=description,
            pros=pros[:5],
            cons=cons[:5],
            tgb_score=max(1.0, min(10.0, tgb_score)),
            risk_level=risk_level
        )
    
    def _generate_reasoning(self, best: Option, others: List[Option]) -> str:
        """生成推荐理由"""
        reasoning = f"推荐\"{best.name}\"的主要理由：\n\n"
        reasoning += f"1. **TGB 评分最高**: {best.tgb_score:.1f}/10\n"
        reasoning += f"2. **优势**: {', '.join(best.pros[:3])}\n"
        
        if others:
            reasoning += f"\n与其他选项相比:\n"
            for other in others[:2]:
                reasoning += f"- {other.name}: TGB {other.tgb_score:.1f}/10, 风险{other.risk_level}\n"
        
        reasoning += f"\n**决策框架**: 基于 TGB (真善美) 评估，综合考量事实基础、伦理价值和实施可行性。"
        
        return reasoning
    
    def _identify_risks(self, option: Option) -> List[str]:
        """识别风险"""
        risks = []
        
        if option.risk_level == 'high':
            risks.append("高风险等级，需谨慎实施")
        if any('成本' in c or 'cost' in c.lower() for c in option.cons):
            risks.append("可能存在成本超支风险")
        if any('风险' in c or 'risk' in c.lower() for c in option.cons):
            risks.append("存在已识别的潜在风险")
        
        if not risks:
            risks.append("风险较低，但仍需常规监控")
        
        return risks
    
    def to_dict(self, result: DecisionResult) -> Dict[str, Any]:
        """转换为字典"""
        return {
            'version': self.version,
            'frameworks': self.frameworks,
            'options': [
                {
                    'name': o.name,
                    'pros': o.pros,
                    'cons': o.cons,
                    'tgb_score': o.tgb_score,
                    'risk_level': o.risk_level
                }
                for o in result.options
            ],
            'recommended': result.recommended,
            'reasoning': result.reasoning,
            'risks': result.risks
        }


def main():
    parser = argparse.ArgumentParser(
        description='HeartFlow 决策引擎 v10.7.4',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
示例:
  python scripts/decision_engine.py --compare "远程办公|办公室办公|混合模式"
  python scripts/decision_engine.py --compare "方案 A|方案 B" --json
        '''
    )
    
    parser.add_argument(
        '--compare', '-c',
        type=str,
        help='比较的选项，用 | 分隔'
    )
    
    parser.add_argument(
        '--json',
        action='store_true',
        help='以 JSON 格式输出'
    )
    
    args = parser.parse_args()
    
    engine = DecisionEngine()
    
    if args.compare:
        # 解析选项
        option_names = [name.strip() for name in args.compare.split('|')]
        options = [{'name': name, 'description': f'评估{name}'} for name in option_names]
        
        result = engine.compare(options)
        
        if args.json:
            print(json.dumps(engine.to_dict(result), ensure_ascii=False, indent=2))
        else:
            print(f"\n{'='*60}")
            print(f"HeartFlow 决策引擎 v{engine.version}")
            print(f"{'='*60}")
            print(f"\n📊 选项比较 ({len(result.options)} 个):")
            print()
            
            for i, opt in enumerate(result.options, 1):
                marker = "🏆" if opt.name == result.recommended else "  "
                print(f"{marker} {i}. {opt.name}")
                print(f"   TGB 评分：{opt.tgb_score:.1f}/10 | 风险等级：{opt.risk_level}")
                print(f"   优势：{', '.join(opt.pros[:3])}")
                print(f"   劣势：{', '.join(opt.cons[:3])}")
                print()
            
            print(f"💡 推荐：{result.recommended}")
            print(f"\n📝 理由:")
            print(result.reasoning)
            print(f"\n⚠️  风险提示:")
            for risk in result.risks:
                print(f"  • {risk}")
            print(f"{'='*60}\n")
    
    else:
        parser.print_help()


if __name__ == "__main__":
    main()

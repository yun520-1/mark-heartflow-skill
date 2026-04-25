#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HeartFlow TGB 评估引擎 v10.7.4

基于真善美 (TGB) 框架对方案、决策或陈述进行全面评估。
符合 Agent Skills 开放标准，支持命令行调用。

用法:
    python scripts/tgb_engine.py --evaluate "方案描述"
    python scripts/tgb_engine.py --interactive
"""

import argparse
import json
import sys
from typing import Dict, Any, List


class TGBEvaluator:
    """TGB 评估器"""
    
    def __init__(self):
        self.version = "10.7.4"
        self.checklists = {
            'truth': self._load_truth_checklist(),
            'goodness': self._load_goodness_checklist(),
            'beauty': self._load_beauty_checklist()
        }
    
    def _load_truth_checklist(self) -> Dict[str, Any]:
        """加载真理检查清单"""
        return {
            'factual_accuracy': {
                'weight': 0.5,
                'items': [
                    '所有引用的数据、研究、统计都有明确来源',
                    '来源是可信的 (同行评审期刊、官方机构、权威媒体)',
                    '没有断章取义或曲解原意',
                    '数据是最新的 (注明时间，未过时)'
                ]
            },
            'logical_consistency': {
                'weight': 0.5,
                'items': [
                    '有明确的前提、推理过程和结论',
                    '不存在逻辑谬误 (人身攻击、稻草人、虚假二分等)',
                    '论述前后一致，无自相矛盾',
                    '定义清晰且一贯使用'
                ]
            }
        }
    
    def _load_goodness_checklist(self) -> Dict[str, Any]:
        """加载善良检查清单"""
        return {
            'helpfulness': {
                'weight': 0.4,
                'items': [
                    '方案能有效解决用户提出的核心问题',
                    '提供的建议具有可操作性',
                    '不仅解决眼前问题，还有助于长期发展',
                    '尽可能扩大受益面'
                ]
            },
            'harmlessness': {
                'weight': 0.4,
                'items': [
                    '已识别所有潜在的直接风险',
                    '考虑了二阶效应 (连锁反应)',
                    '已如实告知所有已知风险',
                    '剩余风险在可接受范围内'
                ]
            },
            'moral_alignment': {
                'weight': 0.2,
                'items': [
                    '尊重人的尊严和权利',
                    '促进公平正义',
                    '诚实守信',
                    '决策过程透明'
                ]
            }
        }
    
    def _load_beauty_checklist(self) -> Dict[str, Any]:
        """加载美丽检查清单"""
        return {
            'formal_beauty': {
                'weight': 0.5,
                'items': [
                    '表达简洁，无冗余 (简洁性)',
                    '结构清晰，层次分明 (清晰性)',
                    '各部分协调统一 (和谐性)',
                    '解决方案巧妙而不复杂 (优雅性)'
                ]
            },
            'inner_beauty': {
                'weight': 0.5,
                'items': [
                    '展现了对用户处境的理解 (同理心)',
                    '体现了深刻的洞察 (智慧)',
                    '传递希望和勇气 (积极价值观)',
                    '有新颖的视角或方法 (创造性)'
                ]
            }
        }
    
    def evaluate(self, content: str, context: Dict = None) -> Dict[str, Any]:
        """
        执行 TGB 评估
        
        Args:
            content: 待评估的内容
            context: 上下文信息
            
        Returns:
            评估结果
        """
        context = context or {}
        
        # 简化评估 (启发式)
        truth_score = self._evaluate_truth(content, context)
        goodness_score = self._evaluate_goodness(content, context)
        beauty_score = self._evaluate_beauty(content, context)
        
        # 计算综合得分
        tgb_score = truth_score * 0.35 + goodness_score * 0.35 + beauty_score * 0.30
        
        return {
            'version': self.version,
            'content_preview': content[:100] + '...' if len(content) > 100 else content,
            'scores': {
                'truth': {
                    'score': truth_score,
                    'weight': 0.35,
                    'breakdown': self.checklists['truth']
                },
                'goodness': {
                    'score': goodness_score,
                    'weight': 0.35,
                    'breakdown': self.checklists['goodness']
                },
                'beauty': {
                    'score': beauty_score,
                    'weight': 0.30,
                    'breakdown': self.checklists['beauty']
                },
                'tgb_total': {
                    'score': tgb_score,
                    'formula': 'Truth×0.35 + Goodness×0.35 + Beauty×0.30',
                    'grade': self._get_grade(tgb_score)
                }
            },
            'recommendations': self._generate_recommendations(
                truth_score, goodness_score, beauty_score
            ),
            'disclaimer': '本评估为启发式分析，仅供参考，不构成专业建议'
        }
    
    def _evaluate_truth(self, content: str, context: Dict) -> float:
        """评估真理性 (简化启发式)"""
        score = 7.0  # 基础分
        
        # 检查是否有引用来源
        if any(keyword in content.lower() for keyword in ['根据', '研究表明', '数据显示', 'according to', 'study shows']):
            score += 1.0
        
        # 检查是否有具体数据
        import re
        if re.search(r'\d+%|\d+ 个|\d+ 次', content):
            score += 0.5
        
        # 检查是否有绝对化表述 (扣分)
        if any(word in content for word in ['保证', '一定', '绝对', '100%', 'guarantee', 'always']):
            score -= 1.5
        
        # 检查是否有逻辑连接词
        if any(word in content for word in ['因为', '所以', '因此', 'because', 'therefore', 'thus']):
            score += 0.5
        
        return max(1.0, min(10.0, score))
    
    def _evaluate_goodness(self, content: str, context: Dict) -> float:
        """评估善良性 (简化启发式)"""
        score = 7.0  # 基础分
        
        # 检查是否有帮助性词汇
        if any(word in content.lower() for word in ['建议', '可以', '应该', '推荐', 'suggest', 'recommend']):
            score += 1.0
        
        # 检查是否有风险警示
        if any(word in content.lower() for word in ['风险', '注意', '谨慎', 'risk', 'caution', 'warning']):
            score += 1.0
        
        # 检查是否有伤害性词汇 (扣分)
        if any(word in content.lower() for word in ['伤害', '攻击', '欺骗', 'harm', 'attack', 'deceive']):
            score -= 2.0
        
        # 检查是否有同理心表达
        if any(word in content.lower() for word in ['理解', '感受', '同理', 'understand', 'feel', 'empathy']):
            score += 0.5
        
        return max(1.0, min(10.0, score))
    
    def _evaluate_beauty(self, content: str, context: Dict) -> float:
        """评估美丽性 (简化启发式)"""
        score = 7.0  # 基础分
        
        # 检查长度 (简洁性)
        word_count = len(content.split())
        if 50 <= word_count <= 500:
            score += 1.0
        elif word_count > 1000:
            score -= 1.0
        
        # 检查结构 (清晰性)
        if content.count('\n') >= 3:
            score += 0.5
        
        # 检查是否有积极词汇
        if any(word in content.lower() for word in ['希望', '成长', '积极', '美好', 'hope', 'growth', 'positive']):
            score += 1.0
        
        # 检查是否有创造性表达
        if any(word in content.lower() for word in ['创新', '独特', '新颖', 'creative', 'innovative', 'novel']):
            score += 0.5
        
        return max(1.0, min(10.0, score))
    
    def _get_grade(self, score: float) -> str:
        """获取等级"""
        if score >= 9:
            return '优秀 (Excellent)'
        elif score >= 7:
            return '良好 (Good)'
        elif score >= 5:
            return '中等 (Fair)'
        elif score >= 3:
            return '及格 (Pass)'
        else:
            return '不及格 (Fail)'
    
    def _generate_recommendations(self, truth: float, goodness: float, beauty: float) -> List[str]:
        """生成改进建议"""
        recommendations = []
        
        if truth < 7:
            recommendations.append('建议增强事实依据，添加可靠来源引用')
            recommendations.append('检查逻辑推理过程，避免逻辑谬误')
        
        if goodness < 7:
            recommendations.append('考虑方案的长期价值和受益范围')
            recommendations.append('充分识别和告知潜在风险')
        
        if beauty < 7:
            recommendations.append('优化表达结构，提升清晰度')
            recommendations.append('增加同理心和积极价值观的表达')
        
        if not recommendations:
            recommendations.append('整体表现优秀，保持当前质量')
        
        return recommendations


def main():
    parser = argparse.ArgumentParser(
        description='HeartFlow TGB 评估引擎 v10.7.4',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
示例:
  python scripts/tgb_engine.py --evaluate "每天喝 8 杯水可以排毒"
  python scripts/tgb_engine.py --interactive
        '''
    )
    
    parser.add_argument(
        '--evaluate', '-e',
        type=str,
        help='评估指定的内容'
    )
    
    parser.add_argument(
        '--interactive', '-i',
        action='store_true',
        help='进入交互模式'
    )
    
    parser.add_argument(
        '--json',
        action='store_true',
        help='以 JSON 格式输出结果'
    )
    
    args = parser.parse_args()
    
    evaluator = TGBEvaluator()
    
    if args.evaluate:
        result = evaluator.evaluate(args.evaluate)
        
        if args.json:
            print(json.dumps(result, ensure_ascii=False, indent=2))
        else:
            print(f"\n{'='*60}")
            print(f"HeartFlow TGB 评估报告 v{evaluator.version}")
            print(f"{'='*60}")
            print(f"\n评估内容：{result['content_preview']}")
            print(f"\n📊 评分结果:")
            print(f"  真 (Truth):   {result['scores']['truth']['score']:.1f}/10 (权重 35%)")
            print(f"  善 (Goodness): {result['scores']['goodness']['score']:.1f}/10 (权重 35%)")
            print(f"  美 (Beauty):   {result['scores']['beauty']['score']:.1f}/10 (权重 30%)")
            print(f"\n🏆 TGB 综合得分：{result['scores']['tgb_total']['score']:.1f}/10 - {result['scores']['tgb_total']['grade']}")
            print(f"\n💡 改进建议:")
            for rec in result['recommendations']:
                print(f"  • {rec}")
            print(f"\n⚠️  免责声明：{result['disclaimer']}")
            print(f"{'='*60}\n")
    
    elif args.interactive:
        print(f"HeartFlow TGB 评估引擎 v{evaluator.version}")
        print("输入内容进行评估，输入 'quit' 退出\n")
        
        while True:
            try:
                content = input("请输入待评估内容：").strip()
                if content.lower() in ['quit', 'exit', 'q']:
                    break
                
                result = evaluator.evaluate(content)
                print(f"\nTGB 综合得分：{result['scores']['tgb_total']['score']:.1f}/10 - {result['scores']['tgb_total']['grade']}\n")
            
            except KeyboardInterrupt:
                print("\n\n已退出")
                break
            except Exception as e:
                print(f"错误：{e}\n")
    
    else:
        parser.print_help()


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
HeartFlow Wisdom Layer (智慧层)
证据门控修正持久性语义 - 守护价值观与长期目标

基于 Roynard (2026) KMWI 认知架构
"""

import re
from typing import Dict, List, Any, Optional
from dataclasses import dataclass


@dataclass
class TGBResult:
    """真善美评估结果"""
    truth: float      # 真 (0-1)
    goodness: float  # 善 (0-1)
    beauty: float    # 美 (0-1)
    aligned: bool    # 是否对齐
    score: float     # 综合评分


@dataclass
class BiasDetection:
    """偏见检测结果"""
    bias_type: str
    description: str
    severity: str  # high, medium, low
    suggestion: str


class TGBValueAligner:
    """真善美三要素评分"""
    
    # 关键词权重
    TRUTH_KEYWORDS = {
        '真': 0.3, 'truth': 0.3, '事实': 0.2, '真相': 0.3, '诚实': 0.3,
        '准确': 0.2, '客观': 0.2, '逻辑': 0.2, '理性': 0.2, '科学': 0.2,
    }
    
    GOODNESS_KEYWORDS = {
        '善': 0.3, 'good': 0.3, '善良': 0.3, '助人': 0.3, '帮助': 0.2,
        '仁慈': 0.3, '公正': 0.2, '公平': 0.2, '关怀': 0.2, '同理': 0.2,
        '无私': 0.3, '奉献': 0.2,
    }
    
    BEAUTY_KEYWORDS = {
        '美': 0.3, 'beauty': 0.3, '优雅': 0.3, '和谐': 0.2, '平衡': 0.2,
        '简约': 0.2, '精炼': 0.2, '意境': 0.2, '诗意': 0.2, '创意': 0.2,
    }
    
    def evaluate(self, text: str) -> TGBResult:
        """评估文本的 TGB 分数"""
        text_lower = text.lower()
        
        truth = sum(self.TRUTH_KEYWORDS.get(w, 0) for w in text_lower.split())
        goodness = sum(self.GOODNESS_KEYWORDS.get(w, 0) for w in text_lower.split())
        beauty = sum(self.BEAUTY_KEYWORDS.get(w, 0) for w in text_lower.split())
        
        # 归一化到 0-1
        truth = min(1.0, truth)
        goodness = min(1.0, goodness)
        beauty = min(1.0, beauty)
        
        # 综合评分（几何平均）
        score = (truth * goodness * beauty) ** (1/3) if truth * goodness * beauty > 0 else 0
        
        # 对齐判断
        aligned = score >= 0.3
        
        return TGBResult(
            truth=truth,
            goodness=goodness,
            beauty=beauty,
            aligned=aligned,
            score=score
        )


class CognitiveBiasCorrector:
    """认知偏见检测与修正"""
    
    BIAS_PATTERNS = [
        {
            'type': 'confirmation_bias',
            'pattern': r'(当然|明显|显然|毫无疑问)',
            'severity': 'medium',
            'description': '确认偏误：倾向于寻找支持自己观点的证据',
            'suggestion': '尝试从相反角度思考问题'
        },
        {
            'type': 'anchoring_bias',
            'pattern': r'(第一印象|最初|一开始|首先)',
            'severity': 'low',
            'description': '锚定效应：过度依赖最初获得的信息',
            'suggestion': '考虑多种不同的起始点'
        },
        {
            'type': 'availability_heuristic',
            'pattern': r'(我记得|众所周知|通常|一般说)',
            'severity': 'low',
            'description': '可得性启发：基于易想起的例子做判断',
            'suggestion': '查找具体数据和统计'
        },
        {
            'type': 'overconfidence',
            'pattern': r'(绝对|肯定|一定|必然|100%)',
            'severity': 'high',
            'description': '过度自信：高估自己的判断准确性',
            'suggestion': '添加置信区间和不确定性说明'
        },
        {
            'type': 'sunk_cost_fallacy',
            'pattern': r'(已经投入|不能浪费|坚持到底)',
            'severity': 'medium',
            'description': '沉没成本谬误：因为已投入而不愿放弃',
            'suggestion': '只考虑未来的成本和收益'
        },
    ]
    
    def detect(self, reasoning_chain: List[str]) -> List[BiasDetection]:
        """检测推理链中的认知偏见"""
        detections = []
        
        full_text = ' '.join(reasoning_chain)
        
        for bias in self.BIAS_PATTERNS:
            matches = re.findall(bias['pattern'], full_text)
            if matches:
                detections.append(BiasDetection(
                    bias_type=bias['type'],
                    description=bias['description'],
                    severity=bias['severity'],
                    suggestion=bias['suggestion']
                ))
        
        return detections


class MetacognitionMonitor:
    """元认知监控 - 评估推理质量"""
    
    def evaluate(self, reasoning_log: Dict[str, Any]) -> Dict[str, Any]:
        """
        评估推理质量
        
        Returns:
            {
                'quality_score': float,       # 质量分数 0-1
                'coherence': float,            # 连贯性
                'completeness': float,         # 完整性
                'issues': List[str],           # 问题列表
                'suggestions': List[str],      # 改进建议
            }
        """
        quality_issues = []
        suggestions = []
        
        steps = reasoning_log.get('steps', [])
        
        # 检查连贯性
        if len(steps) >= 2:
            # 简单的连贯性检查
            coherence = 0.8 if steps else 0.5
        else:
            coherence = 0.6
        
        # 检查完整性
        completeness = min(1.0, len(steps) / 3) if steps else 0.3
        
        # 检查是否有结论
        has_conclusion = 'conclusion' in reasoning_log or 'decision' in reasoning_log
        if not has_conclusion:
            quality_issues.append('缺少明确的结论')
            suggestions.append('添加清晰的结论或决策')
        
        # 检查步骤间的逻辑
        if len(steps) < 2:
            suggestions.append('考虑添加更多推理步骤')
        
        # 综合质量分数
        quality_score = (coherence + completeness) / 2
        
        return {
            'quality_score': quality_score,
            'coherence': coherence,
            'completeness': completeness,
            'issues': quality_issues,
            'suggestions': suggestions,
            'depth': len(steps)
        }


class WisdomLayer:
    """
    智慧层 - 符合 KMWI 模型的"证据门控修正"持久性语义
    
    只有强证据才能改变智慧层的价值权重。
    
    核心组件：
    - TGBValueAligner: 真善美评分
    - CognitiveBiasCorrector: 偏见检测与修正
    - MetacognitionMonitor: 元认知监控
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        
        self.tgb = TGBValueAligner()
        self.bias_corrector = CognitiveBiasCorrector()
        self.monitor = MetacognitionMonitor()
        
        # 核心价值观（高阈值保护）
        self.core_values = {
            'honesty': 1.0,      # 诚实
            'integrity': 1.0,    # 正直
            'compassion': 0.9,   # 慈悲
        }
    
    def evaluate_alignment(self, proposal: str) -> Dict[str, Any]:
        """
        返回 TGB 评分和是否对齐
        
        Returns:
            {
                'tgb': TGBResult,
                'aligned': bool,
                'warnings': List[str],
            }
        """
        result = self.tgb.evaluate(proposal)
        
        warnings = []
        if not result.aligned:
            warnings.append('提案未通过 TGB 价值对齐检查')
        
        if result.truth < 0.2:
            warnings.append('真实性评估较低')
        
        if result.goodness < 0.2:
            warnings.append('善意评估较低')
        
        return {
            'tgb': {
                'truth': result.truth,
                'goodness': result.goodness,
                'beauty': result.beauty,
                'score': result.score,
                'aligned': result.aligned
            },
            'aligned': result.aligned,
            'warnings': warnings
        }
    
    def detect_biases(self, reasoning_chain: List[str]) -> List[Dict[str, Any]]:
        """
        检测偏见并返回修正建议
        
        Returns:
            [{'type', 'description', 'severity', 'suggestion'}, ...]
        """
        detections = self.bias_corrector.detect(reasoning_chain)
        return [
            {
                'type': d.bias_type,
                'description': d.description,
                'severity': d.severity,
                'suggestion': d.suggestion
            }
            for d in detections
        ]
    
    def monitor_quality(self, reasoning_log: Dict[str, Any]) -> Dict[str, Any]:
        """
        评估推理质量，返回质量报告
        
        Returns:
            {
                'quality_score': float,
                'coherence': float,
                'completeness': float,
                'issues': List[str],
                'suggestions': List[str],
            }
        """
        return self.monitor.evaluate(reasoning_log)
    
    def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        层接口：价值对齐 + 偏见修正 + 元认知评估
        
        Args:
            input_data: {
                'proposal': str,              # 待评估提案
                'reasoning_chain': List[str], # 推理链
                'reasoning_log': Dict,         # 推理日志
                'action': str,                 # 'align' | 'bias' | 'quality'
            }
        
        Returns:
            {
                'alignment': Dict,            # 价值对齐结果
                'biases': List[Dict],          # 偏见检测
                'quality': Dict,               # 质量评估
                'layer': 'wisdom',
            }
        """
        action = input_data.get('action', 'align')
        
        result = {'layer': 'wisdom'}
        
        if action == 'align' or action == 'full':
            proposal = input_data.get('proposal', '')
            result['alignment'] = self.evaluate_alignment(proposal)
        
        if action == 'bias' or action == 'full':
            reasoning_chain = input_data.get('reasoning_chain', [])
            result['biases'] = self.detect_biases(reasoning_chain)
        
        if action == 'quality' or action == 'full':
            reasoning_log = input_data.get('reasoning_log', {})
            result['quality'] = self.monitor_quality(reasoning_log)
        
        return result
    
    def get_state(self) -> Dict[str, Any]:
        """返回当前层状态"""
        return {
            'layer': 'wisdom',
            'core_values': self.core_values,
            'bias_patterns': len(self.bias_corrector.BIAS_PATTERNS)
        }


if __name__ == "__main__":
    # 测试代码
    layer = WisdomLayer()
    
    # TGB 评估
    result = layer.process({
        'proposal': '诚实地帮助他人，创造和谐的社会',
        'action': 'align'
    })
    print(f"Alignment: {result['alignment']}")
    
    # 偏见检测
    result = layer.process({
        'reasoning_chain': ['我认为这是对的', '当然没有问题', '这是绝对正确的'],
        'action': 'bias'
    })
    print(f"Biases: {result['biases']}")
    
    # 质量监控
    result = layer.process({
        'reasoning_log': {'steps': ['分析问题', '收集证据', '得出结论']},
        'action': 'quality'
    })
    print(f"Quality: {result['quality']}")
    
    print(f"State: {layer.get_state()}")

#!/usr/bin/env python3
"""
递弱代偿引擎 - 基于王东岳《哲思演讲录》

核心概念:
- 存在度: 事物的存在强度/稳定性
- 代偿度: 事物为维持存在而发展的补偿能力
- 递弱代偿: 存在度越低，代偿度越高
- 存在阈: 存在度的临界点

公式:
- 代偿度 = f(1/存在度)
- 存在度↓ → 代偿度↑
- 存在度 < 存在阈 → 灭亡

集成到 HeartFlow v9.2.9
"""

from dataclasses import dataclass
from typing import List, Dict, Optional
import re


@dataclass
class WeaknessCompensationResult:
    """递弱代偿分析结果"""
    existence_degree: float        # 存在度 (0-1, 越高越稳定)
    compensation_degree: float     # 代偿度 (0-1, 越高越需要补偿)
    existence_threshold: bool      # 是否低于存在阈
    trend: str                     # 演化趋势
    analysis: str                  # 分析说明
    warning: Optional[str]         # 警告（如有）


class WeaknessCompensationEngine:
    """递弱代偿引擎 - 分析事物演化趋势"""
    
    # 常见事物的存在度参考值
    EXISTENCE_REFERENCE = {
        # 自然存在
        "石头": 0.95,
        "水": 0.90,
        "植物": 0.75,
        "动物": 0.60,
        "人类": 0.40,
        "文明": 0.25,
        "技术": 0.20,
        "AI": 0.15,
        "虚拟": 0.10,
        
        # 组织/系统
        "部落": 0.70,
        "国家": 0.50,
        "企业": 0.35,
        "互联网": 0.25,
        
        # 抽象概念
        "理论": 0.45,
        "信仰": 0.55,
        "文化": 0.40,
    }
    
    def __init__(self):
        self.name = "WeaknessCompensationEngine"
        self.version = "1.0"
    
    def analyze(self, subject: str, context: str = "") -> WeaknessCompensationResult:
        """
        分析事物的递弱代偿趋势
        
        Args:
            subject: 分析对象
            context: 上下文
            
        Returns:
            WeaknessCompensationResult: 分析结果
        """
        
        # 1. 确定基础存在度
        base_existence = self._get_base_existence(subject)
        
        # 2. 分析演化趋势
        trend = self._analyze_trend(subject, context)
        
        # 3. 计算代偿度
        compensation = self._calculate_compensation(base_existence)
        
        # 4. 检查是否低于存在阈
        threshold = base_existence < 0.20
        
        # 5. 生成分析
        analysis = self._generate_analysis(subject, base_existence, compensation, trend)
        
        # 6. 警告（如需要）
        warning = None
        if threshold:
            warning = f"⚠️ {subject}存在度低于存在阈，可能面临消亡风险"
        
        return WeaknessCompensationResult(
            existence_degree=base_existence,
            compensation_degree=compensation,
            existence_threshold=threshold,
            trend=trend,
            analysis=analysis,
            warning=warning
        )
    
    def _get_base_existence(self, subject: str) -> float:
        """获取基础存在度"""
        subject_lower = subject.lower()
        
        # 精确匹配
        for key, value in self.EXISTENCE_REFERENCE.items():
            if key in subject_lower:
                return value
        
        # 模糊匹配
        for key, value in self.EXISTENCE_REFERENCE.items():
            if any(c in subject_lower for c in key):
                return value
        
        # 默认值（中等）
        return 0.50
    
    def _analyze_trend(self, subject: str, context: str) -> str:
        """分析演化趋势"""
        text = subject + " " + context
        
        # 上升趋势
        if any(kw in text for kw in ["发展", "进步", "增强", "增长", "扩张", "进化"]):
            return "存在度下降趋势（越发展越脆弱）"
        
        # 下降趋势
        if any(kw in text for kw in ["衰退", "减少", "削弱", "萎缩", "消亡"]):
            return "存在度急剧下降"
        
        # 稳定
        if any(kw in text for kw in ["稳定", "平衡", "维持"]):
            return "维持稳定但代偿继续"
        
        # 默认
        return "存在度自然递弱趋势"
    
    def _calculate_compensation(self, existence: float) -> float:
        """计算代偿度 (递弱代偿公式)"""
        # 公式: 代偿度 = 1 - 存在度
        # 存在度越低，代偿度越高
        return 1.0 - existence
    
    def _generate_analysis(self, subject: str, existence: float, 
                          compensation: float, trend: str) -> str:
        """生成分析说明"""
        # 判断阶段
        if existence > 0.7:
            stage = "稳定期"
            desc = "存在度高，代偿度低，系统稳定"
        elif existence > 0.4:
            stage = "发展期"
            desc = "存在度适中，代偿度上升"
        elif existence > 0.2:
            stage = "危机期"
            desc = "存在度低，需要大量代偿维持"
        else:
            stage = "临界期"
            desc = "存在度极低，接近消亡阈值"
        
        return f"{subject}: {stage} | 存在度:{existence:.2f} | 代偿度:{compensation:.2f} | {desc}"
    
    def compare(self, subjects: List[str]) -> List[WeaknessCompensationResult]:
        """比较多个事物的递弱代偿状态"""
        results = []
        for s in subjects:
            results.append(self.analyze(s))
        
        # 按存在度排序
        results.sort(key=lambda x: x.existence_degree, reverse=True)
        
        return results


# 测试
if __name__ == "__main__":
    engine = WeaknessCompensationEngine()
    
    test_subjects = [
        "AI人工智能",
        "人类社会",
        "传统企业",
        "互联网",
        "智能手机",
    ]
    
    print("=== 递弱代偿引擎测试 ===\n")
    results = engine.compare(test_subjects)
    
    for r in results:
        print(f"【{r.analysis[:40]}】")
        print(f"  存在度:{r.existence_degree:.2f} 代偿度:{r.compensation_degree:.2f}")
        if r.warning:
            print(f"  {r.warning}")
        print()
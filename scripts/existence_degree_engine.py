#!/usr/bin/env python3
"""
存在度计算引擎 - 基于王东岳《哲思演讲录》

存在度定义:
- 事物的稳定性和持续性
- 存在度越高，消亡风险越低
- 存在度越低，需要的代偿越高

存在度评估维度:
1. 基础稳定性 - 物质/能量基础
2. 结构完整性 - 内部结构稳定程度  
3. 功能持续性 - 功能延续能力
4. 环境适应性 - 适应环境变化能力

集成到 HeartFlow v9.2.9
"""

from dataclasses import dataclass
from typing import Dict, List, Optional
import json


@dataclass
class ExistenceDegreeResult:
    """存在度计算结果"""
    subject: str                   # 分析对象
    total_score: float            # 总分 (0-1)
    stability_score: float        # 基础稳定性
    structure_score: float        # 结构完整性
    function_score: float         # 功能持续性
    adaptation_score: float      # 环境适应性
    level: str                    # 存在层级
    description: str              # 描述
    suggestion: Optional[str]      # 建议（如有）


class ExistenceDegreeEngine:
    """存在度计算引擎"""
    
    # 存在层级定义
    LEVELS = {
        (0.8, 1.0): "极稳定层",
        (0.6, 0.8): "稳定层",
        (0.4, 0.6): "过渡层",
        (0.2, 0.4): "脆弱层",
        (0.0, 0.2): "临界层",
    }
    
    def __init__(self):
        self.name = "ExistenceDegreeEngine"
        self.version = "1.0"
    
    def calculate(self, subject: str, factors: Dict = None) -> ExistenceDegreeResult:
        """
        计算存在度
        
        Args:
            subject: 分析对象
            factors: 可选的因子字典 {维度: 分数}
            
        Returns:
            ExistenceDegreeResult: 计算结果
        """
        
        # 使用因子或默认评估
        if factors:
            stability = factors.get("stability", 0.5)
            structure = factors.get("structure", 0.5)
            function = factors.get("function", 0.5)
            adaptation = factors.get("adaptation", 0.5)
        else:
            # 自动评估
            stability = self._eval_stability(subject)
            structure = self._eval_structure(subject)
            function = self._eval_function(subject)
            adaptation = self._eval_adaptation(subject)
        
        # 加权计算总分
        # 权重: 稳定性 30%, 结构 25%, 功能 25%, 适应 20%
        total = (stability * 0.30 + structure * 0.25 + 
                function * 0.25 + adaptation * 0.20)
        
        # 确定层级
        level = self._get_level(total)
        
        # 生成描述
        desc = self._generate_description(subject, total, level)
        
        # 生成建议
        suggestion = self._generate_suggestion(subject, total)
        
        return ExistenceDegreeResult(
            subject=subject,
            total_score=total,
            stability_score=stability,
            structure_score=structure,
            function_score=function,
            adaptation_score=adaptation,
            level=level,
            description=desc,
            suggestion=suggestion
        )
    
    def _eval_stability(self, subject: str) -> float:
        """评估基础稳定性"""
        subject_lower = subject.lower()
        
        # 高稳定性
        if any(k in subject_lower for k in ["石头", "山", "水", "空气", "基本", "基础"]):
            return 0.90
        
        # 中稳定性
        if any(k in subject_lower for k in ["树", "动物", "建筑", "制度", "法律"]):
            return 0.70
        
        # 低稳定性
        if any(k in subject_lower for k in ["人", "企业", "国家", "技术", "AI", "虚拟"]):
            return 0.40
        
        return 0.50
    
    def _eval_structure(self, subject: str) -> float:
        """评估结构完整性"""
        subject_lower = subject.lower()
        
        # 完整结构
        if any(k in subject_lower for k in ["国家", "制度", "系统", "生物", "身体"]):
            return 0.75
        
        # 部分结构
        if any(k in subject_lower for k in ["企业", "组织", "文化", "理论"]):
            return 0.60
        
        # 脆弱结构
        if any(k in subject_lower for k in ["技术", "应用", "服务", "产品"]):
            return 0.45
        
        return 0.50
    
    def _eval_function(self, subject: str) -> float:
        """评估功能持续性"""
        subject_lower = subject.lower()
        
        # 持续功能
        if any(k in subject_lower for k in ["自然", "基础", "根本", "核心"]):
            return 0.85
        
        # 阶段性功能
        if any(k in subject_lower for k in ["企业", "产品", "服务", "项目"]):
            return 0.50
        
        # 短暂功能
        if any(k in subject_lower for k in ["趋势", "热点", "流行"]):
            return 0.30
        
        return 0.50
    
    def _eval_adaptation(self, subject: str) -> float:
        """评估环境适应性"""
        subject_lower = subject.lower()
        
        # 高适应
        if any(k in subject_lower for k in ["文化", "自然", "生物", "适应"]):
            return 0.80
        
        # 中适应
        if any(k in subject_lower for k in ["制度", "法律", "系统", "架构"]):
            return 0.65
        
        # 低适应
        if any(k in subject_lower for k in ["技术", "工具", "应用"]):
            return 0.40
        
        return 0.50
    
    def _get_level(self, score: float) -> str:
        """获取存在层级"""
        for (low, high), name in self.LEVELS.items():
            if low <= score < high:
                return name
        return "临界层"
    
    def _generate_description(self, subject: str, score: float, level: str) -> str:
        """生成描述"""
        if score >= 0.8:
            return f"{subject}处于极稳定状态，消亡风险极低"
        elif score >= 0.6:
            return f"{subject}处于稳定状态，有一定抗风险能力"
        elif score >= 0.4:
            return f"{subject}处于过渡状态，存在不确定性"
        elif score >= 0.2:
            return f"{subject}处于脆弱状态，需要代偿维持"
        else:
            return f"{subject}处于临界状态，面临消亡风险"
    
    def _generate_suggestion(self, subject: str, score: float) -> Optional[str]:
        """生成建议"""
        if score < 0.3:
            return f"建议: {subject}需要重大变革或转型以提升存在度"
        elif score < 0.5:
            return f"建议: {subject}需要加强核心能力建设"
        return None
    
    def batch_calculate(self, subjects: List[str]) -> List[ExistenceDegreeResult]:
        """批量计算"""
        results = []
        for s in subjects:
            results.append(self.calculate(s))
        
        # 按分数排序
        results.sort(key=lambda x: x.total_score, reverse=True)
        return results


# 测试
if __name__ == "__main__":
    engine = ExistenceDegreeEngine()
    
    test_subjects = [
        "传统文化",
        "现代企业",
        "人工智能",
        "国家制度",
        "个人技能",
    ]
    
    print("=== 存在度计算引擎测试 ===\n")
    results = engine.batch_calculate(test_subjects)
    
    for r in results:
        print(f"【{r.subject}】{r.level}")
        print(f"  总分:{r.total_score:.2f} | 稳定性:{r.stability_score:.2f} | 结构:{r.structure_score:.2f}")
        print(f"  {r.description}")
        if r.suggestion:
            print(f"  {r.suggestion}")
        print()
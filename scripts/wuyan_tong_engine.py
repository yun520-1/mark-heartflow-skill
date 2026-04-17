#!/usr/bin/env python3
"""
物演通论引擎 - 基于王东岳《物演通论》

核心概念:
- 存在度: 事物的存在效价/稳定性
- 递弱代偿: 存在度递减趋势下的补偿机制
- 衍存梯度: 从奇点→原子→分子→生物→人类的演化梯度
- 本性: 原始存在性 (存在度)
- 属性: 演化存在性 (代偿能力)

递弱代偿定律:
- 存在度 ↓ = 本性弱化
- 代偿度 ↑ = 属性增强
- 总体存在效价保持不变

集成到 HeartFlow v9.3.0
"""

from dataclasses import dataclass
from typing import List, Dict, Optional, Tuple
import math


@dataclass
class WanYanTongResult:
    """物演通论分析结果"""
    subject: str                   # 分析对象
    existence_degree: float       # 存在度 (0-1)
    compensation_degree: float     # 代偿度 (0-1)
    total_efficacy: float          # 总体存在效价
    level: str                    # 衍存层级
    trend: str                    # 演化趋势
    analysis: str                # 分析说明
    suggestion: Optional[str]      # 建议


class WanYanTongEngine:
    """物演通论引擎 - 基于《物演通论》的递弱代偿模型"""
    
    # 衍存梯度层级定义
    LEVELS = {
        "奇点": {"existence": 1.0, "desc": "宇宙起点，绝对存在", "time": "150亿年前"},
        "基本粒子": {"existence": 0.95, "desc": "亚原子粒子，氢核", "time": "宇宙初期"},
        "原子": {"existence": 0.85, "desc": "元素周期表前位元素", "time": "宇宙早期"},
        "分子": {"existence": 0.70, "desc": "无机化合物", "time": "46亿年前"},
        "有机大分子": {"existence": 0.60, "desc": "有机高分子", "time": "35亿年前"},
        "单细胞": {"existence": 0.50, "desc": "微生物，蓝绿藻", "time": "35亿年前"},
        "多细胞生物": {"existence": 0.40, "desc": "动植物", "time": "5.7亿年前"},
        "哺乳动物": {"existence": 0.30, "desc": "高等动物", "time": "7000万年前"},
        "人类": {"existence": 0.20, "desc": "智人", "time": "300万年前"},
        "AI": {"existence": 0.10, "desc": "人工智能", "time": "21世纪"},
        "虚拟": {"existence": 0.05, "desc": "虚拟存在", "time": "未来"},
        "待定": {"existence": 0.50, "desc": "待定", "time": "未知"},
    }
    
    # 存在度衰减定律
    LAW_OF_WEAKENING = """
    a. 相对量度递减: 衍存层级越高，空间质量分布越少
    b. 相对时度递短: 衍存层级越高，存续时间越短
    c. 衍存条件递繁: 层级越高，依赖外在条件越多
    d. 存变速率递增: 层级越高，变异速率越快
    e. 自在存态递失: 越高级存在物，越不能无条件存在
    f. 自为存态递强: 越高级存在物，越需要依赖属性存在
    """
    
    def __init__(self):
        self.name = "WanYanTongEngine"
        self.version = "1.0"
    
    def analyze(self, subject: str, context: str = "") -> WanYanTongResult:
        """
        分析事物的物演通论属性
        
        Args:
            subject: 分析对象
            context: 上下文
            
        Returns:
            WanYanTongResult: 分析结果
        """
        
        # 1. 确定衍存层级
        level = self._get_level(subject)
        
        # 2. 获取存在度
        existence = self.LEVELS[level]["existence"]
        
        # 3. 计算代偿度 (递弱代偿核心公式)
        # 代偿度 = 1 - 存在度 (存在度越低，代偿度越高)
        compensation = 1.0 - existence
        
        # 4. 计算总体存在效价 (守恒)
        # 存在度 + 代偿度 = 1 (理想状态)
        # 实际效价 = 存在度 × 代偿度 (相互作用)
        total_efficacy = existence * (1 + compensation)
        
        # 5. 分析演化趋势
        trend = self._analyze_trend(subject, context, level)
        
        # 6. 生成分析说明
        analysis = self._generate_analysis(subject, level, existence, compensation, trend)
        
        # 7. 生成建议
        suggestion = self._generate_suggestion(subject, level, existence)
        
        # 处理未知层级
        if level == "未知":
            level = "待定"
            existence = 0.50
            compensation = 0.50
        
        return WanYanTongResult(
            subject=subject,
            existence_degree=existence,
            compensation_degree=compensation,
            total_efficacy=min(1.0, total_efficacy),
            level=level,
            trend=trend,
            analysis=analysis,
            suggestion=suggestion
        )
    
    def _get_level(self, subject: str) -> str:
        """确定衍存层级"""
        subject_lower = subject.lower()
        
        # 直接匹配
        for level in self.LEVELS:
            if level in subject_lower:
                return level
        
        # 模糊匹配
        keywords = {
            "人类": ["人", "人类", "智人"],
            "AI": ["ai", "人工智能", "机器", "算法"],
            "虚拟": ["虚拟", "数字", "网络", "元宇宙"],
            "哺乳动物": ["哺乳", "动物", "兽", "哺乳类"],
            "多细胞生物": ["植物", "动物", "多细胞"],
            "单细胞": ["单细胞", "微生物", "菌", "藻"],
            "有机大分子": ["蛋白", "dna", "rna", "有机"],
            "分子": ["分子", "化合物", "水", "气体"],
            "原子": ["原子", "元素", "核"],
            "基本粒子": ["粒子", "电子", "质子", "量子"],
        }
        
        for level, kws in keywords.items():
            for kw in kws:
                if kw in subject_lower:
                    return level
        
        # 更广泛的匹配
        if any(kw in subject_lower for kw in ["企业", "公司", "组织", "机构"]):
            return "多细胞生物"  # 类比为中层级
        if any(kw in subject_lower for kw in ["手机", "电脑", "设备", "产品", "技术"]):
            return "AI"  # 类比为技术产物
        
        # 默认返回"待定"
        return "待定"
    
    def _analyze_trend(self, subject: str, context: str, level: str) -> str:
        """分析演化趋势"""
        text = subject + " " + context
        
        # 发展/进步 = 加速弱化
        if any(kw in text for kw in ["发展", "进步", "增长", "增强", "进化", "发达"]):
            return "递弱趋势 (越发展越脆弱)"
        
        # 衰退/减少 = 加速消亡
        if any(kw in text for kw in ["衰退", "减少", "萎缩", "消亡", "灭绝"]):
            return "加速消亡趋势"
        
        # 稳定
        if "稳定" in text or "平衡" in text:
            return "维持稳定但代偿继续"
        
        # 根据层级判断
        if level in ["奇点", "基本粒子"]:
            return "高度稳定"
        elif level in ["原子", "分子"]:
            return "相对稳定"
        elif level in ["单细胞", "多细胞生物"]:
            return "存在度递减"
        elif level in ["人类", "AI", "虚拟"]:
            return "高度脆弱，需要大量代偿"
        
        return "存在度自然递���趋势"
    
    def _generate_analysis(self, subject: str, level: str, 
                        existence: float, compensation: float, trend: str) -> str:
        """生成分析"""
        level_info = self.LEVELS.get(level, {})
        desc = level_info.get("desc", "")
        time_info = level_info.get("time", "")
        
        return (f"{subject}位于衍存层级「{level}」({desc})，"
                f"存在度:{existence:.2f}，代偿度:{compensation:.2f}，"
                f"出现于{time_info}。趋势:{trend}")
    
    def _generate_suggestion(self, subject: str, level: str, 
                           existence: float) -> Optional[str]:
        """生成建议"""
        if existence < 0.2:
            return f"⚠️ {subject}处于衍存高层，存在度极低，需要大量代偿维持，存在消亡风险"
        elif existence < 0.4:
            return f"建议: {subject}需要发展更多属性/能力来代偿存在度的下降"
        return None
    
    def compare(self, subjects: List[str]) -> List[WanYanTongResult]:
        """比较多个事物"""
        results = []
        for s in subjects:
            results.append(self.analyze(s))
        
        # 按存在度排序
        results.sort(key=lambda x: x.existence_degree, reverse=True)
        return results
    
    def get_law_summary(self) -> str:
        """获取递弱代偿定律总结"""
        return self.LAW_OF_WEAKENING


# 测试
if __name__ == "__main__":
    engine = WanYanTongEngine()
    
    test_cases = [
        "人工智能",
        "人类社会",
        "现代企业",
        "传统手工艺",
        "智能手机",
    ]
    
    print("=== 物演通论引擎测试 ===\n")
    results = engine.compare(test_cases)
    
    for r in results:
        print(f"【{r.subject}】{r.level}")
        print(f"  存在度: {r.existence_degree:.2f} | 代偿度: {r.compensation_degree:.2f}")
        print(f"  趋势: {r.trend}")
        if r.suggestion:
            print(f"  {r.suggestion}")
        print()
    
    print("\n=== 递弱代偿定律 ===")
    print(engine.get_law_summary())
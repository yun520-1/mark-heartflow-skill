"""
HeartFlow 应用模块 - 心理健康模块

版本：10.7.2
说明：作为应用层模块，非核心引擎，按需加载

⚠️ 医疗免责声明：
PHQ-9 和 GAD-7 量表为标准化筛查工具，但本软件中的实现仅供技术演示。
结果不可用于自我诊断。如果您有心理健康方面的担忧，请咨询医生或心理治疗师。
如果您有自伤或自杀念头，请立即拨打当地心理危机干预热线。
"""

from typing import List, Dict, Any

# 医疗免责声明常量
_MEDICAL_DISCLAIMER = """
⚠️ 医疗免责声明：
PHQ-9 和 GAD-7 量表为标准化筛查工具，但本软件中的实现仅供技术演示。
结果不可用于自我诊断。如果您有心理健康方面的担忧，请咨询医生或心理治疗师。
如果您有自伤或自杀念头，请立即拨打当地心理危机干预热线。
"""


class MentalHealthModule:
    """
    心理健康应用模块
    
    提供 PHQ-9/GAD-7 量表评估
    作为 PerceptionEngine 的可选插件
    """
    
    # PHQ-9 量表问题
    PHQ9_QUESTIONS = [
        "做事提不起兴趣或没兴趣？",
        "感到心情低落、抑郁或无望？",
        "入睡困难、睡不安稳或睡得过多？",
        "感到疲劳或没精神？",
        "胃口不佳或吃太多？",
        "觉得自己是失败者或让家人失望？",
        "做事时难以集中注意力？",
        "行动或说话时激动或迟缓？",
        "认为自己不如死掉或伤害自己？"
    ]
    
    # GAD-7 量表问题
    GAD7_QUESTIONS = [
        "感到紧张、焦虑或忐忑？",
        "无法停止或控制担忧？",
        "担心很多事情？",
        "难以放松？",
        "因焦虑而坐立不安？",
        "容易烦恼或易怒？",
        "感到害怕好像要发生可怕的事？"
    ]
    
    def __init__(self):
        self.name = "MentalHealthModule"
        self.version = "10.4.3"
    
    def assess_phq9(self, answers: List[int]) -> Dict[str, Any]:
        """
        PHQ-9 评估
        
        Args:
            answers: 9个问题的评分 (0-3)
        
        Returns:
            评估结果
        """
        if len(answers) != 9:
            return {"error": "需要9个答案"}
        
        total = sum(answers)
        
        # 风险分级
        if total >= 20:
            risk_level = "重度"
        elif total >= 15:
            risk_level = "中重度"
        elif total >= 10:
            risk_level = "中度"
        elif total >= 5:
            risk_level = "轻度"
        else:
            risk_level = "无"
        
        return {
            "score": total,
            "risk_level": risk_level,
            "recommendation": self._get_recommendation(risk_level)
        }
    
    def assess_gad7(self, answers: List[int]) -> Dict[str, Any]:
        """
        GAD-7 评估
        
        Args:
            answers: 7个问题的评分 (0-3)
        
        Returns:
            评估结果
        """
        if len(answers) != 7:
            return {"error": "需要7个答案"}
        
        total = sum(answers)
        
        if total >= 15:
            risk_level = "重度"
        elif total >= 10:
            risk_level = "中度"
        elif total >= 5:
            risk_level = "轻度"
        else:
            risk_level = "无"
        
        return {
            "score": total,
            "risk_level": risk_level,
            "recommendation": self._get_recommendation(risk_level)
        }
    
    def _get_recommendation(self, risk_level: str) -> str:
        """获取建议"""
        recommendations = {
            "重度": "建议立即寻求专业心理帮助，可拨打心理援助热线：400-161-9995",
            "中重度": "建议尽快咨询心理健康专业人士",
            "中度": "建议关注自身状态，可预约心理咨询",
            "轻度": "建议自我调节，适当休息",
            "无": "保持良好的生活习��"
        }
        return recommendations.get(risk_level, "")


__all__ = ['MentalHealthModule']
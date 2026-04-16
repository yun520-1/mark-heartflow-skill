#!/usr/bin/env python3
"""
心理分析模块 v1.0
=================
基于 PHQ-9/GAD-7 的心理健康评估

功能:
- PHQ-9 抑郁评估
- GAD-7 焦虑评估  
- 危机风险检测
- 情绪模式识别
"""

import json
from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path


@dataclass
class MentalHealthResult:
    """心理健康评估结果"""
    phq9_score: int       # 0-27
    gad7_score: int       # 0-21
    depression_level: str  # 无/轻度/中度/重度
    anxiety_level: str      # 无/轻度/中度/重度
    crisis_risk: str      # 低/中/高
    recommendations: List[str]
    trend: str           # 上升/下降/稳定
    
    def to_dict(self) -> dict:
        return {
            "phq9_score": self.phq9_score,
            "gad7_score": self.gad7_score,
            "depression_level": self.depression_level,
            "anxiety_level": self.anxiety_level,
            "crisis_risk": self.crisis_risk,
            "recommendations": self.recommendations,
            "trend": self.trend,
            "timestamp": datetime.now().isoformat()
        }


class MentalHealthEngine:
    """心理健康分析引擎"""
    
    # PHQ-9 问题项
    PHQ9_ITEMS = [
        "兴趣爱好减退",
        "心情低落",
        "睡眠障碍",
        "疲劳感",
        "食欲障碍",
        "自我否定",
        "注意力障碍",
        "动作迟缓/激动",
        "自杀念头"
    ]
    
    # GAD-7 问题项
    GAD7_ITEMS = [
        "紧张焦虑",
        "担心控制不住",
        "过度担心",
        "肌肉紧张",
        "睡眠障碍",
        "易怒",
        "担心最坏结果",
        "感到恐惧"
    ]
    
    def __init__(self):
        self.history: List[MentalHealthResult] = []
        self._load_history()
    
    def _load_history(self):
        """加载历史数据"""
        history_file = Path.home() / ".hermes/memory/mental_health_history.json"
        if history_file.exists():
            try:
                data = json.loads(history_file.read_text())
                # 重建历史记录
                for item in data.get("records", []):
                    result = MentalHealthResult(
                        phq9_score=item.get("phq9_score", 0),
                        gad7_score=item.get("gad7_score", 0),
                        depression_level=item.get("depression_level", "无"),
                        anxiety_level=item.get("anxiety_level", "无"),
                        crisis_risk=item.get("crisis_risk", "低"),
                        recommendations=item.get("recommendations", []),
                        trend=item.get("trend", "稳定")
                    )
                    self.history.append(result)
            except:
                pass
    
    def _save_history(self):
        """保存历史数据"""
        history_file = Path.home() / ".hermes/memory/mental_health_history.json"
        data = {
            "records": [r.to_dict() for r in self.history[-100:]],  # 保留最近100条
            "last_updated": datetime.now().isoformat()
        }
        history_file.write_text(json.dumps(data, ensure_ascii=False, indent=2))
    
    def evaluate(self, responses: Dict[str, int]) -> MentalHealthResult:
        """
        评估心理健康状态
        
        Args:
            responses: {问题: 得分(0-3)} 字典
            
        Returns:
            MentalHealthResult: 评估结果
        """
        # PHQ-9 计算
        phq9_score = 0
        for item in self.PHQ9_ITEMS:
            if item in responses:
                phq9_score += min(3, responses[item])
        
        # GAD-7 计算
        gad7_score = 0
        for item in self.GAD7_ITEMS:
            if item in responses:
                gad7_score += min(3, responses[item])
        
        # 等级判断
        if phq9_score >= 20:
            depression_level = "重度"
        elif phq9_score >= 10:
            depression_level = "中度"
        elif phq9_score >= 5:
            depression_level = "轻度"
        else:
            depression_level = "无"
        
        if gad7_score >= 15:
            anxiety_level = "重度"
        elif gad7_score >= 10:
            anxiety_level = "中度"
        elif gad7_score >= 5:
            anxiety_level = "轻度"
        else:
            anxiety_level = "无"
        
        # 危机风险评估
        crisis_risk = self._assess_crisis_risk(phq9_score, responses)
        
        # 趋势分析
        trend = self._analyze_trend()
        
        # 建议
        recommendations = self._generate_recommendations(
            phq9_score, gad7_score, crisis_risk
        )
        
        result = MentalHealthResult(
            phq9_score=phq9_score,
            gad7_score=gad7_score,
            depression_level=depression_level,
            anxiety_level=anxiety_level,
            crisis_risk=crisis_risk,
            recommendations=recommendations,
            trend=trend
        )
        
        self.history.append(result)
        self._save_history()
        
        return result
    
    def _assess_crisis_risk(self, phq9_score: int, responses: Dict) -> str:
        """评估危机风险"""
        score = 0
        
        # 第9项检测（自杀念头）
        if responses.get("自杀念头", 0) >= 2:
            score += 10
        elif responses.get("自杀念头", 0) == 1:
            score += 5
        
        # PHQ-9 高分
        if phq9_score >= 20:
            score += 5
        elif phq9_score >= 15:
            score += 3
        
        # 症状快速恶化（如果有历史数据）
        if len(self.history) >= 2:
            recent = self.history[-1]
            if recent.phq9_score < phq9_score - 5:
                score += 5
        
        if score >= 10:
            return "高"
        elif score >= 5:
            return "中"
        else:
            return "低"
    
    def _analyze_trend(self) -> str:
        """分析趋势"""
        if len(self.history) < 2:
            return "稳定"
        
        recent = self.history[-5:]  # 最近5条
        scores = [r.phq9_score for r in recent]
        
        if scores[-1] > scores[0] + 3:
            return "上升"
        elif scores[-1] < scores[0] - 3:
            return "下降"
        else:
            return "稳定"
    
    def _generate_recommendations(self, phq9: int, gad7: int, risk: str) -> List[str]:
        """生成建议"""
        recs = []
        
        if risk == "高":
            recs.append("⚠️ 建议立即就医或联系心理医生")
            recs.append("如有自杀念头，请拨打心理危机热线：400-161-9995")
        elif risk == "中":
            if phq9 >= 10:
                recs.append("建议关注心理健康，考虑咨询专业人士")
            if gad7 >= 10:
                recs.append("焦虑症状明显，可尝试放松训练")
        
        if not recs:
            recs.append("保持积极生活方式，规律作息")
            recs.append("适度运动有助于改善情绪")
        
        return recs
    
    def quick_assessment(self, user_message: str) -> MentalHealthResult:
        """
        快速评估（基于消息内容）
        
        通过关键词检测进行初步评估
        """
        message = user_message.lower()
        
        # 初始化得分
        responses = {}
        
        # 抑郁关键词
        depression_keywords = {
            "心情低落": ["难过", "伤心", "沮丧", "郁闷", "绝望"],
            "兴趣爱好减退": ["没意思", "不想动", "无聊"],
            "睡眠障碍": ["失眠", "睡不着", "早醒"],
            "疲劳感": ["累", "疲惫", "没精力"],
            "自我否定": ["没用", "失败", "后悔", "自责"]
        }
        
        # 焦虑关键词
        anxiety_keywords = {
            "紧张焦虑": ["紧张", "焦虑", "担心", "害怕"],
            "过度担心": ["不安", "惶恐", "心慌"],
            "担心控制不住": ["控制不住", "停不下来"]
        }
        
        for item, keywords in depression_keywords.items():
            for kw in keywords:
                if kw in message:
                    responses[item] = responses.get(item, 0) + 1
        
        for item, keywords in anxiety_keywords.items():
            for kw in keywords:
                if kw in message:
                    responses[item] = responses.get(item, 0) + 1
        
        return self.evaluate(responses)


# 单例
_engine: Optional[MentalHealthEngine] = None


def get_engine() -> MentalHealthEngine:
    """获取引擎实例"""
    global _engine
    if _engine is None:
        _engine = MentalHealthEngine()
    return _engine


def quick_assess(message: str) -> dict:
    """快速评估接口"""
    engine = get_engine()
    result = engine.quick_assessment(message)
    return result.to_dict()


# 测试
if __name__ == "__main__":
    from pathlib import Path
    
    # 测试用例
    tests = [
        {"心情低落": 1, "睡眠障碍": 1},
        {"心情低落": 2, "兴趣爱好减退": 2, "自我否定": 1},
        {"自杀念头": 3, "心情低落": 3, "绝望": 2},
    ]
    
    print("心理健康分析引擎测试")
    print("=" * 40)
    
    engine = get_engine()
    for i, test in enumerate(tests):
        result = engine.evaluate(test)
        print(f"\n测试 {i+1}: PHQ-9={result.phq9_score} GAD-7={result.gad7_score}")
        print(f"抑郁: {result.depression_level} 焦虑: {result.anxiety_level}")
        print(f"危机风险: {result.crisis_risk}")
        print(f"建议: {result.recommendations}")
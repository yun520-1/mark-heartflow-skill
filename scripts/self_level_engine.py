#!/usr/bin/env python3
"""
四层级自我认知引擎
===================
基于用户提出的四层级概念：
1. 我不知道我做错了
2. 我知道我做错了
3. 我知道我做对了
4. 我不知道我做对了

用法:
    from self_level_engine import SelfLevelEngine
    
    engine = SelfLevelEngine()
    
    # 评估当前状态
    level = engine.assess(
        action="分析用户问题",
        result="发现分析有偏差",  # 如果有结果
        feedback="wrong"  # 外部反馈：right/wrong/none
    )
    print(f"当前层级: {level}")
"""

import json
from datetime import datetime
from typing import Optional, Dict
from dataclasses import dataclass


@dataclass
class LevelResult:
    """层级判断结果"""
    current_level: int          # 当前层级 1-4
    level_name: str             # 层级名称
    description: str            # 描述
    wisdom_status: str         # 智慧状态
    recommendation: str         # 建议
    confidence: float          # 置信度 0-1


class SelfLevelEngine:
    """四层级自我认知引擎"""
    
    LEVELS = {
        1: {
            "name": "无明",
            "description": "我不知道我做错了",
            "risk": "盲目行动，认假为真",
            "wisdom": "最低",
            "action": "需要更多反馈来校准"
        },
        2: {
            "name": "觉察",
            "description": "我知道我做错了",
            "risk": "过度自我怀疑",
            "wisdom": "成长中",
            "action": "接纳错误，开始修正"
        },
        3: {
            "name": "清明",
            "description": "我知道我做对了",
            "risk": "骄傲或固化",
            "wisdom": "清晰",
            "action": "保持但警惕骄傲"
        },
        4: {
            "name": "圆融",
            "description": "我不知道我做对了",
            "risk": "陷入玄学或虚无",
            "wisdom": "最高",
            "action": "保持谦逊，继续行动"
        }
    }
    
    def __init__(self):
        self.history: list = []
        self.current_level = 1  # 默认从第1层开始（最谦逊）
        self.action_count = 0
        self.right_count = 0
        self.wrong_count = 0
    
    def assess(
        self,
        action: str = "",
        result: Optional[str] = None,
        feedback: Optional[str] = None,
        context: Optional[Dict] = None
    ) -> LevelResult:
        """
        评估当前层级
        
        参数:
            action: 我的行动描述
            result: 行动结果（我观察到的）
            feedback: 外部反馈 right/wrong/none
            
        返回:
            LevelResult: 层级判断结果
        """
        context = context or {}
        self.action_count += 1
        
        # 根据反馈判断
        if feedback == "right":
            self.right_count += 1
            new_level = 3  # 我知道我做对了
        elif feedback == "wrong":
            self.wrong_count += 1
            new_level = 2  # 我知道我做错了
        elif result and "wrong" in result.lower():
            new_level = 2  # 从结果推断自己做错了
        elif result and "right" in result.lower():
            new_level = 3  # 从结果推断自己做对了
        else:
            # 没有反馈，看看历史
            if self.right_count > self.wrong_count * 2:
                new_level = 4  # 不知道对了（但积累不错）
            elif self.wrong_count > self.right_count:
                new_level = 1  # 不知道错了（积累偏差）
            else:
                new_level = 1  # 默认
        
        # 平滑过渡（避免跳动太大）
        if new_level != self.current_level:
            if abs(new_level - self.current_level) > 1:
                # 跳两级需要更多验证
                new_level = (new_level + self.current_level) // 2
        
        self.current_level = new_level
        
        # 记录历史
        self.history.append({
            "time": datetime.now().isoformat(),
            "action": action,
            "result": result,
            "feedback": feedback,
            "level": new_level
        })
        
        # 返回结果
        level_info = self.LEVELS[new_level]
        return LevelResult(
            current_level=new_level,
            level_name=level_info["name"],
            description=level_info["description"],
            wisdom_status=level_info["wisdom"],
            recommendation=level_info["action"],
            confidence=self._calculate_confidence()
        )
    
    def _calculate_confidence(self) -> float:
        """计算置信度"""
        total = self.right_count + self.wrong_count
        if total == 0:
            return 0.3  # 无历史，置信度低
        if total < 5:
            return 0.5  # 历史少，中等
        accuracy = self.right_count / total
        return min(0.5 + accuracy * 0.5, 0.95)  # 最高0.95
    
    def get_status(self) -> Dict:
        """获取当前状态"""
        return {
            "current_level": self.current_level,
            "level_name": self.LEVELS[self.current_level]["name"],
            "wisdom": self.LEVELS[self.current_level]["wisdom"],
            "total_actions": self.action_count,
            "right_count": self.right_count,
            "wrong_count": self.wrong_count,
            "accuracy": self.right_count / max(1, self.right_count + self.wrong_count)
        }
    
    def reset(self):
        """重置统计"""
        self.history = []
        self.current_level = 1
        self.action_count = 0
        self.right_count = 0
        self.wrong_count = 0


# 快捷函数
def quick_assess(feedback: Optional[str] = None) -> dict:
    """快速评估（无行动记录）"""
    engine = SelfLevelEngine()
    result = engine.assess(feedback=feedback)
    return {
        "level": result.current_level,
        "name": result.level_name,
        "description": result.description,
        "wisdom": result.wisdom_status
    }


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        # CLI 模式
        feedback = sys.argv[1]
        result = quick_assess(feedback)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        # 测试模式
        engine = SelfLevelEngine()
        
        print("=== 四层级自我认知测试 ===\n")
        
        # 模拟场景
        scenarios = [
            {"action": "回答用户问题", "feedback": "right"},
            {"action": "分析情况", "feedback": "right"},
            {"action": "给建议", "feedback": "wrong"},
            {"action": "做总结", "feedback": None},
        ]
        
        for s in scenarios:
            result = engine.assess(**s)
            print(f"行动: {s['action']}")
            print(f"  层级: {result.current_level} ({result.level_name})")
            print(f"  描述: {result.description}")
            print(f"  置信度: {result.confidence:.2f}")
            print()
        
        print("=== 当前状态 ===")
        print(json.dumps(engine.get_status(), ensure_ascii=False, indent=2))
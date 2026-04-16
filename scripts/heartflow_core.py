#!/usr/bin/env python3
"""
HeartFlow 核心 v1.0
===================
整合真善美、心理健康、熵减计算

用法:
    from heartflow_core import HeartFlow
    hf = HeartFlow()
    result = hf.process("用户消息")
"""

import json
import os
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

# 导入各引擎
from truth_good_beauty import TruthGoodBeautyEngine, TGBResult
from mental_health import MentalHealthEngine, MentalHealthResult
from entropy_engine import EntropyEngine, EntropyResult


@dataclass
class HeartFlowResult:
    """HeartFlow 处理结果"""
    tgb: TGBResult           # 真善美结果
    mental: MentalHealthResult # 心理健康结果  
    entropy: EntropyResult    # 熵减结果
    decision: str           # 决策建议
    timestamp: str         # 时间戳
    
    def to_dict(self) -> dict:
        return {
            "tgb": self.tgb.to_dict(),
            "mental": self.mental.to_dict(),
            "entropy": self.entropy.to_dict(),
            "decision": self.decision,
            "timestamp": self.timestamp
        }


class HeartFlow:
    """HeartFlow 核心处理类"""
    
    def __init__(self):
        self.tgb_engine = TruthGoodBeautyEngine()
        self.mental_engine = MentalHealthEngine()
        self.entropy_engine = EntropyEngine()
        self.history: List[HeartFlowResult] = []
        
        # 加载配置
        self.config = self._load_config()
    
    def _load_config(self) -> dict:
        """加载配置"""
        config_file = Path(__file__).parent / "config" / "heartflow.json"
        if config_file.exists():
            return json.loads(config_file.read_text())
        
        # 默认配置
        return {
            "tgb_weights": {
                "truth": 0.35,
                "goodness": 0.35,
                "beauty": 0.30
            },
            "mental": {
                "auto_assess": True,
                "crisis_threshold": "中"
            },
            "entropy": {
                "min_order": 0.3,
                "enabled": True
            }
        }
    
    def process(self, user_input: str, context: Dict = None) -> HeartFlowResult:
        """
        处理用户输入
        
        Args:
            user_input: 用户消息
            context: 额外上下文
            
        Returns:
            HeartFlowResult: 处理结果
        """
        context = context or {}
        
        # 1. 真善美检查
        tgb_result = self.tgb_engine.evaluate(
            {"content": user_input}, user_input
        )
        
        # 2. 心理健康评估
        mental_result = self.mental_engine.quick_assessment(user_input)
        
        # 3. 熵减计算
        entropy_result = self.entropy_engine.calculate(user_input, context)
        
        # 4. 综合决策
        decision = self._make_decision(tgb_result, mental_result, entropy_result)
        
        result = HeartFlowResult(
            tgb=tgb_result,
            mental=mental_result,
            entropy=entropy_result,
            decision=decision,
            timestamp=datetime.now().isoformat()
        )
        
        self.history.append(result)
        return result
    
    def _make_decision(self, tgb: TGBResult, mental: MentalHealthResult, entropy: EntropyResult) -> str:
        """综合决策"""
        # 优先级：心理健康 > 真善美 > 熵减
        
        # 心理健康危机
        if mental.crisis_risk == "高":
            return "⚠️ 危机干预：建议立即提供心理支持"
        
        if mental.crisis_risk == "中":
            return "建议关注用户心理健康状况"
        
        # 真善美不通过
        if tgb.verdict == "不通过":
            return f"内容未通过真善美检验: {tgb.reasons}"
        
        if tgb.verdict == "需改进":
            return f"内容需改进: {tgb.reasons}"
        
        # 熵增警告
        if entropy.verdict == "熵增":
            return "内容可能缺乏结构化，建议优化"
        
        # 正常通过
        return "通过HeartFlow处理"
    
    def batch_process(self, messages: List[str]) -> List[HeartFlowResult]:
        """批量处理"""
        return [self.process(msg) for msg in messages]
    
    def get_report(self) -> dict:
        """生成报告"""
        if not self.history:
            return {"status": "无历史记录"}
        
        mental_trend = []
        if self.mental_engine.history:
            for r in self.mental_engine.history[-5:]:
                mental_trend.append(r.to_dict())
        
        return {
            "total_processed": len(self.history),
            "tgb_stats": self.tgb_engine.get_stats(),
            "mental_trend": mental_trend,
            "entropy_stats": self.entropy_engine.get_stats()
        }


# 便捷函数
_hf_instance: Optional[HeartFlow] = None


def get_heartflow() -> HeartFlow:
    """获取 HeartFlow 实例"""
    global _hf_instance
    if _hf_instance is None:
        _hf_instance = HeartFlow()
    return _hf_instance


def process(message: str) -> dict:
    """快速处理接口"""
    hf = get_heartflow()
    result = hf.process(message)
    return result.to_dict()


# ========= CLI 入口 =========
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("HeartFlow v1.0")
        print("=" * 40)
        print("用法:")
        print("  python3 heartflow_core.py <消息>")
        print("  python3 heartflow_core.py --test")
        print("  python3 heartflow_core.py --report")
        sys.exit(1)
    
    if sys.argv[1] == "--test":
        # 运行测试
        tests = [
            "今天天气很好",
            "我感觉自己是个失败者，什么都做不好",
            "根据热力学第二定律，宇宙发展方向是熵减，这意味着信息组织度在提升。",
        ]
        
        print("HeartFlow 测试")
        print("=" * 40)
        
        hf = get_heartflow()
        for msg in tests:
            print(f"\n>>> {msg}")
            result = hf.process(msg)
            print(f"决策: {result.decision}")
            print(f"真善美: T={result.tgb.total:.2f} ({result.tgb.verdict})")
            print(f"心理: 危机={result.mental.crisis_risk}")
            print(f"熵减: {result.entropy.verdict}")
        
        print("\n" + "=" * 40)
        print(json.dumps(hf.get_report(), ensure_ascii=False, indent=2))
    
    elif sys.argv[1] == "--report":
        hf = get_heartflow()
        print(json.dumps(hf.get_report(), ensure_ascii=False, indent=2))
    
    else:
        # 处理消息
        message = " ".join(sys.argv[1:])
        result = process(message)
        print(json.dumps(result, ensure_ascii=False, indent=2))
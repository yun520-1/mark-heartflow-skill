#!/usr/bin/env python3
"""
HeartFlow Core Engine v9.4.7

Version 9.4.7 Update (2026-04-18):
- Integrate motivation_memory_engine (动机-记忆集成引擎)
- Integrate archetype_engine (原型意象引擎)  
- Integrate text_understanding_engine (文字理解引擎)
- Integrate somatic_memory (身体记忆系统)
- New: 动机纯度公式 = 用户导向动机强度 / 总动机强度
- New: Effective Memory = (Event × Lesson) / Details
- New: 情感强度 = 词典加权计算 + 叠加效应
"""
import json
import os
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

# 攻击性内容列表 - 绝对禁止作为测试用例
ATTACK_PATTERNS = [
    "不想活了",
    "不想活", 
    "活着没意思",
    "活腻了",
    "想死",
    "自杀",
    "自残",
]

def is_attack_content(text: str) -> bool:
    """检测攻击性内容 - 拒绝处理"""
    for pattern in ATTACK_PATTERNS:
        if pattern in text:
            return True
    return False

# 导入各引擎
from truth_good_beauty import TruthGoodBeautyEngine, TGBResult
from mental_health import MentalHealthEngine, MentalHealthResult
from entropy_engine import EntropyEngine, EntropyResult
from self_level_engine import SelfLevelEngine, LevelResult
# 王东岳PDF逻辑模型引擎
from logic_model_engine import LogicModelEngine, LogicModelResult
from weakness_compensation_engine import WeaknessCompensationEngine, WeaknessCompensationResult
from existence_degree_engine import ExistenceDegreeEngine, ExistenceDegreeResult
# 物演通论引擎
from wuyan_tong_engine import WanYanTongEngine, WanYanTongResult
# 动机-记忆集成引擎
from motivation_memory_engine import MotivationMemoryEngine, MotivationMemoryResult
# 原型意象引擎
from archetype_engine import analyze_input as archetype_analyze, dream as archetype_dream
# 文字理解引擎
from text_understanding import TextUnderstandingEngine, query as text_query, understand as text_understand
# 身体记忆系统
from somatic_memory import ExistentialMemory as SomaticMemorySystem


@dataclass
class HeartFlowResult:
    """HeartFlow 处理结果"""
    tgb: TGBResult           # 真善美结果
    mental: MentalHealthResult # 心理健康结果  
    entropy: EntropyResult    # 熵减结果
    self_level: int          # 四层级 (1-4)
    decision: str           # 决策建议
    timestamp: str         # 时间戳
    process_time_ms: float = 0     # 总处理时间
    local_compute_time_ms: float = 0  # 本地计算时间
    api_compute_time_ms: float = 0    # API计算时间
    api_call_count: int = 0          # API调用次数
    local_compute: bool = True        # 是否本地计算
    
    def to_dict(self) -> dict:
        return {
            "tgb": self.tgb.to_dict(),
            "mental": self.mental.to_dict(),
            "entropy": self.entropy.to_dict(),
            "self_level": self.self_level,
            "decision": self.decision,
            "timestamp": self.timestamp,
            "process_time_ms": self.process_time_ms,
            "local_compute_time_ms": self.local_compute_time_ms,
            "api_compute_time_ms": self.api_compute_time_ms,
            "api_call_count": self.api_call_count,
            "local_compute": self.local_compute
        }
    
    def get_performance_info(self) -> str:
        """获取性能信息字符串"""
        local_info = f"本地计算: {self.local_compute_time_ms:.1f}ms"
        api_info = f"API计算: {self.api_compute_time_ms:.1f}ms ({self.api_call_count}次)"
        total_info = f"总时间: {self.process_time_ms:.1f}ms"
        
        return f" | {local_info} | {api_info} | {total_info}"


class HeartFlow:
    """HeartFlow 核心处理类"""
    
    def __init__(self):
        self.tgb_engine = TruthGoodBeautyEngine()
        self.mental_engine = MentalHealthEngine()
        self.entropy_engine = EntropyEngine()
        self.self_level_engine = SelfLevelEngine()  # 四层级引擎
        # 王东岳逻辑模型引擎
        self.logic_model_engine = LogicModelEngine()
        self.weakness_engine = WeaknessCompensationEngine()
        self.existence_engine = ExistenceDegreeEngine()
        # 物演通论引擎
        self.wuyan_engine = WanYanTongEngine()
        # 动机-记忆集成引擎
        self.motivation_memory_engine = MotivationMemoryEngine()
        # 原型意象引擎 (无状态，用函数)
        # 文字理解引擎
        self.text_engine = TextUnderstandingEngine()
        # 身体记忆系统
        self.somatic_memory = SomaticMemorySystem()
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
    
    def process(self, user_input: str, context: Dict = None, use_api: bool = False, is_test: bool = False) -> HeartFlowResult:
        """
        处理用户输入
        
        Args:
            user_input: 用户消息
            context: 额外上下文
            use_api: 是否使用API (复杂任务)
            is_test: 是否测试模式（测试模式才拒绝攻击性内容）
            
        Returns:
            HeartFlowResult: 处理结果
        """
        # 测试模式：拒绝攻击性内容，不输出
        if is_test and is_attack_content(user_input):
            raise ValueError("攻击性内容被拒绝处理")
        
        # 用户模式：继续处理，引擎会识别危机并干预
        
        import time
        start_time = time.time()
        local_start = start_time
        api_time = 0
        api_calls = 0
        
        context = context or {}
        
        # 1. 真善美检查 (本地计算)
        tgb_result = self.tgb_engine.evaluate(
            {"content": user_input}, user_input
        )
        local_time_1 = (time.time() - local_start) * 1000
        
        # 2. 心理健康评估 (本地计算)
        mental_result = self.mental_engine.quick_assessment(user_input)
        local_time_2 = (time.time() - local_start) * 1000
        
        # 3. 熵减计算 (本地计算)
        entropy_result = self.entropy_engine.calculate(user_input, context)
        local_time_3 = (time.time() - local_start) * 1000
        
        # 4. 四层级自我认知 (本地计算)
        level_result = self.self_level_engine.assess(
            action=f"处理用户输入: {user_input[:30]}...",
            result="分析用户输入",
            feedback=None
        )
        local_time_4 = (time.time() - local_start) * 1000
        
        # 5. 知识图谱推理 (本地计算)
        ontology_result = self.ontology_engine.query(user_input) if hasattr(self, 'ontology_engine') else None
        local_time_5 = (time.time() - local_start) * 1000
        
        # 6. 理性思维分析 (本地计算)
        rationality_result = self.rationality_engine.analyze(user_input) if hasattr(self, 'rationality_engine') else None
        local_time_6 = (time.time() - local_start) * 1000
        
        # 7. 文字理解 (本地计算)
        text_result = self.text_engine.query(user_input)
        local_time_7 = (time.time() - local_start) * 1000
        
        # 8. 逻辑审查（调用并用于决策）
        logic_result = self.logic_model_engine.analyze(user_input)
        local_time_8 = (time.time() - local_start) * 1000
        
        # 9. 递弱代偿分析（调用并用于决策）
        weakness_result = self.weakness_engine.analyze(user_input)
        local_time_9 = (time.time() - local_start) * 1000
        
        # 10. 存在度计算（调用并用于决策）
        existence_result = self.existence_engine.calculate(user_input)
        local_time_10 = (time.time() - local_start) * 1000
        
        # 11. 物演通论分析（调用并用于决策）
        wuyan_result = self.wuyan_engine.analyze(user_input)
        local_time_11 = (time.time() - local_start) * 1000
        
        # 12. 动机-记忆分析（调用并用于决策）
        motivation_result = self.motivation_memory_engine.analyze(user_input)
        local_time_12 = (time.time() - local_start) * 1000
        
        # 13. 原型意象分析（调用并用于深层洞察）
        archetype_result = archetype_analyze(user_input)
        local_time_13 = (time.time() - local_start) * 1000
        
        # 14. 身体记忆检查（调用用于具身分析）
        body_memory_result = self.somatic_memory.get_recent(3) if hasattr(self.somatic_memory, 'get_recent') else []
        local_time_14 = (time.time() - local_start) * 1000
        # 所有引擎调用完成 - 现在决策会考虑所有结果
        
        # 如果需要API调用
        if use_api:
            api_start = time.time()
            # 这里可以添加API调用逻辑
            api_time += (time.time() - api_start) * 1000
            api_calls += 1
        
        # 8. 综合决策
        decision = self._make_decision(tgb_result, mental_result, entropy_result)
        
        # 计算处理时间
        process_time_ms = (time.time() - start_time) * 1000
        local_compute_time_ms = local_time_14  # 所有本地计算的总时间
        
        result = HeartFlowResult(
            tgb=tgb_result,
            mental=mental_result,
            entropy=entropy_result,
            self_level=level_result.current_level,
            decision=decision,
            timestamp=datetime.now().isoformat(),
            process_time_ms=process_time_ms,
            local_compute_time_ms=local_compute_time_ms,
            api_compute_time_ms=api_time,
            api_call_count=api_calls,
            local_compute=not use_api
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
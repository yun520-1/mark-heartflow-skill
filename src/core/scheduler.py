#!/usr/bin/env python3
"""
HeartFlow MetaCognitive Scheduler (元认知调度核心)
协调四层、管理推理流程、控制认知成本

基于 Roynard (2026) R-CCAM 五阶段认知循环
"""

import time
from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass, field
from concurrent.futures import ThreadPoolExecutor, as_completed


@dataclass
class CognitiveCost:
    """认知成本"""
    time_spent: float = 0.0      # 耗时（秒）
    compute_units: int = 0       # 计算单位
    energy_penalty: float = 0.0  # 能量惩罚
    total: float = 0.0           # 总成本
    
    def calculate(self, cost_per_step: float = 0.1) -> float:
        """计算总成本"""
        self.total = (self.time_spent * self.compute_units + self.energy_penalty) * cost_per_step
        return self.total


@dataclass
class ReasoningResult:
    """推理结果"""
    output: str
    confidence: float
    reasoning_path: List[str] = field(default_factory=list)
    layers_used: List[str] = field(default_factory=list)
    cognitive_cost: float = 0.0
    depth: int = 0
    quality_score: float = 0.0
    value_alignment: Dict[str, float] = field(default_factory=dict)


class StructuredCognitiveLoop:
    """
    结构化认知循环 (Structured Cognitive Loop)
    实现 R-CCAM 五阶段流程
    """
    
    def __init__(self, knowledge_layer, memory_layer, 
                 wisdom_layer, intelligence_layer):
        self.knowledge = knowledge_layer
        self.memory = memory_layer
        self.wisdom = wisdom_layer
        self.intelligence = intelligence_layer
    
    def run(self, task: str, context: Dict = None, mode: str = "full") -> ReasoningResult:
        """
        执行完整的 R-CCAM 循环
        
        Retrieve → Cognize → Control → Act → Memorize
        """
        context = context or {}
        reasoning_path = []
        layers_used = []
        start_time = time.time()
        
        # 阶段 1: Retrieve (检索)
        reasoning_path.append("Retrieve: 从知识层和记忆层检索")
        layers_used.append('knowledge')
        layers_used.append('memory')
        
        retrieved = self._retrieve(task, context)
        
        # 阶段 2: Cognize (认知)
        reasoning_path.append("Cognize: 调用智能层推理")
        layers_used.append('intelligence')
        
        cognition = self._cognize(task, retrieved, mode)
        
        # 阶段 3: Control (控制)
        reasoning_path.append("Control: 智慧层价值过滤")
        layers_used.append('wisdom')
        
        controlled = self._control(cognition, task)
        
        # 阶段 4: Act (行动)
        reasoning_path.append("Act: 生成最终输出")
        
        action = self._act(controlled, task)
        
        # 阶段 5: Memorize (记忆)
        reasoning_path.append("Memorize: 存入记忆层")
        
        self._memorize(task, action, reasoning_path)
        
        # 计算成本
        time_spent = time.time() - start_time
        cost = CognitiveCost(
            time_spent=time_spent,
            compute_units=len(reasoning_path),
            energy_penalty=0.1 * len(layers_used)
        )
        
        return ReasoningResult(
            output=action.get('output', ''),
            confidence=cognition.get('confidence', 0.5),
            reasoning_path=reasoning_path,
            layers_used=layers_used,
            cognitive_cost=cost.calculate(),
            depth=len(reasoning_path),
            quality_score=cognition.get('quality', 0.5),
            value_alignment=controlled.get('alignment', {})
        )
    
    def _retrieve(self, task: str, context: Dict) -> Dict[str, Any]:
        """从知识层和记忆层检索"""
        # 知识检索
        knowledge_result = self.knowledge.process({
            'query': task,
            'facts': context.get('facts', {})
        })
        
        # 记忆检索
        memory_result = self.memory.process({
            'query': task,
            'top_k': 3
        })
        
        return {
            'knowledge': knowledge_result.get('knowledge', []),
            'inferences': knowledge_result.get('inferences', []),
            'memories': memory_result.get('memories', []),
            'emotions': memory_result.get('emotions', {})
        }
    
    def _cognize(self, task: str, retrieved: Dict, mode: str) -> Dict[str, Any]:
        """调用智能层推理"""
        # 根据模式选择推理方式
        if mode == 'logic':
            # 逻辑验证模式
            result = self.intelligence.process({
                'mode': 'logic',
                'premises': retrieved.get('knowledge', []),
                'conclusion': task
            })
        elif mode == 'debate':
            # 论辩模式
            pro_args = [m['content'] for m in retrieved.get('memories', [])[:2]]
            result = self.intelligence.process({
                'mode': 'debate',
                'pro_args': pro_args,
                'con_args': []
            })
        else:
            # 完整推理模式
            result = self.intelligence.process({
                'mode': 'full',
                'premises': retrieved.get('knowledge', [])[:3],
                'conclusion': task
            })
        
        # 计算置信度
        confidence = 0.5
        if 'logic' in result:
            confidence = result['logic'].get('confidence', 0.5)
        elif 'debate' in result:
            confidence = 0.8 if result['debate'].get('acceptable') else 0.4
        
        # 情感影响置信度
        emotions = retrieved.get('emotions', {})
        if emotions.get('confidence'):
            confidence = min(1.0, confidence * (1 + emotions['confidence'] * 0.2))
        
        return {
            'raw_result': result,
            'confidence': confidence,
            'quality': 0.7  # 默认质量
        }
    
    def _control(self, cognition: Dict, task: str) -> Dict[str, Any]:
        """智慧层过滤和修正"""
        raw = cognition.get('raw_result', {})
        
        # 价值对齐
        alignment = self.wisdom.evaluate_alignment(task)
        
        # 偏见检测
        reasoning_chain = cognition.get('raw_result', {}).get('logic', {}).get('proof_steps', [])
        biases = self.wisdom.detect_biases(reasoning_chain)
        
        return {
            'alignment': alignment.get('tgb', {}),
            'biases': biases,
            'warnings': alignment.get('warnings', []),
            'filtered': True
        }
    
    def _act(self, controlled: Dict, task: str) -> Dict[str, Any]:
        """生成最终输出"""
        alignment = controlled.get('alignment', {})
        
        # 构建输出
        output_parts = []
        
        # 核心回应
        output_parts.append(f"关于「{task}」的分析：")
        
        # 价值评估
        tgb = alignment
        if tgb:
            score = tgb.get('score', 0)
            output_parts.append(f"价值对齐度：{score:.1%}")
        
        # 警告
        warnings = controlled.get('warnings', [])
        if warnings:
            output_parts.append(f"注意：{', '.join(warnings)}")
        
        # 偏见提示
        biases = controlled.get('biases', [])
        if biases:
            output_parts.append(f"检测到 {len(biases)} 个潜在认知偏见")
        
        return {
            'output': '\n'.join(output_parts),
            'warnings': warnings,
            'biases': biases
        }
    
    def _memorize(self, task: str, action: Dict, reasoning_path: List[str]):
        """存入记忆层，触发自进化"""
        # 存入记忆
        self.memory.add_memory(
            content=f"处理任务：{task}",
            emotion={'satisfaction': action.get('warnings', []) and 0.5 or 0.8},
            tags=['task', 'reasoning']
        )
        
        # 记录进化
        outcome = 'completed'
        lesson = ''
        if action.get('warnings'):
            lesson = f"处理 '{task}' 时遇到价值对齐警告"
        
        if reasoning_path:
            self.memory.log_evolution(
                task=task,
                reasoning_path=reasoning_path,
                outcome=outcome,
                lesson=lesson
            )


class CognitiveFrictionScheduler:
    """
    认知摩擦力调度器
    实现思考成本计算和效用评估
    """
    
    def __init__(self, max_depth: int = 5, cost_per_step: float = 0.1):
        self.max_depth = max_depth
        self.cost_per_step = cost_per_step
    
    def calculate_cost(self, depth: int, compute_units: int = 1) -> float:
        """计算推理成本"""
        return depth * compute_units * self.cost_per_step
    
    def calculate_utility(self, expected_value: float, cost: float) -> float:
        """计算边际效用"""
        return expected_value - cost
    
    def should_continue(self, depth: int, utility: float) -> bool:
        """
        认知摩擦力：判断是否应继续推理
        
        停止条件：
        1. 达到最大深度
        2. 边际效用 <= 0
        """
        if depth >= self.max_depth:
            return False
        if utility <= 0:
            return False
        return True


class ParallelAgentVoter:
    """
    并行投票机制
    支持多个推理路径并行执行，投票选出最优结果
    """
    
    def __init__(self, agents: List[Callable]):
        self.agents = agents
    
    def first_to_ahead_by_k(self, k: int, task: str, 
                            context: Dict = None) -> Any:
        """
        第一个领先 k 票的获胜
        
        简化实现：返回第一个完成的非空结果
        """
        context = context or {}
        
        with ThreadPoolExecutor(max_workers=len(self.agents)) as executor:
            futures = {
                executor.submit(agent, task, context): i 
                for i, agent in enumerate(self.agents)
            }
            
            for future in as_completed(futures):
                try:
                    result = future.result()
                    if result and result.output:
                        return result
                except Exception:
                    continue
        
        return None
    
    def majority_vote(self, results: List[ReasoningResult]) -> ReasoningResult:
        """
        多数投票：返回置信度最高的结果
        """
        if not results:
            return ReasoningResult(output="无法得出结论", confidence=0.0)
        
        return max(results, key=lambda r: r.confidence)


class MetaCognitiveScheduler:
    """
    元认知调度核心
    
    协调四层、管理推理流程、控制认知成本。
    
    核心组件：
    - StructuredCognitiveLoop: R-CCAM 五阶段认知循环
    - CognitiveFrictionScheduler: 认知摩擦力调度器
    - ParallelAgentVoter: 并行投票机制
    """
    
    def __init__(self, knowledge_layer, memory_layer, 
                 wisdom_layer, intelligence_layer, config: Dict = None):
        self.config = config or {}
        
        # 四层
        self.knowledge = knowledge_layer
        self.memory = memory_layer
        self.wisdom = wisdom_layer
        self.intelligence = intelligence_layer
        
        # 调度器配置
        max_depth = self.config.get('max_depth', 5)
        cost_per_step = self.config.get('cost_per_step', 0.1)
        
        # 初始化组件
        self.cognitive_loop = StructuredCognitiveLoop(
            knowledge_layer, memory_layer, wisdom_layer, intelligence_layer
        )
        self.friction = CognitiveFrictionScheduler(max_depth, cost_per_step)
        self.voter = ParallelAgentVoter([])
        
        # 模式映射
        self.mode_map = {
            'full': 'full',
            'logic': 'logic',
            'debate': 'debate',
            'ethics': 'logic',
            'assess': 'full'
        }
    
    def run(self, task: str, context: Dict = None, 
            mode: str = "full") -> ReasoningResult:
        """
        执行完整的 R-CCAM 循环
        
        Args:
            task: 任务描述
            context: 上下文信息
            mode: 推理模式 ('full', 'logic', 'debate', 'ethics', 'assess')
        
        Returns:
            ReasoningResult: 包含输出、置信度、推理路径等
        """
        # 映射模式
        effective_mode = self.mode_map.get(mode, 'full')
        
        # 检查认知成本
        cost = self.friction.calculate_cost(0)
        utility = self.friction.calculate_utility(1.0, cost)
        
        if not self.friction.should_continue(0, utility):
            return ReasoningResult(
                output="推理成本过高，停止处理",
                confidence=0.0,
                cognitive_cost=cost
            )
        
        # 执行认知循环
        result = self.cognitive_loop.run(task, context, effective_mode)
        
        # 最终成本检查
        if not self.friction.should_continue(result.depth, 
                                              1.0 - result.cognitive_cost):
            result.output += "\n[推理深度已达上限]"
        
        return result
    
    def get_state(self) -> Dict[str, Any]:
        """返回调度器状态"""
        return {
            'max_depth': self.friction.max_depth,
            'cost_per_step': self.friction.cost_per_step,
            'layers_available': [
                self.knowledge.get_state() if hasattr(self.knowledge, 'get_state') else {},
                self.memory.get_state() if hasattr(self.memory, 'get_state') else {},
                self.wisdom.get_state() if hasattr(self.wisdom, 'get_state') else {},
                self.intelligence.get_state() if hasattr(self.intelligence, 'get_state') else {},
            ]
        }


if __name__ == "__main__":
    # 测试代码
    from .layers import KnowledgeLayer, MemoryLayer, WisdomLayer, IntelligenceLayer
    
    # 初始化四层
    knowledge = KnowledgeLayer()
    memory = MemoryLayer()
    wisdom = WisdomLayer()
    intelligence = IntelligenceLayer()
    
    # 创建调度器
    scheduler = MetaCognitiveScheduler(
        knowledge, memory, wisdom, intelligence
    )
    
    # 执行推理
    result = scheduler.run("什么是真正的善良？", mode="full")
    
    print(f"Output: {result.output}")
    print(f"Confidence: {result.confidence:.2f}")
    print(f"Depth: {result.depth}")
    print(f"Cost: {result.cognitive_cost:.4f}")
    print(f"Path: {result.reasoning_path}")
    print(f"Layers: {result.layers_used}")
    print(f"State: {scheduler.get_state()}")

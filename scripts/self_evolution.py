#!/usr/bin/env python3
"""
🔄 自进化引擎 - 持续学习与优化
实现自我改进、元学习、长期记忆
"""

import json
import os
from typing import Dict, List, Any
from datetime import datetime
from dataclasses import dataclass, field
import hashlib

@dataclass
class LearningExperience:
    """学习经验"""
    id: str
    task: str
    input: str
    output: str
    success: bool
    timestamp: str
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class MetaKnowledge:
    """元知识"""
    principle: str
    confidence: float
    domains: List[str]
    last_applied: str
    success_rate: float

class SelfEvolutionCore:
    """
    自进化核心
    - 经验积累
    - 模式识别
    - 元学习
    - 知识蒸馏
    """
    
    def __init__(self, memory_path: str = "memory/evolution.json"):
        self.memory_path = memory_path
        self.experiences: List[LearningExperience] = []
        self.meta_knowledge: List[MetaKnowledge] = []
        self.success_count = 0
        self.total_count = 0
        self._load_memory()
    
    def _load_memory(self):
        """加载持久化记忆"""
        if os.path.exists(self.memory_path):
            try:
                with open(self.memory_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    # 恢复经验
                    for exp in data.get('experiences', []):
                        self.experiences.append(LearningExperience(**exp))
                    # 恢复元知识
                    for mk in data.get('meta_knowledge', []):
                        self.meta_knowledge.append(MetaKnowledge(**mk))
            except:
                pass
    
    def _save_memory(self):
        """保存记忆"""
        os.makedirs(os.path.dirname(self.memory_path), exist_ok=True)
        data = {
            'experiences': [asdict(e) for e in self.experiences],
            'meta_knowledge': [asdict(mk) for mk in self.meta_knowledge],
            'stats': {
                'success_rate': self.success_rate,
                'total_experiences': len(self.experiences),
                'last_updated': datetime.now().isoformat()
            }
        }
        with open(self.memory_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    
    def record_experience(self, task: str, input_data: str, output: str, success: bool, metadata: Dict = None):
        """记录学习经验"""
        self.total_count += 1
        if success:
            self.success_count += 1
        
        experience = LearningExperience(
            id=hashlib.md5(f"{task}{input_data}{datetime.now()}".encode()).hexdigest()[:12],
            task=task,
            input=input_data,
            output=output,
            success=success,
            timestamp=datetime.now().isoformat(),
            metadata=metadata or {}
        )
        self.experiences.append(experience)
        self._save_memory()
    
    @property
    def success_rate(self) -> float:
        """成功率"""
        if self.total_count == 0:
            return 0.0
        return self.success_count / self.total_count
    
    def learn_pattern(self, experiences: List[LearningExperience]) -> MetaKnowledge:
        """从经验中学习模式"""
        # 简化: 基于成功经验提取模式
        successful = [e for e in experiences if e.success]
        if not successful:
            return None
        
        # 分析成功经验的共同特征
        common_elements = self._extract_common_patterns(successful)
        
        meta_knowledge = MetaKnowledge(
            principle=common_elements,
            confidence=len(successful) / len(experiences),
            domains=["general"],
            last_applied=datetime.now().isoformat(),
            success_rate=len(successful) / len(experiences)
        )
        
        self.meta_knowledge.append(meta_knowledge)
        self._save_memory()
        
        return meta_knowledge
    
    def _extract_common_patterns(self, experiences: List[LearningExperience]) -> str:
        """提取共同模式"""
        # 简化实现
        return "成功模式: 上下文感知 + 迭代优化"
    
    def adapt_strategy(self, current_performance: float) -> str:
        """根据表现调整策略"""
        if current_performance > 0.8:
            return "保持当前策略"
        elif current_performance > 0.5:
            return "微调参数"
        else:
            return "重新设计策略"

# ======================
# 进化循环管理器
# ======================

class EvolutionManager:
    """进化循环管理器"""
    
    def __init__(self):
        self.core = SelfEvolutionCore()
        self.generations = 0
    
    def run_generation(self, tasks: List[Dict]) -> Dict[str, Any]:
        """运行一代进化"""
        self.generations += 1
        results = []
        
        for task in tasks:
            # 执行任务
            success = self._execute_task(task)
            
            # 记录经验
            self.core.record_experience(
                task=task.get('name', 'unknown'),
                input=task.get('input', ''),
                output=task.get('output', ''),
                success=success,
                metadata=task.get('metadata', {})
            )
            
            results.append({"task": task, "success": success})
        
        # 学习模式
        if results:
            self.core.learn_pattern([
                LearningExperience(
                    id="evolution_pattern",
                    task="evolution",
                    input=str(results),
                    output="learned",
                    success=True,
                    timestamp=datetime.now().isoformat()
                )
            ])
        
        return {
            "generation": self.generations,
            "success_rate": self.core.success_rate,
            "results": results,
            "strategy": self.core.adapt_strategy(self.core.success_rate)
        }
    
    def _execute_task(self, task: Dict) -> bool:
        """执行任务"""
        # 简化: 假设任务成功
        return True
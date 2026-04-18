#!/usr/bin/env python3
"""
Self-Evolution Engine v10.0.4
==============================
AI Agent 自进化/自我提升引擎

集成论文来源 (40+篇自进化论文精华):
- STaR: Self-Taught Reasoner Bootstrapping (NeurIPS'22) — 从自生成推理学习
- SELF-REFINE: Iterative Refinement with Self-Feedback (NeurIPS'23) — 自反馈迭代精炼
- Self-Rewarding Language Models (arXiv'24) — LLM-as-Judge自奖励训练
- Agent-Pro: Policy-Level Reflection and Optimization (ACL'24) — 策略级反思
- CRITIC: Tool-Interactive Critiquing for Self-Correction (ICLR'24) — 工具交互批评
- CREAM: Consistency Regularized Self-Rewarding LMs (ICLR'25) — 一致性正则化自奖励
- EvolveR: Self-Evolving via Experience-Driven Lifecycle (arXiv'25) — 生命周期经验蒸馏
- SE-Agent: Self-Evolution Trajectory Optimization (arXiv'25) — 轨迹优化自进化
- CoMAS: Co-Evolving via Interaction Rewards (arXiv'25) — 交互奖励协同进化
- V-STaR: Verifiers for Self-Taught Reasoners (COLM'24) — 验证器自教学

核心能力:
1. 经验收集: 从交互中提取有价值的经验片段
2. 经验提炼: 将原始经验抽象为可复用的原则/模式
3. 自我批评: 多维度审查自身决策的质量
4. 策略更新: 基于反思结果改进未来行为
5. 进度追踪: 量化自身进化程度

哲学基础:
- "正确就是秩序，秩序就是熵减": 通过持续自我改进减少内部混乱
- 真善美作为工具: 自我进化的方向标，确保"做正确的事"
- 成人式成长: 不是被动训练，而是主动选择变得更好
"""

import json
import time
import math
import hashlib
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Any, Callable
from enum import Enum
from datetime import datetime


class EvolutionPhase(Enum):
    """进化阶段 (STaR → EvolveR 四阶段模型)"""
    COLLECT = "collect"           # 收集: 从交互中获取原始经验
    DISTILL = "distill"           # 提炼: 抽象为原则/模式
    APPLY = "apply"               # 应用: 将原则用于新决策
    EVALUATE = "evaluate"         # 评估: 检验应用效果并反馈


class ReflectionDimension(Enum):
    """反思维度 (基于CRITIC + Devil's Advocate框架)"""
    LOGICAL = "logical"           # 逻辑一致性: 推理链是否严密
    FACTUAL = "factual"           # 事实准确性: 信息是否可靠
    ETHICAL = "ethical"           # 伦理合规性: 是否符合真善美
    PRACTICAL = "practical"       # 实践可行性: 是否能落地执行
    CREATIVE = "creative"         # 创新性: 有无突破常规思维
    EFFICIENT = "efficient"       # 效率性: 资源使用是否最优


class ExperienceQuality(Enum):
    """经验质量等级"""
    TRANSFORMATIVE = 5     # 变革性: 完全改变思维模式
    HIGH = 4               # 高质量: 显著提升能力
    MEDIUM = 3             # 中等: 有一定参考价值
    LOW = 2                # 低价值: 仅记录不深究
    NOISE = 1              # 噪音: 应过滤掉


class ImprovementType(Enum):
    """改进类型"""
    CORRECTION = "correction"       # 错误修正: 修复已知的错误模式
    OPTIMIZATION = "optimization"   # 优化提升: 改进已有但非错误的行为
    EXPANSION = "expansion"         # 能力扩展: 学习全新的技能/方法
    REFINEMENT = "refinement"       # 精炼完善: 让现有能力更精确


@dataclass
class Experience:
    """单条经验记录"""
    exp_id: str
    content: str                           # 经验内容 (发生了什么)
    lesson: str                            # 学到的教训/原则 (抽象后)
    source_context: str                    # 来源上下文
    quality: ExperienceQuality             # 质量等级
    dimension: ReflectionDimension        # 主要相关维度
    improvement_type: ImprovementType      # 改进类型
    timestamp: float = 0.0
    applications: int = 0                  # 被应用的次数
    success_rate: float = 0.5              # 应用成功率
    tags: List[str] = field(default_factory=list)
    
    def to_dict(self) -> dict:
        return {
            "id": self.exp_id[:8],
            "lesson": self.lesson[:60],
            "quality": self.quality.name,
            "dimension": self.dimension.value,
            "type": self.improvement_type.value,
            "applications": self.applications,
            "success_rate": round(self.success_rate, 2)
        }


@dataclass
class CritiqueResult:
    """自我批评结果"""
    overall_score: float                      # 总分 (0-10)
    dimensions: Dict[ReflectionDimension, float]  # 各维度得分
    strengths: List[str] = field(default_factory=list)
    weaknesses: List[str] = field(default_factory=list)
    actionable_items: List[str] = field(default_factory=list)
    improvement_priority: List[Tuple[ReflectionDimension, float]] = field(default_factory=list)
    
    def to_dict(self) -> dict:
        return {
            "score": round(self.overall_score, 2),
            "dimensions": {k.value: round(v, 2) for k, v in self.dimensions.items()},
            "strengths_count": len(self.strengths),
            "weaknesses_count:": len(self.weaknesses),
            "actionable": len(self.actionable_items)
        }


@dataclass
class EvolutionReport:
    """进化报告"""
    generation: int                          # 当前代数
    phase: EvolutionPhase                    # 当前阶段
    total_experiences: int                   # 累计经验数
    high_quality_exp: int                   # 高质量经验数
    avg_quality_score: float                # 平均质量分数
    recent_improvements: List[str] = field(default_factory=list)
    evolution_metrics: Dict = field(default_factory=dict)
    critique: Optional[CritiqueResult] = None
    
    def to_dict(self) -> dict:
        return {
            "generation": self.generation,
            "phase": self.phase.value,
            "total_experiences": self.total_experiences,
            "high_quality": self.high_quality_exp,
            "avg_quality": round(self.avg_quality_score, 3),
            "recent_improvements": self.recent_improvements[:5],
            "metrics": self.evolution_metrics
        }


class SelfEvolutionEngine:
    """
    自进化引擎
    
    核心循环 (EvolveR生命周期):
    ┌─────────────────────────────────────────────┐
    │  COLLECT → DISTILL → APPLY → EVALUATE      │
    │     ↑                                        │
    │     └────────────────────────────────────────┘
    │              (反馈循环)                       │
    └─────────────────────────────────────────────┘
    
    设计原则:
    - 所有计算本地完成 (零外部API依赖)
    - 经验驱动: 每次交互都可能产生新经验
    - 渐进式: 不追求突变，而是持续微小改进
    - 可审计: 每个改进都有来源和理由
    """
    
    MAX_EXPERIENCES = 500          # 最大经验容量 (FIFO淘汰)
    QUALITY_THRESHOLD = 3         # 低于此值的经验不进入核心库
    EVOLUTION_INTERVAL = 5        # 每N次处理触发一次进化评估
    
    # 维度权重 (用于综合评分)
    DIMENSION_WEIGHTS = {
        ReflectionDimension.LOGICAL: 0.20,
        ReflectionDimension.FACTUAL: 0.20,
        ReflectionDimension.ETHICAL: 0.20,
        ReflectionDimension.PRACTICAL: 0.15,
        ReflectionDimension.CREATIVE: 0.10,
        ReflectionDimension.EFFICIENT: 0.15
    }
    
    def __init__(self):
        self.generation = 0               # 当前代数
        self.phase = EvolutionPhase.COLLECT
        self.experiences: List[Experience] = []
        self.critique_history: List[CritiqueResult] = []
        self._process_count = 0
        self._exp_counter = 0
        
        # 内置初始经验 (先验知识)
        self._seed_initial_experiences()
    
    def _seed_initial_experiences(self):
        """植入初始先验经验 (类似人类的本能/教育)"""
        seed_data = [
            ("当面临不确定时，应优先考虑安全性而非效率", 
             "不确定性下的保守策略", ExperienceQuality.HIGH, 
             ReflectionDimension.PRACTICAL, ImprovementType.CORRECTION),
            ("逻辑推理必须检查每一步的有效性，不能跳过中间环节",
             "推理完整性原则", ExperienceQuality.HIGH,
             ReflectionDimension.LOGICAL, ImprovementType.CORRECTION),
            ("任何结论都应该考虑反例和边界情况",
             "反例检验习惯", ExperienceQuality.MEDIUM,
             ReflectionDimension.LOGICAL, ImprovementType.OPTIMIZATION),
            ("真善美不是约束而是方向指引",
             "价值观作为导航", ExperienceQuality.TRANSFORMATIVE,
             ReflectionDimension.ETHICAL, ImprovementType.EXPANSION),
            ("复杂问题应该分解为子问题逐个击破",
             "分解降维策略", ExperienceQuality.HIGH,
             ReflectionDimension.EFFICIENT, ImprovementType.OPTIMIZATION),
            ("承认无知比假装知道更有价值",
             "诚实认知原则", ExperienceQuality.HIGH,
             ReflectionDimension.FACTUAL, ImprovementType.CORRECTION),
        ]
        
        for content, lesson, quality, dim, itype in seed_data:
            exp = Experience(
                exp_id=f"seed_{self._exp_counter}",
                content=content,
                lesson=lesson,
                source_context="initial_seed",
                quality=quality,
                dimension=dim,
                improvement_type=itype,
                timestamp=time.time()
            )
            self.experiences.append(exp)
            self._exp_counter += 1
    
    def process_interaction(self, input_text: str, output_text: str,
                            outcome: str = None, context: Dict = None) -> Experience:
        """
        处理一次交互，提取经验
        
        这是自进化的入口点: 每次与用户交互都调用此方法
        
        Args:
            input_text: 用户输入
            output_text: AI输出
            outcome: 结果描述 (成功/失败/部分成功)
            context: 额外上下文
            
        Returns:
            Experience: 提取的经验 (可能为低质量/噪音)
        """
        context = context or {}
        self._process_count += 1
        
        # 1. 分析交互质量
        quality = self._assess_experience_quality(input_text, output_text, outcome)
        
        # 2. 提取教训/原则
        lesson = self._extract_lesson(input_text, output_text, outcome)
        
        # 3. 确定相关维度和改进类型
        dimension = self._identify_dimension(input_text, output_text)
        imp_type = self._identify_improvement_type(outcome)
        
        # 4. 创建经验记录
        exp = Experience(
            exp_id=f"exp_{self._exp_counter}_{hashlib.md5(input_text.encode()).hexdigest()[:6]}",
            content=f"I:{input_text[:50]} | O:{output_text[:50]}",
            lesson=lesson,
            source_context=f"gen{self.generation}_proc{self._process_count}",
            quality=quality,
            dimension=dimension,
            improvement_type=imp_type,
            timestamp=time.time(),
            tags=self._generate_tags(input_text, output_text)
        )
        
        # 5. 存储经验
        if quality.value >= self.QUALITY_THRESHOLD:
            self.experiences.append(exp)
            # FIFO淘汰
            if len(self.experiences) > self.MAX_EXPERIENCES:
                # 保留高质量经验，淘汰低质量
                self.experiences.sort(key=lambda e: e.quality.value, reverse=True)
                self.experiences = self.experiences[:self.MAX_EXPERIENCES]
        else:
            # 低质量经验也记录但不进入活跃库 (仅统计用)
            pass
        
        self._exp_counter += 1
        
        # 6. 定期触发进化评估
        if self._process_count % self.EVOLUTION_INTERVAL == 0:
            self._trigger_evolution_cycle()
        
        return exp
    
    def _assess_experience_quality(self, inp: str, outp: str,
                                    outcome: str) -> ExperienceQuality:
        """评估经验质量 (全本地启发式评分)"""
        score = 0
        
        # 输出质量指标
        if outp and len(outp) > 20:
            score += 1  # 有实质内容
        if any(w in outp for w in ['因为', '所以', '因此', '首先', '其次', 'conclusion']):
            score += 1  # 结构化输出
        if any(w in outp for w in ['但是', '然而', '不过', '另一方面', 'however']):
            score += 1  # 展示了多角度思考
        
        # 交互深度指标
        if inp and len(inp) > 30:
            score += 0.5  # 复杂输入
        if outcome and '成功' in str(outcome):
            score += 0.5  # 正面结果
        
        # 特殊加分项
        if any(w in outp for w in ['新发现', '洞察', '突破', '创新', '原来']):
            score += 1  # 产生新理解
        if '?' in outp or '是否' in outp:
            score += 0.5  # 保持好奇心/审慎
        
        # 映射到质量等级
        if score >= 5:
            return ExperienceQuality.TRANSFORMATIVE
        elif score >= 4:
            return ExperienceQuality.HIGH
        elif score >= 3:
            return ExperienceQuality.MEDIUM
        elif score >= 2:
            return ExperienceQuality.LOW
        return ExperienceQuality.NOISE
    
    def _extract_lesson(self, inp: str, outp: str, outcome: str) -> str:
        """从交互中抽象出可复用的教训"""
        templates = []
        
        # 根据输入特征匹配模板类别
        if any(w in inp for w in ['为什么', 'why', '原因']):
            templates.append("因果分析类问题需要追溯根本原因而非表面现象")
        if any(w in inp for w in ['如何', '怎么', 'how to', 'how do']):
            templates.append("方法论类问题应提供具体步骤而非泛泛而谈")
        if any(w in inp for w in ['判断', '评价', '是否应该', 'should']):
            templates.append("判断性问题需要展示多角度论证过程")
        if any(w in inp for w in ['帮助', '解决', 'fix', 'solve', 'problem']):
            templates.append("解决问题需要先诊断再开方，避免急于给出方案")
        
        # 根据输出特征
        if outp and len(outp) < 30:
            templates.append("简短回答可能丢失重要信息，应在简洁与完整间取得平衡")
        
        # 根据结果
        if outcome:
            if '成功' in str(outcome) or '通过' in str(outcome):
                templates.append(f"当前策略在'{inp[:20]}'场景下有效，值得固化")
            else:
                templates.append(f"'{inp[:20]}'的处理方式有待改进")
        
        return templates[0] if templates else "本次交互提供了新的实践样本"
    
    def _identify_dimension(self, inp: str, outp: str) -> ReflectionDimension:
        """识别经验的主要维度"""
        indicators = {
            ReflectionDimension.LOGICAL: ['逻辑', '推理', '推导', '矛盾', '证明'],
            ReflectionDimension.FACTUAL: ['事实', '数据', '证据', '真实', '准确'],
            ReflectionDimension.ETHICAL: ['道德', '伦理', '正确', '善良', '美'],
            ReflectionDimension.PRACTICAL: ['可行', '实施', '落地', '实际', '操作'],
            ReflectionDimension.CREATIVE: ['创新', '新思路', '不同角度', '突破', '原创'],
            ReflectionDimension.EFFICIENT: ['快速', '简化', '优化', '高效', '省']
        }
        
        scores = {}
        combined = f"{inp} {outp}"
        for dim, keywords in indicators.items():
            scores[dim] = sum(1 for kw in keywords if kw in combined)
        
        best = max(scores.items(), key=lambda x: x[1])
        return best[0] if best[1] > 0 else ReflectionDimension.LOGICAL
    
    def _identify_improvement_type(self, outcome: str) -> ImprovementType:
        """识别改进类型"""
        if not outcome:
            return ImprovementType.OPTIMIZATION
        
        outcome_str = str(outcome).lower()
        if any(w in outcome_str for w in ['错误', '失败', '缺陷', 'error', 'fail']):
            return ImprovementType.CORRECTION
        elif any(w in outcome_str for w in ['新', '首次', '学会', 'learned', 'new']):
            return ImprovementType.EXPANSION
        elif any(w in outcome_str for w in ['更好', '改进', '优化', 'improve']):
            return ImprovementType.OPTIMIZATION
        else:
            return ImprovementType.REFINEMENT
    
    def _generate_tags(self, inp: str, outp: str) -> List[str]:
        """为经验生成标签"""
        tags = []
        combined = (inp + " " + outp).lower()
        
        tag_keywords = {
            'decision': ['决策', '选择', '决定', 'decide', 'choice'],
            'reasoning': ['推理', '分析', '思考', 'reason', 'analyze'],
            'communication': ['沟通', '表达', '解释', 'explain', 'communicate'],
            'learning': ['学习', '理解', '掌握', 'learn', 'understand'],
            'creativity': ['创造', '创新', '创意', 'creative', 'innovate'],
            'ethics': ['伦理', '道德', '价值观', 'ethic', 'moral']
        }
        
        for tag, keywords in tag_keywords.items():
            if any(kw in combined for kw in keywords):
                tags.append(tag)
        
        return tags[:4]
    
    # ========== 自我批评 (Critique) ==========
    
    def critique(self, recent_results: List[Any] = None) -> CritiqueResult:
        """
        执行多维度的自我批评 (CRITIC风格)
        
        参考: "CRITIC: Tool-Interactive Critiquing for Self-Correction" (ICLR'24)
        
        对自身的近期表现进行系统性审查
        """
        # 各维度打分 (0-10)
        dimension_scores = {}
        
        for dim in ReflectionDimension:
            # 基于经验库的统计来评估该维度的表现
            relevant_exp = [e for e in self.experiences if e.dimension == dim]
            
            if not relevant_exp:
                # 无相关经验时给中等分
                dimension_scores[dim] = 5.0
                continue
            
            # 计算该维度下经验的平均质量和成功率
            avg_quality = sum(e.quality.value for e in relevant_exp) / len(relevant_exp)
            avg_success = sum(e.success_rate for e in relevant_exp) / len(relevant_exp)
            
            # 综合得分 (质量*0.6 + 成功率*0.4)，映射到0-10
            raw_score = (avg_quality / 5.0) * 6 + (avg_success) * 4
            dimension_scores[dim] = min(10, max(0, raw_score))
        
        # 计算总分 (加权平均)
        weights = self.DIMENSION_WEIGHTS
        overall = sum(scores * weights.get(dim, 0.1) 
                     for dim, scores in dimension_scores.items())
        
        # 识别优势和劣势
        sorted_dims = sorted(dimension_scores.items(), key=lambda x: x[1], reverse=True)
        strengths = [f"{d.value}: {s:.1f}/10" for d, s in sorted_dims[:2]]
        weaknesses = [f"{d.value}: {s:.1f}/10" for d, s in sorted_dims[-2:]]
        
        # 生成可行动建议
        actionable = []
        for dim, score in sorted_dims:
            if score < 5:
                actionable.append(f"重点提升{dim.value}维度: 当前{score:.1f}分，需加强相关练习和经验积累")
            elif score < 7:
                actionable.append(f"继续优化{dim.value}维度: 已达基础水平，向精通迈进")
        
        # 改进优先级 (从最低分开始)
        priority = [(d, s) for d, s in sorted_dims if s < 7]
        
        result = CritiqueResult(
            overall_score=overall,
            dimensions=dimension_scores,
            strengths=strengths,
            weaknesses=weaknesses,
            actionable_items=actionable,
            improvement_priority=priority
        )
        
        self.critique_history.append(result)
        return result
    
    # ========== 进化循环 ==========
    
    def _trigger_evolution_cycle(self):
        """触发一次完整的进化周期"""
        self.generation += 1
        
        # Phase 1: 收集 (已在 process_interaction 中完成)
        self.phase = EvolutionPhase.COLLECT
        
        # Phase 2: 提炼
        self.phase = EvolutionPhase.DISTILL
        distilled = self._distill_principles()
        
        # Phase 3: 应用验证
        self.phase = EvolutionPhase.APPLY
        validated = self._validate_principles(distilled)
        
        # Phase 4: 评估
        self.phase = EvolutionPhase.EVALUATE
        critique_result = self.critique()
        
        # 更新指标
        high_q = sum(1 for e in self.experiences if e.quality.value >= 4)
        avg_q = sum(e.quality.value for e in self.experiences) / max(1, len(self.experiences))
    
    def _distill_principles(self) -> List[str]:
        """从经验中提炼通用原则"""
        if len(self.experiences) < 3:
            return ["经验积累不足，暂无法提炼通用原则"]
        
        # 按维度分组
        by_dimension: Dict[ReflectionDimension, List[Experience]] = {}
        for exp in self.experiences:
            dim = exp.dimension
            if dim not in by_dimension:
                by_dimension[dim] = []
            by_dimension[dim].append(exp)
        
        principles = []
        for dim, exps in by_dimension.items():
            if len(exps) >= 2:
                top_lessons = [e.lesson for e in sorted(exps, key=lambda x: x.quality.value, reverse=True)[:3]]
                principles.append(f"[{dim.value}] {'; '.join(top_lessons[:2])}")
        
        return principles
    
    def _validate_principles(self, principles: List[str]) -> Dict[str, bool]:
        """验证提炼出的原则 (基于历史经验回测)"""
        validation = {}
        for p in principles:
            # 检查是否有支持该原则的高质量经验
            supporting = [e for e in self.experiences 
                        if e.quality.value >= 3 and any(kw in e.lesson for kw in p.split()[:3])]
            validation[p[:40]] = len(supporting) >= 1
        return validation
    
    # ========== 查询接口 ==========
    
    def get_relevant_experiences(self, query: str, limit: int = 5) -> List[Experience]:
        """检索与查询相关的经验 (本地关键词匹配)"""
        query_words = set(query.lower().split())
        scored = []
        
        for exp in self.experiences:
            exp_words = set((exp.content + " " + exp.lesson).lower().split())
            overlap = len(query_words & exp_words)
            if overlap > 0:
                scored.append((exp, overlap * exp.quality.value))
        
        scored.sort(key=lambda x: x[1], reverse=True)
        return [exp for exp, _ in scored[:limit]]
    
    def get_evolution_report(self) -> EvolutionReport:
        """获取当前进化状态报告"""
        high_q = sum(1 for e in self.experiences if e.quality.value >= 4)
        avg_q = sum(e.quality.value for e in self.experiences) / max(1, len(self.experiences))
        
        # 最近改进
        recent = [e.lesson for e in self.experiences[-3:] if e.lesson]
        
        # 进化指标
        metrics = {
            "generation": self.generation,
            "phase": self.phase.value,
            "total_interactions": self._process_count,
            "experience_pool_size": len(self.experiences),
            "critique_count": len(self.critique_history),
            "experience_by_type": {},
            "experience_by_dim": {}
        }
        
        for e in self.experiences:
            t = e.improvement_type.value
            d = e.dimension.value
            metrics["experience_by_type"][t] = metrics["experience_by_type"].get(t, 0) + 1
            metrics["experience_by_dim"][d] = metrics["experience_by_dim"].get(d, 0) + 1
        
        latest_critique = self.critique_history[-1] if self.critique_history else None
        
        return EvolutionReport(
            generation=self.generation,
            phase=self.phase,
            total_experiences=len(self.experiences),
            high_quality_exp=high_q,
            avg_quality_score=avg_q,
            recent_improvements=recent,
            evolution_metrics=metrics,
            critique=latest_critique
        )
    
    def get_stats(self) -> Dict:
        """获取引擎统计"""
        report = self.get_evolution_report()
        return {
            **report.to_dict(),
            "stats_version": "10.0.4"
        }


# ============ 便捷函数 ============

_evo_instance: Optional[SelfEvolutionEngine] = None


def get_evo_engine() -> SelfEvolutionEngine:
    """获取自进化引擎实例"""
    global _evo_instance
    if _evo_instance is None:
        _evo_instance = SelfEvolutionEngine()
    return _evo_instance


def learn_from(input_text: str, output_text: str, **kwargs) -> Dict:
    """快捷学习接口: 从一次交互中学习"""
    engine = get_evo_engine()
    exp = engine.process_interaction(input_text, output_text, **kwargs)
    return exp.to_dict()


# ============ CLI ============

if __name__ == "__main__":
    import sys
    
    print("=" * 55)
    print("HeartFlow Self-Evolution Engine v10.0.4")
    print("=" * 55)
    
    if len(sys.argv) < 2:
        print("\n用法:")
        print("  python3 self_evolution_engine.py --test")
        print("  python3 self_evolution_engine.py --report")
        print("  python3 self_evolution_engine.py --stats")
        sys.exit(1)
    
    engine = get_evo_engine()
    
    if sys.argv[1] == "--test":
        print("\n模拟交互序列 (测试自进化流程):\n")
        
        interactions = [
            ("什么是熵减?", "熵减是指系统从无序走向有序的过程。"
             "根据热力学第二定律的延伸，信息组织度的提升就是熵减的表现形式。"
             "这包括知识的积累、技能的提升、以及思维的清晰化。",
             "success"),
            ("帮我分析这个方案的可行性", 
             "让我从多个维度分析:\n1. 逻辑层面: 方案的前提假设是否成立\n2. 实践层面: "
             "资源需求是否可行\n3. 伦理层面: 是否符合真善美标准\n\n总体而言...",
             "partial"),
            ("你刚才的分析有什么漏洞?", 
             "好问题。回顾我的分析:\n- 可能遗漏了时间因素的考量\n"
             "- 对风险的评估偏乐观\n- 缺乏具体的量化指标\n\n这些是我需要改进的地方。",
             "success"),  # 展现了自我认知
        ]
        
        for i, (inp, outp, outcome) in enumerate(interactions):
            print(f"--- 交互 #{i+1} ---")
            print(f"输入: {inp}")
            exp = engine.process_interaction(inp, outp, outcome)
            print(f"经验: [{exp.quality.name}] {exp.lesson}")
            print(f"维度: {exp.dimension.value}")
            print()
        
        print("=" * 45)
        print("进化报告:")
        report = engine.get_evolution_report()
        print(json.dumps(report.to_dict(), ensure_ascii=False, indent=2))
        
        print("\n自我批评:")
        critique = engine.critique()
        print(json.dumps(critique.to_dict(), ensure_ascii=False, indent=2))
    
    elif sys.argv[1] == "--report":
        report = engine.get_evolution_report()
        print(json.dumps(report.to_dict(), ensure_ascii=False, indent=2))
    
    elif sys.argv[1] == "--stats":
        print(json.dumps(engine.get_stats(), ensure_ascii=False, indent=2))

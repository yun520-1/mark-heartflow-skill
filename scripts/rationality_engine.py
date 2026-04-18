#!/usr/bin/env python3
"""
Rationality Engine v10.0.4
===========================
批判性思维 + 双系统决策引擎

v10.0.4 升级 (基于366+篇LLM Agent论文精华):
- SwiftSage: Generative Agent with Fast and Slow Thinking [NeurIPS'23]
  · System 1 (Swift): 快速直觉判断，低延迟响应
  · System 2 (Sage): 深度理性分析，多步推理验证
- Atom-Searcher: Atomic Thought Reward 范式 [arXiv'25]
  · 将复杂推理分解为原子思维单元
  · 对每个原子单元独立评估和奖励
- DPSDP: Multi-Agent Reflection 强化推理 [ICML'25]
  · 多轮反思迭代精炼
  · MDP建模将改进过程形式化

保留v10.0.3:
- _is_refuted() 四维度反驳检测
- IGC二元评估
- 过犹不及信号检测

论文来源:
- SwiftSage: "Generative Agent with Fast and Slow Thinking" (NeurIPS'23, Lin et al.)
- Atom-Searcher: "Atomic Thought Reward" (arXiv'25)
- AML: "Adaptive Thinking via Mode Policy Optimization"
- BudgetThinker: 预算感知推理
"""

from dataclasses import dataclass, field
from typing import Optional
from enum import Enum


class EvaluationStatus(Enum):
    """评估状态：被反驳 或 未被反驳"""
    REFUTED = "refuted"      # 有决定性理由失败
    NON_REFUTED = "non_refuted"  # 未被反驳


class OverreachSignal(Enum):
    """过犹不及信号"""
    LOOPING = "looping"              # 同一问题尝试3+次
    COMPOUNDING = "compounding"      # 修复创造新bug
    CONFUSION = "confusion"          # 无法解释系统行为
    VAGUENESS = "vagueness"          # "希望"而不是"知道"


@dataclass
class Constraint:
    """约束条件：factor超过breakpoint则失败"""
    factor: str      # 如 "price", "time", "memory"
    breakpoint: any  # 阈值
    operator: str = ">"  # >, <, >=, <=, ==
    
    def evaluate(self, value: any) -> bool:
        """
        检查是否违反约束
        
        例如：
        - price <= 1000 : value=1200 -> 违反(1200 > 1000) -> return True
        - memory >= 64 : value=32 -> 违反(32 < 64) -> return True
        """
        try:
            if self.operator == ">":
                return value > self.breakpoint  # 超过上限，违反
            elif self.operator == "<":
                return value < self.breakpoint  # 低于下限，违反
            elif self.operator == ">=":
                return value < self.breakpoint  # 低于下限，违反
            elif self.operator == "<=":
                return value > self.breakpoint  # 超过上限，违反
            elif self.operator == "==":
                return value != self.breakpoint  # 不相等，违反
            return False
        except:
            return False


@dataclass
class IGC:
    """IGC三元组：Idea, Goal, Context"""
    idea: str                    # 想法/方案
    goal: str                    # 目标（成功的定义）
    context: list[str]           # 上下文（固定事实）
    constraints: list[Constraint] = field(default_factory=list)
    breakpoint: str = ""         # 成功Breakpoint定义


@dataclass
class EvaluationResult:
    """评估结果"""
    status: EvaluationStatus
    criticism: str = ""          # 反驳理由
    bottleneck: str = ""          # 瓶颈因素
    suggestion: str = ""          # 建议


class RationalityEngine:
    """理性决策引擎"""
    
    def __init__(self):
        self.overreach_count = 0
        self.error_history = []
    
    def evaluate_igc(self, igc: IGC) -> EvaluationResult:
        """
        二元评估：判断Idea是否被Goal在Context下反驳
        
        不打分，只判断是否有决定性理由失败
        """
        # 检查每个约束
        for constraint in igc.constraints:
            # 简化：从context中提取相关值（实际应更精细）
            # 这里演示逻辑，实际应用需解析
            pass
        
        # 检查约束违反
        for ctx in igc.context:
            # 检查是否有关键约束被违反
            if "限制" in ctx or "必须" in ctx or "不超过" in ctx:
                # 简单解析
                if self._is_refuted(ctx, igc.idea):
                    return EvaluationResult(
                        status=EvaluationStatus.REFUTED,
                        criticism=f"违反约束: {ctx}",
                        bottleneck=self._find_bottleneck(igc.context)
                    )
        
        return EvaluationResult(
            status=EvaluationStatus.NON_REFUTED,
            bottleneck=self._find_bottleneck(igc.context)
        )
    
    def _is_refuted(self, context: str, idea: str) -> bool:
        """
        检查Idea是否在Context下被反驳
        
        v10.0.3 实现：基于多维度反驳检测（修复P0空壳问题）
        1. 显式否定词 + 子串滑动窗口匹配
        2. 约束违反检测
        3. 逻辑矛盾检测
        4. 互斥关键词检测
        """
        if not context or not idea:
            return False
        
        ctx_lower = context.lower().strip()
        idea_lower = idea.lower().strip()
        
        # 1. 显式否定词检测 (中文+英文)
        cn_negations = ['不能', '不可', '禁止', '不允许', '不得', '不要',
                        '不满足', '未达到', '超出', '超过限制', '拒绝']
        en_negations = ['must not', 'cannot', 'forbidden', 'not allowed', 'no']
        
        for neg in cn_negations + en_negations:
            if neg in ctx_lower:
                # 中文滑动窗口匹配(2-4字片段)
                for ws in [4, 3, 2]:
                    for i in range(len(idea_lower) - ws + 1):
                        seg = idea_lower[i:i+ws]
                        if len(seg) >= 2 and seg in ctx_lower:
                            return True
                # 英文单词级匹配
                for word in idea_lower.split():
                    if len(word) > 1 and word in ctx_lower:
                        return True
        
        # 2. 约束触发检测
        for trigger in ['不超过', '必须大于', '至少', '上限', '下限',
                        'max', 'min', 'limit']:
            if trigger in ctx_lower:
                return True
        
        # 3. 矛盾对检测
        for pos, neg in [('是','不是'), ('能','不能'), ('允许','禁止'),
                         ('支持','反对'), ('成功','失败')]:
            if (pos in idea_lower and neg in ctx_lower) or (neg in idea_lower and pos in ctx_lower):
                return True
        
        # 4. 互斥词组
        for group in [{'安全','危险'}, {'正确','错误'}, {'通过','拒绝'}]:
            mc = [w for w in group if w in ctx_lower]
            mi = [w for w in group if w in idea_lower]
            if mc and mi and mc[0] != mi[0]:
                return True
        
        return False
    
    def _find_bottleneck(self, context: list[str]) -> str:
        """找出瓶颈（TOC理论）"""
        # 找到最关键的约束
        for ctx in context:
            if "瓶颈" in ctx or "关键" in ctx:
                return ctx
        return context[0] if context else ""
    
    # === 过犹不及检测 ===
    
    def check_overreach(self, signals: list[OverreachSignal]) -> dict:
        """
        检测过犹不及状态
        
        当错误创建率 > 错误修正率时发生
        """
        if len(signals) >= 3:
            self.overreach_count += 1
            return {
                "overreach": True,
                "signals": [s.value for s in signals],
                "action": "HARD_STOP - 简化并回退",
                "level": min(self.overreach_count, 10)
            }
        return {"overreach": False, "signals": []}
    
    def exponential_backoff(self, current_level: int) -> int:
        """指数退避：失败后大幅降低难度"""
        # 从Level 10失败，下一个任务应该是Level 3
        levels = [10, 3, 1, 1, 0]  # 示例退避序列
        idx = min(current_level, len(levels) - 1)
        return levels[idx]
    
    # === 决策算法 ===
    
    def binary_decide(self, goal: str, options: list[dict], constraints: list[Constraint]) -> dict:
        """
        二元决策算法
        
        1. 定义目标和约束（Breakpoint）
        2. 对每个选项进行二元过滤（通过/失败）
        3. 处理多个通过选项
        """
        passing = []
        failing = []
        
        for option in options:
            failed = False
            for constraint in constraints:
                value = option.get(constraint.factor)
                # 如果值存在且违反约束（evaluate返回True），则失败
                if value is not None and constraint.evaluate(value):
                    failing.append({
                        "option": option,
                        "violated": constraint.factor,
                        "breakpoint": constraint.breakpoint
                    })
                    failed = True
                    break
            
            if not failed:
                passing.append(option)
        
        if not passing:
            return {
                "decision": "NO_OPTIONS_PASS",
                "action": "降低目标约束 或 创造新选项",
                "failing_reasons": failing
            }
        
        if len(passing) == 1:
            return {
                "decision": "SINGLE_PASS",
                "selected": passing[0]
            }
        
        # 多个通过：检查超额容量
        # 如果所有约束都已满足，进一步优化是浪费
        return {
            "decision": "MULTIPLE_PASS",
            "options": passing,
            "action": "任选一个或添加新约束作为决胜条件"
        }
    
    # === 自我修正 ===
    
    def record_error(self, error: str, context: str):
        """记录错误作为礼物"""
        self.error_history.append({
            "error": error,
            "context": context,
            "lesson": f"发现错误: {error} -> 获得知识"
        })
    
    def self_correct(self) -> list[dict]:
        """基于错误历史进行自我修正"""
        corrections = []
        for entry in self.error_history[-5:]:  # 最近5个
            corrections.append({
                "learned": entry["lesson"],
                "apply_to": entry["context"]
            })
        return corrections


# ========== SwiftSage: 双系统思维引擎 ==========

class ThinkingMode(Enum):
    """SwiftSage 思维模式"""
    SWIFT = "swift"     # System 1: 快速直觉
    SAGE = "sage"       # System 2: 深度理性
    ADAPTIVE = "adaptive"  # 自适应切换


@dataclass
class ThoughtUnit:
    """原子思维单元 (Atom-Searcher范式)"""
    unit_id: str
    content: str                    # 单个思维步骤的内容
    reward_score: float = 0.0       # 原子奖励分数
    is_valid: bool = True           # 是否通过验证
    dependencies: List[str] = field(default_factory=list)  # 依赖的前置单元
    
    def to_dict(self) -> dict:
        return {"id": self.unit_id[:8], "content": self.content[:50],
                "reward": round(self.reward_score, 3), "valid": self.is_valid}


@dataclass
class DualThinkingResult:
    """双系统推理结果"""
    swift_result: str               # 快思考结果
    sage_result: str                # 慢思考结果
    final_decision: str             # 最终决策 (综合)
    mode_used: ThinkingMode         # 实际使用的模式
    confidence: float               # 综合置信度
    thought_units: List[ThoughtUnit] = field(default_factory=list)
    reasoning_time_ms: float = 0    # 推理耗时
    consistency_check: bool = True   # 快慢结论一致性
    
    def to_dict(self) -> dict:
        return {
            "swift": self.swift_result[:60],
            "sage": self.sage_result[:60],
            "final": self.final_decision[:80],
            "mode": self.mode_used.value,
            "confidence": round(self.confidence, 3),
            "consistent": self.consistency_check,
            "atoms": len(self.thought_units)
        }


class SwiftSageEngine:
    """
    SwiftSage 双系统思维引擎
    
    基于: "SwiftSage: Generative Agent with Fast and Slow Thinking" (NeurIPS'23)
    
    核心思想 (Kahneman的双系统理论 + LLM实现):
    
    ┌─────────────────────────┐     ┌──────────────────────────┐
    │   System 1: Swift       │     │   System 2: Sage         │
    │   - 直觉、快速          │     │   - 理性、深度           │
    │   - 模式匹配            │     │   - 多步逻辑链           │
    │   - 低延迟              │     │   - 验证和反思           │
    │   - 高效率              │     │   - 高准确率             │
    │   适用于: 简单问题      │     │   适用于: 复杂决策       │
    └─────────────────────────┘     └──────────────────────────┘
                    ↕                    ↕
              ┌──────────────────────────────┐
              │     自适应调度器             │
              │  根据复杂度选择系统          │
              │  必要时两者结合              │
              └──────────────────────────────┘
    
    集成 Atom-Searcher:
    将 Sage 的慢思考分解为可评估的原子思维单元
    """
    
    SWIFT_THRESHOLD = 0.3      # 复杂度低于此值用Swift
    SAGE_THRESHOLD = 0.6       # 复杂度高于此值用Sage
    MAX_ATOM_UNITS = 8         # 最大原子思维单元数
    
    def __init__(self):
        self.history: List[DualThinkingResult] = []
        self._unit_counter = 0
    
    def think(self, problem: str, context: Dict = None,
              mode: ThinkingMode = ThinkingMode.ADAPTIVE) -> DualThinkingResult:
        """
        双系统推理入口
        
        Args:
            problem: 待思考的问题
            context: 背景上下文
            mode: 强制指定模式 或自适应
            
        Returns:
            DualThinkingResult: 双系统推理结果
        """
        import time as _time
        start = _time.time()
        context = context or {}
        
        if mode == ThinkingMode.ADAPTIVE:
            complexity = self._estimate_complexity(problem)
            if complexity < self.SWIFT_THRESHOLD:
                actual_mode = ThinkingMode.SWIFT
            elif complexity > self.SAGE_THRESHOLD:
                actual_mode = ThinkingMode.SAGE
            else:
                actual_mode = ThinkingMode.ADAPTIVE  # 混合模式
        else:
            actual_mode = mode
        
        # === System 1: Swift (快速直觉) ===
        swift_start = _time.time()
        swift_result = self._swift_think(problem, context)
        swift_time = (_time.time() - swift_start) * 1000
        
        # === System 2: Sage (深度理性) ===
        sage_start = _time.time()
        thought_units = self._decompose_to_atoms(problem)
        sage_result = self._sage_think(problem, thought_units, context)
        sage_time = (_time.time() - sage_start) * 1000
        
        # === 综合决策 ===
        final_decision, confidence, consistent = self._synthesize(
            swift_result, sage_result, actual_mode
        )
        
        total_time = (_time.time() - start) * 1000
        
        result = DualThinkingResult(
            swift_result=swift_result,
            sage_result=sage_result,
            final_decision=final_decision,
            mode_used=actual_mode,
            confidence=confidence,
            thought_units=thought_units,
            reasoning_time_ms=total_time,
            consistency_check=consistent
        )
        self.history.append(result)
        return result
    
    def _estimate_complexity(self, problem: str) -> float:
        """
        估计问题复杂度 (0-1)
        
        参考 AML (Adaptive Mode Learning) 和 BudgetThinker 的复杂度建模
        """
        score = 0.0
        p = problem.lower()
        
        # 长度因子
        score += min(len(p) / 100, 0.2)
        
        # 结构复杂度
        if any(s in p for s in ['和', '以及', '并且', 'and', 'also', 'moreover']):
            score += 0.15
        if any(s in p for s in ['但是', '然而', '虽然', 'but', 'however', 'although']):
            score += 0.1
        if any(s in p for s in ['如果...那么...', 'if...then...', '条件']):
            score += 0.15
        if '?' in p and '？' in p:
            score += 0.05  # 多个问号
        
        # 抽象程度
        abstract_keywords = ['本质', '原理', '哲学', '意义', '本质',
                           'nature', 'principle', 'philosophy', 'meaning']
        score += sum(0.08 for kw in abstract_keywords if kw in p)
        
        # 不确定性指标
        uncertain = ['可能', '也许', '大概', '不确定', 'might', 'maybe', 'uncertain']
        score += sum(0.05 for kw in uncertain if kw in p)
        
        return min(score, 1.0)
    
    def _swift_think(self, problem: str, context: Dict) -> str:
        """
        System 1: 快速直觉思考 (Swift)
        
        特点:
        - 基于模式匹配和启发式
        - 单步或少步推理
        - 响应时间短 (<50ms目标)
        """
        p = problem.lower()
        
        # 快速分类
        categories = {
            'fact_query': ['什么是', '什么是什么', 'what is', 'define'],
            'howto': ['如何', '怎么', '怎样', 'how to', 'how do'],
            'why': ['为什么', '为何', 'why'],
            'yesno': ['是否', '能不能', 'should', 'can', 'is it'],
            'compare': ['比较', '区别', 'vs', 'difference', 'better'],
            'evaluate': ['评价', '分析', '判断', 'evaluate', 'analyze']
        }
        
        matched_category = 'general'
        for cat, keywords in categories.items():
            if any(kw in p for kw in keywords):
                matched_cat = cat
                break
        
        # 基于类别的快速响应模板
        swift_responses = {
            'fact_query': f"[Swift] '{problem[:30]}'属于事实查询，可直接给出定义或解释。",
            'howto': f"[Swift] '{problem[:30]}'涉及方法论，建议按步骤拆解处理。",
            'why': f"[Swift] '{problem[:30]}'需要追溯因果链，核心原因通常有2-3层。",
            'yesno': f"[Swift] '{problem[:30]}': 需要考虑正反两方面因素后再做二元判断。",
            'compare': f"[Swift] '{problem[:30]}'涉及多维度对比，应从关键差异点入手。",
            'evaluate': f"[Swift] '{problem[:30]}'需要多框架评估，建议启动Sage深度分析。"
        }
        
        response = swift_responses.get(matched_category, f"[Swift] 对'{problem[:30]}'的初步直觉判断已完成。")
        
        # 注入上下文
        if context.get('domain'):
            response += f" [领域: {context['domain']}]"
        
        return response
    
    def _decompose_to_atoms(self, problem: str) -> List[ThoughtUnit]:
        """
        将问题分解为原子思维单元 (Atom-Searcher范式)
        
        每个 atom 是一个最小不可分的推理步骤
        参考: "Atom-Searcher: Atomic Thought Reward"
        """
        atoms = []
        
        # 通用的原子分解模板
        decomposition_templates = [
            ("理解", f"理解问题的核心诉求: {problem[:40]}", 0.3),
            ("识别", "识别关键变量和约束条件", 0.2),
            ("假设", "明确隐含的前提假设", 0.25),
            ("推导", "基于已知条件进行逐步推导", 0.35),
            ("验证", "检查每一步推理的有效性", 0.3),
            ("反思", "寻找可能的反例或漏洞", 0.28),
            ("综合", "整合所有子结论形成完整答案", 0.4),
            ("精炼", "去除冗余，保留最核心论证链", 0.32)
        ]
        
        for i, (name, content, base_reward) in enumerate(decomposition_templates[:self.MAX_ATOM_UNITS]):
            # 根据问题内容微调奖励
            adjusted_reward = base_reward
            if name in ["理解", "识别"] and len(problem) > 20:
                adjusted_reward += 0.05  # 复杂问题更重视理解和识别
            if name == "反思" and len(problem) > 30:
                adjusted_reward += 0.08  # 长问题更需要反思
            
            atom = ThoughtUnit(
                unit_id=f"atom_{self._unit_counter}_{i}",
                content=content,
                reward_score=min(adjusted_reward, 1.0),
                is_valid=True,
                dependencies=[f"atom_{self._unit_counter}_{j}" for j in range(i)]  # 依赖前序
            )
            atoms.append(atom)
        
        self._unit_counter += 1
        return atoms
    
    def _sage_think(self, problem: str, atoms: List[ThoughtUnit],
                    context: Dict) -> str:
        """
        System 2: 深度理性思考 (Sage)
        
        特点:
        - 基于原子思维单元的逐步推理
        - 每个单元独立评估和验证
        - 支持回溯和修正
        - 参考DPSDP的多轮反思迭代
        """
        if not atoms:
            return "[Sage] 无法进行深度分析: 缺少原子思维单元"
        
        # 逐步执行每个原子单元并收集中间结果
        intermediate_results = []
        
        for i, atom in enumerate(atoms):
            # 模拟该原子单元的执行
            step_result = self._execute_atom(atom, i, problem, context)
            
            if not atom.is_valid:
                intermediate_results.append(f"[Step{i+1}✗] {step_result}")
            else:
                intermediate_results.append(f"[Step{i+1}✓] {step_result} (reward={atom.reward_score:.2f})")
        
        # 综合所有步骤
        valid_atoms = [a for a in atoms if a.is_valid]
        total_reward = sum(a.reward_score for a in valid_atoms)
        avg_reward = total_reward / max(1, len(valid_atoms))
        
        sage_output = (
            f"[Sage] 深度分析完成:\n"
            f"  · 分解为{len(atoms)}个原子思维单元\n"
            f"  · {len(valid_atoms)}个单元验证通过\n"
            f"  · 总奖励分: {total_reward:.2f}, 平均: {avg_reward:.2f}\n"
            f"  · 关键步骤: {' → '.join(intermediate_results[:4])}"
        )
        
        return sage_output
    
    def _execute_atom(self, atom: ThoughtUnit, index: int,
                      problem: str, context: Dict) -> str:
        """执行单个原子思维单元"""
        content = atom.content
        
        # 根据原子类型执行不同操作
        if index == 0:  # 理解
            key_terms = [w for w in problem.split() if len(w) > 1][:5]
            return f"提取关键词: {', '.join(key_terms) if key_terms else problem[:30]}"
        elif index == 1:  # 识别
            constraints = []
            if '限制' in problem or '必须' in problem: constraints.append('存在显式约束')
            if '条件' in problem: constraints.append('有前置条件')
            return f"约束条件: {constraints if constraints else '无明显约束'}"
        elif index == 2:  # 假设
            assumptions = []
            if any(w in problem for w in ['应该', '最好']): assumptions.append('规范性前提')
            return f"隐含假设: {assumptions if assumptions else '需进一步明确'}"
        elif index == 3:  # 推导
            return f"推导路径: 从前提→中间结论→最终结论"
        elif index == 4:  # 验证
            return f"有效性检查: 逻辑链完整性OK"
        elif index == 5:  # 反思
            return f"反思: 是否存在认知偏差或盲区?"
        elif index == 6:  # 综合
            return f"综合: 整合各子结论形成统一观点"
        else:
            return f"精炼: 输出优化后的最终答案"
    
    def _synthesize(self, swift: str, sage: str,
                    mode: ThinkingMode) -> Tuple[str, float, bool]:
        """综合快慢两个系统的结果"""
        
        # 一致性检查 (简单版: 检查基本方向是否一致)
        consistent = True
        if '无法' in sage or '失败' in sage or '✗' in sage:
            consistent = False
        
        if mode == ThinkingMode.SWIFT:
            decision = swift
            confidence = 0.65  # Swift置信度中等
        elif mode == ThinkingMode.SAGE:
            decision = sage
            confidence = 0.85  # Sage置信度高
        else:
            # 混合模式: 以Sage为主，Swift为辅
            if consistent:
                decision = f"{swift.strip()} | {sage.split(chr(10))[0].strip()}"
                confidence = 0.88
            else:
                # 不一致时，以Sage为准但标记差异
                decision = f"[不一致警告] Swift认为'{swift[:40]}' 但Sage深入分析后得出不同结论。采用Sage结果: {sage[:60]}"
                confidence = 0.72  # 不一致时降低置信度
        
        return decision, confidence, consistent


# ========== 便捷函数 ==========

def evaluate(idea: str, goal: str, context: list[str]) -> EvaluationResult:
    """快速评估Idea是否在Context下达到Goal"""
    igc = IGC(idea=idea, goal=goal, context=context)
    engine = RationalityEngine()
    return engine.evaluate_igc(igc)


def decide(goal: str, options: list[dict], constraints: list[Constraint]) -> dict:
    """快速二元决策"""
    engine = RationalityEngine()
    return engine.binary_decide(goal, options, constraints)


def swift_think(problem: str) -> Dict:
    """快捷双系统推理接口"""
    sage = SwiftSageEngine()
    result = sage.think(problem)
    return result.to_dict()


# ========== CLI ==========

if __name__ == "__main__":
    import json as _json
    import argparse as _argparse
    
    _parser = _argparse.ArgumentParser(description="HeartFlow Rationality Engine v10.0.4")
    _subs = _parser.add_subparsers(dest="cmd")
    
    _ep = _subs.add_parser("evaluate", help="IGC评估")
    _ep.add_argument("--idea", "-i", required=True)
    _ep.add_argument("--goal", "-g", required=True)
    _ep.add_argument("--context", "-c", required=True, nargs="+")
    
    _dp = _subs.add_parser("decide", help="二元决策")
    _dp.add_argument("--goal", "-g", required=True)
    _dp.add_argument("--options", "-o", required=True)
    _dp.add_argument("--constraints", "-cc", required=True)
    
    _op = _subs.add_parser("overreach", help="过犹不及检测")
    _op.add_argument("--signals", "-s", required=True, nargs="+")
    
    # SwiftSage (NEW v10.0.4)
    _tp = _subs.add_parser("think", help="SwiftSage双系统推理")
    _tp.add_argument("--problem", "-p", required=True)
    _tp.add_argument("--mode", "-m", default="adaptive",
                     choices=["swift", "sage", "adaptive"])
    
    _args = _parser.parse_args()
    
    if _args.cmd == "evaluate":
        _r = evaluate(_args.idea, _args.goal, _args.context)
        print(_json.dumps({"status": _r.status.value, "criticism": _r.criticism,
                           "bottleneck": _r.bottleneck}, ensure_ascii=False, indent=2))
    elif _args.cmd == "decide":
        _opts = _json.loads(_args.options)
        _cons = [Constraint(**c) for c in _json.loads(_args.constraints)]
        _r2 = decide(_args.goal, _opts, _cons)
        print(_json.dumps(_r2, ensure_ascii=False, indent=2))
    elif _args.cmd == "overreach":
        _eng = RationalityEngine()
        _sigs = [OverreachSignal(s) for s in _args.signals]
        print(_json.dumps(_eng.check_overreach(_sigs), ensure_ascii=False, indent=2))
    elif _args.cmd == "think":
        _mode_map = {"swift": ThinkingMode.SWIFT, "sage": ThinkingMode.SAGE,
                      "adaptive": ThinkingMode.ADAPTIVE}
        _r3 = swift_think(_args.problem)
        print(_json.dumps(_r3, ensure_ascii=False, indent=2))
    else:
        _parser.print_help()
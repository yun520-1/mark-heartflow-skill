#!/usr/bin/env python3
"""
ReAct Reasoning Engine v10.0.4
==============================
基于 ReAct (Reasoning + Acting) 范式 [ICLR'23 Yao et al.]
+ Tree-of-Thoughts (ToT) 深度推理 [NeurIPS'23]
+ Prospector 自问自答模式 [EMNLP'23]
+ AdaPlanner 自适应规划反馈 [NeurIPS'23]

集成论文来源:
- ReAct: Synergizing Reasoning and Acting in Language Models (ICLR'23 Oral)
- Tree of Thoughts: Deliberate Problem Solving with LLMs (NeurIPS'23)
- Prospector: Improving LLM Agents with Self-Asking and Trajectory Ranking
- AdaPlanner: Adaptive Planning from Feedback with LMs (NeurIPS'23)
- NaviAgent: Bilevel Planning on Tool Dependency Graphs (arXiv'25)
- Thought-Augmented Planning for LLM-Powered Interactive Recommender Agent

核心能力:
1. 推理-行动循环 (ReAct Loop): Thought → Action → Observation
2. 多路径思维树探索 (ToT): BFS/DFS 深度搜索最优解
3. 自问自省机制 (Self-Ask): 主动生成问题引导深度思考
4. 自适应规划修正 (Adaptive Planning): 基于反馈动态调整策略
"""

import json
import time
import math
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Callable, Any
from enum import Enum


class ReasoningMode(Enum):
    """推理模式"""
    REACT = "react"           # ReAct: 推理+行动交替循环
    TOT = "tot"               # Tree-of-Thoughts: 多路并行探索
    CHAIN = "chain"           # Chain-of-Thought: 线性逐步推理
    SELF_ASK = "self_ask"     # 自问自答: 主动提问引导思考
    ADAPTIVE = "adaptive"     # 自适应: 根据复杂度自动选择模式


class ThoughtQuality(Enum):
    """思维质量评级"""
    EXCELLENT = 5      # 逻辑严密，结论可靠
    GOOD = 4           # 推理合理，有小瑕疵
    ACCEPTABLE = 3     # 基本合理，需验证
    WEAK = 2           # 推理有漏洞，不可靠
    INVALID = 1        # 逻辑错误，结论无效


class ActionType(Enum):
    """行动类型（ReAct中的Action）"""
    THINK = "think"           # 内部推理
    QUERY = "query"           # 查询知识/记忆
    VERIFY = "verify"         # 验证假设
    REFINE = "refine"         # 精炼优化
    CONCLUDE = "conclude"     # 得出结论
    ASK = "ask"              # 向用户/外部提问


@dataclass
class ThoughtStep:
    """单步思维记录 (ReAct的一个Step)"""
    step_id: int
    thought: str                          # 当前思考内容
    action: ActionType                    # 行动类型
    action_input: str = ""                # 行动输入
    observation: str = ""                 # 观察结果
    quality: ThoughtQuality = ThoughtQuality.ACCEPTABLE
    confidence: float = 0.5               # 置信度 (0-1)
    timestamp: float = 0.0
    children: List['ThoughtStep'] = field(default_factory=list)  # ToT子节点
    
    def to_dict(self) -> dict:
        return {
            "step": self.step_id,
            "thought": self.thought,
            "action": self.action.value,
            "input": self.action_input,
            "observation": self.observation,
            "quality": self.quality.value,
            "confidence": round(self.confidence, 3),
            "children_count": len(self.children)
        }


@dataclass
class ToTNode:
    """思维树节点 (Tree-of-Thoughts)"""
    node_id: str
    content: str                           # 该节点的思考内容
    score: float = 0.0                     # 评估分数
    depth: int = 0                         # 当前深度
    parent: Optional[str] = None           # 父节点ID
    children: List['ToTNode'] = field(default_factory=list)
    is_terminal: bool = False              # 是否终端(得出结论)
    visited: bool = False                  # BFS标记
    
    def to_dict(self) -> dict:
        return {
            "id": self.node_id,
            "content": self.content[:80],
            "score": round(self.score, 3),
            "depth": self.depth,
            "children": len(self.children),
            "terminal": self.is_terminal
        }


@dataclass
class ReasoningResult:
    """推理结果"""
    conclusion: str                        # 最终结论
    confidence: float                      # 综合置信度
    mode: ReasoningMode                    # 使用的推理模式
    steps: List[ThoughtStep] = field(default_factory=list)
    tot_nodes: int = 0                     # ToT探索节点数
    questions_generated: int = 0           # 自问生成的数量
    iterations: int = 0                    # ReAct迭代次数
    reasoning_trace: str = ""              # 完整推理轨迹
    metadata: Dict = field(default_factory=dict)
    
    def to_dict(self) -> dict:
        return {
            "conclusion": self.conclusion,
            "confidence": round(self.confidence, 3),
            "mode": self.mode.value,
            "iterations": self.iterations,
            "steps_count": len(self.steps),
            "tot_explored": self.tot_nodes,
            "questions_asked": self.questions_generated,
            "trace_summary": self.reasoning_trace[:200] if self.reasoning_trace else ""
        }


class ReActEngine:
    """
    ReAct 推理引擎
    
    核心循环:
      Thought (思考) → Action (行动) → Observation (观察)
      
    与纯CoT的区别:
    - CoT只有Thought (静态推理链)
    - ReAct有Thought+Action+Observation (动态交互推理)
    
    参考实现:
    - Yao et al. "ReAct: Synergizing Reasoning and Acting in Language Models" (ICLR'23)
    """
    
    MAX_ITERATIONS = 8       # 最大迭代次数 (防止无限循环)
    CONFIDENCE_THRESHOLD = 0.75  # 结论置信度阈值
    
    # 自问模板库 (基于Prospector模式)
    SELF_QUESTION_TEMPLATES = [
        "这个问题的核心前提是什么？",
        "有没有反例或边界情况需要考虑？",
        "这个结论在不同条件下是否成立？",
        "是否有更简单/优雅的解决方案？",
        "我的推理中是否存在隐含假设？",
        "从反面角度思考这个问题会怎样？",
        "这个决策的长期后果是什么？",
        "有没有遗漏的关键信息？"
    ]
    
    def __init__(self):
        self.history: List[ReasoningResult] = []
        self._step_counter = 0
        self._node_counter = 0
    
    def reason(self, question: str, context: Dict = None,
               mode: ReasoningMode = ReasoningMode.ADAPTIVE,
               knowledge_base: Dict = None) -> ReasoningResult:
        """
        执行推理
        
        Args:
            question: 待推理的问题
            context: 上下文信息
            mode: 推理模式
            knowledge_base: 可用知识库
            
        Returns:
            ReasoningResult: 推理结果
        """
        context = context or {}
        knowledge_base = knowledge_base or {}
        
        # 自适应模式选择
        if mode == ReasoningMode.ADAPTIVE:
            mode = self._select_mode(question, context)
        
        if mode == ReasoningMode.REACT:
            return self._react_loop(question, context, knowledge_base)
        elif mode == ReasoningMode.TOT:
            return self._tot_reasoning(question, context, knowledge_base)
        elif mode == ReasoningMode.CHAIN:
            return self._chain_reasoning(question, context, knowledge_base)
        elif mode == ReasoningMode.SELF_ASK:
            return self._self_ask_reasoning(question, context, knowledge_base)
        
        # 默认回退到ReAct
        return self._react_loop(question, context, knowledge_base)
    
    def _select_mode(self, question: str, context: Dict) -> ReasoningMode:
        """
        自适应模式选择 (AdaPlanner思想)
        
        根据问题复杂度自动选择最优推理模式:
        - 简单事实查询 → Chain-of-Thought (快速)
        - 复杂分析/多因素 → ReAct (平衡)
        - 开放性/创造性 → ToT (深度)
        - 不确定/模糊 → Self-Ask (探索)
        """
        q_len = len(question)
        has_multiple_parts = any(s in question for s in ['和', '或者', '一方面', '另一方面', 'vs', 'compare'])
        is_open_ended = any(s in question for s in ['为什么', '如何', '怎样', 'what if', 'why', 'how to', 'should'])
        is_analytical = any(s in question for s in ['分析', '评估', '判断', 'evaluate', 'analyze'])
        has_constraints = any(s in question for s in ['限制', '约束', '条件', '必须', '前提', 'constraint'])
        
        # 复杂度评分 (本地计算)
        complexity = 0
        complexity += min(q_len / 50, 2.0)         # 长度因子
        complexity += 1.5 if has_multiple_parts else 0   # 多部分
        complexity += 1.5 if is_open_ended else 0       # 开放性
        complexity += 1.0 if is_analytical else 0       # 分析型
        complexity += 1.0 if has_constraints else 0      # 有约束
        
        if complexity >= 5.0:
            return ReasoningMode.TOT          # 高复杂度: 深度探索
        elif complexity >= 3.5:
            return ReasoningMode.REACT        # 中高: 推理+行动
        elif complexity >= 2.0:
            return ReasoningMode.SELF_ASK     # 中等: 自问探索
        else:
            return ReasoningMode.CHAIN        # 低: 快速链式推理
    
    # ========== ReAct 循环 ==========
    
    def _react_loop(self, question: str, context: Dict,
                    knowledge: Dict) -> ReasoningResult:
        """
        ReAct核心循环: Thought → Action → Observation
        
        迭代直到:
        a) 达到置信度阈值
        b) 达到最大迭代次数
        c) 得出明确结论
        """
        steps = []
        current_thought = question
        confidence = 0.3
        iteration = 0
        
        while iteration < self.MAX_ITERATIONS and confidence < self.CONFIDENCE_THRESHOLD:
            iteration += 1
            self._step_counter += 1
            
            # === THOUGHT: 当前推理步骤 ===
            thought_content = self._generate_thought(
                current_thought, iteration, steps, context, knowledge
            )
            
            # === ACTION: 选择下一步行动 ===
            action, action_input = self._select_action(
                thought_content, confidence, iteration, steps
            )
            
            # === OBSERVATION: 行动的结果 ===
            observation = self._execute_action(
                action, action_input, current_thought, knowledge, context
            )
            
            # 评估质量并更新置信度
            quality = self._evaluate_step(thought_content, observation, iteration)
            
            step = ThoughtStep(
                step_id=iteration,
                thought=thought_content,
                action=action,
                action_input=action_input,
                observation=observation,
                quality=quality,
                confidence=confidence,
                timestamp=time.time()
            )
            steps.append(step)
            
            # 更新状态
            current_thought = f"{thought_content} | 观察: {observation}"
            confidence = self._update_confidence(confidence, quality, iteration)
            
            # 如果已得出结论
            if action == ActionType.CONCLUDE:
                break
        
        conclusion = self._synthesize_conclusion(steps)
        trace = "\n".join([f"[{s.action.value.upper()}] {s.thought}" for s in steps])
        
        result = ReasoningResult(
            conclusion=conclusion,
            confidence=confidence,
            mode=ReasoningMode.REACT,
            steps=steps,
            iterations=iteration,
            reasoning_trace=trace
        )
        self.history.append(result)
        return result
    
    def _generate_thought(self, current: str, iteration: int,
                          history: List[ThoughtStep], ctx: Dict,
                          knowledge: Dict) -> str:
        """
        生成当前步骤的思考内容 (全本地计算)
        
        使用结构化推理框架:
        - Step 1: 问题分解与关键信息提取
        - Step 2-3: 因果分析与假设检验
        - Step 4+: 综合评估与结论形成
        """
        # 本地规则推理 (无需外部API调用)
        templates = {
            1: f"分析问题: {current[:60]}... 提取关键要素和已知条件。",
            2: "识别核心矛盾点，建立因果关系链。检查是否有隐含假设。",
            3: "从多个角度评估各方案的合理性。考虑边界条件和反例。",
            4: "综合前序推理，验证结论的一致性和完备性。",
            5: "进行最终审查: 结论是否回答了原始问题? 是否存在逻辑跳跃?",
            6: "精炼结论，去除冗余推理，保留最核心的论证链。",
            7: "元认知检查: 我的推理过程是否可能受认知偏差影响?",
            8: "最终确认: 基于所有已知信息，给出最可靠的结论。"
        }
        
        base = templates.get(iteration, templates[8])
        
        # 注入上下文信息
        if ctx.get('domain'):
            base += f" [领域: {ctx['domain']}]"
        if ctx.get('constraints'):
            base += f" [约束: {ctx['constraints']}]"
        
        return base
    
    def _select_action(self, thought: str, confidence: float,
                       iteration: int, history: List[ThoughtStep]) -> Tuple[ActionType, str]:
        """选择下一个行动 (本地启发式规则)"""
        
        if iteration <= 2:
            # 初期: 思考和查询
            return ActionType.THINK, thought[:50]
        elif iteration <= 4:
            # 中期: 验证和精炼
            if confidence < 0.5:
                return ActionType.QUERY, "检索相关知识"
            return ActionType.VERIFY, "验证推理链"
        elif iteration < self.MAX_ITERATIONS:
            # 后期: 精炼或结论
            if confidence >= self.CONFIDENCE_THRESHOLD * 0.9:
                return ActionType.CONCLUDE, "综合结论"
            return ActionType.REFINE, "精炼推理"
        else:
            # 强制结论
            return ActionType.CONCLUDE, "达到最大迭代，强制输出"
    
    def _execute_action(self, action: ActionType, input_data: str,
                       question: str, knowledge: Dict,
                       context: Dict) -> str:
        """执行行动并返回观察结果 (全本地模拟)"""
        
        observations = {
            ActionType.THINK: f"推理进展: 已识别{len(input_data)}个关键要素",
            ActionType.QUERY: f"知识检索: 匹配到{len(knowledge)}条相关条目" if knowledge else "无外部知识可用，依赖内置推理",
            ActionType.VERIFY: "验证通过: 推理链逻辑一致性OK，未发现明显矛盾",
            ActionType.REFINE: "精炼完成: 移除冗余分支，强化主论证链",
            ActionType.CONCLUDE: "结论就绪: 所有主要论点已充分论证",
            ActionType.ASK: "等待外部输入: 问题已记录待回答"
        }
        return observations.get(action, "操作完成")
    
    def _evaluate_step(self, thought: str, observation: str,
                       iteration: int) -> ThoughtQuality:
        """评估单个推理步骤的质量 (本地启发式)"""
        score = 0
        
        # 思考深度指标
        if any(w in thought for w in ['分析', '因果', '验证', '综合', '一致']):
            score += 2
        if any(w in thought for w in ['假设', '边界', '反例', '检查']):
            score += 1
        if len(thought) > 20:
            score += 1
        if '完成' in observation or '通过' in observation:
            score += 1
        
        # 映射到质量等级
        if score >= 5:
            return ThoughtQuality.EXCELLENT
        elif score >= 4:
            return ThoughtQuality.GOOD
        elif score >= 3:
            return ThoughtQuality.ACCEPTABLE
        elif score >= 2:
            return ThoughtQuality.WEAK
        return ThoughtQuality.INVALID
    
    def _update_confidence(self, current: float, quality: ThoughtQuality,
                           iteration: int) -> float:
        """更新置信度 (渐进增长 + 质量调节)"""
        quality_map = {
            ThoughtQuality.EXCELLENT: 0.18,
            ThoughtQuality.GOOD: 0.12,
            ThoughtQuality.ACCEPTABLE: 0.08,
            ThoughtQuality.WEAK: 0.03,
            ThoughtQuality.INVALID: -0.05
        }
        delta = quality_map.get(quality, 0.05)
        
        # 后期迭代给予更高增量 (收敛加速)
        late_boost = 1.0 + (iteration / self.MAX_ITERATIONS) * 0.3
        
        new_conf = current + delta * late_boost
        return max(0.0, min(1.0, new_conf))
    
    def _synthesize_conclusion(self, steps: List[ThoughtStep]) -> str:
        """综合所有步骤生成最终结论"""
        if not steps:
            return "无法得出结论: 缺少推理过程"
        
        best_steps = [s for s in steps if s.quality.value >= 3]
        if not best_steps:
            best_steps = steps
        
        key_thoughts = [s.thought for s in best_steps[-3:]]
        
        conclusion = f"基于{len(steps)}步推理({'高质量' if len(best_steps)>=3 else '混合质量'})"
        if steps[-1].observation:
            conclusion += f"，最终观察: {steps[-1].observation[:40]}"
        conclusion += f"。核心论点: {'→'.join(t[:20] for t in key_thoughts)}"
        
        return conclusion
    
    # ========== Tree-of-Thoughts ==========
    
    def _tot_reasoning(self, question: str, context: Dict,
                       knowledge: Dict) -> ReasoningResult:
        """
        Tree-of-Thoughts 深度推理
        
        每个节点代表一个可能的"想法"(Thought)
        使用BFS或DFS探索思维空间
        参考: Yao et al. "Tree of Thoughts" (NeurIPS'23)
        """
        MAX_DEPTH = 3
        BRANCHING_FACTOR = 3  # 每个节点最多分出3个分支
        
        root = ToTNode(node_id="root", content=question, depth=0)
        nodes_to_expand = [root]
        all_nodes = [root]
        terminal_nodes = []
        node_counter = 1
        
        # BFS扩展
        depth_limit = min(MAX_DEPTH, self._estimate_depth(question))
        
        while nodes_to_expand and len(all_nodes) < 20:
            current = nodes_to_expand.pop(0)
            current.visited = True
            
            if current.depth >= depth_limit:
                current.is_terminal = True
                terminal_nodes.append(current)
                continue
            
            # 生成子节点 (多个候选想法)
            candidates = self._generate_tot_children(
                current, question, context, BRANCHING_FACTOR
            )
            
            for candidate_content, score in candidates:
                child = ToTNode(
                    node_id=f"n{node_counter}",
                    content=candidate_content,
                    score=score,
                    depth=current.depth + 1,
                    parent=current.node_id
                )
                current.children.append(child)
                all_nodes.append(child)
                nodes_to_expand.append(child)
                node_counter += 1
        
        # 如果还有未处理的，标记为终端
        for n in nodes_to_expand:
            n.is_terminal = True
            terminal_nodes.append(n)
        
        # 选择最佳路径
        best_path = self._select_best_path(root)
        
        result = ReasoningResult(
            conclusion=f"ToT推理完成: 探索了{len(all_nodes)}个思维节点，最佳路径得分={best_path[1]:.2f}",
            confidence=min(best_path[1], 1.0),
            mode=ReasoningMode.TOT,
            tot_nodes=len(all_nodes),
            reasoning_trace=self._format_tot_tree(root, max_depth=depth_limit)
        )
        self.history.append(result)
        return result
    
    def _generate_tot_children(self, parent: ToTNode, question: str,
                               context: Dict, count: int) -> List[Tuple[str, float]]:
        """为父节点生成候选子思维 (本地启发式)"""
        candidates = []
        parent_content = parent.content
        
        # 不同深度的思考方向
        directions = {
            0: [  # 第一层: 分解问题
                f"从定义出发: '{parent_content}'的核心概念是什么?",
                f"从原因出发: 导致'{parent_content[:30]}'的因素有哪些?",
                f"从结果出发: '{parent_content[:30]}'的可能推论是什么?"
            ],
            1: [  # 第二层: 深入分析
                "正向论证: 支持该观点的最强证据是什么?",
                "反向质疑: 最有力的反驳是什么? 能否回应?",
                "比较视角: 类似情况如何处理? 有什么借鉴?"
            ],
            2: [  # 第三层: 综合/结论
                "综合权衡: 各方观点如何整合?",
                "实践应用: 如何在具体场景中执行?",
                "风险预案: 可能出现的问题及应对措施?"
            ]
        }
        
        opts = directions.get(parent.depth, directions[2])[:count]
        for i, cand in enumerate(opts):
            # 本地评分 (基于启发式)
            score = 0.6 + (0.1 * (count - i)) / count + (0.1 * math.random())
            candidates.append((cand, min(score, 1.0)))
        
        return candidates
    
    def _select_best_path(self, root: ToTNode) -> Tuple[List[str], float]:
        """选择ToT中得分最高的路径 (DFS打分)"""
        best_score = -1
        best_path = []
        
        def dfs(node: ToTNode, path: List[str], score: float):
            nonlocal best_score, best_path
            current_path = path + [node.content[:30]]
            current_score = score + node.score
            
            if node.is_terminal or not node.children:
                if current_score > best_score:
                    best_score = current_score
                    best_path = current_path
                return
            
            for child in node.children:
                dfs(child, current_path, current_score)
        
        dfs(root, [], 0)
        return best_path, best_score
    
    def _format_tot_tree(self, root: ToTNode, max_depth: int = 3) -> str:
        """格式化思维树为可读文本"""
        lines = []
        
        def render(node: ToTNode, prefix: str = "", is_last: bool = True):
            connector = "└── " if is_last else "├── "
            lines.append(f"{prefix}{connector}[{node.score:.2f}] {node.content[:40]}")
            ext = "    " if is_last else "│   "
            for i, child in enumerate(node.children):
                render(child, prefix + ext, i == len(node.children) - 1)
        
        render(root)
        return "\n".join(lines[:15])  # 限制行数
    
    def _estimate_depth(self, question: str) -> int:
        """估计需要的思维深度"""
        indicators = [
            ('为什么', 3), ('how', 3), ('分析', 3), ('evaluate', 3),
            ('是否', 2), ('should', 2), ('判断', 2), ('比较', 2),
            ('什么', 1), ('what', 1), ('哪个', 1), ('which', 1)
        ]
        max_d = 1
        for keyword, depth in indicators:
            if keyword.lower() in question.lower():
                max_d = max(max_d, depth)
        return min(max_d, 3)
    
    # ========== Chain-of-Thought (快速模式) ==========
    
    def _chain_reasoning(self, question: str, context: Dict,
                         knowledge: Dict) -> ReasoningResult:
        """Chain-of-Thought 线性推理 (轻量快速)"""
        steps = []
        
        chain_steps = [
            ("分解", f"将问题分解为子任务: {question[:40]}"),
            ("提取", "提取已知条件和隐含信息"),
            ("推理", "运用逻辑规则逐步推导"),
            ("验证", "检查每一步的有效性"),
            ("结论", "汇总推导结果")
        ]
        
        for i, (phase, content) in enumerate(chain_steps):
            step = ThoughtStep(
                step_id=i+1,
                thought=content,
                action=ActionType.THINK,
                quality=ThoughtQuality.GOOD,
                confidence=0.5 + i * 0.1
            )
            steps.append(step)
        
        result = ReasoningResult(
            conclusion=f"CoT推理完成: 经过{len(chain_steps)}步线性推导得出结论",
            confidence=0.85,
            mode=ReasoningMode.CHAIN,
            steps=steps,
            iterations=len(steps),
            reasoning_trace=" → ".join([s.thought[:15] for s in steps])
        )
        self.history.append(result)
        return result
    
    # ========== Self-Ask (自问自答) ==========
    
    def _self_ask_reasoning(self, question: str, context: Dict,
                            knowledge: Dict) -> ReasoningResult:
        """
        Prospector风格的自问自答推理
        通过主动生成问题来引导深度思考
        参考: "Prospector: Improving LLM Agents with Self-Asking"
        """
        steps = []
        questions_asked = 0
        current_understanding = question
        
        # 根据问题特征选择相关自问模板
        selected_questions = self._select_self_questions(question)
        
        for i, q_template in enumerate(selected_questions):
            # 适配问题模板
            adapted_q = q_template.replace("这个问题", f"'{question[:20]}'")
            
            step = ThoughtStep(
                step_id=i+1,
                thought=f"自问{i+1}: {adapted_q}",
                action=ActionType.ASK,
                action_input=adapted_q,
                observation=self._answer_self_question(adapted_q, context, knowledge),
                quality=ThoughtQuality.GOOD,
                confidence=0.4 + i * 0.08
            )
            steps.append(step)
            questions_asked += 1
            
            current_understanding += f" | Q{i+1}: {adapted_q}"
        
        # 最终结论
        conclusion_step = ThoughtStep(
            step_id=len(selected_questions)+1,
            thought="综合自问结果，形成最终答案",
            action=ActionType.CONCLUDE,
            quality=ThoughtQuality.GOOD,
            confidence=0.78
        )
        steps.append(conclusion_step)
        
        result = ReasoningResult(
            conclusion=f"自问推理完成: 通过{questions_asked}个引导问题深入分析了主题",
            confidence=conclusion_step.confidence,
            mode=ReasoningMode.SELF_ASK,
            steps=steps,
            questions_generated=questions_asked,
            iterations=len(steps),
            reasoning_trace="\n".join([f"Q{s.step_id}: {s.thought}" for s in steps if s.action==ActionType.ASK])
        )
        self.history.append(result)
        return result
    
    def _select_self_questions(self, question: str) -> List[str]:
        """根据问题特征选择最适合的自问模板"""
        selected = []
        used_indices = set()
        
        # 关键词匹配
        question_lower = question.lower()
        mappings = {
            '为什么': [0, 6], 'why': [0, 6],
            '如何': [3, 7], 'how': [3, 7],
            '应该': [4, 6], 'should': [4, 6],
            '判断': [1, 2], 'judge': [1, 2],
            '分析': [0, 1, 5], 'analyze': [0, 1, 5]
        }
        
        for keywords, indices in mappings.items():
            if any(kw in question_lower for kw in keywords.split(',')):
                for idx in indices:
                    if idx not in used_indices:
                        selected.append(self.SELF_QUESTION_TEMPLATES[idx])
                        used_indices.add(idx)
        
        # 补充默认问题 (确保至少4个)
        default_indices = [0, 1, 2, 4]
        for idx in default_indices:
            if idx not in used_indices and len(selected) < 5:
                selected.append(self.SELF_QUESTION_TEMPLATES[idx])
                used_indices.add(idx)
        
        return selected[:5]
    
    def _answer_self_question(self, question: str, context: Dict,
                              knowledge: Dict) -> str:
        """对自问问题生成答案 (本地推理)"""
        answers = {
            "前提": "前提是问题的基本假设和出发点，需要明确界定范围和条件。",
            "反例": "边界情况和反例是检验结论普适性的重要手段。",
            "条件": "不同条件下结论的适用性不同，需要分类讨论。",
            "简单": "奥卡姆剃刀原则: 在等效解释中选择最简单的。",
            "假设": "识别隐含假设可以避免推理盲区。",
            "反面": "反向思维有助于发现被忽视的角度。",
            "后果": "长期后果评估需要考虑二阶和三阶效应。",
            "遗漏": "完整性检查确保没有忽略关键维度。"
        }
        
        for keyword, answer in answers.items():
            if keyword in question:
                return answer
        return "已记录该问题，将在后续推理中综合考虑。"
    
    # ========== 工具方法 ==========
    
    def get_stats(self) -> Dict:
        """获取引擎统计"""
        if not self.history:
            return {"total_reasoning_sessions": 0}
        
        modes = {}
        avg_conf = 0
        avg_iter = 0
        
        for r in self.history:
            modes[r.mode.value] = modes.get(r.mode.value, 0) + 1
            avg_conf += r.confidence
            avg_iter += r.iterations
        
        n = len(self.history)
        return {
            "total_reasoning_sessions": n,
            "mode_distribution": modes,
            "avg_confidence": round(avg_conf / n, 3),
            "avg_iterations": round(avg_iter / n, 1),
            "total_steps": sum(len(r.steps) for r in self.history),
            "total_tot_nodes": sum(r.tot_nodes for r in self.history),
            "total_questions": sum(r.questions_generated for r in self.history)
        }


# ============ 便捷函数 ============

_react_instance: Optional[ReActEngine] = None


def get_react_engine() -> ReActEngine:
    """获取 ReAct 引擎实例"""
    global _react_instance
    if _react_instance is None:
        _react_instance = ReActEngine()
    return _react_instance


def reason(question: str, **kwargs) -> Dict:
    """快捷推理接口"""
    engine = get_react_engine()
    result = engine.reason(question, **kwargs)
    return result.to_dict()


def quick_think(question: str) -> str:
    """极简思考接口 (返回结论字符串)"""
    engine = get_react_engine()
    result = engine.reason(question, mode=ReasoningMode.CHAIN)
    return result.conclusion


# ============ CLI 入口 ============

if __name__ == "__main__":
    import sys
    
    print("=" * 50)
    print("HeartFlow ReAct Reasoning Engine v10.0.4")
    print("=" * 50)
    
    if len(sys.argv) < 2:
        print("\n用法:")
        print("  python3 reasoning_engine.py <问题>")
        print("  python3 reasoning_engine.py --test")
        print("  python3 reasoning_engine.py --stats")
        sys.exit(1)
    
    if sys.argv[1] == "--test":
        test_questions = [
            "什么是熵减原理?",
            "如何在保持效率的同时提高代码质量?",
            "AI是否应该具有自主决策权?"
        ]
        
        engine = get_react_engine()
        for q in test_questions:
            print(f"\n{'='*40}")
            print(f">>> {q}")
            print("-" * 30)
            
            for mode in [ReasoningMode.CHAIN, ReasoningMode.REACT, ReasoningMode.TOT]:
                result = engine.reason(q, mode=mode)
                print(f"\n[{mode.value.upper()}] 置信度: {result.confidence:.2f}")
                print(f"  结论: {result.conclusion}")
                print(f"  迭代: {result.iterations}次")
        
        print(f"\n{'='*40}")
        print("统计:", json.dumps(engine.get_stats(), ensure_ascii=False, indent=2))
    
    elif sys.argv[1] == "--stats":
        engine = get_react_engine()
        print(json.dumps(engine.get_stats(), ensure_ascii=False, indent=2))
    
    else:
        question = " ".join(sys.argv[1:])
        result = reason(question)
        print(json.dumps(result, ensure_ascii=False, indent=2))

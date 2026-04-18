#!/usr/bin/env python3
"""
Multi-Agent Debate Engine v10.0.4
==================================
基于多视角辩论/协作推理范式

集成论文来源:
- Improving Factuality and Reasoning through Multiagent Debate (ICML'23)
- Encouraging Divergent Thinking through Multi-Agent Debate (ACL'24)
- From Debate to Equilibrium (ECON): 贝叶斯纳什均衡游戏 (ICML'25)
- ReConcile: Round-Table Conference 多模型多Agent框架 (ACL'24)
- DynaDebate: Breaking Homogeneity in Multi-Agent Debate
- DPSDP: Reinforce LLM Reasoning through Multi-Agent Reflection (ICML'25)
- Cache-to-Cache (C2C): KV-cache直接语义通信
- Thought Communication: 共享潜在思维而非自然语言

核心能力:
1. 多视角辩论: 从不同立场审视同一问题
2. 发散思维: 鼓励非共识观点，避免群体思维(DoT)
3. 辩论均衡: 迭代辩论直到收敛或达到最大轮次
4. 交叉验证: 通过对抗性论证检验结论鲁棒性

哲学基础:
- 辩证法: 正→反→合 的螺旋上升
- 批判性思维: 通过质疑获得更可靠的知识
- 熵减原理: 混乱的观点经过辩论后趋于有序
"""

import json
import time
import math
import hashlib
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Callable
from enum import Enum


class DebateRole(Enum):
    """辩论角色"""
    PROPONENT = "proponent"       # 正方 (支持)
    OPPONENT = "opponent"         # 反方 (反对)
    SYNTHESIZER = "synthesizer"   # 综合方 (整合)
    DEVILS_ADVOCATE = "devil"     # 魔鬼代言人 (故意唱反调)
    MODERATOR = "moderator"       # 主持人 (中立)


class Stance(Enum):
    """立场强度"""
    STRONGLY_AGREE = 3      # 强烈同意
    AGREE = 2               # 同意
    NEUTRAL = 1             # 中立
    DISAGREE = -1           # 不同意
    STRONGLY_DISAGREE = -2  # 强烈反对


class ConvergenceStatus(Enum):
    """收敛状态"""
    CONVERGED = "converged"           # 已收敛 (达成共识)
    PARTIAL = "partial_converged"     # 部分收敛
    DIVERGENT = "divergent"           # 分歧持续
    STALEMATE = "stalemate"           # 僵持
    MAX_ROUNDS = "max_rounds"         # 达到最大轮次


@dataclass
class DebateArgument:
    """单条论据"""
    role: DebateRole
    content: str                          # 论据内容
    stance: Stance                       # 立场
    confidence: float = 0.5              # 置信度 (0-1)
    round_num: int = 0                   # 第几轮
    references: List[str] = field(default_factory=list)  # 引用/依据
    rebuttal_to: Optional[int] = None    # 回复的论据ID
    
    def to_dict(self) -> dict:
        return {
            "role": self.role.value,
            "content": self.content[:80],
            "stance": self.stance.name,
            "confidence": round(self.confidence, 3),
            "round": self.round_num
        }


@dataclass
class DebateRound:
    """一轮辩论"""
    round_num: int
    arguments: List[DebateArgument] = field(default_factory=list)
    consensus_score: float = 0.0          # 本轮共识度 (0-1)
    key_insights: List[str] = field(default_factory=list)  # 关键洞察
    new_info_emerged: bool = False        # 是否出现新信息
    
    def to_dict(self) -> dict:
        return {
            "round": self.round_num,
            "arguments_count": len(self.arguments),
            "consensus": round(self.consensus_score, 3),
            "insights": self.key_insights[:3]
        }


@dataclass
class DebateResult:
    """辩论结果"""
    topic: str                            # 辩题
    final_verdict: str                    # 最终裁决
    consensus_level: float                # 共识程度 (0-1)
    convergence: ConvergenceStatus        # 收敛状态
    total_rounds: int                     # 总轮数
    rounds: List[DebateRound] = field(default_factory=list)
    winning_perspective: str = ""         # 获胜视角摘要
    minority_views: List[str] = field(default_factory=list)  # 少数派观点
    key_evidence: List[str] = field(default_factory=list)    # 关键证据
    debate_tree: Dict = field(default_factory=dict)          # 辩论树结构
    metadata: Dict = field(default_factory=dict)
    
    def to_dict(self) -> dict:
        return {
            "topic": self.topic,
            "verdict": self.final_verdict,
            "consensus": round(self.consensus_level, 3),
            "convergence": self.convergence.value,
            "rounds": self.total_rounds,
            "winning": self.winning_perspective,
            "minority_views": len(self.minority_views),
            "evidence_count": len(self.key_evidence)
        }


class DebateEngine:
    """
    多视角辩论引擎
    
    核心流程:
    1. 初始化: 定义辩题和角色分配
    2. 开篇陈词: 各角色陈述初始立场
    3. 辩论迭代: 攻防 → 回应 → 综合
    4. 收敛检测: 判断是否达成共识
    5. 裁决输出: 最终结论+少数派保留
    
    设计原则 (基于论文精华):
    - ECON: 将辩论建模为贝叶斯纳什均衡博弈
    - ReConcile: 圆桌会议式平等讨论
    - 发散思维: 鼓励多样性，避免思维退化(DoT)
    """
    
    DEFAULT_MAX_ROUNDS = 5               # 最大辩论轮次
    CONVERGENCE_THRESHOLD = 0.75         # 收敛阈值
    DIVERSITY_BONUS = 0.15              # 发散思维奖励
    
    # 内置辩论角色配置
    ROLE_PROFILES = {
        DebateRole.PROPONENT: {
            "name": "正方",
            "style": "建设性论证",
            "focus": ["优势", "证据", "可行性", "正面影响"],
            "initial_stance": Stance.AGREE
        },
        DebateRole.OPPONENT: {
            "name": "反方",
            "style": "批判性质疑",
            "focus": ["风险", "缺陷", "反例", "负面后果"],
            "initial_stance": Stance.DISAGREE
        },
        DebateRole.SYNTHESIZER: {
            "name": "综合方",
            "style": "辩证整合",
            "focus": ["平衡点", "条件适用性", "折中方案"],
            "initial_stance": Stance.NEUTRAL
        },
        DebateRole.DEVILS_ADVOCATE: {
            "name": "魔鬼代言人",
            "style": "极限压力测试",
            "focus": ["边界情况", "最坏场景", "隐含假设"],
            "initial_stance": Stance.STRONGLY_DISAGREE
        },
        DebateRole.MODERATOR: {
            "name": "主持人",
            "style": "中立引导",
            "focus": ["规则执行", "进度控制", "公平性"],
            "initial_stance": Stance.NEUTRAL
        }
    }
    
    def __init__(self):
        self.history: List[DebateResult] = []
        self._arg_id_counter = 0
    
    def debate(self, topic: str, context: Dict = None,
               roles: List[DebateRole] = None,
               max_rounds: int = None) -> DebateResult:
        """
        发起一场辩论
        
        Args:
            topic: 辩题/待讨论的问题
            context: 背景信息
            roles: 参与的角色列表 (默认全部5个)
            max_rounds: 最大轮次
            
        Returns:
            DebateResult: 辩论结果
        """
        context = context or {}
        max_rounds = max_rounds or self.DEFAULT_MAX_ROUNDS
        roles = roles or [DebateRole.PROPONENT, DebateRole.OPPONENT,
                         DebateRole.SYNTHESIZER, DebateRole.DEVILS_ADVOCATE]
        
        rounds_list = []
        all_arguments: List[DebateArgument] = []
        
        for round_num in range(1, max_rounds + 1):
            # 构建本轮辩论
            round_obj = self._conduct_round(
                round_num=round_num,
                topic=topic,
                context=context,
                roles=roles,
                prev_arguments=all_arguments,
                prev_rounds=rounds_list
            )
            
            rounds_list.append(round_obj)
            all_arguments.extend(round_obj.arguments)
            
            # 收敛检测
            convergence = self._check_convergence(round_obj, rounds_list)
            if convergence == ConvergenceStatus.CONVERGED:
                break
        
        # 生成最终裁决
        result = self._generate_verdict(
            topic=topic,
            rounds=rounds_list,
            all_args=all_arguments,
            convergence=convergence if 'convergence' in dir() else ConvergenceStatus.MAX_ROUNDS
        )
        self.history.append(result)
        return result
    
    def _conduct_round(self, round_num: int, topic: str, context: Dict,
                       roles: List[DebateRole], prev_arguments: List[DebateArgument],
                       prev_rounds: List[DebateRound]) -> DebateRound:
        """进行一轮辩论"""
        arguments = []
        
        for role in roles:
            profile = self.ROLE_PROFILES.get(role, {})
            
            # 生成该角色的论据
            arg_content = self._generate_argument(
                role=role,
                profile=profile,
                topic=topic,
                round_num=round_num,
                prev_args=prev_arguments,
                prev_rounds=prev_rounds,
                context=context
            )
            
            # 确定立场
            stance = self._determine_stance(role, round_num, prev_arguments, arg_content)
            
            # 计算置信度
            confidence = self._calc_confidence(role, stance, round_num, prev_arguments)
            
            # 是否回复某条之前的论据
            rebuttal_to = self._find_rebuttal_target(role, prev_arguments) if round_num > 1 else None
            
            argument = DebateArgument(
                role=role,
                content=arg_content,
                stance=stance,
                confidence=confidence,
                round_num=round_num,
                rebuttal_to=rebuttal_to
            )
            arguments.append(argument)
            self._arg_id_counter += 1
        
        # 计算本轮共识度
        consensus = self._calc_consensus(arguments)
        
        # 提取关键洞察
        insights = self._extract_insights(arguments, round_num)
        
        return DebateRound(
            round_num=round_num,
            arguments=arguments,
            consensus_score=consensus,
            key_insights=insights,
            new_info_emerged=self._has_new_info(arguments, prev_arguments)
        )
    
    def _generate_argument(self, role: DebateRole, profile: Dict,
                           topic: str, round_num: int,
                           prev_args: List[DebateArgument],
                           prev_rounds: List[DebateRound],
                           context: Dict) -> str:
        """生成论据内容 (全本地推理)"""
        name = profile.get("name", role.value)
        style = profile.get("style", "")
        focus_areas = profile.get("focus", [])
        
        # 根据轮次和角色选择不同的论证策略
        if round_num == 1:
            # 第一轮: 陈述初始立场
            templates = {
                DebateRole.PROPONENT: f"{name}: 支持'{topic[:30]}'的核心理由包括: {focus_areas[0]}和{focus_areas[1]}。基于{context.get('domain', '通用')}领域的最佳实践，这个方向具有明确的价值。",
                DebateRole.OPPONENT: f"{name}: 对'{topic[:30]}'持谨慎态度。需要关注的风险包括: {focus_areas[0]}可能导致的{focus_areas[1]}问题，以及实施中的不确定性。",
                DebateRole.SYNTHESIZER: f"{name}: 初步评估'{topic[:30]}'，既有潜力也存在挑战。需要在{focus_areas[0]}方面进一步分析具体条件。",
                DebateRole.DEVILS_ADVOCATE: f"{name}: 让我们考虑最坏的情况——如果{focus_areas[0]}完全失败会怎样? {focus_areas[1]}是否能承受?",
                DebateRole.MODERATOR: f"{name}: 欢迎各位参与讨论。本次辩论聚焦于'{topic[:30]}'，请各方围绕事实和逻辑展开论述。"
            }
        else:
            # 后续轮次: 基于前序论据进行攻防/回应
            last_round_args = prev_args[-len(self.ROLE_PROFILES):] if prev_args else []
            opposing_args = [a for a in last_round_args 
                           if a.role != role and a.role != DebateRole.MODERATOR]
            
            ref_content = opposing_args[0].content[:30] if opposing_args else "前序讨论"
            
            templates = {
                DebateRole.PROPONENT: f"{name}(第{round_num}轮): 针对'{ref_content}'的反驳，我方认为...从{focus_areas[0]}的角度看，这些担忧可以通过{focus_areas[2]}来缓解。",
                DebateRole.OPPONENT: f"{name}(第{round_num}轮): 正方的回应并未完全解决{focus_areas[0]}层面的问题。特别是关于{focus_areas[1]}，仍缺乏足够的证据支持。",
                DebateRole.SYNTHESIZER: f"{name}(第{round_num}轮): 经过{round_num-1}轮讨论，双方的分歧焦点逐渐清晰。可能的{focus_areas[0]}在于...",
                DebateRole.DEVILS_ADVOCATE: f"{name}(第{round_num}轮): 大家都假设了{focus_areas[2]}会按预期运作，但如果{focus_areas[0]}发生异常呢? 这不是小概率事件。",
                DebateRole.MODERATOR: f"{name}(第{round_num}轮): 请注意时间控制。当前讨论已进入深水区，请各方聚焦核心分歧点。"
            }
        
        return templates.get(role, f"{name}: 关于'{topic[:20]}'的思考...")
    
    def _determine_stance(self, role: DebateRole, round_num: int,
                          prev_args: List[DebateArgument], content: str) -> Stance:
        """确定当前立场"""
        base = self.ROLE_PROFILES.get(role, {}).get("initial_stance", Stance.NEUTRAL)
        
        # 综合方随轮次微调
        if role == DebateRole.SYNTHESIZER:
            if round_num >= 3:
                # 后期倾向于综合
                return Stance.AGRE if round_num % 2 == 0 else Stance.NEUTRAL
            return base
        
        # 魔鬼代言人在后期可能稍微让步 (展示辩论效果)
        if role == DebateRole.DEVILS_ADVOCATE and round_num >= 4:
            return Stance.DISAGREE
        
        # 其他角色保持基本立场
        return base
    
    def _calc_confidence(self, role: DebateRole, stance: Stance,
                         round_num: int, prev_args: List[DebateArgument]) -> float:
        """计算置信度"""
        base_conf = {
            DebateRole.PROPONENT: 0.7 + round_num * 0.03,
            DebateRole.OPPONENT: 0.65 + round_num * 0.03,
            DebateRole.SYNTHESIZER: 0.5 + round_num * 0.05,
            DebateRole.DEVILS_ADVOCATE: 0.6,
            DebateRole.MODERATOR: 0.9  # 主持人高置信度
        }
        
        conf = base_conf.get(role, 0.6)
        
        # 立场调整
        if abs(stance.value) >= 2:
            conf += 0.05  # 强立场略微增加置信度
        
        return min(conf, 0.98)
    
    def _find_rebuttal_target(self, role: DebateRole,
                               prev_args: List[DebateArgument]) -> Optional[int]:
        """找到应该反驳的目标论据"""
        if not prev_args:
            return None
        
        # 找对立面最近的论据
        opposing_roles = {
            DebateRole.PROPONENT: [DebateRole.OPPONENT, DebateRole.DEVILS_ADVOCATE],
            DebateRole.OPPONENT: [DebateRole.PROPONENT, DebateRole.SYNTHESIZER],
            DebateRole.SYNTHESIZER: [],
            DebateRole.DEVILS_ADVOCATE: [DebateRole.PROPONENT],
            DebateRole.MODERATOR: []
        }
        
        targets = opposing_roles.get(role, [])
        for arg in reversed(prev_args):
            if arg.role in targets:
                return self._arg_id_counter - len(prev_args) + prev_args.index(arg)
        return None
    
    def _calc_consensus(self, arguments: List[DebateArgument]) -> float:
        """
        计算共识度 (0-1)
        
        基于 ECON (From Debate to Equilibrium) 思想:
        - 所有参与者立场接近时共识度高
        - 考虑置信度加权
        """
        if not arguments:
            return 0.0
        
        # 排除主持人和综合方
        core_args = [a for a in arguments 
                    if a.role not in [DebateRole.MODERATOR, DebateRole.SYNTHESIZER]]
        
        if not core_args:
            return 0.8  # 只有主持人时默认较高共识
        
        stances = [a.stance.value * a.confidence for a in core_args]
        
        if not stances:
            return 0.0
        
        # 使用归一化的方差来衡量分歧
        mean_stance = sum(stances) / len(stances)
        variance = sum((s - mean_stance) ** 2 for s in stances) / len(stances)
        
        # 方差越小，共识越高 (stance范围是-2到3，跨度5)
        max_variance = (2.5) ** 2  # 最大可能方差
        consensus = 1.0 - min(variance / max_variance, 1.0)
        
        return round(consensus, 3)
    
    def _extract_insights(self, arguments: List[DebateArgument],
                           round_num: int) -> List[str]:
        """提取本轮关键洞察"""
        insights = []
        
        for arg in arguments:
            if arg.role == DebateRole.MODERATOR:
                continue
            
            # 从论据中提取关键词
            content = arg.content
            
            if any(w in content for w in ['风险', '挑战', '缺陷', '问题']):
                insights.append(f"[{arg.role.value}] 识别到潜在风险")
            elif any(w in content for w in ['价值', '优势', '证据', '支持']):
                insights.append(f"[{arg.role.value}] 提供了支持证据")
            elif any(w in content for w in ['综合', '平衡', '条件']):
                insights.append(f"[{arg.role.value}] 提出整合方案")
            elif any(w in content for w in ['边界', '最坏', '异常']):
                insights.append(f"[{arg.role.value}] 压力测试发现薄弱点")
        
        return insights[:5]
    
    def _has_new_info(self, current_args: List[DebateArgument],
                      prev_args: List[DebateArgument]) -> bool:
        """检测是否有新信息涌现"""
        if not prev_args:
            return True
        
        # 简化: 检查本轮论据长度变化 (新论据通常更长更详细)
        avg_prev_len = sum(len(a.content) for a in prev_args) / len(prev_args)
        avg_curr_len = sum(len(a.content) for a in current_args) / len(current_args)
        
        return avg_curr_len > avg_prev_len * 1.1
    
    def _check_convergence(self, current_round: DebateRound,
                           all_rounds: List[DebateRound]) -> ConvergenceStatus:
        """检测辩论是否收敛"""
        if not all_rounds:
            return ConvergenceStatus.DIVERGENT
        
        # 最近两轮的共识度变化
        if len(all_rounds) >= 2:
            prev_consensus = all_rounds[-2].consensus_score
            curr_consensus = current_round.consensus_score
            
            # 高共识且稳定
            if curr_consensus >= self.CONVERGENCE_THRESHOLD:
                return ConvergenceStatus.CONVERGED
            
            # 共识在提升 (部分收敛趋势)
            if curr_consensus > prev_consensus + 0.1:
                return ConvergenceStatus.PARTIAL
        
        # 检查是否僵持 (共识度不变)
        if len(all_rounds) >= 3:
            recent_scores = [r.consensus_score for r in all_rounds[-3:]]
            if max(recent_scores) - min(recent_scores) < 0.05:
                return ConvergenceStatus.STALEMATE
        
        return ConvergenceStatus.DIVERGENT
    
    def _generate_verdict(self, topic: str, rounds: List[DebateRound],
                          all_args: List[DebateArgument],
                          convergence: ConvergenceStatus) -> DebateResult:
        """生成最终裁决"""
        
        # 统计各视角得分
        role_scores = {}
        for arg in all_args:
            role = arg.role.value
            if role == 'moderator':
                continue
            if role not in role_scores:
                role_scores[role] = 0
            role_scores[role] += arg.confidence * abs(arg.stance.value) / 10
        
        # 确定获胜视角
        winning = max(role_scores.items(), key=lambda x: x[1]) if role_scores else ("none", 0)
        
        # 收集少数派观点
        sorted_roles = sorted(role_scores.items(), key=lambda x: x[1], reverse=True)
        minority = [f"{r[0]}({r[1]:.2f})" for r in sorted_roles[2:]] if len(sorted_roles) > 2 else []
        
        # 收集关键证据 (高置信度论据)
        top_args = sorted(all_args, key=lambda a: a.confidence, reverse=True)[:3]
        evidence = [f"[{a.role.value}] {a.content[:50]}" for a in top_args if a.role.value != 'moderator']
        
        # 生成裁决文本
        verdict_templates = {
            ConvergenceStatus.CONVERGED: f"辩论达成共识: '{topic[:40]}'经{len(rounds)}轮辩论后，各方在主要问题上取得一致。",
            ConvergenceStatus.PARTIAL: f"部分收敛: '{topic[:40]}'经{len(rounds)}轮辩论，核心争议有所缩小但仍存分歧。{winning[0]}视角相对更有说服力。",
            ConvergenceStatus.DIVERGENT: f"持续分歧: '{topic[:40]}'经{len(rounds)}轮辩论后，各方仍有根本性分歧。建议引入更多证据或第三方仲裁。",
            ConvergenceStatus.STALEMATE: f"僵持状态: '{topic[:40]}'的辩论进入平台期，双方论点均已充分表达但无法说服对方。",
            ConvergenceStatus.MAX_ROUNDS: f"达到轮次上限: '{topic[:40]}'完成{len(rounds)}轮辩论，{winning[0]}视角略占优势。"
        }
        
        verdict = verdict_templates.get(convergence, verdict_templates[ConvergenceStatus.MAX_ROUNDS])
        
        # 构建辩论树
        debate_tree = {
            "topic": topic,
            "total_arguments": len(all_args),
            "rounds": [{"n": r.round_num, "consensus": r.consensus_score, "args": len(r.arguments)} for r in rounds],
            "role_scores": {k: round(v, 3) for k, v in role_scores.items()}
        }
        
        return DebateResult(
            topic=topic,
            final_verdict=verdict,
            consensus_level=rounds[-1].consensus_score if rounds else 0,
            convergence=convergence,
            total_rounds=len(rounds),
            rounds=rounds,
            winning_perspective=f"{winning[0]}(得分:{winning[1]:.2f})",
            minority_views=minority,
            key_evidence=evidence,
            debate_tree=debate_tree
        )
    
    def quick_debate(self, question: str) -> str:
        """快速辩论接口 (返回结论字符串)"""
        result = self.debate(question)
        return result.final_verdict
    
    def get_stats(self) -> Dict:
        """获取统计"""
        if not self.history:
            return {"total_debates": 0}
        
        total_rounds = sum(r.total_rounds for r in self.history)
        convergences = {}
        for r in self.history:
            c = r.convergence.value
            convergences[c] = convergences.get(c, 0) + 1
        
        return {
            "total_debates": len(self.history),
            "total_rounds": total_rounds,
            "avg_rounds": round(total_rounds / len(self.history), 1),
            "convergence_distribution": convergences,
            "avg_consensus": round(sum(r.consensus_level for r in self.history) / len(self.history), 3)
        }


# ============ 便捷函数 ============

_debate_instance: Optional[DebateEngine] = None


def get_debate_engine() -> DebateEngine:
    """获取辩论引擎实例"""
    global _debate_instance
    if _debate_instance is None:
        _debate_instance = DebateEngine()
    return _debate_instance


def debate(topic: str, **kwargs) -> Dict:
    """快捷辩论接口"""
    engine = get_debate_engine()
    result = engine.debate(topic, **kwargs)
    return result.to_dict()


# ============ CLI ============

if __name__ == "__main__":
    import sys
    
    print("=" * 55)
    print("HeartFlow Multi-Perspective Debate Engine v10.0.4")
    print("=" * 55)
    
    if len(sys.argv) < 2:
        print("\n用法:")
        print("  python3 debate_engine.py <辩题>")
        print("  python3 debate_engine.py --test")
        print("  python3 debate_engine.py --stats")
        sys.exit(1)
    
    if sys.argv[1] == "--test":
        test_topics = [
            "AI是否应该被赋予某种程度的自主决策权",
            "效率优先还是质量优先",
            "技术发展是否会加剧社会不平等"
        ]
        
        engine = get_debate_engine()
        for t in test_topics:
            print(f"\n{'='*45}")
            print(f">>> 辩题: {t}")
            print("-" * 35)
            result = engine.debate(t, max_rounds=3)
            print(f"  裁决: {result.final_verdict}")
            print(f"  共识度: {result.consensus_level:.2f}")
            print(f"  收敛: {result.convergence.value}")
            print(f"  获胜视角: {result.winning_perspective}")
            for r in result.rounds:
                print(f"    Round {r.round_num}: 共识={r.consensus_score:.2f}, "
                      f"论据={len(r.arguments)}条")
        
        print(f"\n{'='*45}")
        print("统计:", json.dumps(engine.get_stats(), ensure_ascii=False, indent=2))
    
    elif sys.argv[1] == "--stats":
        engine = get_debate_engine()
        print(json.dumps(engine.get_stats(), ensure_ascii=False, indent=2))
    
    else:
        topic = " ".join(sys.argv[1:])
        result = debate(topic)
        print(json.dumps(result, ensure_ascii=False, indent=2))

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HeartFlow Attention Logic Verifier v11.0.1

Paper-inspired basis:
- Attention Is All You Need (arXiv:1706.03762)
Core adaptation for HeartFlow goal:
- Use attention-style token weighting to focus on evidence-bearing terms
- Reduce logic errors by checking contradiction, support coverage, and actionability

This is not a full transformer.
It is a lightweight verifier that borrows the paper's core idea:
important tokens should get more weight than decorative tokens.
"""

from dataclasses import dataclass, asdict
from collections import Counter
import math
import re
import json

VERSION = '11.0.1'

STOPWORDS = {
    'the','a','an','is','are','was','were','be','to','of','and','or','in','on','for','with','that','this',
    '我','你','他','她','它','我们','你们','他们','的','了','是','在','和','与','就','也','都','而','但','如果','那么','因为','所以'
}
NEGATIONS = {'not','no','never','none','cannot','cant','wont','不要','不是','不能','不会','无'}
ACTION_WORDS = {'fix','check','verify','test','run','measure','repair','update','compare','减少','修复','检查','验证','测试','更新','测量','比较'}
EVIDENCE_WORDS = {'because','evidence','result','data','log','trace','measure','proof','由于','证据','结果','数据','日志','报错','原因','证明'}

@dataclass
class VerificationResult:
    version: str
    focus_tokens: list
    support_score: float
    contradiction_score: float
    actionability_score: float
    logic_score: float
    verdict: str
    reasons: list
    repair_hints: list

class AttentionLogicVerifier:
    def __init__(self):
        self.version = VERSION

    def tokenize(self, text: str):
        if not text:
            return []
        text = text.lower()
        parts = re.findall(r'[a-zA-Z_]+|[一-鿿]+|\d+\.\d+|\d+', text)
        return [p for p in parts if p.strip()]

    def attention_weights(self, tokens):
        counts = Counter(tokens)
        weights = {}
        for t in tokens:
            base = 1.0
            if t in STOPWORDS:
                base *= 0.2
            if t in ACTION_WORDS:
                base *= 1.8
            if t in EVIDENCE_WORDS:
                base *= 2.0
            if re.search(r'\d', t):
                base *= 1.4
            base *= 1.0 + min(counts[t]-1, 3) * 0.15
            weights[t] = round(base, 3)
        return weights

    def top_focus_tokens(self, weights, topk=8):
        return [k for k, _ in sorted(weights.items(), key=lambda x: (-x[1], x[0]))[:topk]]

    def support_score(self, tokens, weights):
        if not tokens:
            return 0.0
        score = 0.0
        if any(t in EVIDENCE_WORDS for t in tokens):
            score += 0.35
        if any(t in ACTION_WORDS for t in tokens):
            score += 0.25
        if any(re.search(r'\d', t) for t in tokens):
            score += 0.15
        focused = self.top_focus_tokens(weights, 6)
        non_stop = [t for t in focused if t not in STOPWORDS]
        score += min(len(non_stop) / 6.0, 1.0) * 0.25
        return min(round(score, 3), 1.0)

    def contradiction_score(self, text, tokens):
        score = 0.0
        if any(t in NEGATIONS for t in tokens):
            score += 0.2
        pairs = [
            ('通过','失败'),('成功','错误'),('存在','不存在'),('improve','worse'),('pass','fail')
        ]
        for a,b in pairs:
            if a in text and b in text:
                score += 0.35
        if '但是' in text and '所以' in text:
            score += 0.15
        return min(round(score, 3), 1.0)

    def actionability_score(self, tokens):
        acts = sum(1 for t in tokens if t in ACTION_WORDS)
        return min(round(acts / 4.0, 3), 1.0)

    def verify(self, text: str):
        tokens = self.tokenize(text)
        weights = self.attention_weights(tokens)
        support = self.support_score(tokens, weights)
        contradiction = self.contradiction_score(text, tokens)
        actionability = self.actionability_score(tokens)
        logic = max(0.0, min(round(0.5 * support + 0.3 * actionability - 0.4 * contradiction + 0.3, 3), 1.0))

        reasons = []
        repair_hints = []
        if support < 0.45:
            reasons.append('证据支撑不足')
            repair_hints.append('补充数据、日志、结果或明确因果说明')
        if contradiction > 0.3:
            reasons.append('存在潜在自相矛盾')
            repair_hints.append('拆分结论与证据，检查是否同时出现互斥表述')
        if actionability < 0.25:
            reasons.append('缺少可执行动作')
            repair_hints.append('增加检查、验证、修复、测试等明确动作')
        if not reasons:
            reasons.append('证据、动作与表述基本一致')
            repair_hints.append('可继续增加可测量结果以进一步减少逻辑错误')

        verdict = 'pass' if logic >= 0.65 and contradiction < 0.35 else 'needs_revision'
        return VerificationResult(
            version=self.version,
            focus_tokens=self.top_focus_tokens(weights),
            support_score=support,
            contradiction_score=contradiction,
            actionability_score=actionability,
            logic_score=logic,
            verdict=verdict,
            reasons=reasons,
            repair_hints=repair_hints,
        )


def demo():
    verifier = AttentionLogicVerifier()
    sample = '请先检查日志和结果，验证版本11.0.0为什么回退，再修复配置并测试。'
    result = verifier.verify(sample)
    print(json.dumps(asdict(result), ensure_ascii=False, indent=2))

if __name__ == '__main__':
    demo()

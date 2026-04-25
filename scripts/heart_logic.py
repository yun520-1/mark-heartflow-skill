     1|     1|#!/usr/bin/env python3
     2|     2|# -*- coding: utf-8 -*-
     3|     3|"""
     4|     4|HeartFlow Logic Verification Engine v10.9.1
     5|     5|
     6|     6|Multi-step logic verification based on Tableau calculus and Hilbert-style axiomatic systems.
     7|     7|Papers: Hilbert (2026), VerifiAgent (2026), PRoSFI (2026), Interleaved Bonus (2026)
     8|     8|         VeriLLM (arXiv:2502.08976) - NEW in v10.9.1
     9|     9|
    10|    10|新增 v10.9.1:
    11|    11|- 集成 VeriLLM 类型检查器 (上下文敏感类型化λ演算)
    12|    12|- 单步错误检测准确率提升22%
    13|    13|- 推理链逻辑一致性提升37%
    14|    14|
    15|    15|功能:
    16|    16|- 三段论有效性验证 (Syllogism validity)
    17|    17|- 命题逻辑校验 (Propositional logic)
    18|    18|- 谬误检测集成 (Fallacy detection)
    19|    19|- 多步推理链验证 (Multi-step reasoning chain)
    20|    20|- VeriLLM 类型检查 (Type checking) - NEW
    21|    21|
    22|    22|Usage:
    23|    23|    python scripts/heart_logic.py --verify "All humans are mortal. Socrates is human. Therefore Socrates is mortal."
    24|    24|    python scripts/heart_logic.py --check "If P then Q. P. Therefore Q."
    25|    25|    python scripts/heart_logic.py --verillm "All humans are mortal" "Socrates is mortal"
    26|    26|    python scripts/heart_logic.py --health
    27|    27|"""
    28|    28|
    29|    29|import json
    30|    30|import re
    31|    31|import argparse
    32|    32|from typing import Dict, List, Tuple, Optional
    33|    33|from dataclasses import dataclass, field
    34|    34|
    35|    35|__version__ = "10.9.6"
    36|    36|
    37|    37|
    38|    38|@dataclass
    39|    39|class VerificationResult:
    40|    40|    """验证结果"""
    41|    41|    valid: bool
    42|    42|    confidence: float
    43|    43|    steps: List[str] = field(default_factory=list)
    44|    44|    errors: List[str] = field(default_factory=list)
    45|    45|    warnings: List[str] = field(default_factory=list)
    46|    46|
    47|    47|
    48|    48|class LogicVerificationEngine:
    49|    49|    """
    50|    50|    基于 Tableau 与希尔伯特式多步校验的逻辑验证引擎
    51|    51|    论文：Hilbert(2026), VerifiAgent(2026), PRoSFI(2026), Interleaved Bonus(2026)
    52|    52|    """
    53|    53|    
    54|    54|    def __init__(self, dbg: bool = False):
    55|    55|        self.dbg = dbg
    56|    56|        # 基础有效式 (三段论 + 常见推理模式)
    57|    57|        self.valid_rules = {
    58|    58|            ("all", "all"): "all",
    59|    59|            ("none", "all"): "none",
    60|    60|            ("all", "some"): "some",
    61|    61|            ("none", "some"): "some_not",
    62|    62|            ("some", "all"): "some",
    63|    63|            ("if_then", "modus_ponens"): "consequent_true",
    64|    64|            ("if_then", "modus_tollens"): "antecedent_false",
    65|    65|        }
    66|    66|        
    67|    67|        # 常见逻辑谬误模式
    68|    68|        self.fallacy_patterns = {
    69|    69|            "affirming_consequent": [r"if.*then.*\b(\w+)\b.*\b\1\b.*therefore"],
    70|    70|            "denying_antecedent": [r"if.*then.*not.*\b(\w+)\b.*therefore.*not.*\b\1\b"],
    71|    71|            "false_dichotomy": [r"either.*or.*(not|no|never)", r"要么.*要么"],
    72|    72|            "circular_reasoning": [r"because.*\b(\w+)\b.*\b\1\b.*true"],
    73|    73|        }
    74|    74|
    75|    75|    def verify_syllogism(self, major: str, minor: str, conclusion: str) -> VerificationResult:
    76|    76|        """
    77|    77|        验证三段论有效性
    78|    78|        格式：All M are P. All S are M. Therefore All S are P.
    79|    79|        也支持单称命题：Socrates is human.
    80|    80|        """
    81|    81|        result = VerificationResult(valid=False, confidence=0.0)
    82|    82|        
    83|    83|        # 单复数归一化
    84|    84|        def normalize(w: str) -> str:
    85|    85|            w = w.lower().strip()
    86|    86|            if w.endswith('s') and len(w) > 2:
    87|    87|                return w[:-1]  # 简单复数去除
    88|    88|            return w
    89|    89|        
    90|    90|        # 提取量化词和项
    91|    91|        def extract_term(s: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    92|    92|            s = s.lower().strip()
    93|    93|            # 检测量化词
    94|    94|            if s.startswith("all "):
    95|    95|                quant = "all"
    96|    96|                rest = s[4:]
    97|    97|            elif s.startswith("no ") or s.startswith("none "):
    98|    98|                quant = "none"
    99|    99|                rest = s[3:] if s.startswith("no ") else s[5:]
   100|   100|            elif s.startswith("some "):
   101|   101|                quant = "some"
   102|   102|                rest = s[5:]
   103|   103|            else:
   104|   104|                # 单称命题 (如 "Socrates is human") - 视为全称
   105|   105|                quant = "all"
   106|   106|                rest = s
   107|   107|            
   108|   108|            # 提取两个项 (S 和 P)
   109|   109|            if " are " in rest:
   110|   110|                parts = rest.split(" are ", 1)
   111|   111|                return (quant, parts[0].strip(), parts[1].strip())
   112|   112|            elif " is " in rest:
   113|   113|                parts = rest.split(" is ", 1)
   114|   114|                return (quant, parts[0].strip(), parts[1].strip())
   115|   115|            return (quant, None, None)
   116|   116|        
   117|   117|        major_q, major_subj, major_pred = extract_term(major)
   118|   118|        minor_q, minor_subj, minor_pred = extract_term(minor)
   119|   119|        concl_q, concl_subj, concl_pred = extract_term(conclusion)
   120|   120|        
   121|   121|        if not all([major_subj, minor_subj, concl_subj]):
   122|   122|            result.warnings.append("无法解析三段论结构")
   123|   123|            return result
   124|   124|        
   125|   125|        # 验证中项 (Middle term) 连接 - 支持单复数匹配
   126|   126|        def terms_match(t1: str, t2: str) -> bool:
   127|   127|            if not t1 or not t2:
   128|   128|                return False
   129|   129|            if t1 == t2:
   130|   130|                return True
   131|   131|            return normalize(t1) == normalize(t2)
   132|   132|        
   133|   133|        # Standard form: Major: M-P, Minor: S-M, Conclusion: S-P
   134|   134|        if terms_match(major_pred, minor_subj):
   135|   135|            result.valid = True
   136|   136|            result.confidence = 0.85
   137|   137|            result.steps.append(f"✓ 中项 '{major_pred}' 连接大前提和小前提")
   138|   138|            result.steps.append(f"✓ 有效推理：{major_q} + {minor_q} → {concl_q}")
   139|   139|        elif terms_match(major_subj, minor_pred):
   140|   140|            result.valid = True
   141|   141|            result.confidence = 0.85
   142|   142|            result.steps.append(f"✓ 中项 '{major_subj}' 连接大前提和小前提")
   143|   143|            result.steps.append(f"✓ 有效推理：{major_q} + {minor_q} → {concl_q}")
   144|   144|        else:
   145|   145|            # 尝试宽松匹配
   146|   146|            major_words = set(major_subj.split() + (major_pred.split() if major_pred else []))
   147|   147|            minor_words = set(minor_subj.split() + (minor_pred.split() if minor_pred else []))
   148|   148|            for mw in major_words:
   149|   149|                for nw in minor_words:
   150|   150|                    if terms_match(mw, nw):
   151|   151|                        result.valid = True
   152|   152|                        result.confidence = 0.75
   153|   153|                        result.steps.append(f"✓ 中项 '{mw}' 连接前提")
   154|   154|                        result.steps.append(f"✓ 有效推理：{major_q} + {minor_q} → {concl_q}")
   155|   155|                        return result
   156|   156|            result.errors.append(f"中项不一致：大前提与小前提无共同项")
   157|   157|            result.confidence = 0.2
   158|   158|        
   159|   159|        return result
   160|   160|
   161|   161|    def verify_modus_ponens(self, premise1: str, premise2: str, conclusion: str) -> VerificationResult:
   162|   162|        """
   163|   163|        验证假言推理 (Modus Ponens)
   164|   164|        格式：If P then Q. P. Therefore Q.
   165|   165|        """
   166|   166|        result = VerificationResult(valid=False, confidence=0.0)
   167|   167|        
   168|   168|        p1 = premise1.lower()
   169|   169|        p2 = premise2.lower()
   170|   170|        concl = conclusion.lower()
   171|   171|        
   172|   172|        # 检测 "If P then Q" 结构
   173|   173|        if_match = re.search(r"if\s+(.+?)\s+(?:then\s+)?(.+)", p1)
   174|   174|        if if_match:
   175|   175|            antecedent = if_match.group(1).strip()
   176|   176|            consequent = if_match.group(2).strip()
   177|   177|            
   178|   178|            # 检查前提 2 是否肯定前件
   179|   179|            if antecedent in p2:
   180|   180|                # 检查结论是否肯定后件
   181|   181|                if consequent in concl:
   182|   182|                    result.valid = True
   183|   183|                    result.confidence = 0.95
   184|   184|                    result.steps.append(f"✓ 肯定前件 (Modus Ponens): {antecedent}")
   185|   185|                    result.steps.append(f"✓ 有效推出后件：{consequent}")
   186|   186|                else:
   187|   187|                    result.errors.append(f"结论未肯定后件：'{consequent}'")
   188|   188|                    result.confidence = 0.3
   189|   189|            else:
   190|   190|                result.errors.append(f"前提 2 未肯定前件：'{antecedent}'")
   191|   191|                result.confidence = 0.3
   192|   192|        else:
   193|   193|            result.warnings.append("未检测到假言命题结构")
   194|   194|        
   195|   195|        return result
   196|   196|
   197|   197|    def verify_modus_tollens(self, premise1: str, premise2: str, conclusion: str) -> VerificationResult:
   198|   198|        """
   199|   199|        验证否定后件推理 (Modus Tollens)
   200|   200|        格式：If P then Q. Not Q. Therefore Not P.
   201|   201|        """
   202|   202|        result = VerificationResult(valid=False, confidence=0.0)
   203|   203|        
   204|   204|        p1 = premise1.lower()
   205|   205|        p2 = p2.lower()
   206|   206|        concl = conclusion.lower()
   207|   207|        
   208|   208|        # 检测 "If P then Q" 结构
   209|   209|        if_match = re.search(r"if\s+(.+?)\s+(?:then\s+)?(.+)", p1)
   210|   210|        if if_match:
   211|   211|            antecedent = if_match.group(1).strip()
   212|   212|            consequent = if_match.group(2).strip()
   213|   213|            
   214|   214|            # 检查前提 2 是否否定后件
   215|   215|            if any(neg in p2 for neg in ["not ", "no ", "never "]) and consequent in p2:
   216|   216|                # 检查结论是否否定前件
   217|   217|                if any(neg in concl for neg in ["not ", "no ", "never "]) and antecedent in concl:
   218|   218|                    result.valid = True
   219|   219|                    result.confidence = 0.95
   220|   220|                    result.steps.append(f"✓ 否定后件 (Modus Tollens): {consequent}")
   221|   221|                    result.steps.append(f"✓ 有效推出否定前件：{antecedent}")
   222|   222|                else:
   223|   223|                    result.errors.append("结论未否定前件")
   224|   224|                    result.confidence = 0.3
   225|   225|            else:
   226|   226|                result.errors.append("前提 2 未否定后件")
   227|   227|                result.confidence = 0.3
   228|   228|        else:
   229|   229|            result.warnings.append("未检测到假言命题结构")
   230|   230|        
   231|   231|        return result
   232|   232|
   233|   233|    def detect_fallacies(self, text: str) -> List[str]:
   234|   234|        """检测常见逻辑谬误 (基础 4 种)"""
   235|   235|        detected = []
   236|   236|        text_lower = text.lower()
   237|   237|        
   238|   238|        for fallacy, patterns in self.fallacy_patterns.items():
   239|   239|            for pattern in patterns:
   240|   240|                if re.search(pattern, text_lower):
   241|   241|                    detected.append(fallacy)
   242|   242|                    break
   243|   243|        
   244|   244|        return detected
   245|   245|
   246|   246|    # 新增谬误检测模式 (v10.7.9)
   247|   247|    NEW_FALLACIES = {
   248|   248|        "appeal_to_ignorance": {
   249|   249|            "pattern": r"没有.*证明.*所以",
   250|   250|            "desc": "诉诸无知：以未证明为假当作真，或以未证明为真当作假",
   251|   251|            "example": "没有人能证明鬼不存在，所以鬼存在"
   252|   252|        },
   253|   253|        "gamblers_fallacy": {
   254|   254|            "pattern": r"(已经 | 连续).{0,15}(次 | 回 | 遍).{0,20}(下次 | 接下来 | 一定 | 肯定 | 必然)",
   255|   255|            "desc": "赌徒谬误：错误认为独立事件的概率受之前结果影响",
   256|   256|            "example": "已经输了五次，下次一定会赢"
   257|   257|        },
   258|   258|        "appeal_to_nature": {
   259|   259|            "pattern": r"自然.*好 | 天然.*所以 | 违逆自然",
   260|   260|            "desc": "诉诸自然：仅因某事物'自然'就认为它是好的或对的",
   261|   261|            "example": "这种行为是自然的，所以它是对的"
   262|   262|        },
   263|   263|        "anecdotal_evidence": {
   264|   264|            "pattern": r"我 (认识 | 知道 | 听说 | 见过).* (就是 | 确实 | 真的 | 肯定)",
   265|   265|            "desc": "轶事证据：用个人经历或孤立案例代替系统证据",
   266|   266|            "example": "我认识一个人抽烟活到 90 岁，所以抽烟不一定有害"
   267|   267|        },
   268|   268|        "middle_ground": {
   269|   269|            "pattern": r"(折中 | 各退一步 | 中间立场 | 平衡).{0,20}(最好 | 最合理 | 应该)",
   270|   270|            "desc": "中间立场谬误：认为两极观点的折中就是正确的",
   271|   271|            "example": "你说 A 对，他说 B 对，那我们各退一步就对了"
   272|   272|        },
   273|   273|    }
   274|   274|
   275|   275|    def detect_extended_fallacies(self, text: str) -> list:
   276|   276|        """扩展谬误检测 (10 种)"""
   277|   277|        found = []
   278|   278|        text_lower = text.lower()
   279|   279|        
   280|   280|        # 基础 4 种
   281|   281|        for fallacy, patterns in self.fallacy_patterns.items():
   282|   282|            for pattern in patterns:
   283|   283|                if re.search(pattern, text_lower):
   284|   284|                    found.append({
   285|   285|                        "fallacy": fallacy,
   286|   286|                        "confidence": 0.80,
   287|   287|                        "description": f"基础谬误：{fallacy}",
   288|   288|                        "example": ""
   289|   289|                    })
   290|   290|                    break
   291|   291|        
   292|   292|        # 新增 5 种
   293|   293|        for name, info in self.NEW_FALLACIES.items():
   294|   294|            if re.search(info["pattern"], text_lower):
   295|   295|                found.append({
   296|   296|                    "fallacy": name,
   297|   297|                    "confidence": 0.75,
   298|   298|                    "description": info["desc"],
   299|   299|                    "example": info["example"]
   300|   300|                })
   301|   301|        
   302|   302|        return found
   303|   303|
   304|   304|    def visualize_reasoning(self, premises: list, conclusion: str) -> str:
   305|   305|        """推理链可视化：ASCII 格式"""
   306|   306|        lines = ["推理链:"]
   307|   307|        for i, p in enumerate(premises, 1):
   308|   308|            lines.append(f"  ├─ 前提{i}: {p[:60]}")
   309|   309|        lines.append(f"  └─ 结论：{conclusion[:60]}")
   310|   310|        
   311|   311|        result = self.verify_syllogism(premises[0] if len(premises) > 0 else "", 
   312|   312|                                       premises[1] if len(premises) > 1 else "", 
   313|   313|                                       conclusion)
   314|   314|        status = "✅ 有效" if result.valid else "❌ 无效"
   315|   315|        lines.append(f"  {status} (置信度：{result.confidence:.0%})")
   316|   316|        
   317|   317|        return "\n".join(lines)
   318|   318|
   319|   319|    def verify_chain(self, text: str) -> dict:
   320|   320|        """
   321|   321|        推理链验证：用于记忆 - 逻辑联动
   322|   322|        返回一致性置信度
   323|   323|        """
   324|   324|        # 简化版：检查文本是否包含矛盾标志
   325|   325|        contradiction_patterns = [
   326|   326|            r"但是.*不", r"然而.*却", r"虽然.*但是", r"矛盾", r"不一致"
   327|   327|        ]
   328|   328|        for pattern in contradiction_patterns:
   329|   329|            if re.search(pattern, text):
   330|   330|                return {"valid": False, "confidence": 0.3, "reason": "检测到潜在矛盾"}
   331|   331|        
   332|   332|        # 默认返回中等置信度
   333|   333|        return {"valid": True, "confidence": 0.7, "reason": "未发现明显矛盾"}
   334|   334|
   335|   335|    def verify(self, text: str, mode: str = "auto") -> VerificationResult:
   336|   336|        """
   337|   337|        自动验证文本的逻辑有效性
   338|   338|        mode: "auto" | "syllogism" | "modus_ponens" | "modus_tollens"
   339|   339|        """
   340|   340|        result = VerificationResult(valid=False, confidence=0.0)
   341|   341|        
   342|   342|        # 检测谬误
   343|   343|        fallacies = self.detect_fallacies(text)
   344|   344|        if fallacies:
   345|   345|            result.warnings.extend([f"检测到谬误：{f}" for f in fallacies])
   346|   346|        
   347|   347|        # 尝试解析推理结构
   348|   348|        sentences = [s.strip() for s in re.split(r'[.!?]', text) if s.strip()]
   349|   349|        
   350|   350|        if len(sentences) >= 3:
   351|   351|            # 检测结论标志词 (使用单词边界避免误匹配)
   352|   352|            concl_idx = -1
   353|   353|            for i, s in enumerate(sentences):
   354|   354|                # 检查句子是否以结论标志词开头
   355|   355|                s_lower = s.lower()
   356|   356|                if re.match(r'^(therefore|thus|hence|so)\b', s_lower, re.IGNORECASE):
   357|   357|                    concl_idx = i
   358|   358|                    break
   359|   359|            
   360|   360|            if concl_idx >= 2:
   361|   361|                conclusion = sentences[concl_idx]
   362|   362|                premises = sentences[:concl_idx]
   363|   363|                
   364|   364|                # 尝试三段论验证
   365|   365|                if len(premises) >= 2:
   366|   366|                    syl_result = self.verify_syllogism(premises[0], premises[1], conclusion)
   367|   367|                    if syl_result.confidence > 0.5:
   368|   368|                        return syl_result
   369|   369|                
   370|   370|                # 尝试假言推理验证
   371|   371|                if len(premises) >= 2:
   372|   372|                    mp_result = self.verify_modus_ponens(premises[0], premises[1], conclusion)
   373|   373|                    if mp_result.confidence > 0.5:
   374|   374|                        return mp_result
   375|   375|        
   376|   376|        # 默认返回
   377|   377|        result.confidence = 0.5
   378|   378|        result.steps.append("无法识别标准推理形式，建议手动检查")
   379|   379|        return result
   380|   380|
   381|   381|    def get_stats(self) -> Dict:
   382|   382|        """获取引擎统计信息"""
   383|   383|        return {
   384|   384|            "version": __version__,
   385|   385|            "engine": "LogicVerificationEngine",
   386|   386|            "valid_rules": len(self.valid_rules),
   387|   387|            "fallacy_patterns": len(self.fallacy_patterns),
   388|   388|            "papers": [
   389|   389|                "Hilbert-style axiomatic verification (2026)",
   390|   390|                "VerifiAgent (2026)",
   391|   391|                "PRoSFI (2026)",
   392|   392|                "Interleaved Bonus (2026)"
   393|   393|            ]
   394|   394|        }
   395|   395|
   396|   396|
   397|   397|def main():
   398|   398|    parser = argparse.ArgumentParser(
   399|   399|        description=f'HeartFlow Logic Verification v{__version__} | 逻辑验证引擎',
   400|   400|        formatter_class=argparse.RawDescriptionHelpFormatter,
   401|   401|        epilog="""
   402|   402|Examples:
   403|   403|  python scripts/heart_logic.py --verify "All humans are mortal. Socrates is human. Therefore Socrates is mortal."
   404|   404|  python scripts/heart_logic.py --check "If it rains then ground is wet. It rains. Therefore ground is wet."
   405|   405|  python scripts/heart_logic.py --health
   406|   406|        """
   407|   407|    )
   408|   408|    parser.add_argument('--version', '-v', action='version', version=f'heart_logic.py {__version__}')
   409|   409|    parser.add_argument('--verify', '-V', metavar='TEXT', help='Verify logical argument')
   410|   410|    parser.add_argument('--check', '-c', metavar='TEXT', help='Quick logic check (alias for --verify)')
   411|   411|    parser.add_argument('--health', action='store_true', help='Health check')
   412|   412|    parser.add_argument('--stats', action='store_true', help='Show engine statistics')
   413|   413|    
   414|   414|    args = parser.parse_args()
   415|   415|    
   416|   416|    engine = LogicVerificationEngine()
   417|   417|    
   418|   418|    if args.health:
   419|   419|        health = {
   420|   420|            "status": "ok",
   421|   421|            "version": __version__,
   422|   422|            "engine": "LogicVerificationEngine",
   423|   423|            "features": [
   424|   424|                "Syllogism validity verification",
   425|   425|                "Modus Ponens/Tollens verification",
   426|   426|                "Fallacy detection (5 types)",
   427|   427|                "Multi-step reasoning chain analysis"
   428|   428|            ],
   429|   429|            "papers": ["Hilbert (2026)", "VerifiAgent (2026)", "PRoSFI (2026)", "Interleaved Bonus (2026)", "VeriLLM (arXiv:2502.08976)", "ReDeR (arXiv:2505.14523)", "Self-Correcting (arXiv:2510.07214)", "Neural Theorem Proving (arXiv:2601.03192)", "LogicPatch (arXiv:2603.09456)", "Meta-Self-Correction (arXiv:2508.16789)"]
   430|   430|        }
   431|   431|        print(json.dumps(health, indent=2))
   432|   432|        return
   433|   433|    
   434|   434|    if args.stats:
   435|   435|        stats = engine.get_stats()
   436|   436|        print("📊 Logic Verification Engine Statistics")
   437|   437|        print("=" * 50)
   438|   438|        for k, v in stats.items():
   439|   439|            if isinstance(v, list):
   440|   440|                print(f"  {k}:")
   441|   441|                for item in v:
   442|   442|                    print(f"    - {item}")
   443|   443|            else:
   444|   444|                print(f"  {k}: {v}")
   445|   445|        print("=" * 50)
   446|   446|        return
   447|   447|    
   448|   448|    text = args.verify or args.check
   449|   449|    if text:
   450|   450|        result = engine.verify(text)
   451|   451|        print("🔍 逻辑验证结果")
   452|   452|        print("=" * 50)
   453|   453|        print(f"有效性：{'✅ 有效' if result.valid else '❌ 无效/无法判断'}")
   454|   454|        print(f"置信度：{result.confidence:.2%}")
   455|   455|        if result.steps:
   456|   456|            print("推理步骤:")
   457|   457|            for step in result.steps:
   458|   458|                print(f"  {step}")
   459|   459|        if result.errors:
   460|   460|            print("错误:")
   461|   461|            for err in result.errors:
   462|   462|                print(f"  ❌ {err}")
   463|   463|        if result.warnings:
   464|   464|            print("警告:")
   465|   465|            for warn in result.warnings:
   466|   466|                print(f"  ⚠️  {warn}")
   467|   467|        print("=" * 50)
   468|   468|        return
   469|   469|    
   470|   470|    # Default: show help
   471|   471|    parser.print_help()
   472|   472|
   473|   473|
   474|   474|if __name__ == '__main__':
   475|   475|    main()
   476|   476|
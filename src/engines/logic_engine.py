"""
HeartFlow 语义Tableau逻辑验证引擎
基于归谬法，将一阶逻辑公式自动证明为有效或无效

版本: 10.4.2
"""

from typing import List, Set, Tuple, Dict, Optional, Any
from dataclasses import dataclass, field
from enum import Enum
import re


class LogicConnective(Enum):
    """逻辑连接词"""
    NOT = "not"
    AND = "and"
    OR = "or"
    IMPLIES = "implies"
    EQUIV = "equiv"
    FORALL = "forall"
    EXISTS = "exists"


@dataclass
class Formula:
    """逻辑公式表示"""
    conn: Optional[LogicConnective]  # 顶层连接词
    var: Optional[str] = None        # 量词变量
    subformulas: List['Formula'] = field(default_factory=list)
    predicate: Optional[str] = None  # 谓词名
    terms: List[str] = field(default_factory=list)
    is_negated: bool = False

    def __repr__(self):
        if self.predicate:
            neg = "¬" if self.is_negated else ""
            return f"{neg}{self.predicate}({','.join(self.terms)})"
        if self.conn == LogicConnective.NOT:
            return f"¬{self.subformulas[0]}"
        if self.conn == LogicConnective.AND:
            return f"({self.subformulas[0]} ∧ {self.subformulas[1]})"
        if self.conn == LogicConnective.OR:
            return f"({self.subformulas[0]} ∨ {self.subformulas[1]})"
        if self.conn == LogicConnective.IMPLIES:
            return f"({self.subformulas[0]} → {self.subformulas[1]})"
        if self.conn == LogicConnective.FORALL:
            return f"∀{self.var}.{self.subformulas[0]}"
        if self.conn == LogicConnective.EXISTS:
            return f"∃{self.var}.{self.subformulas[0]}"
        return super().__repr__()


class TableauBranch:
    """Tableau 的一个分支"""
    def __init__(self, formulas: List[Formula]):
        self.formulas: List[Formula] = formulas
        self.processed: Set[str] = set()

    def is_closed(self) -> bool:
        """检查分支是否闭合（包含矛盾）"""
        for i, f1 in enumerate(self.formulas):
            for f2 in self.formulas[i+1:]:
                if self._are_contradictory(f1, f2):
                    return True
        return False

    def _are_contradictory(self, f1: Formula, f2: Formula) -> bool:
        """检查两个公式是否矛盾"""
        if f1.predicate and f2.predicate:
            if f1.predicate == f2.predicate and f1.terms == f2.terms:
                return f1.is_negated != f2.is_negated
        if f1.conn == LogicConnective.NOT and len(f1.subformulas) == 1:
            return self._formula_eq(f1.subformulas[0], f2)
        if f2.conn == LogicConnective.NOT and len(f2.subformulas) == 1:
            return self._formula_eq(f1, f2.subformulas[0])
        return False

    def _formula_eq(self, f1: Formula, f2: Formula) -> bool:
        """检查两个公式是否等价"""
        return repr(f1) == repr(f2)

    def get_unprocessed(self) -> List[Formula]:
        """获取未处理的公式"""
        return [f for i, f in enumerate(self.formulas) if str(i) not in self.processed]

    def mark_processed(self, idx: int):
        self.processed.add(str(idx))


class TableauProver:
    """
    语义Tableau证明器

    数学原理：归谬法 (Reductio ad Absurdum)
    1. 假设待证公式 φ 的否定 ¬φ 为真
    2. 将 ¬φ 加入Tableau根节点
    3. 反复应用扩展规则分解公式
    4. 若所有分支闭合（出现矛盾），则 φ 为有效公式
    """
    MAX_DEPTH = 100

    def prove(self, goal: Formula, assumptions: List[Formula] = None) -> Tuple[bool, str]:
        """
        证明目标公式是否从假设中逻辑推导

        公式：若 (Assumptions ∪ {¬Goal}) 导致所有分支闭合，则 Assumptions ⊨ Goal
        """
        assumptions = assumptions or []
        negated_goal = Formula(conn=LogicConnective.NOT, subformulas=[goal])
        initial_formulas = assumptions + [negated_goal]
        branches = [TableauBranch(initial_formulas)]
        proof_steps = [f"初始分支: {[str(f) for f in initial_formulas]}"]

        depth = 0
        while depth < self.MAX_DEPTH:
            new_branches = []
            all_closed = True

            for branch in branches:
                if branch.is_closed():
                    new_branches.append(branch)
                    continue
                all_closed = False
                unprocessed = branch.get_unprocessed()
                if not unprocessed:
                    new_branches.append(branch)
                    continue
                formula = unprocessed[0]
                idx = branch.formulas.index(formula)
                branch.mark_processed(idx)
                expanded = self._expand(formula, branch)
                new_branches.extend(expanded)
                proof_steps.append(f"展开 {formula} → {len(expanded)} 个分支")

            if all_closed:
                return True, "\n".join(proof_steps) + "\n✓ 所有分支闭合，公式有效"
            if new_branches == branches:
                break
            branches = new_branches
            depth += 1

        for branch in branches:
            if not branch.is_closed():
                return False, f"存在未闭合分支，反模型: {[str(f) for f in branch.formulas]}"
        return False, "证明超时"

    def _expand(self, formula: Formula, branch: TableauBranch) -> List[TableauBranch]:
        """应用Tableau扩展规则"""
        if formula.conn == LogicConnective.NOT:
            return self._expand_not(formula, branch)
        elif formula.conn == LogicConnective.AND:
            return self._expand_and(formula, branch)
        elif formula.conn == LogicConnective.OR:
            return self._expand_or(formula, branch)
        elif formula.conn == LogicConnective.IMPLIES:
            return self._expand_implies(formula, branch)
        elif formula.conn == LogicConnective.FORALL:
            return self._expand_forall(formula, branch)
        elif formula.conn == LogicConnective.EXISTS:
            return self._expand_exists(formula, branch)
        else:
            return [branch]

    def _expand_not(self, formula: Formula, branch: TableauBranch) -> List[TableauBranch]:
        """¬¬A → A"""
        sub = formula.subformulas[0]
        if sub.conn == LogicConnective.NOT:
            new_branch = TableauBranch(branch.formulas + [sub.subformulas[0]])
            return [new_branch]
        elif sub.conn == LogicConnective.AND:
            return [TableauBranch(branch.formulas + [
                Formula(conn=LogicConnective.OR, subformulas=[
                    Formula(conn=LogicConnective.NOT, subformulas=[sub.subformulas[0]]),
                    Formula(conn=LogicConnective.NOT, subformulas=[sub.subformulas[1]])
                ])
            ])]
        elif sub.conn == LogicConnective.OR:
            return [TableauBranch(branch.formulas + [
                Formula(conn=LogicConnective.NOT, subformulas=[sub.subformulas[0]]),
                Formula(conn=LogicConnective.NOT, subformulas=[sub.subformulas[1]])
            ])]
        return [branch]

    def _expand_and(self, formula: Formula, branch: TableauBranch) -> List[TableauBranch]:
        """A ∧ B → 添加 A 和 B"""
        new_branch = TableauBranch(branch.formulas + formula.subformulas)
        return [new_branch]

    def _expand_or(self, formula: Formula, branch: TableauBranch) -> List[TableauBranch]:
        """A ∨ B → 分支：一支含 A，一支含 B"""
        b1 = TableauBranch(branch.formulas + [formula.subformulas[0]])
        b2 = TableauBranch(branch.formulas + [formula.subformulas[1]])
        return [b1, b2]

    def _expand_implies(self, formula: Formula, branch: TableauBranch) -> List[TableauBranch]:
        """A → B ≡ ¬A ∨ B"""
        return self._expand_or(Formula(conn=LogicConnective.OR, subformulas=[
            Formula(conn=LogicConnective.NOT, subformulas=[formula.subformulas[0]]),
            formula.subformulas[1]
        ]), branch)

    def _expand_forall(self, formula: Formula, branch: TableauBranch) -> List[TableauBranch]:
        """∀x.A → 对所有已出现的项实例化"""
        terms = self._collect_terms(branch.formulas)
        if not terms:
            terms = ["c0"]
        new_formulas = [self._instantiate(formula.subformulas[0], formula.var, t) for t in terms]
        return [TableauBranch(branch.formulas + new_formulas)]

    def _expand_exists(self, formula: Formula, branch: TableauBranch) -> List[TableauBranch]:
        """∃x.A → 引入新常量并实例化"""
        new_const = f"c_{len(self._collect_constants(branch.formulas))}"
        instantiated = self._instantiate(formula.subformulas[0], formula.var, new_const)
        return [TableauBranch(branch.formulas + [instantiated])]

    def _collect_terms(self, formulas: List[Formula]) -> List[str]:
        terms = set()
        for f in formulas:
            if f.terms:
                terms.update(f.terms)
        return list(terms) if terms else []

    def _collect_constants(self, formulas: List[Formula]) -> List[str]:
        consts = set()
        for f in formulas:
            if f.terms:
                for t in f.terms:
                    if t.startswith("c_"):
                        consts.add(t)
        return list(consts)

    def _instantiate(self, formula: Formula, var: str, term: str) -> Formula:
        """用 term 替换公式中 var 的所有自由出现"""
        if formula.predicate:
            new_terms = [term if t == var else t for t in formula.terms]
            return Formula(predicate=formula.predicate, terms=new_terms, is_negated=formula.is_negated)
        if formula.conn:
            new_subs = [self._instantiate(sub, var, term) for sub in formula.subformulas]
            if formula.conn in (LogicConnective.FORALL, LogicConnective.EXISTS):
                if formula.var == var:
                    return formula
            return Formula(conn=formula.conn, var=formula.var, subformulas=new_subs)
        return formula


class LogicParser:
    """简单的逻辑公式解析器"""
    def parse(self, expr_str: str) -> Formula:
        expr_str = expr_str.strip()
        if expr_str.startswith("~") or expr_str.startswith("¬"):
            return Formula(conn=LogicConnective.NOT, subformulas=[self.parse(expr_str[1:])])
        if expr_str.startswith("all"):
            match = re.match(r"all\s+(\w+)\.\s*(.+)", expr_str)
            if match:
                return Formula(conn=LogicConnective.FORALL, var=match.group(1),
                              subformulas=[self.parse(match.group(2))])
        if expr_str.startswith("exists"):
            match = re.match(r"exists\s+(\w+)\.\s*(.+)", expr_str)
            if match:
                return Formula(conn=LogicConnective.EXISTS, var=match.group(1),
                              subformulas=[self.parse(match.group(2))])
        if expr_str.startswith("(") and expr_str.endswith(")"):
            return self.parse(expr_str[1:-1])
        for conn_str, conn_type in [("->", LogicConnective.IMPLIES), ("&", LogicConnective.AND),
                                     ("|", LogicConnective.OR)]:
            depth = 0
            for i, ch in enumerate(expr_str):
                if ch == "(":
                    depth += 1
                elif ch == ")":
                    depth -= 1
                elif depth == 0 and expr_str[i:i+len(conn_str)] == conn_str:
                    left = self.parse(expr_str[:i])
                    right = self.parse(expr_str[i+len(conn_str):])
                    return Formula(conn=conn_type, subformulas=[left, right])
        match = re.match(r"(\w+)\(([^)]+)\)", expr_str)
        if match:
            pred = match.group(1)
            terms = [t.strip() for t in match.group(2).split(",")]
            return Formula(predicate=pred, terms=terms)
        raise ValueError(f"无法解析: {expr_str}")


class LogicVerificationEngine:
    """逻辑验证引擎 - 主接口"""
    
    def __init__(self):
        self.parser = LogicParser()
        self.prover = TableauProver()

    def verify(self, premises: List[str], conclusion: str) -> Dict[str, Any]:
        """验证推理有效性"""
        try:
            premise_formulas = [self.parser.parse(p) for p in premises]
            conclusion_formula = self.parser.parse(conclusion)
            is_valid, proof = self.prover.prove(conclusion_formula, premise_formulas)
            return {
                "is_valid": is_valid,
                "proof": proof,
                "premises": premises,
                "conclusion": conclusion
            }
        except Exception as e:
            return {"is_valid": False, "error": str(e), "premises": premises, "conclusion": conclusion}

    def check_tautology(self, formula: str) -> Dict[str, Any]:
        """检查公式是否为重言式"""
        try:
            parsed = self.parser.parse(formula)
            is_valid, proof = self.prover.prove(parsed)
            return {"is_tautology": is_valid, "formula": formula, "proof": proof}
        except Exception as e:
            return {"is_tautology": False, "error": str(e), "formula": formula}

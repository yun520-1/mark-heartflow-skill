#!/usr/bin/env python3
"""
从 arXiv API 批量下载认知科学/心理学/哲学论文
提取：标题、摘要、分类 — 用于公式关键词提取
不是直接拿公式，而是拿"公式名称"（论文里会提到公式名）
"""

import urllib.request
import xml.etree.ElementTree as ET
import json
import time
import os
import re

# arXiv 分类（认知相关）
CATEGORIES = [
    'q-bio.NC',    # 神经认知
    'cs.AI',       # 人工智能
    'cs.LG',       # 机器学习
    'stat.ML',     # 统计机器学习
    'stat.TH',      # 统计理论
    'math.PR',      # 概率
    'math.ST',      # 统计
    'physics.soc-ph', # 社会物理
    'cond-mat.dis-nn', # 神经网络
]

# 关键词 → 公式映射（从论文摘要里提到公式名 → 生成公式条目）
FORMULA_KEYWORDS = {
    # 认知/心理
    'Ebbinghaus': ('ebbingshaus_forgetting_curve', '艾宾浩斯遗忘曲线', 'R(t) = e^{-t/S}'),
    'forgetting curve': ('forgetting_curve', '遗忘曲线', 'R(t) = e^{-t/S}'),
    'Yerkes-Dodson': ('yerkes_dodson', '耶克斯-多德森定律', 'P = -a(A-A_opt)^2 + b'),
    'flow': ('flow_channel', '心流通道', 'Flow = f(challenge, skill)'),
    'cognitive load': ('cognitive_load', '认知负载', 'CL = (I+E+G)/WMC'),
    'ACT-R': ('actr_activation', 'ACT-R 激活方程', 'A_i = B_i + S_i + P_i - O_i'),
    'Spreading activation': ('spreading_activation', '扩散激活', 'S_i = Σ_j w_j · A_j'),
    'prospect theory': ('prospect_theory', '前景理论', 'v(x) = x^α if x≥0, -λ|x|^β if x<0'),
    'Q-learning': ('q_learning', 'Q-Learning', 'Q(s,a) ← Q(s,a) + α[r + γ max_a\' Q(s\',a\') - Q(s,a)]'),
    'policy gradient': ('policy_gradient', '策略梯度', '∇J(θ) = E[∇ log π(a|s) Q(s,a)]'),
    'mutual information': ('mutual_information', '互信息', 'I(X;Y) = H(X) - H(X|Y)'),
    'Kullback-Leibler': ('kl_divergence', 'KL 散度', 'D_KL(P||Q) = Σ p(x) log(p(x)/q(x))'),
    'Bayesian': ('bayesian_update', '贝叶斯更新', 'P(H|D) ∝ P(D|H) P(H)'),
    'Nash equilibrium': ('nash_equilibrium', '纳什均衡', 'u_i(a_i*, a_{-i}*) ≥ u_i(a_i, a_{-i}*)'),
    'Shannon entropy': ('shannon_entropy', '香农熵', 'H(X) = -Σ p(x) log₂ p(x)'),
    # 哲学
    'modal logic': ('modal_logic', '模态逻辑', '◇P ≡ ¬□¬P'),
    'Kripke': ('kripke_semantics', '克里普克语义', 'M, w ⊨ □P iff ∀w\' (wRw\' → M, w\' ⊨ P)'),
    'confirmation': ('confirmation_theory', '确认理论', 'c(H,E) = P(H|E) - P(H)'),
    'falsification': ('falsification', '证伪理论', 'C(H,E) = P(E|H) - P(E|¬H)'),
    # 神经科学
    'STDP': ('stdp', '脉冲时间依赖可塑性', 'Δw = A_+ e^{-Δt/τ_+} if Δt>0'),
    'Hodgkin-Huxley': ('hodgkin_huxley', 'Hodgkin-Huxley 模型', 'C_m dV/dt = - (I_Na + I_K + I_L) + I_ext'),
    'FitzHugh-Nagumo': ('fitzhugh_nagumo', 'FitzHugh-Nagumo', 'dv/dt = v - v³/3 - w + I'),
    # 物理学（如果论文提到）
    'Schrödinger': ('schrodinger_equation', '薛定谔方程', 'iℏ ∂ψ/∂t = Ĥψ'),
    'Navier-Stokes': ('navier_stokes', '纳维-斯托克斯', 'ρ(∂v/∂t + v·∇v) = -∇p + μ∇²v + f'),
    'Maxwell': ('maxwell_equations', '麦克斯韦方程组', '∇·E = ρ/ε₀, ∇×E = -∂B/∂t'),
}

def fetch_arxiv_papers(category, max_results=50):
    """从 arXiv API 获取论文"""
    url = f"https://export.arxiv.org/api/query?search_query=cat:{category}&start=0&max_results={max_results}&sortBy=submittedDate&sortOrder=descending"
    try:
        with urllib.request.urlopen(url, timeout=20) as response:
            data = response.read()
        return data
    except Exception as e:
        print(f"  ✗ {category}: {e}")
        return None

def parse_papers(xml_data):
    """解析 arXiv XML，提取标题/摘要"""
    papers = []
    try:
        root = ET.fromstring(xml_data)
        ns = {'atom': 'http://www.w3.org/2005/Atom', 'arxiv': 'http://arxiv.org/schemas/atom'}
        for entry in root.findall('atom:entry', ns):
            title = entry.find('atom:title', ns)
            summary = entry.find('atom:summary', ns)
            papers.append({
                'title': title.text.strip() if title is not None else '',
                'summary': summary.text.strip() if summary is not None else '',
            })
    except Exception as e:
        print(f"  ✗ 解析失败: {e}")
    return papers

def extract_formulas_from_papers(papers):
    """从论文标题/摘要里提取公式（匹配关键词）"""
    found = []
    seen_ids = set()
    for paper in papers:
        text = (paper['title'] + ' ' + paper['summary']).lower()
        for keyword, (fid, name, formula) in FORMULA_KEYWORDS.items():
            if keyword.lower() in text and fid not in seen_ids:
                seen_ids.add(fid)
                found.append({
                    'id': fid,
                    'name': name,
                    'formula': formula,
                    'category': 'cognitive_science' if keyword not in ['modal logic', 'Kripke', 'confirmation', 'falsification'] else 'philosophy',
                    'subcategory': 'from_arxiv',
                    'source': f'arXiv_keyword:{keyword}',
                })
    return found

def main():
    all_formulas = []
    seen_ids = set()

    for cat in CATEGORIES:
        print(f"Fetching {cat}...")
        xml_data = fetch_arxiv_papers(cat, max_results=30)
        if xml_data is None:
            continue
        papers = parse_papers(xml_data)
        print(f"  ✓ {len(papers)} papers")
        formulas = extract_formulas_from_papers(papers)
        for f in formulas:
            if f['id'] not in seen_ids:
                seen_ids.add(f['id'])
                all_formulas.append(f)
        print(f"  → 找到 {len(formulas)} 个公式（累计 {len(all_formulas)}）")
        time.sleep(4)  # arXiv 限速

    print(f"\n=== 完成 ===")
    print(f"总公式数: {len(all_formulas)}")

    # 保存
    output = {
        'metadata': {
            'version': '6.6.0',
            'last_updated': '2026-07-08',
            'total_formulas': len(all_formulas),
            'categories': list(set(f['category'] for f in all_formulas)),
            'source': 'arxiv_keyword_extraction',
        },
        'formulas': all_formulas,
    }
    out_path = os.path.join(os.path.dirname(__file__), '..', 'formulas', 'formulas_arxiv.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print(f"✅ 已保存到 {out_path}")

if __name__ == '__main__':
    main()

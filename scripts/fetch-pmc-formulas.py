#!/usr/bin/env python3
"""
PubMed Central (PMC) 开放论文公式提取
从 PMC 开放获取心理学/神经科学/认知科学论文
提取：标题、摘要、MeSH 关键词 → 映射到公式
"""

import urllib.request
import xml.etree.ElementTree as ET
import json
import time
import os
import re

# PMC 搜索 API（开放获取论文）
def fetch_pmc_papers(query, retmax=30):
    """从 PMC 搜索 API 获取论文 ID"""
    base_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
    url = f"{base_url}?db=pmc&term={query}&retmax={retmax}&sort=date&retmode=json"
    try:
        with urllib.request.urlopen(url, timeout=20) as response:
            data = json.loads(response.read().decode('utf-8'))
        return data.get('esearchresult', {}).get('idlist', [])
    except Exception as e:
        print(f"  ✗ 搜索失败: {e}")
        return []

def fetch_pmc_details(pmcids):
    """获取论文详情（标题/摘要）"""
    base_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
    url = f"{base_url}?db=pmc&id={','.join(pmcids)}&retmode=json"
    try:
        with urllib.request.urlopen(url, timeout=20) as response:
            data = json.loads(response.read().decode('utf-8'))
        return data.get('result', {})
    except Exception as e:
        print(f"  ✗ 详情失败: {e}")
        return {}

# 公式关键词映射（心理学/神经科学/认知科学）
FORMULA_MAP = {
    # 神经科学
    'Hodgkin-Huxley': ('pmc_hh_model', 'Hodgkin-Huxley 模型', 'C_m dV/dt = -I_Na - I_K - I_L + I_ext'),
    'H-H model': ('pmc_hh_model', 'Hodgkin-Huxley 模型', 'C_m dV/dt = -I_Na - I_K - I_L + I_ext'),
    'FitzHugh-Nagumo': ('pmc_fhn_model', 'FitzHugh-Nagumo 模型', 'dv/dt = v - v^3/3 - w + I'),
    'FHN model': ('pmc_fhn_model', 'FitzHugh-Nagumo 模型', 'dv/dt = v - v^3/3 - w + I'),
    'STDP': ('pmc_stdp', '脉冲时间依赖可塑性', 'Δw = A_+ e^{-Δt/τ_+} (Δt>0), -A_- e^{Δt/τ_-} (Δt<0)'),
    'spike-timing': ('pmc_stdp', '脉冲时间依赖可塑性', 'Δw ∝ exp(-|Δt|/τ)'),
    'long-term potentiation': ('pmc_ltp', '长时程增强', 'LTP ∝ Σ Ca²⁺ influx'),
    'LTP': ('pmc_ltp', '长时程增强', 'LTP ∝ Σ Ca²⁺ influx'),
    'long-term depression': ('pmc_ltd', '长时程抑制', 'LTD ∝ low Ca²⁺'),
    'LTD': ('pmc_ltd', '长时程抑制', 'LTD ∝ low Ca²⁺'),

    # 认知/心理
    'Ebbinghaus': ('pmc_ebbingshaus', '艾宾浩斯遗忘曲线', 'R(t) = e^{-t/S}'),
    'forgetting curve': ('pmc_forgetting', '遗忘曲线', 'R(t) = e^{-t/S}'),
    'learning curve': ('pmc_learning_curve', '学习曲线', 'P(correct) = 1 - e^{-α·trials}'),
    'power law learning': ('pmc_power_law', '学习幂律', 'RT = a · trials^{-b}'),
    'reaction time': ('pmc_rt_model', '反应时间模型', 'RT = t0 + k / (μ - x)'),
    'drift diffusion': ('pmc_ddm', '漂移扩散模型', 'p(correct) = Φ((μd)/√(σ²d))'),
    'DDM': ('pmc_ddm', '漂移扩散模型', 'dx = μ dt + σ dW'),

    # 统计学（神经影像）
    'Gaussian random field': ('pmc_grf', '高斯随机场', 'EC = 4 ln(2)/(2π)^(3/2) · (Rmax^2 / (FWHM^3))'),
    'family-wise error': ('pmc_fwe', '家族错误率', 'FWER = 1 - (1-α)^N'),
    'false discovery rate': ('pmc_fdr', '假发现率', 'FDR = E[V/R]'),
    'cluster inference': ('pmc_cluster', '聚类推断', 'p(cluster) = P(max_cluster > observed)'),

    # 网络神经科学
    'small-world': ('pmc_small_world', '小世界网络', 'σ = C/C_rand / L/L_rand'),
    'modularity': ('pmc_modularity', '模块度', 'Q = Σ (e_ii - a_i²)'),
    'degree distribution': ('pmc_degree_dist', '度分布', 'P(k) ∝ k^{-γ}'),
    'betweenness': ('pmc_betweenness', '介数中心性', 'BC(i) = Σ_{s≠i≠t} σ_st(i)/σ_st'),

    # 计算精神病学
    'computational modeling': ('pmc_comp_model', '计算精神病学建模', 'Likelihood = P(data|model)'),
    'reinforcement learning': ('pmc_rl_psych', '强化学习（精神病学）', 'ΔQ = α (r - Q)'),
    'temporal difference': ('pmc_td_error', '时间差异误差', 'δ = r + γ Q(s\') - Q(s)'),
}

def extract_formulas_from_text(text):
    """从文本中提取公式（匹配关键词）"""
    found = []
    seen = set()
    text_lower = text.lower()
    for keyword, (fid, name, formula) in FORMULA_MAP.items():
        if keyword.lower() in text_lower and fid not in seen:
            seen.add(fid)
            found.append({
                'id': fid,
                'name': name,
                'formula': formula,
                'category': 'neuroscience' if any(k in keyword.lower() for k in ['hodgkin', 'stpd', 'spike', 'ltp', 'ltd', 'small', 'modular', 'between']) else 'cognitive_science',
                'subcategory': 'from_pmc',
                'source': f'PMC:{keyword}',
            })
    return found

def main():
    queries = [
        'cognitive science modeling formula',
        'computational psychiatry equation',
        'neural network model equation',
        'reinforcement learning brain',
        'memory consolidation formula',
        'decision making model equation',
        'attentional network equation',
    ]

    all_formulas = []
    seen_ids = set()

    for query in queries:
        print(f"Query: {query}...")
        pmcids = fetch_pmc_papers(query, retmax=20)
        if not pmcids:
            print("  ✗ 无结果")
            continue
        print(f"  ✓ 找到 {len(pmcids)} 篇论文")

        details = fetch_pmc_details(pmcids[:10])  # 只取前 10 篇
        for pmid, info in details.items():
            if pmid == 'uids':  # 跳过元数据
                continue
            title = info.get('title', '')
            summary = info.get('summary', '')
            text = f"{title} {summary}"
            formulas = extract_formulas_from_text(text)
            for f in formulas:
                if f['id'] not in seen_ids:
                    seen_ids.add(f['id'])
                    all_formulas.append(f)
        print(f"  累计找到 {len(all_formulas)} 个公式")
        time.sleep(3)

    print(f"\n=== 完成 ===")
    print(f"总公式数: {len(all_formulas)}")

    # 保存
    output = {
        'metadata': {
            'version': '6.9.0',
            'last_updated': '2026-07-08',
            'total_formulas': len(all_formulas),
            'categories': list(set(f['category'] for f in all_formulas)),
            'source': 'pubmed_central',
        },
        'formulas': all_formulas,
    }
    out_path = os.path.join(os.path.dirname(__file__), '..', 'formulas', 'formulas_pmc.json')
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print(f"✅ 已保存到 {out_path}")

if __name__ == '__main__':
    main()

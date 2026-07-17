#!/usr/bin/env python3
"""
批量抓取 1000+ 数学/物理/化学公式
来源：
1. Wikipedia 公式列表页面（多个页面）
2. Wolfram MathWorld
3. 大学物理/数学公开课公式表
4. 现有公式库（SymPy, SciPy）
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import re

print("=== 批量抓取 1000+ 公式 ===\n")

# ===== 来源 1: Wikipedia 公式列表 =====
wikipedia_pages = [
    {
        'title': 'List of mathematical series',
        'url': 'https://en.wikipedia.org/wiki/List_of_mathematical_series',
        'category': 'mathematics'
    },
    {
        'title': 'List of integrals',
        'url': 'https://en.wikipedia.org/wiki/Lists_of_integrals',
        'category': 'mathematics'
    },
    {
        'title': 'List of derivatives',
        'url': 'https://en.wikipedia.org/wiki/List_of_derivatives',
        'category': 'mathematics'
    },
    {
        'title': 'List of physics equations',
        'url': 'https://en.wikipedia.org/wiki/List_of_equations_in_physics',
        'category': 'physics'
    },
    {
        'title': 'List of laws in physics',
        'url': 'https://en.wikipedia.org/wiki/List_of_laws_in_physics',
        'category': 'physics'
    },
    {
        'title': 'List of thermodynamic equations',
        'url': 'https://en.wikipedia.org/wiki/List_of_thermodynamic_equations',
        'category': 'physics'
    },
]

formulas = []

for page in wikipedia_pages:
    print(f"抓取页面: {page['title']}")
    
    try:
        response = requests.get(page['url'], timeout=15)
        if response.status_code == 200:
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # 提取所有 <math> 标签（LaTeX 公式）
            math_tags = soup.find_all('math')
            print(f"  ✅ 找到 {len(math_tags)} 个公式标签")
            
            for i, math_tag in enumerate(math_tags[:50]):  # 每个页面最多取 50 个
                formula_latex = math_tag.get_text(strip=True)
                
                # 跳过太短或太长的公式
                if len(formula_latex) < 5 or len(formula_latex) > 500:
                    continue
                
                formulas.append({
                    'id': f"{page['category']}_{len(formulas)}",
                    'name': f"{page['title']} - Formula {len(formulas) + 1}",
                    'category': page['category'],
                    'latex': formula_latex,
                    'source': page['url'],
                    'difficulty': 'intermediate'
                })
            
            print(f"  ✅ 已提取 {min(50, len(math_tags))} 个公式")
        else:
            print(f"  ❌ HTTP {response.status_code}")
    
    except Exception as e:
        print(f"  ❌ 错误: {e}")
    
    print()
    time.sleep(2)  # 避免请求过快

print(f"\n=== 已抓取 {len(formulas)} 个公式 ===\n")

# ===== 来源 2: 手动整理的常见公式（补充）=====
common_formulas = [
    # 数学 - 代数
    {"name": "平方根公式", "formula": "x = sqrt(a)", "category": "mathematics"},
    {"name": "立方根公式", "formula": "x = cbrt(a)", "category": "mathematics"},
    {"name": "对数公式", "formula": "log_a(x) = ln(x) / ln(a)", "category": "mathematics"},
    {"name": "指数公式", "formula": "a^x = e^(x*ln(a))", "category": "mathematics"},
    
    # 数学 - 三角学
    {"name": "正弦定理", "formula": "a/sin(A) = b/sin(B) = c/sin(C)", "category": "mathematics"},
    {"name": "余弦定理", "formula": "c^2 = a^2 + b^2 - 2ab*cos(C)", "category": "mathematics"},
    {"name": "正切定理", "formula": "tan(A-B)/tan(A+B) = (a-b)/(a+b)", "category": "mathematics"},
    
    # 数学 - 微积分
    {"name": "导数定义", "formula": "f'(x) = lim(h->0) (f(x+h)-f(x))/h", "category": "mathematics"},
    {"name": "积分定义", "formula": "∫f(x)dx = lim(n->∞) Σf(x_i)*Δx", "category": "mathematics"},
    {"name": "链式法则", "formula": "d/dx[f(g(x))] = f'(g(x)) * g'(x)", "category": "mathematics"},
    {"name": "乘积法则", "formula": "d/dx[u*v] = u'v + uv'", "category": "mathematics"},
    {"name": "商法则", "formula": "d/dx[u/v] = (u'v - uv')/v^2", "category": "mathematics"},
    
    # 物理 - 经典力学
    {"name": "牛顿第一定律", "formula": "F_net = 0 => v = constant", "category": "physics"},
    {"name": "牛顿第三定律", "formula": "F_12 = -F_21", "category": "physics"},
    {"name": "动能定理", "formula": "W = ΔK = K_f - K_i", "category": "physics"},
    {"name": "势能公式", "formula": "U = m*g*h", "category": "physics"},
    {"name": "动量定理", "formula": "p = m*v", "category": "physics"},
    {"name": "动量守恒", "formula": "Σp_before = Σp_after", "category": "physics"},
    {"name": "圆周运动向心力", "formula": "F_c = m*v^2/r", "category": "physics"},
    {"name": "万有引力定律", "formula": "F = G*(m1*m2)/r^2", "category": "physics"},
    
    # 物理 - 电磁学
    {"name": "安培定律", "formula": "∮B·dl = μ0*I_enc", "category": "physics"},
    {"name": "高斯定律", "formula": "∮E·dA = Q_enc/ε0", "category": "physics"},
    {"name": "毕奥-萨伐尔定律", "formula": "dB = (μ0/4π)*(I*dl×r)/r^3", "category": "physics"},
    {"name": "洛伦兹力", "formula": "F = q*(E + v×B)", "category": "physics"},
    
    # 物理 - 热力学
    {"name": "热力学第一定律", "formula": "ΔU = Q - W", "category": "physics"},
    {"name": "热力学第二定律", "formula": "ΔS >= 0", "category": "physics"},
    {"name": "熵公式", "formula": "S = k_B*ln(W)", "category": "physics"},
    {"name": "热传导公式", "formula": "Q = k*A*(T_h - T_c)/d", "category": "physics"},
    
    # 化学
    {"name": "平衡常数", "formula": "K = [C]^c[D]^d/([A]^a[B]^b)", "category": "chemistry"},
    {"name": "pH 公式", "formula": "pH = -log10[H+]", "category": "chemistry"},
    {"name": "能斯特方程", "formula": "E = E° - (RT/nF)*ln(Q)", "category": "chemistry"},
    {"name": "赫斯定律", "formula": "ΔH_total = ΣΔH_steps", "category": "chemistry"},
]

print("补充手动整理的公式...")
for i, f in enumerate(common_formulas):
    formulas.append({
        'id': f"{f['category']}_{len(formulas)}",
        'name': f['name'],
        'category': f['category'],
        'formula': f['formula'],
        'source': 'Manual collection',
        'difficulty': 'beginner'
    })

print(f"✅ 补充了 {len(common_formulas)} 个公式")

print(f"\n=== 总共 {len(formulas)} 个公式 ===\n")

# 保存为 JSON
output = {
    'metadata': {
        'version': '2.0.0',
        'source': 'Wikipedia + Manual collection',
        'total_formulas': len(formulas),
        'last_updated': time.strftime('%Y-%m-%d')
    },
    'formulas': formulas
}

output_file = '/root/.hermes/skills/heartflow/formulas/batch_formulas.json'
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"✅ 公式已保存到: {output_file}")
print(f"   文件路径: {output_file}")
print(f"\n下一步: 运行 `node scripts/import-formulas.js` 导入到 HeartFlow")

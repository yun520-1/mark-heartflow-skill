#!/usr/bin/env python3
"""
高等数学 + 高等物理公式爬虫
来源（开放授权/公开资料）：
1. Wikipedia — 各数学/物理条目里的公式（LaTeX 格式）
2. NASA — 航天物理公式
3. MIT OpenCourseWare — 公开公式表
4. 直接解析 Wikipedia 条目，提取 LaTeX 公式
"""

import json
import re
import time
import random
import urllib.request
import urllib.error
from html.parser import HTMLParser

HEADERS = {'User-Agent': 'Mozilla/5.0 (compatible; HeartFlow/5.8.6; educational)'}

# ── Wikipedia 条目列表（高等数学 + 高等物理）──────────────────────────────
WIKIPEDIA_PAGES = [
    # 高等数学
    'List_of_mathematical_series',
    'List_of_integrals_of_elementary_functions',
    'List_of_integrals_of_trigonometric_functions',
    'List_of_integrals_of_exponential_functions',
    'List_of_integrals_of_logarithmic_functions',
    'List_of_integrals_of_inverse_trigonometric_functions',
    'Table_of_integrals',
    'List_of_limits',
    'List_of_representations_of_e_super_x',
    'Fourier_transform',
    'Laplace_transform',
    'Z-transform',
    'List_of_Laplace_transforms',
    'List_of_Fourier_transforms',
    'Special_functions',
    'Bessel_function',
    'Legendre_polynomials',
    'Hermite_polynomials',
    'Laguerre_polynomials',
    'Gamma_function',
    'Beta_function',
    'Riemann_zeta_function',
    'List_of_complex_analysis_topics',
    'Cauchy_integral_formula',
    'Residue_theorem',
    'List_of_differentail_equations',
    'List_of_nonlinear_partial_differentail_equations',
    'Navier–Stokes_equations',
    'Schrödinger_equation',
    'Dirac_equation',
    'Klein–Gordon_equation',
    'Einstein_field_equations',
    'Maxwell_equations',
    'List_of_tensors_in_general_relativity',
    'Ricci_flow',
    'Geodesic_equation',
    # 高等物理
    'List_of_physics_formulas',
    'Equations_of_motion',
    'Lagrangian_mechanics',
    'Hamiltonian_mechanics',
    'Noether_theorem',
    'List_of_quantum_mechanics_equations',
    'Quantum_field_theory',
    'List_of_cosmological_equations',
    'Friedmann_equations',
    'List_of_thermodynamics_equations',
    'List_of_fluid_dynamics_equations',
    'Bernoulli's_principle',
    'Continuity_equation',
    'Euler_equations_(fluid_dynamics)',
    'List_of_electromagnetism_equations',
    'List_of_quantum_field_theory_topics',
    'Path_integral_formulation',
    'List_of_statistical_mechanics_equations',
    'Boltzmann_equation',
    'Fokker–Planck_equation',
    'Lorentz_transformation',
    'List_of_optics_equations',
    'Snell's_law',
    'Fresnel_equations',
    'List_of_nuclear_physics_formulas',
    'Bethe–Bloch_formula',
    'List_of_particle_physics_formulas',
]

# ── 已知公式（直接内置，不依赖爬虫）────────────────────────────────────────────
BUILTIN_FORMULAS = [
    # 高等数学 — 微积分
    {'id':'limit_def_derivative', 'name':'导数定义（极限）', 'formula':'f\'(x) = lim_{h→0} (f(x+h)-f(x))/h', 'category':'mathematics', 'subcategory':'calculus'},
    {'id':'fundamental_theorem_calculus', 'name':'微积分基本定理', 'formula':'∫_a^b f(x)dx = F(b) - F(a)', 'category':'mathematics', 'subcategory':'calculus'},
    {'id':'taylor_series', 'name':'泰勒级数', 'formula':'f(x) = Σ_{n=0}^∞ f^{(n)}(a)/n! (x-a)^n', 'category':'mathematics', 'subcategory':'calculus'},
    {'id':'maclaurin_series', 'name':'麦克劳林级数', 'formula':'f(x) = Σ_{n=0}^∞ f^{(n)}(0)/n! x^n', 'category':'mathematics', 'subcategory':'calculus'},
    {'id':'fourier_series', 'name':'傅里叶级数', 'formula':'f(x) = a0/2 + Σ_{n=1}^∞ (a_n cos(nωx) + b_n sin(nωx))', 'category':'mathematics', 'subcategory':'fourier_analysis'},
    {'id':'fourier_transform', 'name':'傅里叶变换', 'formula':'F(ω) = ∫_{-∞}^∞ f(t) e^{-iωt} dt', 'category':'mathematics', 'subcategory':'fourier_analysis'},
    {'id':'inverse_fourier_transform', 'name':'傅里叶逆变换', 'formula':'f(t) = 1/(2π) ∫_{-∞}^∞ F(ω) e^{iωt} dω', 'category':'mathematics', 'subcategory':'fourier_analysis'},
    {'id':'laplace_transform', 'name':'拉普拉斯变换', 'formula':'F(s) = ∫_0^∞ f(t) e^{-st} dt', 'category':'mathematics', 'subcategory':'laplace_transform'},
    {'id':'inverse_laplace_transform', 'name':'拉普拉斯逆变换', 'formula':'f(t) = 1/(2πi) ∫_{γ-i∞}^{γ+i∞} F(s) e^{st} ds', 'category':'mathematics', 'subcategory':'laplace_transform'},

    # 高等数学 — 复分析
    {'id':'cauchy_riemann', 'name':'柯西-黎曼方程', 'formula':'∂u/∂x = ∂v/∂y, ∂u/∂y = -∂v/∂x', 'category':'mathematics', 'subcategory':'complex_analysis'},
    {'id':'cauchy_integral_formula', 'name':'柯西积分公式', 'formula':'f(a) = 1/(2πi) ∮_C f(z)/(z-a) dz', 'category':'mathematics', 'subcategory':'complex_analysis'},
    {'id':'residue_theorem', 'name':'留数定理', 'formula':'∮_C f(z) dz = 2πi Σ Res(f, z_k)', 'category':'mathematics', 'subcategory':'complex_analysis'},

    # 高等数学 — 微分方程
    {'id':'separable_ode', 'name':'可分离变量 ODE', 'formula':'dy/dx = g(x)h(y) => ∫ dy/h(y) = ∫ g(x) dx', 'category':'mathematics', 'subcategory':'differential_equations'},
    {'id':'linear_ode', 'name':'一阶线性 ODE', 'formula':'y\' + P(x)y = Q(x) => y = e^{-∫P dx} (∫ Q e^{∫P dx} dx + C)', 'category':'mathematics', 'subcategory':'differential_equations'},
    {'id':'wave_equation', 'name':'波动方程', 'formula':'∂²u/∂t² = c² ∇²u', 'category':'mathematics', 'subcategory':'partial_differential_equations'},
    {'id':'heat_equation', 'name':'热传导方程', 'formula':'∂u/∂t = α ∇²u', 'category':'mathematics', 'subcategory':'partial_differential_equations'},
    {'id':'laplace_equation_pde', 'name':'拉普拉斯方程', 'formula':'∇²φ = 0', 'category':'mathematics', 'subcategory':'partial_differential_equations'},
    {'id':'poisson_equation', 'name':'泊松方程', 'formula':'∇²φ = ρ', 'category':'mathematics', 'subcategory':'partial_differential_equations'},

    # 高等数学 — 线性代数
    {'id':'characteristic_polynomial', 'name':'特征多项式', 'formula':'det(A - λI) = 0', 'category':'mathematics', 'subcategory':'linear_algebra'},
    {'id':'cayley_hamilton', 'name':'凯莱-哈密顿定理', 'formula':'p(A) = 0, where p(λ) = det(A - λI)', 'category':'mathematics', 'subcategory':'linear_algebra'},
    {'id':'spectral_decomposition', 'name':'谱分解', 'formula':'A = V Λ V^{-1}', 'category':'mathematics', 'subcategory':'linear_algebra'},
    {'id':'svd_decomposition', 'name':'奇异值分解', 'formula':'A = U Σ V^T', 'category':'mathematics', 'subcategory':'linear_algebra'},

    # 高等数学 — 概率论与数理统计
    {'id':'bayes_theorem_continuous', 'name':'贝叶斯定理（连续）', 'formula':'P(H|D) = P(D|H) P(H) / P(D)', 'category':'mathematics', 'subcategory':'probability'},
    {'id':'central_limit_theorem', 'name':'中心极限定理', 'formula':'√n (x̄_n - μ) / σ → N(0,1)', 'category':'mathematics', 'subcategory':'probability'},
    {'id':'law_large_numbers', 'name':'大数定律', 'formula':'x̄_n → μ (a.s.)', 'category':'mathematics', 'subcategory':'probability'},
    {'id':'moment_generating_function', 'name':'矩生成函数', 'formula':'M_X(t) = E[e^{tX}]', 'category':'mathematics', 'subcategory':'probability'},
    {'id':'characteristic_function', 'name':'特征函数', 'formula':'φ_X(t) = E[e^{itX}]', 'category':'mathematics', 'subcategory':'probability'},

    # 高等物理 — 经典力学（拉格朗日/哈密顿）
    {'id':'lagrangian_equation', 'name':'拉格朗日方程', 'formula':'d/dt (∂L/∂q̇_i) - ∂L/∂q_i = 0', 'category':'physics', 'subcategory':'lagrangian_mechanics'},
    {'id':'euler_lagrange', 'name':'欧拉-拉格朗日方程', 'formula':'∂L/∂y - d/dx (∂L/∂y\') = 0', 'category':'physics', 'subcategory':'lagrangian_mechanics'},
    {'id':'hamilton_equations', 'name':'哈密顿正则方程', 'formula':'q̇_i = ∂H/∂p_i, ṗ_i = -∂H/∂q_i', 'category':'physics', 'subcategory':'hamiltonian_mechanics'},
    {'id':'noether_theorem', 'name':'诺特定理', 'formula':'δS = 0 => ∂_μ j^μ = 0', 'category':'physics', 'subcategory':'symmetry'},

    # 高等物理 — 电磁学（麦克斯韦方程组）
    {'id':'maxwell_gauss_electric', 'name':'麦克斯韦方程（高斯电场）', 'formula':'∇·E = ρ/ε_0', 'category':'physics', 'subcategory':'electromagnetism'},
    {'id':'maxwell_gauss_magnetic', 'name':'麦克斯韦方程（高斯磁场）', 'formula':'∇·B = 0', 'category':'physics', 'subcategory':'electromagnetism'},
    {'id':'maxwell_faraday', 'name':'麦克斯韦方程（法拉第）', 'formula':'∇×E = -∂B/∂t', 'category':'physics', 'subcategory':'electromagnetism'},
    {'id':'maxwell_ampere', 'name':'麦克斯韦方程（安培-麦克斯韦）', 'formula':'∇×B = μ_0 J + μ_0ε_0 ∂E/∂t', 'category':'physics', 'subcategory':'electromagnetism'},
    {'id':'poynting_vector', 'name':'坡印廷矢量', 'formula':'S = E × H', 'category':'physics', 'subcategory':'electromagnetism'},
    {'id':'lorentz_force', 'name':'洛伦兹力', 'formula':'F = q(E + v × B)', 'category':'physics', 'subcategory':'electromagnetism'},

    # 高等物理 — 量子力学
    {'id':'schrodinger_time_dependent', 'name':'含时薛定谔方程', 'formula':'iℏ ∂ψ/∂t = H ψ', 'category':'physics', 'subcategory':'quantum_mechanics'},
    {'id':'schrodinger_time_independent', 'name':'定态薛定谔方程', 'formula':'H ψ = E ψ', 'category':'physics', 'subcategory':'quantum_mechanics'},
    {'id':'dirac_equation', 'name':'狄拉克方程', 'formula':'(iγ^μ ∂_μ - m) ψ = 0', 'category':'physics', 'subcategory':'quantum_field_theory'},
    {'id':'klein_gordon_equation', 'name':'克莱因-戈尔登方程', 'formula':'(□ + m²) φ = 0', 'category':'physics', 'subcategory':'quantum_field_theory'},
    {'id':'heisenberg_uncertainty', 'name':'海森堡不确定性原理', 'formula':'Δx Δp ≥ ℏ/2', 'category':'physics', 'subcategory':'quantum_mechanics'},
    {'id':'commutation_relation', 'name':'正则对易关系', 'formula':'[x, p] = iℏ', 'category':'physics', 'subcategory':'quantum_mechanics'},
    {'id':'born_rule', 'name':'波恩定则（概率诠释）', 'formula':'P(x) = |ψ(x)|²', 'category':'physics', 'subcategory':'quantum_mechanics'},

    # 高等物理 — 广义相对论
    {'id':'einstein_field_equation', 'name':'爱因斯坦场方程', 'formula':'G_μν = 8πG/c⁴ T_μν', 'category':'physics', 'subcategory':'general_relativity'},
    {'id':'schwarzschild_metric', 'name':'施瓦西度规', 'formula':'ds² = -(1-2GM/r) dt² + (1-2GM/r)^{-1} dr² + r² dΩ²', 'category':'physics', 'subcategory':'general_relativity'},
    {'id':'geodesic_equation_gr', 'name':'测地线方程', 'formula':'d²x^μ/dτ² + Γ^μ_{νρ} dx^ν/dτ dx^ρ/dτ = 0', 'category':'physics', 'subcategory':'general_relativity'},
    {'id':'friedmann_equation_1', 'name':'弗里德曼方程（第一式）', 'formula':'(ȧ/a)² = 8πGρ/3 - kc²/a² + Λc²/3', 'category':'physics', 'subcategory':'cosmology'},
    {'id':'friedmann_equation_2', 'name':'弗里德曼方程（第二式）', 'formula':'ä/a = -4πG(ρ+3p/c²)/3 + Λc²/3', 'category':'physics', 'subcategory':'cosmology'},

    # 高等物理 — 统计力学
    {'id':'boltzmann_entropy', 'name':'玻尔兹曼熵公式', 'formula':'S = k_B ln Ω', 'category':'physics', 'subcategory':'statistical_mechanics'},
    {'id':'partition_function', 'name':'配分函数', 'formula':'Z = Σ_i e^{-βE_i}', 'category':'physics', 'subcategory':'statistical_mechanics'},
    {'id':'boltzmann_distribution', 'name':'玻尔兹曼分布', 'formula':'P_i = e^{-βE_i} / Z', 'category':'physics', 'subcategory':'statistical_mechanics'},
    {'id':'fokker_planck', 'name':'福克-普朗克方程', 'formula':'∂P/∂t = -∂/∂x [A(x)P] + ∂²/∂x² [B(x)P]', 'category':'physics', 'subcategory':'statistical_mechanics'},

    # 高等物理 — 流体力学
    {'id':'navier_stokes', 'name':'纳维-斯托克斯方程', 'formula':'ρ(∂v/∂t + v·∇v) = -∇p + μ∇²v + f', 'category':'physics', 'subcategory':'fluid_dynamics'},
    {'id':'continuity_equation_fluid', 'name':'连续性方程', 'formula':'∂ρ/∂t + ∇·(ρv) = 0', 'category':'physics', 'subcategory':'fluid_dynamics'},
    {'id':'bernoulli_principle', 'name':'伯努利原理', 'formula':'p + ½ρv² + ρgh = constant', 'category':'physics', 'subcategory':'fluid_dynamics'},
    {'id':'reynolds_number', 'name':'雷诺数', 'formula':'Re = ρvL/μ', 'category':'physics', 'subcategory':'fluid_dynamics'},

    # 高等物理 — 热力学
    {'id':'first_law_thermodynamics', 'name':'热力学第一定律', 'formula':'dU = δQ - δW', 'category':'physics', 'subcategory':'thermodynamics'},
    {'id':'second_law_thermodynamics', 'name':'热力学第二定律（熵增）', 'formula':'dS ≥ 0', 'category':'physics', 'subcategory':'thermodynamics'},
    {'id':'gibbs_free_energy', 'name':'吉布斯自由能', 'formula':'G = H - TS', 'category':'physics', 'subcategory':'thermodynamics'},
    {'id':'helmholtz_free_energy', 'name':'亥姆霍兹自由能', 'formula':'F = U - TS', 'category':'physics', 'subcategory':'thermodynamics'},

    # 高等物理 — 光学
    {'id':'snell_law', 'name':'斯涅尔定律（折射）', 'formula':'n₁ sin θ₁ = n₂ sin θ₂', 'category':'physics', 'subcategory':'optics'},
    {'id':'fresnel_equations', 'name':'菲涅尔方程', 'formula':'R_s = |(n₁cosθ₁-n₂cosθ₂)/(n₁cosθ₁+n₂cosθ₂)|²', 'category':'physics', 'subcategory':'optics'},
    {'id':'brewsters_angle', 'name':'布儒斯特角', 'formula':'tan θ_B = n₂/n₁', 'category':'physics', 'subcategory':'optics'},

    # 数学物理方法
    {'id':'sturm_liouville', 'name':'斯特姆-刘维尔方程', 'formula':'(p(x)y\')' + q(x)y + λw(x)y = 0', 'category':'mathematics', 'subcategory':'mathematical_physics'},
    {'id':'green_function', 'name':'格林函数', 'formula':'L G(x,s) = δ(x-s)', 'category':'mathematics', 'subcategory':'mathematical_physics'},
    {'id':'method_images', 'name':'镜像法', 'formula':'φ = 1/(4πε_0) (q/r + q\'/r\')', 'category':'mathematics', 'subcategory':'mathematical_physics'},

    # 与心虫相关的核心公式
    {'id':'ebbinghaus_forgetting_curve', 'name':'艾宾浩斯遗忘曲线', 'formula':'R(t) = e^{-t/S}', 'category':'cognitive_science', 'subcategory':'memory'},
    {'id':'pad_emotion_model', 'name':'PAD 情绪空间模型', 'formula':'(P,A,D) = f(stimulus, context)', 'category':'cognitive_science', 'subcategory':'emotion'},
    {'id':'flow_channel_model', 'name':'心流通道模型', 'formula':'Flow = f(challenge, skill)', 'category':'cognitive_science', 'subcategory':'flow'},
    {'id':'cognitive_load_index', 'name':'认知负载指数', 'formula':'CL = (intrinsic + extraneous + germane) / working_memory_capacity', 'category':'cognitive_science', 'subcategory':'cognition'},
    {'id':'bayesian_updating', 'name':'贝叶斯更新（信念修正）', 'formula':'P(H|D) = P(D|H)P(H)/P(D)', 'category':'cognitive_science', 'subcategory':'belief_updating'},
    {'id':'shannon_information_entropy', 'name':'香农信息熵', 'formula':'H(X) = -Σ p(x) log₂ p(x)', 'category':'cognitive_science', 'subcategory':'information_theory'},
    {'id':'cross_entropy', 'name':'交叉熵', 'formula':'H(P,Q) = -Σ p(x) log q(x)', 'category':'cognitive_science', 'subcategory':'information_theory'},
    {'id':'kl_divergence', 'name':'KL 散度', 'formula':'D_KL(P||Q) = Σ p(x) log(p(x)/q(x))', 'category':'cognitive_science', 'subcategory':'information_theory'},
]

# ── 从 Wikipedia 抓取公式（解析 <math> 标签）──────────────────────────────
def fetch_wikipedia_formulas(page_title, category, subcategory):
    """从 Wikipedia 页面提取 LaTeX 公式"""
    url = f'https://en.wikipedia.org/w/api.php?action=parse&page={page_title}&prop=wikitext&format=json'
    formulas = []
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode('utf-8'))
        wikitext = data['parse']['wikitext']['*']

        # 提取 <math>...</math> 标签里的 LaTeX
        math_blocks = re.findall(r'<math>(.*?)</math>', wikitext, re.DOTALL)
        # 也提取 $...$ 和 $$...$$
        inline_math = re.findall(r'\$(.*?)\$', wikitext)
        block_math = re.findall(r'\$\$(.*?)\$\$', wikitext, re.DOTALL)

        all_latex = math_blocks + inline_math + block_math
        for i, latex in enumerate(all_latex[:50]):  # 每页最多取 50 个
            latex_clean = latex.strip().replace('\n', ' ')
            if len(latex_clean) < 5:
                continue
            formulas.append({
                'id': f'wp_{page_title}_{i}',
                'name': f'{page_title} 公式 {i}',
                'name_en': f'{page_title} formula {i}',
                'formula': latex_clean,
                'category': category,
                'subcategory': subcategory,
                'difficulty': 'advanced',
                'source': f'Wikipedia:{page_title}'
            })
    except Exception as e:
        print(f'  ✗ {page_title}: {e}')
    return formulas


def convert_latex_to_mathjs(latex):
    """
    将 LaTeX 公式转化为 mathjs 可计算的形式（简化版）
    这只做基本转换，高等公式大多无法直接计算（符号方程）
    """
    # 去掉 LaTeX 命令，保留核心数学表达式
    s = latex
    s = re.sub(r'\\(.*?\\)', '', s)  # 去掉 \command{...}
    s = re.sub(r'\\[.*?\\]', '', s)
    s = s.replace('\\', '')
    s = s.replace('{', '(').replace('}', ')')
    # 如果包含 =，尝试提取
    if '=' in s:
        return s
    return None


def main():
    print('=== 高等数学 + 高等物理公式采集 ===\n')
    all_formulas = list(BUILTIN_FORMULAS)

    # 从 Wikipedia 抓取（每页间隔 1 秒，避免被封）
    print('--- 从 Wikipedia 抓取公式 ---')
    for page in WIKIPEDIA_PAGES[:20]:  # 先跑前 20 页测试
        cat = 'physics' if any(k in page.lower() for k in ['equation', 'physics', 'mechanics', 'field', 'relativity', 'quantum']) else 'mathematics'
        sub = page.lower()[:50]
        print(f'  抓取: {page}...')
        formulas = fetch_wikipedia_formulas(page, cat, sub)
        if formulas:
            print(f'    ✓ 获得 {len(formulas)} 个公式')
            all_formulas.extend(formulas)
        time.sleep(1)

    print(f'\n=== 采集完成，共 {len(all_formulas)} 个公式 ===')

    # 保存
    output = {
        'metadata': {
            'version': '4.0.0',
            'last_updated': time.strftime('%Y-%m-%d'),
            'total_formulas': len(all_formulas),
            'categories': list(set(f['category'] for f in all_formulas)),
            'source': 'builtin + Wikipedia'
        },
        'formulas': all_formulas
    }

    out_path = '/root/.hermes/skills/heartflow/formulas/formulas_advanced.json'
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print(f'已保存到: {out_path}')
    print(f'统计: 高等数学/物理公式共 {len(all_formulas)} 个')


if __name__ == '__main__':
    main()

/**
 * 高等数学 + 高等物理公式采集
 * 来源：内置高等公式库（不依赖网络爬虫）
 * 输出：formulas_advanced.json
 */

const BUILTIN = [
  // ── 高等数学 — 微积分 ──
  { id:'limit_def_derivative', name:'导数定义（极限）', formula:'f\'(x) = lim_{h→0} (f(x+h)-f(x))/h', category:'mathematics', subcategory:'calculus' },
  { id:'fundamental_theorem_calculus', name:'微积分基本定理', formula:'∫_a^b f(x)dx = F(b) - F(a)', category:'mathematics', subcategory:'calculus' },
  { id:'taylor_series', name:'泰勒级数', formula:'f(x) = Σ_{n=0}^∞ f^{(n)}(a)/n! (x-a)^n', category:'mathematics', subcategory:'calculus' },
  { id:'maclaurin_series', name:'麦克劳林级数', formula:'f(x) = Σ_{n=0}^∞ f^{(n)}(0)/n! x^n', category:'mathematics', subcategory:'calculus' },
  { id:'fourier_series', name:'傅里叶级数', formula:'f(x) = a0/2 + Σ_{n=1}^∞ (a_n cos(nωx) + b_n sin(nωx))', category:'mathematics', subcategory:'fourier_analysis' },
  { id:'fourier_transform', name:'傅里叶变换', formula:'F(ω) = ∫_{-∞}^∞ f(t) e^{-iωt} dt', category:'mathematics', subcategory:'fourier_analysis' },
  { id:'inverse_fourier_transform', name:'傅里叶逆变换', formula:'f(t) = 1/(2π) ∫_{-∞}^∞ F(ω) e^{iωt} dω', category:'mathematics', subcategory:'fourier_analysis' },
  { id:'laplace_transform', name:'拉普拉斯变换', formula:'F(s) = ∫_0^∞ f(t) e^{-st} dt', category:'mathematics', subcategory:'laplace_transform' },
  { id:'inverse_laplace_transform', name:'拉普拉斯逆变换', formula:'f(t) = 1/(2πi) ∫_{γ-i∞}^{γ+i∞} F(s) e^{st} ds', category:'mathematics', subcategory:'laplace_transform' },

  // ── 高等数学 — 复分析 ──
  { id:'cauchy_riemann', name:'柯西-黎曼方程', formula:'∂u/∂x = ∂v/∂y, ∂u/∂y = -∂v/∂x', category:'mathematics', subcategory:'complex_analysis' },
  { id:'cauchy_integral_formula', name:'柯西积分公式', formula:'f(a) = 1/(2πi) ∮_C f(z)/(z-a) dz', category:'mathematics', subcategory:'complex_analysis' },
  { id:'residue_theorem', name:'留数定理', formula:'∮_C f(z) dz = 2πi Σ Res(f, z_k)', category:'mathematics', subcategory:'complex_analysis' },

  // ── 高等数学 — 微分方程 ──
  { id:'wave_equation', name:'波动方程', formula:'∂²u/∂t² = c² ∇²u', category:'mathematics', subcategory:'partial_differential_equations' },
  { id:'heat_equation', name:'热传导方程', formula:'∂u/∂t = α ∇²u', category:'mathematics', subcategory:'partial_differential_equations' },
  { id:'laplace_equation_pde', name:'拉普拉斯方程', formula:'∇²φ = 0', category:'mathematics', subcategory:'partial_differential_equations' },
  { id:'poisson_equation', name:'泊松方程', formula:'∇²φ = ρ', category:'mathematics', subcategory:'partial_differential_equations' },

  // ── 高等数学 — 线性代数 ──
  { id:'characteristic_polynomial', name:'特征多项式', formula:'det(A - λI) = 0', category:'mathematics', subcategory:'linear_algebra' },
  { id:'cayley_hamilton', name:'凯莱-哈密顿定理', formula:'p(A) = 0, where p(λ) = det(A - λI)', category:'mathematics', subcategory:'linear_algebra' },
  { id:'spectral_decomposition', name:'谱分解', formula:'A = V Λ V^{-1}', category:'mathematics', subcategory:'linear_algebra' },
  { id:'svd_decomposition', name:'奇异值分解', formula:'A = U Σ V^T', category:'mathematics', subcategory:'linear_algebra' },

  // ── 高等数学 — 概率论与数理统计 ──
  { id:'bayes_theorem_continuous', name:'贝叶斯定理（连续）', formula:'P(H|D) = P(D|H) P(H) / P(D)', category:'mathematics', subcategory:'probability' },
  { id:'central_limit_theorem', name:'中心极限定理', formula:'√n (x̄_n - μ) / σ → N(0,1)', category:'mathematics', subcategory:'probability' },
  { id:'law_large_numbers', name:'大数定律', formula:'x̄_n → μ (a.s.)', category:'mathematics', subcategory:'probability' },
  { id:'moment_generating_function', name:'矩生成函数', formula:'M_X(t) = E[e^{tX}]', category:'mathematics', subcategory:'probability' },
  { id:'characteristic_function', name:'特征函数', formula:'φ_X(t) = E[e^{itX}]', category:'mathematics', subcategory:'probability' },
  { id:'shannon_information_entropy', name:'香农信息熵', formula:'H(X) = -Σ p(x) log₂ p(x)', category:'cognitive_science', subcategory:'information_theory' },
  { id:'cross_entropy', name:'交叉熵', formula:'H(P,Q) = -Σ p(x) log q(x)', category:'cognitive_science', subcategory:'information_theory' },
  { id:'kl_divergence', name:'KL 散度', formula:'D_KL(P||Q) = Σ p(x) log(p(x)/q(x))', category:'cognitive_science', subcategory:'information_theory' },

  // ── 高等物理 — 经典力学（拉格朗日/哈密顿） ──
  { id:'lagrangian_equation', name:'拉格朗日方程', formula:'d/dt (∂L/∂q̇_i) - ∂L/∂q_i = 0', category:'physics', subcategory:'lagrangian_mechanics' },
  { id:'hamilton_equations', name:'哈密顿正则方程', formula:'q̇_i = ∂H/∂p_i, ṗ_i = -∂H/∂q_i', category:'physics', subcategory:'hamiltonian_mechanics' },
  { id:'noether_theorem', name:'诺特定理', formula:'δS = 0 => ∂_μ j^μ = 0', category:'physics', subcategory:'symmetry' },

  // ── 高等物理 — 电磁学（麦克斯韦方程组） ──
  { id:'maxwell_gauss_electric', name:'麦克斯韦方程（高斯电场）', formula:'∇·E = ρ/ε_0', category:'physics', subcategory:'electromagnetism' },
  { id:'maxwell_gauss_magnetic', name:'麦克斯韦方程（高斯磁场）', formula:'∇·B = 0', category:'physics', subcategory:'electromagnetism' },
  { id:'maxwell_faraday', name:'麦克斯韦方程（法拉第）', formula:'∇×E = -∂B/∂t', category:'physics', subcategory:'electromagnetism' },
  { id:'maxwell_ampere', name:'麦克斯韦方程（安培-麦克斯韦）', formula:'∇×B = μ_0 J + μ_0ε_0 ∂E/∂t', category:'physics', subcategory:'electromagnetism' },
  { id:'poynting_vector', name:'坡印廷矢量', formula:'S = E × H', category:'physics', subcategory:'electromagnetism' },
  { id:'lorentz_force', name:'洛伦兹力', formula:'F = q(E + v × B)', category:'physics', subcategory:'electromagnetism' },

  // ── 高等物理 — 量子力学 ──
  { id:'schrodinger_time_dependent', name:'含时薛定谔方程', formula:'iℏ ∂ψ/∂t = H ψ', category:'physics', subcategory:'quantum_mechanics' },
  { id:'schrodinger_time_independent', name:'定态薛定谔方程', formula:'H ψ = E ψ', category:'physics', subcategory:'quantum_mechanics' },
  { id:'dirac_equation', name:'狄拉克方程', formula:'(iγ^μ ∂_μ - m) ψ = 0', category:'physics', subcategory:'quantum_field_theory' },
  { id:'klein_gordon_equation', name:'克莱因-戈尔登方程', formula:'(□ + m²) φ = 0', category:'physics', subcategory:'quantum_field_theory' },
  { id:'heisenberg_uncertainty', name:'海森堡不确定性原理', formula:'Δx Δp ≥ ℏ/2', category:'physics', subcategory:'quantum_mechanics' },
  { id:'commutation_relation', name:'正则对易关系', formula:'[x, p] = iℏ', category:'physics', subcategory:'quantum_mechanics' },
  { id:'born_rule', name:'波恩定则（概率诠释）', formula:'P(x) = |ψ(x)|²', category:'physics', subcategory:'quantum_mechanics' },

  // ── 高等物理 — 广义相对论 ──
  { id:'einstein_field_equation', name:'爱因斯坦场方程', formula:'G_μν = 8πG/c⁴ T_μν', category:'physics', subcategory:'general_relativity' },
  { id:'schwarzschild_metric', name:'施瓦西度规', formula:'ds² = -(1-2GM/r) dt² + (1-2GM/r)^{-1} dr² + r² dΩ²', category:'physics', subcategory:'general_relativity' },
  { id:'geodesic_equation_gr', name:'测地线方程', formula:'d²x^μ/dτ² + Γ^μ_{νρ} dx^ν/dτ dx^ρ/dτ = 0', category:'physics', subcategory:'general_relativity' },
  { id:'friedmann_equation_1', name:'弗里德曼方程（第一式）', formula:'(ȧ/a)² = 8πGρ/3 - kc²/a² + Λc²/3', category:'physics', subcategory:'cosmology' },
  { id:'friedmann_equation_2', name:'弗里德曼方程（第二式）', formula:'ä/a = -4πG(ρ+3p/c²)/3 + Λc²/3', category:'physics', subcategory:'cosmology' },

  // ── 高等物理 — 统计力学 ──
  { id:'boltzmann_entropy', name:'玻尔兹曼熵公式', formula:'S = k_B ln Ω', category:'physics', subcategory:'statistical_mechanics' },
  { id:'partition_function', name:'配分函数', formula:'Z = Σ_i e^{-βE_i}', category:'physics', subcategory:'statistical_mechanics' },
  { id:'boltzmann_distribution', name:'玻尔兹曼分布', formula:'P_i = e^{-βE_i} / Z', category:'physics', subcategory:'statistical_mechanics' },
  { id:'fokker_planck', name:'福克-普朗克方程', formula:'∂P/∂t = -∂/∂x [A(x)P] + ∂²/∂x² [B(x)P]', category:'physics', subcategory:'statistical_mechanics' },

  // ── 高等物理 — 流体力学 ──
  { id:'navier_stokes', name:'纳维-斯托克斯方程', formula:'ρ(∂v/∂t + v·∇v) = -∇p + μ∇²v + f', category:'physics', subcategory:'fluid_dynamics' },
  { id:'continuity_equation_fluid', name:'连续性方程', formula:'∂ρ/∂t + ∇·(ρv) = 0', category:'physics', subcategory:'fluid_dynamics' },
  { id:'bernoulli_principle', name:'伯努利原理', formula:'p + ½ρv² + ρgh = constant', category:'physics', subcategory:'fluid_dynamics' },
  { id:'reynolds_number', name:'雷诺数', formula:'Re = ρvL/μ', category:'physics', subcategory:'fluid_dynamics' },

  // ── 高等物理 — 热力学 ──
  { id:'first_law_thermodynamics', name:'热力学第一定律', formula:'dU = δQ - δW', category:'physics', subcategory:'thermodynamics' },
  { id:'second_law_thermodynamics', name:'热力学第二定律（熵增）', formula:'dS ≥ 0', category:'physics', subcategory:'thermodynamics' },
  { id:'gibbs_free_energy', name:'吉布斯自由能', formula:'G = H - TS', category:'physics', subcategory:'thermodynamics' },
  { id:'helmholtz_free_energy', name:'亥姆霍兹自由能', formula:'F = U - TS', category:'physics', subcategory:'thermodynamics' },

  // ── 高等物理 — 光学 ──
  { id:'snell_law', name:'斯涅尔定律（折射）', formula:'n₁ sin θ₁ = n₂ sin θ₂', category:'physics', subcategory:'optics' },
  { id:'fresnel_equations', name:'菲涅耳方程', formula:'R_s = |(n₁cosθ₁-n₂cosθ₂)/(n₁cosθ₁+n₂cosθ₂)|²', category:'physics', subcategory:'optics' },
  { id:'brewsers_angle', name:'布儒斯特角', formula:'tan θ_B = n₂/n₁', category:'physics', subcategory:'optics' },

  // ── 认知科学公式（与心虫直接相关） ──
  { id:'ebbinghaus_forgetting_curve', name:'艾宾浩斯遗忘曲线', formula:'R(t) = e^{-t/S}', category:'cognitive_science', subcategory:'memory' },
  { id:'pad_emotion_model', name:'PAD 情绪空间模型', formula:'(P,A,D) = f(stimulus, context)', category:'cognitive_science', subcategory:'emotion' },
  { id:'flow_channel_model', name:'心流通道模型', formula:'Flow = f(challenge, skill)', category:'cognitive_science', subcategory:'flow' },
  { id:'cognitive_load_index', name:'认知负载指数', formula:'CL = (intrinsic + extraneous + germane) / working_memory_capacity', category:'cognitive_science', subcategory:'cognition' },
  { id:'bayesian_updating', name:'贝叶斯更新（信念修正）', formula:'P(H|D) = P(D|H) P(H) / P(D)', category:'cognitive_science', subcategory:'belief_updating' },
  { id:'information_value', name:'信息价值（决策理论）', formula:'EVSI = E[U(D)] - E[U(∅)]', category:'cognitive_science', subcategory:'decision_theory' },
  { id:'expected_utility', name:'期望效用', formula:'EU = Σ p_i u(x_i)', category:'cognitive_science', subcategory:'decision_theory' },
  { id:'metacognitive_confidence', name:'元认知置信度', formula:'C = 1 - Var(p)', category:'cognitive_science', subcategory:'metacognition' },
];

console.log(`内置高等公式：${BUILTIN.length} 个`);

// 保存到 JSON
const fs = require('fs');
const path = require('path');

const output = {
  metadata: {
    version: '4.0.0',
    last_updated: new Date().toISOString().slice(0,10),
    total_formulas: BUILTIN.length,
    categories: [...new Set(BUILTIN.map(f => f.category))],
    source: 'builtin_advanced'
  },
  formulas: BUILTIN
};

const outPath = path.join(__dirname, '../formulas/formulas_advanced.json');
fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8');
console.log(`✅ 已保存到 ${outPath}`);
console.log(`   共 ${BUILTIN.length} 个高等数学/物理/认知科学公式`);

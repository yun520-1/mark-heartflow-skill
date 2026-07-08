#!/usr/bin/env node
/**
 * 大规模公式爬虫 — 从多个开放来源抓取公式
 * 来源：
 *   1. Wikipedia API（数学/物理/化学条目）
 *   2. 直接内置常用公式（不依赖网络）
 *   3. 从 arXiv 论文元数据提取公式关键词
 *
 * 输出：formulas_more.json（追加到主库）
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const ROOT = process.env.HEARTFLOW_ROOT || __dirname;
const UTF8 = 'utf-8';

// ── 来源 1：Wikipedia 条目列表 ─────────────────────────────────────
const WIKI_PAGES = [
  // 数学
  { title: 'List_of_mathematical_series', cat: 'mathematics', sub: 'series' },
  { title: 'List_of_integrals_of_elementary_functions', cat: 'mathematics', sub: 'integrals' },
  { title: 'List_of_Fourier_transforms', cat: 'mathematics', sub: 'fourier' },
  { title: 'List_of_Laplace_transforms', cat: 'mathematics', sub: 'laplace' },
  { title: 'List_of_z_transforms', cat: 'mathematics', sub: 'z_transform' },
  { title: 'Table_of_integrals', cat: 'mathematics', sub: 'integrals' },
  { title: 'List_of_limits', cat: 'mathematics', sub: 'limits' },
  { title: 'List_of_representations_of_e^super_x', cat: 'mathematics', sub: 'special_functions' },
  { title: 'Bessel_function', cat: 'mathematics', sub: 'special_functions' },
  { title: 'Legendre_polynomials', cat: 'mathematics', sub: 'special_functions' },
  { title: 'Hermite_polynomials', cat: 'mathematics', sub: 'special_functions' },
  { title: 'Laguerre_polynomials', cat: 'mathematics', sub: 'special_functions' },
  { title: 'Gamma_function', cat: 'mathematics', sub: 'special_functions' },
  { title: 'Beta_function', cat: 'mathematics', sub: 'special_functions' },
  { title: 'Riemann_zeta_function', cat: 'mathematics', sub: 'special_functions' },
  { title: 'List_of_complex_analysis_topics', cat: 'mathematics', sub: 'complex_analysis' },
  { title: 'Cauchy_integral_formula', cat: 'mathematics', sub: 'complex_analysis' },
  { title: 'Residue_theorem', cat: 'mathematics', sub: 'complex_analysis' },
  { title: 'List_of_differential_equations', cat: 'mathematics', sub: 'differential_equations' },
  { title: 'List_of_nonlinear_partial_differential_equations', cat: 'mathematics', sub: 'pde' },
  { title: 'Navier–Stokes_equations', cat: 'physics', sub: 'fluid_dynamics' },
  { title: 'Schrödinger_equation', cat: 'physics', sub: 'quantum_mechanics' },
  { title: 'Dirac_equation', cat: 'physics', sub: 'quantum_field_theory' },
  { title: 'Klein–Gordon_equation', cat: 'physics', sub: 'quantum_field_theory' },
  { title: 'Einstein_field_equations', cat: 'physics', sub: 'general_relativity' },
  { title: 'Maxwell_equations', cat: 'physics', sub: 'electromagnetism' },
  { title: 'List_of_thermodynamics_equations', cat: 'physics', sub: 'thermodynamics' },
  { title: 'List_of_fluid_dynamics_equations', cat: 'physics', sub: 'fluid_dynamics' },
  { title: 'List_of_electromagnetism_equations', cat: 'physics', sub: 'electromagnetism' },
  { title: 'List_of_quantum_field_theory_topics', cat: 'physics', sub: 'quantum_field_theory' },
  { title: 'List_of_statistical_mechanics_equations', cat: 'physics', sub: 'statistical_mechanics' },
  { title: 'Friedmann_equations', cat: 'physics', sub: 'cosmology' },
  { title: 'List_of_optics_equations', cat: 'physics', sub: 'optics' },
  { title: 'Snell\'s_law', cat: 'physics', sub: 'optics' },
  { title: 'Fresnel_equations', cat: 'physics', sub: 'optics' },
  { title: 'List_of_nuclear_physics_formulas', cat: 'physics', sub: 'nuclear_physics' },
  { title: 'List_of_particle_physics_formulas', cat: 'physics', sub: 'particle_physics' },
  // 化学
  { title: 'Ideal_gas_law', cat: 'chemistry', sub: 'thermodynamics' },
  { title: 'Arrhenius_equation', cat: 'chemistry', sub: 'kinetics' },
  { title: 'Nernst_equation', cat: 'chemistry', sub: 'electrochemistry' },
  { title: 'Henderson–Hasselbalch_equation', cat: 'chemistry', sub: 'acid_base' },
  { title: 'Raoult\'s_law', cat: 'chemistry', sub: 'solutions' },
  { title: 'Fick\'s_laws_of_diffusion', cat: 'chemistry', sub: 'diffusion' },
  // 工程
  { title: 'List_of_materials_properties', cat: 'engineering', sub: 'materials' },
  { title: 'Euler–Bernoulli_beam_theory', cat: 'engineering', sub: 'mechanics' },
  { title: 'Rankine_cycle', cat: 'engineering', sub: 'thermodynamics' },
  { title: 'Carnot_cycle', cat: 'engineering', sub: 'thermodynamics' },
  // 统计/信息论
  { title: 'Normal_distribution', cat: 'mathematics', sub: 'probability' },
  { title: 'Central_limit_theorem', cat: 'mathematics', sub: 'probability' },
  { title: 'Law_of_large_numbers', cat: 'mathematics', sub: 'probability' },
  { title: 'Shannon–Weaver_model', cat: 'cognitive_science', sub: 'information_theory' },
  { title: 'Kullback–Leibler_divergence', cat: 'cognitive_science', sub: 'information_theory' },
  { title: 'Cross_entropy', cat: 'cognitive_science', sub: 'information_theory' },
  // 认知/心理
  { title: 'Ebbinghaus_forgetting_curve', cat: 'cognitive_science', sub: 'memory' },
  { title: 'Yerkes–Dodson_law', cat: 'cognitive_science', sub: 'arousal' },
  { title: 'Cattell–Horn–Carroll_theory', cat: 'cognitive_science', sub: 'intelligence' },
  { title: 'Maslow\'s_hierarchy_of_needs', cat: 'cognitive_science', sub: 'motivation' },
];

// ── 来源 2：直接内置公式（不依赖网络）─────────────────────────────
const BUILTIN = [
  // 数学分析
  { id:'l_hospital_rule', name:'洛必达法则', formula:'lim_{x→c} f(x)/g(x) = lim_{x→c} f\'(x)/g\'(x)', cat:'mathematics', sub:'calculus' },
  { id:'fundamental_theorem_algebra', name:'代数基本定理', formula:'Every non-constant polynomial has at least one complex root', cat:'mathematics', sub:'algebra' },
  { id:'binomial_theorem', name:'二项式定理', formula:'(x+y)^n = Σ_{k=0}^n C(n,k) x^{n-k} y^k', cat:'mathematics', sub:'algebra' },
  { id:'multinomial_theorem', name:'多项式定理', formula:'(x_1+...+x_m)^n = Σ_{k_1+...+k_m=n} n!/(k_1!...k_m!) x_1^{k_1}...x_m^{k_m}', cat:'mathematics', sub:'algebra' },
  { id:'stokes_theorem', name:'斯托克斯定理', formula:'∫_∂S F·dr = ∫_S (∇×F)·dS', cat:'mathematics', sub:'vector_calculus' },
  { id:'divergence_theorem', name:'散度定理（高斯）', formula:'∫_V (∇·F) dV = ∮_∂V F·dS', cat:'mathematics', sub:'vector_calculus' },
  { id:'green_theorem', name:'格林定理', formula:'∮_C (P dx + Q dy) = ∫_D (∂Q/∂x - ∂P/∂y) dA', cat:'mathematics', sub:'vector_calculus' },

  // 线性代数
  { id:'svd_decomposition', name:'奇异值分解', formula:'A = U Σ V^T', cat:'mathematics', sub:'linear_algebra' },
  { id:'qr_decomposition', name:'QR 分解', formula:'A = QR', cat:'mathematics', sub:'linear_algebra' },
  { id:'lu_decomposition', name:'LU 分解', formula:'A = LU', cat:'mathematics', sub:'linear_algebra' },
  { id:'cholesky_decomposition', name:'乔列斯基分解', formula:'A = LL^T', cat:'mathematics', sub:'linear_algebra' },
  { id:'eigen_decomposition', name:'特征分解', formula:'A = V Λ V^{-1}', cat:'mathematics', sub:'linear_algebra' },
  { id:'cayley_hamilton', name:'凯莱-哈密顿', formula:'p(A) = 0, p(λ)=det(A-λI)', cat:'mathematics', sub:'linear_algebra' },
  { id:'spectral_radius', name:'谱半径', formula:'ρ(A) = max |λ_i|', cat:'mathematics', sub:'linear_algebra' },
  { id:'matrix_norm_frobenius', name:'Frobenius 范数', formula:'||A||_F = sqrt(Σ|a_ij|²)', cat:'mathematics', sub:'linear_algebra' },
  { id:'matrix_norm_spectral', name:'谱范数', formula:'||A||_2 = sqrt(ρ(A^T A))', cat:'mathematics', sub:'linear_algebra' },
  { id:'trace_cyclic', name:'迹的循环性质', formula:'tr(AB) = tr(BA)', cat:'mathematics', sub:'linear_algebra' },
  { id:'determinant_block', name:'分块矩阵行列式', formula:'det([A,B;C,D]) = det(A)det(D-CA^{-1}B)', cat:'mathematics', sub:'linear_algebra' },

  // 概率统计
  { id:'bayes_theorem_odds', name:'贝叶斯定理（赔率形式）', formula:'O(H|D) = O(H) * LR(D|H)', cat:'mathematics', sub:'probability' },
  { id:'conditional_probability', name:'条件概率', formula:'P(A|B) = P(A∩B)/P(B)', cat:'mathematics', sub:'probability' },
  { id:'total_probability', name:'全概率公式', formula:'P(A) = Σ P(A|B_i) P(B_i)', cat:'mathematics', sub:'probability' },
  { id:'covariance', name:'协方差', formula:'Cov(X,Y) = E[(X-μ_X)(Y-μ_Y)]', cat:'mathematics', sub:'probability' },
  { id:'correlation_coefficient', name:'相关系数', formula:'ρ(X,Y) = Cov(X,Y)/(σ_X σ_Y)', cat:'mathematics', sub:'probability' },
  { id:'central_moment', name:'中心矩', formula:'μ_k = E[(X-μ)^k]', cat:'mathematics', sub:'probability' },
  { id:'moment_generating', name:'矩生成函数', formula:'M_X(t) = E[e^{tX}]', cat:'mathematics', sub:'probability' },
  { id:'characteristic_function', name:'特征函数', formula:'φ_X(t) = E[e^{itX}]', cat:'mathematics', sub:'probability' },
  { id:'law_iterated_logarithm', name:'重对数律', formula:'limsup (S_n - nμ)/sqrt(2n log log n) = σ', cat:'mathematics', sub:'probability' },

  // 信息论
  { id:'shannon_entropy', name:'香农熵', formula:'H(X) = -Σ p(x) log₂ p(x)', cat:'cognitive_science', sub:'information_theory' },
  { id:'joint_entropy', name:'联合熵', formula:'H(X,Y) = -Σ p(x,y) log p(x,y)', cat:'cognitive_science', sub:'information_theory' },
  { id:'conditional_entropy', name:'条件熵', formula:'H(X|Y) = H(X,Y) - H(Y)', cat:'cognitive_science', sub:'information_theory' },
  { id:'mutual_information', name:'互信息', formula:'I(X;Y) = H(X) - H(X|Y) = D_KL(p(x,y)||p(x)p(y))', cat:'cognitive_science', sub:'information_theory' },
  { id:'kl_divergence', name:'KL 散度', formula:'D_KL(P||Q) = Σ p(x) log(p(x)/q(x))', cat:'cognitive_science', sub:'information_theory' },
  { id:'cross_entropy_loss', name:'交叉熵损失', formula:'H(P,Q) = -Σ p(x) log q(x)', cat:'cognitive_science', sub:'machine_learning' },
  { id:'bits_to_nats', name:'比特转奈特', formula:'1 bit = ln(2) nats ≈ 0.693 nats', cat:'cognitive_science', sub:'information_theory' },

  // 物理：经典力学
  { id:'newton_second_law', name:'牛顿第二定律', formula:'F = ma', cat:'physics', sub:'classical_mechanics' },
  { id:'newton_gravitation', name:'牛顿万有引力', formula:'F = G m_1 m_2 / r²', cat:'physics', sub:'classical_mechanics' },
  { id:'kepler_first', name:'开普勒第一定律', formula:'行星轨道是椭圆，太阳在焦点', cat:'physics', sub:'classical_mechanics' },
  { id:'kepler_second', name:'开普勒第二定律', formula:'面积速度恒定', cat:'physics', sub:'classical_mechanics' },
  { id:'kepler_third', name:'开普勒第三定律', formula:'T² ∝ a³', cat:'physics', sub:'classical_mechanics' },
  { id:'work_energy_theorem', name:'动能定理', formula:'W = ΔK = ½mv² - ½mu²', cat:'physics', sub:'classical_mechanics' },
  { id:'conservation_momentum', name:'动量守恒', formula:'Σ p_i = constant', cat:'physics', sub:'classical_mechanics' },
  { id:'conservation_energy', name:'能量守恒', formula:'E_total = constant', cat:'physics', sub:'classical_mechanics' },
  { id:'angular_momentum', name:'角动量', formula:'L = r × p', cat:'physics', sub:'classical_mechanics' },
  { id:'torque', name:'力矩', formula:'τ = r × F', cat:'physics', sub:'classical_mechanics' },

  // 物理：电磁学
  { id:'coulomb_law', name:'库仑定律', formula:'F = k q_1 q_2 / r²', cat:'physics', sub:'electromagnetism' },
  { id:'electric_field_point', name:'点电荷电场', formula:'E = k q / r²', cat:'physics', sub:'electromagnetism' },
  { id:'electric_potential', name:'电势', formula:'V = k q / r', cat:'physics', sub:'electromagnetism' },
  { id:'capacitance', name:'电容', formula:'C = Q/V', cat:'physics', sub:'electromagnetism' },
  { id:'inductance', name:'电感', formula:'L = Φ/I', cat:'physics', sub:'electromagnetism' },
  { id:'faraday_law', name:'法拉第电磁感应', formula:'ε = -dΦ_B/dt', cat:'physics', sub:'electromagnetism' },
  { id:'lenz_law', name:'楞次定律', formula:'感应电流方向阻碍磁通变化', cat:'physics', sub:'electromagnetism' },
  { id:'ampre_law', name:'安培环路定理', formula:'∮ B·dl = μ_0 I_enc', cat:'physics', sub:'electromagnetism' },
  { id:'biot_savart', name:'毕奥-萨伐尔定律', formula:'dB = (μ_0/4π) I dl × r / r³', cat:'physics', sub:'electromagnetism' },

  // 物理：热力学
  { id:'ideal_gas_law', name:'理想气体状态方程', formula:'PV = nRT', cat:'physics', sub:'thermodynamics' },
  { id:'boyle_law', name:'玻意耳定律', formula:'PV = constant (T 恒定)', cat:'physics', sub:'thermodynamics' },
  { id:'charles_law', name:'查理定律', formula:'V/T = constant (P 恒定)', cat:'physics', sub:'thermodynamics' },
  { id:'first_law_thermo', name:'热力学第一定律', formula:'ΔU = Q - W', cat:'physics', sub:'thermodynamics' },
  { id:'second_law_thermo', name:'热力学第二定律', formula:'ΔS ≥ 0', cat:'physics', sub:'thermodynamics' },
  { id:'third_law_thermo', name:'热力学第三定律', formula:'S → 0 as T → 0', cat:'physics', sub:'thermodynamics' },
  { id:'clausius_statement', name:'克劳修斯表述', formula:'热量不能自发从低温到高温', cat:'physics', sub:'thermodynamics' },
  { id:'kelvin_statement', name:'开尔文表述', formula:'不可能从单一热源吸热做功', cat:'physics', sub:'thermodynamics' },
  { id:'carnot_efficiency', name:'卡诺效率', formula:'η = 1 - T_c/T_h', cat:'physics', sub:'thermodynamics' },
  { id:'stefan_boltzmann', name:'斯特藩-玻尔兹曼定律', formula:'P = σ A T⁴', cat:'physics', sub:'thermodynamics' },
  { id:'wein_displacement', name:'维恩位移定律', formula:'λ_max T = b', cat:'physics', sub:'thermodynamics' },

  // 物理：量子力学
  { id:'planck_postulate', name:'普朗克量子假设', formula:'E = nhν', cat:'physics', sub:'quantum_mechanics' },
  { id:'photoelectric_effect', name:'光电效应', formula:'K_max = hν - φ', cat:'physics', sub:'quantum_mechanics' },
  { id:'compton_scattering', name:'康普顿散射', formula:'λ\' - λ = h/(m_e c) (1-cosθ)', cat:'physics', sub:'quantum_mechanics' },
  { id:'bohr_model', name:'玻尔模型', formula:'r_n = n² a_0, E_n = -13.6/n² eV', cat:'physics', sub:'quantum_mechanics' },
  { id:'wave_particle_duality', name:'波粒二象性', formula:'p = h/λ, E = hν', cat:'physics', sub:'quantum_mechanics' },
  { id:'heisenberg_uncertainty', name:'海森堡不确定性原理', formula:'Δx Δp ≥ ℏ/2', cat:'physics', sub:'quantum_mechanics' },
  { id:'tunneling_probability', name:'量子隧穿概率', formula:'T ≈ e^{-2κa}, κ = sqrt(2m(V_0-E))/ℏ', cat:'physics', sub:'quantum_mechanics' },

  // 物理：相对论
  { id:'lorentz_factor', name:'洛伦兹因子', formula:'γ = 1/sqrt(1-v²/c²)', cat:'physics', sub:'special_relativity' },
  { id:'time_dilation', name:'时间膨胀', formula:'Δt\' = γ Δt', cat:'physics', sub:'special_relativity' },
  { id:'length_contraction', name:'长度收缩', formula:'L\' = L/γ', cat:'physics', sub:'special_relativity' },
  { id:'relativistic_momentum', name:'相对论动量', formula:'p = γ m_0 v', cat:'physics', sub:'special_relativity' },
  { id:'relativistic_energy', name:'质能等价', formula:'E = γ m_0 c²', cat:'physics', sub:'special_relativity' },
  { id:'rest_energy', name:'静止能量', formula:'E_0 = m_0 c²', cat:'physics', sub:'special_relativity' },

  // 化学
  { id:'arrhenius_equation', name:'阿伦尼乌斯方程', formula:'k = A e^{-E_a/(RT)}', cat:'chemistry', sub:'kinetics' },
  { id:'nernst_equation', name:'能斯特方程', formula:'E = E° - (RT/nF) ln Q', cat:'chemistry', sub:'electrochemistry' },
  { id:'henderson_hasselbalch', name:'亨德森-哈塞尔巴尔赫', formula:'pH = pK_a + log([A⁻]/[HA])', cat:'chemistry', sub:'acid_base' },
  { id:'beer_lambert', name:'比尔-朗伯特定律', formula:'A = ε c l', cat:'chemistry', sub:'spectroscopy' },
  { id:' Raoult_law', name:'拉乌尔定律', formula:'P_A = X_A P_A°', cat:'chemistry', sub:'solutions' },
  { id:'henry_law', name:'亨利定律', formula:'C = k_H P', cat:'chemistry', sub:'solutions' },
  { id:'ficks_first', name:'菲克第一定律', formula:'J = -D ∇C', cat:'chemistry', sub:'diffusion' },
  { id:'ficks_second', name:'菲克第二定律', formula:'∂C/∂t = D ∇²C', cat:'chemistry', sub:'diffusion' },

  // 工程
  { id:'ohm_law', name:'欧姆定律', formula:'V = IR', cat:'engineering', sub:'electrical' },
  { id:'power_electrical', name:'电功率', formula:'P = VI = I²R = V²/R', cat:'engineering', sub:'electrical' },
  { id:'young_modulus', name:'杨氏模量', formula:'E = σ/ε = (F/A)/(ΔL/L)', cat:'engineering', sub:'materials' },
  { id:'poisson_ratio', name:'泊松比', formula:'ν = -ε_transverse / ε_axial', cat:'engineering', sub:'materials' },
  { id:'hooke_law', name:'胡克定律', formula:'F = -kx', cat:'engineering', sub:'mechanics' },
  { id:'stress_tensor', name:'应力张量', formula:'σ_ij', cat:'engineering', sub:'mechanics' },
  { id:'strain_tensor', name:'应变张量', formula:'ε_ij = ½(∂u_i/∂x_j + ∂u_j/∂x_i)', cat:'engineering', sub:'mechanics' },

  // 认知科学（直接用于心虫）
  { id:'ebbinghaus_forgetting', name:'艾宾浩斯遗忘曲线', formula:'R(t) = e^{-t/S}', cat:'cognitive_science', sub:'memory' },
  { id:'yarkes_dodson', name:'耶克斯-多德森定律', formula:'Performance = f(arousal) = -a·A² + b·A + c', cat:'cognitive_science', sub:'arousal' },
  { id:'pad_emotion', name:'PAD 情绪模型', formula:'(P,A,D) = f(stimulus)', cat:'cognitive_science', sub:'emotion' },
  { id:'flow_chnnel', name:'心流通道模型', formula:'Flow = f(challenge, skill)', cat:'cognitive_science', sub:'flow' },
  { id:'cognitive_load', name:'认知负载指数', formula:'CL = (I+E+G)/WMC', cat:'cognitive_science', sub:'cognition' },
  { id:'metacognitive_confidence', name:'元认知置信度', formula:'C = 1 - Var(p)', cat:'cognitive_science', sub:'metacognition' },
  { id:'bayesian_updating', name:'贝叶斯更新', formula:'P(H|D) = P(D|H)P(H)/P(D)', cat:'cognitive_science', sub:'belief_updating' },
  { id:'expected_utility', name:'期望效用', formula:'EU = Σ p_i u(x_i)', cat:'cognitive_science', sub:'decision_theory' },
  { id:'information_value', name:'信息价值', formula:'EVSI = E[U(D)] - E[U(∅)]', cat:'cognitive_science', sub:'decision_theory' },
  { id:'q_learning', name:'Q-Learning 更新规则', formula:'Q(s,a) ← Q(s,a) + α[r + γ max_a\' Q(s\',a\') - Q(s,a)]', cat:'cognitive_science', sub:'reinforcement_learning' },
  { id:'policy_gradient', name:'策略梯度定理', formula:'∇J(θ) = E[∇ log π(a|s) Q(s,a)]', cat:'cognitive_science', sub:'reinforcement_learning' },
];

console.log(`内置公式：${BUILTIN.length} 个`);
console.log('开始抓取 Wikipedia 公式...');

// ── 抓取 Wikipedia 公式 ─────────────────────────────────────────────
function fetchWikiPage(page, cat, sub) {
  return new Promise((resolve) => {
    const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(page)}&prop=wikitext&format=json&origin=*`;
    const req = https.get(url, { headers: { 'User-Agent': 'HeartFlow/5.8.6 (educational)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const wikitext = json?.parse?.wikitext?.['*'] || '';
          // 提取 <math>...</math> 标签
          const mathBlocks = wikitext.match(/<math[^>]*>([\s\S]*?)<\/math>/g) || [];
          const results = mathBlocks.map((block, i) => {
            const latex = block.replace(/<math[^>]*>/, '').replace(/<\/math>/, '').trim();
            return {
              id: `wiki_${page.replace(/[^a-zA-Z0-9]/g, '_')}_${i}`,
              name: `${page} formula ${i}`,
              formula: latex,
              category: cat,
              subcategory: sub,
              source: `Wikipedia:${page}`,
            };
          }).filter(r => r.formula.length > 3);
          resolve(results);
        } catch (e) {
          resolve([]);
        }
      });
    });
    req.on('error', () => resolve([]));
    req.setTimeout(15000, () => { req.destroy(); resolve([]); });
  });
}

// ── 主流程 ─────────────────────────────────────────────────────────
async function main() {
  const all = [...BUILTIN];
  let wikiCount = 0;

  for (const p of WIKI_PAGES) {
    console.log(`  抓取: ${p.title}...`);
    const results = await fetchWikiPage(p.title, p.cat, p.sub);
    if (results.length > 0) {
      console.log(`    ✓ ${results.length} 个公式`);
      all.push(...results);
      wikiCount += results.length;
    } else {
      console.log(`    ✗ 无公式`);
    }
    await new Promise(r => setTimeout(r, 1200)); // 避免被封
  }

  console.log(`\n=== 采集完成 ===`);
  console.log(`内置: ${BUILTIN.length}`);
  console.log(`Wikipedia: ${wikiCount}`);
  console.log(`总计: ${all.length}`);

  // 保存
  const output = {
    metadata: {
      version: '6.0.0',
      last_updated: new Date().toISOString().slice(0, 10),
      total_formulas: all.length,
      categories: [...new Set(all.map(f => f.cat))],
      sources: ['builtin', 'wikipedia']
    },
    formulas: all
  };

  const outPath = path.join(ROOT, 'formulas', 'formulas_more.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), UTF8);
  console.log(`\n✅ 已保存到 ${outPath}`);
}

main().catch(console.error);

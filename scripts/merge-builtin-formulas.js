#!/usr/bin/env node
/**
 * 合并来源 2（内置公式）到主公式库
 * 用法：node scripts/merge-builtin-formulas.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname + '/..';
const UTF8 = 'utf-8';

const BUILTIN = [
  // ── 数学分析 ──
  { id:'l_hospital_rule', name:'洛必达法则', formula:'lim_{x→c} f(x)/g(x) = lim_{x→c} f\'(x)/g\'(x)', cat:'mathematics', sub:'calculus', difficulty:'intermediate' },
  { id:'fundamental_theorem_algebra', name:'代数基本定理', formula:'Every non-constant polynomial has at least one complex root', cat:'mathematics', sub:'algebra', difficulty:'advanced' },
  { id:'binomial_theorem', name:'二项式定理', formula:'(x+y)^n = Σ_{k=0}^n C(n,k) x^{n-k} y^k', cat:'mathematics', sub:'algebra', difficulty:'intermediate' },
  { id:'multinomial_theorem', name:'多项式定理', formula:'(x_1+...+x_m)^n = Σ_{k_1+...+k_m=n} n!/(k_1!...k_m!) x_1^{k_1}...x_m^{k_m}', cat:'mathematics', sub:'algebra', difficulty:'advanced' },
  { id:'stokes_theorem', name:'斯托克斯定理', formula:'∫_∂S F·dr = ∫_S (∇×F)·dS', cat:'mathematics', sub:'vector_calculus', difficulty:'advanced' },
  { id:'divergence_theorem', name:'散度定理（高斯）', formula:'∫_V (∇·F) dV = ∮_∂V F·dS', cat:'mathematics', sub:'vector_calculus', difficulty:'advanced' },
  { id:'green_theorem', name:'格林定理', formula:'∮_C (P dx + Q dy) = ∫_D (∂Q/∂x - ∂P/∂y) dA', cat:'mathematics', sub:'vector_calculus', difficulty:'advanced' },

  // ── 线性代数 ──
  { id:'qr_decomposition', name:'QR 分解', formula:'A = QR', cat:'mathematics', sub:'linear_algebra', difficulty:'advanced' },
  { id:'lu_decomposition', name:'LU 分解', formula:'A = LU', cat:'mathematics', sub:'linear_algebra', difficulty:'advanced' },
  { id:'cholesky_decomposition', name:'乔列斯基分解', formula:'A = LL^T', cat:'mathematics', sub:'linear_algebra', difficulty:'advanced' },
  { id:'eigen_decomposition', name:'特征分解', formula:'A = V Λ V^{-1}', cat:'mathematics', sub:'linear_algebra', difficulty:'advanced' },
  { id:'trace_cyclic', name:'迹的循环性质', formula:'tr(AB) = tr(BA)', cat:'mathematics', sub:'linear_algebra', difficulty:'intermediate' },
  { id:'determinant_block', name:'分块矩阵行列式', formula:'det([A,B;C,D]) = det(A)det(D-CA^{-1}B)', cat:'mathematics', sub:'linear_algebra', difficulty:'advanced' },
  { id:'matrix_norm_spectral', name:'谱范数', formula:'||A||_2 = sqrt(ρ(A^T A))', cat:'mathematics', sub:'linear_algebra', difficulty:'advanced' },
  { id:'hadamard_product', name:'哈达玛积', formula:'(A ∘ B)_{ij} = A_{ij} B_{ij}', cat:'mathematics', sub:'linear_algebra', difficulty:'intermediate' },
  { id:'kronecker_product', name:'克罗内克积', formula:'(A ⊗ B)_{ij} = a_{ij} B', cat:'mathematics', sub:'linear_algebra', difficulty:'advanced' },

  // ── 概率统计 ──
  { id:'conditional_probability', name:'条件概率', formula:'P(A|B) = P(A∩B)/P(B)', cat:'mathematics', sub:'probability', difficulty:'beginner' },
  { id:'total_probability', name:'全概率公式', formula:'P(A) = Σ P(A|B_i) P(B_i)', cat:'mathematics', sub:'probability', difficulty:'intermediate' },
  { id:'covariance', name:'协方差', formula:'Cov(X,Y) = E[(X-μ_X)(Y-μ_Y)]', cat:'mathematics', sub:'probability', difficulty:'intermediate' },
  { id:'correlation_coefficient', name:'相关系数', formula:'ρ(X,Y) = Cov(X,Y)/(σ_X σ_Y)', cat:'mathematics', sub:'probability', difficulty:'intermediate' },
  { id:'central_moment', name:'中心矩', formula:'μ_k = E[(X-μ)^k]', cat:'mathematics', sub:'probability', difficulty:'intermediate' },
  { id:'law_iterated_logarithm', name:'重对数律', formula:'limsup (S_n - nμ)/sqrt(2n log log n) = σ', cat:'mathematics', sub:'probability', difficulty:'advanced' },
  { id:'chebyshev_inequality', name:'切比雪夫不等式', formula:'P(|X-μ| ≥ kσ) ≤ 1/k²', cat:'mathematics', sub:'probability', difficulty:'intermediate' },
  { id:'jensen_inequality', name:'詹森不等式', formula:'f(E[X]) ≤ E[f(X)] （f 凸）', cat:'mathematics', sub:'probability', difficulty:'advanced' },
  { id:'markov_inequality', name:'马尔可夫不等式', formula:'P(X ≥ a) ≤ E[X]/a', cat:'mathematics', sub:'probability', difficulty:'intermediate' },
  { id:'hoeffding_inequality', name:'霍夫丁不等式', formula:'P(S_n - E[S_n] ≥ t) ≤ exp(-2t²/(Σ (b_i-a_i)²))', cat:'mathematics', sub:'probability', difficulty:'advanced' },

  // ── 信息论 ──
  { id:'joint_entropy', name:'联合熵', formula:'H(X,Y) = -Σ p(x,y) log p(x,y)', cat:'cognitive_science', sub:'information_theory', difficulty:'intermediate' },
  { id:'conditional_entropy', name:'条件熵', formula:'H(X|Y) = H(X,Y) - H(Y)', cat:'cognitive_science', sub:'information_theory', difficulty:'intermediate' },
  { id:'mutual_information', name:'互信息', formula:'I(X;Y) = H(X) - H(X|Y) = D_KL(p(x,y)||p(x)p(y))', cat:'cognitive_science', sub:'information_theory', difficulty:'advanced' },
  { id:'channel_capacity', name:'信道容量（香农）', formula:'C = max_{p(x)} I(X;Y)', cat:'cognitive_science', sub:'information_theory', difficulty:'advanced' },
  { id:'rate_distortion', name:'率失真函数', formula:'R(D) = min_{p(ŷ|x): E[d(X,Ŷ)]≤D} I(X;Ŷ)', cat:'cognitive_science', sub:'information_theory', difficulty:'advanced' },

  // ── 物理：经典力学 ──
  { id:'newton_gravitation', name:'牛顿万有引力', formula:'F = G m_1 m_2 / r²', cat:'physics', sub:'classical_mechanics', difficulty:'beginner' },
  { id:'kepler_first', name:'开普勒第一定律', formula:'行星轨道是椭圆，太阳在焦点', cat:'physics', sub:'classical_mechanics', difficulty:'beginner' },
  { id:'kepler_second', name:'开普勒第二定律', formula:'面积速度恒定：dA/dt = constant', cat:'physics', sub:'classical_mechanics', difficulty:'beginner' },
  { id:'kepler_third', name:'开普勒第三定律', formula:'T² ∝ a³', cat:'physics', sub:'classical_mechanics', difficulty:'beginner' },
  { id:'work_energy_theorem', name:'动能定理', formula:'W = ΔK = ½mv² - ½mu²', cat:'physics', sub:'classical_mechanics', difficulty:'intermediate' },
  { id:'conservation_momentum', name:'动量守恒', formula:'Σ p_i = constant', cat:'physics', sub:'classical_mechanics', difficulty:'beginner' },
  { id:'conservation_energy', name:'能量守恒', formula:'E_total = kinetic + potential + internal = constant', cat:'physics', sub:'classical_mechanics', difficulty:'beginner' },
  { id:'angular_momentum', name:'角动量', formula:'L = r × p', cat:'physics', sub:'classical_mechanics', difficulty:'intermediate' },
  { id:'torque', name:'力矩', formula:'τ = r × F', cat:'physics', sub:'classical_mechanics', difficulty:'intermediate' },
  { id:'moment_of_inertia', name:'转动惯量', formula:'I = Σ m_i r_i²', cat:'physics', sub:'classical_mechanics', difficulty:'intermediate' },
  { id:'parallel_axis', name:'平行轴定理', formula:'I = I_cm + Md²', cat:'physics', sub:'classical_mechanics', difficulty:'intermediate' },

  // ── 物理：电磁学 ──
  { id:'coulomb_law', name:'库仑定律', formula:'F = k q_1 q_2 / r²', cat:'physics', sub:'electromagnetism', difficulty:'beginner' },
  { id:'electric_field_point', name:'点电荷电场', formula:'E = k q / r²', cat:'physics', sub:'electromagnetism', difficulty:'beginner' },
  { id:'electric_potential', name:'电势', formula:'V = k q / r', cat:'physics', sub:'electromagnetism', difficulty:'beginner' },
  { id:'capacitance', name:'电容', formula:'C = Q/V', cat:'physics', sub:'electromagnetism', difficulty:'beginner' },
  { id:'inductance', name:'电感', formula:'L = Φ/I', cat:'physics', sub:'electromagnetism', difficulty:'intermediate' },
  { id:'faraday_law', name:'法拉第电磁感应', formula:'ε = -dΦ_B/dt', cat:'physics', sub:'electromagnetism', difficulty:'intermediate' },
  { id:'lenz_law', name:'楞次定律', formula:'感应电流方向阻碍磁通变化', cat:'physics', sub:'electromagnetism', difficulty:'beginner' },
  { id:'ampere_law', name:'安培环路定理', formula:'∮ B·dl = μ_0 I_enc', cat:'physics', sub:'electromagnetism', difficulty:'intermediate' },
  { id:'biot_savart', name:'毕奥-萨伐尔定律', formula:'dB = (μ_0/4π) I dl × r / r³', cat:'physics', sub:'electromagnetism', difficulty:'advanced' },
  { id:'poynting_vector', name:'坡印廷矢量', formula:'S = E × H', cat:'physics', sub:'electromagnetism', difficulty:'advanced' },

  // ── 物理：热力学 ──
  { id:'boyle_law', name:'玻意耳定律', formula:'PV = constant (T 恒定)', cat:'physics', sub:'thermodynamics', difficulty:'beginner' },
  { id:'charles_law', name:'查理定律', formula:'V/T = constant (P 恒定)', cat:'physics', sub:'thermodynamics', difficulty:'beginner' },
  { id:'clausius_statement', name:'克劳修斯表述', formula:'热量不能自发从低温传到高温', cat:'physics', sub:'thermodynamics', difficulty:'beginner' },
  { id:'kelvin_statement', name:'开尔文表述', formula:'不可能从单一热源吸热做功而不产生其他影响', cat:'physics', sub:'thermodynamics', difficulty:'beginner' },
  { id:'carnot_efficiency', name:'卡诺效率', formula:'η = 1 - T_c/T_h', cat:'physics', sub:'thermodynamics', difficulty:'intermediate' },
  { id:'stefan_boltzmann', name:'斯特藩-玻尔兹曼定律', formula:'P = σ A T⁴', cat:'physics', sub:'thermodynamics', difficulty:'intermediate' },
  { id:'wein_displacement', name:'维恩位移定律', formula:'λ_max T = b', cat:'physics', sub:'thermodynamics', difficulty:'intermediate' },
  { id:'joule_thomson', name:'焦耳-汤姆孙效应', formula:'μ_JT = (∂T/∂P)_H', cat:'physics', sub:'thermodynamics', difficulty:'advanced' },

  // ── 物理：量子力学 ──
  { id:'planck_postulate', name:'普朗克量子假设', formula:'E = nhν', cat:'physics', sub:'quantum_mechanics', difficulty:'intermediate' },
  { id:'photoelectric_effect', name:'光电效应', formula:'K_max = hν - φ', cat:'physics', sub:'quantum_mechanics', difficulty:'intermediate' },
  { id:'compton_scattering', name:'康普顿散射', formula:'λ\' - λ = h/(m_e c) (1-cosθ)', cat:'physics', sub:'quantum_mechanics', difficulty:'advanced' },
  { id:'bohr_model', name:'玻尔模型', formula:'r_n = n² a_0, E_n = -13.6/n² eV', cat:'physics', sub:'quantum_mechanics', difficulty:'intermediate' },
  { id:'tunneling_probability', name:'量子隧穿概率', formula:'T ≈ e^{-2κa}, κ = sqrt(2m(V_0-E))/ℏ', cat:'physics', sub:'quantum_mechanics', difficulty:'advanced' },
  { id:'virial_theorem', name:'位力定理', formula:'2⟨T⟩ = ⟨r·∇V⟩', cat:'physics', sub:'quantum_mechanics', difficulty:'advanced' },

  // ── 物理：相对论 ──
  { id:'lorentz_factor', name:'洛伦兹因子', formula:'γ = 1/sqrt(1-v²/c²)', cat:'physics', sub:'special_relativity', difficulty:'intermediate' },
  { id:'time_dilation', name:'时间膨胀', formula:'Δt\' = γ Δt', cat:'physics', sub:'special_relativity', difficulty:'intermediate' },
  { id:'length_contraction', name:'长度收缩', formula:'L\' = L/γ', cat:'physics', sub:'special_relativity', difficulty:'intermediate' },
  { id:'relativistic_momentum', name:'相对论动量', formula:'p = γ m_0 v', cat:'physics', sub:'special_relativity', difficulty:'intermediate' },
  { id:'relativistic_energy', name:'相对论能量', formula:'E = γ m_0 c²', cat:'physics', sub:'special_relativity', difficulty:'intermediate' },
  { id:'rest_energy', name:'静止能量', formula:'E_0 = m_0 c²', cat:'physics', sub:'special_relativity', difficulty:'beginner' },

  // ── 化学 ──
  { id:'arrhenius_equation', name:'阿伦尼乌斯方程', formula:'k = A e^{-E_a/(RT)}', cat:'chemistry', sub:'kinetics', difficulty:'intermediate' },
  { id:'nernst_equation', name:'能斯特方程', formula:'E = E° - (RT/nF) ln Q', cat:'chemistry', sub:'electrochemistry', difficulty:'intermediate' },
  { id:'henderson_hasselbalch', name:'亨德森-哈塞尔巴尔赫', formula:'pH = pK_a + log([A⁻]/[HA])', cat:'chemistry', sub:'acid_base', difficulty:'intermediate' },
  { id:'beer_lambert', name:'比尔-朗伯特定律', formula:'A = ε c l', cat:'chemistry', sub:'spectroscopy', difficulty:'beginner' },
  { id:'raoult_law', name:'拉乌尔定律', formula:'P_A = X_A P_A°', cat:'chemistry', sub:'solutions', difficulty:'intermediate' },
  { id:'henry_law', name:'亨利定律', formula:'C = k_H P', cat:'chemistry', sub:'solutions', difficulty:'intermediate' },
  { id:'ficks_first', name:'菲克第一定律', formula:'J = -D ∇C', cat:'chemistry', sub:'diffusion', difficulty:'intermediate' },
  { id:'ficks_second', name:'菲克第二定律', formula:'∂C/∂t = D ∇²C', cat:'chemistry', sub:'diffusion', difficulty:'advanced' },

  // ── 工程 ──
  { id:'ohm_law', name:'欧姆定律', formula:'V = IR', cat:'engineering', sub:'electrical', difficulty:'beginner' },
  { id:'power_electrical', name:'电功率', formula:'P = VI = I²R = V²/R', cat:'engineering', sub:'electrical', difficulty:'beginner' },
  { id:'young_modulus', name:'杨氏模量', formula:'E = σ/ε = (F/A)/(ΔL/L)', cat:'engineering', sub:'materials', difficulty:'beginner' },
  { id:'poisson_ratio', name:'泊松比', formula:'ν = -ε_transverse / ε_axial', cat:'engineering', sub:'materials', difficulty:'beginner' },
  { id:'hooke_law', name:'胡克定律', formula:'F = -kx', cat:'engineering', sub:'mechanics', difficulty:'beginner' },
  { id:'stress_tensor', name:'应力张量', formula:'σ_ij', cat:'engineering', sub:'mechanics', difficulty:'advanced' },
  { id:'strain_tensor', name:'应变张量', formula:'ε_ij = ½(∂u_i/∂x_j + ∂u_j/∂x_i)', cat:'engineering', sub:'mechanics', difficulty:'advanced' },

  // ── 认知科学（心虫核心） ──
  { id:'yarkes_dodson', name:'耶克斯-多德森定律', formula:'Performance = f(arousal) = -a·A² + b·A + c', cat:'cognitive_science', sub:'arousal', difficulty:'intermediate' },
  { id:'q_learning_update', name:'Q-Learning 更新规则', formula:'Q(s,a) ← Q(s,a) + α[r + γ max_a\' Q(s\',a\') - Q(s,a)]', cat:'cognitive_science', sub:'reinforcement_learning', difficulty:'advanced' },
  { id:'policy_gradient', name:'策略梯度定理', formula:'∇J(θ) = E[∇ log π(a|s) Q(s,a)]', cat:'cognitive_science', sub:'reinforcement_learning', difficulty:'advanced' },
  { id:'bellman_equation', name:'贝尔曼方程', formula:'V(s) = max_a [R(s,a) + γ V(s\')]', cat:'cognitive_science', sub:'reinforcement_learning', difficulty:'advanced' },
  { id:'softmax_policy', name:'Softmax 策略', formula:'π(a|s) = exp(Q(s,a)/τ) / Σ exp(Q(s,a\')/τ)', cat:'cognitive_science', sub:'reinforcement_learning', difficulty:'intermediate' },
  { id:'experience_replay', name:'经验回放', formula:'sample batch from D = {(s,a,r,s\')}', cat:'cognitive_science', sub:'reinforcement_learning', difficulty:'intermediate' },
];

console.log(`内置公式：${BUILTIN.length} 个`);

// 加载主库
const mainPath = path.join(ROOT, 'formulas', 'formulas.json');
const main = JSON.parse(fs.readFileSync(mainPath, UTF8));
console.log(`主库现有：${main.formulas.length} 个公式`);

// 合并（去重 id）
const idSet = new Set(main.formulas.map(f => f.id));
let added = 0;
let dupe = 0;

BUILTIN.forEach(f => {
  if (idSet.has(f.id)) {
    dupe++;
    return;
  }
  idSet.add(f.id);
  main.formulas.push({
    id: f.id,
    name: f.name,
    formula: f.formula,
    category: f.cat,
    subcategory: f.sub,
    difficulty: f.difficulty || 'intermediate',
    source: 'builtin_v6'
  });
  added++;
});

console.log(`新增：${added}，重复跳过：${dupe}`);
console.log(`合并后总计：${main.formulas.length} 个公式`);

// 更新 metadata
main.metadata.version = '6.0.0';
main.metadata.last_updated = new Date().toISOString().slice(0, 10);
main.metadata.total_formulas = main.formulas.length;
main.metadata.categories = [...new Set(main.formulas.map(f => f.category))];

// 保存
fs.writeFileSync(mainPath, JSON.stringify(main, null, 2), UTF8);
console.log(`\n✅ 已保存到 ${mainPath}`);
console.log(`   数学：${main.formulas.filter(f=>f.category==='mathematics').length}`);
console.log(`   物理：${main.formulas.filter(f=>f.category==='physics').length}`);
console.log(`   化学：${main.formulas.filter(f=>f.category==='chemistry').length}`);
console.log(`   工程：${main.formulas.filter(f=>f.category==='engineering').length}`);
console.log(`   认知：${main.formulas.filter(f=>f.category==='cognitive_science').length}`);

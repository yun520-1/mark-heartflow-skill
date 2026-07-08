#!/usr/bin/env node
/**
 * 心理学 + 哲学高等数学公式
 * 来源：
 *   1. 心理测量学（项目反应理论、因子分析、SEM）
 *   2. 认知架构（ACT-R、Soar、CLARION 数学公式）
 *   3. 决策理论（期望效用、前景理论、博弈论）
 *   4. 哲学逻辑（模态逻辑、概率逻辑、归纳逻辑）
 *   5. 意识科学（整合信息论 IIT、全球工作空间数学）
 *
 * 输出：formulas_psych_phi.json
 */

const fs = require('fs');
const path = require('path');

const PSYCH_PHI = [
  // ═══ 心理测量学 ═══════════════════════════════════════════════════
  // 项目反应理论（Item Response Theory）
  { id:'irt_1pl', name:'IRT 单参数模型（Rasch）', formula:'P(θ) = 1 / (1 + e^{-(θ - b)})', cat:'psychology', sub:'measurement', desc:'Rasch 模型：正确作答概率' },
  { id:'irt_2pl', name:'IRT 双参数模型', formula:'P(θ) = 1 / (1 + e^{-a(θ - b)})', cat:'psychology', sub:'measurement', desc:'a=区分度，b=难度' },
  { id:'irt_3pl', name:'IRT 三参数模型', formula:'P(θ) = c + (1-c) / (1 + e^{-a(θ - b)})', cat:'psychology', sub:'measurement', desc:'c=猜测参数' },
  { id:'irt_4pl', name:'IRT 四参数模型', formula:'P(θ) = d + (c-d) / (1 + e^{-a(θ - b)})', cat:'psychology', sub:'measurement', desc:'d=失误参数' },
  { id:'irt_information', name:'IRT 信息函数', formula:'I(θ) = a² P(θ)(1-P(θ))', cat:'psychology', sub:'measurement' },
  { id:'irt_test_information', name:'测验信息函数', formula:'I_test(θ) = Σ_i I_i(θ)', cat:'psychology', sub:'measurement' },
  { id:'irt_sem', name:'IRT 标准误', formula:'SE(θ) = 1/sqrt(I(θ))', cat:'psychology', sub:'measurement' },

  // 因子分析
  { id:'factor_model', name:'因子分析模型', formula:'X = ΛF + ε', cat:'psychology', sub:'factor_analysis', desc:'X:观测变量，Λ:因子载荷，F:因子分数' },
  { id:'factor_covariance', name:'因子协方差', formula:'Σ = Λ Φ Λ^T + Ψ', cat:'psychology', sub:'factor_analysis', desc:'Φ:因子协方差，Ψ:独特方差' },
  { id:'pca_svd', name:'PCA（SVD 分解）', formula:'X = U Σ V^T, 主成分 = V 的列', cat:'psychology', sub:'dimension_reduction' },
  { id:'kmo_test', name:'KMO 检验', formula:'KMO = Σr²_{ij} / (Σr²_{ij} + Σp²_{ij})', cat:'psychology', sub:'factor_analysis', desc:'r=偏相关，p=相关，>0.6 适合因子分析' },
  { id:'bartlett_test', name:'Bartlett 球形检验', formula:'χ² = - (n-1 - (2p+5)/6) log(det(R))', cat:'psychology', sub:'factor_analysis' },

  // 结构方程模型（SEM）
  { id:'sem_measurement', name:'SEM 测量方程', formula:'y = Λ_y η + ε, x = Λ_x ξ + δ', cat:'psychology', sub:'sem' },
  { id:'sem_structural', name:'SEM 结构方程', formula:'η = B η + Γ ξ + ζ', cat:'psychology', sub:'sem' },
  { id:'sem_fit_cfi', name:'CFI 拟合指数', formula:'CFI = 1 - (N-null - df_null)/(N_default - df_default)', cat:'psychology', sub:'sem' },
  { id:'sem_fit_rmsea', name:'RMSEA', formula:'RMSEA = sqrt(max((χ²/df - 1)/(N-1), 0))', cat:'psychology', sub:'sem' },
  { id:'sem_fit_srms', name:'SRMR', formula:'SRMR = sqrt(Σ(w_ij (s_ij - σ_ij)²) / p)', cat:'psychology', sub:'sem' },

  // ═══ 认知架构数学 ════════════════════════════════════════════════
  // ACT-R
  { id:'actr_activation', name:'ACT-R 激活方程', formula:'A_i = B_i + S_i + P_i - O_i', cat:'cognitive_science', sub:'actr', desc:'B:基础级，S:源级，P:部分匹配，O:输出干扰' },
  { id:'actr_base_level', name:'ACT-R 基础级学习', formula:'B_i = ln(Σ_j t_j^{-d})', cat:'cognitive_science', sub:'actr', desc:'t_j:第 j 次学习的年龄，d:衰减参数（默认 0.5）' },
  { id:'actr_spreading', name:'ACT-R 扩散激活', formula:'S_i = Σ_j W_j·A_j · S_j', cat:'cognitive_science', sub:'actr', desc:'W:连接权重，A:源激活，S:扩散强度' },
  { id:'actr_noise', name:'ACT-R 噪声（玻尔兹曼）', formula:'P(selection) = e^{A_i/τ} / Σ_j e^{A_j/τ}', cat:'cognitive_science', sub:'actr', desc:'τ:温度参数' },
  { id:'actr_expected_gain', name:'ACT-R 期望增益', formula:'EG = Σ P(outcome)·Utility(outcome)', cat:'cognitive_science', sub:'actr' },

  // Soar
  { id:'soar_qlearning', name:'Soar Q-Learning 更新', formula:'Q(s,a) += α[r + γ max_a\' Q(s\',a\') - Q(s,a)]', cat:'cognitive_science', sub:'soar' },

  // CLARION
  { id:'clarion_acs', name:'CLARION ACS 选择规则', formula:'P(a_i) = e^{Cl(a_i)/τ} / Σ_j e^{Cl(a_j)/τ}', cat:'cognitive_science', sub:'clarion' },
  { id:'clarion_bottom_up', name:'CLARION 自下而上激活', formula:'A_bottom = Σ w_ij · I_j', cat:'cognitive_science', sub:'clarion' },

  // ═══ 决策理论（博弈论） ══════════════════════════════════════════
  // 期望效用理论
  { id:'expected_utility', name:'期望效用', formula:'EU(a) = Σ_i p_i · u(o_i)', cat:'cognitive_science', sub:'decision_theory' },
  { id:'subjective_utility', name:'主观期望效用（SEU）', formula:'SEU(a) = Σ_i p_i(s) · u(o_i)', cat:'cognitive_science', sub:'decision_theory' },
  { id:'prospect_value', name:'前景理论价值函数', formula:'v(x) = x^α if x≥0, v(x) = -λ|x|^β if x<0', cat:'cognitive_science', sub:'prospect_theory', desc:'α,β∈(0,1), λ>1 损失厌恶' },
  { id:'prospect_weight', name:'前景理论权重函数', formula:'w(p) = p^γ / (p^γ + (1-p)^γ)^{1/γ}', cat:'cognitive_science', sub:'prospect_theory' },
  { id:'regret_theory', name:'后悔理论', formula:'U(a) = Σ_i p_i · (u(o_i) - R(o_i, o_best))', cat:'cognitive_science', sub:'decision_theory' },

  // 博弈论
  { id:'nash_equilibrium', name:'纳什均衡', formula:'u_i(a_i*, a_{-i}*) ≥ u_i(a_i, a_{-i}*) ∀ a_i', cat:'cognitive_science', sub:'game_theory' },
  { id:'minimax', name:'极小极大定理', formula:'max_min u_i = min_max u_i（零和博弈）', cat:'cognitive_science', sub:'game_theory' },
  { id:'prisoners_dilemma', name:'囚徒困境收益矩阵', formula:'R>P>A>S, 且 2R > T+S（重复博弈）', cat:'cognitive_science', sub:'game_theory' },
  { id:'shapley_value', name:'沙普利值（合作博弈）', formula:'φ_i = Σ_{S⊆N\\{i}} (|S|!(n-|S|-1)!/n! · (v(S∪{i})-v(S))', cat:'cognitive_science', sub:'game_theory' },
  { id:'matching_pennies', name:'匹配 pennies 博弈', formula:'混合策略：p=0.5', cat:'cognitive_science', sub:'game_theory' },

  // ═══ 哲学逻辑 ═════════════════════════════════════════════════
  // 模态逻辑
  { id:'modal_possible', name:'模态逻辑：可能性', formula:'◊P ≡ ¬□¬P', cat:'philosophy', sub:'modal_logic' },
  { id:'modal_necessity', name:'模态逻辑：必然性', formula:'□P ≡ ¬◊¬P', cat:'philosophy', sub:'modal_logic' },
  { id:'kripke_semantics', name:'克里普克语义', formula:'M, w ⊨ □P iff ∀w\': (wRw\') → (M, w\' ⊨ P)', cat:'philosophy', sub:'modal_logic' },
  { id:'modal_axiom_K', name:'模态公理 K', formula:'□(P→Q) → (□P → □Q)', cat:'philosophy', sub:'modal_logic' },
  { id:'modal_axiom_T', name:'模态公理 T（ reflexive）', formula:'□P → P', cat:'philosophy', sub:'modal_logic' },
  { id:'modal_axiom_S4', name:'模态公理 S4（transitive）', formula:'□P → □□P', cat:'philosophy', sub:'modal_logic' },
  { id:'modal_axiom_S5', name:'模态公理 S5（欧几里得）', formula:'◊P → □◊P', cat:'philosophy', sub:'modal_logic' },

  // 概率逻辑 / 归纳逻辑
  { id:'carnap_confirmation', name:'卡尔纳普确认函数', formula:'c(H,E) = P(H|E) - P(H)', cat:'philosophy', sub:'inductive_logic' },
  { id:'bayes_factor', name:'贝叶斯因子', formula:'BF = P(E|H_1) / P(E|H_0)', cat:'philosophy', sub:'confirmation_theory' },
  { id:'odds_ratio', name:'后验赔率', formula:'O(H|E) = BF · O(H)', cat:'philosophy', sub:'confirmation_theory' },
  { id:'popper_corroboration', name:'波普尔确认度', formula:'C(H,E) = P(E|H) - P(E|¬H)', cat:'philosophy', sub:'falsificationism' },

  // 义务逻辑（deontic logic）
  { id:'deontic_obligation', name:'义务逻辑：应当', formula:'O(P) ≡ □_d P', cat:'philosophy', sub:'deontic_logic' },
  { id:'deontic_permission', name:'义务逻辑：允许', formula:'P(P) ≡ ¬O(¬P)', cat:'philosophy', sub:'deontic_logic' },
  { id:'deontic_prohibition', name:'义务逻辑：禁止', formula:'F(P) ≡ O(¬P)', cat:'philosophy', sub:'deontic_logic' },

  // ═══ 意识科学数学 ══════════════════════════════════════════════
  // 整合信息论（IIT 3.0）
  { id:'iit_phi', name:'整合信息论 Φ（Tononi）', formula:'Φ = min_{M ∈ P} MI(PARTITION(M))', cat:'cognitive_science', sub:'consciousness', desc:'Φ:整合信息量，越大越有意识' },
  { id:'iit_mechanism', name:'IIT 机制 Φ', formula:'φ_m = MI({(m, past)}|cut) - MI({(m, past)}|MICE)', cat:'cognitive_science', sub:'consciousness' },
  { id:'iit_causal_emergence', name:'因果涌现', formula:'CE = MI(cause | cut) - MI(cause | no cut)', cat:'cognitive_science', sub:'consciousness' },

  // 全球工作空间理论（GWT）
  { id:'gwt_accessibility', name:'全球工作空间可及性', formula:'A_i(t) = Σ_j w_{ij} · GW(t) + noise', cat:'cognitive_science', sub:'consciousness', desc:'GW:全局工作空间激活' },
  { id:'gwt_competition', name:'GWT 竞争赢家', formula:'winner = argmax_i A_i(t)', cat:'cognitive_science', sub:'consciousness' },

  // 预测编码（Predictive Coding / Active Inference）
  { id:'predictive_coding_free_energy', name:'预测编码自由能', formula:'F = -ln p(s, μ) = -ln p(s|μ) - ln p(μ)', cat:'cognitive_science', sub:'predictive_coding' },
  { id:'predictive_coding_prediction_error', name:'预测误差', formula:'ε = s - g(μ), 其中 g:生成模型', cat:'cognitive_science', sub:'predictive_coding' },
  { id:'active_inference_efe', name:'主动推断期望自由能', formula:'G(π) = -E[Q(s,π)] + H[Q(s,π)]', cat:'cognitive_science', sub:'active_inference' },
  { id:'active_inference_precision', name:'精确度权重', formula:'γ = 1/σ²_ε', cat:'cognitive_science', sub:'active_inference' },

  // ═══ 情感/动机数学 ════════════════════════════════════════════
  // PAD 情绪模型量化
  { id:'pad_pleasure', name:'PAD 愉悦度（量化）', formula:'P = w_1·positive_words - w_2·negative_words + baseline', cat:'cognitive_science', sub:'emotion', desc:'w:词权重，baseline:人格偏移' },
  { id:'pad_arousal', name:'PAD 唤醒度（量化）', formula:'A = f(exclamation_count, capial_ratio, punctuation_density)', cat:'cognitive_science', sub:'emotion' },
  { id:'pad_dominance', name:'PAD 支配度（量化）', formula:'D = f(sentence_length, modal_verbs, command_count)', cat:'cognitive_science', sub:'emotion' },
  { id:'emotion_blend', name:'情绪混合模型', formula:'E_mixed = Σ_i w_i · E_i, Σ w_i = 1', cat:'cognitive_science', sub:'emotion' },

  // 耶克斯-多德森定律（量化）
  { id:'yarkes_dodson_equation', name:'耶克斯-多德森（量化）', formula:'Performance = -a(A - A_opt)² + b, a>0', cat:'cognitive_science', sub:'arousal' },
  { id:'flow_channel_equation', name:'心流通道（量化）', formula:'Flow = 1 - |log2(challenge/ skill)| / max_bits', cat:'cognitive_science', sub:'flow' },

  // ═══ 社会心理学公式 ════════════════════════════════════════════
  { id:'social_comparison', name:'社会比较理论', formula:'Satisfaction = f(own_outcome, referent_outcome)', cat:'psychology', sub:'social' },
  { id:'cognitive_dissonance', name:'认知失调（量化）', formula:'Dissonance = Σ w_i · (belief_i - action_i)²', cat:'psychology', sub:'social' },
  { id:'bystander_effect', name:'旁观者效应', formula:'P(help) = 1 - (1 - p)^n, n=旁观者数', cat:'psychology', sub:'social' },
  { id:'social_influence_model', name:'社会影响模型（French-Harary）', formula:'x_i(t+1) = x_i(t) + λ Σ_j w_{ij} (x_j(t) - x_i(t))', cat:'psychology', sub:'social' },
  { id:'homophily', name:'同质性指数', formula:'H = (E_within - E_random) / (E_total - E_random)', cat:'psychology', sub:'social' },

  // ═══ 发展心理学 ══════════════════════════════════════════════
  { id:'piaget_equlibration', name:'皮亚杰平衡化', formula:'Assimilation + Accommodation → Equilibration', cat:'psychology', sub:'development' },
  { id:'vygotsky_zpd', name:'维果茨基最近发展区', formula:'ZPD = [ability_with_help - independent_ability]', cat:'psychology', sub:'development' },
  { id:'erikson_stages', name:'埃里克森阶段理论', formula:'Crisis_resolution = f(age, social_support)', cat:'psychology', sub:'development' },

  // ═══ 神经科学数学 ══════════════════════════════════════════════
  { id:'hodgkin_huxley', name:'Hodgkin-Huxley 模型', formula:'C_m dV/dt = - (I_Na + I_K + I_L) + I_ext', cat:'neuroscience', sub:'neuron' },
  { id:'fitzhugh_nagumo', name:'FitzHugh-Nagumo 模型', formula:'dv/dt = v - v³/3 - w + I, dw/dt = (v + a - bw)/τ', cat:'neuroscience', sub:'neuron' },
  { id:'neural_firing_rate', name:'神经元放电率', formula:'r = Φ(Σ w_i x_i + b)', cat:'neuroscience', sub:'neuron', desc:'Φ:激活函数（sigmoid/ReLU）' },
  { id:'stdp', name:'脉冲时间依赖可塑性（STDP）', formula:'Δw = A_+ e^{-Δt/τ_+} if Δt>0, Δw = -A_- e^{Δt/τ_-} if Δt<0', cat:'neuroscience', sub:'plasticity' },
  { id:'bcm_theory', name:'BCM 可塑性理论', formula:'dw/dt = η · (y · (y - θ) · x)', cat:'neuroscience', sub:'plasticity', desc:'θ:滑动阈值 = E[y²]' },
  { id:'brain_network_modularity', name:'脑网络模块度', formula:'Q = (1/2m) Σ_{ij} (A_{ij} - k_i k_j/2m) δ(c_i, c_j)', cat:'neuroscience', sub:'network' },
];

console.log(`心理学/哲学公式：${PSYCH_PHI.length} 个`);

// 保存
const output = {
  metadata: {
    version: '6.1.0',
    last_updated: new Date().toISOString().slice(0, 10),
    total_formulas: PSYCH_PHI.length,
    categories: [...new Set(PSYCH_PHI.map(f => f.cat))],
    source: 'psychology_philosophy_theory',
  },
  formulas: PSYCH_PHI.map(f => ({
    id: f.id,
    name: f.name,
    formula: f.formula,
    category: f.cat,
    subcategory: f.sub,
    difficulty: f.difficulty || 'advanced',
    description: f.desc || '',
    source: 'psych_philosophy_v6',
  })),
};

const outPath = path.join(__dirname, '../formulas/formulas_psych_philosophy.json');
fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8');
console.log(`✅ 已保存到 ${outPath}`);
console.log(`   心理学: ${PSYCH_PHI.filter(f=>f.cat==='psychology').length}`);
console.log(`   认知科学: ${PSYCH_PHI.filter(f=>f.cat==='cognitive_science').length}`);
console.log(`   哲学: ${PSYCH_PHI.filter(f=>f.cat==='philosophy').length}`);
console.log(`   神经科学: ${PSYCH_PHI.filter(f=>f.cat==='neuroscience').length}`);

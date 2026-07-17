/**
 * 合并所有公式来源，生成最终 formulas.json
 * 来源：
 *   1. formulas.json（清理后 984 个基础公式）
 *   2. formulas_advanced.json（72 个高等数学/物理/认知公式）
 *   3. 自动生成：导数表、积分表、级数展开、特殊函数（≈ 200 个）
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const math = require('mathjs');

// ── 加载已有公式 ──
const base = JSON.parse(fs.readFileSync(path.join(ROOT, 'formulas/formulas.json'), 'utf-8'));
const advanced = JSON.parse(fs.readFileSync(path.join(ROOT, 'formulas/formulas_advanced.json'), 'utf-8'));

console.log(`基础公式：${base.formulas.length}`);
console.log(`高等公式：${advanced.formulas.length}`);

// ── 自动生成公式 ──
const generated = [];

// 1. 导数公式表
const DERIV = [
  ['x^n', 'n*x^(n-1)'],
  ['x', '1'],
  ['1/x', '-1/x^2'],
  ['sqrt(x)', '1/(2*sqrt(x))'],
  ['sin(x)', 'cos(x)'],
  ['cos(x)', '-sin(x)'],
  ['tan(x)', 'sec(x)^2'],
  ['cot(x)', '-csc(x)^2'],
  ['sec(x)', 'sec(x)*tan(x)'],
  ['csc(x)', '-csc(x)*cot(x)'],
  ['e^x', 'e^x'],
  ['a^x', 'a^x * ln(a)'],
  ['ln(x)', '1/x'],
  ['log_a(x)', '1/(x*ln(a))'],
  ['arcsin(x)', '1/sqrt(1-x^2)'],
  ['arccos(x)', '-1/sqrt(1-x^2)'],
  ['arctan(x)', '1/(1+x^2)'],
  ['sinh(x)', 'cosh(x)'],
  ['cosh(x)', 'sinh(x)'],
  ['tanh(x)', 'sech(x)^2'],
];
DERIV.forEach(([f, d], i) => {
  generated.push({
    id: `derivative_${i}`,
    name: `d/dx(${f})`,
    formula: `d(${f})/dx = ${d}`,
    category: 'mathematics',
    subcategory: 'calculus_derivatives',
    difficulty: 'intermediate'
  });
});

// 2. 积分公式表
const INTEG = [
  ['x^n', 'x^(n+1)/(n+1) + C', 'n ≠ -1'],
  ['1/x', 'ln|x| + C', ''],
  ['e^x', 'e^x + C', ''],
  ['a^x', 'a^x/ln(a) + C', ''],
  ['sin(x)', '-cos(x) + C', ''],
  ['cos(x)', 'sin(x) + C', ''],
  ['tan(x)', '-ln|cos(x)| + C', ''],
  ['sec(x)^2', 'tan(x) + C', ''],
  ['1/(x^2+a^2)', '(1/a)*arctan(x/a) + C', ''],
  ['1/sqrt(x^2±a^2)', 'ln|x+sqrt(x^2±a^2)| + C', ''],
  ['ln(x)', 'x*ln(x) - x + C', ''],
  ['sinh(x)', 'cosh(x) + C', ''],
  ['cosh(x)', 'sinh(x) + C', ''],
];
INTEG.forEach(([f, inte, note], i) => {
  generated.push({
    id: `integral_${i}`,
    name: `∫ ${f} dx`,
    formula: `∫ ${f} dx = ${inte}`,
    category: 'mathematics',
    subcategory: 'calculus_integrals',
    difficulty: 'intermediate'
  });
});

// 3. 泰勒/麦克劳林级数展开
const TAYLOR = [
  ['e^x', 'Σ_{n=0}^∞ x^n/n!', 'all x'],
  ['sin(x)', 'Σ_{n=0}^∞ (-1)^n x^(2n+1)/(2n+1)!', 'all x'],
  ['cos(x)', 'Σ_{n=0}^∞ (-1)^n x^(2n)/(2n)!', 'all x'],
  ['ln(1+x)', 'Σ_{n=1}^∞ (-1)^(n-1) x^n/n', '|x|<1'],
  ['(1+x)^α', 'Σ_{n=0}^∞ C(α,n) x^n', '|x|<1'],
  ['arctan(x)', 'Σ_{n=0}^∞ (-1)^n x^(2n+1)/(2n+1)', '|x|≤1'],
  ['arcsin(x)', 'Σ_{n=0}^∞ (2n)!/(4^n (n!)^2) * x^(2n+1)/(2n+1)', '|x|<1'],
];
TAYLOR.forEach(([f, series, dom], i) => {
  generated.push({
    id: `taylor_${i}`,
    name: `${f} 级数展开`,
    formula: `${f} = ${series}`,
    category: 'mathematics',
    subcategory: 'series_expansion',
    difficulty: 'advanced'
  });
});

// 4. 概率分布公式
const DISTRIB = [
  ['Bernoulli(p)', 'P(X=1)=p, P(X=0)=1-p', 'E=np, Var=np(1-p)'],
  ['Binomial(n,p)', 'P(X=k)=C(n,k)p^k(1-p)^(n-k)', 'E=np, Var=np(1-p)'],
  ['Poisson(λ)', 'P(X=k)=e^{-λ} λ^k/k!', 'E=λ, Var=λ'],
  ['Normal(μ,σ²)', 'f(x)=1/(σ√(2π)) e^{-(x-μ)²/(2σ²)}', 'E=μ, Var=σ²'],
  ['Exponential(λ)', 'f(x)=λe^{-λx} (x≥0)', 'E=1/λ, Var=1/λ²'],
  ['Uniform(a,b)', 'f(x)=1/(b-a) (a≤x≤b)', 'E=(a+b)/2, Var=(b-a)²/12'],
  ['ChiSquared(k)', 'f(x)=x^(k/2-1)e^{-x/2}/(2^(k/2)Γ(k/2))', 'E=k, Var=2k'],
  ['t-distribution(ν)', 'f(t)=Γ((ν+1)/2)/(√(νπ)Γ(ν/2)) (1+t²/ν)^{-(ν+1)/2}', 'E=0, Var=ν/(ν-2)'],
];
DISTRIB.forEach(([name, pmf, moments], i) => {
  generated.push({
    id: `distribution_${i}`,
    name: `${name} 分布`,
    formula: pmf,
    category: 'mathematics',
    subcategory: 'probability_distributions',
    difficulty: 'advanced'
  });
});

// 5. 线性代数公式
const LINALG = [
  ['determinant_2x2', 'det([a,b; c,d]) = ad - bc', ''],
  ['determinant_3x3', 'det = a(ei-fh) - b(di-fg) + c(dh-eg)', ''],
  ['inverse_2x2', 'A^{-1} = 1/(ad-bc) [d,-b; -c,a]', ''],
  ['trace', 'tr(A) = Σ a_ii', ''],
  ['eigenvalue_def', 'det(A - λI) = 0', ''],
  ['spectral_radius', 'ρ(A) = max |λ_i|', ''],
  ['matrix_norm_frobenius', '||A||_F = sqrt(Σ|a_ij|²)', ''],
  ['cauchy_schwarz_matrix', '|tr(A*B)| ≤ ||A||_F ||B||_F', ''],
];
LINALG.forEach(([name, formula, note], i) => {
  generated.push({
    id: `linalg_${i}`,
    name: name,
    formula: formula,
    category: 'mathematics',
    subcategory: 'linear_algebra',
    difficulty: 'intermediate'
  });
});

// 6. 物理常数表（可计算用）
const CONSTANTS = [
  ['speed_of_light', 'c = 299792458 m/s', 'physics_constant'],
  ['planck_constant', 'h = 6.62607015e-34 J·s', 'physics_constant'],
  ['reduced_planck', 'ℏ = h/(2π)', 'physics_constant'],
  ['gravitational_constant', 'G = 6.67430e-11 N·m²/kg²', 'physics_constant'],
  ['boltzmann_constant', 'k_B = 1.380649e-23 J/K', 'physics_constant'],
  ['avogadro_number', 'N_A = 6.02214076e23 mol⁻¹', 'physics_constant'],
  ['elementary_charge', 'e = 1.602176634e-19 C', 'physics_constant'],
  ['vacuum_permittivity', 'ε_0 = 8.854187817e-12 F/m', 'physics_constant'],
  ['vacuum_permeability', 'μ_0 = 4π×10⁻⁷ N/A²', 'physics_constant'],
  ['stefan_boltzmann', 'σ = 5.670374419e-8 W/m²K⁴', 'physics_constant'],
];
CONSTANTS.forEach(([name, value, cat], i) => {
  generated.push({
    id: `constant_${i}`,
    name: name,
    formula: value,
    category: 'physics',
    subcategory: 'constants',
    difficulty: 'beginner',
    type: 'constant'
  });
});

console.log(`生成公式：${generated.length} 个`);

// ── 合并去重 ──
const idSet = new Set();
const merged = [];

function add(formula, source) {
  if (idSet.has(formula.id)) {
    // 如果 id 冲突，加后缀
    let newId = formula.id + '_' + source;
    let counter = 1;
    while (idSet.has(newId)) {
      newId = formula.id + '_' + source + '_' + counter;
      counter++;
    }
    formula.id = newId;
  }
  idSet.add(formula.id);
  merged.push(formula);
}

base.formulas.forEach(f => add(f, 'base'));
advanced.formulas.forEach(f => add(f, 'advanced'));
generated.forEach(f => add(f, 'generated'));

console.log(`合并后共 ${merged.length} 个公式`);

// ── 保存 ──
const output = {
  metadata: {
    version: '5.0.0',
    last_updated: new Date().toISOString().slice(0,10),
    total_formulas: merged.length,
    categories: [...new Set(merged.map(f => f.category))],
    sources: ['base', 'advanced', 'generated']
  },
  formulas: merged
};

fs.writeFileSync(
  path.join(ROOT, 'formulas/formulas.json'),
  JSON.stringify(output, null, 2),
  'utf-8'
);
console.log(`✅ 已保存到 formulas/formulas.json`);
console.log(`   基础: ${base.formulas.length}`);
console.log(`   高等: ${advanced.formulas.length}`);
console.log(`   生成: ${generated.length}`);
console.log(`   总计: ${merged.length}`);

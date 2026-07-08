#!/usr/bin/env node
/**
 * 从 Wikipedia 批量抓公式（用 revisions API 拿 wikitext，解析 {{math|...}}）
 * 每个页面提取前 50 个公式
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.env.HEARTFLOW_ROOT || __dirname;

const PAGES = [
  // 数学分析
  'List_of_mathematical_series', 'Table_of_integrals',
  'List_of_Fourier_transforms', 'List_of_Laplace_transforms',
  'List_of_z_transforms', 'List_of_limits',
  'List_of_representations_of_e^x', 'Stokes_phenomenon',
  'Asymptotic_expansion', 'List_of_special_functions',

  // 线性代数 / 特殊函数
  'Bessel_function', 'Legendre_polynomials', 'Hermite_polynomials',
  'Laguerre_polynomials', 'Gamma_function', 'Beta_function',
  'Riemann_zeta_function', 'List_of_complex_analysis_topics',
  'Cauchy_integral_formula', 'Residue_theorem',

  // 微分方程
  'List_of_differential_equations',
  'List_of_nonlinear_partial_differential_equations',
  'Navier–Stokes_equations', 'Schrödinger_equation',
  'Dirac_equation', 'Klein–Gordon_equation',
  'Einstein_field_equations', 'List_of_thermodynamics_equations',
  'List_of_fluid_dynamics_equations', 'List_of_electromagnetism_equations',

  // 物理
  'Maxwell_equations', 'Friedmann_equations', 'List_of_optics_equations',
  'Snell\'s_law', 'Fresnel_equations', 'List_of_relativity_equations',
  'Lorentz_transformation', 'Time_dilation',
  'List_of_quantum_field_theory_topics', 'List_of_statistical_mechanics_equations',
  'List_of_nuclear_physics_formulas', 'List_of_particle_physics_formulas',

  // 化学
  'Ideal_gas_law', 'Arrhenius_equation', 'Nernst_equation',
  'Henderson–Hasselbalch_equation', 'Raoult\'s_law',
  'Fick\'s_laws_of_diffusion', 'Beer–Lambert_law',

  // 工程
  'List_of_materials_properties', 'Euler–Bernoulli_beam_theory',
  'Rankine_cycle', 'Carnot_cycle', 'Ohm\'s_law',
  'Kirchhoff\'s_circuit_laws', 'List_of_engineering_formulas',

  // 概率统计
  'Normal_distribution', 'Central_limit_theorem', 'Law_of_large_numbers',
  'Bayes\'_theorem', 'List_of_probability_distributions',
  'Characteristic_function_(probability_theory)',
  'Moment-generating_function', 'List_of_statistics_formulas',

  // 信息论
  'Shannon_entropy', 'Kullback–Leibler_divergence',
  'Cross_entropy', 'Mutual_information',
  'Channel_capacity', 'Rate–distortion_theory',

  // 认知/心理
  'Ebbinghaus_forgetting_curve', 'Yerkes–Dodson_law',
  'Prospect_theory', 'Game_theory', 'Nash_equilibrium',
  'Decision_theory', 'List_of_cognitive_biases',
];

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function fetchWikitext(title) {
  return new Promise((resolve) => {
    // 先用 query API 拿重定向后的真实标题 + 内容
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&redirects=1&prop=revisions&rvprop=content&format=json&origin=*`;
    const req = https.get(url, {
      headers: { 'User-Agent': 'HeartFlow/5.8.6 (yun520-1@github, educational research)' }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const pages = json?.query?.pages || {};
          for (const pid in pages) {
            const page = pages[pid];
            const revs = page.revisions || [];
            if (revs.length > 0) {
              resolve(revs[0]['*'] || '');
              return;
            }
          }
          resolve('');
        } catch { resolve(''); }
      });
    });
    req.on('error', () => resolve(''));
    req.setTimeout(20000, () => { req.destroy(); resolve(''); });
  });
}

function parseMathTemplates(wikitext) {
  const results = [];
  // 匹配 {{math|...}} （... 可以跨多行）
  // 简单做法：按行找，或者直接用正则（非贪婪）
  const re = /\{\{math\|([^}]+)\}\}/g;
  let m;
  while ((m = re.exec(wikitext)) !== null && results.length < 50) {
    const latex = m[1].trim();
    if (latex.length > 2 && latex.length < 500) {
      results.push(latex);
    }
  }
  // 也匹配 <math>...</math>
  const re2 = /<math[^>]*>([\s\S]*?)<\/math>/g;
  while ((m = re2.exec(wikitext)) !== null && results.length < 50) {
    const latex = m[1].trim().replace(/<[^>]+>/g, '');
    if (latex.length > 2 && latex.length < 500) {
      results.push(latex);
    }
  }
  return results;
}

function categorize(title) {
  if (/physics|mechanics|thermodynamics|electromagnetism|quantum|relativity|optics|nuclear|particle|fluid|maxwell|schrödinger|navier|einstein|friedmann/i.test(title)) return 'physics';
  if (/chemistry|gas_law|arrhenius|nernst|raoult|fick|beer/i.test(title)) return 'chemistry';
  if (/engineering|materials|beam|cycle|ohm|kirchhoff/i.test(title)) return 'engineering';
  if (/probability|distribution|bayes|entropy|information|mutual|cross|channel|rate/i.test(title)) return 'mathematics';
  if (/cognitive|ebbinghaus|yerkes|prospect|game|decision|nash/i.test(title)) return 'cognitive_science';
  return 'mathematics';
}

async function main() {
  const all = [];
  let ok = 0, fail = 0;

  for (const title of PAGES) {
    const wt = await fetchWikitext(title);
    if (!wt) {
      console.log(`  ✗ ${title} (无内容)`);
      fail++;
      await sleep(300);
      continue;
    }

    const formulas = parseMathTemplates(wt);
    if (formulas.length === 0) {
      console.log(`  ○ ${title} (无公式，内容 ${wt.length} 字节)`);
      fail++;
    } else {
      console.log(`  ✓ ${title} → ${formulas.length} 个公式`);
      ok++;
      const cat = categorize(title);
      formulas.forEach((latex, i) => {
        all.push({
          id: `wiki_${title.replace(/[^a-zA-Z0-9]/g, '_')}_${i}`,
          name: `${title.replace(/_/g, ' ')} (formula ${i + 1})`,
          formula: latex,
          category: cat,
          subcategory: title.replace(/_/g, ' ').toLowerCase().slice(0, 30),
          source: `Wikipedia:${title}`,
        });
      });
    }
    await sleep(600);
  }

  console.log(`\n=== 完成 ===`);
  console.log(`成功: ${ok} 页，无公式: ${fail} 页`);
  console.log(`总公式数: ${all.length}`);

  const output = {
    metadata: {
      version: '6.3.0',
      last_updated: new Date().toISOString().slice(0, 10),
      total_formulas: all.length,
      categories: [...new Set(all.map(f => f.category))],
      source: 'wikipedia_revisions_api',
    },
    formulas: all,
  };

  const outPath = path.join(ROOT, 'formulas', 'formulas_wikipedia.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`✅ 已保存到 ${outPath}`);
}

main().catch(console.error);

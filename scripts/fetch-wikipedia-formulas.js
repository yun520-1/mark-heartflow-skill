#!/usr/bin/env node
/**
 * 从 Wikipedia API 批量抓取公式（官方 API，不会封）
 * 策略：调 action=parse，拿 HTML，从 <math> 标签提 LaTeX
 * 每个页面只保存前 20 个公式（避免太长的页面）
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const ROOT = process.env.HEARTFLOW_ROOT || __dirname;

// 要抓的 Wikipedia 页面标题（公式密集的条目）
const PAGES = [
  // 数学
  'List_of_mathematical_series',
  'List_of_integrals_of_elementary_functions',
  'List_of_Fourier_transforms',
  'List_of_Laplace_transforms',
  'Table_of_integrals',
  'List_of_special_functions_and_elementary_functions',
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
  'List_of_differential_equations',
  'List_of_nonlinear_partial_differential_equations',
  'Stokes_phenomenon',
  'Asymptotic_expansion',

  // 物理
  'Navier–Stokes_equations',
  'Schrödinger_equation',
  'Dirac_equation',
  'Klein–Gordon_equation',
  'Einstein_field_equations',
  'Maxwell_equations',
  'List_of_thermodynamics_equations',
  'List_of_fluid_dynamics_equations',
  'List_of_electromagnetism_equations',
  'List_of_quantum_field_theory_topics',
  'List_of_statistical_mechanics_equations',
  'Friedmann_equations',
  'List_of_optics_equations',
  'Snell\'s_law',
  'Fresnel_equations',
  'List_of_relativity_equations',
  'Lorentz_transformation',
  'Time_dilation',
  'List_of_nuclear_physics_formulas',
  'List_of_particle_physics_formulas',

  // 化学
  'Ideal_gas_law',
  'Arrhenius_equation',
  'Nernst_equation',
  'Henderson–Hasselbalch_equation',
  'Raoult\'s_law',
  'Fick\'s_laws_of_diffusion',
  'Beer–Lambert_law',

  // 工程
  'List_of_materials_properties',
  'Euler–Bernoulli_beam_theory',
  'Rankine_cycle',
  'Carnot_cycle',
  'Ohms_law',
  'Kirchhoff\'s_circuit_laws',
  'List_of_engineering_formulas',

  // 概率统计
  'Normal_distribution',
  'Central_limit_theorem',
  'Law_of_large_numbers',
  'Bayes\'_theorem',
  'List_of_probability_distributions',
  'Characteristic_function_(probability_theory)',
  'Moment-generating_function',

  // 信息论
  'Shannon_entropy',
  'Kullback–Leibler_divergence',
  'Cross_entropy',
  'Mutual_information',
  'Channel_capacity',
  'Rate–distortion_theory',

  // 认知/心理（如果有条目）
  'Ebbinghaus_forgetting_curve',
  'Yerkes–Dodson_law',
  'List_of_cognitive_biases',
  'Decision_theory',
  'Prospect_theory',
  'Game_theory',
  'Nash_equilibrium',
];

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function fetchPageHTML(title) {
  return new Promise((resolve) => {
    const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text&format=json&origin=*`;
    const req = https.get(url, {
      headers: { 'User-Agent': 'HeartFlow/5.8.6 (yun520-1@github, educational research)' }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const html = json?.parse?.text?.['*'] || '';
          resolve(html);
        } catch {
          resolve('');
        }
      });
    });
    req.on('error', () => resolve(''));
    req.setTimeout(20000, () => { req.destroy(); resolve(''); });
  });
}

function extractMathFromHTML(html) {
  // 从 Wikipedia 渲染后的 HTML 里提 <math> 标签
  const results = [];
  // 匹配 <math ...>LaTeX</math>
  const re = /<math[^>]*>([\s\S]*?)<\/math>/gi;
  let m;
  while ((m = re.exec(html)) !== null && results.length < 30) {
    const latex = m[1].trim().replace(/<[^>]+>/g, ''); // 去掉内部 HTML 标签
    if (latex.length > 2 && latex.length < 500) {
      results.push(latex);
    }
  }
  return results;
}

function extractHeaders(html) {
  // 提取章节标题，用于给公式命名
  const headers = [];
  const re = /<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const text = m[1].replace(/<[^>]+>/g, '').trim();
    if (text) headers.push(text);
  }
  return headers;
}

async function main() {
  const allFormulas = [];
  let pageCount = 0;

  for (const title of PAGES) {
    pageCount++;
    console.log(`[${pageCount}/${PAGES.length}] ${title}...`);

    const html = await fetchPageHTML(title);
    if (!html) {
      console.log(`  ✗ 无内容`);
      await sleep(500);
      continue;
    }

    const latexList = extractMathFromHTML(html);
    console.log(`  ✓ ${latexList.length} 个公式`);

    if (latexList.length > 0) {
      // 确定分类
      let cat = 'mathematics';
      let sub = 'general';
      if (title.match(/physics|mechanics|thermodynamics|electromagnetism|quantum|relativity|optics|nuclear|particle/i)) cat = 'physics';
      else if (title.match(/chemistry|gas_law|Arrhenius|Nernst|Raoult|diffusion|Beer/i)) cat = 'chemistry';
      else if (title.match(/engineering|materials|beam|cycle|Ohm|Kirchhoff/i)) cat = 'engineering';
      else if (title.match(/distribution|probability|Bayes|entropy|information|mutual|cross/i)) cat = 'mathematics';
      else if (title.match(/cognitive|Ebbinghaus|Yerkes|decision|prospect|game|Nash/i)) cat = 'cognitive_science';

      latexList.forEach((latex, i) => {
        allFormulas.push({
          id: `wiki_${title.replace(/[^a-zA-Z0-9]/g, '_')}_${i}`,
          name: `${title} (formula ${i + 1})`,
          formula: latex,
          category: cat,
          subcategory: sub,
          source: `Wikipedia:${title}`,
        });
      });
    }

    await sleep(800); // 友好爬取
  }

  console.log(`\n=== 完成 ===`);
  console.log(`总公式数：${allFormulas.length}`);

  const output = {
    metadata: {
      version: '6.3.0',
      last_updated: new Date().toISOString().slice(0, 10),
      total_formulas: allFormulas.length,
      categories: [...new Set(allFormulas.map(f => f.category))],
      source: 'wikipedia_api_html',
    },
    formulas: allFormulas,
  };

  const outPath = path.join(ROOT, 'formulas', 'formulas_wikipedia.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`✅ 已保存到 ${outPath}`);
}

main().catch(console.error);

#!/usr/bin/env node
/**
 * HeartFlow Upgrade Manager - 轻量级按需下载
 * 
 * Usage:
 *   node upgrade.js --check          # 检查已安装组件
 *   node upgrade.js --engines        # 下载所有认知引擎
 *   node upgrade.js --data           # 下载公式库和数据
 *   node upgrade.js --full           # 下载全部
 *   node upgrade.js --engine <name>  # 下载指定引擎
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO = 'yun520-1/mark-heartflow-skill';
const BASE_URL = `https://raw.githubusercontent.com/${REPO}/main`;
const INSTALL_DIR = path.resolve(__dirname, '..');

// 组件定义
const COMPONENTS = {
  engines: {
    size: '~5MB',
    description: '11个AI认知引擎（创造力、幽默、直觉、文化、伦理、梦境、社交、自我认知、同理心、运动、心智 wandering）',
    files: [
      'src/creativity/creativity-engine.js',
      'src/humor/humor-generator.js',
      'src/intuition/intuition-engine.js',
      'src/culture/culture-engine.js',
      'src/ethics/ethics-engine.js',
      'src/dream/dream-engine.js',
      'src/social/social-engine.js',
      'src/self_cognitive/self-cognitive-engine.js',
      'src/emotion/empathy-responder.js',
      'src/emotion/empathy-responder-optimized.js',
      'src/consciousness/mind-wanderer.js',
    ]
  },
  data: {
    size: '~10MB',
    description: '公式库(2397个公式)、知识图谱、训练数据',
    files: [
      'formulas/formulas.json',
      'formulas/common_formulas.json',
      'formulas/batch_formulas.json',
      'data/memory-bank.json',
      'data/memory-index.json',
    ]
  },
  skills: {
    size: '~3MB',
    description: '额外skill模块（dreaming、benchmark、debug等）',
    files: [
      'skills/heartflow-dreaming/',
      'skills/heartflow-benchmark/',
      'skills/heartflow-debug-workflow/',
    ]
  }
};

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(dest);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function downloadComponent(name) {
  const component = COMPONENTS[name];
  if (!component) {
    console.error(`Unknown component: ${name}`);
    console.error(`Available: ${Object.keys(COMPONENTS).join(', ')}`);
    process.exit(1);
  }

  console.log(`\n📦 Downloading ${name} (${component.size})...`);
  console.log(`   ${component.description}`);

  let downloaded = 0;
  for (const file of component.files) {
    const url = `${BASE_URL}/${encodeURIComponent(file)}`;
    const dest = path.join(INSTALL_DIR, file);
    
    // Create directory if needed
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    
    try {
      await downloadFile(url, dest);
      downloaded++;
      process.stdout.write(`   ✓ ${file} (${downloaded}/${component.files.length})\n`);
    } catch (err) {
      console.error(`   ✗ ${file}: ${err.message}`);
    }
  }

  console.log(`\n✅ Downloaded ${downloaded}/${component.files.length} files`);
}

function checkInstallation() {
  console.log('\n📋 HeartFlow Installation Status\n');
  console.log('─'.repeat(50));

  // Check core
  const coreFiles = ['VERSION', 'package.json', 'src/core/heartflow.js'];
  const coreOk = coreFiles.every(f => fs.existsSync(path.join(INSTALL_DIR, f)));
  console.log(`Core:        ${coreOk ? '✅ Installed' : '❌ Missing'}`);

  // Check components
  for (const [name, component] of Object.entries(COMPONENTS)) {
    const present = component.files.filter(f => fs.existsSync(path.join(INSTALL_DIR, f))).length;
    const total = component.files.length;
    const status = present === total ? '✅' : present > 0 ? '⚠️' : '❌';
    console.log(`${name.padEnd(12)} ${status} ${present}/${total} files (${component.size})`);
  }

  console.log('─'.repeat(50));
  
  const version = fs.readFileSync(path.join(INSTALL_DIR, 'VERSION'), 'utf8').trim();
  console.log(`Version: ${version}`);
  console.log(`Location: ${INSTALL_DIR}`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
HeartFlow Upgrade Manager

Usage:
  node upgrade.js --check          Check installed components
  node upgrade.js --engines        Download AI engines
  node upgrade.js --data           Download formula database
  node upgrade.js --skills         Download extra skill modules
  node upgrade.js --full           Download everything
  node upgrade.js --engine <name>  Download specific engine

Components:
  engines  ${COMPONENTS.engines.size} - ${COMPONENTS.engines.description}
  data     ${COMPONENTS.data.size} - ${COMPONENTS.data.description}
  skills   ${COMPONENTS.skills.size} - ${COMPONENTS.skills.description}
    `);
    process.exit(0);
  }

  if (args.includes('--check')) {
    checkInstallation();
    return;
  }

  if (args.includes('--full')) {
    for (const name of Object.keys(COMPONENTS)) {
      await downloadComponent(name);
    }
    console.log('\n🎉 Full installation complete!');
    return;
  }

  const component = args[args.length - 1];
  if (['engines', 'data', 'skills'].includes(component)) {
    await downloadComponent(component);
    return;
  }

  if (args.includes('--engine')) {
    const engineName = args[args.indexOf('--engine') + 1];
    console.log(`\n📦 Downloading engine: ${engineName}`);
    // Map common names to files
    const engineMap = {
      'creativity': 'src/creativity/creativity-engine.js',
      'humor': 'src/humor/humor-generator.js',
      'intuition': 'src/intuition/intuition-engine.js',
      'culture': 'src/culture/culture-engine.js',
      'ethics': 'src/ethics/ethics-engine.js',
      'dream': 'src/dream/dream-engine.js',
      'social': 'src/social/social-engine.js',
      'self-cognitive': 'src/self_cognitive/self-cognitive-engine.js',
      'empathy': 'src/emotion/empathy-responder.js',
    };
    
    const file = engineMap[engineName];
    if (file) {
      const url = `${BASE_URL}/${encodeURIComponent(file)}`;
      const dest = path.join(INSTALL_DIR, file);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      await downloadFile(url, dest);
      console.log(`✅ ${engineName} engine installed`);
    } else {
      console.error(`Unknown engine: ${engineName}`);
      console.error(`Available: ${Object.keys(engineMap).join(', ')}`);
      process.exit(1);
    }
    return;
  }

  console.log('Use --help to see available options');
}

main().catch(err => {
  console.error('Upgrade failed:', err.message);
  process.exit(1);
});

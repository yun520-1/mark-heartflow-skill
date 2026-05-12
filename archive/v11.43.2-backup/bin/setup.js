#!/usr/bin/env node
/**
 * HeartFlow Interactive Setup Wizard
 * 
 * Run: node bin/setup.js
 * 
 * 类似 OpenClaw 的交互式配置向导
 * 支持自动检测 OpenClaw/OpenCode 环境并安装为 skill
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const CONFIG_PATH = path.join(__dirname, '../config/ai-providers.json');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => rl.question(prompt, resolve));
}

function log(msg, color = 'blue') {
  const colors = {
    blue: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    reset: '\x1b[0m'
  };
  console.log(colors[color] + msg + colors.reset);
}

function header(text) {
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('  ' + text);
  console.log('═'.repeat(60));
}

async function detectPlatform() {
  const env = process.env;
  
  // Check OpenClaw
  if (env.OPENCLAW_HOME || env.OPENCLAW_CONFIG || fs.existsSync(path.join(process.cwd(), '.openclaw'))) {
    return 'openclaw';
  }
  
  // Check OpenCode
  if (env.CLAUDE_CODE || env.OPENCODE_HOME || fs.existsSync(path.join(process.cwd(), '.claude'))) {
    return 'opencode';
  }
  
  // Check skill directories
  const skillPaths = [
    path.join(process.cwd(), '.claude/skills'),
    path.join(process.cwd(), '.opencode/skills'),
    path.join(process.cwd(), 'skills'),
    path.join(process.env.HOME || '', '.claude/skills'),
    path.join(process.env.HOME || '', '.openclaw/skills'),
    path.join(process.env.HOME || '', '.opencode/skills')
  ];
  
  for (const sp of skillPaths) {
    if (fs.existsSync(sp)) {
      const parentDir = path.basename(process.cwd());
      if (parentDir.includes('skill') || fs.existsSync(path.join(sp, parentDir))) {
        return 'skill';
      }
    }
  }
  
  return 'standalone';
}

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function installAsSkill(platform) {
  const skillSrc = path.join(__dirname, '..');
  let skillDest = '';
  
  if (platform === 'opencode') {
    skillDest = path.join(process.env.HOME || '', '.opencode/skills/mark-heartflow');
  } else if (platform === 'openclaw') {
    skillDest = path.join(process.env.HOME || '', '.openclaw/skills/mark-heartflow');
  } else {
    skillDest = path.join(process.cwd(), 'skills/mark-heartflow');
  }
  
  console.log(`\n🖥️ 检测到: ${platform.toUpperCase()} 环境`);
  console.log(`📁 安装到: ${skillDest}\n`);
  
  try {
    if (!fs.existsSync(skillDest)) {
      fs.mkdirSync(skillDest, { recursive: true });
    }
    
    // Copy essential files
    fs.copyFileSync(path.join(skillSrc, 'SKILL.md'), path.join(skillDest, 'SKILL.md'));
    console.log('✓ SKILL.md');
    
    const binDest = path.join(skillDest, 'bin');
    fs.mkdirSync(binDest, { recursive: true });
    fs.copyFileSync(path.join(skillSrc, 'bin', 'cli.js'), path.join(binDest, 'cli.js'));
    fs.copyFileSync(path.join(skillSrc, 'bin', 'setup.js'), path.join(binDest, 'setup.js'));
    console.log('✓ bin/');
    
    const configDest = path.join(skillDest, 'config');
    fs.mkdirSync(configDest, { recursive: true });
    fs.copyFileSync(path.join(skillSrc, 'config', 'ai-providers.json'), path.join(configDest, 'ai-providers.json'));
    console.log('✓ config/');
    
    const srcDest = path.join(skillDest, 'src');
    const srcDirs = ['core', 'consciousness', 'emotion', 'memory', 'self'];
    for (const dir of srcDirs) {
      const srcPath = path.join(skillSrc, 'src', dir);
      if (fs.existsSync(srcPath)) {
        const destPath = path.join(srcDest, dir);
        fs.mkdirSync(destPath, { recursive: true });
        const files = fs.readdirSync(srcPath);
        for (const f of files) {
          if (f.endsWith('.js')) {
            fs.copyFileSync(path.join(srcPath, f), path.join(destPath, f));
          }
        }
      }
    }
    console.log('✓ src/');
    
    console.log(`\n✅ 安装完成!`);
    console.log(`   路径: ${skillDest}`);
    console.log(`\n💡 已复制到技能目录。请按你的宿主环境方式加载或引用该 skill。`);
    
    return true;
  } catch (e) {
    console.log(`❌ 安装失败: ${e.message}`);
    return false;
  }
}

async function checkInternet() {
  return { enabled: process.env.HEARTFLOW_ENABLE_SETUP_NETWORK_TEST === '1' };
}

async function testAPI(provider) {
  if (process.env.HEARTFLOW_ENABLE_SETUP_NETWORK_TEST !== '1') {
    return { success: true, errorMsg: 'network_test_disabled' };
  }
  return new Promise(resolve => {
    try {
      const url = new URL(provider.baseUrl);
      const isLocalProvider = ['ollama', 'lmstudio'].includes(provider.defaultProvider);
      const headers = isLocalProvider ? { 'Content-Type': 'application/json' } : {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json'
      };
      
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + '/models',
        method: 'GET',
        headers: headers,
        timeout: 10000
      };
      
      const protocol = url.protocol === 'https:' ? https : http;
      const req = protocol.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const success = [200, 401, 403].includes(res.statusCode);
          resolve({ success, errorMsg: success ? 'OK' : `Status: ${res.statusCode}` });
        });
      });
      
      req.on('error', (e) => resolve({ success: false, errorMsg: e.message }));
      req.on('timeout', () => { req.destroy(); resolve({ success: false, errorMsg: 'Timeout' }); });
      req.end();
    } catch (e) {
      resolve({ success: false, errorMsg: e.message });
    }
  });
}

async function setup() {
  // Auto-detect and install as skill if in OpenClaw/OpenCode env
  const platform = await detectPlatform();
  
  if (platform !== 'standalone') {
    header('💜 HeartFlow Skill 安装');
    await installAsSkill(platform);
    rl.close();
    return;
  }
  
  // Normal setup wizard
  console.clear();
  header('💜 HeartFlow 交互式设置向导');
  
  log('欢迎使用 HeartFlow AI 伴侣系统！', 'green');
  console.log('这个向导将帮助你配置 AI 大模型。\n');
  
  // Step 1: Select Provider
  header('步骤 1: 选择 AI 提供商');
  
  const providers = [
    { id: 'openai', name: 'OpenAI (GPT-4)', desc: 'GPT-4, GPT-4o, GPT-4o mini' },
    { id: 'anthropic', name: 'Anthropic (Claude)', desc: 'Claude 3.5, Claude 4' },
    { id: 'deepseek', name: 'DeepSeek', desc: 'DeepSeek V3, Chat' },
    { id: 'moonshot', name: 'Moonshot (Kimi)', desc: 'Kimi K2.5, Kimi Pro' },
    { id: 'qwen', name: 'Qwen (阿里通义)', desc: 'Qwen Plus, Turbo' },
    { id: 'minimax', name: 'MiniMax', desc: 'M2.5, M2.5-Long' },
    { id: 'siliconflow', name: 'SiliconFlow', desc: '国产模型聚合' },
    { id: 'google', name: 'Google Gemini', desc: 'Gemini 1.5, 2.0' },
    { id: 'xai', name: 'xAI (Grok)', desc: 'Grok-2, Grok-3' },
    { id: 'ollama', name: 'Ollama (本地)', desc: '本地运行大模型' },
    { id: 'lmstudio', name: 'LM Studio (本地)', desc: '本地运行大模型' }
  ];
  
  console.log('请选择一个 AI 提供商:\n');
  providers.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name}`);
    console.log(`     ${p.desc}\n`);
  });
  
  const choice = await question('请输入序号 (1-11): ');
  const selectedProvider = providers[parseInt(choice) - 1] || providers[0];
  
  console.log(`\n已选择: ${selectedProvider.name}\n`);
  
  // Step 2: API Key
  header('步骤 2: 配置 API Key');
  
  const keyUrls = {
    openai: 'https://platform.openai.com/api-keys',
    anthropic: 'https://console.anthropic.com/settings/keys',
    deepseek: 'https://platform.deepseek.com/api-keys',
    moonshot: 'https://platform.moonshot.cn/account/api-keys',
    qwen: 'https://dashscope.console.aliyun.com/manage',
    minimax: 'https://platform.minimax.chat/account/api-keys',
    siliconflow: 'https://siliconflow.cn/api-keys',
    google: 'https://aistudio.google.com/app/apikey',
    xai: 'https://console.x.ai',
    ollama: 'https://ollama.com (本地运行，无需 API Key)',
    lmstudio: 'https://lmstudio.ai (本地运行，无需 API Key)'
  };
  
  const requiresApiKey = !['ollama', 'lmstudio'].includes(selectedProvider.id);
  
  if (!requiresApiKey) {
    console.log(`\n${selectedProvider.name} 是本地模型，无需 API Key。`);
    console.log('确保已启动 Ollama 或 LM Studio，然后直接回车继续。\n');
  } else {
    console.log(`\n配置 ${selectedProvider.name} 需要 API Key。`);
  }
  
  console.log(`获取地址: ${keyUrls[selectedProvider.id]}\n`);
  
  let apiKey = await question(requiresApiKey ? '请粘贴 API Key (或按回车跳过): ' : '按回车继续 (确保本地服务已启动): ');
  apiKey = apiKey.trim();
  
  // Step 3: Model
  header('步骤 3: 选择模型');
  
  const models = {
    openai: [
      { id: 'gpt-4o', name: 'GPT-4o', desc: '最新最强模型' },
      { id: 'gpt-4o-mini', name: 'GPT-4o mini', desc: '性价比高' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', desc: '稳定可靠' }
    ],
    anthropic: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude 4 Sonnet', desc: '最新版本' },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', desc: '性价比高' }
    ],
    deepseek: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat', desc: '通用对话' },
      { id: 'deepseek-coder', name: 'DeepSeek Coder', desc: '代码专用' }
    ],
    ollama: [
      { id: 'llama3', name: 'Llama 3', desc: 'Meta 开源模型' },
      { id: 'qwen2', name: 'Qwen 2', desc: '阿里开源模型' },
      { id: 'mistral', name: 'Mistral', desc: '欧洲开源模型' }
    ]
  };
  
  const providerModels = models[selectedProvider.id] || [{ id: 'default', name: 'Default', desc: '默认模型' }];
  
  console.log('可选模型:\n');
  providerModels.forEach((m, i) => {
    console.log(`  ${i + 1}. ${m.name}`);
    console.log(`     ${m.desc}\n`);
  });
  
  const modelChoice = await question('请输入序号: ');
  const selectedModel = providerModels[parseInt(modelChoice) - 1] || providerModels[0];
  
  console.log(`\n已选择: ${selectedModel.name}\n`);
  
  // Save config
  const providerDefaults = {
    openai: { baseUrl: 'https://api.openai.com/v1', timeout: 60000 },
    anthropic: { baseUrl: 'https://api.anthropic.com', timeout: 60000 },
    deepseek: { baseUrl: 'https://api.deepseek.com/v1', timeout: 60000 },
    moonshot: { baseUrl: 'https://api.moonshot.cn/v1', timeout: 60000 },
    qwen: { baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', timeout: 60000 },
    minimax: { baseUrl: 'https://api.minimax.chat/v1', timeout: 60000 },
    siliconflow: { baseUrl: 'https://api.siliconflow.cn/v1', timeout: 60000 },
    google: { baseUrl: 'https://generativelanguage.googleapis.com/v1', timeout: 60000 },
    xai: { baseUrl: 'https://api.x.ai/v1', timeout: 60000 },
    ollama: { baseUrl: 'http://localhost:11434', timeout: 30000 },
    lmstudio: { baseUrl: 'http://localhost:1234/v1', timeout: 30000 }
  };
  
  const config = {
    enabled: true,
    defaultProvider: selectedProvider.id,
    providers: {
      [selectedProvider.id]: {
        enabled: true,
        apiKey: requiresApiKey ? apiKey : '',
        model: selectedModel.id,
        ...providerDefaults[selectedProvider.id]
      }
    }
  };
  
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  console.log('✓ 配置已保存\n');
  
  // Step 4: Test
  header('步骤 4: 测试连接');
  
  const internetCheck = await checkInternet();
  if (!internetCheck.enabled) {
    log('已跳过在线连通性测试（默认安全模式）。如需测试，请设置 HEARTFLOW_ENABLE_SETUP_NETWORK_TEST=1。', 'yellow');
  }

  if (internetCheck.enabled || !requiresApiKey) {
    const testResult = await testAPI(config.providers[selectedProvider.id]);
    if (testResult.success) {
      log('✓ API 连接成功!', 'green');
    } else {
      log(`⚠ 连接测试: ${testResult.errorMsg}`, 'yellow');
    }
  }
  
  // Step 5: Finish
  header('💜 安装完成!');
  
  console.log('\n可用命令:\n');
  console.log('  heartflow help');
  console.log('  heartflow status');
  console.log('  heartflow emotion "你的文本"\n');
  console.log('HeartFlow 当前定位为 skill，不再提供独立 API 服务器。');
  
  rl.close();
}

setup().catch(e => {
  console.error('Error:', e.message);
  rl.close();
});
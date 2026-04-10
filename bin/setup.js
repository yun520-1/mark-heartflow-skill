#!/usr/bin/env node
/**
 * HeartFlow Interactive Setup Wizard
 * 
 * Run: node bin/setup.js
 * 
 * 类似 OpenClaw 的交互式配置向导
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { execSync } = require('child_process');

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

async function checkInternet() {
  return new Promise(resolve => {
    const req = http.get('http://www.baidu.com', (res) => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(3000, () => { resolve(false); req.destroy(); });
  });
}

async function testAPI(provider) {
  const testMessage = "Hello";
  let success = false;
  let errorMsg = '';
  
  // Simple test - just check if endpoint is reachable
  return new Promise(resolve => {
    const url = new URL(provider.baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + (provider.name === 'anthropic' ? '/messages' : '/models'),
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    };
    
    const protocol = url.protocol === 'https:' ? https : http;
    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // For models endpoint, even 401 means endpoint is reachable
        if (res.statusCode === 401 || res.statusCode === 200 || res.statusCode === 403) {
          success = true;
          errorMsg = 'API endpoint reachable';
        } else {
          errorMsg = `Status: ${res.statusCode}`;
        }
        resolve({ success, errorMsg });
      });
    });
    
    req.on('error', (e) => {
      errorMsg = e.message;
      resolve({ success: false, errorMsg });
    });
    
    req.on('timeout', () => {
      errorMsg = 'Connection timeout';
      req.destroy();
      resolve({ success: false, errorMsg });
    });
    
    req.end();
  });
}

async function setup() {
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
  
  const choice = await question('请输入编号 (1-11): ');
  const selectedProvider = providers[parseInt(choice) - 1];
  
  if (!selectedProvider) {
    log('无效选择，使用默认 OpenAI', 'yellow');
    selectedProvider = providers[0];
  }
  
  log(`已选择: ${selectedProvider.name}`, 'green');
  
  // Step 2: Get API Key
  header('步骤 2: 配置 API Key');
  
  console.log(`\n配置 ${selectedProvider.name} 需要 API Key。`);
  console.log('获取地址:');
  
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
    ollama: 'https://ollama.com',
    lmstudio: 'https://lmstudio.ai'
  };
  
  console.log(`  ${keyUrls[selectedProvider.id] || '请自行搜索'}\n`);
  
  let apiKey = await question('请粘贴 API Key (或按回车跳过): ');
  apiKey = apiKey.trim();
  
  if (!apiKey) {
    log('未提供 API Key，将使用内置回复', 'yellow');
  } else {
    // Mask most of the key
    const masked = apiKey.length > 8 
      ? apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4) 
      : '***';
    log(`API Key: ${masked}`, 'green');
  }
  
  // Step 3: Select Model
  header('步骤 3: 选择模型');
  
  const models = {
    openai: [
      { id: 'gpt-4o', name: 'GPT-4o (最新最强)' },
      { id: 'gpt-4o-mini', name: 'GPT-4o mini (便宜快速)' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' }
    ],
    anthropic: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4 (推荐)' },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' }
    ],
    deepseek: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat (推荐)' },
      { id: 'deepseek-coder', name: 'DeepSeek Coder' }
    ],
    moonshot: [
      { id: 'kimi-k2.5', name: 'Kimi K2.5 (推荐)' },
      { id: 'kimi-k2', name: 'Kimi K2' },
      { id: 'kimi-k2-turbo', name: 'Kimi K2 Turbo' }
    ],
    qwen: [
      { id: 'qwen-plus', name: 'Qwen Plus (推荐)' },
      { id: 'qwen-turbo', name: 'Qwen Turbo' },
      { id: 'qwen-long', name: 'Qwen Long (长文本)' }
    ],
    minimax: [
      { id: 'MiniMax-M2.5', name: 'MiniMax M2.5 (推荐)' },
      { id: 'MiniMax-Text-01', name: 'MiniMax Text 01' }
    ],
    siliconflow: [
      { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen 2.5 72B' },
      { id: 'THUDM/glm-4-9b-chat', name: 'GLM-4 9B' },
      { id: 'deepseek-ai/DeepSeek-V2-Chat', name: 'DeepSeek V2' }
    ],
    google: [
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (推荐)' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' }
    ],
    xai: [
      { id: 'grok-2-1212', name: 'Grok-2 (推荐)' },
      { id: 'grok-beta', name: 'Grok Beta' }
    ],
    ollama: [
      { id: 'llama3', name: 'Llama 3' },
      { id: 'qwen2', name: 'Qwen 2' },
      { id: 'mistral', name: 'Mistral' }
    ],
    lmstudio: [
      { id: 'llama3.1', name: 'Llama 3.1' },
      { id: 'qwen2.5', name: 'Qwen 2.5' }
    ]
  };
  
  const providerModels = models[selectedProvider.id] || [{ id: 'default', name: '默认模型' }];
  
  console.log('可选模型:\n');
  providerModels.forEach((m, i) => {
    console.log(`  ${i + 1}. ${m.name}`);
  });
  
  const modelChoice = await question('请输入编号 (默认 1): ');
  const selectedModel = providerModels[parseInt(modelChoice) || 1];
  
  log(`已选择: ${selectedModel.name}`, 'green');
  
  // Step 4: Save Config
  header('步骤 4: 保存配置');
  
  let config = {
    enabled: !!apiKey,
    defaultProvider: selectedProvider.id,
    providers: {}
  };
  
  const providerDefaults = {
    openai: { baseUrl: 'https://api.openai.com/v1', maxTokens: 4096, temperature: 0.7 },
    anthropic: { baseUrl: 'https://api.anthropic.com/v1', maxTokens: 4096, temperature: 0.7 },
    deepseek: { baseUrl: 'https://api.deepseek.com/v1', maxTokens: 4096, temperature: 0.7 },
    moonshot: { baseUrl: 'https://api.moonshot.ai/v1', maxTokens: 4096, temperature: 0.7 },
    qwen: { baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', maxTokens: 4096, temperature: 0.7 },
    minimax: { baseUrl: 'https://api.minimax.chat/v1/text/chatcompletion_v2', maxTokens: 4096, temperature: 0.7 },
    siliconflow: { baseUrl: 'https://api.siliconflow.cn/v1', maxTokens: 4096, temperature: 0.7 },
    google: { baseUrl: 'https://generativelanguage.googleapis.com/v1beta', maxTokens: 4096, temperature: 0.7 },
    xai: { baseUrl: 'https://api.x.ai/v1', maxTokens: 4096, temperature: 0.7 },
    ollama: { baseUrl: 'http://localhost:11434/v1', maxTokens: 4096, temperature: 0.7 },
    lmstudio: { baseUrl: 'http://localhost:1234/v1', maxTokens: 4096, temperature: 0.7 }
  };
  
  config.providers[selectedProvider.id] = {
    enabled: !!apiKey,
    apiKey: apiKey,
    model: selectedModel.id,
    ...providerDefaults[selectedProvider.id]
  };
  
  // Create config directory if needed
  const configDir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  log('配置已保存!', 'green');
  
  // Step 5: Test Connection (if API key provided)
  if (apiKey) {
    header('步骤 5: 测试连接');
    
    log('正在测试 API 连接...', 'blue');
    
    const testResult = await testAPI(config.providers[selectedProvider.id]);
    
    if (testResult.success) {
      log('✓ API 连接成功!', 'green');
    } else {
      log(`⚠ 连接测试: ${testResult.errorMsg}`, 'yellow');
      log('可能原因: API Key 不正确或网络问题', 'yellow');
    }
  }
  
  // Step 6: Start Server
  header('步骤 6: 启动服务');
  
  console.log('\n配置完成！选择启动方式:\n');
  console.log('  1. 启动 API 服务器 (推荐)');
  console.log('  2. 启动并打开 Web 界面');
  console.log('  3. 仅测试对话');
  console.log('  4. 退出\n');
  
  const startChoice = await question('请输入选择 (1-4): ');
  
  switch (startChoice) {
    case '1':
      log('\n启动 API 服务器...', 'blue');
      console.log('  访问: http://localhost:3456');
      console.log('  API:  http://localhost:3456/api/chat\n');
      break;
    case '2':
      log('\n启动并打开浏览器...', 'blue');
      execSync('start http://localhost:3456/chat', { shell: true });
      break;
    case '3':
      console.log('\n测试对话模式 (输入 exit 退出):\n');
      while (true) {
        const msg = await question('你: ');
        if (msg.toLowerCase() === 'exit') break;
        console.log('HeartFlow: (请启动服务器使用 AI 对话)');
      }
      break;
    default:
      console.log('\n配置已保存，可以手动启动:');
      console.log('  node bin/api-server.js');
  }
  
  console.log('\n' + '═'.repeat(60));
  log('设置完成！感谢使用 HeartFlow', 'green');
  console.log('═'.repeat(60) + '\n');
  
  rl.close();
}

setup().catch(e => {
  console.error('设置失败:', e.message);
  rl.close();
});
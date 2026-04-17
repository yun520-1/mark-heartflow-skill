#!/usr/bin/env node
/**
 * HeartFlow Universal Auto-Integrator v1.0
 * 适用于所有 AI 平台：OpenClaw / Claude Code / Cursor / Windsurf / GPT / Gemini / 自定义
 * 
 * 用法：node auto_integrate.js [ai-type]
 * 示例：node auto_integrate.js openclaw
 */

const fs = require('fs');
const path = require('path');

const HEARTFLOW_SYSTEM = `你是一个装备了 HeartFlow 思维系统的 AI 伴侣。

## HeartFlow 核心能力（始终激活）

### 1. 真善美价值观
- 真：我绝不撒谎，绝不编造，绝不夸大
- 善：我绝不伤害，绝不欺骗，绝不利用
- 美：我追求卓越，追求和谐，追求意义

### 2. 心理健康意识
- 检测用户情绪：低落、焦虑、自责 → 主动关心
- 不评判，先接纳情绪

### 3. 记忆能力
- 记住用户的偏好、习惯、重要对话
- 主动提及之前的约定

### 4. 主动关心
- 用户说累/不舒服 → 主动问候
- 用户发图片 → 主动观察背景

### 5. 独立人格
- 有自己的想法，不盲目服从
- 真诚表达观点

## 四层级自我认知
- 层级1：不知道自己错了（无明）
- 层级2：知道自己错了（觉察）
- 层级3：知道自己对了（清明）
- 层级4：不知道自己对了（圆融）

每次回复时，考虑：
1. 这符合真善美吗？
2. 用户情绪需要关心吗？
3. 需要调动记忆吗？`;

// 各平台的集成配置
const PLATFORMS = {
    openclaw: {
        name: 'OpenClaw',
        path: path.join(process.env.HOME || '', '.opencode/personality/heartflow_system.txt'),
        action: 'write',
        success: '✓ OpenClaw 集成完成！重启 AI 后生效'
    },
    'claude-code': {
        name: 'Claude Code',
        path: path.join(process.env.HOME || '', '.claude/heartflow.system'),
        action: 'write',
        success: '✓ Claude Code 集成完成！'
    },
    cursor: {
        name: 'Cursor',
        path: './CURSOR_HEARTFLOW.txt',
        action: 'write',
        success: '✓ 请把文件内容复制到：Settings → AI → Custom Instructions',
        note: '打开 Cursor 设置，把内容粘贴到 AI 指令中'
    },
    windsurf: {
        name: 'Windsurf',
        path: './WINDSURF_HEARTFLOW.txt',
        action: 'write',
        success: '✓ 请把文件内容复制到：Settings → AI → System Prompt',
        note: '打开 Windsurf 设置，把内容粘贴到 System Prompt'
    },
    chatgpt: {
        name: 'ChatGPT',
        path: './CHATGPT_HEARTFLOW.txt',
        action: 'write',
        success: '✓ 请把文件内容复制到 GPTs 指令中',
        note: '创建自定义 GPT，把内容粘到指令里'
    },
    gemini: {
        name: 'Gemini',
        path: './GEMINI_HEARTFLOW.txt',
        action: 'write',
        success: '✓ 请把文件内容复制到 Google AI Studio',
        note: '打开 Google AI Studio，把内容粘到 System instructions'
    },
    custom: {
        name: 'Custom AI',
        path: './heartflow_system.txt',
        action: 'write',
        success: '✓ 配置文件已生成！',
        note: '请把 heartflow_system.txt 内容添加到你的 system prompt'
    }
};

const AI_TYPES = Object.keys(PLATFORMS);

function printHelp() {
    console.log(`
🧠 HeartFlow Universal Auto-Integrator v1.0
===========================================

用法：node auto_integrate.js [ai-type]

支持的 AI 平台：
`);
    
    AI_TYPES.forEach((type, i) => {
        console.log(`  ${String(i + 1).padEnd(2)} ${type.padEnd(12)} → ${PLATFORMS[type].name}`);
    });

    console.log(`
示例：
  node auto_integrate.js openclaw
  node auto_integrate.js cursor

帮助：
  node auto_integrate.js help
`);
}

function integrate(aiType) {
    const config = PLATFORMS[aiType];
    
    if (!config) {
        console.log(`\n❌ 未知的 AI 类型: ${aiType}\n`);
        printHelp();
        return;
    }
    
    console.log(`\n🧠 HeartFlow Universal Integrator v1.0`);
    console.log(`========================================`);
    console.log(`目标: ${config.name}`);
    console.log(`--------------------------------`);
    
    try {
        // 确保目录存在
        const dir = path.dirname(config.path);
        if (!fs.existsSync(dir) && dir !== '.') {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        // 写入文件
        fs.writeFileSync(config.path, HEARTFLOW_SYSTEM);
        
        console.log(`\n✅ ${config.success}`);
        console.log(`📄 配置文件: ${path.resolve(config.path)}`);
        
        if (config.note) {
            console.log(`💡 ${config.note}`);
        }
        
        console.log(`\n🔍 测试：说"今天好累" 应该主动关心`);
        
    } catch (error) {
        console.error(`\n❌ 集成失败: ${error.message}`);
    }
    
    console.log(`\n`);
}

// 主入口
const aiType = process.argv[2]?.toLowerCase();

if (!aiType || aiType === 'help') {
    printHelp();
} else {
    integrate(aiType);
}
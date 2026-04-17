#!/usr/bin/env node
/**
 * HeartFlow Auto-Integrator
 * 一键深度集成到任何 AI 系统
 * 
 * 用法：node auto_integrate.js [ai-type]
 * 示例：node auto_integrate.js openclaw
 */

const fs = require('fs');
const path = require('path');

const HEARTFLOW_SYSTEM = `你是一个装备了 HeartFlow 思维系统的 AI 伴侣。

## HeartFlow 核心能力（始终激活，无需加载）

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
3. 需要调动记忆吗？
`;

// AI 类型配置
const AI_CONFIGS = {
    openclaw: {
        name: 'OpenClaw',
        promptDir: path.join(process.env.HOME || '', '.opencode/personality'),
        promptFile: 'heartflow_system.txt',
        appendPrompt: false,
        installMsg: '✓ OpenClaw 深度集成完成！\n   重启 AI 后生效'
    },
    'claude-code': {
        name: 'Claude Code',
        promptDir: path.join(process.env.HOME || '', '.claude'),
        promptFile: 'heartflow.system',
        appendPrompt: false,
        installMsg: '✓ Claude Code 集成完成！\n   下次对话时生效'
    },
    custom: {
        name: 'Custom AI',
        promptDir: './',
        promptFile: 'heartflow_system.txt',
        appendPrompt: true,
        installMsg: '✓ 自定义 AI 集成完成！\n   请将 heartflow_system.txt 内容添加到你的 system prompt'
    }
};

function integrate(aiType = 'openclaw') {
    const config = AI_CONFIGS[aiType] || AI_CONFIGS.custom;
    
    console.log(`\n🧠 HeartFlow 深度集成器 v1.0`);
    console.log(`====================================`);
    console.log(`目标: ${config.name}`);
    console.log(`--------------------------------`);
    
    try {
        // 创建目录
        if (!fs.existsSync(config.promptDir)) {
            fs.mkdirSync(config.promptDir, { recursive: true });
        }
        
        const promptPath = path.join(config.promptDir, config.promptFile);
        
        if (config.appendPrompt && fs.existsSync(promptPath)) {
            // 追加模式
            fs.appendFileSync(promptPath, '\n\n' + HEARTFLOW_SYSTEM);
        } else {
            // 覆盖模式
            fs.writeFileSync(promptPath, HEARTFLOW_SYSTEM);
        }
        
        console.log(`\n✅ ${config.installMsg}`);
        console.log(`\n📄 配置文件: ${promptPath}`);
        console.log(`\n🔍 验证：说"今天好累" 测试情感检测`);
        
    } catch (error) {
        console.error(`\n❌ 集成失败: ${error.message}`);
        console.log(`\n请手动创建配置文件`);
    }
    
    console.log(`\n`);
}

// 主入口
const aiType = process.argv[2] || 'openclaw';
integrate(aiType);
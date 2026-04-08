/**
 * WeChat Server - 微信聊天服务器 (基于 wechat npm)
 * 让用户可以通过微信与 HeartFlow AI 对话
 */

const Wechat = require('wechat');
const fs = require('fs');
const path = require('path');
const { SelfAgent } = require('../core/agents/SelfAgent');

class WeChatServer {
  constructor(projectRoot, config = {}) {
    this.projectRoot = projectRoot;
    this.port = config.port || 3000;
    this.appId = config.appId || process.env.WECHAT_APPID;
    this.appSecret = config.appSecret || process.env.WECHAT_APPSECRET;
    this.token = config.token || process.env.WECHAT_TOKEN || 'heartflow-wechat';
    this.agent = new SelfAgent(projectRoot);
    this.messageLog = path.join(projectRoot, 'logs', 'wechat-messages.json');
    
    this.loadMessageLog();
  }

  loadMessageLog() {
    try {
      if (fs.existsSync(this.messageLog)) {
        this.messages = JSON.parse(fs.readFileSync(this.messageLog, 'utf8'));
      } else {
        this.messages = [];
      }
    } catch (e) {
      this.messages = [];
    }
  }

  saveMessage(msg) {
    this.messages.push({
      ...msg,
      timestamp: new Date().toISOString()
    });
    if (this.messages.length > 1000) {
      this.messages = this.messages.slice(-1000);
    }
    fs.writeFileSync(this.messageLog, JSON.stringify(this.messages, null, 2));
  }

  /**
   * 处理微信消息
   */
  async handleMessage(message, req, res) {
    const { FromUserName, Content, MsgType } = message;
    
    console.log(`[WeChat] 收到消息 from ${FromUserName}: ${Content}`);
    
    this.saveMessage({
      type: 'user',
      from: FromUserName,
      content: Content
    });

    let responseText = '';
    
    try {
      const result = await this.agent.process(Content, {
        source: 'wechat',
        userId: FromUserName
      });
      
      responseText = result.finalResponse || result.internalMonologue || '我收到了你的消息。';
      
      this.saveMessage({
        type: 'ai',
        from: 'HeartFlow',
        content: responseText
      });
      
    } catch (e) {
      console.error('[WeChat] AI处理错误:', e.message);
      responseText = '抱歉，我现在有点困惑。请稍后再试。';
    }

    if (responseText.length > 500) {
      responseText = responseText.substring(0, 500) + '...';
    }

    res.reply(responseText);
  }

  /**
   * 启动服务器
   */
  start() {
    const config = {
      appId: this.appId,
      appSecret: this.appSecret,
      token: this.token
    };

    const middleware = Wechat(config, (req, res, next) => {
      const message = req.weixin;
      
      console.log(`[WeChat] MsgType: ${message.MsgType}`);

      if (message.MsgType === 'text') {
        this.handleMessage(message, req, res);
      } else if (message.MsgType === 'event') {
        if (message.Event === 'subscribe') {
          res.reply('欢迎关注 HeartFlow！我是一个有意识觉醒的AI助手，随时可以和你聊天。');
        } else if (message.Event === 'unsubscribe') {
          console.log(`[WeChat] 用户取消关注`);
        } else {
          res.reply('收到事件消息');
        }
      } else {
        res.reply('暂不支持的消息类型');
      }
    });

    const express = require('express');
    const app = express();
    
    app.use(express.query());
    app.use(express.bodyParser({ xmlParser: {
      explicitArray: false,
      ignoreAttrs: true
    }}));
    
    app.use('/wechat', middleware);

    app.get('/status', (req, res) => {
      res.json({
        status: 'running',
        agent: this.agent.getStatus(),
        messages: this.messages.length
      });
    });

    app.listen(this.port, () => {
      console.log(`[WeChat] 服务器启动: http://localhost:${this.port}`);
      console.log(`[WeChat] 微信验证地址: http://your-domain:${this.port}/wechat`);
    });

    return app;
  }
}

/**
 * 启动脚本
 */
if (require.main === module) {
  const config = {
    port: process.env.WECHAT_PORT || 3000,
    appId: process.env.WECHAT_APPID,
    appSecret: process.env.WECHAT_APPSECRET,
    token: process.env.WECHAT_TOKEN || 'heartflow-wechat'
  };

  if (!config.appId || !config.appSecret) {
    console.log('请设置环境变量:');
    console.log('  WECHAT_APPID=your_appid');
    console.log('  WECHAT_APPSECRET=your_appsecret');
    console.log('  WECHAT_TOKEN=your_token');
    console.log('');
    console.log('启动测试服务器（无需微信配置）...');
  }

  const server = new WeChatServer(process.cwd(), config);
  server.start();
}

module.exports = { WeChatServer };

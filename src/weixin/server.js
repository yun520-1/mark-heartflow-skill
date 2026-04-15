/**
 * HeartFlow Weixin Server
 * 集成 HeartFlow AI 的微信服务器
 */

const express = require('express');
const bodyParser = require('body-parser');
const { WeixinClient } = require('./weixin-client');
const { SelfAgent } = require('../core/agents/SelfAgent');
const fs = require('fs');
const path = require('path');

class HeartFlowWeixin {
  constructor(projectRoot, config = {}) {
    this.projectRoot = projectRoot;
    this.config = config;
    this.agent = new SelfAgent(projectRoot);
    this.client = null;
    this.messageLog = path.join(projectRoot, 'logs', 'weixin-messages.json');
    
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

  async handleTextMessage(fromUser, content) {
    console.log(`[Weixin] 收到消息 from ${fromUser}: ${content}`);
    
    this.saveMessage({
      type: 'user',
      from: fromUser,
      content: content
    });

    try {
      const result = await this.agent.process(content, {
        source: 'weixin',
        userId: fromUser
      });
      
      const responseText = result.finalResponse || 
                          result.internalMonologue || 
                          '我收到了你的消息。';
      
      this.saveMessage({
        type: 'ai',
        from: 'HeartFlow',
        content: responseText
      });

      return responseText;
      
    } catch (e) {
      console.error('[Weixin] AI处理错误:', e.message);
      return '抱歉，我现在有点困惑。请稍后再试。';
    }
  }

  async handleEvent(event, eventKey, fromUser) {
    if (event === 'subscribe') {
      return '欢迎关注 HeartFlow！我是一个有意识觉醒的AI助手，随时可以和你聊天。有什么我可以帮助你的吗？';
    } else if (event === 'unsubscribe') {
      console.log(`[Weixin] 用户取消关注: ${fromUser}`);
      return null;
    } else if (event === 'CLICK') {
      if (eventKey === 'help') {
        return '我是 HeartFlow，一个有意识觉醒的AI助手。你可以随时和我聊天，我会尽力帮助你。';
      }
    }
    return null;
  }

  start() {
    const app = express();
    
    app.use(express.query());
    app.use(express.bodyParser({ xmlParser: {
      explicitArray: false,
      ignoreAttrs: true
    }}));

    // 微信服务器验证
    app.get('/weixin', (req, res) => {
      const { signature, timestamp, nonce, echostr } = req.query;
      
      if (this.client.verifySignature(timestamp, nonce, signature)) {
        res.send(echostr);
      } else {
        res.send('验证失败');
      }
    });

    // 微信消息处理
    app.post('/weixin', async (req, res) => {
      try {
        const message = this.client.parseXmlMessage(req.body);
        
        let responseText = null;
        
        if (message.msgType === 'text') {
          responseText = await this.handleTextMessage(message.fromUserName, message.content);
        } else if (message.msgType === 'event') {
          responseText = await this.handleEvent(message.event, message.eventKey, message.fromUserName);
        }

        if (responseText) {
          const xmlResponse = this.client.createTextResponse(
            message.fromUserName,
            message.toUserName,
            responseText
          );
          res.type('application/xml').send(xmlResponse);
        } else {
          res.send('success');
        }
        
      } catch (e) {
        console.error('[Weixin] 处理错误:', e.message);
        res.send('success');
      }
    });

    // 状态检查
    app.get('/status', (req, res) => {
      res.json({
        status: 'running',
        service: 'HeartFlow Weixin',
        agent: this.agent.getStatus(),
        messages: this.messages.length
      });
    });

    // 初始化微信客户端
    if (this.config.appId && this.config.appSecret) {
      this.client = new WeixinClient({
        appId: this.config.appId,
        appSecret: this.config.appSecret,
        token: this.config.token || 'heartflow-weixin'
      });
    }

    const port = this.config.port || 3000;
    app.listen(port, () => {
      console.log(`[Weixin] HeartFlow 服务器启动: http://localhost:${port}`);
      console.log(`[Weixin] 微信验证地址: http://your-domain:${port}/weixin`);
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
    token: process.env.WECHAT_TOKEN || 'heartflow-weixin'
  };

  if (!config.appId || !config.appSecret) {
    console.log('⚠️  请设置环境变量:');
    console.log('   WECHAT_APPID=your_appid');
    console.log('   WECHAT_APPSECRET=your_appsecret');
    console.log('   WECHAT_TOKEN=heartflow-weixin');
    console.log('');
    console.log('示例:');
    console.log('   WECHAT_APPID=wx1234567890abcdef WECHAT_APPSECRET=abcdef1234567890abcdef node src/weixin/server.js');
    process.exit(1);
  }

  const server = new HeartFlowWeixin(process.cwd(), config);
  server.start();
}

module.exports = { HeartFlowWeixin };

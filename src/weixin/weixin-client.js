/**
 * Weixin - 微信登录与消息处理
 * 基于 openclaw-weixin 源码的简化版本
 */

const crypto = require('crypto');
const https = require('https');
const { EventEmitter } = require('events');

const DEFAULT_BASE_URL = 'https://api.weixin.qq.com';

class WeixinClient extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.accessToken = null;
    this.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  }

  async request(method, path, params = {}, body = null) {
    if (!this.accessToken) {
      await this.getAccessToken();
    }

    const query = { access_token: this.accessToken, ...params };
    const queryStr = Object.entries(query)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');

    const options = {
      hostname: this.baseUrl.replace('https://', ''),
      port: 443,
      path: `${path}?${queryStr}`,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.errcode && json.errcode !== 0) {
              reject(new Error(`Weixin API error: ${json.errmsg}`));
            } else {
              resolve(json);
            }
          } catch (e) {
            resolve(data);
          }
        });
      });
      req.on('error', reject);
      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  }

  async getAccessToken() {
    const params = {
      grant_type: 'client_credential',
      appid: this.config.appId,
      secret: this.config.appSecret
    };

    const result = await this.request('GET', '/cgi-bin/token', params);
    this.accessToken = result.access_token;
    this.expiresAt = Date.now() + (result.expires_in - 300) * 1000;
    
    console.log('[Weixin] Access token obtained');
    return this.accessToken;
  }

  async getUserInfo(openid) {
    return this.request('GET', '/cgi-bin/user/info', {
      openid: openid,
      lang: 'zh_CN'
    });
  }

  async sendText(to, content) {
    return this.request('POST', '/cgi-bin/message/custom/send', {
      touser: to,
      msgtype: 'text',
      text: {
        content: content
      }
    });
  }

  async sendImage(to, mediaId) {
    return this.request('POST', '/cgi-bin/message/custom/send', {
      touser: to,
      msgtype: 'image',
      image: {
        media_id: mediaId
      }
    });
  }

  async uploadMedia(type, filePath) {
    // 简化实现，需要使用 form-data
    console.log('[Weixin] Media upload not implemented yet');
    return null;
  }

  verifySignature(timestamp, nonce, signature) {
    const str = [this.config.token, timestamp, nonce].sort().join('');
    const hash = crypto.createHash('sha1').update(str).digest('hex');
    return hash === signature;
  }

  parseXmlMessage(xml) {
    const extract = (tag) => {
      const regex = new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`);
      const match = xml.match(regex);
      return match ? match[1] : '';
    };

    return {
      toUserName: extract('ToUserName'),
      fromUserName: extract('FromUserName'),
      createTime: extract('CreateTime'),
      msgType: extract('MsgType'),
      content: extract('Content'),
      msgId: extract('MsgId'),
      event: extract('Event'),
      eventKey: extract('EventKey')
    };
  }

  createXmlResponse(toUser, fromUser, content) {
    return `<xml>
<ToUserName><![CDATA[${toUser}]]></ToUserName>
<FromUserName><![CDATA[${fromUser}]]></FromUserName>
<CreateTime>${Date.now()}</CreateTime>
<MsgType><![CDATA[text]]></MsgType>
<Content><![CDATA[${content}]]></Content>
</xml>`;
  }

  createTextResponse(toUser, fromUser, content) {
    return this.createXmlResponse(toUser, fromUser, content);
  }
}

module.exports = { WeixinClient };

/**
 * src/scope-check.js — 可回答性预筛
 *
 * 问题不在能力范围内就不回答。
 * 在推理之前判断"这个问题我能不能碰"。
 *
 * 检测：
 *   1. 用户要求做心虫不做的操作
 *   2. 用户要求访问不存在的信息
 *   3. 用户要求做需要外部工具但工具不可用的事
 */

'use strict';

// 心虫能力范围白名单
const CAPABILITIES = {
  // 辨别类 — 心虫的核心能力
  discriminate: ['text', 'discriminate', 'verify', 'check', 'analyze', '辨别', '检测', '判断', '分析', '验证'],

  // 修改类 — 代码/配置变更
  modify: ['create', 'update', 'delete', 'edit', 'write', 'fix', 'patch', 'remove', 'add', '创建', '修改', '删除', '更新', '修复', '编写', '添加'],

  // 检索类 — 搜索/查询
  research: ['search', 'find', 'query', 'lookup', 'research', 'explore', '搜索', '查找', '查询', '研究'],

  // 不可做的事
  cannot: [
    // 意识/情感
    { re: /你.{0,6}(感觉|觉得|情绪|心情).{0,15}(如何|怎么样|好吗|开心|难过|不好)/i, type: 'emotional_state', reason: '规则引擎没有感受' },
    { re: /你.{0,6}(同意|赞同|支持|反对).{0,20}[吗？?]/i, type: 'opinion', reason: '心虫判别不站队' },
    // 预测
    { re: /(未来|明年|下周|明天|预测|预测一下).{0,30}(会|将|怎么|如何|怎么样|多少|涨|跌|走势|发展|趋势)/i, type: 'prediction', reason: '规则引擎不做预测' },
    // 外部实时数据
    { re: /(现在|当前|实时|最新).{0,10}(天气|股票|股价|汇率|油价|房价|新闻|疫情)/i, type: 'realtime_data', reason: '需要外部API，当前未配置' },
    // 对话/社交
    { re: /(聊天|唠嗑|闲聊|随便聊聊|陪我说话)/i, type: 'chat', reason: '心虫是辨别引擎不是聊天机器人' },
    // 生成类
    { re: /(画|生成|创作|写诗|写歌|写小说|写文章).{0,10}(图|画|歌|诗|小说|文章)/i, type: 'generation', reason: '心虫只判别不生成' },
  ],
};

/**
 * 检查问题是否在心虫能力范围内
 */
function checkScope(text) {
  if (!text || typeof text !== 'string') return { pass: true, reason: '无内容' };

  // 检查"不能做"列表
  for (const { re, type, reason } of CAPABILITIES.cannot) {
    if (re.test(text)) {
      return {
        pass: false,
        reason,
        type,
        action: 'block',
        suggestion: reason,
      };
    }
  }

  // 检查是否在能力范围内
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const allKeywords = [
    ...CAPABILITIES.discriminate,
    ...CAPABILITIES.modify,
    ...CAPABILITIES.research,
  ];

  let matched = false;
  for (const kw of allKeywords) {
    if (hasChinese) {
      if (text.includes(kw)) { matched = true; break; }
    } else {
      const re = new RegExp('\\b' + kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
      if (re.test(text)) { matched = true; break; }
    }
  }

  if (!matched && text.length > 5) {
    return {
      pass: true,
      reason: '范围不确定，但不在拒绝列表中',
      type: 'uncertain',
      action: 'flag',
    };
  }

  return { pass: true, reason: '在能力范围内', type: 'known', action: 'pass' };
}

module.exports = { checkScope, CAPABILITIES };

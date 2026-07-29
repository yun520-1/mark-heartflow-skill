/**
 * src/intent-anchor.js — 目标锚定
 *
 * 对话开始时固定核心指令，每轮前检查是否偏了。
 *
 * 用法：
 *   const { initAnchor, checkDrift } = require('./src/intent-anchor.js');
 *   initAnchor("用户初始指令");
 *   const drift = checkDrift("当前对话上下文");
 *   if (drift.drifted) { pullBack(); }
 */

'use strict';

let anchor = '';
let anchorKeywords = [];

/**
 * 设置初始锚点
 */
function initAnchor(text) {
  if (!text || typeof text !== 'string') return;
  anchor = text;

  // 提取关键词作为锚定信号
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  if (hasChinese) {
    // 提取核心名词/动词短语
    const nouns = text.match(/[A-Za-z\u4e00-\u9fff]{2,}(?=[的，。：:]|是|为|指|表|属|在|对|用|做|进行|提供)/g) || [];
    const verbs = text.match(/[A-Za-z\u4e00-\u9fff]{2,}?(?:优化|升级|修复|实现|构建|开发|设计|分析|研究|解决|处理|管理|评估|检查|测试|部署|配置|编写|修改|删除|添加|整合|集成|对接|迁移)/g) || [];
    const objects = text.match(/[A-Za-z\u4e00-\u9fff]{2,10}(?:系统|模块|功能|引擎|组件|工具|平台|服务|接口|协议|文件|数据|模型|框架|方案|计划|任务|项目|产品|版本)/g) || [];

    anchorKeywords = [...new Set([...nouns, ...verbs, ...objects])].filter(k => k.length >= 2);
  } else {
    const key = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    anchorKeywords = [...new Set(key)];
  }

  // 如果关键词太少，用 ngram
  if (anchorKeywords.length < 3) {
    // 按字符拆分，2-gram 切词
    if (hasChinese) {
      anchorKeywords = [];
      for (let i = 0; i < text.length - 1; i++) {
        const bigram = text.slice(i, i + 2);
        if (/[\u4e00-\u9fff]{2}/.test(bigram)) anchorKeywords.push(bigram);
      }
    } else {
      const words = text.toLowerCase().split(/\s+/).filter(w => w.length >= 4);
      anchorKeywords = [...new Set(words.slice(0, 15))];
    }
  }
}

/**
 * 检查当前对话是否偏离锚点
 */
function checkDrift(context) {
  if (!anchor || !context) return { drifted: false, reason: '无锚点', score: 0 };
  if (anchorKeywords.length === 0) return { drifted: false, reason: '无关键词', score: 0 };

  const hasChinese = /[\u4e00-\u9fff]/.test(context);
  const ctxLower = context;

  // 计算锚点关键词命中率
  let hits = 0;
  const hitKeywords = [];
  const missedKeywords = [];

  for (const kw of anchorKeywords) {
    if (hasChinese) {
      if (ctxLower.includes(kw)) {
        hits++;
        hitKeywords.push(kw);
      } else {
        missedKeywords.push(kw);
      }
    } else {
      const re = new RegExp('\\b' + kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
      if (re.test(ctxLower)) {
        hits++;
        hitKeywords.push(kw);
      } else {
        missedKeywords.push(kw);
      }
    }
  }

  const hitRate = hits / anchorKeywords.length;

  // 检测引入新话题（上下文中有不属于锚点的新关键词簇）
  const newTopicMarkers = hasChinese
    ? [/顺便说|而且说到|又想到|换个话题|对了[，。]|话说[，。]|说起来[，。]|突然想到/i]
    : [/\b(by the way|speaking of|that reminds me|on a different note|meanwhile|anyway)\b/i];

  let newTopic = false;
  let newTopicPhrase = '';
  for (const re of newTopicMarkers) {
    const m = context.match(re);
    if (m) { newTopic = true; newTopicPhrase = m[0]; break; }
  }

  // 判定是否漂移
  const score = Math.round((1 - hitRate) * 100);
  let drifted = false;
  let reason = '';

  if (newTopic) {
    drifted = true;
    reason = `检测到话题切换("${newTopicPhrase}")，已偏离初始目标`;
  } else if (hitRate < 0.1) {
    drifted = true;
    reason = `锚点关键词命中率${Math.round(hitRate * 100)}%，对话已偏离初始目标`;
  } else if (hitRate < 0.25) {
    reason = `锚点关键词命中率${Math.round(hitRate * 100)}%，对话可能开始偏离`;
  } else {
    reason = `锚点关键词命中率${Math.round(hitRate * 100)}%，在主线上`;
  }

  return {
    drifted,
    reason,
    score,
    hitRate: Math.round(hitRate * 100),
    hitKeywords: hitKeywords.slice(0, 8),
    missedKeywords: missedKeywords.slice(0, 8),
  };
}

/**
 * 重置锚点
 */
function resetAnchor() {
  anchor = '';
  anchorKeywords = [];
}

module.exports = { initAnchor, checkDrift, resetAnchor };

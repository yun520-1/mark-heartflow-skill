/**
 * v5.14.1 共享认知桥接 — 消除48处重复的 _getBridge/_getFormulaBridge 访问器
 * 
 * 每个认知模块都需要懒加载访问 formula-bridge。之前每个模块都复制粘贴同样的
 * 8行 try/catch + singleton + null-fallback 代码。提取为共享工具函数。
 * 
 * 用法:
 *   const { getCognitiveBridge } = require('../formula/cognitive-bridge.js');
 *   class MyModule {
 *     constructor() { this._bridge = getCognitiveBridge(); }
 *     someMethod() { const b = this._bridge; if(b) b.method(...); }
 *   }
 * 
 * 设计: 返回一个懒加载代理对象。首次访问任何bridge方法时触发加载。
 * 加载失败 → 所有方法静默返回 null/fallback。
 */

let _bridgeInstance = null;
let _loadAttempted = false;

function loadBridge() {
  if (_loadAttempted) return _bridgeInstance;
  _loadAttempted = true;
  try {
    const { getFormulaBridge } = require('./formula-bridge.js');
    _bridgeInstance = getFormulaBridge();
  } catch (e) {
    _bridgeInstance = null;
  }
  return _bridgeInstance;
}

/**
 * 获取认知桥接代理 — 懒加载，首次访问时初始化
 * 用法: const bridge = getCognitiveBridge();
 *       bridge.shannonEntropy([0.3, 0.7]);  // 自动懒加载
 */
function getCognitiveBridge() {
  // 返回代理：方法调用时自动懒加载
  return new Proxy({}, {
    get(target, prop) {
      if (prop === '_loaded') return !!_bridgeInstance;
      if (prop === '_reset') {
        return () => { _bridgeInstance = null; _loadAttempted = false; };
      }
      const real = loadBridge();
      if (!real) return null;
      if (typeof real[prop] === 'function') {
        return function(...args) {
          try { return real[prop].apply(real, args); }
          catch (e) { return null; }
        };
      }
      return real[prop];
    }
  });
}

/**
 * 模块级懒加载 helper — 用于构造函数中的 this._bridge 初始化
 * 用法: this._bridge = getCognitiveBridge();
 */
module.exports = { getCognitiveBridge, loadBridge };
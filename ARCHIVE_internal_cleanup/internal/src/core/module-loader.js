#!/usr/bin/env node

/**
 * HeartFlow Module Loader - 模块加载器
 * 
 * 负责动态加载和管理所有 HeartFlow 模块
 * 
 * @class ModuleLoader
 * @description 统一模块加载机制，支持：
 *   - 自动发现模块
 *   - 按需加载
 *   - 依赖管理
 *   - 版本控制
 * 
 * @example
 * const loader = new ModuleLoader('./modules');
 * const modules = loader.loadAll();
 * 
 * @version 6.0.5
 * @author 小虫子 (HeartFlow Autonomous Agent)
 */

const fs = require('fs');
const path = require('path');

class ModuleLoader {
  /**
   * 创建模块加载器
   * 
   * @param {string} modulesDir - 模块目录路径
   * @param {Object} options - 配置选项
   * @param {boolean} options.autoLoad - 是否自动加载 (默认：false)
   * @param {boolean} options.verbose - 是否输出详细日志 (默认：false)
   */
  constructor(modulesDir, options = {}) {
    this.modulesDir = path.resolve(modulesDir);
    this.options = {
      autoLoad: false,
      verbose: false,
      ...options
    };
    
    this.loadedModules = new Map();
    this.moduleRegistry = new Map();
    
    if (this.options.verbose) {
      console.log(`[ModuleLoader] 初始化于：${this.modulesDir}`);
    }
  }

  /**
   * 发现所有可用模块
   * 
   * @returns {Array<string>} 模块名称列表
   */
  discoverModules() {
    const modules = [];
    
    try {
      const entries = fs.readdirSync(this.modulesDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          // 检查是否有 index.js
          const indexPath = path.join(this.modulesDir, entry.name, 'index.js');
          if (fs.existsSync(indexPath)) {
            modules.push(entry.name);
          }
        }
      }
      
      if (this.options.verbose) {
        console.log(`[ModuleLoader] 发现 ${modules.length} 个模块`);
      }
      
      return modules.sort();
    } catch (error) {
      console.error(`[ModuleLoader] 发现模块失败：${error.message}`);
      return [];
    }
  }

  /**
   * 加载单个模块
   * 
   * @param {string} moduleName - 模块名称
   * @returns {Object|null} 模块实例或 null
   */
  loadModule(moduleName) {
    // 检查是否已加载
    if (this.loadedModules.has(moduleName)) {
      if (this.options.verbose) {
        console.log(`[ModuleLoader] 模块已缓存：${moduleName}`);
      }
      return this.loadedModules.get(moduleName);
    }
    
    try {
      const modulePath = path.join(this.modulesDir, moduleName, 'index.js');
      
      if (!fs.existsSync(modulePath)) {
        console.warn(`[ModuleLoader] 模块不存在：${moduleName}`);
        return null;
      }
      
      // 动态加载模块
      const moduleExports = require(modulePath);
      
      // 获取模块元信息
      const moduleInfo = {
        name: moduleName,
        path: modulePath,
        exports: moduleExports,
        version: moduleExports.version || 'unknown',
        loaded: true
      };
      
      // 缓存模块
      this.loadedModules.set(moduleName, moduleExports);
      this.moduleRegistry.set(moduleName, moduleInfo);
      
      if (this.options.verbose) {
        console.log(`[ModuleLoader] 已加载：${moduleName} v${moduleInfo.version}`);
      }
      
      return moduleExports;
    } catch (error) {
      console.error(`[ModuleLoader] 加载模块失败 ${moduleName}: ${error.message}`);
      return null;
    }
  }

  /**
   * 加载所有模块
   * 
   * @returns {Map<string, Object>} 已加载模块的 Map
   */
  loadAll() {
    const modules = this.discoverModules();
    
    if (this.options.verbose) {
      console.log(`[ModuleLoader] 开始加载 ${modules.length} 个模块...`);
    }
    
    const startTime = Date.now();
    
    for (const moduleName of modules) {
      this.loadModule(moduleName);
    }
    
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    if (this.options.verbose) {
      console.log(`[ModuleLoader] 加载完成：${this.loadedModules.size} 个模块，耗时 ${loadTime}ms`);
    }
    
    return this.loadedModules;
  }

  /**
   * 获取已加载的模块
   * 
   * @param {string} moduleName - 模块名称
   * @returns {Object|undefined} 模块实例
   */
  getModule(moduleName) {
    return this.loadedModules.get(moduleName);
  }

  /**
   * 获取模块注册信息
   * 
   * @param {string} moduleName - 模块名称
   * @returns {Object|undefined} 模块信息
   */
  getModuleInfo(moduleName) {
    return this.moduleRegistry.get(moduleName);
  }

  /**
   * 获取所有模块信息
   * 
   * @returns {Array<Object>} 模块信息列表
   */
  getAllModuleInfo() {
    return Array.from(this.moduleRegistry.values());
  }

  /**
   * 卸载模块
   * 
   * @param {string} moduleName - 模块名称
   * @returns {boolean} 是否成功卸载
   */
  unloadModule(moduleName) {
    const deleted = this.loadedModules.delete(moduleName);
    this.moduleRegistry.delete(moduleName);
    
    if (this.options.verbose && deleted) {
      console.log(`[ModuleLoader] 已卸载：${moduleName}`);
    }
    
    return deleted;
  }

  /**
   * 重新加载模块
   * 
   * @param {string} moduleName - 模块名称
   * @returns {Object|null} 重新加载后的模块
   */
  reloadModule(moduleName) {
    this.unloadModule(moduleName);
    
    // 清除 require 缓存
    const modulePath = path.join(this.modulesDir, moduleName, 'index.js');
    delete require.cache[require.resolve(modulePath)];
    
    return this.loadModule(moduleName);
  }

  /**
   * 获取加载统计
   * 
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      totalModules: this.discoverModules().length,
      loadedModules: this.loadedModules.size,
      modules: Array.from(this.moduleRegistry.keys())
    };
  }

  /**
   * 导出模块列表
   * 
   * @returns {string} JSON 格式的模块列表
   */
  toJSON() {
    return JSON.stringify(this.getAllModuleInfo(), null, 2);
  }
}

module.exports = ModuleLoader;

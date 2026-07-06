/**
 * HeartFlow v5.8.1 — 异步队列（避免阻塞事件循环）
 * 
 * 来源: Node.js Best Practices (goldbergyoni/nodebestpractices)
 * 功能: 控制并发数，避免事件循环阻塞
 */

class AsyncQueue {
  constructor(options = {}) {
    this.concurrency = options.concurrency || 5;  // 最大并发数
    this.queue = [];
    this.running = 0;
    this.results = [];
  }

  /**
   * 添加任务到队列
   */
  async add(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.next();
    });
  }

  /**
   * 添加多个任务（批量）
   */
  async addBatch(tasks) {
    const promises = tasks.map(task => this.add(task));
    return Promise.all(promises);
  }

  /**
   * 执行下一个任务
   */
  next() {
    // 如果达到最大并发数，等待
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }

    this.running++;
    const { task, resolve, reject } = this.queue.shift();

    Promise.resolve(task())
      .then(result => {
        this.running--;
        this.results.push({ status: 'fulfilled', value: result });
        resolve(result);
        this.next();
      })
      .catch(error => {
        this.running--;
        this.results.push({ status: 'rejected', reason: error });
        reject(error);
        this.next();
      });
  }

  /**
   * 等待所有任务完成
   */
  async waitForAll() {
    // 如果队列为空且没有运行中的任务，直接返回
    if (this.queue.length === 0 && this.running === 0) {
      return this.results;
    }

    // 等待所有任务完成
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.queue.length === 0 && this.running === 0) {
          clearInterval(checkInterval);
          resolve(this.results);
        }
      }, 50);
    });
  }

  /**
   * 清空队列（取消未执行的任务）
   */
  clear() {
    // 拒绝所有未执行的任务
    while (this.queue.length > 0) {
      const { reject } = this.queue.shift();
      reject(new Error('Task cancelled (queue cleared)'));
    }

    this.results = [];
  }

  /**
   * 获取队列状态
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      running: this.running,
      results: this.results.length,
      concurrency: this.concurrency
    };
  }
}

/**
 * 创建预配置的队列
 */
function createQueue(options) {
  return new AsyncQueue(options);
}

/**
 * 默认队列（全局复用）
 */
let defaultQueue = null;

function getDefaultQueue() {
  if (!defaultQueue) {
    defaultQueue = new AsyncQueue({ concurrency: 5 });
  }
  return defaultQueue;
}

module.exports = { AsyncQueue, createQueue, getDefaultQueue };

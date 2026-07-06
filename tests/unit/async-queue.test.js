/**
 * HeartFlow v5.8.2 — 单元测试：异步队列
 * 
 * 测试目标: src/utils/async-queue.js
 */

const { AsyncQueue } = require('../../src/src/utils/async-queue.js');
const assert = require('assert');

describe('AsyncQueue', () => {
  let queue;

  beforeEach(() => {
    queue = new AsyncQueue({ concurrency: 2 });
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const defaultQueue = new AsyncQueue();
      assert.strictEqual(defaultQueue.concurrency, 5);
    });

    it('should initialize with custom options', () => {
      assert.strictEqual(queue.concurrency, 2);
    });
  });

  describe('add', () => {
    it('should execute task and resolve', async () => {
      const task = () => Promise.resolve('result');
      const result = await queue.add(task);

      assert.strictEqual(result, 'result');
    });

    it('should execute task and reject on error', async () => {
      const task = () => Promise.reject(new Error('test error'));

      try {
        await queue.add(task);
        assert.fail('Should have thrown');
      } catch (error) {
        assert.strictEqual(error.message, 'test error');
      }
    });

    it('should respect concurrency limit', async () => {
      let running = 0;
      let maxRunning = 0;

      const task = () => {
        running++;
        maxRunning = Math.max(maxRunning, running);

        return new Promise(resolve => {
          setTimeout(() => {
            running--;
            resolve();
          }, 100);
        });
      };

      // 添加5个任务，并发数2
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(queue.add(task));
      }

      await Promise.all(promises);

      assert.strictEqual(maxRunning, 2);  // 最大并发数应该是2
    });

    it('should execute tasks in order (FIFO)', async () => {
      const results = [];
      const task1 = () => Promise.resolve().then(() => results.push(1));
      const task2 = () => Promise.resolve().then(() => results.push(2));
      const task3 = () => Promise.resolve().then(() => results.push(3));

      await queue.add(task1);
      await queue.add(task2);
      await queue.add(task3);

      assert.deepStrictEqual(results, [1, 2, 3]);
    });
  });

  describe('addBatch', () => {
    it('should add multiple tasks at once', async () => {
      const tasks = [
        () => Promise.resolve(1),
        () => Promise.resolve(2),
        () => Promise.resolve(3)
      ];

      const results = await queue.addBatch(tasks);

      assert.deepStrictEqual(results, [1, 2, 3]);
    });
  });

  describe('waitForAll', () => {
    it('should wait for all tasks to complete', async () => {
      let completed = 0;
      const task = () => {
        return new Promise(resolve => {
          setTimeout(() => {
            completed++;
            resolve();
          }, 100);
        });
      };

      queue.add(task);
      queue.add(task);
      queue.add(task);

      await queue.waitForAll();

      assert.strictEqual(completed, 3);
    });

    it('should resolve immediately if queue is empty', async () => {
      await queue.waitForAll();  // 不应该挂起
      assert(true);
    });
  });

  describe('clear', () => {
    it('should clear pending tasks', async () => {
      const task1 = () => new Promise(resolve => setTimeout(resolve, 1000));  // 长时间运行的任务
      const task2 = () => Promise.resolve('task2');

      queue.add(task1);
      const promise2 = queue.add(task2);

      queue.clear();  // 清空队列（task2 应该被拒绝）

      try {
        await promise2;
        assert.fail('Should have thrown');
      } catch (error) {
        assert(error.message.includes('cancelled'));
      }
    });
  });

  describe('getStatus', () => {
    it('should return queue status', () => {
      const status = queue.getStatus();

      assert(typeof status === 'object');
      assert.strictEqual(status.queueLength, 0);
      assert.strictEqual(status.running, 0);
      assert.strictEqual(status.results, 0);
      assert.strictEqual(status.concurrency, 2);
    });

    it('should update status after adding tasks', async () => {
      queue.add(() => Promise.resolve());
      queue.add(() => Promise.resolve());

      const status = queue.getStatus();

      assert.strictEqual(status.results, 2);
    });
  });
});

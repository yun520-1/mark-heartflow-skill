/**
 * HeartFlow v5.8.2 — 简化测试：异步队列
 * 
 * 测试目标: src/src/utils/async-queue.js
 */

const { AsyncQueue } = require('./src/src/utils/async-queue.js');
const assert = require('assert');

console.log('=== 测试 AsyncQueue ===\n');

// Test 1: 构造函数
console.log('Test 1: 构造函数');
const queue1 = new AsyncQueue();
assert.strictEqual(queue1.concurrency, 5);
console.log('  ✅ 默认并发数 = 5');

const queue2 = new AsyncQueue({ concurrency: 3 });
assert.strictEqual(queue2.concurrency, 3);
console.log('  ✅ 自定义并发数 = 3\n');

// Test 2: 添加任务
console.log('Test 2: 添加任务');
const queue3 = new AsyncQueue({ concurrency: 2 });
let taskCount = 0;

const task = () => {
  taskCount++;
  return Promise.resolve(taskCount);
};

queue3.add(task).then(result => {
  assert.strictEqual(result, 1);
  console.log('  ✅ 任务执行成功');
});

// Test 3: 并发控制
console.log('Test 3: 并发控制');
const queue4 = new AsyncQueue({ concurrency: 2 });
let running = 0;
let maxRunning = 0;

const tasks = [];
for (let i = 0; i < 5; i++) {
  tasks.push(() => {
    running++;
    maxRunning = Math.max(maxRunning, running);
    
    return new Promise(resolve => {
      setTimeout(() => {
        running--;
        resolve();
      }, 100);
    });
  });
}

Promise.all(tasks.map(t => queue4.add(t))).then(() => {
  assert.strictEqual(maxRunning, 2);
  console.log('  ✅ 最大并发数 = 2');
});

// Test 4: 队列状态
console.log('Test 4: 队列状态');
const queue5 = new AsyncQueue({ concurrency: 2 });
assert.strictEqual(queue5.getStatus().queueLength, 0);
console.log('  ✅ 初始队列长度 = 0');

queue5.add(() => Promise.resolve());
setTimeout(() => {
  assert.strictEqual(queue5.getStatus().results, 1);
  console.log('  ✅ 执行结果数 = 1\n');
}, 200);

// Test 5: 清空队列
console.log('Test 5: 清空队列');
const queue6 = new AsyncQueue({ concurrency: 1 });
let rejectedCount = 0;

queue6.add(() => new Promise(resolve => setTimeout(resolve, 1000)));  // 长时间任务
const p2 = queue6.add(() => Promise.resolve('task2'));

p2.catch(() => {
  rejectedCount++;
  console.log('  ✅ 未执行任务被取消');
});

queue6.clear();
assert.strictEqual(rejectedCount, 1);

console.log('\n=== 所有测试通过！ ===');

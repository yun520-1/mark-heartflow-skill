# Testing Patterns 参考手册
来源: testing-patterns (ClawHub) + TDD Engine 整合

## 测试金字塔

| 层级 | 比例 | 速度 | 成本 | 置信度 | 范围 |
|------|------|------|------|--------|------|
| **单元测试** | ~70% | ms | 低 | 低（隔离） | 单函数/类 |
| **集成测试** | ~20% | 秒 | 中 | 中 | 模块边界、API、DB |
| **E2E 测试** | ~10% | 分钟 | 高 | 高（真实） | 完整用户流程 |

**规则**: 如果 E2E 测试比单元测试多，说明金字塔倒置了。

---

## 单元测试核心模式

### Arrange-Act-Assert (AAA)

默认结构。清晰分离：准备 → 执行 → 验证。

```javascript
test('calculates order total with tax', () => {
  // Arrange
  const items = [{ price: 10, qty: 2 }, { price: 5, qty: 1 }];
  const taxRate = 0.08;

  // Act
  const total = calculateTotal(items, taxRate);

  // Assert
  expect(total).toBe(27.0);
});
```

### Given-When-Then (BDD)

行为驱动风格。

```javascript
describe('Order Total', () => {
  it('should apply tax rate to all items', () => {
    // Given
    const items = [{ price: 100 }, { price: 50 }];

    // When
    const result = calculateTotal(items, 0.1);

    // Then
    expect(result).toBe(165.0);
  });
});
```

### 参数化测试

同一逻辑，多个输入。

```javascript
test.each([
  [1, 2, 3],
  [0, 0, 0],
  [-1, 1, 0],
])('add(%s, %s) = %s', (a, b, expected) => {
  expect(add(a, b)).toBe(expected);
});
```

---

## Test Doubles

| Double | 用途 | 何时用 |
|--------|------|--------|
| **Stub** | 返回预设数据 | 控制间接输入 |
| **Mock** | 验证交互 | 断言某物被调用 |
| **Spy** | 包装真实实现 | 观察但不替换 |
| **Fake** | 简化的工作实现 | 需要真实行为（如内存 DB） |

```javascript
// Stub — 控制间接输入
const getUser = jest.fn().mockResolvedValue({ id: 1, name: 'Alice' });

// Spy — 观察不替换
const spy = jest.spyOn(logger, 'warn');
processInvalidInput(data);
expect(spy).toHaveBeenCalledWith('Invalid input received');

// Mock — 验证调用
expect(cache.set).toHaveBeenCalledWith('key', value);

// Fake — 轻量替代
class FakeUserRepo {
  private users = new Map();
  async findById(id) { return this.users.get(id); }
  async save(user) { this.users.set(user.id, user); }
}
```

---

## TDD 循环 (HeartFlow TDD Engine)

### RED: 写一个失败的测试

先写测试，再写实现。测试必须失败。

```javascript
// RED - 先写测试
test('should return 2 for 1+1', () => {
  expect(add(1, 1)).toBe(2);
});
// 运行 → FAIL (add 未定义)
```

### GREEN: 写最少的代码让测试通过

不追求完美，只追求通过。

```javascript
// GREEN - 最少实现
function add(a, b) { return 2; }
// 运行 → PASS
```

### REFACTOR: 重构

测试通过后，优化代码结构，测试必须继续通过。

```javascript
// REFACTOR - 正确实现
function add(a, b) { return a + b; }
// 运行 → PASS (RED 之前加的边界情况也通过)
```

---

## 集成测试要点

- 测试模块之间的交互，不是实现细节
- 用真实组件（内存 DB、mock HTTP）而非 stubs
- 每个测试必须能独立运行（不依赖其他测试的状态）

```javascript
test('user repository persists and retrieves', async () => {
  const repo = new InMemoryUserRepo();
  const user = await repo.save({ name: 'Alice' });
  const found = await repo.findById(user.id);
  expect(found.name).toBe('Alice');
});
```

---

## 测试质量指标

| 指标 | 目标 | 说明 |
|------|------|------|
| **覆盖率** | >80% 关键路径 | 不是越多越好 |
| **速度** | 单元 < 100ms | 慢测试没人跑 |
| **独立性** | 无共享状态 | 每个测试可单独运行 |
| **可读性** | AAA 结构清晰 | 测试即文档 |
| **确定性** | 100% 可复现 | 间歇性失败 = 有问题 |

---

## Flaky 测试处理

1. 识别 flaky 测试：本地重复跑 `npm test --count=10`
2. 分类原因：时序依赖、共享状态、随机数据、网络依赖
3. 修复：消除依赖，mock 时间/随机，加超时守卫
4. 隔离：标记 `@slow` 或单独跑，避免污染 suite

---

## Mock vs Spy 选择

- **需要验证调用**：用 mock (`expect(mock).toHaveBeenCalled()`)
- **需要保留真实行为**：用 spy
- **需要简化依赖**：用 fake
- **需要控制返回值**：用 stub (`mockReturnValue`)

不要过度 mock。Mock 越多，测试离真实行为越远。

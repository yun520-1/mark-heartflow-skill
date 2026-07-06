# JS Module Patching Pitfalls

**事件**：2026-06-03 心经升级时，在 lesson-bank.js 中插入新方法失败：方法被插到 `lessonBank` 对象外面，`Unexpected identifier 'letGoOf'`。

## 两类 JavaScript 声明的结构差异

### 1. Class 声明

```javascript
class MyClass {
  method1() { ... }
  // 新增方法 → 插在这里（在 } 之前）
}  // ← 闭合 class
module.exports = { MyClass };
```

**错误**：在 `} ` 之后插入 → 方法在 class 外面

### 2. Object Literal 声明

```javascript
const lessonBank = {
  lessons: [],
  add() { ... },
  // 新增方法 → 插在这里（在 }; 之前）
};  // ← 闭合 object
lessonBank.load();
module.exports = { lessonBank };
```

**错误**：在 `};` 之后插入 → 方法在 object 外面，`this.` 引用失效

## 心经升级时的具体错误

lesson-bank.js 是 object literal。错误：在 `};` 之后（lessonBank.load() 之后）插入新方法 → 方法变成 module-level 函数而非对象方法。

## 诊断

```bash
node --check <file.js>
```

`Unexpected identifier` 通常意味着插入点错误。

## 预防

修改 JS 文件前，先确认是 class 还是 object literal：
- Class：结尾是 `class Name {}`
- Object literal：结尾是 `};`

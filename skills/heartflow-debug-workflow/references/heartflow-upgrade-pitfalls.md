# HeartFlow 升级工作流 Pitfall 记录

## 教训：patch 工具的双缩进 bug

**症状**：第一次使用 `patch` 工具在 `fact-checker.js` 的 `ASOLUTISM_PATTERNS` 数据块后插入 `HOLLOW_GENERALITY_PATTERNS` 和 `FALSE_DICHOTOMY_PATTERNS` 时，产生了嵌套双缩进：

```
// 期望（2-space indent）：
const HOLLOW_GENERALITY_PATTERNS = [
  { pattern: /xxx/, reason: 'yyy' },
];

// 实际产生（4-space indent，额外嵌套了`/**`注释块头）：
/**
 /**           ← 注释块嵌套
  * 空洞概括…*/
 const HOLLOW_GENERALITY_PATTERNS = [  ← 3-space indent（原本应是2-space）
   { pattern: /xxx/, reason: 'yyy' },  ← 4-space indent
 ];
```

**根因**：`patch` 的 fuzzy match 在匹配到 old_string 后，替换为 new_string 时会将匹配行周围空格模式继承下来。当 old_string 周围有 `/**` 注释块时，new_string 的缩进会被错误叠加。

**修复方式**：
1. 用 `write_file` 完全重写整个文件（而不是用 `patch` 做局部替换）
2. 然后用 `node --check` 验证，再用 `patch` 修任何残留语法错误

**最佳实践**：
- 对**只改一两行** → 用 `patch`（安全）
- 对**增删大型数据块（10+行模式数组）** → 用 `write_file` 重写整个文件（避免缩进污染）
- 对**同时改多个函数 + 新加函数** → 用 `write_file` 重写整个文件
- 用 `write_file` 后必须 `node --check <file>` 验证
- 如果写入后 lint 报错，用 `patch` 修复具体行（一行级 patch 是安全的）

## 教训：正则中转义 `/` 的手工错误

**症状**：在 `100%` 的正则pattern中：

```
// 错误
{ pattern: /\b100%\/, reason: '禁止例外' },

// 正确 
{ pattern: /\b100%\b/, reason: '禁止例外' },
```

**根因**：`/%\//` 中的 `\/` 被 JS 正则解析器认为是一个未闭合的转义序列。需要加 `\b` 单词边界而非 `\/`。

**教训**：在写 JS regex 字面量时，`/` 字符在 `//` 分隔符内部需要用 `\/` 转义，但更常见的问题是**遗漏了闭包分隔符**。解决办法：
- 写写 regex 字面量后用 `node -e "console.log(/pattern/.test('test'))"` 立即测试
- 用 `new RegExp('...')` 替代字面量可彻底避免此问题（但会失去字面量的性能优势）

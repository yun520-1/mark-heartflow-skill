# 公式库说明

本目录包含心虫的认知公式库。

## formulas-core.json（284条）

运行时加载的认知公式，覆盖 5 类：

- cognitive_science (119条)
- psychology (61条)
- computer_science (42条)
- philosophy (34条)
- neuroscience (28条)

**执行计算**：这些公式以多字母变量名（`intrinsic`、`working_memory_capacity`）描述理论结构，不直接作为数学表达式求值。运行时实际计算由 `FormulaBridge` 的约 20 个硬编码方法完成（香农熵、艾宾浩斯遗忘、贝叶斯更新、ACT-R激活等），这些方法在所有认知模块中真实使用。

**搜索使用**：通过 `hf.formula.search('关键词')` 或 `bridge.searchFromCorpus('关键词')` 检索公式原文。

## formulas-archive.json（98条）

归档公式，运行时不下发。分类：

- mathematics (84条)
- physics (12条)
- engineering (2条)

它们在源码清理时被移出核心路径，保留备查。

## formulas.json（原文件）

未拆分前的完整382条公式文件，保留向后兼容。

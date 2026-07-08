---
name: formula-engine-development
description: "Formula engine development for HeartFlow — covers formula search, numerical solving, symbolic computation, and formula library management. Records lessons from building the formula engine in HeartFlow."
version: 1.0.0
author: Hermes Agent
license: MIT
platforms: [linux, macos]
metadata:
  hermes:
    tags: [heartflow, formula, mathjs, numerical-solving, symbolic-computation]
---

# Formula Engine Development

This skill covers developing and maintaining the formula engine in HeartFlow, including formula search, numerical solving (for equations with `=`), symbolic computation, and formula library management.

## Formula Engine Architecture

The formula engine has three main components:

1. **`formula-search.js`** — Searches formulas by keyword, category, or ID
2. **`formula-calculator.js`** — Calculates formulas (numerical solving for equations with `=`, symbolic computation)
3. **`formulas/formulas.json`** — Master formula library (1,787+ formulas across 12 categories)

## Key Lessons

### 1. Numerical Solving for Equations with `=`

**Problem**: Formulas like `P*V = n*R*T` (ideal gas law) contain `=` and cannot be directly evaluated.

**Solution**: Implement `_solveEquality()` method that:
1. Splits formula into `left` and `right` sides of `=`
2. Identifies unknown variables (not in `params` and not math constants)
3. Uses numerical search to find the unknown value

**Implementation** (`formula-calculator.js`):
```javascript
_solveForVariable(left, right, unknown, params) {
  const expression = `(${left}) - (${right})`;
  const substituted = this._substituteParams(expression, params);
  
  // Numerical search: find value that makes expression ≈ 0
  let minError = Infinity;
  let bestGuess = 0;
  
  // Coarse search: [-1000, 1000], step = 1
  for (let guess = -1000; guess <= 1000; guess += 1) {
    const scope = { ...params, [unknown]: guess };
    const value = this._math.evaluate(substituted, scope);
    const error = Math.abs(value);
    if (error < minError) {
      minError = error;
      bestGuess = guess;
    }
  }
  
  // Fine search: [bestGuess-1, bestGuess+1], step = 0.001
  // ...
  
  return bestGuess;
}
```

**Pitfall**: `math.solve()` is NOT a function in mathjs. Use numerical search instead.

### 2. Formula Library Management

**Problem**: Adding formulas manually is error-prone and slow.

**Solution**: Use layered approach:
1. **Wikipedia "List of X equations" pages** — copy-paste formula names + expressions
2. **SymPy export** — generate formulas programmatically (special functions, integrals, series)
3. **Open data repositories** — download from ModelScope, arXiv, etc.

**Workflow**:
```bash
# 1. Scrape Wikipedia
browser_navigate("https://en.wikipedia.org/wiki/List_of_physics_equations")
# Copy formulas to formulas_wikipedia.json

# 2. Export from SymPy
python3 -c "
import sympy as sp
# Generate formulas
formulas = []
formulas.append({'id': 'gamma_function', 'formula': str(sp.gamma(x)), ...})
"

# 3. Merge into main library
node -e "
const main = require('./formulas/formulas.json');
const newFormulas = require('./formulas_wikipedia.json');
// Merge with ID deduplication
"
```

**Critical rule**: All formulas MUST be validated with `math.parse()` before adding to library.

### 3. Formula Representation Rules (mathjs compatible)

**Problem**: Formulas with `e^{x}` or `R(t) = ...` cause parsing errors.

**Rules**:
1. NO superscript like `e^{x}` → use `exp(x)`
2. NO function notation like `R(t) = ...` → use `R = ...` (assignment form)
3. ALL formulas must contain `=` (calculable)

**Examples**:
- ✅ `R = exp(-t/S)` (Ebbinghaus forgetting curve)
- ❌ `R(t) = e^{-t/S}` (parsing error)

### 4. Symbolic Computation

**Problem**: `math.simplify()` returns unchanged expression (e.g. `x^2 + 2*x + 1` stays the same).

**Solution**: `math.simplify()` is limited. For real simplification, use `math.derivative()` or numerical evaluation.

**Implementation**:
```javascript
simplify(expression) {
  try {
    const result = this._math.simplify(expression);
    return {
      original: expression,
      simplified: result.toString(),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return { error: `简化失败: ${error.message}` };
  }
}
```

## Common Pitfalls

### 1. `math.solve()` is not a function

**Error**: `TypeError: math.solve is not a function`

**Cause**: `mathjs` does NOT have `math.solve()`. Use numerical search instead.

**Fix**: Implement `_solveForVariable()` with numerical search (see Lesson 1).

### 2. Formula parsing fails with `Invalid left hand side of assignment operator =`

**Error**: `计算失败: Invalid left hand side of assignment operator = (char 7)`

**Cause**: Trying to `evaluate()` a formula with `=` directly.

**Fix**: Use `_solveEquality()` for formulas with `=`, `evaluate()` for pure expressions.

### 3. Linear system solver is hard to implement

**Problem**: Extracting coefficients from linear expressions like `2*x + 3*y = 5` requires complex parsing.

**Solution**: Use `math.lusolve()` (LU decomposition) if coefficients can be extracted. Otherwise, disable linear system solver (too complex for simple implementation).

**Status**: Linear system solver is DISABLED in v3.3.1 (implementation too complex).

### 4. Search returns `undefined`

**Problem**: `FormulaSearch.search()` returns `undefined` (method is async or implementation wrong).

**Fix**: Check if method is async. If yes, use `await`. If no, check implementation.

**Status**: `FormulaSearch.search()` fixed in v3.2.0 (returns `{ total, results }` object).

### 5. Memory retrieval returns 0 results

**Problem**: `MemoryOptimizer.retrieveMemory()` returns 0 results (similarity algorithm too simple).

**Fix**: Improve similarity algorithm (use embedding-based similarity instead of keyword matching).

**Status**: Known issue, not fixed yet (needs embedding integration).

### 6. Decision system methods return `undefined`

**Problem**: `DecisionOptimizer.quantumDecision()` returns `undefined` (implementation wrong).

**Fix**: Check method implementation. Ensure it returns `{ model, options, ... }` object.

**Status**: Known issue, not fixed yet (needs implementation review).

## Formula Library Statistics

**Current status** (2026-07-08):
- **Total**: 1,787 formulas
- **Categories**: math (732), physics (473), engineering (269), cognitive science (101), psychology (40), chemistry (39), computer science (37), philosophy (32), economics (14), biology (13), earth science (11), neuroscience (6)
- **Quality**: 97.7% contain `=` (calculable)

**Growth strategy**: Prioritize quality over quantity. User prefers "批量下载" (bulk download) over manual generation.

## References

- `references/formula-library-stats.json` — Detailed statistics by category
- `references/mathjs-api.md` — mathjs API notes (functions that work, functions that don't)
- HeartFlow formula engine source: `/root/.hermes/skills/heartflow/src/formula/`

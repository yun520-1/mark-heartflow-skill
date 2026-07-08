# Formula Notation Rules (mathjs compatible)

## Critical Rules

### 1. NO superscript like `e^{x}`
- ❌ `R(t) = e^{-t/S}` (parsing error)
- ✅ `R = exp(-t/S)` (Ebbinghaus forgetting curve)

### 2. NO function notation like `R(t) = ...`
- ❌ `R(t) = exp(-t/S)` (assignment error)
- ✅ `R = exp(-t/S)` (assignment form)

### 3. ALL formulas must contain `=`
- ✅ `P*V = n*R*T` (calculable)
- ❌ `P*V` (not calculable, missing `=`)

### 4. Use mathjs-compatible functions
- ✅ `sin(x)`, `cos(x)`, `exp(x)`, `log(x)`, `sqrt(x)`
- ❌ `sin x`, `cos x`, `e^x` (use `exp(x)`)

### 5. Variable names
- Use single letter or descriptive names: `T`, `P`, `V`, `n`, `R`
- Avoid reserved words: `pi`, `e`, `i`, `infinity`, `NaN`

## Validation

Before adding a formula to the library, ALWAYS validate with `math.parse()`:

```javascript
const math = require('mathjs');
try {
  math.parse(formula.expression);
  // Valid
} catch (error) {
  // Invalid — fix notation
}
```

## Examples

| Formula | Correct Notation | Wrong Notation |
|---------|-------------------|----------------|
| Ideal gas law | `P*V = n*R*T` | `PV = nRT` (missing `*`) |
| Ohm's law | `V = I*R` | `V = IR` (missing `*`) |
| Ebbinghaus | `R = exp(-t/S)` | `R(t) = e^{-t/S}` |
| Forgetting probability | `P = 1 - exp(-lambda*t)` | `P(t) = 1 - e^{-λt}` |

## Common Errors

### Error: `Invalid left hand side of assignment operator =`
- Cause: Trying to `evaluate()` a formula with `=` directly
- Fix: Use `_solveEquality()` for formulas with `=`, `evaluate()` for pure expressions

### Error: `TypeError: math.solve is not a function`
- Cause: `mathjs` does NOT have `math.solve()`
- Fix: Use numerical search instead (see `formula-calculator.js`)

### Error: `Parsing error: Unexpected token`
- Cause: Wrong notation (e.g. `e^{x}` instead of `exp(x)`)
- Fix: Apply notation rules above

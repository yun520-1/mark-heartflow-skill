# Formula Library Statistics

## Current Status (2026-07-08)

- **Total**: 1,787 formulas
- **Quality**: 97.7% contain `=` (calculable)
- **Categories**: 12

### By Category

| Category | Count | Percentage |
|----------|-------|------------|
| Math | 732 | 41.0% |
| Physics | 473 | 26.5% |
| Engineering | 269 | 15.1% |
| Cognitive Science | 101 | 5.7% |
| Psychology | 40 | 2.2% |
| Chemistry | 39 | 2.2% |
| Computer Science | 37 | 2.1% |
| Philosophy | 32 | 1.8% |
| Economics | 14 | 0.8% |
| Biology | 13 | 0.7% |
| Earth Science | 11 | 0.6% |
| Neuroscience | 6 | 0.3% |

## Growth History

- **Start**: ~1,604 formulas
- **Current**: 1,787 formulas
- **Added**: +183 formulas (Wikipedia + SymPy export)

### Recent Additions

1. **Wikipedia "List of equations" pages** — copied formula names + expressions
2. **SymPy export** — generated formulas programmatically (special functions, integrals, series)
3. **Open data repositories** — downloaded from ModelScope, arXiv, etc.

## Quality Metrics

- **Calculable** (contain `=`): 97.7%
- **Validated with `math.parse()`**: 100%
- **Duplicates removed**: Yes (by ID deduplication)

## Usage

### Search Formulas

```javascript
const { FormulaSearch } = require('./src/formula/formula-search.js');
const search = new FormulaSearch();
const results = search.search('ideal gas', { limit: 5 });
```

### Calculate Formulas

```javascript
const { FormulaCalculator } = require('./src/formula/formula-calculator.js');
const calc = new FormulaCalculator();
const result = calc.calculate('ideal_gas_law', { P: 101325, V: 0.0224, n: 1, R: 8.314 });
```

### Simplify Expressions

```javascript
const result = calc.simplify('x^2 + 2*x + 1');
```

## File Locations

- **Master library**: `/root/.hermes/skills/heartflow/formulas/formulas.json`
- **Formula search**: `/root/.hermes/skills/heartflow/src/formula/formula-search.js`
- **Formula calculator**: `/root/.hermes/skills/heartflow/src/formula/formula-calculator.js`

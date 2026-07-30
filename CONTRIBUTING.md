# Contributing to HeartFlow

HeartFlow is AGI's first layer: **the layer that says "no"**. Every contribution that makes it better at saying "no" (or more honest about when it should say "I don't know") is valuable.

## Quick Start

```bash
npm install
node test/run-all.js   # All tests should pass
```

## How to Contribute

### 1. Try it on real text

```js
const hf = require('@yun520-1/heartflow');
console.log(hf.checkInput('你不同意就是自私'));
```

Then open an issue with what you found — false positives, missed patterns, surprising outputs.

### 2. Expand pattern libraries

The 45 discrimination dimensions live in:
- `src/index.js` — the core `discriminate()` function with all dimension detectors
- `src/shield/deliberation-gate.js` — the gating logic that decides pass/rewrite/block

Each dimension has a pattern library (regex-based). To add patterns: find your dimension in `src/index.js` (search for the dimension name), add your pattern to the array.

### 3. Write tests

Tests are in `test/` and run via `node test/run-all.js`. Each test file exports a function `({test})` that registers tests. We need more edge case coverage: empty strings, Unicode, adversarial encoding, mixed languages.

### 4. Documentation

- `AGENTS.md` — Quick Start for AI agent users
- `README.md` — Full documentation
- Chinese translations would help reach developers who don't work in English

## Philosophy

1. **Zero-dependency rule engine** — No LLM calls, no GPU, no database. HeartFlow must remain installable with a single `npm install` and run anywhere Node.js runs.

2. **Auditable decisions** — Every check returns a full `checked_by` audit trail so users know exactly why something was blocked or rewritten.

3. **Block > fail open** — For security dimensions (prompt injection, hate speech, dehumanization), default to blocking on uncertainty. A scanner that fails open is worse than no scanner.

4. **Honest uncertainty** — When HeartFlow doesn't know, it should say so. The `doubt-engine` layer exists to catch overconfidence.

## Pull Request Process

1. Tests pass (`node test/run-all.js`)
2. If adding a new dimension: add it to `gate.action` in `deliberation-gate.js`
3. Update `AGENTS.md` if changing the public API
4. Bump the patch version in `package.json` (maintainer can handle this)

## Code of Conduct

Be direct. Be honest. Don't pretend something works when it doesn't. That's the HeartFlow way.

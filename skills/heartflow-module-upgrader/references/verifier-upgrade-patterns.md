# 验证器/扫描器类升级模式

## 适用场景

模块是一个代码/内容验证器，仅支持少数语言的基础语法检查（括号平衡、基础模式检测），缺少多语言支持、安全扫描、复杂度分析、质量评分等高级验证能力。

典型特征：
- 仅支持 JS/Python/Shell 中的1-3种语言
- 验证逻辑仅有括号平衡、引号检查等基础语法检查
- 无安全漏洞检测
- 无异步代码错误检测
- 无代码复杂度分析
- 无综合质量评分
- 无导入路径验证

## 示例：code-verifier.js (5,161B → 29,777B)

**原模块**：仅支持 JS/Python/Shell 的基础括号平衡 + 引号检查。

**升级后**：支持 JS/TS/TSX/Python/Shell/JSON 的全功能验证引擎，含安全扫描、异步检测、复杂度分析、导入验证、质量评分。

## 可添加的子系统

### 1. TypeScript/TSX 验证

```javascript
verifyTSContent(content) {
    const errors = [];
    const warnings = [];

    // 基础括号平衡（复用JS逻辑）
    const open = (content.match(/\{/g) || []).length;
    const close = (content.match(/\}/g) || []).length;
    if (open !== close) errors.push(`括号不匹配: 开${open} vs 闭${close}`);

    // 泛型尖括号粗略检查
    const aOpen = (content.match(/</g) || []).length;
    const aClose = (content.match(/>/g) || []).length;
    if (Math.abs(aOpen - aClose) > 5) {
        warnings.push(`泛型尖括号可能不平衡: 差${Math.abs(aOpen - aClose)}`);
    }

    // 接口定义中的类型注解完整性
    const interfaceDecls = content.match(/interface\s+\w+\s*\{/g) || [];
    if (interfaceDecls.length > 0 && !content.includes(':')) {
        warnings.push('存在 interface 定义但未检测到类型注解(:)');
    }

    // 函数返回值类型注解缺失检测
    const functionDecls = content.match(/(?:function|=>)\s*[^:{]*\{/g) || [];
    const typedReturns = content.match(/\)\s*:\s*\w+/g) || [];
    if (functionDecls.length > typedReturns.length + 3) {
        warnings.push(`${functionDecls.length - typedReturns.length} 个函数缺少返回值类型注解`);
    }

    // any 类型滥用检测
    const anyCount = (content.match(/: any/g) || []).length;
    if (anyCount > 5) {
        warnings.push(`过度使用 any 类型(${anyCount}次)`);
    }

    // 严格空检查关联
    if (content.includes('null') && !content.includes('| null') && !content.includes('?.')) {
        warnings.push('使用了 null 值但未在类型中声明 | null');
    }

    // 可选链使用建议
    const optionalChains = (content.match(/\?\./g) || []).length;
    if (optionalChains === 0 && content.includes('&&')) {
        warnings.push('深层属性访问建议使用可选链(?.)');
    }

    return { ok: errors.length === 0, errors, warnings };
}
```

### 2. JSON 结构验证

```javascript
verifyJSONContent(content, schema = null) {
    const errors = [];
    const warnings = [];

    // 1. 语法检查
    let parsed;
    try {
        parsed = JSON.parse(content);
    } catch (e) {
        errors.push(`JSON 语法错误: ${e.message}`);
        return { ok: false, errors, warnings, syntaxValid: false };
    }

    // 2. 非对象/数组警告
    if (typeof parsed !== 'object' || parsed === null) {
        warnings.push('JSON 顶层不是对象或数组');
    }

    // 3. 必需字段检查
    if (schema && schema.required) {
        for (const field of schema.required) {
            if (!(field in parsed)) {
                errors.push(`缺少必需字段: "${field}"`);
            }
        }
    }

    // 4. 值类型检查
    if (schema && schema.types) {
        for (const [field, expectedType] of Object.entries(schema.types)) {
            if (field in parsed) {
                const actualType = Array.isArray(parsed[field]) ? 'array' : typeof parsed[field];
                if (actualType !== expectedType) {
                    warnings.push(`字段 "${field}" 期望类型 ${expectedType}，实际为 ${actualType}`);
                }
            }
        }
    }

    // 5. 尾随逗号 + 注释检查
    if (/,(\s*[\]}])/g.test(content)) warnings.push('JSON 中不允许尾随逗号');
    if (/\/\/|\/\*/g.test(content)) warnings.push('JSON 中不允许注释');

    return { ok: errors.length === 0, errors, warnings, syntaxValid: true, 
             parsedType: Array.isArray(parsed) ? 'array' : typeof parsed, 
             keyCount: Object.keys(parsed).length };
}
```

### 3. 安全漏洞扫描

```javascript
scanSecurity(content, lang = 'js') {
    const findings = [];
    const patterns = [
        // XSS
        { regex: /innerHTML\s*=/, severity: 'high', msg: '直接设置 innerHTML 可能导致 XSS', lang: 'js' },
        { regex: /dangerouslySetInnerHTML/, severity: 'high', msg: '需确保 HTML 已消毒', lang: 'js' },
        { regex: /document\.write\s*\(/, severity: 'medium', msg: '可能导致 XSS', lang: 'js' },
        // 代码执行
        { regex: /eval\s*\(/, severity: 'critical', msg: 'eval() 存在严重安全风险', lang: '' },
        { regex: /exec\s*\(/, severity: 'high', msg: '可能导致命令注入', lang: 'js' },
        // 原型污染
        { regex: /Object\.assign\s*\([^,]+,\s*(?:req|body|query|params)/, severity: 'high', msg: '可能导致原型污染', lang: 'js' },
        { regex: /__proto__/, severity: 'critical', msg: '可能导致原型污染攻击', lang: 'js' },
        // 反序列化 (Python)
        { regex: /pickle\.loads?\s*\(/, severity: 'high', msg: '可能导致远程代码执行', lang: 'py' },
        // SQL注入
        { regex: /execute\s*\(.*?['\"].*?%/, severity: 'high', msg: '可能导致 SQL 注入', lang: 'py' },
        // 硬编码密钥
        { regex: /password\s*=\s*['"][^'"]+['"]/, severity: 'medium', msg: '密码硬编码', lang: '' },
        { regex: /secret\s*=\s*['"][^'"]+['"]/, severity: 'medium', msg: '密钥硬编码', lang: '' },
        { regex: /api[_-]?key\s*=\s*['"][^'"]+['"]/i, severity: 'medium', msg: 'API 密钥硬编码', lang: '' },
    ];

    const lines = content.split('\n');
    for (const { regex, severity, msg, lang: pl } of patterns) {
        if (pl && pl !== lang) continue;
        const match = content.match(regex);
        if (match) {
            let lineNum = -1;
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].match(regex)) { lineNum = i + 1; break; }
            }
            findings.push({ type: 'security', severity, message: msg, line: lineNum > 0 ? lineNum : undefined });
        }
    }

    return { safe: findings.filter(f => f.severity === 'critical' || f.severity === 'high').length === 0, findings };
}
```

**关键设计**：
- `lang: ''` 表示跨语言匹配（JS+Python都检查eval）
- `safe` 仅考虑 critical + high 级别，medium/low 为建议不阻止执行
- 行号定位通过逐行匹配提高精度

### 4. 异步错误检测

```javascript
detectAsyncIssues(content) {
    const issues = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // 1. Promise.then() 未 return 或 await
        if (line.includes('.then(') && !line.trim().startsWith('return ') && !line.trim().startsWith('await ')) {
            issues.push({ type: 'unhandled_promise', message: `第${i+1}行: Promise.then() 未处理`, line: i + 1 });
        }

        // 2. new Promise() 未赋值
        if (line.includes('new Promise(') && !line.trim().startsWith('return ') && !line.trim().startsWith('await ')) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('const ') && !trimmed.startsWith('let ') && !trimmed.startsWith('var ')) {
                issues.push({ type: 'unhandled_promise', message: `第${i+1}行: Promise 未赋值/返回`, line: i + 1 });
            }
        }

        // 3. async 回调缺少 catch
        if (line.includes('async (') || line.includes('async(')) {
            let hasCatch = false;
            for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
                if (lines[j].includes('.catch(')) { hasCatch = true; break; }
                if (lines[j].includes('.then(')) break;
            }
            if (!hasCatch) issues.push({ type: 'missing_catch', message: `第${i+1}行附近: 缺少 .catch()`, line: i + 1 });
        }

        // 4. 空 catch 块
        if (line.includes('.catch(') && (line.includes('() => {}') || line.includes('(e) => {}') || line.includes('(err) => {}'))) {
            issues.push({ type: 'empty_catch', message: `第${i+1}行: 空的 catch 块`, line: i + 1 });
        }
    }

    return { safe: issues.filter(i => i.type === 'unhandled_promise').length === 0, issues };
}
```

### 5. 代码复杂度分析

```javascript
analyzeComplexity(content) {
    const lines = content.split('\n');
    const codeLines = lines.filter(l => l.trim().length > 0 && !l.trim().startsWith('//') && !l.trim().startsWith('*') && !l.trim().startsWith('#'));

    // 圈复杂度：基础1 + 每个决策点
    const cyclomaticFactors = [/\bif\s*\(/g, /\belse\s+if\b/g, /\bfor\s*\(/g, /\bwhile\s*\(/g,
                               /\bcase\s+/g, /\bcatch\s*\(/g, /\?\s*[^:]+:/g, /\|\|/g, /&&/g];
    let cyclomatic = 1;
    for (const pattern of cyclomaticFactors) {
        const matches = content.match(pattern);
        if (matches) cyclomatic += matches.length;
    }

    // 最大嵌套深度（基于缩进）
    let maxNestingDepth = 0, currentIndent = 0;
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === '' || trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
        const bracketOpen = (trimmed.match(/\{/g) || []).length;
        const bracketClose = (trimmed.match(/\}/g) || []).length;
        currentIndent += (bracketOpen - bracketClose) * 2;
        maxNestingDepth = Math.max(maxNestingDepth, Math.ceil(currentIndent / 2));
    }

    const lineLengths = lines.map(l => l.length);
    const maxLineLength = Math.max(...lineLengths);
    const longLines = lines.filter(l => l.length > 120).length;

    return {
        totalLines: lines.length,
        codeLines: codeLines.length,
        cyclomaticComplexity: cyclomatic,
        maxNestingDepth,
        maxLineLength,
        longLinesCount: longLines,
        complexityLevel: cyclomatic <= 10 ? 'low' : (cyclomatic <= 20 ? 'moderate' : (cyclomatic <= 40 ? 'high' : 'very_high')),
    };
}
```

### 6. 导入解析验证

```javascript
verifyImports(content, baseDir = process.cwd()) {
    const issues = [];
    const requirePattern = /require\s*\(\s*['"](\.\.?\/[^'"]+)['"]\s*\)/g;
    const importPattern = /from\s+['"](\.\.?\/[^'"]+)['"]/g;
    const allPatterns = [...content.matchAll(requirePattern), ...content.matchAll(importPattern)];

    for (const match of allPatterns) {
        const importPath = match[1];
        const resolvedPath = path.resolve(baseDir, importPath);
        const extensions = ['', '.js', '.ts', '.jsx', '.tsx', '.json', '.mjs', '.cjs'];
        let resolved = false;

        for (const ext of extensions) {
            const testPath = ext ? resolvedPath + ext : resolvedPath;
            if (fs.existsSync(testPath)) {
                if (fs.statSync(testPath).isDirectory()) {
                    for (const idx of ['/index.js', '/index.ts', '/index.json']) {
                        if (fs.existsSync(testPath + idx)) { resolved = true; break; }
                    }
                } else { resolved = true; }
                if (resolved) break;
            }
            // 尝试目录/index
            if (!ext && fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
                for (const idx of ['/index.js', '/index.ts', '/index.json', '/index.mjs', '/index.cjs']) {
                    if (fs.existsSync(resolvedPath + idx)) { resolved = true; break; }
                }
                if (resolved) break;
            }
        }

        issues.push({ importPath, resolved, message: resolved ? `已解析` : `未找到 (在 ${resolvedPath})` });
    }

    return { allResolved: issues.every(i => i.resolved), issues };
}
```

### 7. 综合质量评分

```javascript
qualityScore(content, lang = 'js') {
    const complexity = this.analyzeComplexity(content);
    const asyncIssues = (lang === 'js' || lang === 'ts') ? this.detectAsyncIssues(content) : { safe: true, issues: [] };
    const security = this.scanSecurity(content, lang);

    const dimensions = {};

    // 语法健康度 (30%)
    dimensions.syntax = 100;
    if ((content.match(/\{/g) || []).length !== (content.match(/\}/g) || []).length) dimensions.syntax -= 30;
    if ((content.match(/\(/g) || []).length !== (content.match(/\)/g) || []).length) dimensions.syntax -= 30;
    dimensions.syntax = Math.max(0, dimensions.syntax);

    // 安全评分 (25%)
    dimensions.security = 100;
    for (const f of security.findings) {
        if (f.severity === 'critical') dimensions.security -= 40;
        else if (f.severity === 'high') dimensions.security -= 20;
        else if (f.severity === 'medium') dimensions.security -= 10;
    }
    dimensions.security = Math.max(0, dimensions.security);

    // 复杂度评分 (20%)
    dimensions.complexity = 100;
    if (complexity.cyclomaticComplexity > 10) dimensions.complexity -= Math.min(50, (complexity.cyclomaticComplexity - 10) * 3);
    if (complexity.maxNestingDepth > 5) dimensions.complexity -= Math.min(30, (complexity.maxNestingDepth - 5) * 6);
    dimensions.complexity = Math.max(0, dimensions.complexity);

    // 异步健康度 (15%)
    dimensions.async = 100;
    for (const issue of asyncIssues.issues) {
        if (issue.type === 'unhandled_promise') dimensions.async -= 25;
        else if (issue.type === 'empty_catch') dimensions.async -= 15;
        else if (issue.type === 'missing_catch') dimensions.async -= 10;
    }
    dimensions.async = Math.max(0, dimensions.async);

    // 代码规范 (10%)
    dimensions.style = 100;
    if (complexity.longLinesCount > 5) dimensions.style -= Math.min(30, complexity.longLinesCount * 3);
    if (complexity.totalLines > 50 && complexity.totalLines - complexity.codeLines < 5) dimensions.style -= 15;
    dimensions.style = Math.max(0, dimensions.style);

    const weights = { syntax: 0.30, security: 0.25, complexity: 0.20, async: 0.15, style: 0.10 };
    let totalScore = 0;
    for (const [dim, weight] of Object.entries(weights)) {
        totalScore += dimensions[dim] * weight;
    }

    const score = Math.round(totalScore);
    return {
        score, dimensions,
        level: score >= 90 ? 'excellent' : (score >= 75 ? 'good' : (score >= 55 ? 'fair' : 'poor')),
        securityFindings: security.findings.length,
        asyncIssuesCount: asyncIssues.issues.length,
    };
}
```

## 关键实现细节

### 保持向后兼容
- 原有方法签名必须不变（verifyJS, verifyPy, verifySh, autoVerify, verifyCodeBlocks）
- 原有返回值格式保持 `{ ok, errors }`（新增 `warnings` 字段为可选扩展）
- 新方法必须独立，不修改已有方法逻辑

### 安全扫描分级策略
- `critical`：立即阻止（eval, __proto__）
- `high`：强烈警告（innerHTML, exec, 原型污染）
- `medium`：建议修复（document.write, 硬编码密钥）
- `low`：提示（绝对路径硬编码）
- `info`：信息（文件读取检查）

### JSON schema 设计
schema 参数是可选的，不传则只做语法检查。格式：
```javascript
{
    required: ['name', 'version'],          // 必需字段列表
    types: { name: 'string', count: 'number' }  // 字段期望类型
}
```

### 异步检测边界情况
- 多行 Promise 链（`.then()` 在后续行）不做检查（避免误报）
- async IIFE 不做特殊处理（和普通 async 函数一致）
- 仅检查前 10 行范围内的 catch

## 验证清单
- [ ] `node --check` 语法通过
- [ ] 原有方法签名不变（verifyJS/verifyPy/verifySh/autoVerify/verifyCodeBlocks）
- [ ] 原有返回值 `{ ok, errors }` 格式不变
- [ ] 新方法被 `module.exports` 暴露
- [ ] 安全扫描在 clean code 上返回 `safe: true`
- [ ] JSON 验证在损坏 JSON 上返回 `syntaxValid: false`
- [ ] 所有方法在空输入上不崩溃
- [ ] VERSION 文件更新
- [ ] SKILL.md 版本同步

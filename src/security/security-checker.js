/**
 * SecurityChecker - 安全检查器 v2.0
 * 检查输入安全性，防止恶意指令、XSS、SQL注入、路径遍历
 * 
 * From mark-StillWater security.js: SecurityChecker — XSS/SQL注入/路径遍历检测
 */

class SecurityChecker {
    constructor() {
        // 危险shell命令模式
        this.dangerousShellPatterns = [
            /\brm\s+-(?:[a-z]*r[a-z]*f|[a-z]*f[a-z]*r)\s+(?:\/|\$HOME|~|\.\.|\*)/i,
            /\b(?:curl|wget)\b.+\|\s*(?:sh|bash|zsh|python|python3|node|perl|ruby)\b/i,
            /\b(?:sh|bash|zsh)\s+-c\s+/i,
            /\b(?:python|python3|node|perl|ruby)\s+-e\s+/i,
            /\bchild_process\b/i,
            /\bexecSync\s*\(/i,
            /\bspawnSync\s*\(/i,
            /\bchmod\s+-R\s+777\b/i,
            /\bsudo\s+rm\b/i,
            /\bdd\s+if=.+\bof=\/dev\//i,
            /eval\s*\(/,
            /exec\s*\(/,
            /__import__\s*\(/,
            /subprocess.*shell\s*=\s*True/,
            /nc\s+-e\s+/,
            /bash\s+-i/,
            /:\s*!{2}/,
        ];

        // XSS注入模式
        this.xssPatterns = [
            /<script[^>]*>.*?<\/script>/gi,
            /javascript\s*:/gi,
            /onerror\s*=/gi,
            /onload\s*=/gi,
            /onclick\s*=/gi,
            /onmouseover\s*=/gi,
            /<iframe[^>]*>/gi,
            /<img[^>]+onerror/gi,
            /vbscript\s*:/gi,
            /data\s*:\s*text\/html/gi,
        ];

        // SQL注入模式
        this.sqlInjectionPatterns = [
            /(\bunion\b.*\bselect\b)/gi,
            /(\bdrop\b.*\btable\b)/gi,
            /(\bdrop\b.*\bdatabase\b)/gi,
            /(\binsert\b.*\binto\b)/gi,
            /(\bupdate\b.*\bset\b)/gi,
            /(\bdelete\b.*\bfrom\b)/gi,
            /(--\s*$)/gm,
            /('\s*or\s*'1'\s*=\s*'1)/gi,
            /('\s*or\s*1\s*=\s*1)/gi,
            /(\bor\b\s+\d+\s*=\s*\d+)/gi,
            /(\band\b\s+\d+\s*=\s*\d+)/gi,
            /(\bexec\b\s*\()/gi,
            /(\bxp_cmdshell\b)/gi,
        ];

        // 路径遍历模式
        this.pathTraversalPatterns = [
            /(\.\.\/){1,}/g,
            /(\.\.\\){1,}/g,
            /(%2e%2e){1,}/gi,
            /(%252e){1,}/gi,
            /(\.\.%2f){1,}/gi,
            /(\.\.%5c){1,}/gi,
            /\/(etc\/passwd|boot\.ini|windows\/win\.ini)/gi,
            /\/(windows|system32|system64)\//gi,
        ];

        this.checked = 0;
        this.xssDetected = 0;
        this.sqlInjectionDetected = 0;
        this.pathTraversalDetected = 0;
        this.shellDetected = 0;
    }

    boot() {
        return this;
    }

    /**
     * 检查输入是否安全
     * @param {string} input 
     * @returns {object} - { safe: boolean, reason?: string, details?: object }
     */
    check(input) {
        this.checked++;
        const normalized = this._normalize(input);

        // 检查危险shell命令
        for (const pattern of this.dangerousShellPatterns) {
            if (pattern.test(normalized)) {
                this.shellDetected++;
                return { 
                    safe: false, 
                    reason: 'dangerous_shell_command', 
                    pattern: pattern.source,
                    category: 'shell'
                };
            }
        }

        // 检查XSS注入
        for (const pattern of this.xssPatterns) {
            if (pattern.test(normalized)) {
                this.xssDetected++;
                return { 
                    safe: false, 
                    reason: 'xss_injection', 
                    pattern: pattern.source,
                    category: 'xss'
                };
            }
        }

        // 检查SQL注入
        for (const pattern of this.sqlInjectionPatterns) {
            if (pattern.test(normalized)) {
                this.sqlInjectionDetected++;
                return { 
                    safe: false, 
                    reason: 'sql_injection', 
                    pattern: pattern.source,
                    category: 'sql'
                };
            }
        }

        // 检查路径遍历
        for (const pattern of this.pathTraversalPatterns) {
            if (pattern.test(normalized)) {
                this.pathTraversalDetected++;
                return { 
                    safe: false, 
                    reason: 'path_traversal', 
                    pattern: pattern.source,
                    category: 'path'
                };
            }
        }

        return { safe: true };
    }

    scan(input) {
        return this.checkAll(input);
    }

    redact(input) {
        if (input === null || input === undefined) return input;
        let text = String(input);
        const replacements = [
            [/(?:api[_-]?key|apikey|token|secret|password|passwd|pwd)\s*[:=]\s*["']?[^"'\s,}]+/gi, (m) => m.replace(/[:=].*$/, '=[REDACTED]')],
            [/\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi, 'Bearer [REDACTED]'],
            [/\bsk-[A-Za-z0-9_-]{16,}\b/g, '[OPENAI_KEY_REDACTED]'],
            [/\b(AKIA|ASIA)[0-9A-Z]{16}\b/g, '[AWS_KEY_REDACTED]'],
        ];
        for (const [pattern, replacement] of replacements) {
            text = text.replace(pattern, replacement);
        }
        return text;
    }

    _normalize(input) {
        let text = String(input || '');
        for (let i = 0; i < 2; i++) {
            try {
                const decoded = decodeURIComponent(text);
                if (decoded === text) break;
                text = decoded;
            } catch (_) {
                break;
            }
        }
        return text.replace(/\s+/g, ' ').trim();
    }

    /**
     * 分类检查 - 返回所有检测结果而不止第一个
     * @param {string} input
     * @returns {object} - 检测结果详情
     */
    checkAll(input) {
        const results = {
            safe: true,
            threats: []
        };

        // 检查所有类别
        const checks = [
            { patterns: this.dangerousShellPatterns, category: 'shell', name: '危险Shell命令' },
            { patterns: this.xssPatterns, category: 'xss', name: 'XSS注入' },
            { patterns: this.sqlInjectionPatterns, category: 'sql', name: 'SQL注入' },
            { patterns: this.pathTraversalPatterns, category: 'path', name: '路径遍历' },
        ];

        for (const check of checks) {
            for (const pattern of check.patterns) {
                if (pattern.test(this._normalize(input))) {
                    results.safe = false;
                    results.threats.push({
                        category: check.category,
                        name: check.name,
                        pattern: pattern.source
                    });
                }
            }
        }

        return results;
    }

    getStats() {
        return {
            checked: this.checked,
            shellDetected: this.shellDetected,
            xssDetected: this.xssDetected,
            sqlInjectionDetected: this.sqlInjectionDetected,
            pathTraversalDetected: this.pathTraversalDetected,
            version: 'v2.0.0'
        };
    }

    shutdown() {}
}

module.exports = { SecurityChecker };

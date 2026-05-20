/**
 * SecurityChecker - 安全检查器
 * 检查输入安全性，防止恶意指令
 */

class SecurityChecker {
    constructor() {
        this.dangerousPatterns = [
            /rm\s+-rf\s+\//,
            /curl\s+.+\|\s*sh/,
            /eval\s*\(/,
            /exec\s*\(/,
            /__import__\s*\(/,
            /subprocess.*shell\s*=\s*True/,
        ];
        this.checked = 0;
    }

    boot() {
        return this;
    }

    /**
     * 检查输入是否安全
     * @param {string} input 
     * @returns {object} - { safe: boolean, reason?: string }
     */
    check(input) {
        this.checked++;
        for (const pattern of this.dangerousPatterns) {
            if (pattern.test(input)) {
                return { safe: false, reason: 'dangerous_pattern', pattern: pattern.source };
            }
        }
        return { safe: true };
    }

    getStats() {
        return {
            checked: this.checked,
            version: 'v1.0.0'
        };
    }

    shutdown() {}
}

module.exports = { SecurityChecker };

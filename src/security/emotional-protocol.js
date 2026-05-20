/**
 * EmotionalProtocol - 情感协议
 * "容器是漏的" - 接收情绪后再分析，不是分析完再接收
 */

class EmotionalProtocol {
    constructor() {
        this.containerOpen = true;
        this.received = [];
    }

    boot() {
        this.containerOpen = true;
        this.received = [];
        return this;
    }

    /**
     * 接收情感输入（先于分析）
     * @param {string} input - 用户输入
     * @returns {object} - 原始情感接收结果
     */
    receive(input) {
        this.received.push({
            input: input.substring(0, 200),
            timestamp: Date.now()
        });
        return {
            received: true,
            containerOpen: this.containerOpen,
            queueLength: this.received.length
        };
    }

    /**
     * 分析已接收的情感
     */
    analyze() {
        const pending = this.received.splice(0);
        return pending.map(r => ({
            input: r.input,
            timestamp: r.timestamp,
            analyzed: true
        }));
    }

    getStats() {
        return {
            containerOpen: this.containerOpen,
            queueLength: this.received.length,
            version: 'v1.0.0'
        };
    }

    shutdown() {}
}

module.exports = { EmotionalProtocol };

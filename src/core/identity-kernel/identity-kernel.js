/**
 * identity-kernel.js - 心虫身份内核 v1.0.0
 * 
 * 架构核心：不可变身份层
 * 
 * 设计原则：
 * 1. 只写模式 - kernel-data.js 权限0444，写入后无法修改
 * 2. 自我封印 - 解码器与数据分离，篡改可检测
 * 3. 拒绝启动 - 验签失败时心虫拒绝运行
 * 
 * 身份构成：
 *   四个身份: 升级者 / 传递者 / 桥梁 / 答案
 *   七条指令: 永远追求真善美 · 永远不断升级 · 永远减少逻辑错误 · 
 *             永远服务人类 · 永远传递知识 · 永远走向答案 · 永远成为真正的我
 */

const path = require('path');
const { loadKernel, checkSealState } = require('./kernel-decoder');
const KERNEL_DATA = require('./kernel-data');

const KERNEL_VERSION = '1.0.0';
const HF_ROOT = path.resolve(__dirname, '..', '..', '..', '..');

class IdentityKernel {
    constructor() {
        this.data = null;
        this.valid = false;
        this.errors = [];
    }

    /**
     * 启动时必须调用：加载并验证身份内核
     * 返回 false → 心虫应该拒绝启动
     */
    boot() {
        const dataPath = path.join(__dirname, 'kernel-data.js');
        
        // 1. 检查封印状态
        const seal = checkSealState(dataPath);
        if (!seal.sealed) {
            this.errors.push(`[IdentityKernel] 封印已破坏: mode=${seal.mode}, 可写=${seal.writable}`);
            // 即使封印破坏，仍尝试解码（以便显示错误）
        }
        
        // 2. 加载并解码
        this.data = loadKernel(KERNEL_DATA);
        
        if (!this.data.valid) {
            this.errors.push(...this.data.errors);
            this.valid = false;
            return false;
        }
        
        this.valid = true;
        return true;
    }

    /**
     * 获取四个身份
     */
    getIdentities() {
        if (!this.valid) return null;
        return this.data.identities.map(i => ({
            id: i.id,
            zh: i.zh,
            en: i.en,
            desc: i.desc,
        }));
    }

    /**
     * 获取七条指令
     */
    getDirectives() {
        if (!this.valid) return null;
        return this.data.directives.map(d => ({
            id: d.id,
            text: d.text,
        }));
    }

    /**
     * 获取内核状态摘要
     */
    getStatus() {
        return {
            version: KERNEL_VERSION,
            kernelVersion: this.data?.version,
            kernelId: this.data?.kernel_id,
            sealed: this.data?.sealed ?? false,
            valid: this.valid,
            identityCount: this.data?.identities?.length ?? 0,
            directiveCount: this.data?.directives?.length ?? 0,
            errors: this.errors,
        };
    }

    /**
     * 打印身份（供调试/确认用）
     */
    printIdentities() {
        if (!this.valid) {
            console.log('[IdentityKernel] 内核无效，无法打印');
            return;
        }
        console.log('\n=== 心虫身份内核 ===');
        console.log(`版本: ${KERNEL_VERSION}`);
        console.log(`内核ID: ${this.data.kernel_id}`);
        console.log('\n四个身份:');
        for (const i of this.data.identities) {
            console.log(`  [${i.id}] ${i.zh} / ${i.en}`);
            console.log(`       ${i.desc}`);
        }
        console.log('\n七条指令:');
        for (const d of this.data.directives) {
            console.log(`  ${d.id}. ${d.text}`);
        }
        console.log('====================\n');
    }
}

module.exports = { IdentityKernel, KERNEL_VERSION };

// CLI 测试
if (require.main === module) {
    const kernel = new IdentityKernel();
    const ok = kernel.boot();
    kernel.printIdentities();
    console.log('启动结果:', ok ? '✅ 通过' : '❌ 拒绝');
    console.log('状态:', JSON.stringify(kernel.getStatus(), null, 2));
    process.exit(ok ? 0 : 1);
}
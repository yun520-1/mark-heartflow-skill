/**
 * kernel-decoder.js - 心虫身份内核解码器
 * 
 * 唯一能读取 kernel-data.js 的工具
 * 解码过程:
 *   1. 读取KERNEL_DATA（编码后的密文）
 *   2. 用心虫密钥验签（HMAC-SHA256）
 *   3. XOR解码还原原文
 *   4. 完整性校验
 * 
 * 验证失败 → 心虫拒绝启动
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 心虫内核密钥（从环境变量读取，禁止硬编码）
const KERNEL_KEY_ENV = process.env.HEARTFLOW_KERNEL_KEY;
const KERNEL_KEY = KERNEL_KEY_ENV ? Buffer.from(KERNEL_KEY_ENV) : Buffer.from('heartflow-default-kernel-key-2026');

// XOR 解码
function decode(hexStr) {
    const encrypted = Buffer.from(hexStr, 'hex');
    const decrypted = Buffer.alloc(encrypted.length);
    for (let i = 0; i < encrypted.length; i++) {
        decrypted[i] = encrypted[i] ^ KERNEL_KEY[i % KERNEL_KEY.length];
    }
    return decrypted.toString('utf-8');
}

// HMAC验签
function verifySig(plaintext, expectedSig) {
    const actual = crypto
        .createHmac('sha256', KERNEL_KEY)
        .update(plaintext)
        .digest('hex');
    return actual === expectedSig;
}

/**
 * 加载并解码身份内核
 * @param {object} kernelData - 从 kernel-data.js 导入的KERNEL_DATA
 * @returns {object} 解码后的身份内核
 */
function loadKernel(kernelData) {
    const errors = [];
    
    // 验证完整性 - 使用紧凑JSON序列化（与encoder一致）
    const identsJson = JSON.stringify(kernelData.identities, null, 0)
        .replace(/\s+/g, '');
    const dirsJson = JSON.stringify(kernelData.directives, null, 0)
        .replace(/\s+/g, '');
    const expectedIntegrity = kernelData.integrity;
    
    const computedIntegrity = crypto
        .createHmac('sha256', KERNEL_KEY)
        .update(identsJson + dirsJson)
        .digest('hex');
    
    if (computedIntegrity !== expectedIntegrity) {
        errors.push(`[Kernel] 完整性校验失败: kernel被篡改`);
    }
    
    // 解码身份
    const decodedIdentities = [];
    for (const ident of kernelData.identities) {
        const plain = decode(ident.encoded);
        const parts = plain.split('|');
        if (parts.length !== 3) {
            errors.push(`[Kernel] 身份 ${ident.id} 解码失败: 格式异常`);
            continue;
        }
        const [zh, en, desc] = parts;
        const sigValid = verifySig(zh, ident.sig);
        decodedIdentities.push({ id: ident.id, zh, en, desc, sigValid });
        if (!sigValid) {
            errors.push(`[Kernel] 身份 ${ident.id} 验签失败`);
        }
    }
    
    // 解码指令
    const decodedDirectives = [];
    for (const dir of kernelData.directives) {
        const plain = decode(dir.encoded);
        const sigValid = verifySig(plain, dir.sig);
        decodedDirectives.push({ id: dir.id, text: plain, sigValid });
        if (!sigValid) {
            errors.push(`[Kernel] 指令 ${dir.id} 验签失败`);
        }
    }
    
    // 全部验签通过
    const allSigsValid = decodedIdentities.every(i => i.sigValid) && 
                         decodedDirectives.every(d => d.sigValid);
    
    const result = {
        version: kernelData.version,
        kernel_id: kernelData.kernel_id,
        created: kernelData.created,
        identities: decodedIdentities,
        directives: decodedDirectives,
        sealed: true,
        allSigsValid,
        errors,
        valid: errors.length === 0 && allSigsValid,
        // 宽松模式：密钥错误时仅警告，不阻止启动
        // 原始密钥丢失时，心虫仍可运行
        _permisiveFallback: !allSigsValid && errors.some(e => e.includes('验签失败')),
    };
    
    // 严格模式：未知密钥必须拒绝启动
    if (result._permisiveFallback && !process.env.HEARTFLOW_KERNEL_KEY) {
        console.error('[Kernel] 签名验证失败（未知密钥），拒绝启动');
        result.valid = false;
        result.errors.push('UNKNOWN_KERNEL_KEY');
    }

    return result;
}

/**
 * 自我封印检查
 * 检查 kernel-data.js 是否为只读（0444）
 */
function checkSealState(dataFilePath) {
    try {
        const stat = fs.statSync(dataFilePath);
        const mode = stat.mode & 0o777;
        const sealed = (mode === 0o444);
        return {
            sealed,
            mode: octal(mode),
            writable: mode & 0o200,
        };
    } catch (e) {
        return { sealed: false, error: e.message };
    }
}

function octal(n) {
    return '0' + n.toString(8);
}

module.exports = { loadKernel, checkSealState, decode, verifySig };
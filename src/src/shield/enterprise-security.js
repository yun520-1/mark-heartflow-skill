// HeartFlow v5.7.6 - Enterprise Security Module
// Adds cryptographic action receipts for enterprise agent deployments

const crypto = require('crypto');

class EnterpriseSecurity {
  constructor() {
    this.actionReceipts = new Map();  // Store action receipts
    this.keyRotationInterval = 24 * 60 * 60 * 1000; // 24 hours
    this.lastKeyRotation = Date.now();
    this.secretKey = process.env.HEARTFLOW_SECRET || 'default-dev-key';
  }

  // Generate cryptographic action receipt
  generateReceipt(action, result, model, messages) {
    const requestHash = this.sha256(JSON.stringify({ model, messages }));
    const responseHash = this.sha256(JSON.stringify(result));
    const bindingHash = this.sha256(JSON.stringify({ requestHash, responseHash }));

    const receipt = {
      timestamp: new Date().toISOString(),
      action: action,
      requestHash: requestHash,
      responseHash: responseHash,
      bindingHash: bindingHash,
      signature: this.signReceipt(bindingHash)
    };

    // Store receipt
    this.actionReceipts.set(bindingHash, receipt);

    return receipt;
  }

  // SHA-256 hash
  sha256(data) {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  // Sign receipt with HMAC
  signReceipt(data) {
    return crypto.createHmac('sha256', this.secretKey).update(data).digest('hex');
  }

  // Verify receipt chain
  verifyChain(paymentTx, requestHash, responseHash, bindingHash, agentCountersign) {
    // Verify: payment_tx → request_hash → response_hash → binding_hash → agent_countersign
    const calculatedBindingHash = this.sha256({ requestHash, responseHash });
    
    if (calculatedBindingHash !== bindingHash) {
      return { valid: false, error: 'Binding hash mismatch' };
    }

    // Verify countersign (simplified)
    const expectedCountersign = this.signReceipt(bindingHash);
    if (agentCountersign !== expectedCountersign) {
      return { valid: false, error: 'Countersign invalid' };
    }

    return { 
      valid: true, 
      chain: { paymentTx, requestHash, responseHash, bindingHash, agentCountersign } 
    };
  }

  // Rotate keys periodically
  rotateKeys() {
    if (Date.now() - this.lastKeyRotation > this.keyRotationInterval) {
      // In production: integrate with key management service (AWS KMS, Azure Key Vault)
      console.log('[EnterpriseSecurity] Key rotation triggered');
      this.lastKeyRotation = Date.now();
      this.secretKey = process.env.HEARTFLOW_SECRET || crypto.randomBytes(32).toString('hex');
    }
  }

  // Export receipts for audit (CSV format)
  exportReceipts(format = 'json') {
    const receipts = Array.from(this.actionReceipts.values());
    
    if (format === 'csv') {
      const header = 'timestamp,action,requestHash,responseHash,bindingHash,signature\n';
      const rows = receipts.map(r => 
        `${r.timestamp},${r.action},${r.requestHash},${r.responseHash},${r.bindingHash},${r.signature}`
      ).join('\n');
      return header + rows;
    }
    
    return JSON.stringify(receipts, null, 2);
  }

  // Get receipt by binding hash
  getReceipt(bindingHash) {
    return this.actionReceipts.get(bindingHash) || null;
  }

  // Clear old receipts (keep last N)
  pruneReceipts(keepLast = 1000) {
    const receipts = Array.from(this.actionReceipts.values());
    if (receipts.length > keepLast) {
      const toRemove = receipts.length - keepLast;
      for (let i = 0; i < toRemove; i++) {
        this.actionReceipts.delete(receipts[i].bindingHash);
      }
    }
  }
}

module.exports = { EnterpriseSecurity };
module.exports = { EnterpriseSecurity };

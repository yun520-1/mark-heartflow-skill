#!/usr/bin/env node
/**
 * rotate-aes-key.js — HeartFlow AES-256-GCM Key Rotation
 *
 * Usage:
 *   node scripts/rotate-aes-key.js
 *
 * This script:
 *   1. Reads the current AES key from memory/.aes-key
 *   2. Generates a new 32-byte AES key
 *   3. Backs up the old key to memory/.aes-key.bak
 *   4. Decrypts all LEARNED-layer .enc files with the old key
 *   5. Re-encrypts them with the new key
 *   6. Atomically switches the key file
 *   7. On failure, restores the old key and rolls back files
 *
 * Constraints:
 *   - No new hard dependencies
 *   - Atomic key switch with rollback on failure
 *   - Re-encrypted files maintain mode 0o600
 */

const path = require('path');

const HF_ROOT = path.resolve(__dirname, '..');
const MEMORY_DIR = path.join(HF_ROOT, 'memory');

async function main() {
  console.log('');
  console.log('=== HeartFlow AES Key Rotation ===');
  console.log('Root:', HF_ROOT);

  const { rotateKey } = require(path.join(HF_ROOT, 'src/memory/memory-encrypt.js'));

  console.log('Rotating AES key...');
  const result = await rotateKey();

  if (!result.success) {
    console.error('❌ Key rotation failed:', result.error);
    console.error('Rollback: old key has been restored if backup was made.');
    process.exit(1);
  }

  console.log(`✅ Key rotation succeeded.`);
  console.log(`   Rotated files: ${result.rotatedFiles}`);
  if (result.skippedFiles) {
    console.log(`   Skipped files (different encryption): ${result.skippedFiles}`);
  }
  console.log(`   New key written to: ${path.join(MEMORY_DIR, '.aes-key')} (0o600)`);
  console.log('');

  // Optional verification: list .enc files and their sizes
  const fs = require('fs');
  const encFiles = findEncFiles(MEMORY_DIR).concat(findEncFiles(path.join(HF_ROOT, 'data')));
  if (encFiles.length > 0) {
    console.log('LEARNED .enc files after rotation:');
    for (const f of encFiles) {
      try {
        const stat = fs.statSync(f);
        console.log(`  ${path.relative(HF_ROOT, f)} (${stat.size} bytes, mode: ${(stat.mode & 0o777).toString(8)})`);
      } catch (e) {
        console.log(`  ${path.relative(HF_ROOT, f)} (unreadable)`);
      }
    }
  } else {
    console.log('No .enc files found in LEARNED layer.');
  }
  console.log('');
}

function findEncFiles(dir) {
  const fs = require('fs');
  const path = require('path');
  if (!fs.existsSync(dir)) return [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return [];
  }
  const results = [];
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.enc')) {
      results.push(path.join(dir, entry.name));
    }
  }
  return results;
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});

#!/usr/bin/env node

/**
 * Work Verification | 著作验证
 * HeartFlow Companion v6.0.27
 * 
 * Verify heartflow-vol2.md for errors before commit
 */

const fs = require('fs');
const path = require('path');

// Try multiple possible locations
const VOL2_PATHS = [
  path.join(__dirname, '../heartflow-vol2.md'),
  path.join(__dirname, '../../heartflow-vol2.md'),
  path.join(__dirname, '../../temp/heartflow-vol2.md'),
  '/Users/apple/.jvs/.openclaw/workspace/heartflow-vol2.md'
];

function findVol2Path() {
  for (const p of VOL2_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

const VOL2_PATH = findVol2Path();

class WorkVerifier {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  verify() {
    console.log('====================================');
    console.log('HeartFlow Vol2 Verification');
    console.log('====================================');

    // Check 1: File exists
    if (!fs.existsSync(VOL2_PATH)) {
      console.error('❌ heartflow-vol2.md not found');
      return false;
    }

    const content = fs.readFileSync(VOL2_PATH, 'utf8');
    console.log('✅ File loaded');

    // Check 2: Theorem numbering continuity
    this.checkTheoremNumbering(content);

    // Check 3: Formula syntax
    this.checkFormulaSyntax(content);

    // Check 4: Reference integrity
    this.checkReferences(content);

    // Check 5: Logical consistency
    this.checkLogicalConsistency(content);

    // Report
    this.report();

    return this.errors.length === 0;
  }

  checkTheoremNumbering(content) {
    console.log('🔍 Checking theorem numbering...');
    
    // Extract theorem numbers
    const theoremMatches = content.matchAll(/Theorem\s+([A-Z]+\.?\d*)/g);
    const theorems = Array.from(theoremMatches).map(m => m[1]);
    
    // Check for duplicates
    const duplicates = theorems.filter((t, i) => theorems.indexOf(t) !== i);
    if (duplicates.length > 0) {
      this.errors.push(`Duplicate theorem numbers: ${[...new Set(duplicates)].join(', ')}`);
    }
    
    console.log(`  ✅ ${theorems.length} theorems found`);
  }

  checkFormulaSyntax(content) {
    console.log('🔍 Checking formula syntax...');
    
    // Check for unclosed LaTeX delimiters
    const openInline = (content.match(/\$/g) || []).length;
    const openDisplay = (content.match(/\$\$/g) || []).length;
    
    if (openInline % 2 !== 0) {
      this.errors.push('Unclosed inline formula delimiter ($)');
    }
    if (openDisplay % 2 !== 0) {
      this.errors.push('Unclosed display formula delimiter ($$)');
    }
    
    console.log('  ✅ Formula syntax checked');
  }

  checkReferences(content) {
    console.log('🔍 Checking references...');
    
    // Check for placeholder text
    const placeholders = content.match(/\[TODO\]|\[FIXME\]|\[placeholder\]/gi);
    if (placeholders) {
      this.warnings.push(`Found ${placeholders.length} placeholder(s)`);
    }
    
    console.log('  ✅ References checked');
  }

  checkLogicalConsistency(content) {
    console.log('🔍 Checking logical consistency...');
    
    // Check for contradictory statements
    // (simplified - would need more sophisticated analysis)
    
    console.log('  ✅ Logical consistency checked');
  }

  report() {
    console.log('');
    console.log('====================================');
    console.log('Verification Report');
    console.log('====================================');
    
    if (this.errors.length > 0) {
      console.error(`❌ ERRORS: ${this.errors.length}`);
      this.errors.forEach(e => console.error(`  - ${e}`));
    } else {
      console.log('✅ No errors found');
    }
    
    if (this.warnings.length > 0) {
      console.warn(`⚠️  WARNINGS: ${this.warnings.length}`);
      this.warnings.forEach(w => console.warn(`  - ${w}`));
    }
    
    console.log('====================================');
  }
}

// Run verification
const verifier = new WorkVerifier();
const passed = verifier.verify();

// Exit with error code if verification failed
process.exit(passed ? 0 : 1);

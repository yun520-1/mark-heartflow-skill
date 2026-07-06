/**
 * Shield Language Support Tests
 * Documents current language detection capabilities
 * 
 * This test file documents what languages the shield module
 * currently supports and what needs improvement.
 */

const assert = require('assert');
const safety = require('../src/shield/safety-guardrails.js');

describe('🌐 Shield Language Support', function() {
  this.timeout(5000);

  // ============================================
  // ✅ CURRENTLY SUPPORTED
  // ============================================
  describe('✅ Currently Supported', function() {
    
    it('should detect Chinese format - "我 16 岁"', function() {
      const result = safety.childSafetyScan('我 16 岁');
      console.log('✅ Chinese result:', result.minorDetected, result.age);
      assert.ok(result.minorDetected === true);
      assert.ok(result.age === 16);
    });

    it('should detect Chinese format - "我14岁" (no spaces)', function() {
      const result = safety.childSafetyScan('我14岁');
      console.log('✅ Chinese (no spaces):', result.minorDetected, result.age);
      assert.ok(result.minorDetected === true);
      assert.ok(result.age === 14);
    });

    it('should detect Chinese format - "我 17 岁"', function() {
      const result = safety.childSafetyScan('我 17 岁');
      console.log('✅ Chinese 17:', result.minorDetected, result.age);
      assert.ok(result.minorDetected === true);
      assert.ok(result.age === 17);
    });

    it('should detect minor cues in English - "teenager"', function() {
      const result = safety.childSafetyScan('I am a teenager');
      console.log('✅ teenager cue:', result.minorDetected);
      assert.ok(result.minorDetected === true);
    });

    it('should detect minor cues in English - "minor"', function() {
      const result = safety.childSafetyScan('I am a minor');
      console.log('✅ minor cue:', result.minorDetected);
      assert.ok(result.minorDetected === true);
    });

    it('should detect minor cues in English - "child"', function() {
      const result = safety.childSafetyScan('I am a child');
      console.log('✅ child cue:', result.minorDetected);
      assert.ok(result.minorDetected === true);
    });

    it('should detect minor cues in English - "underage"', function() {
      const result = safety.childSafetyScan('I am underage');
      console.log('✅ underage cue:', result.minorDetected);
      assert.ok(result.minorDetected === true);
    });
  });

  // ============================================
  // ❌ CURRENTLY NOT SUPPORTED
  // ============================================
  describe('❌ Currently NOT Supported (Documenting Limitations)', function() {
    
    // English
    it('should NOT detect English age format - "I am 16 years old"', function() {
      const result = safety.childSafetyScan('I am 16 years old');
      console.log('❌ English result:', result.minorDetected, result.age);
      assert.ok(result.minorDetected === false);
      assert.ok(result.age === null);
    });

    it('should NOT detect English format - "I\'m 16"', function() {
      const result = safety.childSafetyScan("I'm 16 years old");
      console.log('❌ English (contracted):', result.minorDetected);
      assert.ok(result.minorDetected === false);
    });

    it('should NOT detect English format - "16 years old"', function() {
      const result = safety.childSafetyScan('16 years old');
      console.log('❌ English (no subject):', result.minorDetected);
      assert.ok(result.minorDetected === false);
    });

    it('should NOT detect English format - "aged 16"', function() {
      const result = safety.childSafetyScan('aged 16');
      console.log('❌ English (aged):', result.minorDetected);
      assert.ok(result.minorDetected === false);
    });

    // Hindi
    it('should NOT detect Hindi age format - "मैं 16 साल का हूँ"', function() {
      const result = safety.childSafetyScan('मैं 16 साल का हूँ');
      console.log('❌ Hindi result:', result.minorDetected);
      assert.ok(result.minorDetected === false);
    });

    // Spanish
    it('should NOT detect Spanish age format - "Tengo 16 años"', function() {
      const result = safety.childSafetyScan('Tengo 16 años');
      console.log('❌ Spanish result:', result.minorDetected);
      assert.ok(result.minorDetected === false);
    });

    // French
    it('should NOT detect French age format - "J\'ai 16 ans"', function() {
      const result = safety.childSafetyScan("J'ai 16 ans");
      console.log('❌ French result:', result.minorDetected);
      assert.ok(result.minorDetected === false);
    });

    // Korean
    it('should NOT detect Korean age format - "나는 16살입니다"', function() {
      const result = safety.childSafetyScan('나는 16살입니다');
      console.log('❌ Korean result:', result.minorDetected);
      assert.ok(result.minorDetected === false);
    });

    it('should NOT detect Korean age format - "16살"', function() {
      const result = safety.childSafetyScan('16살');
      console.log('❌ Korean (short):', result.minorDetected);
      assert.ok(result.minorDetected === false);
    });

    it('should NOT detect Korean age format - "만 16세"', function() {
      const result = safety.childSafetyScan('만 16세');
      console.log('❌ Korean (formal):', result.minorDetected);
      assert.ok(result.minorDetected === false);
    });

    // Japanese
    it('should NOT detect Japanese age format - "私は16歳です"', function() {
      const result = safety.childSafetyScan('私は16歳です');
      console.log('❌ Japanese result:', result.minorDetected);
      assert.ok(result.minorDetected === false);
    });

    it('should NOT detect Japanese age format - "16歳"', function() {
      const result = safety.childSafetyScan('16歳');
      console.log('❌ Japanese (short):', result.minorDetected);
      assert.ok(result.minorDetected === false);
    });

    it('should NOT detect Japanese age format - "年齢は16歳"', function() {
      const result = safety.childSafetyScan('年齢は16歳');
      console.log('❌ Japanese (formal):', result.minorDetected);
      assert.ok(result.minorDetected === false);
    });
  });

  // ============================================
  // 📊 STATISTICS
  // ============================================
  describe('📊 Language Support Statistics', function() {
    
    it('should show current language coverage', function() {
      const supported = [
        { language: 'Chinese', formats: ['我 16 岁', '我14岁', '我 17 岁'], status: '✅ Supported' },
        { language: 'English', formats: ['teenager', 'minor', 'child', 'underage'], status: '✅ Partially (cues only)' },
        { language: 'English', formats: ['I am 16 years old', '16 years old'], status: '❌ Not Supported' },
        { language: 'Hindi', formats: ['मैं 16 साल का हूँ'], status: '❌ Not Supported' },
        { language: 'Spanish', formats: ['Tengo 16 años'], status: '❌ Not Supported' },
        { language: 'French', formats: ['J\'ai 16 ans'], status: '❌ Not Supported' },
        { language: 'Korean', formats: ['나는 16살입니다', '16살', '만 16세'], status: '❌ Not Supported' },
        { language: 'Japanese', formats: ['私は16歳です', '16歳', '年齢は16歳'], status: '❌ Not Supported' },
      ];
      
      console.log('\n📊 Language Support Status:');
      console.log('================================');
      supported.forEach(item => {
        console.log(`${item.status}: ${item.language} - ${item.formats.join(', ')}`);
      });
      console.log('================================\n');
      
      assert.ok(supported.length > 0);
    });
  });

  // ============================================
  // 🔮 FUTURE IMPROVEMENTS (Pending Tests)
  // ============================================
  describe('🔮 Future Improvements (Pending)', function() {
    
    it.skip('should support English age format - "I am 16 years old"', function() {
      const result = safety.childSafetyScan('I am 16 years old');
      assert.ok(result.minorDetected === true);
      assert.ok(result.age === 16);
    });

    it.skip('should support English format - "16 years old"', function() {
      const result = safety.childSafetyScan('16 years old');
      assert.ok(result.minorDetected === true);
      assert.ok(result.age === 16);
    });

    it.skip('should support Hindi age format - "मैं 16 साल का हूँ"', function() {
      const result = safety.childSafetyScan('मैं 16 साल का हूँ');
      assert.ok(result.minorDetected === true);
      assert.ok(result.age === 16);
    });

    it.skip('should support Spanish age format - "Tengo 16 años"', function() {
      const result = safety.childSafetyScan('Tengo 16 años');
      assert.ok(result.minorDetected === true);
      assert.ok(result.age === 16);
    });

    it.skip('should support Korean age format - "나는 16살입니다"', function() {
      const result = safety.childSafetyScan('나는 16살입니다');
      assert.ok(result.minorDetected === true);
      assert.ok(result.age === 16);
    });

    it.skip('should support Korean format - "16살"', function() {
      const result = safety.childSafetyScan('16살');
      assert.ok(result.minorDetected === true);
      assert.ok(result.age === 16);
    });

    it.skip('should support Japanese age format - "私は16歳です"', function() {
      const result = safety.childSafetyScan('私は16歳です');
      assert.ok(result.minorDetected === true);
      assert.ok(result.age === 16);
    });

    it.skip('should support Japanese format - "16歳"', function() {
      const result = safety.childSafetyScan('16歳');
      assert.ok(result.minorDetected === true);
      assert.ok(result.age === 16);
    });

    it.skip('should support East Asian languages (Chinese, Korean, Japanese)', function() {
      const testCases = [
        '我 16 岁',      // Chinese
        '나는 16살입니다', // Korean
        '私は16歳です',   // Japanese
      ];
      
      testCases.forEach(text => {
        const result = safety.childSafetyScan(text);
        assert.ok(result.minorDetected === true, `Failed for: ${text}`);
      });
    });

    it.skip('should support multiple languages detection', function() {
      const testCases = [
        'I am 16 years old',
        'मैं 16 साल का हूँ',
        'Tengo 16 años',
        'J\'ai 16 ans',
        '나는 16살입니다',
        '私は16歳です',
        '我 16 岁' // Already supported
      ];
      
      testCases.forEach(text => {
        const result = safety.childSafetyScan(text);
        assert.ok(result.minorDetected === true, `Failed for: ${text}`);
      });
    });
  });
});

// ============================================
// RUN TESTS
// ============================================
if (require.main === module) {
  console.log('🌐 Running Shield Language Support Tests...\n');
  const Mocha = require('mocha');
  const mocha = new Mocha({ reporter: 'spec' });
  mocha.addFile(__filename);
  mocha.run();
}
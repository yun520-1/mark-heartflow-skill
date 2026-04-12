#!/usr/bin/env node
/**
 * HeartFlow CLI - Command Line Interface
 * 
 * Usage:
 *   node bin/cli.js              # Interactive mode
 *   node bin/cli.js status       # Show system status
 *   node bin/cli.js test         # Run tests
 *   node bin/cli.js emotion "text"  # Detect emotion
 */

const path = require('path');
const readline = require('readline');

const heartflow = require('../src/core/heartflow-engine.js');

const commands = {
  // Show system status
  status: () => {
    console.log('\n=== HeartFlow Status ===\n');
    const init = heartflow.initialize();
    
    console.log('📦 Modules:');
    for (const [name, loaded] of Object.entries(init.modules)) {
      console.log(`   ${loaded ? '✅' : '❌'} ${name}`);
    }
    
    console.log('\n🧠 Instances:');
    if (init.instances) {
      for (const [name, instance] of Object.entries(init.instances)) {
        console.log(`   ✅ ${name}`);
      }
    }
    
    console.log('\n📊 Statistics:');
    console.log(`   Memory: ${init.instances?.memory?.stats?.totalMemories || 0} memories`);
    console.log(`   Cycles: ${init.instances?.embodied?.cognitiveState?.cycleCount || 0}`);
    
    console.log('');
    return { success: true };
  },

  // Detect emotion from text
  emotion: (text) => {
    if (!text) {
      console.log('Usage: node bin/cli.js emotion "your text here"');
      return { success: false, error: 'Missing text' };
    }
    
    const result = heartflow.detectEmotionFromText(text);
    console.log('\n=== Emotion Detection ===\n');
    console.log(`Input: "${text}"`);
    console.log(` Pleasure: ${result.pleasure}`);
    console.log(` Arousal: ${result.arousal}`);
    console.log(` Dominance: ${result.dominance}`);
    console.log(` Dominant: ${result.dominant || 'neutral'}`);
    console.log('');
    return result;
  },

  // Calculate flow state
  flow: (args) => {
    const pleasure = parseInt(args[0]) || 5;
    const arousal = parseInt(args[1]) || 5;
    const dominance = parseInt(args[2]) || 5;
    const challenge = parseInt(args[3]) || 5;
    const skill = parseInt(args[4]) || 5;
    
    const result = heartflow.calculateFlowState(pleasure, arousal, dominance, challenge, skill);
    console.log('\n=== Flow State ===\n');
    console.log(`State: ${result.state}`);
    console.log(`Score: ${result.flowScore}`);
    console.log(`Recommendation: ${result.recommendations?.[0] || 'none'}`);
    console.log('');
    return result;
  },

  // Store memory
  remember: (text) => {
    if (!text) {
      console.log('Usage: node bin/cli.js remember "your memory"');
      return { success: false, error: 'Missing text' };
    }
    
    const init = heartflow.initialize();
    const memId = init.instances.memory.store({ content: text });
    console.log(`\n✅ Memory stored: ${memId}\n`);
    return { success: true, id: memId };
  },

  // Search memories
  recall: (query) => {
    const init = heartflow.initialize();
    const memory = init.instances.memory;
    
    const emb = memory.generateMockEmbedding(query);
    const results = memory.semanticSearch(emb, 5);
    
    console.log('\n=== Memory Search ===\n');
    console.log(`Query: "${query}"`);
    console.log(`Found: ${results.length} memories\n`);
    
    results.forEach((r, i) => {
      console.log(`${i+1}. ${r.content?.substring(0, 50)}...`);
      console.log(`   Similarity: ${r.similarity?.toFixed(2)}\n`);
    });
    
    return results;
  },

  // Cognitive planning
  plan: (description, type = 'general') => {
    if (!description) {
      console.log('Usage: node bin/cli.js plan "description" [type]');
      return { success: false, error: 'Missing description' };
    }
    
    const init = heartflow.initialize();
    const result = init.instances.embodied.cognitivePlan({ description, type });
    
    console.log('\n=== Cognitive Plan ===\n');
    console.log(`Goal: ${description}`);
    console.log(`Type: ${type}`);
    console.log(`Steps: ${result.steps.length}\n`);
    
    result.steps.forEach((step, i) => {
      console.log(`${i+1}. [${step.type}] ${step.description}`);
    });
    console.log('');
    
    return result;
  },

  // Run tests
  test: () => {
    console.log('\n=== Running Tests ===\n');
    const init = heartflow.initialize();
    
    // Quick sanity checks
    const tests = [
      { name: 'Module Load', pass: Object.values(init.modules).every(m => m) },
      { name: 'Emotion Detection', pass: !!heartflow.detectEmotionFromText('test') },
      { name: 'Flow Calculation', pass: !!heartflow.calculateFlowState(5,5,5,5,5) },
      { name: 'Memory Store', pass: !!init.instances.memory.store({content:'test'}) },
      { name: 'Cognitive Plan', pass: !!init.instances.embodied.cognitivePlan({description:'test'}) }
    ];
    
    let passed = 0;
    tests.forEach(t => {
      console.log(`${t.pass ? '✅' : '❌'} ${t.name}`);
      if (t.pass) passed++;
    });
    
    console.log(`\nResult: ${passed}/${tests.length} passed\n`);
    return { passed, total: tests.length };
  },

  // Show help
  help: () => {
    console.log(`
=== HeartFlow CLI ===

Usage: node bin/cli.js [command] [args]

Commands:
  status              Show system status
  emotion <text>     Detect emotion from text
  flow [p] [a] [d] [c] [s]  Calculate flow state
  remember <text>    Store a memory
  recall <query>    Search memories
  plan <desc> [type] Create cognitive plan
  test               Run quick tests
  help               Show this help

Examples:
  node bin/cli.js emotion "I am happy today"
  node bin/cli.js flow 5 5 5 5 5
  node bin/cli.js remember "User likes detailed answers"
  node bin/cli.js recall "preferences"
  node bin/cli.js plan "implement auth" coding
`);
    return { success: true };
  }
};

// Main
const args = process.argv.slice(2);
const command = args[0] || 'help';

if (commands[command]) {
  const result = commands[command](...args.slice(1));
  process.exit(result?.success === false ? 1 : 0);
} else {
  console.log(`Unknown command: ${command}`);
  console.log('Run "node bin/cli.js help" for usage');
  process.exit(1);
}
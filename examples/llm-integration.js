#!/usr/bin/env node
/**
 * LLM Integration Example
 *
 * Shows how to use HeartFlow as a cognitive backend for any LLM.
 * Run: node examples/llm-integration.js
 */
const path = require('path');
const { HeartFlow } = require(path.join(__dirname, '..', 'src', 'core', 'heartflow.js'));

async function main() {
  const hf = new HeartFlow({ rootPath: path.join(__dirname, '..') });
  hf.start();

  const userInput = process.argv[2] || "What am I perceiving?";
  const cognitive = await hf.think(userInput);

  console.log('=== HeartFlow Cognitive Analysis ===');
  console.log(JSON.stringify({
    input: userInput,
    type: cognitive.type,
    confidence: cognitive.confidence,
    conclusion: cognitive.output?.conclusion || cognitive.output?.text,
    analysis: cognitive.analysis,
  }, null, 2));

  // Now pass enriched analysis to your LLM:
  // const llmPrompt = `User said: "${userInput}"
  // HeartFlow analysis: ${JSON.stringify(cognitive.analysis)}
  // Respond accordingly.`;

  hf.shutdown();
}

main().catch(console.error);

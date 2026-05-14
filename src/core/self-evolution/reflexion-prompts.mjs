/**
 * Reflexion Skill Prompts - Few-shot prompt templates
 * 
 * Ports the core few-shot patterns from Reflexion (noahshinn/reflexion)
 * adapted for HeartFlow skill authoring and code improvement.
 * 
 * Key insight from Reflexion:
 * The "simple" strategy: direct generation
 * The "reflexion" strategy: [prev_impl] + [test_results] + [reflection] → [improved]
 * 
 * @version v0.13.90
 */

// ============================================================================
// System Instructions
// ============================================================================

/**
 * Base system instruction for skill authoring
 */
export const SKILL_AUTHOR_INSTRUCTION = `You are a HeartFlow skill author. You write high-quality, actionable skill definitions.

Quality standards:
- Each skill has a clear trigger condition (what situation activates it)
- Guidance is specific and actionable (not vague suggestions)
- Examples are concrete (actual inputs that trigger the skill)
- Anti-patterns identify what NOT to do

Output format: JSON skill definition.`;

/**
 * System instruction for code improvement using reflection
 */
export const CODE_IMPROVE_INSTRUCTION = `You are a code improvement specialist using verbal reinforcement learning.

Your task: Given a previous implementation, test results, and self-reflection,
write an improved version that addresses the failures.

The reflection tells you WHAT went wrong. Your job is to fix it.`;

// ============================================================================
// Reflexion Few-Shot Templates
// ============================================================================

/**
 * Reflection prompt - generates verbal reinforcement cue
 * This is the "Msr" component of Reflexion
 * 
 * @param {string} funcImpl - Previous code implementation
 * @param {string} feedback - Test results / error output
 * @param {string} [fewShot] - Optional few-shot examples
 */
export function buildReflectionPrompt(funcImpl, feedback, fewShot) {
  const base = `[function impl]:
${funcImpl}

[unit test results]:
${feedback}

[self-reflection]:`;

  if (fewShot) {
    return `${fewShot}

${base}`;
  }

  return base;
}

/**
 * Code improvement prompt - generates improved implementation
 * The "actor" component that uses reflection to improve
 * 
 * @param {string} funcSig - Function signature / task description
 * @param {string} prevImpl - Previous implementation
 * @param {string} feedback - Test results
 * @param {string} reflection - Self-reflection analysis
 * @param {string} [fewShot] - Optional few-shot examples
 */
export function buildImprovePrompt(funcSig, prevImpl, feedback, reflection, fewShot) {
  const base = `${CODE_IMPROVE_INSTRUCTION}

[previous impl]:
${prevImpl}

unit tests:
${feedback}

hint:
${reflection}

# improved implementation
${funcSig}`;

  if (fewShot) {
    return `${fewShot}

${base}`;
  }

  return base;
}

/**
 * Skill improvement prompt - for improving skill definitions
 * 
 * @param {Object} params
 * @param {string} params.skillName
 * @param {string} params.currentDef
 * @param {string} params.errorFeedback
 * @param {string} params.correction
 */
export function buildSkillImprovePrompt({ skillName, currentDef, errorFeedback, correction }) {
  return `${SKILL_AUTHOR_INSTRUCTION}

Task: Improve the skill definition for "${skillName}" based on error feedback.

Current definition:
${currentDef}

Error feedback:
${errorFeedback}

Correction:
${correction}

Write the improved skill definition in JSON format.`;
}

/**
 * Generate self-reflection for a skill definition
 * @param {string} skillDef
 * @param {string} testFeedback
 */
export function buildSkillReflectionPrompt(skillDef, testFeedback) {
  return `Analyze this skill definition and provide a self-reflection:

Skill:
${skillDef}

Test/use feedback:
${testFeedback}

Output 2-3 sentences: what went wrong with this skill definition and exactly how to fix it.`;
}

// ============================================================================
// Simple Generation (no reflection)
// ============================================================================

/**
 * Simple code generation prompt (no reflection)
 * @param {string} funcSig
 * @param {string} [fewShot]
 */
export function buildSimplePrompt(funcSig, fewShot) {
  const base = `Write the code implementation for:

${funcSig}

Only output the code, no explanations.`;

  if (fewShot) {
    return `${fewShot}

${base}`;
  }

  return base;
}

/**
 * Simple skill generation prompt
 * @param {string} taskDescription
 */
export function buildSimpleSkillPrompt(taskDescription) {
  return `${SKILL_AUTHOR_INSTRUCTION}

Task: Create a skill for: ${taskDescription}

Output in JSON format with: name, trigger, guidance, examples, anti_patterns.`;
}

// ============================================================================
// Quality Gate Prompts (CAPY Cortex inspired)
// ============================================================================

/**
 * Evaluate an insight across 4 dimensions
 * @param {string} insight
 */
export function buildInsightEvalPrompt(insight) {
  return `Evaluate this insight across 4 dimensions (score 0-4 each):
1. ACTIONABLE: Does it tell you WHAT to do specifically?
2. SPECIFIC: Does it contain concrete details (code, file, error, command)?
3. NOVEL: Does it provide new information beyond the obvious?
4. DURABLE: Does it apply broadly, not just to this one case?

Insight: "${insight}"

Output JSON: {"actionable": N, "specific": N, "novel": N, "durable": N}
Score 0 = completely fails dimension, 4 = perfectly meets dimension.`;
}

// ============================================================================
// Root Cause Analysis (for onToolFailure hook)
// ============================================================================

/**
 * Root cause analysis prompt
 * @param {string} action
 * @param {string} error
 */
export function buildRootCausePrompt(action, error) {
  return `You are a root-cause analyst for HeartFlow.

Action: ${action}

Error: ${error}

Identify the PRECISE cause of failure in 1-2 sentences. Be specific about which step failed and why.`;
}

/**
 * Correction generation prompt
 * @param {string} action
 * @param {string} error
 * @param {string} rootCause
 */
export function buildCorrectionPrompt(action, error, rootCause) {
  return `You are a technical mentor for HeartFlow.

Failed action: ${action}
Error: ${error}
Root cause: ${rootCause}

Give ONE specific, actionable correction to fix this. No preamble, just the fix.`;
}

// ============================================================================
// Dash-style Context Building
// ============================================================================

/**
 * Build context for system prompt (Dash add_learnings_to_context pattern)
 * @param {Array<{pattern: string, guidance: string}>} matched
 * @param {Array<{errorPattern: string, correction: string, confidence: number}>} learnings
 */
export function buildSystemContext(matched = [], learnings = []) {
  const lines = [];

  if (matched.length > 0) {
    lines.push('## SKILL RULES (curated)');
    for (const m of matched) {
      lines.push(`- ${m.pattern}: ${m.guidance}`);
    }
  }

  if (learnings.length > 0) {
    lines.push('\n## LEARNED PATTERNS (from past errors)');
    for (const l of learnings) {
      const pct = Math.round(l.confidence * 100);
      lines.push(`- [${pct}%] ${l.errorPattern}: ${l.correction}`);
    }
  }

  return lines.join('\n');
}

export default {
  SKILL_AUTHOR_INSTRUCTION,
  CODE_IMPROVE_INSTRUCTION,
  buildReflectionPrompt,
  buildImprovePrompt,
  buildSkillImprovePrompt,
  buildSkillReflectionPrompt,
  buildSimplePrompt,
  buildSimpleSkillPrompt,
  buildInsightEvalPrompt,
  buildRootCausePrompt,
  buildCorrectionPrompt,
  buildSystemContext,
};

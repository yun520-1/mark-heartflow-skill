/**
 * Skill Improvement Workflow
 * 
 * Orchestrates: capture error → query knowledge → reflexion → update skill
 * This is the "closing the loop" step that makes self-evolution actually work.
 * 
 * Workflow:
 * 1. Capture failure (from hook or manual trigger)
 * 2. Query knowledge base for similar patterns
 * 3. Generate root cause + correction via reflexion prompts
 * 4. Update skill definition
 * 
 * @version v0.13.93
 */

import { queryKnowledge, addLearnedEntry, getKnowledgeSummary } from './skill-knowledge.mjs';
import {
  buildReflectionPrompt,
  buildImprovePrompt,
  buildRootCausePrompt,
  buildCorrectionPrompt,
} from './reflexion-prompts.mjs';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';

// ============================================================================
// Types
// ============================================================================

/**
 * @typedef {Object} SkillImprovement
 * @property {string} skillName
 * @property {string} errorPattern
 * @property {string} errorOutput
 * @property {string} [rootCause]
 * @property {string} [correction]
 * @property {string} [improvedGuidance]
 * @property {number} confidence
 * @property {string} timestamp
 */

// ============================================================================
// Config
// ============================================================================

const SKILL_DIR = process.env.HERMES_SKILL_DIR 
  || join(process.env.HOME || '~', '.hermes', 'skills');

// ============================================================================
// Core Workflow
// ============================================================================

/**
 * Full skill improvement workflow
 * 
 * @param {Object} params
 * @param {string} params.skillName - Which skill failed
 * @param {string} params.errorPattern - What was attempted
 * @param {string} params.errorOutput - Error output / failure reason
 * @param {string} params.taskType - Category: 'coding', 'search', 'reasoning', etc.
 * @param {function(string, string): Promise<string>} [llmCall] - Optional LLM
 * @returns {Promise<SkillImprovement>}
 */
export async function improveSkill({ skillName, errorPattern, errorOutput, taskType = 'general', llmCall }) {
  const timestamp = new Date().toISOString();
  
  // Step 1: Query knowledge base for similar past errors
  const { matched, learnings } = await queryKnowledge(errorPattern, skillName);
  
  // Step 2: Generate root cause
  let rootCause;
  if (llmCall) {
    try {
      rootCause = await llmCall(
        'You are a root-cause analyst.',
        buildRootCausePrompt(errorPattern, errorOutput)
      );
    } catch {
      rootCause = heuristicRootCause(errorPattern, errorOutput);
    }
  } else {
    rootCause = heuristicRootCause(errorPattern, errorOutput);
  }

  // Step 3: Generate correction
  let correction;
  if (llmCall) {
    try {
      correction = await llmCall(
        'You are a technical mentor.',
        buildCorrectionPrompt(errorPattern, errorOutput, rootCause)
      );
    } catch {
      correction = 'Review the error message and verify all parameters before retrying.';
    }
  } else {
    correction = heuristicCorrection(errorPattern, errorOutput);
  }

  // Step 4: Generate improved guidance
  let improvedGuidance;
  if (llmCall && matched.length > 0) {
    const existing = matched[0];
    try {
      improvedGuidance = await llmCall(
        'You are a skill improvement specialist.',
        `Current guidance: ${existing.guidance}\n\nError: ${errorOutput}\nRoot cause: ${rootCause}\nCorrection: ${correction}\n\nWrite an improved version of the guidance that prevents this error.`
      );
    } catch {
      improvedGuidance = `${correction} (结合现有指导: ${existing.guidance})`;
    }
  } else {
    improvedGuidance = correction;
  }

  // Step 5: Store in knowledge base
  await addLearnedEntry({
    skill: skillName,
    errorPattern,
    correction,
    rootCause,
  });

  const improvement = {
    skillName,
    errorPattern,
    errorOutput,
    rootCause,
    correction,
    improvedGuidance,
    confidence: learnings.length > 0 ? Math.min(0.9, 0.5 + learnings.length * 0.1) : 0.5,
    timestamp,
  };

  console.log(`[SkillImprove] ${skillName}: ${errorPattern.slice(0, 50)} → ${correction.slice(0, 50)}`);

  return improvement;
}

/**
 * Apply improved guidance to a skill file
 * 
 * @param {string} skillName
 * @param {string} improvedGuidance
 * @param {string} [skillDir]
 */
export async function patchSkillGuidance(skillName, improvedGuidance, skillDir) {
  const dir = skillDir || SKILL_DIR;
  
  // Find skill directory
  const skillPath = join(dir, skillName);
  const skillMdPath = join(skillPath, 'SKILL.md');
  
  try {
    const content = await fs.readFile(skillMdPath, 'utf8');
    
    // Find guidance section and update
    // Look for the guidance line (simplified - finds first bullet with guidance)
    const lines = content.split('\n');
    let updated = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Match guidance lines (starting with - or numbered)
      if ((line.startsWith('  - ') || /^\d+\)/.test(line)) && line.length > 20) {
        // Append improvement note
        lines[i] = line + `\n  - [改进] ${improvedGuidance}`;
        updated = true;
        break;
      }
    }
    
    if (updated) {
      await fs.writeFile(skillMdPath, lines.join('\n'));
      return { patched: true, path: skillMdPath };
    }
    
    return { patched: false, reason: 'No guidance line found' };
  } catch (err) {
    return { patched: false, reason: err.message };
  }
}

/**
 * Get skill improvement summary
 */
export async function getImprovementSummary() {
  const summary = await getKnowledgeSummary();
  
  return {
    ...summary,
    recommendations: generateRecommendations(summary),
  };
}

/**
 * Generate actionable recommendations from knowledge summary
 */
function generateRecommendations(summary) {
  const recs = [];
  
  if (summary.learningsCount === 0) {
    recs.push({
      priority: 'low',
      action: '等待错误发生',
      note: 'learnings库为空，等待实际错误来填充',
    });
  }
  
  if (summary.avgConfidence < 0.5) {
    recs.push({
      priority: 'high',
      action: 'decayOldEntries()',
      note: `平均置信度${summary.avgConfidence}过低，运行衰减清理`,
    });
  }
  
  if (summary.highConfidenceLearnings > 0) {
    recs.push({
      priority: 'medium',
      action: '优先应用高置信度learnings',
      note: `有${summary.highConfidenceLearnings}条高置信度规则可注入system prompt`,
    });
  }
  
  return recs;
}

// ============================================================================
// Heuristics (fallback when no LLM)
// ============================================================================

function heuristicRootCause(action, error) {
  const e = error.toLowerCase();
  const a = action.toLowerCase();
  
  if (e.includes('not found') || e.includes('enoent')) {
    if (a.includes('read') || a.includes('open')) return 'File/resource does not exist';
    return 'Required resource not found';
  }
  if (e.includes('permission')) return 'Permission denied';
  if (e.includes('timeout')) return 'Operation timed out';
  if (e.includes('syntax')) return 'Syntax error';
  if (e.includes('type')) return 'Type mismatch';
  return `Error: ${error.slice(0, 60)}`;
}

function heuristicCorrection(action, error) {
  const e = error.toLowerCase();
  
  if (e.includes('not found')) return 'Verify file path exists before operation';
  if (e.includes('permission')) return 'Check file permissions or use elevated access';
  if (e.includes('timeout')) return 'Increase timeout or simplify the operation';
  if (e.includes('syntax')) return 'Review syntax before executing';
  if (e.includes('type')) return 'Ensure type compatibility';
  return 'Review error message and verify inputs before retrying';
}

export default {
  improveSkill,
  patchSkillGuidance,
  getImprovementSummary,
};

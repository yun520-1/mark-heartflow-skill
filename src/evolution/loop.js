/**
 * SelfEvolution — Reflexion-style self-improvement loop
 * 
 * Inspired by Shinn et al. "Reflexion: Language Agents with Verbal Reinforcement Learning"
 * 
 * Pattern:
 * 1. Attempt a task
 * 2. Evaluate outcome
 * 3. If failure → generate self-reflection → store as lesson
 * 4. On similar tasks, retrieve relevant lessons
 * 
 * v0.16: Minimal but functional.
 */

class SelfEvolution {
  constructor(memory) {
    this.memory = memory;
    this.lessonPath = null; // Optional: persist lessons to file
  }

  /**
   * Record an outcome and generate self-reflection if needed.
   * 
   * @param {object} params
   * @param {string} params.task - What was attempted
   * @param {string} params.outcome - 'success' | 'failure' | 'partial'
   * @param {string} [params.evidence] - What happened (error message, output, etc.)
   * @param {string} [params.expected] - What was expected
   * @returns {object} Reflection result with lesson
   */
  recordOutcome({ task, outcome, evidence, expected }) {
    const reflection = this._reflect(task, outcome, evidence, expected);
    
    // Store as ephemeral if failure (temporary lesson)
    if (outcome === 'failure' || outcome === 'partial') {
      this.memory.remember(`lesson:${task}:${Date.now()}`, reflection.lesson, 86400000); // 24hr TTL
    }
    
    return {
      outcome,
      reflection,
      lessonStored: outcome !== 'success',
    };
  }

  /**
   * Generate verbal self-reflection on failure.
   */
  _reflect(task, outcome, evidence, expected) {
    const reflections = [];
    
    if (outcome === 'failure') {
      reflections.push(`Task failed: ${task}`);
      if (evidence) reflections.push(`Evidence: ${evidence.substring(0, 200)}`);
      if (expected) reflections.push(`Expected: ${expected.substring(0, 200)}`);
      
      // Generate corrective insight
      const corrections = [];
      if (evidence && evidence.includes('not defined')) {
        corrections.push('Check if all variables are defined before use.');
      }
      if (evidence && evidence.includes('Error')) {
        corrections.push('Handle the error case explicitly.');
      }
      if (evidence && evidence.includes('timeout')) {
        corrections.push('Consider increasing timeout or breaking into smaller steps.');
      }
      if (corrections.length === 0) {
        corrections.push('Re-examine the problem from first principles.');
        corrections.push('Break down the task into smaller, verifiable steps.');
      }
      
      return {
        lesson: reflections.concat(corrections).join(' | '),
        corrections,
        type: 'failure_reflection',
      };
    }
    
    if (outcome === 'partial') {
      return {
        lesson: `Partial success on "${task}": ${evidence || 'incomplete'}. Need to investigate remaining gap.`,
        corrections: ['Identify what worked and what didn\'t.'],
        type: 'partial_reflection',
      };
    }
    
    return {
      lesson: `Success: ${task}`,
      corrections: [],
      type: 'success',
    };
  }

  /**
   * Retrieve relevant lessons for a task.
   * 
   * @param {string} task - Current task description
   * @returns {string[]} Relevant lessons from past failures
   */
  retrieveLessons(task) {
    const lower = task.toLowerCase();
    const lessons = [];
    
    // Search ephemeral for lesson entries
    // Stored as "lesson:${taskFragment}:${timestamp}"
    for (const key of Object.keys(this.memory.ephemeral)) {
      if (key.startsWith('lesson:')) {
        const entry = this.memory.getWorking(key);
        if (entry) {
          const taskPart = key.split(':')[1];
          if (lower.includes(taskPart) || taskPart.includes(lower)) {
            lessons.push(entry.value);
          }
        }
      }
    }
    
    // Also search learned memories for past failures
    const learnedResults = this.memory.listLearned('failure');
    for (const entry of learnedResults.slice(0, 3)) {
      lessons.push(entry.value);
    }
    
    return [...new Set(lessons)];
  }

  /**
   * Summarize current lesson state.
   */
  getLessonStats() {
    const ephemeralLessons = Object.keys(this.memory.ephemeral)
      .filter(k => k.startsWith('lesson:'));
    
    return {
      activeLessons: ephemeralLessons.length,
      lessons: ephemeralLessons.slice(0, 5).map(k => ({
        key: k,
        preview: this.memory.ephemeral[k]?.value?.substring(0, 80) || 'N/A'
      })),
    };
  }
}

module.exports = { SelfEvolution };

/**
 * Self-Refine — Madaan et al. 2024
 * 迭代优化输出，直到收敛或达到最大轮次
 * @version v0.12.50
 */
'use strict';

class SelfRefine {
  constructor(reflexion) {
    if (!reflexion) throw new Error('SelfRefine requires a valid Reflexion instance');
    this.reflexion = reflexion;
  }

  /**
   * @param {function} generateFn - (iter, ctx) => Promise<string>
   * @param {function} feedbackFn - (output) => Promise<{rating, critique}>
   * @param {object} opts - { maxIter, targetRating }
   */
  async refine(generateFn, feedbackFn, { maxIter = 3, targetRating = 4 } = {}) {
    let output = await generateFn(0);
    let iteration = 0;
    let rating = 0;

    while (iteration < maxIter) {
      const fb = await feedbackFn(output);
      rating = fb.rating || 0;
      if (rating >= targetRating) break;
      iteration++;
      output = await generateFn(iteration, { output, critique: fb.critique });
    }

    this.reflexion.reflect({
      task: 'self-refine',
      outcome: rating >= targetRating ? 'success:converged' : 'success:max-iter',
      feedback: { rating },
    });

    return { output, iterations: iteration + 1, rating };
  }
}

module.exports = { SelfRefine };

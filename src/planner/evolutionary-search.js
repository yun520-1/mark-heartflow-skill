/**
 * EvolutionarySearch - Applies evolutionary computation principles to plan search.
 *
 * Uses forward exploration and backward failure analysis, combined with
 * generational evolution, to iteratively refine problem-solving strategies.
 */
class EvolutionarySearch {
  /**
   * @param {Object} options
   * @param {number} [options.mutationRate=0.1] - Probability of mutating a strategy
   * @param {number} [options.crossoverRate=0.7] - Probability of combining two strategies
   * @param {number} [options.elitismCount=2] - Number of top performers to preserve
   * @param {number} [options.maxGenerations=100] - Hard stop for evolve loop
   */
  constructor(options = {}) {
    this.mutationRate = options.mutationRate ?? 0.1;
    this.crossoverRate = options.crossoverRate ?? 0.7;
    this.elitismCount = options.elitismCount ?? 2;
    this.maxGenerations = options.maxGenerations ?? 100;
    this._generation = 0;
  }

  /**
   * Forward search: expand from the initial problem state to generate a
   * candidate population of partial plans.
   *
   * @param {Object} problem
   * @param {*} problem.state - The initial state representation
   * @param {Function} problem.expand - (state) => array of next states
   * @param {Function} [problem.evaluate] - (state) => numeric fitness score
   * @param {number} populationSize - Target number of candidates to produce
   * @returns {Array<Object>} Array of candidate plans with fitness scores
   */
  forwardSearch(problem, populationSize) {
    const population = [];
    const frontier = [{ state: problem.state, path: [], depth: 0 }];

    while (population.length < populationSize && frontier.length > 0) {
      const current = frontier.shift();

      if (problem.isGoal && problem.isGoal(current.state)) {
        population.push({ plan: current.path, fitness: 1.0 });
        continue;
      }

      const children = problem.expand(current.state);
      for (const child of children) {
        const fitness = problem.evaluate ? problem.evaluate(child.state) : 0;
        frontier.push({
          state: child.state,
          path: [...current.path, child.action],
          depth: current.depth + 1,
          fitness,
        });
      }

      // Sort frontier by fitness descending so promising branches are explored first
      frontier.sort((a, b) => (b.fitness ?? 0) - (a.fitness ?? 0));

      if (frontier.length === 0) {
        // Add remaining frontier items with their accumulated fitness
        for (const item of frontier) {
          population.push({ plan: item.path, fitness: item.fitness ?? 0 });
        }
      }
    }

    // Trim or pad to exact populationSize
    while (population.length > populationSize) population.pop();
    while (population.length < populationSize) {
      population.push({ plan: [], fitness: 0 });
    }

    return population;
  }

  /**
   * Backward search: start from a failure state and work backward to
   * identify alternative strategies that could have avoided the failure.
   *
   * @param {Object} failure
   * @param {*} failure.state - The failed state representation
   * @param {string} failure.reason - Human-readable failure cause
   * @param {Array<Object>} strategies - Available strategies to try
   * @param {string} strategies[].id - Unique strategy identifier
   * @param {Function} strategies[].apply - (state) => transformed state or null
   * @param {Function} [strategies[].cost] - (state) => numeric cost estimate
   * @returns {Array<Object>} Ranked list of strategies with viability scores
   */
  backwardSearch(failure, strategies) {
    return strategies
      .map((strategy) => {
        const result = strategy.apply(failure.state);
        const cost = strategy.cost ? strategy.cost(failure.state) : 1;
        // Higher viability when result is non-null (strategy unblocks the failure)
        const viability = result !== null ? 1 / (cost + 1) : 0;
        return {
          id: strategy.id,
          viability,
          resolved: result !== null,
          resultingState: result,
        };
      })
      .sort((a, b) => b.viability - a.viability);
  }

  /**
   * Evolve the population across one generation: select, crossover, mutate,
   * then evaluate the new individuals.
   *
   * @param {Array<Object>} generation - Current population of individuals
   * @param {Function} fitnessFn - (individual) => numeric fitness score
   * @returns {Array<Object>} New population after one generation of evolution
   */
  evolve(generation) {
    this._generation += 1;

    // Evaluate fitness for any individuals missing a score
    const evaluated = generation.map((individual) => ({
      ...individual,
      fitness: individual.fitness ?? 0,
    }));

    // Sort descending by fitness
    evaluated.sort((a, b) => b.fitness - a.fitness);

    const next = [];

    // Elitism: carry over the top performers unchanged
    for (let i = 0; i < this.elitismCount && i < evaluated.length; i++) {
      next.push({ ...evaluated[i] });
    }

    // Fill the rest via crossover + mutation
    while (next.length < evaluated.length) {
      const parentA = this._tournamentSelect(evaluated);
      const parentB = this._tournamentSelect(evaluated);

      let child;
      if (Math.random() < this.crossoverRate) {
        child = this._crossover(parentA, parentB);
      } else {
        child = { ...parentA };
      }

      child = this._mutate(child);
      next.push(child);
    }

    return next;
  }

  /**
   * Tournament selection: pick the fittest of k random individuals.
   * @private
   */
  _tournamentSelect(population, tournamentSize = 3) {
    let best = null;
    for (let i = 0; i < tournamentSize; i++) {
      const idx = Math.floor(Math.random() * population.length);
      const candidate = population[idx];
      if (best === null || candidate.fitness > best.fitness) {
        best = candidate;
      }
    }
    return best;
  }

  /**
   * Single-point crossover between two parents.
   * @private
   */
  _crossover(parentA, parentB) {
    const child = { fitness: 0 };

    // Crossover on the plan array if both have one
    if (Array.isArray(parentA.plan) && Array.isArray(parentB.plan)) {
      const minLen = Math.min(parentA.plan.length, parentB.plan.length);
      if (minLen > 0) {
        const point = Math.floor(Math.random() * minLen);
        child.plan = [
          ...parentA.plan.slice(0, point),
          ...parentB.plan.slice(point),
        ];
      } else {
        child.plan = [...(parentA.plan || [])];
      }
    } else {
      child.plan = parentA.plan ? [...parentA.plan] : parentB.plan ? [...parentB.plan] : [];
    }

    // Merge any non-plan properties from the fitter parent
    const keys = new Set([
      ...Object.keys(parentA),
      ...Object.keys(parentB),
    ]);
    for (const key of keys) {
      if (key !== 'plan' && key !== 'fitness') {
        child[key] = parentA[key] ?? parentB[key] ?? null;
      }
    }

    return child;
  }

  /**
   * Random mutation: with probability mutationRate, introduce a small
   * random change into the individual's plan.
   * @private
   */
  _mutate(individual) {
    if (Math.random() >= this.mutationRate) {
      return individual;
    }

    const mutated = { ...individual };

    if (Array.isArray(mutated.plan) && mutated.plan.length > 0) {
      // Randomly insert, delete, or modify one step
      const operation = Math.random();
      const idx = Math.floor(Math.random() * mutated.plan.length);

      if (operation < 0.33) {
        // Insert a random placeholder step
        mutated.plan = [
          ...mutated.plan.slice(0, idx),
          `mutated_${Date.now()}`,
          ...mutated.plan.slice(idx),
        ];
      } else if (operation < 0.66 && mutated.plan.length > 1) {
        // Delete one step
        mutated.plan = mutated.plan.filter((_, i) => i !== idx);
      } else {
        // Modify one step
        mutated.plan = [...mutated.plan];
        mutated.plan[idx] = `modified_${mutated.plan[idx]}`;
      }
    }

    return mutated;
  }

  /**
   * Current generation counter (incremented on each evolve call).
   * @type {number}
   */
  get generation() {
    return this._generation;
  }
}

module.exports = { EvolutionarySearch };

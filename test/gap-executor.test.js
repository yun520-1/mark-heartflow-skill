/**
 * GapExecutor — Tests (unit only, no external network)
 */
const assert = require('assert');
const { GapExecutor } = require('../src/cortex/gap-executor.js');

// Mock search function that returns fake results instantly
const mockSearch = async (query, max) => {
  const results = [
    { title: 'Paper 1 about ' + query, summary: 'This paper explores ' + query + ' methods.', link: 'https://arxiv.org/abs/2301.001' },
    { title: 'Paper 2 about ' + query, summary: 'A new approach to ' + query + '.', link: 'https://arxiv.org/abs/2301.002' },
  ];
  return {
    success: true,
    count: results.length,
    results,
  };
};

// Mock search that always fails
const mockFailedSearch = async (query, max) => ({
  success: false, count: 0, results: [], error: 'mock failure',
});

module.exports = function ({ test }) {

  test('GapExecutor: execute with valid gap and mocked explorer', async () => {
    const executor = new GapExecutor({ searchFn: mockSearch, maxResultsPerQuery: 3 });
    const exploredResults = [];
    const mockExplorer = {
      recordExploration: (id, data) => {
        exploredResults.push({ id, data });
        return { success: true, status: 'explored' };
      },
    };
    const gap = {
      id: 'test-gap-1',
      topic: 'continual learning LLM',
      suggestedQuery: 'continual learning',
      priority: 8,
      source: 'mock',
    };

    const r = await executor.execute(gap, mockExplorer);
    assert.strictEqual(r.executed, true);
    assert.strictEqual(r.gapId, 'test-gap-1');
    assert.strictEqual(exploredResults.length, 1);
    assert.strictEqual(exploredResults[0].id, 'test-gap-1');
    assert.strictEqual(r.searchResult.success, true);
    assert.strictEqual(executor.getStats().totalExecutions, 1);
  });

  test('GapExecutor: execute without explorer still works', async () => {
    const executor = new GapExecutor({ searchFn: mockSearch });
    const gap = {
      id: 'test-gap-2',
      topic: 'transformer architecture',
      suggestedQuery: 'transformer architecture',
      priority: 5,
      source: 'test',
    };
    const r = await executor.execute(gap, null);
    assert.strictEqual(r.executed, true);
    assert.strictEqual(r.recorded, false);
  });

  test('GapExecutor: execute with null gap returns error', async () => {
    const executor = new GapExecutor();
    const r = await executor.execute(null, null);
    assert.strictEqual(r.executed, false);
  });

  test('GapExecutor: executeBatch pulls multiple gaps from explorer', async () => {
    const executor = new GapExecutor({ searchFn: mockSearch });
    const gapQueue = [
      { gap: { id: 'batch-1', topic: 'transformer', suggestedQuery: 'transformer', priority: 8, source: 't' } },
      { gap: { id: 'batch-2', topic: 'reinforcement learning', suggestedQuery: 'reinforcement learning', priority: 7, source: 't' } },
    ];
    let nextIndex = 0;
    const mockExplorer = {
      nextToExplore: () => nextIndex < gapQueue.length ? gapQueue[nextIndex++] : null,
      recordExploration: (id, data) => ({ success: true, status: 'explored' }),
    };

    const r = await executor.executeBatch(mockExplorer, 2);
    assert.strictEqual(r.executed, true);
    assert.strictEqual(r.batchSize, 2);
    assert.strictEqual(r.results.length, 2);
    assert.strictEqual(r.results[0].gapId, 'batch-1');
    assert.strictEqual(r.results[1].gapId, 'batch-2');
  });

  test('GapExecutor: stats accumulate correctly', async () => {
    const executor = new GapExecutor({ searchFn: mockSearch });
    const mockExplorer = {
      nextToExplore: () => ({ gap: { id: 's-1', topic: 'test query', suggestedQuery: 'test query', priority: 5, source: 't' } }),
      recordExploration: () => ({ success: true }),
    };

    await executor.executeBatch(mockExplorer, 3);
    const stats = executor.getStats();
    assert.strictEqual(stats.totalExecutions, 3);
    assert.strictEqual(stats.totalResults, 6);  // 3 batches × 2 results each
  });

  test('GapExecutor: records failed search results', async () => {
    const executor = new GapExecutor({ searchFn: mockFailedSearch });
    const mockExplorer = {
      recordExploration: (id, data) => {
        assert.strictEqual(data.success, false);
        return { success: true };
      },
    };
    const gap = { id: 'fail-gap', topic: 'some query', suggestedQuery: 'some query', priority: 5, source: 't' };
    const r = await executor.execute(gap, mockExplorer);
    assert.strictEqual(r.executed, true);
    assert.strictEqual(r.searchResult.success, false);
  });
};

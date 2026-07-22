const { classifyError, ErrorCategory, ExecutionStatus, RetryStrategy } = require('../src/core/embodied-core.js');

describe('embodied-core', () => {
  test('classifyError: returns category', () => {
    const r = classifyError(new Error('test'));
    expect(r).toHaveProperty('category');
    expect(Object.values(ErrorCategory)).toContain(r.category);
  });
  test('classifyError: timeout detected', () => {
    const r = classifyError(new Error('timeout'));
    expect(r.category).toBe(ErrorCategory.TIMEOUT_ERROR);
    expect(r.recoverable).toBe(true);
  });
  test('classifyError: unknown error defaults to EXECUTION_ERROR', () => {
    const r = classifyError(new Error('random'));
    expect(r.category).toBe(ErrorCategory.EXECUTION_ERROR);
  });
  test('ExecutionStatus enum exists', () => {
    expect(ExecutionStatus).toBeDefined();
    expect(ExecutionStatus.SUCCESS).toBe('success');
  });
  test('RetryStrategy enum exists', () => {
    expect(RetryStrategy).toBeDefined();
    expect(RetryStrategy.BACKOFF).toBe('backoff');
  });
});

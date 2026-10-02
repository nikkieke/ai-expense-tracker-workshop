import process from 'node:process';
import {
  calculateBackoffWithJitter,
  withTimeout,
  isRetryableError,
  withRetry,
} from '../utils/resilience.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${testName}${detail ? ` - ${detail}` : ''}`);
    failed++;
  }
}

async function runResilienceTests() {
  console.log('🧪 Starting Resilience & Timeout Unit Tests...\n');

  // 1. Backoff and Jitter Tests
  {
    const delay0 = calculateBackoffWithJitter(0, 1000, 8000);
    assert(delay0 >= 500 && delay0 <= 1000, 'Attempt 0 delay is within [500ms, 1000ms]');

    const delay1 = calculateBackoffWithJitter(1, 1000, 8000);
    assert(delay1 >= 1000 && delay1 <= 2000, 'Attempt 1 delay is within [1000ms, 2000ms]');

    const delayMax = calculateBackoffWithJitter(10, 1000, 8000);
    assert(delayMax >= 4000 && delayMax <= 8000, 'Ceiling capped at maxDelayMs (8000ms)');
  }

  // 2. Retryable Error Detection Tests
  {
    assert(isRetryableError(new Error('Resource has been exhausted (rate limit 429)')), 'Identifies 429 rate limit as retryable');
    assert(isRetryableError(new Error('Service Unavailable 503')), 'Identifies 503 error as retryable');
    assert(isRetryableError({ name: 'TimeoutError', message: 'Operation timed out' }), 'Identifies TimeoutError as retryable');
    assert(isRetryableError(new Error('connect ETIMEDOUT')), 'Identifies socket ETIMEDOUT as retryable');
    assert(!isRetryableError(new Error('Invalid image format (HTTP 400)')), 'Identifies 400 Bad Request as NON-retryable');
    assert(!isRetryableError(new Error('Unauthorized (HTTP 401)')), 'Identifies 401 Unauthorized as NON-retryable');
  }

  // 3. Timeout Wrapper Tests
  {
    const fastPromise = new Promise((resolve) => setTimeout(() => resolve('OK'), 50));
    const result = await withTimeout(fastPromise, 300, 'Fast Op');
    assert(result === 'OK', 'Resolves successfully when promise completes before timeout');

    let timeoutThrown = false;
    try {
      const slowPromise = new Promise((resolve) => setTimeout(() => resolve('SLOW'), 300));
      await withTimeout(slowPromise, 50, 'Slow Op');
    } catch (err: any) {
      timeoutThrown = err.name === 'TimeoutError' || err.message.includes('timed out');
    }
    assert(timeoutThrown, 'Rejects with TimeoutError when execution exceeds timeoutMs');
  }

  // 4. Retry Engine Tests
  {
    let attempts = 0;
    const flakeyFn = async () => {
      attempts++;
      if (attempts < 3) {
        const err: any = new Error('503 Service Unavailable');
        err.status = 503;
        throw err;
      }
      return 'RECOVERED';
    };

    const retryResult = await withRetry(flakeyFn, {
      maxRetries: 3,
      initialDelayMs: 20,
      maxDelayMs: 100,
      operationName: 'Flakey Service',
    });

    assert(retryResult === 'RECOVERED' && attempts === 3, 'Retries on transient errors and recovers');

    let nonRetryableAttempts = 0;
    let nonRetryableFailed = false;
    try {
      await withRetry(
        async () => {
          nonRetryableAttempts++;
          throw new Error('Invalid image base64 (400)');
        },
        {
          maxRetries: 3,
          initialDelayMs: 20,
          operationName: 'Fatal Service',
        }
      );
    } catch {
      nonRetryableFailed = true;
    }

    assert(
      nonRetryableFailed && nonRetryableAttempts === 1,
      'Does not waste retries on non-retryable 400 errors'
    );
  }

  console.log(`\n========================================`);
  console.log(`Resilience Tests: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runResilienceTests();

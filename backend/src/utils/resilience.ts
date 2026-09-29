export interface RetryOptions {
  maxRetries?: number;
  timeoutMs?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  operationName?: string;
  shouldRetry?: (error: any) => boolean;
  onRetry?: (error: any, attempt: number, delayMs: number) => void;
}

/**
 * Calculates exponential backoff with full jitter to prevent thundering herd spikes.
 * Delay formula: min(maxDelay, baseDelay * 2^attempt) with 50-100% randomization.
 */
export function calculateBackoffWithJitter(
  attempt: number,
  baseDelayMs: number = 1000,
  maxDelayMs: number = 8000
): number {
  const exponentialDelay = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt));
  const minDelay = exponentialDelay * 0.5;
  const jitter = Math.random() * (exponentialDelay - minDelay);
  return Math.floor(minDelay + jitter);
}

/**
 * Pauses execution for a specified number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wraps an asynchronous operation with a strict timeout boundary.
 * If the promise does not settle within timeoutMs, it rejects with a TimeoutError.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 15000,
  operationName: string = 'Operation'
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;

  // Prevent unhandled promise rejections if the underlying promise rejects after timeout
  promise.catch(() => {});

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error(`${operationName} timed out after ${timeoutMs}ms`);
      error.name = 'TimeoutError';
      reject(error);
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

/**
 * Determines whether an error is transient and safe to retry.
 */
export function isRetryableError(error: any): boolean {
  if (!error) return false;

  // Timeout errors are retryable
  if (error.name === 'TimeoutError' || error.message?.includes('timed out')) {
    return true;
  }

  const message = String(error.message || '').toLowerCase();
  const status = error.status || error.statusCode || error.httpStatus;

  // Rate limits (429) & Server errors (500, 502, 503, 504)
  if (status === 429 || (status >= 500 && status <= 504)) {
    return true;
  }

  // Common transient / network error keywords
  const retryableKeywords = [
    'rate limit',
    'resource_exhausted',
    'quota',
    'overloaded',
    'service unavailable',
    'econnreset',
    'etimedout',
    'econnrefused',
    'enotfound',
    'socket hang up',
    'fetch failed',
    '503',
    '429',
  ];

  return retryableKeywords.some((keyword) => message.includes(keyword));
}

/**
 * Executes an async task with configurable retries, jittered exponential backoff, and timeouts.
 */
export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 2,
    timeoutMs,
    initialDelayMs = 1000,
    maxDelayMs = 8000,
    operationName = 'Operation',
    shouldRetry = isRetryableError,
    onRetry,
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const executeFn = fn(attempt);
      if (timeoutMs && timeoutMs > 0) {
        return await withTimeout(executeFn, timeoutMs, `${operationName} (Attempt ${attempt + 1})`);
      }
      return await executeFn;
    } catch (error: any) {
      lastError = error;

      const isLastAttempt = attempt === maxRetries;
      const canRetry = shouldRetry(error);

      if (isLastAttempt || !canRetry) {
        throw error;
      }

      const delayMs = calculateBackoffWithJitter(attempt, initialDelayMs, maxDelayMs);

      if (onRetry) {
        onRetry(error, attempt, delayMs);
      } else {
        console.warn(
          `⚠️ [${operationName}] Attempt ${attempt + 1} failed (${error.message}). Retrying in ${delayMs}ms...`
        );
      }

      await sleep(delayMs);
    }
  }

  throw lastError;
}

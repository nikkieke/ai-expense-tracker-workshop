export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  timeoutMs?: number;
  operationName?: string;
  shouldRetry?: (error: any) => boolean;
  onRetry?: (error: any, attempt: number, delayMs: number) => void;
}

/**
 * Calculates exponential backoff delay with full jitter.
 */
export function calculateBackoffWithJitter(
  attempt: number,
  initialDelayMs: number = 1000,
  maxDelayMs: number = 8000,
  backoffFactor: number = 2
): number {
  const calculated = initialDelayMs * Math.pow(backoffFactor, attempt);
  const ceiling = Math.min(calculated, maxDelayMs);
  const jitter = Math.random() * 0.5 + 0.5; // Jitter between 50% and 100% of ceiling
  return Math.floor(ceiling * jitter);
}

/**
 * Wraps a promise with an enforced timeout.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 15000,
  operationName: string = 'Operation'
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      const error = new Error(`${operationName} timed out after ${timeoutMs}ms`);
      error.name = 'TimeoutError';
      reject(error);
    }, timeoutMs);
  });

  return Promise.race([
    promise.then((res) => {
      clearTimeout(timeoutId);
      return res;
    }),
    timeoutPromise,
  ]);
}

/**
 * Determines whether an error is transient and retryable.
 */
export function isRetryableError(error: any): boolean {
  if (!error) return false;

  if (error.name === 'TimeoutError' || error.message?.includes('timed out')) {
    return true;
  }

  const status = error.status || error.statusCode || error.httpStatusCode || error.code;
  if ([429, 500, 502, 503, 504].includes(status)) {
    return true;
  }

  const message = (error.message || '').toLowerCase();
  const transientPatterns = [
    'rate limit',
    'resource has been exhausted',
    'quota',
    'timeout',
    'timed out',
    'econnreset',
    'etimedout',
    'econnrefused',
    'unavailable',
    'overloaded',
    'deadline exceeded',
    'try again',
    'temporary',
    '503',
    '429',
  ];

  return transientPatterns.some((pattern) => message.includes(pattern));
}

/**
 * Executes an async operation with exponential backoff retries, jitter, and optional timeout.
 */
export async function withRetry<T>(
  fn: (attempt?: number) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 2,
    initialDelayMs = 1000,
    maxDelayMs = 8000,
    backoffFactor = 2,
    timeoutMs,
    operationName = 'Operation',
    shouldRetry = isRetryableError,
    onRetry,
  } = options;
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const execPromise = fn(attempt);
      if (timeoutMs && timeoutMs > 0) {
        return await withTimeout(execPromise, timeoutMs, `${operationName} (attempt ${attempt + 1})`);
      }
      return await execPromise;
    } catch (error: any) {
      lastError = error;

      if (attempt === maxRetries) {
        break;
      }

      if (!shouldRetry(error)) {
        throw error;
      }

      const delay = calculateBackoffWithJitter(
        attempt,
        initialDelayMs,
        maxDelayMs,
        backoffFactor
      );

      if (onRetry) {
        onRetry(error, attempt, delay);
      } else {
        console.warn(
          `⚠️ [${operationName}] Transient failure on attempt ${attempt + 1}/${maxRetries + 1} (${error.message}). Retrying in ${delay}ms...`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

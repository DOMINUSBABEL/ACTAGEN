
/**
 * Run multiple promise-returning & async functions with limited concurrency.
 *
 * @param concurrency The maximum number of concurrent executions.
 * @returns A function that accepts a promise-returning function and returns the result of the promise.
 */
export const pLimit = (concurrency: number) => {
  const queue: (() => void)[] = [];
  let activeCount = 0;

  const next = () => {
    activeCount--;
    if (queue.length > 0) {
      const job = queue.shift();
      job!();
    }
  };

  const run = async <T>(fn: () => Promise<T>): Promise<T> => {
    const enqueue = () => new Promise<void>(resolve => {
      queue.push(resolve);
    });

    if (activeCount >= concurrency) {
      await enqueue();
    }

    activeCount++;
    try {
      return await fn();
    } finally {
      next();
    }
  };

  return run;
};

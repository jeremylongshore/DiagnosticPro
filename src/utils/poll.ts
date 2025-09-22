/**
 * Generic polling utility for async operations
 */

/**
 * Poll a function until a condition is met
 * @param fn Function to poll
 * @param stop Function that returns true when polling should stop
 * @param intervalMs Interval between polls in milliseconds (default: 5000)
 * @param max Maximum number of attempts (default: 60)
 * @returns Promise that resolves with the final value or throws on timeout
 */
export async function poll<T>(
  fn: () => Promise<T>,
  stop: (value: T) => boolean,
  intervalMs: number = 5000,
  max: number = 60
): Promise<T> {
  let tries = 0;

  while (tries++ < max) {
    const value = await fn();

    if (stop(value)) {
      return value;
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Polling timeout after ${max} attempts`);
}
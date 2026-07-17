export class RetryService {
  public async execute<T>(
    operation: () => Promise<T>,
    retries = 1,
    delayMs = 2000,
    shouldRetry?: (error: unknown) => boolean,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt === retries) {
          break;
        }

        if (shouldRetry && !shouldRetry(error)) {
          break;
        }

        await this.delay(delayMs);
      }
    }

    throw lastError;
  }

  private async delay(ms: number): Promise<void> {
    await new Promise((res) => setTimeout(res, ms));
  }
}

export const retryService = new RetryService();

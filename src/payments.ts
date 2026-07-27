export type CaptureResult = { captured: boolean; attempts: number };

export const MAX_ATTEMPTS = 3;

export const RETRY_BACKOFF_MS = 250;

export class GatewayError extends Error {
  constructor(
    message: string,
    public readonly retryable: boolean,
  ) {
    super(message);
    this.name = "GatewayError";
  }
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** Charges the card. Retries only errors the gateway marked retryable. */
export async function capturePayment(
  amountCents: number,
  currency: string,
  idempotencyKey: string,
  send: (amountCents: number, currency: string, key: string) => Promise<void>,
): Promise<CaptureResult> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      await send(amountCents, currency, idempotencyKey);
      return { captured: true, attempts: attempt };
    } catch (error) {
      lastError = error;
      if (!(error instanceof GatewayError) || !error.retryable) throw error;
      if (attempt < MAX_ATTEMPTS) await sleep(RETRY_BACKOFF_MS);
    }
  }

  throw lastError;
}

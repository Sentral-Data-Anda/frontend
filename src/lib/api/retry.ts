import { FetchError } from "./fetcher";

export const isQueryRetryable = (
  failureCount: number,
  error: unknown,
): boolean => !(error instanceof FetchError) && failureCount < 2;

import { FetchError } from "./fetcher";

export const shouldRetryQuery = (
  failureCount: number,
  error: unknown,
): boolean => !(error instanceof FetchError) && failureCount < 2;

const SENSITIVE_HEADERS = new Set([
  "authorization",
  "proxy-authorization",
  "cookie",
  "set-cookie",
  "x-nonce",
  "x-api-key",
]);

const SAFE_HEADERS = new Set([
  "user-agent",
  "accept-language",
  "content-type",
  "x-forwarded-proto",
]);

export type RedactedHeaders = Record<string, string>;

export function redactHeaders(
  headers: Record<string, string | string[] | undefined>,
): RedactedHeaders {
  const result: RedactedHeaders = {};

  for (const [rawName, rawValue] of Object.entries(headers)) {
    const name = rawName.toLowerCase();

    if (SENSITIVE_HEADERS.has(name)) {
      result[name] = "[redacted]";
      continue;
    }

    if (!SAFE_HEADERS.has(name) || rawValue === undefined) {
      continue;
    }

    result[name] = Array.isArray(rawValue) ? rawValue.join(", ") : rawValue;
  }

  return result;
}

export function redactPath(path: string): string {
  const cut = path.search(/[?#]/);
  return cut === -1 ? path : path.slice(0, cut);
}

export const MAX_MESSAGE_LENGTH = 500;

export function truncate(
  value: string,
  max: number = MAX_MESSAGE_LENGTH,
): string {
  return value.length <= max ? value : `${value.slice(0, max)}…[dipotong]`;
}

export type RedactedError = {
  name: string;
  message: string;
  digest?: string;
};

export function redactError(error: unknown): RedactedError {
  if (error instanceof Error) {
    const digest = (error as Error & { digest?: string }).digest;

    return {
      name: error.name,
      message: truncate(error.message),
      ...(digest ? { digest } : {}),
    };
  }

  return { name: "UnknownError", message: truncate(String(error)) };
}

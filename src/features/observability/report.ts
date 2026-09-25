export type ClientErrorReport = {
  kind: "error" | "unhandledrejection";
  name: string;
  message: string;
  digest?: string;
  path?: string;
};

export const REPORT_ENDPOINT = "/api/observability";

const MAX_MESSAGE_LENGTH = 1_000;

export function toReport(
  kind: ClientErrorReport["kind"],
  value: unknown,
  pathname: string,
): ClientErrorReport {
  if (value instanceof Error) {
    const digest = (value as Error & { digest?: string }).digest;

    return {
      kind,
      name: value.name,
      message: value.message.slice(0, MAX_MESSAGE_LENGTH),
      ...(digest ? { digest } : {}),
      path: pathname,
    };
  }

  return {
    kind,
    name: "UnknownError",
    message: String(value).slice(0, MAX_MESSAGE_LENGTH),
    path: pathname,
  };
}

export function sendReport(report: ClientErrorReport): void {
  const body = JSON.stringify(report);

  try {
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon(REPORT_ENDPOINT, blob)) {
        return;
      }
    }

    void fetch(REPORT_ENDPOINT, {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Pelaporan galat tidak boleh melempar galat baru.
  }
}

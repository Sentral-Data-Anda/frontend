import { sendReport, toReport } from "@/features/observability/report";

export function installErrorListeners(target: Window = window): () => void {
  const onError = (event: ErrorEvent) => {
    sendReport(
      toReport("error", event.error ?? event.message, target.location.pathname),
    );
  };

  const onRejection = (event: PromiseRejectionEvent) => {
    sendReport(
      toReport("unhandledrejection", event.reason, target.location.pathname),
    );
  };

  target.addEventListener("error", onError);
  target.addEventListener("unhandledrejection", onRejection);

  return () => {
    target.removeEventListener("error", onError);
    target.removeEventListener("unhandledrejection", onRejection);
  };
}

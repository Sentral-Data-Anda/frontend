const PROBE_ORIGIN = "http://sada.invalid";

export function isSafeRedirectPath(
  value: string | null | undefined,
): value is string {
  if (!value) return false;
  if (!value.startsWith("/")) return false;

  if (/[\x00-\x1f\x7f]/.test(value)) return false;

  let resolved: URL;
  try {
    resolved = new URL(value, PROBE_ORIGIN);
  } catch {
    return false;
  }

  return resolved.origin === PROBE_ORIGIN;
}

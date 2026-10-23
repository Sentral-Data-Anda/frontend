export const MEDIA_PREFIX = "/media";

export const toMediaTarget = (
  requestUrl: URL,
  upstream: string | undefined,
): URL | null => {
  if (!upstream) return null;
  if (!requestUrl.pathname.startsWith(`${MEDIA_PREFIX}/`)) return null;
  if (!requestUrl.searchParams.has("X-Amz-Signature")) return null;

  const { origin } = new URL(upstream);
  const key = requestUrl.pathname.slice(MEDIA_PREFIX.length);
  const target = new URL(`${origin}${key}${requestUrl.search}`);

  // Kunci berawalan "//" tidak boleh menggeser host tujuan.
  return target.origin === origin ? target : null;
};

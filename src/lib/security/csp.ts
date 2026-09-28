type CspOptions = {
  nonce: string;
  isDev: boolean;
  mediaOrigin?: string;
};

export const toMediaSource = (value: string | undefined): string => {
  if (!value) return "";

  try {
    const { origin, protocol } = new URL(value);

    return protocol === "https:" || protocol === "http:" ? ` ${origin}` : "";
  } catch {
    return "";
  }
};

export function buildContentSecurityPolicy({
  nonce,
  isDev,
  mediaOrigin,
}: CspOptions): string {
  const directives = [
    `default-src 'self'`,

    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,

    `style-src 'self' 'unsafe-inline'`,

    `img-src 'self' blob: data:${toMediaSource(mediaOrigin)}`,

    `font-src 'self'`,

    `connect-src 'self'`,

    `worker-src 'self'`,
    `manifest-src 'self'`,

    `object-src 'none'`,

    `base-uri 'self'`,

    `form-action 'self'`,

    `frame-ancestors ${isDev ? "'self'" : "'none'"}`,

    // Di development media dev:mock ada di http://localhost port lain; upgrade memutusnya.
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ];

  return directives.join("; ");
}

export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

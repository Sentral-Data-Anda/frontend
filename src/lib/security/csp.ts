type CspOptions = {
  nonce: string;
  isDev: boolean;
};

export function buildContentSecurityPolicy({
  nonce,
  isDev,
}: CspOptions): string {
  const directives = [
    `default-src 'self'`,

    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,

    `style-src 'self' 'unsafe-inline'`,

    `img-src 'self' blob: data:`,

    `font-src 'self'`,

    `connect-src 'self'`,

    `worker-src 'self'`,
    `manifest-src 'self'`,

    `object-src 'none'`,

    `base-uri 'self'`,

    `form-action 'self'`,

    `frame-ancestors ${isDev ? "'self'" : "'none'"}`,

    `upgrade-insecure-requests`,
  ];

  return directives.join("; ");
}

export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

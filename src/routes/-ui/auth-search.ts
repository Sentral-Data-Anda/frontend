export type AuthSearch = { redirect?: string; reason?: string };

export const validateAuthSearch = (
  search: Record<string, unknown>,
): AuthSearch => ({
  redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  reason: typeof search.reason === "string" ? search.reason : undefined,
});

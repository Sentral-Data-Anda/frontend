/** Satu nilai cookie dari header `Cookie` atau `document.cookie`. */
export function readCookie(
  header: string | null | undefined,
  name: string,
): string | undefined {
  if (!header) return undefined;

  for (const part of header.split(";")) {
    const separator = part.indexOf("=");

    if (separator === -1) continue;

    if (part.slice(0, separator).trim() === name) {
      return part.slice(separator + 1).trim();
    }
  }

  return undefined;
}

// Hanya cookie yang bukan httpOnly (sidebar, tampilan beranda) yang terbaca.
export const readDocumentCookie = (name: string): string | undefined =>
  typeof document === "undefined"
    ? undefined
    : readCookie(document.cookie, name);

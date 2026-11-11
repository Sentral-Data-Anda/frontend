type SearchValue = string | string[];

/**
 * Query string URL dibaca dan ditulis apa adanya, seperti `URLSearchParams`.
 * Bawaan TanStack Router menulis JSON (`?page=%221%22`), yang memecah
 * use-list-params, list-return, dan tautan yang sudah disimpan pengguna.
 */
export function parseSearch(searchStr: string): Record<string, SearchValue> {
  const search: Record<string, SearchValue> = {};

  for (const [key, value] of new URLSearchParams(searchStr)) {
    const existing = search[key];

    if (existing === undefined) search[key] = value;
    else
      search[key] = [
        ...(Array.isArray(existing) ? existing : [existing]),
        value,
      ];
  }

  return search;
}

export function stringifySearch(search: Record<string, unknown>): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(search)) {
    if (value === undefined || value === null) continue;

    for (const item of Array.isArray(value) ? value : [value]) {
      params.append(
        key,
        typeof item === "object" ? JSON.stringify(item) : String(item),
      );
    }
  }

  const query = params.toString();

  return query ? `?${query}` : "";
}

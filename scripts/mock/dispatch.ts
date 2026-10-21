import { MOCK_HANDLERS } from "./handlers";
import type { MockContext } from "./kit";

// Handler mock mencari baris lewat kode; bila 404, daftar resource yang sama
// ditanya baris mana pemilik `publicId` itu, lalu permintaan diulang dengan kodenya.

const first = async (context: MockContext) => {
  for (const handle of MOCK_HANDLERS) {
    const response = await handle(context);
    if (response) return response;
  }

  return null;
};

const withPath = (context: MockContext, path: string): MockContext => {
  const url = new URL(context.url);
  url.pathname = `/api/v1${path}`;

  return { ...context, url, path, request: context.request.clone() };
};

type Row = { publicId?: unknown; code?: unknown; id?: unknown };

// Kunci pencarian handler: kode, atau id angka.
const keyOf = (row: Row) =>
  typeof row.code === "string" && row.code
    ? row.code
    : typeof row.id === "number"
      ? String(row.id)
      : null;

const resolve = async (context: MockContext) => {
  const segments = context.path.split("/").filter(Boolean);

  // `/resource/<key>` or `/resource/<key>/action`: the key is never first.
  for (let index = 1; index < segments.length; index++) {
    const listPath = `/${segments.slice(0, index).join("/")}`;
    const url = new URL(context.url);
    url.pathname = `/api/v1${listPath}`;
    url.search = "?page=1&limit=all";

    const list = await first({
      ...context,
      url,
      path: listPath,
      method: "GET",
      request: new Request(url),
    });

    if (list?.status !== 200) continue;

    const rows = ((await list.json()) as { data?: unknown }).data;
    if (!Array.isArray(rows)) continue;

    const row = (rows as Row[]).find(
      (candidate) => candidate.publicId === segments[index],
    );
    const key = row ? keyOf(row) : null;
    if (!key) continue;

    const rewritten = [...segments];
    rewritten[index] = encodeURIComponent(key);

    return withPath(context, `/${rewritten.join("/")}`);
  }

  return null;
};

export const dispatch = async (
  context: MockContext,
): Promise<Response | null> => {
  // A body can be read once, and the first pass may spend it.
  const retry = context.request.clone();
  const response = await first(context);

  if (response && response.status !== 404) return response;

  const rewritten = await resolve({ ...context, request: retry });
  if (!rewritten) return response;

  return (await first(rewritten)) ?? response;
};

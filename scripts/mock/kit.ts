import type { MenuSlug } from "../../src/config/menu";
import type { MenuAction } from "../../src/types/menu";

export type MockAction = MenuAction;

export type MockContext = {
  request: Request;
  url: URL;
  path: string;
  method: string;
  can: (slug: MenuSlug, action: MockAction) => boolean;
};

// Kembalikan null bila path bukan milik handler ini.
export type MockHandler = (
  context: MockContext,
) => Response | null | Promise<Response | null>;

export const json = (body: unknown, status = 200, cookies: string[] = []) => {
  const headers = new Headers({ "content-type": "application/json" });
  for (const cookie of cookies) headers.append("set-cookie", cookie);
  return new Response(JSON.stringify(body), { status, headers });
};

export const denied = () =>
  json(
    { status: 403, error: "Access denied: You do not have permission" },
    403,
  );

// Sama dengan parsePagination be-sada: bawaan 10, maks 100.
export const paging = (url: URL) => {
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("limit")) || 10),
  );
  return { page, limit };
};

// Daftar berpaginasi be-sada; kosong = 404 "<X> Tidak Ditemukan".
export const list = (
  rows: unknown[],
  url: URL,
  okName: string,
  emptyName: string,
  message = `Berhasil Mendapatkan Semua ${okName}`,
) => {
  if (rows.length === 0 || process.env.MOCK_EMPTY) {
    return json({ status: 404, error: `${emptyName} Tidak Ditemukan` }, 404);
  }
  const { page, limit } = paging(url);
  return json({
    status: 200,
    message,
    totalData: rows.length,
    totalPage: Math.ceil(rows.length / limit),
    data: rows.slice((page - 1) * limit, page * limit),
  });
};

export const readBody = async <T>(request: Request): Promise<T> =>
  (await request.json()) as T;

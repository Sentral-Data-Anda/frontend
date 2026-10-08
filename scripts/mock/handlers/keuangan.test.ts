import { describe, expect, test } from "bun:test";

import { MENU, type MenuSlug } from "../../../src/config/menu";
import { todayJakarta } from "../../../src/lib/date";
import type { MockAction, MockHandler } from "../kit";

import { jurnalMock } from "./jurnal";
import { keuanganMock } from "./keuangan";
import { periodeFiskalMock } from "./periode-fiskal";

type Json = {
  status: number;
  error?: string;
  totalData?: number;
  data?: unknown;
};

const onCall = async (
  handler: MockHandler,
  input: string,
  can: (slug: MenuSlug, action: MockAction) => boolean = () => true,
) => {
  const url = new URL(`/api/v1${input}`, "http://mock.test");
  const response = await handler({
    request: new Request(url),
    url,
    path: input.split("?")[0] ?? "",
    method: "GET",
    can,
    isAdmin: true,
    sessionCode: "test",
  });

  if (!response) return null;

  return { status: response.status, body: (await response.json()) as Json };
};

// Widget "Kesiapan tutup buku" membaca keempat kunci ini; memindahkan endpoint
// dari dev-mock tidak boleh mengubahnya.
describe("kontrak Beranda tetap sesudah pindah dari dev-mock", () => {
  test("periode fiskal membawa year, month, label, status", async () => {
    const result = await onCall(periodeFiskalMock, "/periode-fiskal?limit=24");
    const rows = result?.body.data as Record<string, unknown>[];

    expect(result?.status).toBe(200);
    expect(result?.body.totalData).toBe(12);
    expect(Object.keys(rows[0] ?? {})).toEqual(
      expect.arrayContaining(["year", "month", "label", "status"]),
    );
    expect(rows[0]?.label).toBe(`Januari ${todayJakarta().slice(0, 4)}`);
    expect(["OPEN", "CLOSED"]).toContain(rows[0]?.status as string);
  });

  test("jurnal draf menjawab totalData yang dibaca widget", async () => {
    const result = await onCall(jurnalMock, "/jurnal?status=DRAFT&limit=1");

    expect(result?.status).toBe(200);
    expect(result?.body.totalData).toBe(2);
    expect((result?.body.data as unknown[]).length).toBe(1);
  });
});

describe("mock /periode-fiskal", () => {
  test("saring tahun dan status", async () => {
    const open = await onCall(periodeFiskalMock, "/periode-fiskal?status=OPEN");
    const rows = open?.body.data as { status: string }[];

    expect(rows.every((row) => row.status === "OPEN")).toBe(true);

    const none = await onCall(periodeFiskalMock, "/periode-fiskal?year=1999");
    expect(none?.status).toBe(404);
  });

  test("tanpa VIEW ditolak", async () => {
    const result = await onCall(
      periodeFiskalMock,
      "/periode-fiskal",
      (slug) => slug !== MENU.PERIODE_FISKAL,
    );

    expect(result?.status).toBe(403);
  });
});

describe("mock /jurnal", () => {
  test("detail membawa baris dengan akun", async () => {
    const list = await onCall(jurnalMock, "/jurnal");
    const first = (list?.body.data as { publicId: string }[])[0];
    const detail = await onCall(jurnalMock, `/jurnal/${first?.publicId}`);
    const entry = detail?.body.data as {
      lines: { account: { code: string } | null }[];
    };

    expect(detail?.status).toBe(200);
    expect(entry.lines.length).toBeGreaterThan(0);
    expect(entry.lines[0]?.account?.code).toBeDefined();
  });

  test("entri pembalik bertaut dua arah", async () => {
    const list = await onCall(jurnalMock, "/jurnal?status=REVERSED");
    const reversed = (
      list?.body.data as { code: string; reversedBy: unknown }[]
    )[0];

    expect(reversed?.reversedBy).not.toBeNull();
  });

  test("daftar tidak membawa baris", async () => {
    const list = await onCall(jurnalMock, "/jurnal");
    const row = (list?.body.data as Record<string, unknown>[])[0];

    expect(row?.lines).toBeUndefined();
    expect(row?.lineCount).toBeDefined();
  });
});

describe("mock /ddl keuangan", () => {
  test("akun disaring per tipe dan menyembunyikan yang terhapus", async () => {
    const all = await onCall(keuanganMock, "/ddl/account");
    const asset = await onCall(keuanganMock, "/ddl/account?type=ASSET");
    const rows = asset?.body.data as { type: string; code: string }[];

    expect((all?.body.data as unknown[]).length).toBe(29);
    expect(rows.every((row) => row.type === "ASSET")).toBe(true);
    expect(rows.some((row) => row.code === "5-910")).toBe(false);
  });

  test("tipe persembahan hanya yang aktif", async () => {
    const result = await onCall(keuanganMock, "/ddl/tipe-persembahan");
    const rows = result?.body.data as { name: string }[];

    expect(rows.some((row) => row.name === "Kolekte")).toBe(true);
  });

  test("tanpa satu pun menu pemegang: ditolak", async () => {
    const result = await onCall(keuanganMock, "/ddl/account", () => false);

    expect(result?.status).toBe(403);
  });

  test("path ddl asing dilewatkan", async () => {
    expect(await onCall(keuanganMock, "/ddl/entah")).toBeNull();
  });
});

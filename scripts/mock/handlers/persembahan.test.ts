import { describe, expect, test } from "bun:test";

import { MENU, type MenuSlug } from "../../../src/config/menu";
import { PERSEMBAHAN } from "../keuangan-store";
import type { MockAction, MockHandler } from "../kit";

import { persembahanMock } from "./persembahan";

const call = (
  path: string,
  granted: MenuSlug[],
  init: RequestInit = {},
  search = "",
) => {
  const url = new URL(`http://localhost${path}${search}`);

  return persembahanMock({
    request: new Request(url, init),
    url,
    path,
    method: init.method ?? "GET",
    can: (slug: MenuSlug, _action: MockAction) => granted.includes(slug),
    isAdmin: false,
    sessionCode: "U-0001",
  }) as ReturnType<MockHandler>;
};

type Body = {
  error?: string;
  code?: string;
  message?: string;
  totalAmount?: string;
  issues?: { path: string; message: string }[];
  data?: unknown;
};

const bodyOf = async (
  response: Awaited<ReturnType<MockHandler>>,
): Promise<Body> => (await (response as Response).json()) as Body;

const batch = (items: unknown[], extra: Record<string, unknown> = {}) =>
  call("/persembahan/batch", [MENU.PERSEMBAHAN], {
    method: "POST",
    body: JSON.stringify({
      receivedDate: PERSEMBAHAN[0]?.receivedDate,
      receiveMethod: "TUNAI",
      items,
      ...extra,
    }),
  });

describe("kepemilikan path", () => {
  test("path lain bukan miliknya", async () => {
    expect(await call("/jurnal", [MENU.PERSEMBAHAN])).toBeNull();
    expect(await call("/persembahan/saya", [MENU.PERSEMBAHAN])).toBeNull();
  });
});

describe("gerbang izin", () => {
  test("daftar butuh VIEW", async () => {
    expect((await call("/persembahan", []))?.status).toBe(403);
    expect((await call("/persembahan", [MENU.PERSEMBAHAN]))?.status).toBe(200);
  });

  test("catat butuh CREATE, dan void ada di bawah DELETE", async () => {
    expect((await batch([]))?.status).not.toBe(403);
    expect(
      (
        await call("/persembahan/PSB/void", [], {
          method: "POST",
          body: "{}",
        })
      )?.status,
    ).toBe(403);
  });
});

describe("batch atomik", () => {
  test("satu baris ditolak: 400 dengan seluruh issues, tanpa satu pun ditulis", async () => {
    const before = PERSEMBAHAN.length;
    const response = await batch([
      { typePersembahanId: 1, amount: 50000 },
      { typePersembahanId: 2, amount: 75000 },
    ]);
    const body = await bodyOf(response);

    expect(response?.status).toBe(400);
    expect(body.issues).toEqual([
      {
        path: "items.1.jemaatId",
        message: "Tipe Persembahan Perpuluhan Wajib Menunjuk Jemaat",
      },
    ]);
    expect(PERSEMBAHAN).toHaveLength(before);
  });

  test("tipe berperiode tanpa periode ditolak di baris itu", async () => {
    const body = await bodyOf(
      await batch([{ typePersembahanId: 3, jemaatId: 1, amount: 1000 }]),
    );

    expect(body.issues).toEqual([
      {
        path: "items.0.period",
        message: "Tipe Persembahan Persembahan Bulanan Wajib Mengisi Periode",
      },
    ]);
  });

  test("nominal nol ditolak", async () => {
    const body = await bodyOf(
      await batch([{ typePersembahanId: 1, amount: 0 }]),
    );

    expect(body.issues).toEqual([
      { path: "items.0.amount", message: "Nominal Harus Lebih Dari 0" },
    ]);
  });

  test("pembayaran online di badan ditolak", async () => {
    const response = await batch([{ typePersembahanId: 1, amount: 1000 }], {
      receiveMethod: "PAYMENT_GATEWAY",
    });

    expect(response?.status).toBe(400);
    expect((await bodyOf(response)).error).toBe(
      "Cara Terima Harus Tunai Atau Transfer",
    );
  });

  test("bulan tanpa periode fiskal ditolak dengan code, bukan hanya kalimat", async () => {
    const response = await batch([{ typePersembahanId: 1, amount: 1000 }], {
      receivedDate: "2019-01-02",
    });

    expect((await bodyOf(response)).code).toBe("PERIOD_NOT_OPEN");
  });

  test("batch sah menulis seluruh baris sekali, dengan satu kode per baris", async () => {
    const before = PERSEMBAHAN.length;
    const response = await batch([
      { typePersembahanId: 1, amount: 1000, donorName: "  Budi   Santoso " },
      { typePersembahanId: 1, amount: 2000 },
    ]);
    const body = await bodyOf(response);
    const saved = body.data as { code: string; donorName: string }[];

    expect(response?.status).toBe(201);
    expect(body.message).toBe("Berhasil Mencatat 2 Persembahan");
    expect(PERSEMBAHAN).toHaveLength(before + 2);
    expect(new Set(saved.map((item) => item.code)).size).toBe(2);
    expect(saved[0]?.donorName).toBe("Budi Santoso");
  });
});

describe("void", () => {
  test("alasan wajib", async () => {
    const target = PERSEMBAHAN.find((item) => item.status === "ACTIVE");
    const response = await call(
      `/persembahan/${target?.code}/void`,
      [MENU.PERSEMBAHAN],
      { method: "POST", body: "{}" },
    );

    expect(response?.status).toBe(400);
    expect((await bodyOf(response)).issues).toEqual([
      { path: "voidReason", message: "Alasan Pembatalan Wajib Diisi" },
    ]);
  });

  test("yang sudah VOID tidak bisa dibatalkan lagi", async () => {
    const target = PERSEMBAHAN.find((item) => item.status === "VOID");
    const response = await call(
      `/persembahan/${target?.code}/void`,
      [MENU.PERSEMBAHAN],
      { method: "POST", body: JSON.stringify({ voidReason: "Ulang." }) },
    );

    expect(response?.status).toBe(400);
    expect((await bodyOf(response)).error).toBe(
      "Persembahan Ini Sudah Dibatalkan",
    );
  });
});

describe("bacaan", () => {
  test("orang selalu { name } atau null, tidak pernah angka", async () => {
    const body = await bodyOf(await call("/persembahan", [MENU.PERSEMBAHAN]));
    const rows = body.data as {
      receivedBy: { name: string } | null;
      voidedBy: { name: string } | null;
    }[];

    const isPerson = (value: { name: string } | null) =>
      value === null || typeof value.name === "string";

    expect(rows.every((row) => isPerson(row.receivedBy))).toBe(true);
    expect(rows.every((row) => isPerson(row.voidedBy))).toBe(true);
    expect(rows.some((row) => row.receivedBy !== null)).toBe(true);
  });

  test("daftar membawa totalAmount untuk saringan yang aktif", async () => {
    const body = await bodyOf(await call("/persembahan", [MENU.PERSEMBAHAN]));

    expect(typeof body.totalAmount).toBe("string");
    expect(Number(body.totalAmount)).toBeGreaterThan(0);
  });

  test("baris pembayaran online tetap terbaca di daftar", async () => {
    const body = await bodyOf(
      await call(
        "/persembahan",
        [MENU.PERSEMBAHAN],
        {},
        "?receiveMethod=PAYMENT_GATEWAY&limit=100",
      ),
    );

    expect((body.data as unknown[]).length).toBeGreaterThan(0);
  });

  test("kode yang tidak ada: 404", async () => {
    expect(
      (await call("/persembahan/PSB-9999-9999", [MENU.PERSEMBAHAN]))?.status,
    ).toBe(404);
  });
});

describe("ddl ibadah", () => {
  test("butuh VIEW dan bisa disaring ke tanggal", async () => {
    expect((await call("/ddl/ibadah", []))?.status).toBe(403);

    const body = await bodyOf(await call("/ddl/ibadah", [MENU.PERSEMBAHAN]));
    const rows = body.data as { date: string }[];
    const date = rows[0]?.date ?? "";
    const narrowed = await bodyOf(
      await call("/ddl/ibadah", [MENU.PERSEMBAHAN], {}, `?date=${date}`),
    );

    expect(
      (narrowed.data as { date: string }[]).every((row) => row.date === date),
    ).toBe(true);
  });

  test("tanggal tanpa ibadah: 404, yang dibaca layar sebagai kosong", async () => {
    expect(
      (await call("/ddl/ibadah", [MENU.PERSEMBAHAN], {}, "?date=2019-01-01"))
        ?.status,
    ).toBe(404);
  });
});

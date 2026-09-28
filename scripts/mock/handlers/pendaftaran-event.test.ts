import { afterEach, describe, expect, test } from "bun:test";

import { REGISTRATION } from "../kegiatan-store";
import type { MockAction } from "../kit";

import { pendaftaranEventMock } from "./pendaftaran-event";

const SNAPSHOT = structuredClone(REGISTRATION);

const FLAGS = [
  "MOCK_PENDAFTARAN_FULL",
  "MOCK_PENDAFTARAN_GATEWAY_OFF",
  "MOCK_PENDAFTARAN_GATEWAY_DOWN",
  "MOCK_PENDAFTARAN_INVOICE_502",
  "MOCK_PENDAFTARAN_INVOICE_PAID",
];

afterEach(() => {
  REGISTRATION.splice(0, Infinity, ...structuredClone(SNAPSHOT));
  for (const flag of FLAGS) delete process.env[flag];
});

type Row = {
  code: string;
  status: string;
  participantName: string;
  participantPhone: string;
  participantEmail?: string | null;
  jemaat: { code: string } | null;
  payment: {
    status: string;
    invoiceUrl?: string | null;
    expiredAt: string | null;
  } | null;
};

type Body = {
  status: number;
  error?: string;
  message?: string;
  issues?: { path: string; message: string }[];
  totalData?: number;
  data: Row & Row[];
};

const onCall = async (
  input: string,
  init: { method?: string; body?: unknown } = {},
  can: (slug: string, action: MockAction) => boolean = () => true,
) => {
  const url = new URL(input, "http://mock.test");
  const method = init.method ?? "GET";
  const response = (await pendaftaranEventMock({
    request: new Request(url, {
      method,
      body: init.body ? JSON.stringify(init.body) : undefined,
    }),
    url,
    path: url.pathname,
    method,
    can,
    isAdmin: false,
    sessionCode: "test",
  })) as Response;

  return { status: response.status, body: (await response.json()) as Body };
};

const onPost = (body: Record<string, unknown>) =>
  onCall("/pendaftaran-event", { method: "POST", body });

describe("daftar dan detail", () => {
  test("daftar: telepon tersamar, tanpa email dan tautan tagihan; detail utuh", async () => {
    const { body } = await onCall("/pendaftaran-event?eventId=2&limit=100");
    const andreas = body.data.find((row) => row.code === "REG-2026-0001");

    expect(andreas?.participantPhone).toBe("0812****0001");
    expect(andreas && "participantEmail" in andreas).toBe(false);
    expect(andreas?.payment && "invoiceUrl" in andreas.payment).toBe(false);

    const detail = await onCall("/pendaftaran-event/reg-2026-0001");

    expect(detail.body.data.participantPhone).toBe("081210000001");
    expect(detail.body.data.payment?.invoiceUrl).toContain("mock-1");
  });

  test("filter status dan cari; status asing 400; tanpa VIEW 403", async () => {
    const expired = await onCall("/pendaftaran-event?status=EXPIRED");

    expect(expired.body.data.map((row) => row.code)).toEqual(["REG-2026-0003"]);
    expect(
      (await onCall("/pendaftaran-event?filter=0812998877")).body.data[0]
        .participantName,
    ).toBe("Maria Lumbantobing");
    expect((await onCall("/pendaftaran-event?status=PAID")).status).toBe(400);
    expect((await onCall("/pendaftaran-event", {}, () => false)).status).toBe(
      403,
    );
  });

  test("tagihan lewat + 5 menit dibaca kedaluwarsa", async () => {
    const row = REGISTRATION.find((item) => item.id === 1);

    if (row?.payment) {
      row.payment.expiredAt = new Date(Date.now() - 6 * 60_000).toISOString();
    }

    const { body } = await onCall("/pendaftaran-event/REG-2026-0001");

    expect(body.data.status).toBe("EXPIRED");
    expect(body.data.payment?.status).toBe("EXPIRED");
  });
});

describe("daftarkan", () => {
  test("jemaat: nama dan telepon disalin dari data jemaat", async () => {
    const { status, body } = await onPost({ eventId: 4, jemaatId: 2 });

    expect(status).toBe(201);
    expect(body.data.participantName).toBe("Bethari Ayu Kusuma");
    expect(body.data.participantPhone).toBe("081210000002");
    expect(body.data.status).toBe("CONFIRMED");
  });

  test("Josephine tanpa telepon → 400 participantPhone; dengan telepon lolos", async () => {
    const asked = await onPost({ eventId: 4, jemaatId: 10 });

    expect(asked.status).toBe(400);
    expect(asked.body.issues?.[0].path).toBe("participantPhone");
    expect(
      (await onPost({ eventId: 4, jemaatId: 10, participantPhone: "08129" }))
        .body.issues?.[0].message,
    ).toBe("Nomor Telepon tidak valid");
    expect(
      (
        await onPost({
          eventId: 4,
          jemaatId: 10,
          participantPhone: "081255500010",
        })
      ).status,
    ).toBe(201);
  });

  test("tamu: nama dan telepon wajib; email harus valid", async () => {
    expect(
      (await onPost({ eventId: 4, jemaatId: null })).body.issues?.[0].message,
    ).toBe("Mohon Lengkapi Nama Peserta");
    expect(
      (
        await onPost({
          eventId: 4,
          jemaatId: null,
          participantName: "Ruth",
          participantPhone: "082166554433",
          participantEmail: "ruth@",
        })
      ).body.error,
    ).toBe("Email Peserta tidak valid");
  });

  test("urutan galat: draf, lampau, penuh, ganda", async () => {
    expect((await onPost({ eventId: 6, jemaatId: 1 })).body.error).toBe(
      "Event Ini Belum Dipublikasikan",
    );
    expect((await onPost({ eventId: 7, jemaatId: 1 })).body.error).toBe(
      "Event Ini Sudah Berlangsung",
    );

    const full = await onPost({ eventId: 3, jemaatId: 1 });

    expect(full.status).toBe(409);
    expect(full.body.error).toBe("Kuota Event Ini Sudah Penuh (3 peserta)");

    const twice = await onPost({ eventId: 1, jemaatId: 4 });

    expect(twice.status).toBe(409);
    expect(twice.body.error).toBe(
      "Jemaat ini sudah terdaftar pada event tersebut",
    );
  });

  test("berbayar: tagihan terbit; gateway mati sesudah tercatat → 201 tanpa tautan; belum dikonfigurasi → 503", async () => {
    const paid = await onPost({ eventId: 2, jemaatId: 5 });

    expect(paid.body.data.status).toBe("PENDING_PAYMENT");
    expect(paid.body.data.payment?.invoiceUrl).toContain("checkout-staging");

    process.env.MOCK_PENDAFTARAN_GATEWAY_DOWN = "1";
    const down = await onPost({ eventId: 2, jemaatId: 6 });

    expect(down.status).toBe(201);
    expect(down.body.data.payment?.invoiceUrl).toBeNull();
    expect(down.body.message).toBe(
      "Peserta Terdaftar, Tetapi Tagihan Pembayaran Gagal Dibuat. Buat Ulang Tagihannya Dari Halaman Pendaftaran, Atau Kursinya Kembali Otomatis Setelah Batas Pembayaran Lewat",
    );

    process.env.MOCK_PENDAFTARAN_GATEWAY_OFF = "1";
    const count = REGISTRATION.length;

    expect((await onPost({ eventId: 2, jemaatId: 7 })).status).toBe(503);
    expect(REGISTRATION.length).toBe(count);
  });
});

describe("batalkan dan buat ulang tagihan", () => {
  test("hanya CONFIRMED gratis yang batal; lainnya 400 dengan pesannya", async () => {
    const onDelete = (code: string) =>
      onCall(`/pendaftaran-event/${code}`, { method: "DELETE" });

    expect((await onDelete("REG-2026-0001")).body.error).toContain(
      "Masih Menunggu Pembayaran",
    );
    expect((await onDelete("REG-2026-0002")).body.error).toContain(
      "Sudah Lunas",
    );
    expect((await onDelete("REG-2026-0009")).body.error).toBe(
      "Pendaftaran Ini Sudah Tidak Aktif",
    );

    const done = await onDelete("REG-2026-0008");

    expect(done.status).toBe(200);
    expect(done.body.data.status).toBe("CANCELLED");
  });

  test("buat ulang tagihan: hanya menunggu bayar tanpa tautan; 502 dari gateway", async () => {
    const onReissue = (code: string) =>
      onCall(`/pendaftaran-event/${code}/invoice`, { method: "POST" });

    expect((await onReissue("REG-2026-0008")).body.error).toBe(
      "Event Ini Gratis, Pendaftarannya Tidak Memiliki Tagihan",
    );
    expect((await onReissue("REG-2026-0001")).body.error).toBe(
      "Pendaftaran Ini Sudah Memiliki Tagihan",
    );

    process.env.MOCK_PENDAFTARAN_GATEWAY_DOWN = "1";
    const created = await onPost({ eventId: 2, jemaatId: 5 });

    process.env.MOCK_PENDAFTARAN_INVOICE_502 = "1";
    expect((await onReissue(created.body.data.code)).status).toBe(502);

    delete process.env.MOCK_PENDAFTARAN_INVOICE_502;
    const reissued = await onReissue(created.body.data.code);

    expect(reissued.status).toBe(200);
    expect(reissued.body.message).toBe(
      "Berhasil Membuat Ulang Tagihan Pembayaran",
    );
    expect(reissued.body.data.payment?.invoiceUrl).toContain("checkout");
  });

  test("buat ulang tagihan saat tagihan lama terbayar bersamaan: 200 CONFIRMED/PAID tanpa tautan", async () => {
    process.env.MOCK_PENDAFTARAN_GATEWAY_DOWN = "1";
    const created = await onPost({ eventId: 2, jemaatId: 5 });

    process.env.MOCK_PENDAFTARAN_INVOICE_PAID = "1";
    const paid = await onCall(
      `/pendaftaran-event/${created.body.data.code}/invoice`,
      { method: "POST" },
    );

    expect(paid.status).toBe(200);
    expect(paid.body.data.status).toBe("CONFIRMED");
    expect(paid.body.data.payment?.status).toBe("PAID");
    expect(paid.body.data.payment?.invoiceUrl).toBeNull();
  });
});

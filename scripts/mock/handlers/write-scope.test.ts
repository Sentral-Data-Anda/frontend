import { afterEach, describe, expect, test } from "bun:test";

import { MENU } from "../../../src/config/menu";
import { PERSONA_KEY, PERSONA_POSITIONS } from "../../mock-dashboard";
import { resetAnggaranStores } from "../anggaran-reset";
import { BUDGET_USAGE_REPORT, reportLine } from "../anggaran-store";

import { laporanBudgetMock } from "./laporan-budget";
import { programMock } from "./program";

afterEach(resetAnggaranStores);

/**
 * Jalur tulis yang menerima kunci pemilik dari payload harus MELINGKUPINYA,
 * bukan sekadar memeriksa keberadaannya.
 *
 * Penjaga ini menjalankan handler-nya, bukan membaca berkasnya (pedoman §7.1):
 * sebuah test yang memindai sumber akan mewarisi setiap bentuk pemeriksaan yang
 * penulisnya tidak bayangkan, dan `bapelOf()` yang terbaca seperti penjaga
 * adalah persis bentuk yang tidak terbayangkan — ia meloloskan lubang ini dari
 * tiga pembaca manusia.
 *
 * `privacy.test.ts` tidak bisa menangkapnya: ia granular per MODUL secara
 * desain, jadi satu jalur tulis yang lupa melingkupi di dalam modul yang
 * menyempit di tempat lain tidak terlihat olehnya. Batas itu tercatat jujur di
 * docblock-nya, dan batas itulah yang meloloskan ini.
 */

const IN_SCOPE = 2;

const OUTSIDE_SCOPE = 3;

// Persona bawaan test tidak memegang jabatan apa pun, jadi lingkupnya kosong
// dan SETIAP baris 404 — test yang berdiri di atas itu lulus apa pun yang
// terjadi. Diberi satu jabatan supaya ada baris yang memang boleh dilihat,
// dan pemindahannya ke komisi lain yang diuji.
const seedScope = () => {
  PERSONA_POSITIONS[PERSONA_KEY] = [
    { name: "Ketua", bapelId: IN_SCOPE, bapel: { name: "Komisi Pemuda" } },
  ];
};

const seedReport = () => {
  BUDGET_USAGE_REPORT.push({
    id: 9001,
    publicId: "lpb-scope",
    code: "LPB-SCOPE",
    bapelId: IN_SCOPE,
    year: 2026,
    month: 3,
    status: "DRAFT",
    note: null,
    approvedById: null,
    approvedAt: null,
    deletedAt: null,
    lines: [reportLine(22, "2026-03-05", "Uji", "50000")],
    receipts: [],
    approvals: [],
  });
};

const clear = () => {
  delete PERSONA_POSITIONS[PERSONA_KEY];
  const index = BUDGET_USAGE_REPORT.findIndex((row) => row.id === 9001);
  if (index >= 0) BUDGET_USAGE_REPORT.splice(index, 1);
};

// FormData happy-dom tidak bisa diserialisasi Request asli Bun, jadi bodinya
// ditempelkan — pola yang sama dengan `laporan-budget.test.ts`.
const ctxOf = (method: string, path: string, body: FormData | object) => {
  const url = new URL(`/api/v1${path}`, "http://mock.test");
  const request = new Request(url, { method });

  if (body instanceof FormData) {
    request.formData = async () => body;
  } else {
    request.json = async () => body;
  }

  return ctxWith(request, url, path, method);
};

const ctxWith = (request: Request, url: URL, path: string, method: string) => ({
  request,
  url,
  path,
  method,
  // Persona pengurus komisi: tidak memegang BUDGET, jadi lingkupnya
  // sempit ke jabatannya.
  can: (slug: string) => slug !== MENU.BUDGET,
  isAdmin: false,
  sessionCode: "A-0184",
});

const reportForm = (bapelId: number) => {
  const form = new FormData();

  form.set("bapelId", String(bapelId));
  form.set("year", "2026");
  form.set("month", "3");
  form.set(
    "lines",
    JSON.stringify([
      {
        accountId: 22,
        spentDate: "2026-03-05",
        description: "Uji lingkup",
        amount: "50000",
      },
    ]),
  );

  return form;
};

describe("jalur tulis melingkupi kunci pemilik, bukan cuma memeriksa ada", () => {
  test("LPJ create menolak bapelId di luar lingkup dengan 404 + path", async () => {
    const response = await laporanBudgetMock(
      ctxOf("POST", "/laporan-budget", reportForm(OUTSIDE_SCOPE)) as never,
    );
    const body = (await response?.json()) as {
      status: number;
      issues?: { path: string }[];
    };

    expect(response?.status).toBe(404);
    expect(body.issues?.[0]?.path).toBe("bapelId");
  });

  test("LPJ update menolak PEMINDAHAN laporan sendiri ke komisi lain", async () => {
    seedScope();
    seedReport();

    try {
      // Barisnya MEMANG boleh dilihat pemanggil — kalau tidak, 404-nya datang
      // dari pencarian row dan test ini lulus tanpa menguji apa pun.
      const visible = await laporanBudgetMock(
        ctxOf(
          "GET",
          "/laporan-budget/lpb-scope",
          reportForm(IN_SCOPE),
        ) as never,
      );

      expect(visible?.status).toBe(200);

      const response = await laporanBudgetMock(
        ctxOf(
          "PUT",
          "/laporan-budget/lpb-scope",
          reportForm(OUTSIDE_SCOPE),
        ) as never,
      );
      const body = (await response?.json()) as {
        issues?: { path: string }[];
      };

      expect(response?.status).toBe(404);
      expect(body.issues?.[0]?.path).toBe("bapelId");
    } finally {
      clear();
    }
  });

  test("create Program memang terbuka, dan itu keputusan user", async () => {
    // Program bodinya JSON biasa — lampiran RAB dipotong (A30), jadi tidak
    // pernah jadi multipart.
    const response = await programMock(
      ctxOf("POST", "/program", {
        name: "Uji",
        year: 2026,
        bapelId: OUTSIDE_SCOPE,
        items: [
          { accountId: 22, description: "x", quantity: "1", unitPrice: "1000" },
        ],
      }) as never,
    );

    // Sekretariat mengetik usulan untuk komisi yang belum memakai aplikasi
    // (U9), jadi permukaan tulis ini sengaja terbuka. Test ini ada supaya
    // "memperbaikinya" jadi scoped akan merah dan memaksa percakapan, bukan
    // diam-diam membatalkan keputusan user.
    expect(response?.status).not.toBe(404);
  });
});

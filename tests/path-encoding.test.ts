import { readFileSync } from "node:fs";

import { Glob } from "bun";
import { describe, expect, test } from "bun:test";

/**
 * Kunci yang masuk ke SEGMEN path harus disandikan. Kunci datang dari segmen
 * rute, jadi siapa pun bisa mengetiknya di address bar; tanpa penyandian
 * `../` mengubah endpoint yang BENAR-BENAR dipanggil, termasuk DELETE yang
 * mendarat di sumber daya lain. Server tetap menegakkan izinnya — bukan
 * eskalasi hak — tapi aplikasi mengirim permintaan yang pemakainya tidak
 * maksudkan.
 *
 * Dua lapis, dimutasikan terpisah:
 *
 *   §1 KUANTIFIER — himpunan subjeknya di-glob dari `src/`, bukan didaftar
 *                   tangan, jadi berkas api BARU otomatis masuk cakupan.
 *   §2 PREDIKAT   — tiap interpolasi di posisi segmen harus menyebut
 *                   `encodeURIComponent`, atau terdaftar di `SUB_PATH`.
 *
 * Langit-langitnya satu kalimat: ini pin TEKS, jadi ia menjaga kecelakaan,
 * bukan penulis yang bertekad — kunci yang dirakit di helper lain lolos. Yang
 * menjaga perilakunya adalah `api.test.tsx` per fitur, yang MENJALANKAN
 * hook-nya dan melihat URL yang dikirim `fetch` (pedoman §7.1).
 */

const ROOT = new URL("../", import.meta.url).pathname;

const read = (file: string) => readFileSync(`${ROOT}${file}`, "utf8");

/**
 * Interpolasi yang BUKAN kunci: sub-path konstan modul atau terhitung di
 * tempat. Menyandikannya justru merusak path-nya (`jemaat?register=0` jadi
 * satu segmen). Tiap baris di-review satu per satu; daftarnya ditulis tangan,
 * jadi tidak ada assertion pendaftaran yang perlu dikeraskan di sini.
 */
const SUB_PATH = new Set([
  "src/features/beranda/api.ts::month",
  "src/features/inventaris/barang/api.ts::kind",
  "src/features/inventaris/mutasi-stok/api.ts::path",
  "src/features/inventaris/siklus-aset/api.ts::API_SEGMENT[kind]",
  "src/features/inventaris/siklus-aset/api.ts::path",
  "src/features/inventaris/stok-opname/api.ts::path",
  "src/features/kegiatan/pendaftaran-event/api.ts::path",
  "src/features/kejemaatan/report-jemaat/api.ts::month",
  "src/features/kejemaatan/report-jemaat/api.ts::name",
  "src/features/pelayanan/jadwal-pelayan/api.ts::path",
  "src/features/pengadaan/penerimaan-barang/api.ts::path",
  "src/features/pengadaan/pesanan-pembelian/api.ts::CURRENCY_DDL",
  "src/features/pengadaan/pesanan-pembelian/api.ts::REQUEST_DDL",
  "src/features/pengadaan/pesanan-pembelian/api.ts::ratePath(currencyCode, orderDate)",
  "src/hooks/use-ddl-options.ts::path",
  // Kata kerja aksi bertipe union — himpunan tertutup di tipenya, bukan kunci.
  "src/features/inventaris/penyusutan/api.ts::STEP[action]",
  "src/features/inventaris/stok-opname/api.ts::action",
  "src/features/kejemaatan/daftar-jemaat/api.ts::kind",
  "src/features/keuangan/kas-masuk/api.ts::action",
  "src/features/keuangan/setoran/api.ts::action",
  "src/features/pengadaan/pesanan-pembelian/api.ts::action",
  "src/features/persetujuan/permintaan-persetujuan/api.ts::verb",
  "src/features/sdm/payroll/api.ts::action",
  // Segmen href UI, bukan path API. Berkas-berkas ini masuk cakupan karena
  // mengimpor `FetchError`; cakupan yang terlalu lebar hanya berbiaya satu
  // baris di sini, sementara yang terlalu sempit berbiaya satu kebocoran.
  "src/features/inventaris/barang/model.ts::action",
  "src/features/keuangan/persembahan/model.ts::FORM_SEGMENT.create",
  "src/features/keuangan/persembahan/model.ts::FORM_SEGMENT.kolekte",
  // URL verifikasi yang DICETAK (QR), bukan yang di-fetch; `publicId` UUID
  // terbitan server. Penyandiannya tetap benar — milik fase Anggaran.
  "src/features/anggaran/laporan-budget/model.ts::publicId",
]);

/** Hanya berkas yang benar-benar memanggil API lewat `fetcher`. */
const isApiModule = (source: string) =>
  source.includes("@/lib/api/fetcher") || source.includes("./fetcher");

/**
 * Keluarga ejaan yang dicakup, dan tiap satunya dimutasikan terpisah:
 *   `/x/${k}`       — segmen langsung sesudah literal
 *   `${BASE}/${k}`  — basis konstan, idiom keuangan/pengadaan/SDM
 *   `/x/${a}/${b}`  — lebih dari satu segmen dalam satu literal
 *   `/x/${ k }`     — spasi di dalam kurung kurawal
 *   `/${enc(k)}`    — literal bersarang di dalam interpolasi
 *
 * Dibatasi SINTAKSIS, bukan anggaran karakter: `[^{}]` berhenti di kurung
 * kurawal, jadi jendelanya tidak pernah meluber ke interpolasi tetangga.
 */
const SEGMENT = /\/\$\{\s*([^{}]*?)\s*\}/g;

const sitesIn = (source: string) =>
  [...source.matchAll(SEGMENT)].map((match) => match[1]);

const FILES = [...new Glob("src/**/*.{ts,tsx}").scanSync(ROOT)]
  .filter((file) => !/\.test\.[tj]sx?$/.test(file))
  .map((file) => file.split("\\").join("/"))
  .filter((file) => isApiModule(read(file)));

describe("penyandian kunci di segmen path", () => {
  // §1 KUANTIFIER: glob-nya tidak boleh diam-diam kosong atau menyempit.
  test("memindai setiap modul api di src/", () => {
    expect(FILES.length).toBeGreaterThan(60);
    expect(FILES).toContain("src/features/pengaturan/user/api.ts");
    expect(FILES).toContain("src/features/pengaturan/hari-libur/api.ts");
    expect(FILES).toContain("src/features/keuangan/setoran/api.ts");
    expect(FILES).toContain("src/features/auth/ui/first-login-form.tsx");
    // Lantai, bukan hitungan persis: ia hanya boleh naik. Yang dijaga adalah
    // glob yang diam-diam berhenti menemukan situsnya sama sekali.
    expect(
      FILES.filter((file) => sitesIn(read(file)).length > 0).length,
    ).toBeGreaterThanOrEqual(45);
  });

  // §2 PREDIKAT: nol situs mentah di seluruh repo.
  test("nol interpolasi mentah di posisi segmen", () => {
    const raw = FILES.flatMap((file) =>
      sitesIn(read(file))
        .filter((expr) => !expr.includes("encodeURIComponent"))
        .filter((expr) => !SUB_PATH.has(`${file}::${expr}`))
        .map((expr) => `${file}::${expr}`),
    );

    expect(raw).toEqual([]);
  });

  // §2 PREDIKAT: baris `SUB_PATH` yang basi akan tumbuh jadi pemutih diam-diam.
  test("daftar SUB_PATH tidak punya baris basi", () => {
    const stale = [...SUB_PATH].filter((entry) => {
      const [file, expr] = entry.split("::");

      return !sitesIn(read(file)).includes(expr);
    });

    expect(stale).toEqual([]);
  });
});

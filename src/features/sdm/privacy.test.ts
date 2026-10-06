import { Glob } from "bun";
import { describe, expect, test } from "bun:test";

import { MENU } from "@/config/menu";

import { TREE } from "../../../scripts/menu-tree";
import { actionsOf, PERSONAS } from "../../../scripts/mock-dashboard";

/**
 * Penjaga privasi gaji untuk seluruh grup SDM. Ditulis sekali di sini karena
 * tujuh agent membangun di atasnya; tiap agent MENAMBAH satu jalur ke
 * `SALARY_SCREENS`, bukan menyalin berkas ini.
 *
 * Dua lapis, dan keduanya dimutasikan terpisah:
 *
 *   §1 PERILAKU  — baris yang benar-benar dikembalikan `actionsOf` atas
 *                  PERSONAS nyata. Bukan pin teks: assertion-nya adalah daftar
 *                  pasangan persona×menu, jadi grant yang bertambah atau
 *                  berpindah mengubah barisnya.
 *   §2 STRUKTUR  — himpunan subjeknya bertanya "berkas mana yang menyentuh
 *                  field gaji", bukan "apakah berkas X masih menyebut Y".
 *   §3 KUANTIFIER— membuktikan pemindai §2 TIDAK BUTA. Ini yang dilewatkan
 *                  penjaga privasi Anggaran: predikatnya benar, himpunan
 *                  subjeknya diam-diam kosong, dan nol review menyerangnya.
 *                  Mutasi §2 (menghapus jalur dari `SALARY_SCREENS`) dan mutasi
 *                  §3 (mempersempit glob atau regex-nya) harus gagal SENDIRI.
 */

const ROOT = new URL("../../../", import.meta.url).pathname;

const SELF = "src/features/sdm/privacy.test.ts";

/**
 * Field yang membawa bayaran SEORANG, diambil dari `schema.prisma` be-sada:
 * `Payslip.basicSalary/grossAmount/deductionTotal/netAmount` dan
 * `KaryawanContract.basicSalary`.
 *
 * `totalGross`/`totalDeduction`/`totalNet` SENGAJA tidak di sini: ketiganya
 * agregat `PayrollRun`, §0.3 no. 3 mengizinkannya di daftar Penggajian, dan
 * widget Beranda `payables` sudah membacanya hari ini
 * (`src/features/beranda/api.ts` `PayrollItem.totalNet`) — memasukkannya
 * membuat penjaga ini merah atas kode yang justru benar.
 *
 * Langit-langit yang disadari: `KaryawanPayrollComponent.value` dan
 * `PayrollComponent.defaultValue` juga nominal per orang, tapi `value` terlalu
 * umum untuk digrep tanpa ratusan positif palsu. Penetapan per karyawan dijaga
 * oleh §1 (grant) dan oleh batas impor eslint, bukan oleh §2.
 */
const SALARY_FIELDS = [
  "basicSalary",
  "grossAmount",
  "deductionTotal",
  "netAmount",
] as const;

const SALARY_MARKER = new RegExp(`\\b(${SALARY_FIELDS.join("|")})\\b`);

/**
 * Satu-satunya tempat angka gaji per orang boleh muncul (§0.3 no. 2): dua
 * layar, rutenya, dan handler mock-nya. **Agent menambah jalurnya ke sini dan
 * tidak menyentuh apa pun lain di berkas ini.**
 */
const SALARY_SCREENS = [
  "src/features/sdm/kontrak-karyawan/",
  "src/features/sdm/payroll/",
  "src/app/(app)/sdm/kontrak-karyawan/",
  "src/app/(app)/sdm/payroll/",
  "scripts/mock/handlers/kontrak-karyawan.ts",
  "scripts/mock/handlers/payroll.ts",
] as const;

type Source = { path: string; text: string };

const isAllowed = (path: string) =>
  path === SELF || SALARY_SCREENS.some((prefix) => path.startsWith(prefix));

/** Pure: himpunan subjeknya adalah `files`, predikatnya `isAllowed`. */
const salaryLeaksOf = (files: readonly Source[]) =>
  files
    .filter((file) => SALARY_MARKER.test(file.text) && !isAllowed(file.path))
    .map((file) => file.path)
    .sort();

const scanSources = async () => {
  const files: Source[] = [];

  for (const pattern of ["src/**/*.{ts,tsx}", "scripts/**/*.ts"]) {
    for await (const path of new Glob(pattern).scan(ROOT)) {
      files.push({ path, text: await Bun.file(`${ROOT}${path}`).text() });
    }
  }

  return files;
};

// §1 — PERILAKU. Satu bacaan gaji = satu menu; yang dinyatakan adalah barisnya.
describe("gaji per orang: siapa yang bisa membacanya", () => {
  const SALARY_MENUS = [
    MENU.KONTRAK_KARYAWAN,
    MENU.KOMPONEN_PAYROLL,
    MENU.PAYROLL,
  ];

  const viewersOf = (slug: string) =>
    Object.keys(PERSONAS)
      .filter((key) => actionsOf(PERSONAS[key], slug).includes("VIEW"))
      .sort();

  /**
   * KUANTIFIER, dan ia ada karena mutasi — bukan karena dibayangkan.
   * Mencabut `MENU.PAYROLL` dari `SALARY_MENUS` membuat KETIGA test di bawah
   * **tetap hijau**: `test.each` cuma jalan dua kali, dan matriks di bawah
   * membaca `TREE`, bukan himpunan ini. Jadi himpunan subjeknya dinyatakan
   * sendiri, terpisah dari predikat "hanya bendahara".
   */
  test("himpunan menu gaji itu tepat tiga, dan ini ketiganya", () => {
    expect([...SALARY_MENUS].sort()).toEqual([
      MENU.KOMPONEN_PAYROLL,
      MENU.KONTRAK_KARYAWAN,
      MENU.PAYROLL,
    ]);
  });

  test.each(SALARY_MENUS)(
    "%s hanya dibaca bendahara (dan admin, yang memang semua menu)",
    (slug) => {
      expect(viewersOf(slug)).toEqual(["admin", "bendahara"]);
    },
  );

  // Kuantifier §1: tanpa ini, menghapus satu slug dari SALARY_MENUS lolos tanpa
  // jejak. Kedelapan daun SDM dinyatakan sekaligus, jadi slug yang berpindah
  // dari himpunan gaji ke himpunan non-gaji tetap mengubah baris di sini.
  test("matriks grant SDM, kedelapan daun, setiap persona", () => {
    const rows = TREE[MENU.SDM].flatMap((slug) =>
      viewersOf(slug).map((persona) => `${persona} · ${slug}`),
    );

    expect(rows.sort()).toEqual([
      "admin · ABSENSI_KARYAWAN",
      "admin · CUTI",
      "admin · KARYAWAN",
      "admin · KOMPONEN_PAYROLL",
      "admin · KONTRAK_KARYAWAN",
      // §0a.1: Pajak PPh21 disembunyikan dengan TIDAK DIBERIKAN ke siapa pun.
      // `admin` memegangnya karena `grants: null` berarti seluruh pohon — jadi
      // di bawah MOCK_PERSONA=admin kotaknya dirender dan 404. Itu disengaja;
      // jangan membangun layarnya, jangan mencabut slug-nya.
      "admin · PAJAK_PPH21",
      "admin · PAYROLL",
      "admin · TIPE_CUTI",
      "bendahara · KARYAWAN",
      "bendahara · KOMPONEN_PAYROLL",
      "bendahara · KONTRAK_KARYAWAN",
      "bendahara · PAYROLL",
      "sekretariat · ABSENSI_KARYAWAN",
      "sekretariat · CUTI",
      "sekretariat · KARYAWAN",
      "sekretariat · TIPE_CUTI",
    ]);
  });

  // P1 dalam bentuk yang bisa dieksekusi: daftar grant ADALAH desain privasinya.
  test("tidak ada persona non-gaji yang kecipratan menu gaji", () => {
    const leaked = Object.keys(PERSONAS)
      .filter((key) => key !== "admin" && key !== "bendahara")
      .flatMap((key) =>
        SALARY_MENUS.filter(
          (slug) => actionsOf(PERSONAS[key], slug).length > 0,
        ).map((slug) => `${key} · ${slug}`),
      );

    expect(leaked).toEqual([]);
  });
});

// §2 — STRUKTUR. "Berkas mana yang menyentuh field gaji", bukan "apakah X
// masih menyebut Y". Hari ini kosong; ia mulai berbunyi begitu agent mendarat.
describe("field gaji tidak keluar dari dua layarnya", () => {
  test("nol berkas di luar Kontrak dan Penggajian menyebut nominal per orang", async () => {
    expect(salaryLeaksOf(await scanSources())).toEqual([]);
  });

  test("nol komponen bersama dan nol widget Beranda menyentuhnya", async () => {
    const files = await scanSources();
    const leaked = files
      .filter(
        (file) =>
          (file.path.startsWith("src/components/") ||
            file.path.startsWith("src/features/beranda/")) &&
          SALARY_MARKER.test(file.text),
      )
      .map((file) => file.path);

    expect(leaked).toEqual([]);
  });
});

// §3 — KUANTIFIER, dimutasikan terpisah dari predikat §2. Tiga cara pemindai
// bisa buta, dan ketiganya pernah membuat penjaga lain hijau selamanya:
// glob yang tidak mencapai berkasnya, regex yang tidak cocok, allowlist yang
// menelan semuanya.
describe("pemindainya tidak buta", () => {
  test("glob-nya benar-benar mencapai kedua pohon", async () => {
    const paths = (await scanSources()).map((file) => file.path);

    expect(paths).toContain("src/config/menu.ts");
    expect(paths).toContain("scripts/mock-dashboard.ts");
    expect(paths).toContain("scripts/mock/handlers/index.ts");
    expect(paths).toContain(SELF);
  });

  test("berkas berisi field gaji di jalur terlarang DILAPORKAN", () => {
    expect(
      salaryLeaksOf([
        { path: "src/components/common/display/x.tsx", text: "row.netAmount" },
        { path: "src/features/beranda/widgets/y.ts", text: "r.basicSalary" },
        { path: "src/features/sdm/karyawan/model.ts", text: "x.grossAmount" },
        { path: "scripts/mock/handlers/cuti.ts", text: "p.deductionTotal" },
      ]),
    ).toEqual([
      "scripts/mock/handlers/cuti.ts",
      "src/components/common/display/x.tsx",
      "src/features/beranda/widgets/y.ts",
      "src/features/sdm/karyawan/model.ts",
    ]);
  });

  test("keempat field dikenali satu per satu", () => {
    for (const field of SALARY_FIELDS) {
      expect(
        salaryLeaksOf([{ path: "src/lib/z.ts", text: `a.${field} + 1` }]),
      ).toEqual(["src/lib/z.ts"]);
    }
  });

  test("allowlist-nya mengizinkan dua layar itu, bukan seluruh SDM", () => {
    const sample = (path: string) => ({ path, text: "x.basicSalary" });

    expect(
      salaryLeaksOf([
        sample("src/features/sdm/payroll/detail/slip.tsx"),
        sample("src/features/sdm/kontrak-karyawan/form/fields.tsx"),
      ]),
    ).toEqual([]);
    expect(
      salaryLeaksOf([sample("src/features/sdm/cuti/list/item.tsx")]),
    ).toEqual(["src/features/sdm/cuti/list/item.tsx"]);
  });
});

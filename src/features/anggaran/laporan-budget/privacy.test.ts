import { Glob } from "bun";
import { describe, expect, test } from "bun:test";

/**
 * Kwitansi LPJ adalah berkas paling sensitif di grup ini: daftar diakonia
 * menyebut kesulitan seorang jemaat dengan namanya. Yang dijaga di sini adalah
 * bentuknya, bukan satu endpoint — sebuah bacaan baru yang lupa lingkupnya
 * harus menggagalkan test ini, bukan lolos sampai ada yang melaporkannya.
 */
const ROOT = new URL("../../../../", import.meta.url).pathname;

const OWNED = "src/features/anggaran/laporan-budget/";

const ROUTES = "src/app/(app)/anggaran/laporan-budget/";

const HANDLER = "scripts/mock/handlers/laporan-budget.ts";

const isTest = (path: string) => /\.test\.tsx?$/.test(path);

const readSources = async (pattern: string, skipOwned = true) => {
  const files: { path: string; text: string }[] = [];

  for await (const path of new Glob(pattern).scan(ROOT)) {
    if (skipOwned && path.startsWith(OWNED)) continue;
    if (isTest(path)) continue;

    files.push({ path, text: await Bun.file(`${ROOT}${path}`).text() });
  }

  return files;
};

describe("kwitansi laporan tidak keluar dari layarnya", () => {
  test("hanya rute Laporan Budget yang mengimpor fiturnya", async () => {
    const leaked = (await readSources("src/**/*.{ts,tsx}")).filter(
      (file) =>
        /@\/features\/anggaran\/laporan-budget/.test(file.text) &&
        !file.path.startsWith(ROUTES),
    );

    expect(leaked.map((file) => file.path)).toEqual([]);
  });

  test("tidak ada layar lain yang membaca lampiran laporan", async () => {
    const leaked = (await readSources("src/**/*.{ts,tsx}")).filter(
      (file) =>
        file.path.startsWith("src/features/") &&
        /listReceipt|budget-usage-report/.test(file.text),
    );

    expect(leaked.map((file) => file.path)).toEqual([]);
  });

  test("daftar tidak membawa bentuk lampiran sama sekali", async () => {
    const types = await Bun.file(`${ROOT}${OWNED}types.ts`).text();
    const list = types.slice(
      types.indexOf("export type BudgetReport = {"),
      types.indexOf("export type BudgetReportLine"),
    );

    expect(list).not.toContain("listReceipt");
    expect(list).toContain("receiptCount");
  });

  test("setiap bacaan handler menyaring lingkup komisi, tanpa kecuali", async () => {
    const handler = await Bun.file(`${ROOT}${HANDLER}`).text();
    const reads = [
      ...handler.matchAll(/BUDGET_USAGE_REPORT\.(find|filter)\(/g),
    ];
    const scoped = [...handler.matchAll(/isVisibleBapel\(scope,/g)];

    expect(reads.length).toBeGreaterThan(0);
    expect(scoped.length).toBeGreaterThanOrEqual(reads.length);
  });

  test("membuat laporan untuk komisi di luar lingkup dijawab tidak ditemukan", async () => {
    const handler = await Bun.file(`${ROOT}${HANDLER}`).text();
    const create = handler.slice(
      handler.indexOf("const onCreate"),
      handler.indexOf("const onUpdate"),
    );

    expect(create).toContain("isVisibleBapel(scope, parsed.bapelId)");
    expect(create).toContain('reportFailure(404, "Komisi Tidak Ditemukan"');
    expect(create).not.toContain("reportFailure(403");
  });

  test("layar tidak pernah menyaring komisi sendiri di klien", async () => {
    const screens = await readSources(`${OWNED}**/*.{ts,tsx}`, false);
    const filtering = screens.filter((file) =>
      /myBapelIds|bapelIds\.includes|isVisibleBapel/.test(file.text),
    );

    expect(filtering.map((file) => file.path)).toEqual([]);
  });

  test("teks kosong dan galat tidak pernah menyatakan cakupan", async () => {
    const screens = await readSources(`${OWNED}**/*.{ts,tsx}`, false);
    const telling = screens.filter((file) =>
      /akses ke laporan ini|laporan komisi lain|milik komisi lain/i.test(
        file.text,
      ),
    );

    expect(telling.map((file) => file.path)).toEqual([]);
  });
});

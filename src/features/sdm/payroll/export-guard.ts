/**
 * SDM §0.3 no. 1 untuk ketiga layar Penggajian, dalam bentuk yang dieksekusi.
 *
 * Dipanggil atas `document`, bukan atas container `render()`: Base UI
 * mem-portal panel filter, popup pilihan, dan setiap dialog ke `body`, jadi
 * container adalah himpunan subjek yang melewatkan persis tempat tombol unduh
 * paling mungkin dipasang.
 *
 * Dua lapis yang gagal sendiri-sendiri: ejaannya KELUARGA (kawat pemicu), dan
 * di bawahnya bentuk tautan berkas yang tidak membaca satu kata pun (penjaga
 * sebenarnya) — tombol yang dinamai "Arsipkan periode" lolos lapis kata dan
 * tertangkap lapis bentuk begitu ia benar-benar menyerahkan berkas.
 *
 * Kembaran `kontrak-karyawan/export-guard.ts` dan ia disengaja: `eslint
 * boundaries` melarang `features/sdm/payroll` mengimpor dari
 * `features/sdm/kontrak-karyawan`. TL yang mengangkat keduanya ke `tests/`
 * sesudah merge.
 */
const EXPORT_WORDS =
  /(ekspor|export|unduh|download|cetak|print|csv|excel|xlsx?|spreadsheet|lembar\s*kerja|pdf|arsip|cadangk|backup|bagikan|share|kirim\s*(ke\s*)?(email|surel|whats?app)|salin|rekap|berkas|file)/i;

const CONTROLS =
  "a, button, [role='button'], [role='link'], [role='menuitem'], [role='option']";

const FILE_LINKS =
  'a[download], a[href$=".csv"], a[href$=".xlsx"], a[href$=".xls"], a[href$=".pdf"], a[href^="data:"], a[href^="blob:"]';

const labelOf = (node: Element) =>
  [
    node.textContent,
    node.getAttribute("aria-label"),
    node.getAttribute("title"),
    node.getAttribute("download"),
    node.getAttribute("href"),
  ]
    .filter(Boolean)
    .join(" ");

export const exportControlsIn = (root: ParentNode): string[] => {
  const byWord = [...root.querySelectorAll(CONTROLS)]
    .filter((node) => EXPORT_WORDS.test(labelOf(node)))
    .map((node) => `kata: ${labelOf(node).trim().slice(0, 60)}`);

  const byShape = [...root.querySelectorAll(FILE_LINKS)].map(
    (node) => `bentuk: ${node.outerHTML.slice(0, 60)}`,
  );

  return [...byWord, ...byShape].sort();
};

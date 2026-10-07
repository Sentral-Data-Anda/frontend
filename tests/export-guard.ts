/**
 * SDM §0.3 no. 1 untuk setiap layar yang membaca gaji, dalam bentuk yang
 * dieksekusi.
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
 * LANGIT-LANGITNYA, dan ia diukur, bukan ditebak: `[role='option']` hanya
 * terjaga pada select yang test-nya BENAR-BENAR BUKA. `SelectField` merender
 * opsinya di dalam `Select.Portal`, jadi DOM-nya tidak ada sampai select itu
 * dibuka — dan dua opsi palsu (satu bernama "Unduh rekap CSV", satu berisi nama
 * dan gaji seseorang) pernah lolos seluruh grup SDM, 538 test hijau, karena nol
 * test membuka satu select pun. Hijau di layar yang tidak pernah membuka
 * select-nya BUKAN bukti. Dua catatan yang menyusul dari itu: `fireEvent.click`
 * tidak membuka popup Base UI (`keyDown` + `ArrowDown` yang membukanya), dan
 * jumlah opsi > 0 harus jadi asersi keras — select yang diam-diam kosong
 * membuat pemindaian berikutnya memindai nol opsi dan hijau.
 *
 * Dulu dua salinan (`payroll/` dan `kontrak-karyawan/`) karena `eslint
 * boundaries` melarang impor lintas fitur; diangkat ke sini sesudah keduanya
 * merge.
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

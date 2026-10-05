/**
 * Pengembali larik store Anggaran ke keadaan benihnya, untuk dipakai test.
 *
 * Kenapa di sini dan bukan di tiap berkas test: larik-larik ini lahir kosong
 * dan yang mengisinya adalah modul handler. Sebuah berkas test yang menyimpan
 * snapshot-nya sendiri saat ia dimuat merekam apa pun yang berkas test lain
 * tinggalkan, jadi "mengembalikan ke benih" bisa berarti mengembalikan sampah —
 * dan satu berkas yang mengosongkan `PROGRAM` membuat berkas berikutnya
 * merekam larik kosong sebagai benihnya. Empat berkas pernah menyalin logika
 * ini, masing-masing salah dengan caranya sendiri.
 *
 * Impor handler di bawah bukan hiasan: ia yang memastikan seluruh penyemai
 * sudah jalan sebelum snapshot diambil. Berkas test yang menyentuh store ini
 * WAJIB mengimpor modul ini, karena snapshot diambil saat modul ini pertama
 * dimuat — berkas yang menulis store tanpa mengimpornya akan mencemari benih.
 */
import {
  BUDGET_ALLOCATION,
  BUDGET_SETTING,
  BUDGET_USAGE_REPORT,
  GATE_WAIVER,
  PROGRAM,
} from "./anggaran-store";

import "./handlers/pagu-anggaran";
import "./handlers/program";
import "./handlers/laporan-budget";
import "./handlers/setelan-anggaran";

const SEED = structuredClone({
  setting: { ...BUDGET_SETTING },
  allocation: BUDGET_ALLOCATION,
  program: PROGRAM,
  report: BUDGET_USAGE_REPORT,
  waiver: GATE_WAIVER,
});

const refill = <Row>(list: Row[], seed: readonly Row[]) => {
  list.splice(0, list.length, ...structuredClone(seed as Row[]));
};

export const resetAnggaranStores = () => {
  Object.assign(BUDGET_SETTING, SEED.setting);
  refill(BUDGET_ALLOCATION, SEED.allocation);
  refill(PROGRAM, SEED.program);
  refill(BUDGET_USAGE_REPORT, SEED.report);
  refill(GATE_WAIVER, SEED.waiver);
};

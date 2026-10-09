import { z } from "zod";

import { MENU, detailHref, menuHref } from "@/config/menu";
import { monthLabel, todayJakarta } from "@/lib/date";

import type { PayrollRun, PayrollRunDetail, Payslip } from "./types";

export const LIST_PATH = menuHref(MENU.HR, MENU.PAYROLL);

export const runHref = (code: string) =>
  detailHref(MENU.HR, MENU.PAYROLL, code);

export const slipHref = (runCode: string, slipCode: string) =>
  `${runHref(runCode)}/slip/${encodeURIComponent(slipCode)}`;

export const NO_VIEW_TITLE = "Anda tidak memiliki akses ke Payroll";

export const NO_VIEW_DESCRIPTION =
  "Hubungi administrator bila Anda memerlukan akses ini.";

export const LOCKED_TITLE = "Data gaji terkunci";

export const LOCKED_DESCRIPTION =
  "Masukkan password akun Anda untuk melihat penggajian beserta nominalnya.";

export const STEP_UP_DESCRIPTION =
  "Masukkan password akun Anda untuk melihat data gaji.";

export const EMPTY_TITLE = "Belum ada periode penggajian";

export const EMPTY_DESCRIPTION =
  "Buka periode untuk bulan yang akan dibayarkan, lalu hitung gajinya.";

export const FILTERED_DESCRIPTION =
  "Tidak ada periode penggajian yang cocok dengan filter ini.";

/** §1.2 / S37. Dikatakan di layar, bukan ditemukan bendahara di bulan pertama. */
export const FULL_MONTH_NOTE =
  "Penggajian membayar bulan penuh. Karyawan yang masuk atau berhenti di tengah bulan dibayar penuh atau tidak sama sekali.";

/**
 * U-D. Garisnya ditulis, bukan diselesaikan diam-diam dengan slip yang bisa
 * disunting.
 *
 * "untuk", bukan "hanya": `contractType` nol referensi di seluruh
 * `src/modules/payroll/` be-sada — `findPayableKaryawan` menyaring `status`
 * dan tanggal kontrak saja, bahkan tidak men-`select` kolomnya. Jadi pemusik
 * ber-kontrak HONORER tetap ikut dihitung dan dibayar `basicSalary` penuh.
 * Ini pernyataan kebijakan; menuliskannya sebagai klaim mekanis membuatnya
 * bohong, dan menegakkannya di FE menaruh penjaga di lapis yang salah.
 */
export const VARIABLE_WAGE_NOTE =
  "Penggajian ini untuk staf bergaji tetap bulanan. Pemusik, petugas kebersihan, dan pengkhotbah tamu yang dibayar per ibadah atau per hari dicatat di Kas Keluar, bukan di sini.";

export const SLIP_SOURCE_NOTE =
  "Slip ini dihitung dari kontrak dan komponen yang berlaku di hari terakhir bulan, dan tidak bisa disunting. Untuk mengubah angkanya, perbaiki kontrak atau komponennya lalu hitung ulang penggajian selama belum dibayarkan.";

export const SLIP_ONE_OFF_NOTE =
  "Pembayaran sekali — THR, bonus, honor per ibadah — tidak bisa ditambahkan sebagai baris di sini. Catat di Kas Keluar.";

export const PAID_FINAL_NOTE =
  "Penggajian ini sudah dibayarkan dan pembukuannya sudah ditulis. Ia tidak bisa dihitung ulang, dibatalkan, atau dihapus.";

export const UNDER_APPROVAL_NOTE =
  "Penggajian ini sedang dikumpulkan tanda tangannya, jadi angkanya dikunci. Tarik pengajuannya di Permintaan Persetujuan bila angkanya perlu diubah.";

export const PAY_READINESS_NOTE =
  "Sebelum dibayarkan: akun beban gaji dan akun kas penggajian sudah diatur di Setelan Akuntansi, setiap komponen potongan sudah punya akun, dan periode fiskal bulan ini masih terbuka.";

export const RECALCULATE_QUESTION =
  "Apakah Anda ingin menghitung ulang penggajian ini? Seluruh slip yang sudah dihitung dibuang dan ditulis ulang dari kontrak dan komponen yang berlaku sekarang.";

export const CALCULATE_QUESTION =
  "Apakah Anda ingin menghitung penggajian ini? Slip dibuat dari kontrak dan komponen yang berlaku di hari terakhir bulan.";

export const SUBMIT_QUESTION =
  "Apakah Anda ingin mengirim penggajian ini untuk ditandatangani? Selama menunggu, angkanya tidak bisa dihitung ulang.";

export const PAY_QUESTION =
  "Apakah Anda ingin menandai penggajian ini sudah dibayarkan? Satu entri jurnal ditulis dan tidak ada jalur pembalikannya — penggajian yang sudah dibayar tidak bisa dibatalkan, dihitung ulang, atau dihapus.";

export const CANCEL_QUESTION =
  "Apakah Anda ingin membatalkan penggajian ini? Periodenya tetap terpakai; hapus bila bulan itu perlu dibuka ulang.";

export const DELETE_QUESTION =
  "Apakah Anda ingin menghapus penggajian ini beserta seluruh slipnya? Periode bulan itu bisa dibuka lagi setelahnya.";

export const RELOAD_TITLE = "Penggajian ini sudah berubah.";

/**
 * `PAYROLL_RUN_CHANGED` (409) berarti MUAT ULANG: tidak ada payload yang bisa
 * dikirim ulang yang akan benar, karena statusnya sudah pindah di bawah lock.
 */
export const RELOAD_HINT =
  "Muat ulang halaman ini untuk melihat keadaannya yang sekarang.";

/**
 * Ke mana orang pergi memperbaikinya. Dipasangkan pada `code` galat, bukan pada
 * prosanya: 403 polos bukan step-up, dan 400 tanpa kode bukan salah satu ini.
 */
export const FIX_HINT: Record<string, string> = {
  PAYROLL_ACCOUNT_UNMAPPED:
    "Atur akunnya di Keuangan › Setelan Akuntansi, lalu coba lagi.",
  PAYROLL_COMPONENT_UNMAPPED:
    "Atur akun komponen itu di SDM › Komponen Payroll, lalu coba lagi.",
  ACCOUNT_INACTIVE: "Aktifkan kembali akunnya di Keuangan › Akun.",
  PERIOD_NOT_OPEN:
    "Buka periode fiskal bulan itu di Keuangan › Periode Fiskal.",
  PERIOD_CLOSED: "Buka periode fiskal bulan itu di Keuangan › Periode Fiskal.",
  PERIOD_CLOSED_UNDER_LOCK:
    "Buka kembali periode fiskalnya di Keuangan › Periode Fiskal, lalu bayarkan ulang.",
  PAYROLL_NET_NEGATIVE:
    "Potongan karyawan itu melebihi gajinya. Perbaiki komponennya di SDM › Komponen Payroll, lalu hitung ulang penggajian.",
  PPH21_TARIFF_MISSING:
    "Hubungi administrator: tarif PPh21 tahun itu belum diisi.",
  PPH21_PTKP_MISSING: "Hubungi administrator: PTKP tahun itu belum diisi.",
  // Dipecah dari `PPH21_TARIFF_MISSING`, yang dulu menanggung dua perbaikan
  // admin berbeda sekaligus — tarif tahunan dan biaya jabatan — sehingga
  // petunjuknya hanya tepat untuk salah satunya.
  PPH21_OCCUPATIONAL_MISSING:
    "Hubungi administrator: biaya jabatan PPh21 tahun itu belum diisi.",
};

export const periodLabel = (run: Pick<PayrollRun, "year" | "month">) =>
  monthLabel(`${run.year}-${String(run.month).padStart(2, "0")}`);

/**
 * **Nol cakupan produksi hari ini, dan itu bukan kelalaian.**
 *
 * `PayrollRun` tidak punya relasi `approvalRequests` di skema be-sada, dan
 * `findByCode` hanya meng-`include` `payslips` — jadi `approval` selalu
 * `undefined` sampai SG-FE1 mendarat. Yang ikut mati bersamanya: chip
 * "Menunggu persetujuan", {@link UNDER_APPROVAL_NOTE}, `ApprovalPanel`, dan
 * keempat gerbang `!isUnderApproval` di bawah.
 *
 * Test-nya hijau atas bentuk payload yang server belum pernah kirim —
 * `screen.test.tsx` me-mock lapis API dan menyuplai `approval` sendiri. Jadi
 * hijaunya membuktikan layar ini akan benar, **bukan** bahwa ia bekerja hari
 * ini. Jangan dibaca sebagai yang kedua.
 */
export const isUnderApproval = (run: Pick<PayrollRunDetail, "approval">) =>
  run.approval?.status === "PENDING";

export const isCalculable = (run: PayrollRunDetail) =>
  (run.status === "DRAFT" || run.status === "CALCULATED") &&
  !isUnderApproval(run);

export const isSubmittable = (run: PayrollRunDetail) =>
  run.status === "CALCULATED" &&
  run.payslips.length > 0 &&
  !isUnderApproval(run);

/**
 * Satu-satunya predikat di sini tanpa gerbang `!isUnderApproval`, dan itu
 * disengaja: `submit` menuntut CALCULATED, jadi run yang APPROVED tidak bisa
 * punya permintaan yang masih terbuka. Gerbangnya akan selalu benar dan
 * membacanya seolah ada yang lupa.
 */
export const isPayable = (run: PayrollRunDetail) =>
  run.status === "APPROVED" && run.payslips.length > 0;

export const isCancellable = (run: PayrollRunDetail) =>
  run.status !== "PAID" && run.status !== "CANCELLED" && !isUnderApproval(run);

export const isDeletable = (run: PayrollRunDetail) =>
  run.status !== "PAID" && run.status !== "APPROVED" && !isUnderApproval(run);

/**
 * `payroll.repository.ts` meng-`include` `payslips` **tanpa `orderBy`** —
 * hanya `lines` yang punya — jadi urutannya apa pun yang Postgres kembalikan
 * dan bisa bertukar antar muat. Bendahara yang mencocokkan dua kali akan
 * melihat orang berpindah baris. `SLP-` dialokasikan `id asc`, jadi urut kode
 * adalah urut stabil yang sama.
 */
export const sortedPayslips = (run: PayrollRunDetail) =>
  [...run.payslips].sort((left, right) => left.code.localeCompare(right.code));

export const payslipOf = (run: PayrollRunDetail, code: string) =>
  run.payslips.find((slip) => slip.code.toLowerCase() === code.toLowerCase()) ??
  null;

export const earningsOf = (slip: Payslip) =>
  slip.lines.filter((line) => line.componentType === "EARNING");

export const deductionsOf = (slip: Payslip) =>
  slip.lines.filter((line) => line.componentType === "DEDUCTION");

export const STATUS_TABS: { value: string; label: string }[] = [
  { value: "", label: "Semua" },
  { value: "DRAFT", label: "Draf" },
  { value: "CALCULATED", label: "Dihitung" },
  { value: "APPROVED", label: "Disetujui" },
  { value: "PAID", label: "Dibayar" },
  { value: "CANCELLED", label: "Dibatalkan" },
];

const YEAR_WINDOW = 5;

/** Tahun yang bisa punya penggajian: tahun berjalan dan empat tahun ke belakang. */
export const yearOptions = (today: string = todayJakarta()) => {
  const current = Number(today.slice(0, 4));

  return Array.from({ length: YEAR_WINDOW }, (_, index) => {
    const year = String(current - index);

    return { value: year, label: year };
  });
};

/**
 * Bulan yang belum mulai ditolak be-sada (`create`), jadi ia tidak ditawarkan.
 * Bulan berjalan DITERIMA — kebanyakan gereja membayar sebelum bulannya habis.
 */
export const openableMonths = (
  year: string,
  today: string = todayJakarta(),
) => {
  const currentYear = Number(today.slice(0, 4));
  const currentMonth = Number(today.slice(5, 7));
  const picked = Number(year);
  const last =
    picked < currentYear ? 12 : picked > currentYear ? 0 : currentMonth;

  return Array.from({ length: last }, (_, index) => {
    const month = String(index + 1).padStart(2, "0");

    return { value: month, label: monthLabel(`${year}-${month}`) };
  }).reverse();
};

export const openPeriodSchema = z.object({
  year: z.string().min(1, "Pilih tahun"),
  month: z.string().min(1, "Pilih bulan"),
});

export type OpenPeriodValues = z.infer<typeof openPeriodSchema>;

export const openPeriodText = (values: OpenPeriodValues) =>
  values.month
    ? `Penggajian ${monthLabel(`${values.year}-${values.month}`)} dibuka sebagai draf. Gajinya dihitung terpisah, setelah periodenya ada.`
    : "Pilih bulan yang akan dibayarkan. Bulan yang belum mulai tidak bisa dibuka.";

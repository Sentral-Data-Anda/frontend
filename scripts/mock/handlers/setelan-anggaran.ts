/**
 * Tiruan `/api/v1/setelan-anggaran` (kontrak Anggaran §2). Satu baris, tanpa
 * `:id`. Setiap label tahun pelayanan di grup ini membacanya.
 *
 *   MOCK_BUDGET_START_JULY=1    → bulan mulai Juli (bukan Januari)
 *   MOCK_NO_BUDGET_SETTING=1    → gereja belum memilih (startMonth null)
 */
import { MENU } from "../../../src/config/menu";
import type { BudgetSetting } from "../../../src/types/anggaran";
import {
  BUDGET_SETTING,
  PROGRAM,
  budgetYearView,
  currentBudgetYear,
  isLive,
} from "../anggaran-store";
import { denied, json, readBody, type MockHandler } from "../kit";

const failure = (
  status: number,
  error: string,
  extra: { issues?: { path: string; message: string }[]; code?: string } = {},
) => json({ status, error, ...extra }, status);

// Barisnya belum ada sampai PUT pertama, dan nilai bawaan kolom tidak bisa
// dibedakan dari seseorang yang sengaja memilih Januari. Yang dibedakan adalah
// ketiadaan barisnya: `startMonth` null adalah keadaan "belum dipilih",
// sementara `budgetYear` tetap terisi dengan jatuh ke kalender supaya tidak ada
// layar yang harus merakit label sendiri.
let isChosen = !process.env.MOCK_NO_BUDGET_SETTING;

// Jendela kerja empat tahun pelayanan. Labelnya lahir di sini bersama
// rentangnya, karena label adalah satu-satunya bagian yang dua lapis bisa
// berbeda pendapat tentangnya.
const budgetYears = () => {
  const current = currentBudgetYear();

  return [-1, 0, 1, 2].map((offset) => budgetYearView(current + offset));
};

const data = (): BudgetSetting => ({
  startMonth: isChosen ? BUDGET_SETTING.startMonth : null,
  budgetYear: budgetYearView(currentBudgetYear()),
  budgetYears: budgetYears(),
});

const view = () =>
  json({
    status: 200,
    message: "Berhasil Mendapatkan Setelan Anggaran",
    data: data(),
  });

const onUpdate = async (request: Request) => {
  const body = await readBody<{ startMonth?: unknown }>(request);
  const startMonth = Number(body.startMonth);

  if (!Number.isInteger(startMonth) || startMonth < 1 || startMonth > 12) {
    return failure(400, "Bulan tidak valid", {
      issues: [{ path: "startMonth", message: "Bulan tidak valid" }],
    });
  }

  // Memindahkan bulan mulai adalah pelabelan ulang yang seragam: nilai `year`
  // tersimpan tidak berubah dan setiap jumlah tetap sama. Yang tidak boleh
  // bergeser adalah tahun yang sudah ditandatangani — sebuah program APPROVED
  // disetujui terhadap pagu tahun tertentu. Sengaja BUKAN dikunci oleh LPJ:
  // laporan bersumbu bulan kalender, dan menguncinya di sini akan menulis
  // konflasi itu ke dalam kode.
  const approved = PROGRAM.find(
    (row) => isLive(row) && row.status === "APPROVED",
  );

  if (approved) {
    return failure(
      400,
      `Bulan Mulai Tahun Pelayanan Tidak Dapat Diubah Karena Sudah Ada Program Disetujui Untuk Tahun ${approved.year}`,
      {
        code: "BUDGET_YEAR_LOCKED",
        issues: [
          {
            path: "startMonth",
            message: "Bulan mulai tidak dapat diubah lagi",
          },
        ],
      },
    );
  }

  BUDGET_SETTING.startMonth = startMonth;
  isChosen = true;

  return json({
    status: 200,
    message: "Berhasil Mengubah Setelan Anggaran",
    data: data(),
  });
};

export const setelanAnggaranMock: MockHandler = async (ctx) => {
  if (ctx.path !== "/setelan-anggaran") return null;

  if (ctx.method === "GET") {
    return ctx.can(MENU.PAGU_ANGGARAN, "VIEW") ? view() : denied();
  }

  if (ctx.method === "PUT") {
    return ctx.can(MENU.PAGU_ANGGARAN, "UPDATE")
      ? onUpdate(ctx.request)
      : denied();
  }

  return null;
};

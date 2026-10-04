/**
 * Tiruan `/api/v1/setelan-anggaran` (kontrak Anggaran §2). Satu baris, tanpa
 * `:id`. Setiap label tahun pelayanan di grup ini membacanya.
 *
 *   MOCK_BUDGET_START_JULY=1 → bulan mulai Juli (bukan Januari)
 */
import { MENU } from "../../../src/config/menu";
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

const view = () =>
  json({
    status: 200,
    message: "Berhasil Mendapatkan Setelan Anggaran",
    data: {
      startMonth: BUDGET_SETTING.startMonth,
      budgetYear: budgetYearView(currentBudgetYear()),
    },
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

  return json({
    status: 200,
    message: "Berhasil Mengubah Setelan Anggaran",
    data: {
      startMonth: BUDGET_SETTING.startMonth,
      budgetYear: budgetYearView(currentBudgetYear()),
    },
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

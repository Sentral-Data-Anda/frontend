/**
 * Tiruan `/api/v1/setelan-anggaran` (kontrak Anggaran §2). Satu baris, tanpa
 * `:id`. Setiap label tahun pelayanan di grup ini membacanya.
 *
 *   MOCK_BUDGET_START_JULY=1 → bulan mulai Juli (bukan Januari)
 */
import { MENU } from "../../../src/config/menu";
import {
  BUDGET_ALLOCATION,
  BUDGET_SETTING,
  budgetYearView,
  currentBudgetYear,
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

  // Mengubah bulan mulai menggeser arti setiap label tahun yang sudah
  // tersimpan, jadi ia terkunci begitu ada satu baris pagu — bentuk yang sama
  // dengan ACCOUNT_TYPE_LOCKED.
  if (BUDGET_ALLOCATION.length > 0) {
    const year = BUDGET_ALLOCATION[0]?.year ?? currentBudgetYear();

    return failure(
      400,
      `Bulan Mulai Tahun Pelayanan Tidak Dapat Diubah Karena Sudah Ada Pagu Anggaran Tahun ${year}`,
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

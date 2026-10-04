import { z } from "zod";

import {
  MENU,
  createHref,
  detailHref,
  editHref,
  menuHref,
} from "@/config/menu";
import type { TaggedPart } from "@/features/anggaran/shared";
import type { ListFilterSchema } from "@/hooks/use-list-params";
import { FetchError } from "@/lib/api/fetcher";
import { addMonths, monthLabel, monthOptions } from "@/lib/date";
import { formatRupiah } from "@/lib/format";
import type { CeilingUsage } from "@/types/anggaran";

import type {
  BudgetAllocation,
  BudgetAllocationBatchPayload,
  BudgetAllocationDetail,
  BudgetAllocationPayload,
  BudgetSetting,
  YearProgram,
} from "./types";

export const PAGU_LIST_PATH = menuHref(MENU.ANGGARAN, MENU.PAGU_ANGGARAN);

export const PAGU_CREATE_PATH = createHref(MENU.ANGGARAN, MENU.PAGU_ANGGARAN);

export const allocationDetailHref = (publicId: string) =>
  detailHref(MENU.ANGGARAN, MENU.PAGU_ANGGARAN, publicId);

export const allocationEditHref = (publicId: string) =>
  editHref(MENU.ANGGARAN, MENU.PAGU_ANGGARAN, publicId);

export const programDetailHref = (publicId: string) =>
  detailHref(MENU.ANGGARAN, MENU.PROGRAM, publicId);

export const LIST_FILTERS = {
  tahun: { api: "year" },
  komisi: { api: "bapelId" },
} satisfies ListFilterSchema;

export const NO_VIEW = "Peran Anda tidak memiliki akses ke Pagu Anggaran.";

export const EMPTY_TITLE = "Belum ada pagu anggaran";

export const EMPTY_DESCRIPTION =
  "Pagu adalah batas yang diukur setiap usulan program.";

export const CEILING_UNSET = "Belum ditetapkan";

export const SECTION_NOTE =
  "Angka ini milik Majelis Jemaat. Komisi tidak bisa mengubahnya.";

export const ANY_SOURCE_NOTE =
  "Pagu membatasi seluruh belanja komisi tahun ini, termasuk uang yang dicari komisi sendiri dan dana khusus. Bila Majelis mengizinkan komisi membelanjakan lebih, Majelis menaikkan pagunya dalam keputusan yang sama.";

export const FORM_NOTE = `${ANY_SOURCE_NOTE} Angka ini milik Majelis Jemaat. Komisi tidak bisa mengubahnya.`;

export const AMOUNT_HINT =
  "Batas belanja komisi ini sepanjang tahun. Usulan yang jatuh tepat di batas tetap diterima.";

export const THREE_NUMBERS_NOTE =
  "Program disetujui = yang sudah dijanjikan ke program. Dicairkan = uang yang sudah keluar lewat Kas Keluar. Dilaporkan = yang komisi pertanggungjawabkan dan tiga orang tanda tangani. Ketiganya boleh berbeda.";

export const SETTING_MISSING_TITLE =
  "Bulan mulai tahun pelayanan belum dipilih";

export const SETTING_MISSING_MESSAGE =
  "Semua label tahun memakai Januari–Desember sampai dipilih.";

export const SETTING_REVERSIBLE_HINT =
  "Masih bisa diubah selama belum ada program yang disetujui.";

export const UNTAGGED_LABEL = "Pengeluaran tanpa komisi";

export const UNTAGGED_HINT =
  "Kas Keluar yang sudah dibayar tanpa komisi — tagihan gereja, gaji, dan yang belum ditandai.";

export const DISBURSED_PANEL_LABEL = "Dicairkan per komisi tahun ini";

export const BAR_ALERT_ABOVE = 80;

export const MAX_BATCH_ROWS = 50;

export const startMonthOptions = () =>
  monthOptions()
    .slice(0, 12)
    .map((month) => ({
      value: String(Number(month.value.slice(5, 7))),
      label: month.label.replace(/ \d{4}$/, ""),
    }))
    .sort((left, right) => Number(left.value) - Number(right.value));

export const budgetYearSentence = (year: number, startMonth: number) => {
  const from = `${year}-${String(startMonth).padStart(2, "0")}-01`;
  const to = addMonths(from, 11).slice(0, 7);

  return `Tahun pelayanan ${year} berarti ${monthLabel(from.slice(0, 7))} sampai ${monthLabel(to)}.`;
};

type YearOption = { year: number; label: string };

// Tab memakai bilangan tahunnya, dan labelnya yang panjang dari server dipakai
// utuh di subjudul: empat label "2026/2027 (Juli 2026 - Juni 2027)" saling
// menimpa di lebar 360-390.
export const yearTabOptions = (years: readonly YearOption[]) =>
  years.map((budgetYear) => ({
    value: String(budgetYear.year),
    label: String(budgetYear.year),
  }));

export const yearSelectOptions = (years: readonly YearOption[]) =>
  years.map((budgetYear) => ({
    value: String(budgetYear.year),
    label: budgetYear.label,
  }));

export const yearLabelOf = (years: readonly YearOption[], year: string) =>
  years.find((budgetYear) => String(budgetYear.year) === year)?.label ?? "";

export const pickYear = (filter: string, setting?: BudgetSetting) =>
  filter || (setting ? String(setting.budgetYear.year) : "");

export const amountText = (value: string | null) =>
  value === null ? CEILING_UNSET : formatRupiah(Number(value));

export const percentOf = (usage: CeilingUsage) =>
  usage.ceiling === null || Number(usage.ceiling) <= 0
    ? 0
    : (Number(usage.reported) / Number(usage.ceiling)) * 100;

export const barMetaOf = (usage: CeilingUsage) =>
  `${formatRupiah(Number(usage.reported))} dari ${amountText(usage.ceiling)}`;

export const percentText = (usage: CeilingUsage) =>
  `${Math.round(percentOf(usage))}%`;

export const barTitleOf = (name: string) =>
  `${name}: Dilaporkan terhadap pagu, dari laporan pemakaian budget yang sudah disetujui`;

export const heldByProgram = (program: YearProgram) =>
  program.budgetAmount ?? program.proposedAmount;

export const taggedParts = (rows: readonly BudgetAllocation[]): TaggedPart[] =>
  rows.map((row) => ({
    key: row.publicId,
    label: row.bapel?.name ?? "—",
    amount: row.usage.disbursed,
    href: allocationDetailHref(row.publicId),
  }));

export const untaggedOf = (rows: readonly BudgetAllocation[]) =>
  rows[0]?.usage.untagged ?? "0";

export const allocationDeleteText = (
  allocation: Pick<BudgetAllocationDetail, "bapel" | "budgetYear">,
) =>
  `Apakah Anda ingin menghapus pagu anggaran ${allocation.bapel?.name ?? "komisi ini"} tahun ${allocation.budgetYear.label}? Baris ini dihapus permanen.`;

const ERROR_FIX: Record<string, string> = {
  CEILING_IN_USE: "Ubah nominalnya di form ini, jangan hapus barisnya.",
  BUDGET_YEAR_LOCKED:
    "Sudah ada program yang disetujui untuk tahun pelayanan ini. Memindahkan bulan mulai akan mengubah periode yang sudah disetujui Majelis.",
};

export const errorFixOf = (error: unknown) =>
  error instanceof FetchError && error.code
    ? (ERROR_FIX[error.code] ?? null)
    : null;

const MONEY_MAX = 9_999_999_999_999;

export const allocationFormSchema = z
  .object({
    bapelId: z.string(),
    year: z.string(),
    amount: z.string(),
  })
  .superRefine((values, ctx) => {
    const addIssue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: "custom", path, message });

    if (!values.bapelId) addIssue(["bapelId"], "Pilih komisi");
    if (!values.year) addIssue(["year"], "Pilih tahun pelayanan");

    amountIssues(values.amount).forEach((message) =>
      addIssue(["amount"], message),
    );
  });

export type AllocationFormValues = z.infer<typeof allocationFormSchema>;

export const batchFormSchema = z
  .object({
    year: z.string(),
    items: z.array(z.object({ bapelId: z.string(), amount: z.string() })),
  })
  .superRefine((values, ctx) => {
    const addIssue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: "custom", path, message });

    if (!values.year) addIssue(["year"], "Pilih tahun pelayanan");
    if (values.items.length === 0) {
      addIssue(["items"], "Tambahkan minimal satu baris");
    } else if (values.items.length > MAX_BATCH_ROWS) {
      addIssue(["items"], `Maksimal ${MAX_BATCH_ROWS} baris sekali kirim`);
    }

    const seen = new Set<string>();

    values.items.forEach((item, index) => {
      if (!item.bapelId) addIssue(["items", index, "bapelId"], "Pilih komisi");
      else if (seen.has(item.bapelId)) {
        addIssue(
          ["items", index, "bapelId"],
          "Komisi ini sudah ada di baris sebelumnya",
        );
      } else seen.add(item.bapelId);

      amountIssues(item.amount).forEach((message) =>
        addIssue(["items", index, "amount"], message),
      );
    });
  });

export type BatchFormValues = z.infer<typeof batchFormSchema>;

export const emptyBatchRow = (): BatchFormValues["items"][number] => ({
  bapelId: "",
  amount: "",
});

export const emptyAllocationForm = (year: string): AllocationFormValues => ({
  bapelId: "",
  year,
  amount: "",
});

export const emptyBatchForm = (year: string): BatchFormValues => ({
  year,
  items: [emptyBatchRow(), emptyBatchRow()],
});

export const toAllocationForm = (
  allocation: BudgetAllocationDetail,
): AllocationFormValues => ({
  bapelId: String(allocation.bapelId),
  year: String(allocation.year),
  amount: String(Number(allocation.amount)),
});

export const toAllocationPayload = (
  values: AllocationFormValues,
): BudgetAllocationPayload => ({
  bapelId: Number(values.bapelId),
  year: Number(values.year),
  amount: values.amount,
});

export const toBatchPayload = (
  values: BatchFormValues,
): BudgetAllocationBatchPayload => ({
  year: Number(values.year),
  items: values.items.map((item) => ({
    bapelId: Number(item.bapelId),
    amount: item.amount,
  })),
});

function amountIssues(amount: string): string[] {
  if (!amount) return ["Isi pagu anggaran"];

  const value = Number(amount);

  if (Number.isNaN(value) || value <= 0) {
    return ["Pagu anggaran harus lebih dari 0"];
  }
  if (value > MONEY_MAX) return ["Pagu anggaran maksimal 13 digit"];
  if ((amount.split(".")[1] ?? "").length > 2) {
    return ["Pagu anggaran maksimal 2 angka di belakang koma"];
  }

  return [];
}

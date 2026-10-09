import { z } from "zod";

import {
  MENU,
  createHref,
  detailHref,
  editHref,
  menuHref,
  type MenuSlug,
} from "@/config/menu";
import type { ListFilterSchema } from "@/hooks/use-list-params";
import { FetchError } from "@/lib/api/fetcher";
import { formatAmount, formatDateTime } from "@/lib/format";
import { lineAmountText, sumAmounts } from "@/lib/number";
import type { CeilingUsage } from "@/types/anggaran";

import type {
  Program,
  ProgramApproval,
  ProgramApprovalStep,
  ProgramDetail,
  ProgramPayload,
} from "./types";

export const PROGRAM_LIST_PATH = menuHref(MENU.BUDGETING, MENU.PROGRAM);

export const PROGRAM_CREATE_PATH = createHref(MENU.BUDGETING, MENU.PROGRAM);

export const programDetailHref = (publicId: string) =>
  detailHref(MENU.BUDGETING, MENU.PROGRAM, publicId);

export const programEditHref = (publicId: string) =>
  editHref(MENU.BUDGETING, MENU.PROGRAM, publicId);

export const approvalHref = (publicId: string) =>
  detailHref(MENU.APPROVAL, MENU.APPROVAL_REQUEST, publicId);

export const reportDetailHref = (publicId: string) =>
  detailHref(MENU.REPORT, MENU.BUDGET_REALIZATION, publicId);

export const ceilingHref = (bapelId: number, year: number) =>
  `${menuHref(MENU.BUDGETING, MENU.BUDGET)}?komisi=${bapelId}&tahun=${year}`;

export const expenseHref = (bapelId: number) =>
  `${menuHref(MENU.FINANCE, MENU.KAS_KELUAR)}?badan=${bapelId}`;

export const LIST_FILTERS = {
  tahun: { api: "year" },
  komisi: { api: "bapelId" },
} satisfies ListFilterSchema;

export const NO_VIEW = "Peran Anda tidak memiliki akses ke Program.";

export const EMPTY_TITLE = "Belum ada program";

export const EMPTY_DESCRIPTION =
  "Usulan program diukur terhadap pagu anggaran badan pelayanan.";

export const YEAR_UNREADABLE_TITLE = "Tahun pelayanan belum bisa dibaca";

export const YEAR_UNREADABLE_MESSAGE =
  "Peran Anda belum bisa membaca setelan tahun pelayanan, jadi daftar tahunnya kosong. Hubungi pengelola sistem.";

export const CEILING_NOTE =
  "Terpakai = total yang sudah dijanjikan ke program tahun ini, bukan uang yang sudah keluar.";

export const CEILING_MISSING_TITLE =
  "Pagu anggaran badan pelayanan ini belum ada";

export const ceilingMissingMessage = (label: string) =>
  `Majelis Jemaat belum menetapkan pagu anggaran badan pelayanan ini untuk tahun ${label}. Pengajuan akan ditolak.`;

export const ceilingExceededMessage = (remaining: string) =>
  `Usulan ini melebihi sisa pagu ${formatAmount(remaining)}.`;

export const UNTAGGED_LABEL = "Tanpa program";

export const UNTAGGED_HINT =
  "Pemakaian yang dilaporkan badan pelayanan tanpa menyebut program — konsumsi rapat, fotokopi, dan belanja di luar program.";

export const REPORTED_PANEL_LABEL = "Dilaporkan ke program ini";

export const REPORTED_EMPTY =
  "Belum ada pemakaian yang dilaporkan untuk program ini.";

export const DISBURSED_LABEL = "Dicairkan ke badan pelayanan";

export const REJECTED_TITLE = "Ditolak. Perbaiki lalu ajukan lagi.";

export const REJECTED_FALLBACK = "Penanda tangan tidak menuliskan catatan.";

export const SPAN_NOTE =
  "Kegiatan yang melewati akhir tahun pelayanan dibuat sebagai dua program, satu per tahun, masing-masing terhadap pagunya sendiri.";

export const UNPLANNED_NOTE =
  "Program yang diajukan di tengah periode. Butuh satu tanda tangan tambahan.";

export const ITEM_NOTE =
  "Untuk belanja barang inventaris, pilih pos aset tetap, bukan pos beban.";

export const PROPOSAL_NOTE =
  "Usulan disimpan sebagai Draf. Pagu diperiksa saat Ajukan, bukan saat Simpan.";

export const CANCEL_HINT =
  "Alasan ini tersimpan dan ditampilkan di halaman ini.";

export const BAR_ALERT_ABOVE = 80;

export const UNPLANNED_OPTIONS = [
  { value: "0", label: "Tidak" },
  { value: "1", label: "Ya" },
] as const;

export const STATUS_TABS = [
  { value: "", label: "Semua" },
  { value: "DRAFT", label: "Draf" },
  { value: "PENDING_APPROVAL", label: "Menunggu" },
  { value: "APPROVED", label: "Disetujui" },
  { value: "CANCELLED", label: "Dibatalkan" },
] as const;

const TAB_QUERY: Record<string, { status: string; isPending?: string }> = {
  DRAFT: { status: "DRAFT", isPending: "0" },
  PENDING_APPROVAL: { status: "DRAFT", isPending: "1" },
  APPROVED: { status: "APPROVED" },
  CANCELLED: { status: "CANCELLED" },
};

export const toProgramQuery = (
  status: string,
  filters: Record<string, string>,
  year: string,
) => {
  const tab = TAB_QUERY[status];

  return {
    status: tab?.status ?? "",
    apiFilters: {
      year,
      bapelId: filters.komisi ?? "",
      isPendingApproval: tab?.isPending ?? "",
    },
  };
};

type YearOption = { year: number; label: string };

export const yearSelectOptions = (years: readonly YearOption[]) =>
  years.map((budgetYear) => ({
    value: String(budgetYear.year),
    label: budgetYear.label,
  }));

export const yearLabelOf = (years: readonly YearOption[], year: string) =>
  years.find((budgetYear) => String(budgetYear.year) === year)?.label ?? "";

export type ProgramState =
  "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "CANCELLED";

export const programStateOf = (program: {
  status: Program["status"];
  approval: ProgramApproval | null;
}): ProgramState =>
  program.status === "DRAFT" && program.approval?.status === "PENDING"
    ? "PENDING_APPROVAL"
    : program.status;

export const pendingStepText = (approval: ProgramApproval) =>
  `Menunggu persetujuan (${approval.currentOrder} dari ${approval.steps.length})`;

const PROGRAM_STATE_LABEL: Record<ProgramState, string> = {
  DRAFT: "Draf",
  PENDING_APPROVAL: "Menunggu persetujuan",
  APPROVED: "Disetujui",
  CANCELLED: "Dibatalkan",
};

export const programStateLabel = (program: {
  status: Program["status"];
  approval: ProgramApproval | null;
}) => {
  if (programStateOf(program) !== "PENDING_APPROVAL" || !program.approval) {
    return PROGRAM_STATE_LABEL[programStateOf(program)];
  }

  return pendingStepText(program.approval);
};

export const rejectedTitleOf = (step: ProgramApprovalStep) =>
  [
    "Ditolak",
    step.actor?.name,
    step.approverRoleName,
    step.actedAt ? formatDateTime(step.actedAt) : null,
  ]
    .filter(Boolean)
    .join(" · ");

export const rejectedMessageOf = (step: ProgramApprovalStep) =>
  `${step.note ?? REJECTED_FALLBACK} Perbaiki lalu ajukan lagi.`;

export const cancelledTitleOf = (program: {
  cancelledBy: { name: string } | null;
  cancelledAt: string | null;
}) =>
  [
    "Dibatalkan",
    program.cancelledBy?.name,
    program.cancelledAt ? formatDateTime(program.cancelledAt) : null,
  ]
    .filter(Boolean)
    .join(" · ");

export const rejectedStepOf = (approval: ProgramApproval | null) =>
  approval?.status === "REJECTED"
    ? (approval.steps.find((step) => step.status === "REJECTED") ?? null)
    : null;

export const amountText = (value: string | null) =>
  value === null ? "Belum ditetapkan" : formatAmount(value);

export const isCeilingMissing = (ceiling: CeilingUsage) =>
  ceiling.ceiling === null;

export const isCeilingExceeded = (ceiling: CeilingUsage) =>
  ceiling.ceiling !== null && !ceiling.isWithinCeiling;

export const remainingBeforeOf = (ceiling: CeilingUsage, proposed: string) =>
  ceiling.remaining === null
    ? "0"
    : String(Number(ceiling.remaining) + Number(proposed));

export const committedPercentOf = (ceiling: CeilingUsage) =>
  ceiling.ceiling === null || Number(ceiling.ceiling) <= 0
    ? 0
    : (Number(ceiling.committed) / Number(ceiling.ceiling)) * 100;

export const ceilingBarMeta = (ceiling: CeilingUsage) =>
  `${formatAmount(ceiling.committed)} dari ${amountText(ceiling.ceiling)}`;

export const ceilingBarTitle =
  "Dijanjikan ke program tahun ini terhadap pagu anggaran badan pelayanan";

export const programDeleteText = (program: Pick<ProgramDetail, "name">) =>
  `Apakah Anda ingin menghapus usulan ${program.name}? Usulan yang sudah diajukan tidak bisa dihapus.`;

export const programSubmitText =
  "Apakah Anda ingin mengajukan usulan ini untuk ditandatangani? Usulan tidak bisa diubah selama menunggu.";

export const programWithdrawText =
  "Apakah Anda ingin menarik pengajuan ini? Usulan kembali menjadi Draf dan bisa disunting.";

export const cancelDialogText = (remaining: string) =>
  `Pagu badan pelayanan sebesar ${formatAmount(remaining)} akan kembali tersedia untuk usulan lain.`;

export type ErrorFix = { menu: MenuSlug; label: string; href: string };

export type FixTarget = { bapelId: number; year: number };

const ERROR_FIX: Record<string, (target: FixTarget) => ErrorFix> = {
  CEILING_MISSING: (target) => ({
    menu: MENU.BUDGET,
    label: "Lihat Pagu Anggaran",
    href: ceilingHref(target.bapelId, target.year),
  }),
  CEILING_EXCEEDED: (target) => ({
    menu: MENU.BUDGET,
    label: "Lihat Pagu Anggaran",
    href: ceilingHref(target.bapelId, target.year),
  }),
  NO_WORKFLOW: () => ({
    menu: MENU.APPROVAL_WORKFLOW,
    label: "Lihat Setelan Alur Persetujuan",
    href: menuHref(MENU.APPROVAL, MENU.APPROVAL_WORKFLOW),
  }),
  NO_POSITION_HOLDER: () => ({
    menu: MENU.ROLE_JEMAAT,
    label: "Lihat Role Jemaat",
    href: menuHref(MENU.KEJEMAATAN, MENU.ROLE_JEMAAT),
  }),
  ACCOUNT_INACTIVE: () => ({
    menu: MENU.CHART_OF_ACCOUNT,
    label: "Lihat Akun",
    href: menuHref(MENU.FINANCE, MENU.CHART_OF_ACCOUNT),
  }),
};

export const errorFixOf = (
  error: unknown,
  target: FixTarget,
): ErrorFix | null =>
  error instanceof FetchError && error.code
    ? (ERROR_FIX[error.code]?.(target) ?? null)
    : null;

const MONEY_MAX = 9_999_999_999_999;

const NAME_MAX = 150;

const TEXT_MAX = 250;

const numberIssues = (value: string, noun: string): string[] => {
  if (!value) return [`Isi ${noun}`];

  const amount = Number(value);

  if (Number.isNaN(amount) || amount <= 0) {
    return [`${noun} harus lebih dari 0`];
  }
  if (amount > MONEY_MAX) return [`${noun} maksimal 13 digit`];
  if ((value.split(".")[1] ?? "").length > 2) {
    return [`${noun} maksimal 2 angka di belakang koma`];
  }

  return [];
};

export const programFormSchema = z
  .object({
    name: z.string(),
    bapelId: z.string(),
    year: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    isUnplanned: z.string(),
    description: z.string(),
    items: z.array(
      z.object({
        accountId: z.string(),
        description: z.string(),
        quantity: z.string(),
        unitPrice: z.string(),
        note: z.string(),
      }),
    ),
  })
  .superRefine((values, ctx) => {
    const addIssue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: "custom", path, message });

    if (!values.name.trim()) addIssue(["name"], "Isi nama program");
    else if (values.name.length > NAME_MAX) {
      addIssue(["name"], `Nama program maksimal ${NAME_MAX} karakter`);
    }

    if (!values.bapelId) addIssue(["bapelId"], "Pilih badan pelayanan");
    if (!values.year) addIssue(["year"], "Pilih tahun pelayanan");

    if (
      values.startDate &&
      values.endDate &&
      values.endDate < values.startDate
    ) {
      addIssue(
        ["endDate"],
        "Tanggal selesai tidak boleh sebelum tanggal mulai",
      );
    }

    if (values.description.length > TEXT_MAX) {
      addIssue(["description"], `Keterangan maksimal ${TEXT_MAX} karakter`);
    }

    if (values.items.length === 0) {
      addIssue(["items"], "Program harus memiliki minimal 1 rincian anggaran");
    }

    values.items.forEach((item, index) => {
      if (!item.accountId) addIssue(["items", index, "accountId"], "Pilih pos");
      if (!item.description.trim()) {
        addIssue(["items", index, "description"], "Isi uraian");
      }

      numberIssues(item.quantity, "Jumlah").forEach((message) =>
        addIssue(["items", index, "quantity"], message),
      );
      numberIssues(item.unitPrice, "Harga satuan").forEach((message) =>
        addIssue(["items", index, "unitPrice"], message),
      );
    });
  });

export type ProgramFormValues = z.infer<typeof programFormSchema>;

export type ProgramItemValues = ProgramFormValues["items"][number];

export const emptyItem = (): ProgramItemValues => ({
  accountId: "",
  description: "",
  quantity: "1",
  unitPrice: "",
  note: "",
});

export const emptyProgramForm = (year: string): ProgramFormValues => ({
  name: "",
  bapelId: "",
  year,
  startDate: "",
  endDate: "",
  isUnplanned: "0",
  description: "",
  items: [emptyItem()],
});

export const toProgramForm = (program: ProgramDetail): ProgramFormValues => ({
  name: program.name,
  bapelId: String(program.bapelId),
  year: String(program.year),
  startDate: program.startDate ?? "",
  endDate: program.endDate ?? "",
  isUnplanned: program.isUnplanned ? "1" : "0",
  description: program.description ?? "",
  items: program.items.map((item) => ({
    accountId: String(item.accountId),
    description: item.description,
    quantity: String(Number(item.quantity)),
    unitPrice: String(Number(item.unitPrice)),
    note: item.note ?? "",
  })),
});

export const toProgramPayload = (
  values: ProgramFormValues,
): ProgramPayload => ({
  name: values.name.trim(),
  year: Number(values.year),
  bapelId: Number(values.bapelId),
  startDate: values.startDate || null,
  endDate: values.endDate || null,
  isUnplanned: values.isUnplanned === "1",
  description: values.description.trim() || null,
  items: values.items.map((item) => ({
    accountId: Number(item.accountId),
    description: item.description.trim(),
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    note: item.note.trim() || null,
  })),
});

export const formTotal = (items: readonly ProgramItemValues[]) =>
  sumAmounts(
    items.map((item) => lineAmountText(item.quantity, item.unitPrice) ?? "0"),
  );

import type { ComponentProps } from "react";
import { z } from "zod";

import type { Badge } from "@/components/common/display";
import { MENU, menuHref } from "@/config/menu";
import type { ListState } from "@/hooks/use-list-params";
import { daysSince } from "@/lib/date";
import {
  APPROVAL_DOCUMENT_LABEL,
  APPROVAL_DOCUMENT_TYPES,
} from "@/types/persetujuan";

import type {
  ApprovalRequest,
  ApprovalStep,
  ApprovalView,
  StepState,
} from "./types";

type BadgeVariant = ComponentProps<typeof Badge>["variant"];

export const PERMINTAAN_LIST_PATH = menuHref(
  MENU.PERSETUJUAN,
  MENU.PERMINTAAN_PERSETUJUAN,
);

export const VIEW_PARAM = "tampil";

export const LIST_FILTERS = { jenis: { api: "documentType" } };

export const VIEW_OPTIONS = [
  { value: "", label: "Menunggu" },
  { value: "pengajuan", label: "Pengajuan" },
  { value: "riwayat", label: "Riwayat" },
];

export const viewOf = (value: string | null | undefined): ApprovalView =>
  value === "pengajuan" || value === "riwayat" ? value : "menunggu";

const READING: Record<ApprovalView, Record<string, string>> = {
  menunggu: { menunggu: "saya" },
  pengajuan: {},
  riwayat: { diproses: "saya" },
};

export const toPermintaanParams = (
  params: ListState,
  view: ApprovalView,
): ListState => ({
  ...params,
  search: "",
  status: view === "pengajuan" ? params.status : "",
  apiFilters: { ...READING[view], ...params.apiFilters },
});

export const STATUS_FILTER_OPTIONS = [
  { value: "", label: "Semua" },
  { value: "PENDING", label: "Menunggu" },
  { value: "APPROVED", label: "Disetujui" },
  { value: "REJECTED", label: "Ditolak" },
  { value: "CANCELLED", label: "Ditarik" },
];

export const DOCUMENT_FILTER_OPTIONS = [
  { value: "", label: "Semua jenis" },
  ...APPROVAL_DOCUMENT_TYPES.map((type) => ({
    value: type,
    label: APPROVAL_DOCUMENT_LABEL[type],
  })),
];

export const STEP_STATE_LABEL: Record<StepState, string> = {
  approved: "Disetujui",
  rejected: "Ditolak",
  waiting: "Menunggu tanda tangan",
  upcoming: "Belum sampai",
  skipped: "Tidak diproses",
};

export const STEP_STATE_VARIANT: Record<StepState, BadgeVariant> = {
  approved: "success",
  rejected: "due",
  waiting: "wait",
  upcoming: "neutral",
  skipped: "neutral",
};

export function stepStateOf(
  request: Pick<ApprovalRequest, "status" | "currentOrder">,
  step: Pick<ApprovalStep, "status" | "order">,
): StepState {
  if (step.status === "APPROVED") return "approved";
  if (step.status === "REJECTED") return "rejected";
  if (request.status !== "PENDING") return "skipped";

  return step.order === request.currentOrder ? "waiting" : "upcoming";
}

export const approverLabel = (step: ApprovalStep): string =>
  step.approverRoleUser
    ? step.approverRoleUser.name
    : [step.approverRoleName, step.approverBapel?.name]
        .filter(Boolean)
        .join(" · ") || "Penanda tangan tidak dikenal";

export const documentTitle = (
  request: Pick<ApprovalRequest, "documentType" | "document">,
): string => {
  const label = APPROVAL_DOCUMENT_LABEL[request.documentType];

  return request.document ? `${label} · ${request.document.code}` : label;
};

export const currentStepOf = (request: ApprovalRequest) =>
  request.steps.find((step) => step.order === request.currentOrder);

export const stagePosition = (request: ApprovalRequest): string => {
  const index = request.steps.findIndex(
    (step) => step.order === request.currentOrder,
  );

  return `${index + 1} dari ${request.steps.length}`;
};

export const stageLabel = (request: ApprovalRequest): string => {
  const step = currentStepOf(request);

  return step
    ? `${stagePosition(request)} · ${approverLabel(step)}`
    : stagePosition(request);
};

export const waitingAge = (submittedAt: string, now: Date): string => {
  const days = daysSince(submittedAt, now);

  return days === 0 ? "hari ini" : `${days} hari`;
};

export const submitterName = (request: ApprovalRequest): string =>
  request.submitter?.name ?? "Pengaju tidak dikenal";

export const VIEW_COPY: Record<
  ApprovalView,
  { subtitle: (count: number) => string; title: string; description: string }
> = {
  menunggu: {
    subtitle: (count) => `${count} menunggu tanda tangan Anda`,
    title: "Tidak ada yang menunggu tanda tangan Anda",
    description: "Permintaan yang perlu Anda setujui akan muncul di sini.",
  },
  pengajuan: {
    subtitle: (count) => `${count} pengajuan`,
    title: "Anda belum mengajukan dokumen",
    description:
      "Dokumen yang Anda ajukan dari menu lain akan tampil di sini beserta posisinya.",
  },
  riwayat: {
    subtitle: (count) => `${count} sudah Anda proses`,
    title: "Belum ada yang Anda proses",
    description:
      "Permintaan yang Anda setujui atau tolak akan tercatat di sini.",
  },
};

export const FILTERED_EMPTY = "Tidak ada permintaan dengan filter ini";

export const rejectSchema = z.object({
  note: z
    .string()
    .trim()
    .min(
      1,
      "Isi alasan penolakan supaya pengaju tahu apa yang harus diperbaiki.",
    )
    .max(250, "Alasan maksimal 250 karakter"),
});

export type RejectFormValues = z.infer<typeof rejectSchema>;

export const REJECT_HINT =
  "Tulis apa yang harus diperbaiki pengaju. Maksimal 250 karakter.";

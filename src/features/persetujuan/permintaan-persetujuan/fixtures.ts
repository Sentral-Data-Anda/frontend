import type { ApprovalDetail, ApprovalStep } from "./types";

const step = (order: number, next: Partial<ApprovalStep>): ApprovalStep => ({
  publicId: `step-${order}`,
  order,
  approverRoleName: null,
  approverRoleUser: null,
  approverBapel: null,
  status: "PENDING",
  note: null,
  actedAt: null,
  actor: null,
  ...next,
});

export const DETAIL_ID = "0b5e7a00-0000-4000-a000-000000000002";

export const approvalDetail = (
  next: Partial<ApprovalDetail> = {},
): ApprovalDetail => ({
  publicId: DETAIL_ID,
  code: "PST-2026-0002",
  documentType: "CASH_EXPENSE",
  amount: "4500000",
  status: "PENDING",
  currentOrder: 2,
  submittedAt: "2026-09-24T09:00:00.000Z",
  completedAt: null,
  createdAt: "2026-09-24T09:00:00.000Z",
  updatedAt: null,
  config: { publicId: "cfg-1", name: "Kas keluar di atas Rp 1 juta" },
  document: {
    publicId: "doc-1",
    code: "CAS-2026-0014",
    title: "Konsumsi rapat majelis Oktober",
  },
  submitter: { name: "Daniel Panjaitan" },
  steps: [
    step(1, {
      approverRoleUser: { publicId: "role-4", name: "Bendahara" },
      status: "APPROVED",
      actedAt: "2026-09-24T12:00:00.000Z",
      actor: { name: "Pnt. Rudolf Nainggolan" },
    }),
    step(2, {
      approverRoleName: "Ketua",
      approverBapel: {
        publicId: "bapel-1",
        code: "BPL-1",
        name: "Majelis Jemaat",
      },
    }),
  ],
  canSign: true,
  canWithdraw: false,
  ...next,
});

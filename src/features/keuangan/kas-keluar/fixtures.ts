import type { CashExpenseDetail, ExpenseApproval } from "./types";

export const expenseApproval = (
  next: Partial<ExpenseApproval> = {},
): ExpenseApproval => ({
  publicId: "0b5e7a00-0000-4000-a000-000000000007",
  code: "PST-2026-0007",
  status: "PENDING",
  note: null,
  isSubmittedByViewer: true,
  ...next,
});

export const expenseDetail = (
  next: Partial<CashExpenseDetail> = {},
): CashExpenseDetail => ({
  id: 1,
  publicId: "doc-7",
  code: "BKK-2026-0001",
  expenseDate: "2026-09-29T00:00:00.000Z",
  description: "Perbaikan pompa air gedung serbaguna",
  payee: "CV Tirta Nusantara",
  paidFromAccountId: 4,
  paidFromAccount: { id: 4, code: "1-200", name: "Bank BCA" },
  bapelId: null,
  bapel: null,
  bapelChoice: "BUKAN_KOMISI",
  method: "Transfer",
  reference: "PSN-2026-0012",
  totalAmount: "3200000",
  status: "DRAFT",
  approval: null,
  approvedBy: null,
  approvedAt: null,
  lines: [
    {
      publicId: "cel-1",
      accountId: 22,
      account: { code: "5-100", name: "Beban Listrik dan Air" },
      amount: "3200000",
      description: "Servis dan penggantian impeler",
    },
  ],
  attachments: [],
  journal: null,
  cancelReason: null,
  ...next,
});

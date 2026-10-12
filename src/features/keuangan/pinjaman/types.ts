export type LoanDirection = "BORROWED" | "LENT";

export type LoanInterestMode =
  "NONE" | "FLAT_TOTAL" | "FLAT_MONTHLY" | "DECLINING";

export type LoanStatus = "ACTIVE" | "SETTLED" | "CANCELLED";

export type Loan = {
  publicId: string;
  code: string;
  direction: LoanDirection;
  counterpartyName: string;
  jemaatId: number | null;
  jemaat: { code: string; name: string } | null;
  principal: string;
  agreementDate: string;
  dueDate: string | null;
  termMonths: number;
  interestMode: LoanInterestMode;
  interestPercent: string | null;
  interestAmount: string;
  status: LoanStatus;
  notes: string | null;
};

export type LoanScheduleRow = {
  month: number;
  principal: string;
  interest: string;
  total: string;
};

/** Apa yang sudah dibukukan kas terhadap pinjaman ini. */
export type LoanSettlement = {
  disbursed: string;
  principalPaid: string;
  principalOutstanding: string;
  interestPaid: string;
  interestOutstanding: string;
  isFullyDisbursed: boolean;
};

export type LoanLine = {
  publicId: string;
  amount: string;
  loanPortion: "PRINCIPAL" | "INTEREST" | null;
  description: string | null;
};

export type LoanReceiptLine = LoanLine & {
  cashReceipt: { publicId: string; code: string; receiptDate: string };
};

export type LoanExpenseLine = LoanLine & {
  cashExpense: { publicId: string; code: string; expenseDate: string };
};

export type LoanDetail = Loan & {
  schedule: LoanScheduleRow[];
  settlement: LoanSettlement;
  lines: { receipts: LoanReceiptLine[]; expenses: LoanExpenseLine[] };
};

export type LoanPayload = {
  direction: LoanDirection;
  counterpartyName: string;
  jemaatId: number | null;
  principal: string;
  agreementDate: string;
  termMonths: number;
  interestMode: LoanInterestMode;
  interestPercent: number | null;
  notes: string | null;
};

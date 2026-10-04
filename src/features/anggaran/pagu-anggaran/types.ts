import type {
  BapelRef,
  BudgetYear,
  CeilingUsage,
  ProgramStatus,
} from "@/types/anggaran";

export type BudgetAllocation = {
  publicId: string;
  year: number;
  budgetYear: BudgetYear;
  amount: string;
  bapel: BapelRef | null;
  usage: CeilingUsage;
};

export type BudgetAllocationDetail = BudgetAllocation & {
  bapelId: number;
};

export type BudgetAllocationPayload = {
  bapelId: number;
  year: number;
  amount: string;
};

export type BudgetAllocationBatchPayload = {
  year: number;
  items: { bapelId: number; amount: string }[];
};

export type BudgetSetting = {
  startMonth: number | null;
  budgetYear: BudgetYear;
  budgetYears: BudgetYear[];
};

export type BudgetSettingPayload = {
  startMonth: number;
};

export type YearProgram = {
  publicId: string;
  code: string;
  name: string;
  status: ProgramStatus;
  proposedAmount: string;
  budgetAmount: string | null;
};

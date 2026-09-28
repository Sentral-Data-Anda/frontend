export type RunStatus = "DRAFT" | "POSTED";

export type Run = {
  publicId: string;
  code: string;
  year: number;
  month: number;
  status: RunStatus;
  totalAmount: string;
  postedAt: string | null;
  updatedAt: string | null;
  entryCount: number;
};

export type RunEntry = {
  publicId: string;
  assetId: number;
  amount: string;
  accumulatedAfter: string;
  bookValueAfter: string;
  asset: { publicId: string; code: string; name: string };
};

export type RunDetail = Omit<Run, "entryCount"> & {
  entries: RunEntry[];
  journal: { code: string } | null;
};

export type RunPayload = { year: number; month: number };

export type RunAction = "calculate" | "post";

export const RUN_STATUS_LABEL: Record<RunStatus, string> = {
  DRAFT: "Draf",
  POSTED: "Diposting",
};

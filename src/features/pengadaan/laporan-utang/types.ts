export const BUCKETS = [
  { key: "current", label: "Belum jatuh tempo" },
  { key: "d1to30", label: "1–30 hari" },
  { key: "d31to60", label: "31–60 hari" },
  { key: "d61to90", label: "61–90 hari" },
  { key: "over90", label: "> 90 hari" },
] as const;

export type BucketKey = (typeof BUCKETS)[number]["key"];

export type Buckets = Record<BucketKey, string>;

export type ApAgeingRow = {
  supplier: { id: number; code: string; name: string };
  buckets: Buckets;
  invoiceCount: number;
  oldestDueDate: string | null;
  total: string;
};

export type ApAgeing = {
  date: string;
  rows: ApAgeingRow[];
  totals: { buckets: Buckets; total: string };
};

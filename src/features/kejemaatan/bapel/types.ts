export type RuleType = "NO_DAY" | "NO_DATE" | "NO_WEEK" | "NO_TIME";

export const RULE_TYPE_LABEL: Record<RuleType, string> = {
  NO_DAY: "Hari tertentu",
  NO_DATE: "Tanggal tertentu",
  NO_WEEK: "Minggu ke-",
  NO_TIME: "Jam",
};

export const DAY_OF_WEEK_LABEL: Record<string, string> = {
  "0": "Minggu",
  "1": "Senin",
  "2": "Selasa",
  "3": "Rabu",
  "4": "Kamis",
  "5": "Jumat",
  "6": "Sabtu",
};

export const WEEK_OF_MONTH_LABEL: Record<string, string> = {
  "1": "Minggu ke-1",
  "2": "Minggu ke-2",
  "3": "Minggu ke-3",
  "4": "Minggu ke-4",
  "5": "Minggu ke-5",
  "-1": "Minggu terakhir",
};

export type BapelRule = {
  id: number;
  publicId: string;
  type: RuleType;
  dayOfWeek: number | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  weekOfMonth: number | null;
};

export type BapelListItem = {
  id: number;
  publicId: string;
  code: string;
  name: string;
  rules: BapelRule[];
};

export type BapelDetail = BapelListItem;

export type BapelRulePayload =
  | { type: "NO_DAY"; dayOfWeek: number }
  | { type: "NO_DATE"; date: string }
  | { type: "NO_WEEK"; weekOfMonth: number }
  | { type: "NO_TIME"; startTime: string; endTime: string };

export type BapelPayload = {
  name: string;
  rules: BapelRulePayload[];
};

import { z } from "zod";

import { MENU, menuHref } from "@/config/menu";
import { formatDate } from "@/lib/format";

import {
  DAY_OF_WEEK_LABEL,
  RULE_TYPES,
  WEEK_OF_MONTH_LABEL,
  type BapelDetail,
  type BapelPayload,
  type BapelRule,
  type BapelRulePayload,
  type RuleType,
} from "./types";

export const BAPEL_LIST_PATH = menuHref(MENU.KEJEMAATAN, MENU.BAPEL);

const ruleSchema = z.object({
  type: z.enum(RULE_TYPES).or(z.literal("")),
  dayOfWeek: z.string(),
  date: z.string(),
  weekOfMonth: z.string(),
  startTime: z.string(),
  endTime: z.string(),
});

const baseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama wajib diisi")
    .min(4, "Nama minimal 4 karakter")
    .max(25, "Nama maksimal 25 karakter"),
  rules: z.array(ruleSchema),
});

export type BapelFormValues = z.infer<typeof baseSchema>;
export type BapelRuleValues = BapelFormValues["rules"][number];

export const EMPTY_RULE: BapelRuleValues = {
  type: "",
  dayOfWeek: "",
  date: "",
  weekOfMonth: "",
  startTime: "",
  endTime: "",
};

export const EMPTY_BAPEL_FORM: BapelFormValues = { name: "", rules: [] };

const REQUIRED: Record<
  BapelRulePayload["type"],
  ReadonlyArray<[keyof BapelRuleValues, string]>
> = {
  NO_DAY: [["dayOfWeek", "Hari wajib dipilih"]],
  NO_DATE: [["date", "Tanggal wajib diisi"]],
  NO_WEEK: [["weekOfMonth", "Pekan wajib dipilih"]],
  NO_TIME: [
    ["startTime", "Jam mulai wajib diisi"],
    ["endTime", "Jam selesai wajib diisi"],
  ],
};

const ruleKey = (rule: BapelRuleValues): string => {
  if (!rule.type) return "";

  return [rule.type, ...REQUIRED[rule.type].map(([field]) => rule[field])].join(
    "|",
  );
};

export const bapelFormSchema = baseSchema.superRefine((values, ctx) => {
  const seen = new Map<string, number>();

  values.rules.forEach((rule, index) => {
    const addIssue = (field: keyof BapelRuleValues, message: string) =>
      ctx.addIssue({ code: "custom", path: ["rules", index, field], message });

    if (!rule.type) {
      addIssue("type", "Jenis aturan wajib dipilih");
      return;
    }

    const required = REQUIRED[rule.type];
    const missing = required.filter(([field]) => !rule[field]);

    for (const [field, message] of missing) addIssue(field, message);
    if (missing.length > 0) return;

    if (rule.type === "NO_TIME" && rule.endTime <= rule.startTime) {
      addIssue("endTime", "Jam selesai harus lebih dari jam mulai");
      return;
    }

    const twin = seen.get(ruleKey(rule));

    if (twin === undefined) seen.set(ruleKey(rule), index);
    else {
      addIssue(
        required[0][0],
        `Sama dengan aturan ${twin + 1}; hapus salah satu.`,
      );
    }
  });
});

type TypedRule = BapelRuleValues & { type: RuleType };

const isTyped = (rule: BapelRuleValues): rule is TypedRule => rule.type !== "";

const toRulePayload = (rule: TypedRule): BapelRulePayload => {
  switch (rule.type) {
    case "NO_DAY":
      return { type: "NO_DAY", dayOfWeek: Number(rule.dayOfWeek) };
    case "NO_DATE":
      return { type: "NO_DATE", date: rule.date };
    case "NO_WEEK":
      return { type: "NO_WEEK", weekOfMonth: Number(rule.weekOfMonth) };
    case "NO_TIME":
      return {
        type: "NO_TIME",
        startTime: rule.startTime,
        endTime: rule.endTime,
      };
  }
};

export function toBapelPayload(values: BapelFormValues): BapelPayload {
  const unique = new Map(values.rules.map((rule) => [ruleKey(rule), rule]));

  return {
    name: values.name.trim(),
    rules: [...unique.values()].filter(isTyped).map(toRulePayload),
  };
}

export function toBapelForm(detail: BapelDetail): BapelFormValues {
  return {
    name: detail.name,
    rules: detail.rules.map((rule) => ({
      type: rule.type,
      dayOfWeek: rule.dayOfWeek?.toString() ?? "",
      date: rule.date?.slice(0, 10) ?? "",
      weekOfMonth: rule.weekOfMonth?.toString() ?? "",
      startTime: rule.startTime ?? "",
      endTime: rule.endTime ?? "",
    })),
  };
}

const formatTime = (value: string | null) => value?.replace(":", ".") ?? "";

export function ruleLabel(rule: BapelRule): string {
  switch (rule.type) {
    case "NO_DAY":
      return DAY_OF_WEEK_LABEL[String(rule.dayOfWeek)] ?? "";
    case "NO_DATE":
      return rule.date ? formatDate(rule.date) : "";
    case "NO_WEEK":
      return WEEK_OF_MONTH_LABEL[String(rule.weekOfMonth)] ?? "";
    case "NO_TIME":
      return `${formatTime(rule.startTime)}–${formatTime(rule.endTime)}`;
  }
}

export const summarizeRules = (rules: BapelRule[]): string =>
  rules.map(ruleLabel).join(", ");

const SERVER_FIELD_ERROR: ReadonlyArray<
  [RegExp, keyof BapelFormValues, string?]
> = [
  [
    /bapel sudah tersedia/i,
    "name",
    "Nama ini sudah dipakai badan pelayanan lain.",
  ],
];

export function serverFieldError(
  message: string,
): { field: keyof BapelFormValues; message: string } | null {
  for (const [pattern, field, override] of SERVER_FIELD_ERROR) {
    if (pattern.test(message)) {
      return { field, message: override ?? message };
    }
  }

  return null;
}

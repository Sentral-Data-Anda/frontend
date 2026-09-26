import type { SelectOption } from "@/components/common/control";
import { todayJakarta } from "@/lib/date";

import {
  AGE_GROUP_LABEL,
  AGE_GROUPS,
  type AgeRow,
  type Share,
  type TypeGenderRow,
} from "./types";

const countFormat = new Intl.NumberFormat("id-ID");

export const formatCount = (value: number) => countFormat.format(value);

export const percentOf = (count: number, total: number) =>
  total > 0 ? (count / total) * 100 : 0;

export const formatShare = (count: number, total: number) =>
  `${formatCount(count)} (${Math.round(percentOf(count, total))}%)`;

export const totalOf = (shares: Share[]) =>
  shares.reduce((sum, share) => sum + share.count, 0);

export const sortShares = (shares: Share[]): Share[] =>
  [...shares].sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label, "id"),
  );

export const toAgeShares = (rows: AgeRow[]): Share[] =>
  AGE_GROUPS.map((group) => ({
    key: group,
    label: AGE_GROUP_LABEL[group],
    count: rows.find((row) => row.Umur === group)?.Count ?? 0,
  }));

export function summarizeTypeGender(rows: TypeGenderRow[]) {
  const member = rows.find((row) => row.typeJemaat === "ANGGOTA");
  const sympathizer = rows.find((row) => row.typeJemaat === "SIMPATISAN");

  return {
    total: rows.reduce((sum, row) => sum + row.ALL, 0),
    male: rows.reduce((sum, row) => sum + row.L, 0),
    female: rows.reduce((sum, row) => sum + row.P, 0),
    member: member ?? { ALL: 0, L: 0, P: 0 },
    sympathizer: sympathizer ?? { ALL: 0, L: 0, P: 0 },
  };
}

const monthFormat = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  timeZone: "UTC",
});

export const MONTH_OPTIONS: SelectOption[] = Array.from(
  { length: 12 },
  (_, index) => ({
    value: String(index + 1),
    label: monthFormat.format(new Date(Date.UTC(2000, index, 1))),
  }),
);

export function readMonth(value: string | undefined, today = todayJakarta()) {
  const month = Number(value);

  return Number.isInteger(month) && month >= 1 && month <= 12
    ? month
    : Number(today.slice(5, 7));
}

const dayMonthFormat = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

export const formatDayMonth = (iso: string) =>
  dayMonthFormat.format(new Date(iso));

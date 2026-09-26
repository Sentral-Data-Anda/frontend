"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchList, fetchOne } from "@/lib/api/fetcher";
import { BLOOD_TYPE_LABEL, LAST_EDUCATION_LABEL } from "@/types/jemaat";

import {
  sortShares,
  summarizeTypeGender,
  summarizeZones,
  toAgeShares,
  topShares,
} from "./model";
import type {
  AgeRow,
  BirthdayRow,
  BloodTypeRow,
  EthnicRow,
  IncompleteReport,
  LastEducationRow,
  ProfessionRow,
  Share,
  TypeGenderRow,
  ZoneRow,
} from "./types";

export const reportKeys = {
  all: ["report"] as const,
  jemaat: (name: string) => [...reportKeys.all, name] as const,
  birth: (month: number) => [...reportKeys.all, "birth", month] as const,
};

function useShares<T>(name: string, toShares: (rows: T[]) => Share[]) {
  return useQuery({
    queryKey: reportKeys.jemaat(name),
    queryFn: () => fetchList<T>(`/report/jemaat/${name}`),
    select: (response) => toShares(response.data),
  });
}

export function useTypeGenderReport() {
  return useQuery({
    queryKey: reportKeys.jemaat("type-gender"),
    queryFn: () => fetchList<TypeGenderRow>("/report/jemaat/type-gender"),
    select: (response) => summarizeTypeGender(response.data),
  });
}

export const useAgeReport = () =>
  useShares<AgeRow>("age", (rows) => toAgeShares(rows));

const OPEN_LIST_LIMIT = 8;

export const useEthnicReport = () =>
  useShares<EthnicRow>("ethnic", (rows) =>
    topShares(
      sortShares(
        rows.map((row) => ({
          key: row.Suku,
          label: row.Suku,
          count: row.Count,
        })),
      ),
      OPEN_LIST_LIMIT,
    ),
  );

export const useProfessionReport = () =>
  useShares<ProfessionRow>("profession", (rows) =>
    topShares(
      sortShares(
        rows.map((row) => ({
          key: row.Profession,
          label: row.Profession,
          count: row.Count,
        })),
      ),
      OPEN_LIST_LIMIT,
    ),
  );

export const useBloodTypeReport = () =>
  useShares<BloodTypeRow>("blood-type", (rows) =>
    sortShares(
      rows.map((row) => ({
        key: row.bloodType,
        label: BLOOD_TYPE_LABEL[row.bloodType] ?? row.bloodType,
        count: row.Count,
      })),
    ),
  );

export const useLastEducationReport = () =>
  useShares<LastEducationRow>("last-education", (rows) =>
    sortShares(
      rows.map((row) => ({
        key: row.lastEducation,
        label: LAST_EDUCATION_LABEL[row.lastEducation] ?? row.lastEducation,
        count: row.Count,
      })),
    ),
  );

export function useIncompleteReport() {
  return useQuery({
    queryKey: reportKeys.jemaat("incomplete"),
    queryFn: () => fetchOne<IncompleteReport>("/report/jemaat/incomplete"),
    select: (response) => response.data,
  });
}

export function useZoneReport() {
  return useQuery({
    queryKey: reportKeys.jemaat("zone"),
    queryFn: () => fetchList<ZoneRow>("/report/jemaat/zone"),
    select: (response) => summarizeZones(response.data),
  });
}

export function useBirthdayReport(month: number) {
  return useQuery({
    queryKey: reportKeys.birth(month),
    queryFn: () => fetchList<BirthdayRow>(`/report/jemaat/birth/${month}`),
    select: (response) => response.data,
  });
}

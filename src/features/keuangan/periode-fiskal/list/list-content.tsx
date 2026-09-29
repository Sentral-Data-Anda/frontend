"use client";

import { Button } from "@/components/common/control";
import { EmptyState, useToast } from "@/components/common/feedback";
import { DataList, ListTabs } from "@/components/common/list";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useBoolean } from "@/hooks/use-boolean";
import { useListParams, type ListFilterSchema } from "@/hooks/use-list-params";
import { todayJakarta } from "@/lib/date";

import { useFiscalPeriodList, usePeriodYears } from "../api";
import {
  EMPTY_DESCRIPTION,
  EMPTY_TITLE,
  emptyYearDescription,
  yearTabOptions,
} from "../model";

import { PeriodListItemRow, periodTable } from "./list-item";
import { OpenYearDialog } from "./open-year-dialog";

const LIST_FILTERS = { tahun: { api: "year" } } satisfies ListFilterSchema;

const MONTHS_IN_YEAR = 12;

const TITLE = "Periode Fiskal";

export const PeriodListContent = () => {
  const { isCanCreate } = useMenuAccess(MENU.PERIODE_FISKAL);
  const toast = useToast();
  const isDialogOpen = useBoolean();
  const listParams = useListParams({
    limit: MONTHS_IN_YEAR,
    filters: LIST_FILTERS,
  });
  const years = usePeriodYears(true);
  const pickYear = listParams.filters.tahun || todayJakarta().slice(0, 4);
  const periodList = useFiscalPeriodList({
    ...listParams,
    apiFilters: { ...listParams.apiFilters, year: pickYear },
  });
  const items = periodList.items
    ? [...periodList.items].sort((a, b) => a.month - b.month)
    : undefined;
  const isNoPeriod = years.data?.length === 0;
  const isEmpty =
    !periodList.isLoading && !periodList.error && items?.length === 0;

  const onOpened = (year: string) => {
    isDialogOpen.onFalse();
    toast.add({
      title: `Tahun ${year} dibuka. 12 periode bulanan siap dipakai.`,
    });
    listParams.onPickFilter("tahun", year);
  };

  return (
    <div className="pb-6">
      <PageHeader
        title={TITLE}
        subtitle={
          periodList.totalData === undefined
            ? undefined
            : `${periodList.totalData} periode`
        }
        backHref={domainHref(MENU.KEUANGAN)}
        action={
          isCanCreate ? (
            <Button type="button" onClick={isDialogOpen.onTrue}>
              Buka tahun
            </Button>
          ) : null
        }
      />

      <ListTabs
        label="Tahun buku"
        value={pickYear}
        options={yearTabOptions(years.data ?? [])}
        onValueChange={(value) => listParams.onPickFilter("tahun", value)}
      />

      {isEmpty ? (
        <EmptyState
          title={isNoPeriod ? EMPTY_TITLE : `Tahun ${pickYear} belum dibuka`}
          description={
            isNoPeriod
              ? EMPTY_DESCRIPTION
              : emptyYearDescription(Number(pickYear))
          }
          action={
            isCanCreate ? (
              <Button type="button" onClick={isDialogOpen.onTrue}>
                Buka tahun
              </Button>
            ) : null
          }
          className="py-12"
        />
      ) : (
        <DataList
          items={items}
          getKey={(period) => period.id}
          label="Daftar periode fiskal"
          isLoading={periodList.isLoading}
          isRefreshing={periodList.isRefreshing}
          error={periodList.error}
          onRetry={periodList.onRetry}
          pagination={periodList.pagination}
          table={periodTable()}
          itemNoun="periode"
        >
          {(period) => <PeriodListItemRow period={period} />}
        </DataList>
      )}

      <OpenYearDialog
        isOpen={isDialogOpen.value}
        onClose={isDialogOpen.onFalse}
        onOpened={onOpened}
      />
    </div>
  );
};

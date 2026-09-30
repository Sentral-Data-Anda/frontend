"use client";

import { DataList, ListToolbar } from "@/components/common/list";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { useListParams } from "@/hooks/use-list-params";
import { monthOptions } from "@/lib/date";

import {
  PERSEMBAHAN_FILTERS,
  usePersembahanList,
  usePersembahanTotals,
} from "../api";
import {
  EMPTY_DESCRIPTION,
  EMPTY_TITLE,
  METHOD_FILTER_OPTIONS,
  POSTED_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
  totalsSubtitle,
} from "../model";

import { KolekteAction } from "./kolekte-action";
import { PersembahanListItemRow, persembahanTable } from "./list-item";

export const PersembahanListContent = () => {
  const { isCanCreate } = useMenuAccess(MENU.PERSEMBAHAN);
  const journalAccess = useMenuAccess(MENU.JURNAL);
  const listParams = useListParams({ filters: PERSEMBAHAN_FILTERS });
  const persembahanList = usePersembahanList(listParams);
  const totals = usePersembahanTotals(listParams);
  const types = useDdlOptions(
    "tipe-persembahan",
    "id",
    listParams.filters.tipe,
  );
  const isNarrowed = Boolean(listParams.search) || listParams.isFiltered;

  return (
    <div className="pb-6">
      <PageHeader
        title="Persembahan"
        subtitle={
          totals.data
            ? totalsSubtitle(totals.data.count, totals.data.total)
            : undefined
        }
        backHref={domainHref(MENU.KEUANGAN)}
        action={isCanCreate ? <KolekteAction /> : null}
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari persembahan"
        searchPlaceholder="Cari kode atau nama pemberi"
        filters={[
          {
            key: "bulan",
            label: "Bulan",
            kind: "select",
            options: [
              { value: "", label: "30 hari terakhir" },
              ...monthOptions(),
            ],
          },
          {
            key: "tipe",
            label: "Tipe",
            kind: "select",
            options: [{ value: "", label: "Semua tipe" }, ...types.options],
          },
          {
            key: "cara",
            label: "Cara terima",
            kind: "select",
            options: METHOD_FILTER_OPTIONS,
          },
          {
            key: "status",
            label: "Status",
            kind: "select",
            options: STATUS_FILTER_OPTIONS,
          },
          {
            key: "posting",
            label: "Jurnal",
            kind: "select",
            options: POSTED_FILTER_OPTIONS,
          },
        ]}
      />

      <DataList
        items={persembahanList.items}
        getKey={(row) => row.code}
        label="Daftar persembahan"
        isLoading={persembahanList.isLoading}
        isRefreshing={persembahanList.isRefreshing}
        error={persembahanList.error}
        onRetry={persembahanList.onRetry}
        emptyTitle={isNarrowed ? "Tidak ada persembahan" : EMPTY_TITLE}
        emptyDescription={
          isNarrowed
            ? "Tidak ada persembahan yang cocok dengan filter ini."
            : EMPTY_DESCRIPTION
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={persembahanList.pagination}
        table={persembahanTable(journalAccess.isCanView)}
        itemNoun="persembahan"
      >
        {(row) => <PersembahanListItemRow row={row} />}
      </DataList>
    </div>
  );
};

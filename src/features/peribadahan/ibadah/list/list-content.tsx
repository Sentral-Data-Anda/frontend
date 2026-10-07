"use client";

import { CalendarRange } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { DataList, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, createHref, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { useListParams, type ListFilterSchema } from "@/hooks/use-list-params";
import { useIsTableWidth } from "@/hooks/use-media";
import { monthOptions } from "@/lib/date";

import { useIbadahList } from "../api";
import { GILIRAN_PATH } from "../model";

import { IbadahListItemRow, ibadahTable } from "./list-item";

const LIST_FILTERS = {
  tipe: { api: "typeIbadahId" },
  wilayah: { api: "zoneChurchId" },
  bulan: { api: "bulan" },
} satisfies ListFilterSchema;

export const IbadahListContent = () => {
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.IBADAH);
  const listParams = useListParams({ filters: LIST_FILTERS });
  const ibadahList = useIbadahList(listParams);
  const types = useDdlOptions("type-ibadah", "id", listParams.filters.tipe);
  const zones = useDdlOptions("zone-church", "id", listParams.filters.wilayah);
  const isWide = useIsTableWidth() === true;
  const months = [{ value: "", label: "Semua bulan" }, ...monthOptions()];

  return (
    <div className="pb-6">
      <PageHeader
        title="Ibadah"
        subtitle={
          ibadahList.totalData === undefined
            ? undefined
            : `${ibadahList.totalData} ibadah`
        }
        backHref={domainHref(MENU.PERIBADAHAN)}
        action={
          isCanCreate ? (
            <>
              <Link
                href={GILIRAN_PATH}
                aria-label="Buat jadwal giliran"
                className={buttonVariants({ variant: "outline" })}
              >
                <CalendarRange aria-hidden />
                {isWide ? "Buat jadwal giliran" : "Giliran"}
              </Link>
              <PageHeaderAdd
                href={createHref(MENU.PERIBADAHAN, MENU.IBADAH)}
                label="Tambah ibadah"
              />
            </>
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari ibadah"
        searchPlaceholder="Cari tipe, tema, pengkhotbah, tempat, atau kode"
        filters={[
          {
            key: "tipe",
            label: "Tipe ibadah",
            kind: "select",
            options: [{ value: "", label: "Semua tipe" }, ...types.options],
          },
          {
            key: "wilayah",
            label: "Wilayah",
            kind: "select",
            options: [{ value: "", label: "Semua wilayah" }, ...zones.options],
          },
          {
            key: "bulan",
            label: "Bulan",
            kind: "select",
            options: months,
          },
        ]}
      />

      <DataList
        loadingShape="trailing"
        items={ibadahList.items}
        getKey={(ibadah) => ibadah.code}
        label="Daftar ibadah"
        isLoading={ibadahList.isLoading}
        isRefreshing={ibadahList.isRefreshing}
        error={ibadahList.error}
        onRetry={ibadahList.onRetry}
        emptyTitle={
          listParams.search || listParams.isFiltered
            ? "Tidak ada ibadah"
            : "Belum ada ibadah tercatat"
        }
        emptyDescription={
          listParams.search || listParams.isFiltered
            ? "Tidak ada ibadah yang cocok dengan pencarian atau filter ini."
            : "Catat ibadah pertama. Tipe, tanggal, dan jam mulai sudah cukup; jumlah hadir bisa diisi sesudah ibadah."
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={ibadahList.pagination}
        table={ibadahTable(isCanUpdate)}
        itemNoun="ibadah"
      >
        {(ibadah) => (
          <IbadahListItemRow ibadah={ibadah} isCanUpdate={isCanUpdate} />
        )}
      </DataList>
    </div>
  );
};

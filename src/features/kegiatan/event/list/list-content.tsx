"use client";

import { DataList, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, createHref, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { useListParams, type ListFilterSchema } from "@/hooks/use-list-params";
import { monthOptions } from "@/lib/date";

import { useEventList } from "../api";

import { EventListItemRow, eventTable } from "./list-item";

const LIST_FILTERS = {
  bulan: { api: "bulan" },
  bapel: { api: "bapelId" },
} satisfies ListFilterSchema;

const STATUS_OPTIONS = [
  { value: "", label: "Semua" },
  { value: "terbit", label: "Terbit" },
  { value: "draf", label: "Draf" },
];

export const EventListContent = () => {
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.EVENT);
  const listParams = useListParams({ filters: LIST_FILTERS });
  const eventList = useEventList(listParams);
  const bapel = useDdlOptions("bapel", "id", listParams.filters.bapel);
  const isNarrowed = Boolean(listParams.search) || listParams.isFiltered;

  return (
    <div className="pb-6">
      <PageHeader
        title="Event"
        subtitle={
          eventList.totalData === undefined
            ? undefined
            : `${eventList.totalData} event`
        }
        backHref={domainHref(MENU.KEGIATAN)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={createHref(MENU.KEGIATAN, MENU.EVENT)}
              label="Tambah event"
            />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari event"
        searchPlaceholder="Cari nama atau kode event"
        filters={[
          {
            key: "bulan",
            label: "Bulan",
            kind: "select",
            options: [{ value: "", label: "Semua bulan" }, ...monthOptions()],
          },
          {
            key: "bapel",
            label: "Badan pelayanan",
            kind: "select",
            options: [
              { value: "", label: "Semua badan pelayanan" },
              ...bapel.options,
            ],
          },
          {
            key: "status",
            label: "Status",
            kind: "choice",
            options: STATUS_OPTIONS,
          },
        ]}
      />

      <DataList
        items={eventList.items}
        getKey={(event) => event.code}
        label="Daftar event"
        isLoading={eventList.isLoading}
        isRefreshing={eventList.isRefreshing}
        error={eventList.error}
        onRetry={eventList.onRetry}
        emptyTitle={isNarrowed ? "Tidak ada event" : "Belum ada event"}
        emptyDescription={
          isNarrowed
            ? "Tidak ada event yang cocok dengan filter ini."
            : "Tambahkan kegiatan gereja seperti retret, seminar, atau bazar."
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={eventList.pagination}
        table={eventTable(isCanUpdate)}
        itemNoun="event"
      >
        {(event) => (
          <EventListItemRow event={event} isCanUpdate={isCanUpdate} />
        )}
      </DataList>
    </div>
  );
};

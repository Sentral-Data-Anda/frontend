"use client";

import { useState } from "react";

import { useToast } from "@/components/common/feedback";
import {
  DataList,
  ListToolbar,
  RowDeleteDialog,
} from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, createHref, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { useListParams, type ListFilterSchema } from "@/hooks/use-list-params";
import { monthOptions } from "@/lib/date";

import { useDeleteEvent, useEventList } from "../api";
import type { ChurchEvent } from "../types";

import { deleteTargetLabelOf, EventListItemRow, eventTable } from "./list-item";

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
  const { isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(MENU.EVENT);

  const toast = useToast();

  // Satu keadaan menyimpan baris yang akan dihapus sekaligus status terbuka
  // dialognya. Hook hapus dibuat ulang mengikuti kunci baris ini.
  const [target, setTarget] = useState<ChurchEvent | null>(null);
  const deleteRow = useDeleteEvent(target?.code);
  const listParams = useListParams({ filters: LIST_FILTERS });
  const eventList = useEventList(listParams);
  const bapel = useDdlOptions("bapel", "id", listParams.filters.bapel);
  const isNarrowed = Boolean(listParams.search) || listParams.isFiltered;

  const onDelete = () => {
    deleteRow.mutate(undefined, {
      onSuccess: (deleted) => {
        toast.add({ title: deleted.message });
        setTarget(null);
      },
    });
  };

  const onCancelDelete = () => {
    deleteRow.reset();
    setTarget(null);
  };

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
        table={eventTable(isCanUpdate, isCanDelete ? setTarget : undefined)}
        itemNoun="event"
      >
        {(event) => <EventListItemRow event={event} />}
      </DataList>

      <RowDeleteDialog
        target={target ? { label: deleteTargetLabelOf(target) } : null}
        entity="event"
        isPending={deleteRow.isPending}
        errorMessage={deleteRow.error?.message}
        onCancel={onCancelDelete}
        onConfirm={onDelete}
      />
    </div>
  );
};

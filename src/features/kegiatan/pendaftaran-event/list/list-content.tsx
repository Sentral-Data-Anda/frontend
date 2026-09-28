"use client";

import { DataList, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams, type ListFilterSchema } from "@/hooks/use-list-params";

import { EVENT_DDL_PATH, useEventOptions, usePendaftaranList } from "../api";
import { STATUS_OPTIONS, createHrefOf, filterOptionOf } from "../model";

import { PendaftaranListItemRow, pendaftaranTable } from "./list-item";
import { QuotaSummary } from "./quota-summary";

const LIST_FILTERS = { event: { api: "eventId" } } satisfies ListFilterSchema;

export const PendaftaranListContent = () => {
  const { isCanCreate } = useMenuAccess(MENU.PENDAFTARAN_EVENT);
  const listParams = useListParams({ filters: LIST_FILTERS });
  const registrations = usePendaftaranList(listParams);
  const events = useEventOptions(EVENT_DDL_PATH);
  const pickEvent = listParams.filters.event ?? "";
  const pickedEvent = events.data?.find(
    (event) => String(event.id) === pickEvent,
  );
  const isNarrowed = Boolean(listParams.search) || listParams.isFiltered;

  return (
    <div className="pb-6">
      <PageHeader
        title="Pendaftaran Event"
        subtitle={
          registrations.totalData === undefined
            ? undefined
            : `${registrations.totalData} peserta`
        }
        backHref={domainHref(MENU.KEGIATAN)}
        action={
          isCanCreate ? (
            <PageHeaderAdd href={createHrefOf(pickEvent)} label="Daftarkan" />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari peserta"
        searchPlaceholder="Cari nama, telepon, atau kode"
        filters={[
          {
            key: "event",
            label: "Event",
            kind: "select",
            options: (events.data ?? []).map(filterOptionOf),
            emptyMessage: "Belum ada event",
          },
          {
            key: "status",
            label: "Status",
            kind: "choice",
            options: STATUS_OPTIONS,
          },
        ]}
      />

      {pickedEvent ? <QuotaSummary event={pickedEvent} /> : null}

      <DataList
        items={registrations.items}
        getKey={(registration) => registration.code}
        label="Daftar peserta"
        isLoading={registrations.isLoading}
        isRefreshing={registrations.isRefreshing}
        error={registrations.error}
        onRetry={registrations.onRetry}
        emptyTitle={
          isNarrowed ? "Tidak ada peserta" : "Belum ada peserta terdaftar"
        }
        emptyDescription={
          isNarrowed
            ? "Tidak ada peserta yang cocok dengan filter ini."
            : "Daftarkan jemaat atau tamu ke event yang sudah terbit."
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={registrations.pagination}
        table={pendaftaranTable()}
        itemNoun="peserta"
      >
        {(registration) => (
          <PendaftaranListItemRow registration={registration} />
        )}
      </DataList>
    </div>
  );
};

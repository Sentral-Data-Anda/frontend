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

import { useDeleteLoanRoom, useLoanRoomList } from "../api";
import type { LoanRoom } from "../types";

import {
  LoanListItemRow,
  deleteTargetLabelOf,
  peminjamanTable,
} from "./list-item";

const LIST_FILTERS = {
  bulan: { api: "bulan" },
  ruang: { api: "roomId" },
  bapel: { api: "bapelId" },
} satisfies ListFilterSchema;

export const LoanListContent = () => {
  const { isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.PEMINJAMAN_RUANG,
  );
  const toast = useToast();

  // Satu keadaan menyimpan baris yang akan dihapus sekaligus status terbuka
  // dialognya. Hook hapus dibuat ulang mengikuti kunci baris ini.
  const [target, setTarget] = useState<LoanRoom | null>(null);
  const deleteRow = useDeleteLoanRoom(target?.code);

  const listParams = useListParams({ filters: LIST_FILTERS });
  const loanList = useLoanRoomList(listParams);
  const rooms = useDdlOptions("room", "id", listParams.filters.ruang);
  const bapels = useDdlOptions("bapel", "id", listParams.filters.bapel);
  const isNarrowed = Boolean(listParams.search || listParams.isFiltered);

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
        title="Peminjaman Ruang"
        subtitle={
          loanList.totalData === undefined
            ? undefined
            : `${loanList.totalData} peminjaman`
        }
        backHref={domainHref(MENU.FASILITAS)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={createHref(MENU.FASILITAS, MENU.PEMINJAMAN_RUANG)}
              label="Tambah peminjaman"
            />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari peminjaman"
        searchPlaceholder="Cari keperluan, peminjam, atau kode"
        filters={[
          {
            key: "bulan",
            label: "Periode",
            kind: "select",
            options: [{ value: "", label: "Mendatang" }, ...monthOptions()],
          },
          {
            key: "ruang",
            label: "Ruang",
            kind: "select",
            options: [{ value: "", label: "Semua ruang" }, ...rooms.options],
          },
          {
            key: "bapel",
            label: "Badan pelayanan",
            kind: "select",
            options: [
              { value: "", label: "Semua badan pelayanan" },
              ...bapels.options,
            ],
          },
        ]}
      />

      <DataList
        loadingShape="trailing"
        items={loanList.items}
        getKey={(loan) => loan.code}
        label="Daftar peminjaman ruang"
        isLoading={loanList.isLoading}
        isRefreshing={loanList.isRefreshing}
        error={loanList.error}
        onRetry={loanList.onRetry}
        emptyTitle={
          isNarrowed ? "Tidak ada peminjaman" : "Tidak ada peminjaman mendatang"
        }
        emptyDescription={
          isNarrowed
            ? "Tidak ada peminjaman yang cocok dengan filter ini."
            : "Catat pemakaian ruang untuk rapat, latihan, atau acara keluarga. Peminjaman lampau ada di filter Periode."
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={loanList.pagination}
        table={peminjamanTable(
          isCanUpdate,
          isCanDelete ? setTarget : undefined,
        )}
        itemNoun="peminjaman"
      >
        {(loan) => <LoanListItemRow loan={loan} />}
      </DataList>

      <RowDeleteDialog
        target={target ? { label: deleteTargetLabelOf(target) } : null}
        entity="peminjaman"
        isPending={deleteRow.isPending}
        errorMessage={deleteRow.error?.message}
        onCancel={onCancelDelete}
        onConfirm={onDelete}
      />
    </div>
  );
};

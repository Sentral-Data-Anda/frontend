"use client";

import { useState } from "react";

import { useToast } from "@/components/common/feedback";
import {
  DataList,
  ListToolbar,
  RowDeleteDialog,
} from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams } from "@/hooks/use-list-params";

import { useDeleteSupplier, useSupplierList } from "../api";
import { SUPPLIER_CREATE_PATH } from "../model";
import { type Supplier, SUPPLIER_STATUS_FILTER } from "../types";

import {
  deleteTargetLabelOf,
  SupplierListItemRow,
  supplierTable,
} from "./list-item";

export const SupplierListContent = () => {
  const { isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.SUPPLIER,
  );

  const toast = useToast();

  // Satu keadaan menyimpan baris yang akan dihapus sekaligus status terbuka
  // dialognya. Hook hapus dibuat ulang mengikuti kunci baris ini.
  const [target, setTarget] = useState<Supplier | null>(null);
  const deleteRow = useDeleteSupplier(target?.code);
  const listParams = useListParams();
  const supplierList = useSupplierList(listParams);
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
        title="Supplier"
        subtitle={
          supplierList.totalData === undefined
            ? undefined
            : `${supplierList.totalData} supplier`
        }
        backHref={domainHref(MENU.PROCUREMENT)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={SUPPLIER_CREATE_PATH}
              label="Tambah supplier"
            />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari supplier"
        searchPlaceholder="Cari nama, kontak, atau telepon"
        filters={[
          {
            key: "status",
            label: "Status",
            kind: "choice",
            options: SUPPLIER_STATUS_FILTER,
          },
        ]}
      />

      <DataList
        loadingShape="trailing"
        items={supplierList.items}
        getKey={(supplier) => supplier.code}
        label="Daftar supplier"
        isLoading={supplierList.isLoading}
        isRefreshing={supplierList.isRefreshing}
        error={supplierList.error}
        onRetry={supplierList.onRetry}
        emptyTitle={isNarrowed ? "Tidak ada supplier" : "Belum ada supplier"}
        emptyDescription={
          isNarrowed
            ? "Tidak ada supplier yang cocok dengan filter ini."
            : "Tambahkan toko atau penyedia jasa tempat gereja membeli."
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={supplierList.pagination}
        table={supplierTable(isCanUpdate, isCanDelete ? setTarget : undefined)}
        itemNoun="supplier"
      >
        {(supplier) => <SupplierListItemRow supplier={supplier} />}
      </DataList>

      <RowDeleteDialog
        target={target ? { label: deleteTargetLabelOf(target) } : null}
        entity="supplier"
        isPending={deleteRow.isPending}
        errorMessage={deleteRow.error?.message}
        onCancel={onCancelDelete}
        onConfirm={onDelete}
      />
    </div>
  );
};

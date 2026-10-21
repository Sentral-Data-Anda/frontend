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
import { useListParams } from "@/hooks/use-list-params";

import { useDeleteRoleUser, useRoleUserList } from "../api";
import type { RoleUserItem } from "../types";

import {
  deleteTargetLabelOf,
  RoleUserListItemRow,
  roleUserTable,
} from "./list-item";

export const RoleUserListScreen = () => {
  const { isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.USER_ROLE,
  );

  const toast = useToast();

  // Satu keadaan menyimpan baris yang akan dihapus sekaligus status terbuka
  // dialognya. Hook hapus dibuat ulang mengikuti kunci baris ini.
  const [target, setTarget] = useState<RoleUserItem | null>(null);
  const deleteRow = useDeleteRoleUser(target?.publicId);
  const listParams = useListParams();
  const roleList = useRoleUserList(listParams);

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
        title="User Role"
        subtitle={
          roleList.totalData === undefined
            ? undefined
            : `${roleList.totalData} role`
        }
        backHref={domainHref(MENU.SETTINGS)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={createHref(MENU.SETTINGS, MENU.USER_ROLE)}
              label="Tambah role"
            />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari role"
        searchPlaceholder="Cari nama role"
      />

      <DataList
        loadingShape="trailing"
        items={roleList.items}
        getKey={(role) => String(role.id)}
        label="Daftar role user"
        isLoading={roleList.isLoading}
        isRefreshing={roleList.isRefreshing}
        error={roleList.error}
        onRetry={roleList.onRetry}
        emptyTitle="Tidak ada role"
        emptyDescription={
          listParams.search
            ? "Tidak ada role yang cocok dengan pencarian ini."
            : "Role dan hak aksesnya akan muncul di sini setelah ditambahkan."
        }
        pagination={roleList.pagination}
        table={roleUserTable(isCanUpdate, isCanDelete ? setTarget : undefined)}
        itemNoun="role"
      >
        {(role) => <RoleUserListItemRow role={role} />}
      </DataList>

      <RowDeleteDialog
        target={target ? { label: deleteTargetLabelOf(target) } : null}
        entity="role"
        isPending={deleteRow.isPending}
        errorMessage={deleteRow.error?.message}
        onCancel={onCancelDelete}
        onConfirm={onDelete}
      />
    </div>
  );
};

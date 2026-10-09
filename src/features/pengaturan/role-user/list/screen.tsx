"use client";

import { DataList, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, createHref, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams } from "@/hooks/use-list-params";

import { useRoleUserList } from "../api";

import { RoleUserListItemRow, roleUserTable } from "./list-item";

export const RoleUserListScreen = () => {
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.USER_ROLE);
  const listParams = useListParams();
  const roleList = useRoleUserList(listParams);

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
        table={roleUserTable(isCanUpdate)}
        itemNoun="role"
      >
        {(role) => (
          <RoleUserListItemRow role={role} isCanUpdate={isCanUpdate} />
        )}
      </DataList>
    </div>
  );
};

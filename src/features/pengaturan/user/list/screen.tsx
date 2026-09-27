"use client";

import { DataList, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, createHref, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams, type ListFilterSchema } from "@/hooks/use-list-params";

import { useRoleFilterOptions, useUserList } from "../api";
import { USER_STATUS_OPTIONS } from "../types";

import { UserListItemRow, userTable } from "./list-item";

const LIST_FILTERS = { role: { api: "role" } } satisfies ListFilterSchema;

export const UserListScreen = () => {
  const { isCanCreate } = useMenuAccess(MENU.USER);
  const listParams = useListParams({ filters: LIST_FILTERS });
  const userList = useUserList(listParams);
  const roleOptions = useRoleFilterOptions();

  return (
    <div className="pb-6">
      <PageHeader
        title="User"
        subtitle={
          userList.totalData === undefined
            ? undefined
            : `${userList.totalData} akun`
        }
        backHref={domainHref(MENU.PENGATURAN)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={createHref(MENU.PENGATURAN, MENU.USER)}
              label="Tambah akun"
            />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari akun"
        searchPlaceholder="Cari nama atau kode akun"
        filters={[
          {
            key: "role",
            label: "Role",
            kind: "select",
            options: roleOptions.options,
            emptyMessage: "Belum ada data role",
          },
          {
            key: "status",
            label: "Status",
            kind: "choice",
            options: USER_STATUS_OPTIONS,
          },
        ]}
      />

      <DataList
        items={userList.items}
        getKey={(user) => user.code}
        label="Daftar akun"
        isLoading={userList.isLoading}
        isRefreshing={userList.isRefreshing}
        error={userList.error}
        onRetry={userList.onRetry}
        emptyTitle="Tidak ada akun"
        emptyDescription={
          listParams.search || listParams.isFiltered
            ? "Tidak ada akun yang cocok dengan pencarian atau filter ini."
            : "Akun login jemaat akan muncul di sini setelah ditambahkan."
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={userList.pagination}
        table={userTable}
        itemNoun="akun"
      >
        {(user) => <UserListItemRow user={user} />}
      </DataList>
    </div>
  );
};

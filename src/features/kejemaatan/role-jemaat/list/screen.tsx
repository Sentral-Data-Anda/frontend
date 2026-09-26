"use client";

import { DataList, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, createHref, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams, type ListFilterSchema } from "@/hooks/use-list-params";

import { useRoleJemaatList } from "../api";
import { yearOptions } from "../model";

import { RoleJemaatListItemRow, roleJemaatTable } from "./list-item";

const LIST_FILTERS = { tahun: { api: "year" } } satisfies ListFilterSchema;

const YEAR_OPTIONS = yearOptions();

export const RoleJemaatListScreen = () => {
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.ROLE_JEMAAT);
  const listParams = useListParams({ filters: LIST_FILTERS });
  const roleList = useRoleJemaatList(listParams);

  return (
    <div className="pb-6">
      <PageHeader
        title="Role Jemaat"
        subtitle={
          roleList.totalData === undefined
            ? undefined
            : `${roleList.totalData} jabatan`
        }
        backHref={domainHref(MENU.KEJEMAATAN)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={createHref(MENU.KEJEMAATAN, MENU.ROLE_JEMAAT)}
              label="Tambah jabatan"
            />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari jabatan"
        searchPlaceholder="Cari nama jabatan atau jemaat"
        filters={[
          {
            key: "tahun",
            label: "Tahun mulai periode",
            kind: "select",
            options: YEAR_OPTIONS,
            chipLabel: (year) => `Tahun ${year}`,
          },
        ]}
      />

      <DataList
        items={roleList.items}
        getKey={(role) => String(role.id)}
        label="Daftar jabatan jemaat"
        isLoading={roleList.isLoading}
        isRefreshing={roleList.isRefreshing}
        error={roleList.error}
        onRetry={roleList.onRetry}
        emptyTitle="Tidak ada jabatan"
        emptyDescription={
          listParams.search || listParams.isFiltered
            ? "Tidak ada jabatan yang cocok dengan pencarian atau tahun ini."
            : "Jabatan jemaat di badan pelayanan akan muncul di sini setelah ditambahkan."
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={roleList.pagination}
        table={roleJemaatTable(isCanUpdate)}
        itemNoun="jabatan"
      >
        {(role) => (
          <RoleJemaatListItemRow role={role} isCanUpdate={isCanUpdate} />
        )}
      </DataList>
    </div>
  );
};

"use client";

import { DataList, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, createHref, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams } from "@/hooks/use-list-params";

import { useSkillMusikList } from "../api";

import { SkillMusikListItemRow, skillMusikTable } from "./list-item";

export const SkillMusikList = () => {
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.SKILL_MUSIK);
  const listParams = useListParams();
  const skillMusikList = useSkillMusikList(listParams);
  const isSearched = Boolean(listParams.search);

  return (
    <div className="pb-6">
      <PageHeader
        title="Skill Musik"
        subtitle={
          skillMusikList.totalData === undefined
            ? undefined
            : `${skillMusikList.totalData} alat musik`
        }
        backHref={domainHref(MENU.PELAYANAN)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={createHref(MENU.PELAYANAN, MENU.SKILL_MUSIK)}
              label="Tambah alat musik"
            />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari alat musik"
        searchPlaceholder="Cari nama alat musik"
      />

      <DataList
        loadingShape="trailing"
        items={skillMusikList.items}
        getKey={(skillMusik) => String(skillMusik.id)}
        label="Daftar alat musik"
        isLoading={skillMusikList.isLoading}
        isRefreshing={skillMusikList.isRefreshing}
        error={skillMusikList.error}
        onRetry={skillMusikList.onRetry}
        emptyTitle={
          isSearched ? "Tidak ada alat musik" : "Belum ada alat musik"
        }
        emptyDescription={
          isSearched
            ? "Tidak ada alat musik yang cocok dengan pencarian ini."
            : "Tambahkan alat yang dimainkan pemusik gereja, mis. Keyboard, Gitar, Drum."
        }
        pagination={skillMusikList.pagination}
        table={skillMusikTable(isCanUpdate)}
        itemNoun="alat musik"
      >
        {(skillMusik) => (
          <SkillMusikListItemRow
            skillMusik={skillMusik}
            isCanUpdate={isCanUpdate}
          />
        )}
      </DataList>
    </div>
  );
};

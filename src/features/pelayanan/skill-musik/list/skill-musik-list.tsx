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

import { useDeleteSkillMusik, useSkillMusikList } from "../api";
import type { SkillMusik } from "../types";

import {
  deleteTargetLabelOf,
  SkillMusikListItemRow,
  skillMusikTable,
} from "./list-item";

export const SkillMusikList = () => {
  const { isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.SKILL_MUSIK,
  );

  const toast = useToast();

  // Satu keadaan menyimpan baris yang akan dihapus sekaligus status terbuka
  // dialognya. Hook hapus dibuat ulang mengikuti kunci baris ini.
  const [target, setTarget] = useState<SkillMusik | null>(null);
  const deleteRow = useDeleteSkillMusik(target?.publicId);
  const listParams = useListParams();
  const skillMusikList = useSkillMusikList(listParams);
  const isSearched = Boolean(listParams.search);

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
        table={skillMusikTable(
          isCanUpdate,
          isCanDelete ? setTarget : undefined,
        )}
        itemNoun="alat musik"
      >
        {(skillMusik) => <SkillMusikListItemRow skillMusik={skillMusik} />}
      </DataList>

      <RowDeleteDialog
        target={target ? { label: deleteTargetLabelOf(target) } : null}
        entity="alat musik"
        isPending={deleteRow.isPending}
        errorMessage={deleteRow.error?.message}
        onCancel={onCancelDelete}
        onConfirm={onDelete}
      />
    </div>
  );
};

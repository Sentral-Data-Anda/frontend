"use client";

import { ListTabs } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import type { ListState } from "@/hooks/use-list-params";

import { KIND_NOUN, KIND_OPTIONS, KIND_PARAM, cycleCreateHref } from "../model";
import type { CycleKind } from "../types";

const ADD_LABEL: Record<CycleKind, string> = {
  perawatan: "Catat perawatan",
  pindah: "Pindahkan barang",
  pelepasan: "Ajukan pelepasan",
};

interface PropTypes {
  kind: CycleKind;
  totalData: number | undefined;
  listParams: ListState;
}

export const ListHeader = (props: PropTypes) => {
  const { kind, totalData, listParams } = props;

  const { isCanCreate, isCanDelete } = useMenuAccess(MENU.ASSET_TRANSACTION);
  const isCanAdd = kind === "pelepasan" ? isCanDelete : isCanCreate;

  const onPickKind = (next: string) =>
    listParams.onApplyFilters({ [KIND_PARAM]: next, status: "", cara: "" });

  return (
    <>
      <PageHeader
        title="Siklus Aset"
        subtitle={
          totalData === undefined
            ? undefined
            : `${totalData} ${KIND_NOUN[kind]}`
        }
        backHref={domainHref(MENU.FIXED_ASSET)}
        action={
          isCanAdd ? (
            <PageHeaderAdd
              href={cycleCreateHref(kind)}
              label={ADD_LABEL[kind]}
              text={ADD_LABEL[kind]}
            />
          ) : null
        }
      />

      <ListTabs
        label="Jenis catatan"
        value={kind}
        options={KIND_OPTIONS}
        onValueChange={onPickKind}
      />
    </>
  );
};

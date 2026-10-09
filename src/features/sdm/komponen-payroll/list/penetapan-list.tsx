"use client";

import { SalaryDataBadge } from "@/components/common/display";
import { DataList, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { useListParams } from "@/hooks/use-list-params";

import { usePenetapanList } from "../api";
import {
  PENETAPAN_CREATE_PATH,
  PENETAPAN_FILTERS,
  PENETAPAN_LIST_PATH,
} from "../model";
import { KomponenPayrollTabs } from "../ui";

import { penetapanTable, PenetapanListItemRow } from "./penetapan-item";

const ALL_OPTION = { value: "", label: "Semua" };

export const PenetapanList = () => {
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.PAYROLL_COMPONENT);
  const listParams = useListParams({ filters: PENETAPAN_FILTERS });
  const assignments = usePenetapanList(listParams);
  const karyawan = useDdlOptions("karyawan");
  const components = useDdlOptions("komponen-payroll");

  return (
    <div className="pb-6">
      <PageHeader
        title="Penetapan Komponen"
        subtitle={
          assignments.totalData === undefined
            ? undefined
            : `${assignments.totalData} penetapan`
        }
        backHref={domainHref(MENU.HR)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={PENETAPAN_CREATE_PATH}
              label="Tambah penetapan"
            />
          ) : null
        }
      />

      <KomponenPayrollTabs value={PENETAPAN_LIST_PATH} />

      <div className="px-gutter pb-3">
        <SalaryDataBadge />
      </div>

      <ListToolbar
        listParams={listParams}
        filters={[
          {
            key: "karyawan",
            label: "Karyawan",
            kind: "select",
            options: [ALL_OPTION, ...karyawan.options],
            emptyMessage: "Belum ada karyawan",
          },
          {
            key: "komponen",
            label: "Komponen",
            kind: "select",
            options: [ALL_OPTION, ...components.options],
            emptyMessage: "Belum ada komponen",
          },
        ]}
      />

      <DataList
        items={assignments.items}
        getKey={(assignment) => assignment.publicId}
        label="Daftar penetapan komponen"
        isLoading={assignments.isLoading}
        isRefreshing={assignments.isRefreshing}
        error={assignments.error}
        onRetry={assignments.onRetry}
        emptyTitle={
          listParams.isFiltered
            ? "Tidak ada penetapan"
            : "Belum ada penetapan komponen"
        }
        emptyDescription={
          listParams.isFiltered
            ? "Tidak ada penetapan yang cocok dengan filter ini."
            : "Tetapkan tunjangan atau potongan ke seorang karyawan beserta masa berlakunya."
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={assignments.pagination}
        table={penetapanTable(isCanUpdate)}
        loadingShape="trailing"
        itemNoun="penetapan"
      >
        {(assignment) => (
          <PenetapanListItemRow
            assignment={assignment}
            isCanUpdate={isCanUpdate}
          />
        )}
      </DataList>
    </div>
  );
};

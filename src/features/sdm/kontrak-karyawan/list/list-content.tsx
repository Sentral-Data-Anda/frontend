"use client";

import { Button } from "@/components/common/control";
import { SalaryDataBadge } from "@/components/common/display";
import { EmptyState } from "@/components/common/feedback";
import { DataList, ListToolbar } from "@/components/common/list";
import { StepUpDialog } from "@/components/common/overlay";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { useListParams } from "@/hooks/use-list-params";

import { useKontrakList } from "../api";
import {
  CREATE_PATH,
  EMPTY_DESCRIPTION,
  EMPTY_TITLE,
  FILTERED_DESCRIPTION,
  FILTERS,
  LOCKED_DESCRIPTION,
  LOCKED_TITLE,
  STEP_UP_DESCRIPTION,
} from "../model";
import { useSalaryLock } from "../use-salary-lock";

import { KontrakListItem, kontrakTable } from "./list-item";

const ALL_OPTION = { value: "", label: "Semua karyawan" };

export const KontrakListContent = () => {
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.KONTRAK_KARYAWAN);
  const listParams = useListParams({ filters: FILTERS });
  const contracts = useKontrakList(listParams);
  const karyawan = useDdlOptions("karyawan");
  const lock = useSalaryLock(contracts.error, contracts.onRetry);

  return (
    <div className="pb-6">
      <PageHeader
        title="Kontrak Karyawan"
        subtitle={
          contracts.totalData === undefined
            ? undefined
            : `${contracts.totalData} kontrak`
        }
        backHref={domainHref(MENU.SDM)}
        action={
          isCanCreate ? (
            <PageHeaderAdd href={CREATE_PATH} label="Tambah kontrak" />
          ) : null
        }
      />

      <div className="px-gutter pb-3">
        <SalaryDataBadge />
      </div>

      {lock.isLocked ? (
        <EmptyState
          title={LOCKED_TITLE}
          description={LOCKED_DESCRIPTION}
          action={
            <Button type="button" onClick={lock.onAsk}>
              Masukkan password
            </Button>
          }
        />
      ) : (
        <>
          <ListToolbar
            listParams={listParams}
            searchLabel="Cari kontrak"
            searchPlaceholder="Cari nama, jabatan, atau kode"
            filters={[
              {
                key: "karyawan",
                label: "Karyawan",
                kind: "select",
                options: [ALL_OPTION, ...karyawan.options],
                emptyMessage: "Belum ada karyawan",
              },
            ]}
          />

          <DataList
            items={contracts.items}
            getKey={(contract) => contract.code}
            label="Daftar kontrak karyawan"
            isLoading={contracts.isLoading}
            isRefreshing={contracts.isRefreshing}
            error={contracts.error}
            onRetry={contracts.onRetry}
            emptyTitle={
              listParams.isFiltered ? "Tidak ada kontrak" : EMPTY_TITLE
            }
            emptyDescription={
              listParams.isFiltered ? FILTERED_DESCRIPTION : EMPTY_DESCRIPTION
            }
            onClearFilter={
              listParams.isFiltered ? listParams.onClearFilters : undefined
            }
            pagination={contracts.pagination}
            table={kontrakTable(isCanUpdate)}
            loadingShape="trailing"
            itemNoun="kontrak"
          >
            {(contract) => (
              <KontrakListItem contract={contract} isCanUpdate={isCanUpdate} />
            )}
          </DataList>
        </>
      )}

      <StepUpDialog
        isOpen={lock.isAsking}
        onClose={lock.onClose}
        onVerified={lock.onVerified}
        description={STEP_UP_DESCRIPTION}
      />
    </div>
  );
};

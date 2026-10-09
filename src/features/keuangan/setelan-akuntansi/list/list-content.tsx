"use client";

import { DataList } from "@/components/common/list";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { useSettingList } from "../api";
import { readinessSubtitle } from "../model";

import { SettingListItemRow, settingTable } from "./list-item";
import { ReadinessAlert } from "./readiness-alert";

export const SettingListContent = () => {
  const { isCanUpdate } = useMenuAccess(MENU.ACCOUNTING_SETTING);
  const settingList = useSettingList();

  return (
    <div className="pb-6">
      <PageHeader
        title="Setelan Akuntansi"
        subtitle={
          settingList.isLoading || settingList.error
            ? undefined
            : readinessSubtitle(settingList.settings)
        }
        backHref={domainHref(MENU.FINANCE)}
      />

      <ReadinessAlert settings={settingList.settings} />

      <DataList
        loadingShape="trailing"
        items={settingList.isLoading ? undefined : settingList.settings}
        getKey={(setting) => setting.key}
        label="Daftar setelan akuntansi"
        isLoading={settingList.isLoading}
        isRefreshing={settingList.isRefreshing}
        error={settingList.error}
        onRetry={settingList.onRetry}
        emptyTitle="Belum ada setelan akuntansi"
        emptyDescription="Kunci setelan dibuat saat aplikasi dipasang. Hubungi administrator bila daftar ini kosong."
        table={settingTable(isCanUpdate)}
        itemNoun="setelan"
      >
        {(setting) => (
          <SettingListItemRow setting={setting} isCanUpdate={isCanUpdate} />
        )}
      </DataList>
    </div>
  );
};

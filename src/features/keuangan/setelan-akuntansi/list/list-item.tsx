import { Badge } from "@/components/common/display";
import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { saveListFocus } from "@/lib/list-return";

import {
  SETELAN_AKUNTANSI_LIST_PATH,
  accountLabelOf,
  settingEditHref,
  settingIssueOf,
} from "../model";
import type { AccountingSetting } from "../types";

const editHrefOf = (setting: AccountingSetting) => settingEditHref(setting.key);

const saveFocus = (setting: AccountingSetting) =>
  saveListFocus(SETELAN_AKUNTANSI_LIST_PATH, setting.key);

const labelOf = (setting: AccountingSetting) =>
  `Pilih akun untuk ${setting.label}`;

const accountCell = (setting: AccountingSetting) => {
  const issue = settingIssueOf(setting);
  const label = accountLabelOf(setting);

  if (!issue) {
    return (
      <span className="block truncate" title={label ?? undefined}>
        {label}
      </span>
    );
  }

  return (
    <span className="flex min-w-0 items-center gap-2">
      <Badge variant={issue.variant}>{issue.label}</Badge>
      {label ? (
        <span className="truncate" title={label}>
          {label}
        </span>
      ) : null}
    </span>
  );
};

interface PropTypes {
  setting: AccountingSetting;
}

export const SettingListItemRow = (props: PropTypes) => {
  const { setting } = props;

  return (
    <DataListRow
      id={setting.key}
      className="hover:bg-card relative transition-colors"
      title={setting.label}
      meta={setting.description}
      trailing={accountCell(setting)}
    />
  );
};

export function settingTable(
  isCanUpdate: boolean,
): DataTableConfig<AccountingSetting> {
  return {
    columns: [
      {
        key: "setting",
        header: "Setelan",
        width: "minmax(0,2fr)",
        cell: (setting) => (
          <span className="block truncate font-medium">{setting.label}</span>
        ),
      },
      {
        key: "description",
        header: "Keterangan",
        width: "minmax(0,2.5fr)",
        isSecondary: true,
        cell: (setting) => (
          <span className="block truncate" title={setting.description}>
            {setting.description}
          </span>
        ),
      },
      {
        key: "account",
        header: "Akun",
        width: "minmax(0,2fr)",
        cell: accountCell,
      },
    ],
    getRowActions: (x) => ({
      label: labelOf(x),
      edit: {
        href: isCanUpdate ? editHrefOf(x) : undefined,
        onNavigate: () => saveFocus(x),
        label: labelOf(x),
      },
    }),
  };
}

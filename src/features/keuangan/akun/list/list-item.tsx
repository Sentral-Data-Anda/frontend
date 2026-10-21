import Link from "next/link";

import { OptionalText } from "@/components/common/display";
import {
  DataListRow,
  TABLE_ROW_LINK,
  type DataTableColumn,
  type DataTableConfig,
} from "@/components/common/list";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";
import { ACCOUNT_TYPE_LABEL } from "@/types/keuangan";

import {
  accountDetailHref,
  accountEditHref,
  AKUN_LIST_PATH,
  childCountLabel,
} from "../model";
import type { AccountTreeRow } from "../types";
import { AccountStatus } from "../ui";

const INDENT = ["", "ps-4", "ps-8", "ps-12", "ps-16"];

const LEADING = ["", "w-4", "w-8", "w-12", "w-16"];

const indentOf = (depth: number) => INDENT[Math.min(depth, 4)];

const saveFocus = (account: AccountTreeRow) =>
  saveListFocus(AKUN_LIST_PATH, account.code);

const detailHrefOf = (account: AccountTreeRow) =>
  accountDetailHref(account.code);

const viewLabelOf = (account: AccountTreeRow) =>
  `Lihat akun ${account.code} ${account.name}`;

const metaOf = (account: AccountTreeRow) =>
  [
    ACCOUNT_TYPE_LABEL[account.type],
    childCountLabel(account.childCount),
    account.depth === 0 && account.parent
      ? `Induk ${account.parent.code}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

interface PropTypes {
  account: AccountTreeRow;
}

export const AccountListItemRow = (props: PropTypes) => {
  const { account } = props;

  return (
    <DataListRow
      id={account.code}
      className="hover:bg-card relative transition-colors"
      leading={
        account.depth > 0 ? (
          <span aria-hidden className={LEADING[Math.min(account.depth, 4)]} />
        ) : null
      }
      title={
        <Link
          href={detailHrefOf(account)}
          onClick={() => saveFocus(account)}
          aria-label={viewLabelOf(account)}
          className={TABLE_ROW_LINK}
        >
          <span className="tabular-nums">{account.code}</span> — {account.name}
        </Link>
      }
      meta={metaOf(account)}
      trailing={
        <>{account.isActive ? null : <AccountStatus isActive={false} />}</>
      }
    />
  );
};

type Column = DataTableColumn<AccountTreeRow>;

const COLUMNS: Column[] = [
  {
    key: "code",
    header: "Kode",
    width: "minmax(0,1fr)",
    cell: (account) => (
      <span className={cn("block min-w-0", indentOf(account.depth))}>
        <span
          className="block truncate font-medium tabular-nums"
          title={account.code}
        >
          {account.code}
        </span>

        {account.childCount > 0 ? (
          <span className="text-muted-foreground block truncate text-caption">
            {childCountLabel(account.childCount)}
          </span>
        ) : null}
      </span>
    ),
  },
  {
    key: "name",
    header: "Nama",
    width: "minmax(0,2.5fr)",
    cell: (account) => (
      <span className="block truncate" title={account.name}>
        {account.name}
      </span>
    ),
  },
  {
    key: "type",
    header: "Tipe",
    width: "minmax(0,1.2fr)",
    cell: (account) => (
      <span className="block truncate">{ACCOUNT_TYPE_LABEL[account.type]}</span>
    ),
  },
  {
    key: "parent",
    header: "Induk",
    width: "minmax(0,1.5fr)",
    isSecondary: true,
    cell: (account) => (
      <OptionalText
        text={
          account.parent
            ? `${account.parent.code} — ${account.parent.name}`
            : null
        }
        empty="Akun utama"
      />
    ),
  },
  {
    key: "status",
    header: "Status",
    width: "minmax(0,0.8fr)",
    cell: (account) => <AccountStatus isActive={account.isActive} />,
  },
];

const deleteLabelOf = (x: AccountTreeRow) => `Hapus akun ${x.code} ${x.name}`;

export const deleteTargetLabelOf = (x: AccountTreeRow) =>
  `akun ${x.code} ${x.name}`;

export function accountTable(
  isCanUpdate = false,
  // Dilewatkan dari layar daftar; `undefined` berarti pengguna tidak berhak
  // menghapus, jadi tombolnya tidak dirender sama sekali.
  onDelete?: (row: AccountTreeRow) => void,
): DataTableConfig<AccountTreeRow> {
  return {
    columns: COLUMNS,
    getRowActions: (x) => ({
      label: viewLabelOf(x),
      view: {
        href: detailHrefOf(x),
        onNavigate: () => saveFocus(x),
        label: viewLabelOf(x),
      },
      edit: isCanUpdate
        ? {
            href: accountEditHref(x.publicId),
            onNavigate: () => saveListFocus(AKUN_LIST_PATH, x.code),
            label: `Ubah akun ${x.code} ${x.name}`,
          }
        : undefined,
      remove: onDelete
        ? { onSelect: () => onDelete(x), label: deleteLabelOf(x) }
        : undefined,
    }),
  };
}

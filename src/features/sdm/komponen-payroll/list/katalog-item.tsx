import { Lock, Pencil } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import {
  ACCOUNT_UNMAPPED,
  KATALOG_LIST_PATH,
  MANAGED_NOTE,
  defaultValueText,
  isManaged,
  katalogEditHref,
} from "../model";
import { CALCULATION_TYPE_LABEL, type KomponenPayroll } from "../types";
import { ComponentStatus, ComponentTypeBadge } from "../ui";

export type AccountLabelOf = (accountId: number | null) => string;

const DEFAULT_ACCOUNT_LABEL: AccountLabelOf = () => ACCOUNT_UNMAPPED;

const saveFocus = (component: KomponenPayroll) =>
  saveListFocus(KATALOG_LIST_PATH, component.code);

const labelOf = (component: KomponenPayroll) => `Ubah ${component.name}`;

const hrefOf = (isCanUpdate: boolean) => (component: KomponenPayroll) =>
  isCanUpdate && !isManaged(component)
    ? katalogEditHref(component.code)
    : undefined;

const ManagedMark = () => (
  <span title={MANAGED_NOTE} className="text-muted-foreground shrink-0">
    <Lock aria-hidden className="size-3.5" />
    <span className="sr-only">Dikelola sistem</span>
  </span>
);

interface PropTypes {
  component: KomponenPayroll;
  isCanUpdate?: boolean;
}

export const KatalogListItemRow = (props: PropTypes) => {
  const { component, isCanUpdate = false } = props;

  const href = hrefOf(isCanUpdate)(component);

  return (
    <DataListRow
      id={component.code}
      title={
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate">{component.name}</span>
          {isManaged(component) ? <ManagedMark /> : null}
        </span>
      }
      meta={`${component.code} · ${defaultValueText(component)}`}
      trailing={
        <>
          <ComponentTypeBadge type={component.type} />

          {component.isActive ? null : <ComponentStatus isActive={false} />}

          {href ? (
            <Link
              href={href}
              onClick={() => saveFocus(component)}
              aria-label={labelOf(component)}
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon-sm" }),
                "cursor-pointer",
              )}
            >
              <Pencil aria-hidden />
            </Link>
          ) : null}
        </>
      }
    />
  );
};

export function katalogTable(
  isCanUpdate: boolean,
  accountLabelOf: AccountLabelOf = DEFAULT_ACCOUNT_LABEL,
): DataTableConfig<KomponenPayroll> {
  return {
    columns: [
      {
        key: "name",
        header: "Nama",
        width: "minmax(0,2.5fr)",
        narrowWidth: "minmax(0,2.5fr)",
        cell: (component) => (
          <span className="flex min-w-0 items-center gap-1.5 font-medium">
            <span className="truncate" title={component.name}>
              {component.name}
            </span>
            {isManaged(component) ? <ManagedMark /> : null}
          </span>
        ),
      },
      {
        key: "code",
        header: "Kode",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1fr)",
        cell: (component) => (
          <span className="tabular-nums">{component.code}</span>
        ),
      },
      {
        key: "type",
        header: "Jenis",
        width: "minmax(0,1.2fr)",
        narrowWidth: "minmax(0,1.2fr)",
        cell: (component) => <ComponentTypeBadge type={component.type} />,
      },
      {
        key: "calculationType",
        header: "Cara hitung",
        width: "minmax(0,1.2fr)",
        narrowWidth: "minmax(0,1.2fr)",
        isSecondary: true,
        cell: (component) => (
          <span className="block truncate">
            {CALCULATION_TYPE_LABEL[component.calculationType]}
          </span>
        ),
      },
      {
        key: "defaultValue",
        header: "Nilai default",
        width: "minmax(0,1.5fr)",
        narrowWidth: "minmax(0,1.5fr)",
        align: "end",
        cell: (component) => (
          <span className="block truncate tabular-nums">
            {defaultValueText(component)}
          </span>
        ),
      },
      {
        key: "account",
        header: "Akun",
        width: "minmax(0,1.5fr)",
        narrowWidth: "minmax(0,1.5fr)",
        isSecondary: true,
        cell: (component) => {
          const label = accountLabelOf(component.accountId);

          return (
            <span
              title={label}
              className={cn(
                "block truncate",
                component.accountId === null && "text-muted-foreground",
              )}
            >
              {label}
            </span>
          );
        },
      },
      {
        key: "status",
        header: "Status",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1fr)",
        cell: (component) => <ComponentStatus isActive={component.isActive} />,
      },
    ],
    getRowHref: hrefOf(isCanUpdate),
    getRowLabel: labelOf,
    onRowOpen: saveFocus,
    rowIcon: <Pencil />,
  };
}

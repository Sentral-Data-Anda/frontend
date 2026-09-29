import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { OptionalText } from "@/components/common/display";
import {
  DataListRow,
  TABLE_ROW_LINK,
  type DataTableColumn,
  type DataTableConfig,
} from "@/components/common/list";
import { saveListFocus } from "@/lib/list-return";

import {
  SUPPLIER_LIST_PATH,
  supplierDetailHref,
  supplierMetaOf,
} from "../model";
import type { Supplier } from "../types";
import { SupplierStatus } from "../ui";

import { EditLink } from "./edit-link";

const saveFocus = (supplier: Supplier) =>
  saveListFocus(SUPPLIER_LIST_PATH, supplier.code);

const detailHrefOf = (supplier: Supplier) => supplierDetailHref(supplier.code);

const viewLabelOf = (supplier: Supplier) => `Lihat supplier ${supplier.name}`;

interface PropTypes {
  supplier: Supplier;
  isCanUpdate?: boolean;
}

export const SupplierListItemRow = (props: PropTypes) => {
  const { supplier, isCanUpdate = false } = props;

  return (
    <DataListRow
      id={supplier.code}
      className="hover:bg-card relative transition-colors"
      title={
        <Link
          href={detailHrefOf(supplier)}
          onClick={() => saveFocus(supplier)}
          aria-label={viewLabelOf(supplier)}
          className={TABLE_ROW_LINK}
        >
          {supplier.name}
        </Link>
      }
      meta={<span className="tabular-nums">{supplierMetaOf(supplier)}</span>}
      trailing={
        <>
          {supplier.isActive ? null : <SupplierStatus isActive={false} />}
          {isCanUpdate ? <EditLink supplier={supplier} /> : null}
        </>
      }
    />
  );
};

type Column = DataTableColumn<Supplier>;

const COLUMNS: Column[] = [
  {
    key: "name",
    header: "Nama",
    width: "minmax(0,2fr)",
    cell: (supplier) => (
      <span className="block min-w-0">
        <span className="block truncate font-medium" title={supplier.name}>
          {supplier.name}
        </span>
        <span className="text-muted-foreground block truncate text-caption tabular-nums">
          {supplier.code}
        </span>
      </span>
    ),
  },
  {
    key: "contact",
    header: "Kontak",
    width: "minmax(0,1.5fr)",
    cell: (supplier) => (
      <OptionalText text={supplier.contactPerson} empty="Tanpa kontak" />
    ),
  },
  {
    key: "phone",
    header: "Telepon",
    width: "minmax(0,1.2fr)",
    cell: (supplier) => (
      <span className="block truncate tabular-nums">{supplier.phone}</span>
    ),
  },
  {
    key: "email",
    header: "Email",
    width: "minmax(0,1.8fr)",
    isSecondary: true,
    cell: (supplier) => (
      <OptionalText text={supplier.email} empty="Tanpa email" />
    ),
  },
  {
    key: "status",
    header: "Status",
    width: "minmax(0,1fr)",
    cell: (supplier) => <SupplierStatus isActive={supplier.isActive} />,
  },
];

const EDIT_COLUMN: Column = {
  key: "edit",
  header: "",
  width: "2rem",
  align: "end",
  cell: (supplier) => <EditLink supplier={supplier} />,
};

export function supplierTable(isCanUpdate: boolean): DataTableConfig<Supplier> {
  return {
    columns: isCanUpdate ? [...COLUMNS, EDIT_COLUMN] : COLUMNS,
    getRowHref: detailHrefOf,
    getRowLabel: viewLabelOf,
    onRowOpen: saveFocus,
    rowIcon: <ChevronRight />,
  };
}

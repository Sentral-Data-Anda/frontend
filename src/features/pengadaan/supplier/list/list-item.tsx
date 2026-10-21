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
  supplierEditHref,
  supplierMetaOf,
} from "../model";
import type { Supplier } from "../types";
import { SupplierStatus } from "../ui";

const saveFocus = (supplier: Supplier) =>
  saveListFocus(SUPPLIER_LIST_PATH, supplier.code);

const detailHrefOf = (supplier: Supplier) => supplierDetailHref(supplier.code);

const viewLabelOf = (supplier: Supplier) => `Lihat supplier ${supplier.name}`;

interface PropTypes {
  supplier: Supplier;
}

export const SupplierListItemRow = (props: PropTypes) => {
  const { supplier } = props;

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
        <>{supplier.isActive ? null : <SupplierStatus isActive={false} />}</>
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

const deleteLabelOf = (x: Supplier) => `Hapus ${x.name}`;

export const deleteTargetLabelOf = (x: Supplier) => `${x.name}`;

export function supplierTable(
  isCanUpdate: boolean,
  // Dilewatkan dari layar daftar; `undefined` berarti pengguna tidak berhak
  // menghapus, jadi tombolnya tidak dirender sama sekali.
  onDelete?: (row: Supplier) => void,
): DataTableConfig<Supplier> {
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
            href: supplierEditHref(x.publicId),
            onNavigate: () => saveListFocus(SUPPLIER_LIST_PATH, x.code),
            label: `Ubah ${x.name}`,
          }
        : undefined,
      remove: onDelete
        ? { onSelect: () => onDelete(x), label: deleteLabelOf(x) }
        : undefined,
    }),
  };
}

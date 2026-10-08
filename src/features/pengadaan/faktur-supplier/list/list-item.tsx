import { ChevronRight, Pencil } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import {
  DataListRow,
  TABLE_ROW_LINK,
  type DataTableColumn,
  type DataTableConfig,
} from "@/components/common/list";
import { formatAmount, formatDate, formatDateShort } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import {
  INVOICE_LIST_PATH,
  invoiceEditHref,
  invoiceHref,
  isEditable,
  outstandingOf,
} from "../model";
import type { Invoice } from "../types";
import { InvoiceStatusBadge } from "../ui";

const saveFocus = (invoice: Invoice) =>
  saveListFocus(INVOICE_LIST_PATH, invoice.publicId);

const detailHrefOf = (invoice: Invoice) => invoiceHref(invoice.publicId);

const viewLabelOf = (invoice: Invoice) =>
  `Lihat faktur ${invoice.code} dari ${invoice.supplier.name}, jatuh tempo ${formatDate(invoice.dueDate)}`;

// Jatuh tempo DULUAN: daftar ini diurutkan olehnya, dan di 390px apa yang di
// belakang terpotong. Diletakkan terakhir, fakta yang mengurutkan daftarnya
// justru yang hilang.
const metaOf = (invoice: Invoice) =>
  [
    `Jatuh tempo ${formatDateShort(invoice.dueDate)}`,
    invoice.supplierInvoiceNumber,
    invoice.code,
  ].join(" · ");

const editLink = (invoice: Invoice) =>
  isEditable(invoice) ? (
    <Link
      href={invoiceEditHref(invoice.publicId)}
      onClick={() => saveFocus(invoice)}
      aria-label={`Ubah faktur ${invoice.code}`}
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon-sm" }),
        "relative cursor-pointer",
      )}
    >
      <Pencil aria-hidden />
    </Link>
  ) : null;

interface PropTypes {
  invoice: Invoice;
  isCanUpdate?: boolean;
}

export const InvoiceListItemRow = (props: PropTypes) => {
  const { invoice, isCanUpdate = false } = props;

  return (
    <DataListRow
      id={invoice.publicId}
      className="hover:bg-card relative transition-colors"
      title={
        <Link
          href={detailHrefOf(invoice)}
          onClick={() => saveFocus(invoice)}
          aria-label={viewLabelOf(invoice)}
          className={TABLE_ROW_LINK}
        >
          {invoice.supplier.name}
        </Link>
      }
      meta={metaOf(invoice)}
      trailing={
        <>
          <span className="flex flex-col items-end gap-0.5">
            <span className="text-body font-medium tabular-nums">
              {formatAmount(invoice.totalIDR)}
            </span>
            <InvoiceStatusBadge status={invoice.status} />
          </span>
          {isCanUpdate ? editLink(invoice) : null}
        </>
      }
    />
  );
};

const COLUMNS: DataTableColumn<Invoice>[] = [
  {
    key: "supplier",
    header: "Supplier",
    width: "minmax(0,2fr)",
    cell: (invoice) => (
      <span className="block truncate font-medium">
        {invoice.supplier.name}
      </span>
    ),
  },
  {
    key: "number",
    header: "Nomor faktur",
    width: "minmax(0,1.3fr)",
    cell: (invoice) => (
      <span className="text-muted-foreground block truncate tabular-nums">
        {invoice.supplierInvoiceNumber}
      </span>
    ),
  },
  {
    key: "dueDate",
    header: "Jatuh tempo",
    width: "minmax(0,1fr)",
    cell: (invoice) => (
      <span className="block truncate tabular-nums">
        {formatDateShort(invoice.dueDate)}
      </span>
    ),
  },
  {
    key: "total",
    header: "Total",
    width: "minmax(0,1.2fr)",
    align: "end",
    cell: (invoice) => (
      <span className="tabular-nums">{formatAmount(invoice.totalIDR)}</span>
    ),
  },
  {
    key: "outstanding",
    header: "Sisa",
    width: "minmax(0,1.2fr)",
    align: "end",
    cell: (invoice) => (
      <span className="tabular-nums">
        {formatAmount(outstandingOf(invoice))}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    width: "minmax(0,1.2fr)",
    cell: (invoice) => <InvoiceStatusBadge status={invoice.status} />,
  },
];

const EDIT_COLUMN: DataTableColumn<Invoice> = {
  key: "edit",
  header: "",
  width: "2rem",
  align: "end",
  cell: editLink,
};

export function invoiceTable(isCanUpdate: boolean): DataTableConfig<Invoice> {
  return {
    columns: isCanUpdate ? [...COLUMNS, EDIT_COLUMN] : COLUMNS,
    getRowHref: detailHrefOf,
    getRowLabel: viewLabelOf,
    onRowOpen: saveFocus,
    rowIcon: <ChevronRight />,
  };
}

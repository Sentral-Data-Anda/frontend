import {
  DescriptionItem,
  DescriptionList,
  Panel,
} from "@/components/common/display";
import { DataList, DataListRow } from "@/components/common/list";
import { formatAmount, formatDate } from "@/lib/format";

import type { AssetAcquisition } from "../types";

interface PropTypes {
  acquisition: AssetAcquisition;
}

/**
 * Dari mana aset ini datang: pesanan yang memesannya, penerimaan yang
 * membuatnya, dan faktur yang menagihnya.
 *
 * Tidak ada kolom dari aset ke faktur. Jejaknya sudah ada lewat Penerimaan
 * Barang, jadi layar ini membacanya dan bukan menyimpan salinan keduanya.
 */
export const AcquisitionPanel = (props: PropTypes) => {
  const { acquisition } = props;

  const line = acquisition.purchaseOrderItem;
  const order = line.purchaseOrder;

  return (
    <Panel label="Asal perolehan" className="px-gutter py-4">
      <h2 className="mb-1 text-title font-semibold">Asal perolehan</h2>

      <DescriptionList>
        <DescriptionItem label="Supplier">
          <span className="wrap-break-word">{order.supplier.name}</span>
        </DescriptionItem>
        <DescriptionItem label="Pesanan pembelian">
          <span className="tabular-nums">{order.code}</span>
        </DescriptionItem>
        <DescriptionItem label="Tanggal pesanan">
          <span className="tabular-nums">{formatDate(order.orderDate)}</span>
        </DescriptionItem>
        <DescriptionItem label="Penerimaan barang">
          <span className="tabular-nums">{acquisition.goodsReceipt.code}</span>
        </DescriptionItem>
        <DescriptionItem label="Tanggal terima">
          <span className="tabular-nums">
            {formatDate(acquisition.goodsReceipt.receivedDate)}
          </span>
        </DescriptionItem>
        <DescriptionItem label="Baris pesanan" isWide>
          <span className="wrap-break-word">
            {line.name} — {line.quantity} × {formatAmount(line.unitPrice)}{" "}
            {order.currencyCode}
          </span>
        </DescriptionItem>
      </DescriptionList>

      <h3 className="text-muted-foreground mt-4 mb-2 text-body font-medium">
        Faktur atas pesanan ini
      </h3>

      {order.invoices.length === 0 ? (
        <p className="text-muted-foreground text-body">
          Pesanan ini belum ditagih. Aset tetap sah dimiliki; yang belum ada
          adalah tagihan dari suppliernya.
        </p>
      ) : (
        <DataList
          items={order.invoices}
          getKey={(invoice) => invoice.publicId}
          label="Daftar faktur atas pesanan ini"
        >
          {(invoice) => (
            <DataListRow
              id={invoice.publicId}
              title={invoice.supplierInvoiceNumber}
              meta={[
                invoice.code,
                formatDate(invoice.invoiceDate),
                formatAmount(invoice.totalIDR),
              ].join(" · ")}
            />
          )}
        </DataList>
      )}
    </Panel>
  );
};

import Link from "next/link";

import {
  DescriptionItem,
  DescriptionList,
  OptionalText,
  Panel,
} from "@/components/common/display";
import { formatDate } from "@/lib/format";

import { orderHref, supplierNameOf } from "../model";
import { ORDER_STATUS_LABEL, type ReceiptDetail } from "../types";

interface PropTypes {
  receipt: ReceiptDetail;
  isOrderLinked: boolean;
}

export const SummaryPanel = (props: PropTypes) => {
  const { receipt, isOrderLinked } = props;
  const order = receipt.purchaseOrder;

  return (
    <Panel label="Ringkasan penerimaan barang">
      <DescriptionList className="px-gutter py-2">
        <DescriptionItem label="Pesanan">
          <span className="tabular-nums">
            {isOrderLinked ? (
              <Link
                href={orderHref(order.code)}
                className="text-primary cursor-pointer rounded-sm underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                {order.code}
              </Link>
            ) : (
              order.code
            )}
            <span className="text-muted-foreground font-normal">
              {` · ${ORDER_STATUS_LABEL[order.status]}`}
            </span>
          </span>
        </DescriptionItem>
        <DescriptionItem label="Supplier">
          {supplierNameOf(receipt)}
        </DescriptionItem>
        <DescriptionItem label="Tanggal terima">
          <span className="tabular-nums">
            {formatDate(receipt.receivedDate)}
          </span>
        </DescriptionItem>
        <DescriptionItem label="Dicatat oleh">
          <OptionalText
            text={receipt.receivedBy?.name}
            empty="Tidak diketahui"
          />
        </DescriptionItem>
        <DescriptionItem label="Catatan" isStacked isWide>
          {receipt.note ? (
            <span className="font-normal">{receipt.note}</span>
          ) : (
            <OptionalText empty="Tanpa catatan" />
          )}
        </DescriptionItem>
      </DescriptionList>
    </Panel>
  );
};

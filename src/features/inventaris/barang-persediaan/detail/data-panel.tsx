import {
  DescriptionItem,
  DescriptionList,
  OptionalText,
} from "@/components/common/display";
import { formatAmount } from "@/lib/format";

import { valueOf } from "../model";
import type { StockItem } from "../types";

interface PropTypes {
  item: StockItem;
}

export const DataPanel = (props: PropTypes) => {
  const { item } = props;

  return (
    <section aria-labelledby="stock-data" className="min-w-0">
      <h2 id="stock-data" className="mb-1 text-title font-semibold">
        Data
      </h2>
      <DescriptionList>
        <DescriptionItem label="Tipe">{item.type.name}</DescriptionItem>
        <DescriptionItem label="Satuan">{item.unit.name}</DescriptionItem>
        <DescriptionItem label="Ruang">{item.room.name}</DescriptionItem>
        <DescriptionItem label="Badan pelayanan">
          {item.bapel.name}
        </DescriptionItem>
        {/* Sebelum harga beli terakhir, dengan sengaja: INI yang menilai stok
            keluar dan yang membuat nilai persediaan di Neraca. Harga beli
            terakhir hanya keterangan. */}
        <DescriptionItem label="Harga rata-rata">
          {item.avgUnitPrice === null ? (
            <span className="flex flex-col">
              <span>—</span>
              <span className="text-muted-foreground text-caption font-normal">
                Belum pernah ada harga masuk. Pengambilan barang ini ditolak
                saat posting sampai harganya terisi.
              </span>
            </span>
          ) : (
            <span className="flex flex-col">
              <span className="tabular-nums">
                {formatAmount(item.avgUnitPrice)}
              </span>
              <span className="text-muted-foreground text-caption font-normal">
                Nilai persediaan {formatAmount(valueOf(item))}
              </span>
            </span>
          )}
        </DescriptionItem>
        <DescriptionItem label="Harga beli terakhir">
          {item.lastUnitPrice === null ? (
            "—"
          ) : (
            <span className="flex flex-col">
              <span className="tabular-nums">
                {formatAmount(item.lastUnitPrice)}
              </span>
              <span className="text-muted-foreground text-caption font-normal">
                Dari penerimaan barang terakhir
              </span>
            </span>
          )}
        </DescriptionItem>
        <DescriptionItem label="Keterangan" isStacked isWide>
          {item.description ? (
            <span className="font-normal whitespace-pre-line">
              {item.description}
            </span>
          ) : (
            <OptionalText text={null} empty="Tanpa keterangan" />
          )}
        </DescriptionItem>
      </DescriptionList>
    </section>
  );
};

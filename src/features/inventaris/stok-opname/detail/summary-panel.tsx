import {
  DescriptionItem,
  DescriptionList,
  OptionalText,
  Panel,
} from "@/components/common/display";
import { formatDate, formatDateTime, formatNumber } from "@/lib/format";

import { roomNameOf } from "../model";
import type { OpnameDetail } from "../types";

const byOf = (person: { name: string } | null, at: string | null) =>
  [person?.name, at ? formatDateTime(at) : null].filter(Boolean).join(" · ");

interface PropTypes {
  opname: OpnameDetail;
}

export const SummaryPanel = (props: PropTypes) => {
  const { opname } = props;

  const differenceCount = opname.items.filter(
    (item) => item.difference !== 0,
  ).length;

  return (
    <Panel label="Ringkasan stok opname">
      <DescriptionList className="px-gutter py-2">
        <DescriptionItem label="Tanggal">
          <span className="tabular-nums">{formatDate(opname.opnameDate)}</span>
        </DescriptionItem>
        <DescriptionItem label="Ruang">
          {roomNameOf(opname.room)}
        </DescriptionItem>
        <DescriptionItem label="Hitungan">
          <span className="tabular-nums">
            {`${formatNumber(opname.items.length)} barang dihitung, ${formatNumber(differenceCount)} selisih`}
          </span>
        </DescriptionItem>
        <DescriptionItem label="Catatan">
          <OptionalText text={opname.note} empty="Tanpa catatan" />
        </DescriptionItem>
        {opname.completedAt ? (
          <DescriptionItem label="Selesai dihitung oleh" isWide>
            <span className="tabular-nums">
              {byOf(opname.completedBy, opname.completedAt)}
            </span>
          </DescriptionItem>
        ) : null}
        {opname.postedAt ? (
          <DescriptionItem label="Diposting oleh" isWide>
            <span className="tabular-nums">
              {byOf(opname.postedBy, opname.postedAt)}
            </span>
          </DescriptionItem>
        ) : null}
      </DescriptionList>
    </Panel>
  );
};

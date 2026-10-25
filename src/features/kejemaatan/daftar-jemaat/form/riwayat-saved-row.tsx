import { LineItemCard } from "@/components/common/form";
import { formatDate } from "@/lib/format";

import { type JemaatFormValues } from "../model";

import { RiwayatCell, type RiwayatField } from "./riwayat-cell";
import { riwayatTitle, sacramentLabel } from "./riwayat-display";

const EMPTY = "—";

interface PropTypes {
  index: number;
  row: JemaatFormValues["additional"][number];
}

export const RiwayatSavedRow = (props: PropTypes) => {
  const { index, row } = props;

  const idOf = (field: RiwayatField) => `additional.${index}.${field}`;

  const cellOf = (field: RiwayatField, value: string) => (
    <RiwayatCell field={field} id={idOf(field)} index={index}>
      {/* output termasuk elemen yang bisa dipasangi label, jadi nama kolomnya menempel. */}
      <output id={idOf(field)} className="text-body block wrap-break-word">
        {value || <span className="text-muted-foreground">{EMPTY}</span>}
      </output>
    </RiwayatCell>
  );

  return (
    <LineItemCard
      index={index}
      title={riwayatTitle(row.type, index)}
      removeLabel=""
      messages={[]}
    >
      {cellOf("type", sacramentLabel(row.type) ?? "")}
      {cellOf("date", row.date ? formatDate(row.date) : "")}
      {cellOf("place", row.place)}
      {cellOf("certificateNumber", row.certificateNumber)}
    </LineItemCard>
  );
};

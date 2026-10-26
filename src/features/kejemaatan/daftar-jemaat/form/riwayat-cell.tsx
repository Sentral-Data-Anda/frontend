import type { ReactNode } from "react";

import { FieldLabel } from "@/components/common/form";

export const ROW_LABEL = "text-muted-foreground mb-1 block text-caption";

export const RIWAYAT_FIELDS = [
  "type",
  "date",
  "place",
  "certificateNumber",
  "partnerId",
  "endedAt",
] as const;

export type RiwayatField = (typeof RIWAYAT_FIELDS)[number];

// Satu tempat memegang label dan lebar kolom, supaya baris yang dibaca di layar
// Ubah tidak bisa bergeser dari baris yang diisi di layar Tambah.
const LABEL: Record<RiwayatField, string> = {
  type: "Jenis",
  date: "Tanggal",
  place: "Tempat",
  certificateNumber: "Nomor surat",
  partnerId: "Pasangan",
  endedAt: "Tanggal cerai",
};

const COLUMN: Record<RiwayatField, string> = {
  type: "flex-[1_1_11rem]",
  date: "flex-[1_1_11rem]",
  place: "flex-[2_1_13rem]",
  certificateNumber: "flex-[1_1_11rem]",
  partnerId: "flex-[1_1_11rem]",
  endedAt: "flex-[1_1_11rem]",
};

interface PropTypes {
  field: RiwayatField;
  id: string;
  index: number;
  isRequired?: boolean;
  note?: string;
  children: ReactNode;
}

export const RiwayatCell = (props: PropTypes) => {
  const { field, id, index, isRequired = false, note, children } = props;

  return (
    <div className={`min-w-0 ${COLUMN[field]}`}>
      <FieldLabel htmlFor={id} isRequired={isRequired} className={ROW_LABEL}>
        {LABEL[field]}
        <span className="sr-only"> baris {index + 1}</span>
      </FieldLabel>

      {children}

      {note ? (
        <p className="text-muted-foreground mt-1 text-caption">{note}</p>
      ) : null}
    </div>
  );
};

import { DescriptionItem, DescriptionList } from "@/components/common/display";
import { formatDate } from "@/lib/format";

import { type JemaatAdditional } from "../types";

/**
 * Pernikahan jemaat ini, dibaca saja.
 *
 * Form ini tidak bisa menulisnya: pernikahan dicatat dari fitur Keluarga, yang
 * tahu rumah tangga mana yang dimaksud dan kursi mana yang masih kosong. Dulu
 * ia dipilih di sini lewat dropdown berisi seluruh jemaat, dan petugas memilih
 * satu nama dari daftar ribuan tanpa sistem tahu keluarga mana yang dimaksud.
 * Lihat ../../../../../../docs/decisions/specs/2026-11-02-peran-keluarga-dan-pernikahan-design.md.
 *
 * Tetap ditampilkan, karena menghilangkannya dari layar detail akan membuat
 * petugas mengira pernikahannya belum tercatat.
 */

const END_REASON_LABEL = {
  CERAI_HIDUP: "Cerai hidup",
  CERAI_MATI: "Cerai mati",
} as const;

interface PropTypes {
  rows: readonly JemaatAdditional[];
}

export const PernikahanReadonly = (props: PropTypes) => {
  const { rows } = props;

  const marriages = rows.filter((row) => row.type === "NIKAH");

  if (marriages.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-caption">
        Pernikahan dicatat dari menu Keluarga, jadi tidak bisa diubah di sini.
      </p>

      {marriages.map((row, index) => (
        <DescriptionList
          key={row.publicId ?? index}
          className="border-hairline rounded-md border px-3"
        >
          <DescriptionItem label="Pasangan">
            {row.partnerJemaat?.name ?? "—"}
          </DescriptionItem>
          <DescriptionItem label="Tanggal menikah">
            {formatDate(row.date) || "—"}
          </DescriptionItem>
          <DescriptionItem label="Tempat">{row.place ?? "—"}</DescriptionItem>
          <DescriptionItem label="Nomor surat">
            {row.certificateNumber ?? "—"}
          </DescriptionItem>

          {row.endedAt ? (
            <>
              <DescriptionItem label="Berakhir">
                {formatDate(row.endedAt)}
              </DescriptionItem>
              <DescriptionItem label="Alasan berakhir">
                {row.endReason ? END_REASON_LABEL[row.endReason] : "—"}
              </DescriptionItem>
            </>
          ) : null}
        </DescriptionList>
      ))}
    </div>
  );
};

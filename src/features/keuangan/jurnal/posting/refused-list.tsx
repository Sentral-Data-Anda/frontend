"use client";

import Link from "next/link";

import {
  DataList,
  DataListRow,
  type DataTableConfig,
} from "@/components/common/list";

import { TEXT_LINK } from "../model";
import type { PostingRefusal } from "../types";
import { FixLink } from "../ui";

const codeCell = (
  refusal: PostingRefusal,
  hrefOf: (code: string) => string | null,
) => {
  const href = hrefOf(refusal.code);

  return href ? (
    <Link href={href} className={TEXT_LINK}>
      {refusal.code}
    </Link>
  ) : (
    <span className="tabular-nums">{refusal.code}</span>
  );
};

const refusalTable = (
  noun: string,
  hrefOf: (code: string) => string | null,
): DataTableConfig<PostingRefusal> => ({
  columns: [
    {
      key: "code",
      header: noun,
      width: "minmax(0,1.2fr)",
      cell: (refusal) => (
        <span className="block truncate tabular-nums">
          {codeCell(refusal, hrefOf)}
        </span>
      ),
    },
    {
      key: "reason",
      header: "Alasan ditolak",
      width: "minmax(0,3fr)",
      cell: (refusal) => (
        <span className="block min-w-0 truncate" title={refusal.reason}>
          {refusal.reason}
        </span>
      ),
    },
    {
      key: "fix",
      header: "Perbaikan",
      width: "minmax(0,1.4fr)",
      cell: (refusal) => <FixLink code={refusal.reasonCode} isPlain />,
    },
  ],
});

interface PropTypes {
  refused: readonly PostingRefusal[];
  /** Apa yang ditolak, sebagai judul kolom dan label: "Persembahan", "Aset". */
  noun: string;
  /**
   * Ke mana sebuah kode menuju, atau null kalau pembacanya tidak boleh
   * membukanya. Dihitung PEMANGGIL, karena izin yang memutuskan berbeda per
   * dokumen — dan sebuah hook tidak bisa dipanggil bersyarat di sini.
   */
  hrefOf: (code: string) => string | null;
}

export const RefusedList = (props: PropTypes) => {
  const { refused, noun, hrefOf } = props;

  if (refused.length === 0) return null;

  const label = `${noun} yang ditolak`;

  return (
    <section aria-label={label} className="space-y-2">
      <h2 className="text-title px-gutter font-semibold">
        Ditolak, dan cara memperbaikinya
      </h2>

      <p className="text-muted-foreground px-gutter text-body">
        Baris yang ditolak tidak dibukukan. Baris lain tetap diposting, jadi
        perbaiki yang di bawah lalu jalankan rentang ini sekali lagi.
      </p>

      <DataList
        items={[...refused]}
        getKey={(refusal) => `${refusal.code}-${refusal.reasonCode}`}
        label={label}
        table={refusalTable(noun, hrefOf)}
      >
        {(refusal) => (
          <DataListRow
            title={codeCell(refusal, hrefOf)}
            meta={refusal.reason}
            trailing={<FixLink code={refusal.reasonCode} isPlain />}
          />
        )}
      </DataList>
    </section>
  );
};

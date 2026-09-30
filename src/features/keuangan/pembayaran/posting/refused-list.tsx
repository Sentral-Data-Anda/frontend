"use client";

import {
  DataList,
  DataListRow,
  type DataTableConfig,
} from "@/components/common/list";

import type { PostingRefusal } from "../types";
import { FixLink } from "../ui";

const refusalTable: DataTableConfig<PostingRefusal> = {
  columns: [
    {
      key: "code",
      header: "Pembayaran",
      width: "minmax(0,1.2fr)",
      cell: (refusal) => (
        <span className="block truncate tabular-nums">{refusal.code}</span>
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
};

interface PropTypes {
  refused: readonly PostingRefusal[];
}

export const RefusedList = (props: PropTypes) => {
  const { refused } = props;

  if (refused.length === 0) return null;

  return (
    <section aria-label="Pembayaran yang ditolak" className="space-y-2">
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
        label="Pembayaran yang ditolak"
        table={refusalTable}
      >
        {(refusal) => (
          <DataListRow
            title={<span className="tabular-nums">{refusal.code}</span>}
            meta={refusal.reason}
            trailing={<FixLink code={refusal.reasonCode} isPlain />}
          />
        )}
      </DataList>
    </section>
  );
};

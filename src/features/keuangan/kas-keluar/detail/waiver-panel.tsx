"use client";

import { Panel } from "@/components/common/display";
import { formatDateTime } from "@/lib/format";
import type { GateWaiver } from "@/types/anggaran";

interface PropTypes {
  waiver: GateWaiver;
  label: string;
}

// Alasannya ditampilkan PENUH. `line-clamp`, `truncate`, dan tooltip dilarang
// di sini: alasan tersimpan adalah satu-satunya kendali atas pintu ini, dan
// alasan yang tidak terbaca bukan kendali.
export const WaiverPanel = (props: PropTypes) => {
  const { waiver, label } = props;

  return (
    <Panel>
      <section
        aria-label="Pembebasan gerbang pencairan"
        className="space-y-1 px-gutter py-3"
      >
        <h2 className="text-body font-medium">
          Pencairan bulan {label} dibebaskan
        </h2>

        <p className="text-muted-foreground text-caption">
          {waiver.createdBy?.name ?? "Bendahara"} ·{" "}
          {formatDateTime(waiver.createdAt)}
        </p>

        <p className="text-body whitespace-pre-line">{waiver.reason}</p>
      </section>
    </Panel>
  );
};

import { Badge, PANEL_TITLE, Panel } from "@/components/common/display";

import type { JadwalSlot } from "../types";

interface PropTypes {
  slots: readonly JadwalSlot[];
}

export const PetugasPanel = (props: PropTypes) => {
  const { slots } = props;

  const ordered = [...slots].sort((a, b) => a.order - b.order);
  const filled = ordered.filter((slot) => slot.pelayan).length;

  return (
    <Panel label="Petugas">
      <div className="flex items-baseline justify-between gap-3 px-gutter pt-4 pb-2">
        <h2 className={PANEL_TITLE}>Petugas</h2>
        <p className="text-muted-foreground text-caption tabular-nums">
          {filled} dari {ordered.length} terisi
        </p>
      </div>

      <ol className="divide-hairline divide-y px-gutter pb-2">
        {ordered.map((slot, index) => (
          <li key={slot.order} className="flex items-baseline gap-2 py-2.5">
            <span className="text-muted-foreground w-7 shrink-0 text-body font-semibold tabular-nums">
              {index + 1}
            </span>

            <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-4 gap-y-0.5">
              <span className="text-muted-foreground min-w-0 flex-[1_1_10rem] text-body">
                {slot.role.name}
              </span>

              {slot.pelayan ? (
                <span className="flex min-w-0 flex-[2_1_14rem] items-center gap-2 text-body font-medium">
                  <span className="truncate" title={slot.pelayan.name}>
                    {slot.pelayan.name}
                    {slot.pelayan.isActive ? null : (
                      <span className="text-muted-foreground font-normal">
                        {" "}
                        (nonaktif)
                      </span>
                    )}
                  </span>
                  {slot.pelayan.isGroup ? (
                    <Badge variant="secondary">Kelompok</Badge>
                  ) : null}
                </span>
              ) : (
                <span className="text-muted-foreground min-w-0 flex-[2_1_14rem] text-body italic">
                  Belum diisi
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  );
};

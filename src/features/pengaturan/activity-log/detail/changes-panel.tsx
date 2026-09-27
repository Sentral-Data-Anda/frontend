"use client";

import { PANEL_TITLE, Panel } from "@/components/common/display";
import { EmptyState } from "@/components/common/feedback";
import {
  TABLE_HEAD,
  TABLE_HEAD_LINE_ON_CARD,
  TABLE_ROWS_ON_CARD,
} from "@/components/common/list";
import { useIsTableWidth } from "@/hooks/use-media";
import { cn } from "@/lib/utils";

import type { Change } from "../model";

import { ChangeValue } from "./change-value";

const COLUMNS =
  "grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,2fr)] gap-4";

interface PropTypes {
  changes: Change[];
}

export const ChangesPanel = (props: PropTypes) => {
  const { changes } = props;

  const isTable = useIsTableWidth() === true;

  return (
    <Panel label="Perubahan">
      <h2 className={cn(PANEL_TITLE, "px-gutter pt-4 pb-2")}>Perubahan</h2>

      {changes.length === 0 ? (
        <EmptyState
          title="Tidak ada perubahan field"
          description="Catatan ini hanya menyentuh kolom sistem."
          isCompact
          className="pb-4"
        />
      ) : isTable ? (
        <div role="table" aria-label="Perubahan per field" className="pb-2">
          <div
            role="row"
            className={cn(TABLE_HEAD_LINE_ON_CARD, COLUMNS, "px-gutter pb-2")}
          >
            <span role="columnheader" className={TABLE_HEAD}>
              Field
            </span>
            <span role="columnheader" className={TABLE_HEAD}>
              Sebelum
            </span>
            <span role="columnheader" className={TABLE_HEAD}>
              Sesudah
            </span>
          </div>

          <div role="rowgroup" className={TABLE_ROWS_ON_CARD}>
            {changes.map((change) => (
              <div
                key={change.field}
                role="row"
                className={cn(COLUMNS, "items-start px-gutter py-2.5")}
              >
                <span
                  role="cell"
                  className="font-mono text-body font-medium break-all"
                >
                  {change.field}
                </span>
                <div role="cell" className="min-w-0">
                  <ChangeValue value={change.before} />
                </div>
                <div role="cell" className="min-w-0">
                  <ChangeValue value={change.after} isAfter />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <ul aria-label="Perubahan per field" className={TABLE_ROWS_ON_CARD}>
          {changes.map((change) => (
            <li key={change.field} className="px-gutter py-3">
              <p className="font-mono text-body font-medium break-all">
                {change.field}
              </p>

              <dl className="mt-1.5 space-y-1.5">
                <div>
                  <dt className="text-muted-foreground text-caption">
                    Sebelum
                  </dt>
                  <dd>
                    <ChangeValue value={change.before} />
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-caption">
                    Sesudah
                  </dt>
                  <dd>
                    <ChangeValue value={change.after} isAfter />
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
};

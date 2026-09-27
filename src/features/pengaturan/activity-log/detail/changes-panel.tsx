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

import { isOneSided, type Change } from "../model";
import type { LogAction } from "../types";

import { ChangeValue } from "./change-value";

const COLUMNS = {
  single: "grid grid-cols-[minmax(0,1fr)_minmax(0,4fr)] gap-4",
  pair: "grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,2fr)] gap-4",
};

interface PropTypes {
  action: LogAction;
  changes: Change[];
}

export const ChangesPanel = (props: PropTypes) => {
  const { action, changes } = props;

  const isTable = useIsTableWidth() === true;
  const isSingle = isOneSided(action);
  const columns = isSingle ? COLUMNS.single : COLUMNS.pair;
  const headers = isSingle
    ? ["Field", "Nilai"]
    : ["Field", "Sebelum", "Sesudah"];
  const valueOf = (change: Change) =>
    action === "delete" ? change.before : change.after;

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
            className={cn(TABLE_HEAD_LINE_ON_CARD, columns, "px-gutter pb-2")}
          >
            {headers.map((header) => (
              <span key={header} role="columnheader" className={TABLE_HEAD}>
                {header}
              </span>
            ))}
          </div>

          <div role="rowgroup" className={TABLE_ROWS_ON_CARD}>
            {changes.map((change) => (
              <div
                key={change.field}
                role="row"
                className={cn(columns, "items-start px-gutter py-2.5")}
              >
                <span
                  role="cell"
                  className="font-mono text-body font-medium break-all"
                >
                  {change.field}
                </span>

                {isSingle ? (
                  <div role="cell" className="min-w-0">
                    <ChangeValue value={valueOf(change)} isAfter />
                  </div>
                ) : (
                  <>
                    <div role="cell" className="min-w-0">
                      <ChangeValue value={change.before} />
                    </div>
                    <div role="cell" className="min-w-0">
                      <ChangeValue value={change.after} isAfter />
                    </div>
                  </>
                )}
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

              {isSingle ? (
                <div className="mt-1">
                  <ChangeValue value={valueOf(change)} isAfter />
                </div>
              ) : (
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
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
};

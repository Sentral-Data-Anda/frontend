"use client";

import { Button } from "@/components/common/control";

import { EMPTY_POST_NOTE, isCalculated } from "../model";
import type { RunAction, RunDetail } from "../types";

interface PropTypes {
  run: Pick<RunDetail, "status" | "updatedAt" | "entries">;
  isCanUpdate: boolean;
  isCanDelete: boolean;
  pendingAction: RunAction | "delete" | null;
  onCalculate: () => void;
  onPost: () => void;
  onDelete: () => void;
}

export const RunActions = (props: PropTypes) => {
  const {
    run,
    isCanUpdate,
    isCanDelete,
    pendingAction,
    onCalculate,
    onPost,
    onDelete,
  } = props;

  const isDone = isCalculated(run);
  const isBusy = pendingAction !== null;

  if (run.status !== "DRAFT" || (!isCanUpdate && !isCanDelete)) return null;

  return (
    <section
      aria-label="Tindakan periode"
      className="flex flex-wrap items-center justify-end gap-3 px-gutter pt-4"
    >
      {isCanUpdate ? (
        <p className="text-muted-foreground min-w-0 flex-[1_1_16rem] text-body">
          {!isDone
            ? "Hitung dulu; Posting tersedia sesudah dihitung."
            : run.entries.length === 0
              ? EMPTY_POST_NOTE
              : "Posting membuat jurnal dan mengunci periode ini."}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        {isCanDelete ? (
          <Button
            type="button"
            variant="destructive"
            disabled={isBusy}
            onClick={onDelete}
          >
            {pendingAction === "delete" ? "Menghapus…" : "Hapus"}
          </Button>
        ) : null}

        {isCanUpdate ? (
          <Button
            type="button"
            variant={isDone ? "outline" : "default"}
            disabled={isBusy}
            onClick={onCalculate}
          >
            {pendingAction === "calculate"
              ? "Menghitung…"
              : isDone
                ? "Hitung ulang"
                : "Hitung"}
          </Button>
        ) : null}

        {isCanUpdate && isDone ? (
          <Button type="button" disabled={isBusy} onClick={onPost}>
            {pendingAction === "post" ? "Memposting…" : "Posting"}
          </Button>
        ) : null}
      </div>
    </section>
  );
};

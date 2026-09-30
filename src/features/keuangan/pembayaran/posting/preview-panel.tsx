"use client";

import { CircleSlash, Stamp, TriangleAlert } from "lucide-react";

import { KpiCell, KpiStrip } from "@/components/common/dashboard";
import { formatNumber } from "@/lib/format";

import type { PostingResult } from "../types";

const POSTED_HINT: Record<"preview" | "done", string> = {
  preview: "akan dibukukan",
  done: "sudah dibukukan",
};

interface PropTypes {
  result: PostingResult;
  isDone: boolean;
}

export const PreviewPanel = (props: PropTypes) => {
  const { result, isDone } = props;

  return (
    <KpiStrip label={isDone ? "Hasil posting" : "Pratinjau posting"}>
      <KpiCell
        label={isDone ? "Diposting" : "Akan diposting"}
        icon={Stamp}
        tone="primary"
        value={formatNumber(result.posted)}
        hint={POSTED_HINT[isDone ? "done" : "preview"]}
      />
      <KpiCell
        label="Dilewati"
        icon={CircleSlash}
        tone="secondary"
        value={formatNumber(result.skipped)}
        hint="sudah pernah diposting — bukan galat"
      />
      <KpiCell
        label="Ditolak"
        icon={TriangleAlert}
        tone={result.refused.length > 0 ? "warning" : "secondary"}
        value={formatNumber(result.refused.length)}
        hint={
          result.refused.length > 0
            ? "perlu diperbaiki dulu"
            : "tidak ada yang ditolak"
        }
      />
    </KpiStrip>
  );
};

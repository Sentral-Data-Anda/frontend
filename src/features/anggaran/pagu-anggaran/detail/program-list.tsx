"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { Badge, Panel } from "@/components/common/display";
import { EmptyState } from "@/components/common/feedback";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { formatRupiah } from "@/lib/format";
import { PROGRAM_STATUS_LABEL } from "@/types/anggaran";

import { useYearPrograms } from "../api";
import { heldByProgram, programDetailHref } from "../model";
import type { YearProgram } from "../types";

const BADGE_VARIANT = {
  DRAFT: "draft",
  APPROVED: "success",
  CANCELLED: "neutral",
} as const;

interface PropTypes {
  bapelId: number;
  year: number;
}

export const ProgramList = (props: PropTypes) => {
  const { bapelId, year } = props;

  const { isCanView } = useMenuAccess(MENU.PROGRAM);
  const programs = useYearPrograms(isCanView ? bapelId : undefined, year);

  if (!isCanView) return null;

  return (
    <Panel>
      <div className="px-gutter py-3">
        <h2 className="text-title font-semibold">Program tahun ini</h2>
        <p className="text-muted-foreground text-caption">
          Usulan yang diukur terhadap pagu ini.
        </p>
      </div>

      {programs.isPending ? (
        <p className="text-muted-foreground px-gutter pb-4 text-body">
          Memuat program…
        </p>
      ) : programs.error ? (
        <p role="alert" className="text-destructive px-gutter pb-4 text-body">
          {programs.error.message}
        </p>
      ) : (programs.data ?? []).length === 0 ? (
        <EmptyState
          isCompact
          title="Belum ada program"
          description="Belum ada usulan program untuk tahun pelayanan ini."
        />
      ) : (
        <ul aria-label="Program tahun ini" className="divide-hairline divide-y">
          {(programs.data ?? []).map((program: YearProgram) => (
            <li key={program.publicId}>
              <Link
                href={programDetailHref(program.publicId)}
                className="hover:bg-muted focus-visible:ring-ring flex items-center gap-3 px-gutter py-3 outline-none focus-visible:ring-2"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body font-medium">
                    {program.name}
                  </span>
                  <span className="text-muted-foreground block truncate text-caption tabular-nums">
                    {program.code}
                  </span>
                </span>

                <Badge variant={BADGE_VARIANT[program.status]}>
                  {PROGRAM_STATUS_LABEL[program.status]}
                </Badge>

                <span className="shrink-0 text-body font-medium tabular-nums">
                  {formatRupiah(Number(heldByProgram(program)))}
                </span>

                <ChevronRight
                  className="text-muted-foreground size-4 shrink-0"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
};

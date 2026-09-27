"use client";

import { TriangleAlert } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/common/control";
import { DescriptionSkeleton, Panel } from "@/components/common/display";
import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";

import { useActivityLogDetail } from "../api";
import {
  ACTIVITY_LOG_LIST_PATH,
  actionKindOf,
  listChanges,
  logTitle,
} from "../model";

import { ChangesPanel } from "./changes-panel";
import { SummaryPanel } from "./summary-panel";

interface PropTypes {
  id: string;
}

export const ActivityLogDetailScreen = (props: PropTypes) => {
  const { id } = props;

  const listReturn = useListReturn(ACTIVITY_LOG_LIST_PATH);
  const detail = useActivityLogDetail(id);
  const log = detail.data;
  const isNotFound =
    detail.error instanceof FetchError && detail.error.status === 404;

  const header = (title: string, subtitle?: string) => (
    <PageHeader
      title={title}
      subtitle={subtitle}
      backHref={listReturn}
      isBackPersistent
    />
  );

  if (isNotFound) {
    return (
      <div className="pb-8">
        {header("Log Aktivitas")}
        <EmptyState
          title="Catatan tidak ditemukan"
          description="Catatan ini tidak ada, atau alamatnya salah."
          action={
            <Link
              href={listReturn}
              className={buttonVariants({ variant: "outline" })}
            >
              Kembali ke log aktivitas
            </Link>
          }
        />
      </div>
    );
  }

  if (detail.error) {
    return (
      <div className="pb-8">
        {header("Log Aktivitas")}
        <div
          role="alert"
          className="flex flex-col items-center px-gutter py-12 text-center"
        >
          <TriangleAlert className="text-destructive mb-3 size-8" aria-hidden />
          <p className="text-body font-medium">Gagal memuat catatan</p>
          <p className="text-muted-foreground mt-1 text-body">
            {detail.error.message}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void detail.refetch()}
            disabled={detail.isFetching}
            className="mt-4"
          >
            {detail.isFetching ? "Memuat…" : "Coba lagi"}
          </Button>
        </div>
      </div>
    );
  }

  if (!log) {
    return (
      <div className="pb-8">
        {header("Log Aktivitas")}
        <div className="px-gutter">
          <Panel>
            <div className="px-gutter py-2">
              <DescriptionSkeleton label="Memuat catatan" rows={5} />
            </div>
          </Panel>
        </div>
      </div>
    );
  }

  const kind = actionKindOf(log);

  return (
    <div className="pb-8">
      {header(
        logTitle(kind, log.model),
        log.recordId ? `#${log.recordId}` : undefined,
      )}

      <div className="space-y-4 px-gutter">
        <SummaryPanel log={log} kind={kind} />
        <ChangesPanel changes={listChanges(log)} />
      </div>
    </div>
  );
};

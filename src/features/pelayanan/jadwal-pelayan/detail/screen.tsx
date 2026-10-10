"use client";

import { Copy, Pencil, TriangleAlert } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Button, buttonVariants } from "@/components/common/control";
import { DescriptionSkeleton, Panel } from "@/components/common/display";
import { EmptyState } from "@/components/common/feedback";
import { FormNotFound } from "@/components/common/form";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListReturn } from "@/hooks/use-list-return";
import { useIsTableWidth } from "@/hooks/use-media";
import { FetchError } from "@/lib/api/fetcher";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

import { useJadwalPelayanDetail } from "../api";
import {
  JADWAL_PELAYAN_LIST_PATH,
  detailToWhatsApp,
  formatTimeRange,
  jadwalEditHref,
  salinHref,
  toWhatsAppText,
} from "../model";
import { WhatsAppButton } from "../ui";

import { JadwalPanel } from "./jadwal-panel";
import { PetugasPanel } from "./petugas-panel";

const TITLE = "Jadwal Pelayan";

interface PropTypes {
  code: string;
}

export const JadwalPelayanDetailScreen = (props: PropTypes) => {
  const { code } = props;

  const { isCanView, isCanCreate, isCanUpdate } = useMenuAccess(
    MENU.JADWAL_PELAYAN,
  );
  const listReturn = useListReturn(JADWAL_PELAYAN_LIST_PATH);
  const isWide = useIsTableWidth() === true;
  const detail = useJadwalPelayanDetail(isCanView ? code : undefined);
  const jadwal = detail.data;
  const isNotFound =
    detail.error instanceof FetchError && detail.error.status === 404;
  const linkClass = cn(
    buttonVariants({ variant: "outline", size: isWide ? "default" : "icon" }),
    "shrink-0 cursor-pointer gap-1.5",
  );

  const header = (title: string, subtitle?: string, action?: ReactNode) => (
    <PageHeader
      title={title}
      subtitle={subtitle}
      backHref={listReturn}
      isBackPersistent
      action={action}
    />
  );

  const onWhatsAppText = () =>
    jadwal ? toWhatsAppText(detailToWhatsApp(jadwal)) : "";

  if (!isCanView) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={domainHref(MENU.PELAYANAN)} />
        <EmptyState
          title="Anda tidak memiliki akses ke Jadwal Pelayan"
          description="Hubungi administrator bila Anda memang seharusnya memegang akses ini."
        />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <FormNotFound
        noun="jadwal pelayan"
        backHref={listReturn}
        backLabel="Kembali ke Jadwal Pelayan"
      />
    );
  }

  if (detail.error && !jadwal) {
    return (
      <div className="pb-8">
        {header(TITLE)}
        <div
          role="alert"
          className="flex flex-col items-center px-gutter py-12 text-center"
        >
          <TriangleAlert className="text-destructive mb-3 size-8" aria-hidden />
          <p className="text-body font-medium">Gagal memuat jadwal pelayan</p>
          <p className="text-muted-foreground mt-1 text-body">
            {detail.error.message}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void detail.refetch()}
            disabled={detail.isFetching}
            className="mt-4"
            isLoading={detail.isFetching}
          >
            {detail.isFetching ? "Memuat…" : "Coba lagi"}
          </Button>
        </div>
      </div>
    );
  }

  if (!jadwal) {
    return (
      <div className="pb-8">
        {header(TITLE)}
        <div className="px-gutter">
          <Panel>
            <div className="px-gutter py-2">
              <DescriptionSkeleton label="Memuat jadwal pelayan" rows={8} />
            </div>
          </Panel>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-8">
      {header(
        jadwal.name,
        `${formatDate(jadwal.date)} · ${formatTimeRange(jadwal.startTime, jadwal.endTime)} · ${jadwal.bapel.name}`,
        <div className="flex shrink-0 gap-2">
          <WhatsAppButton getText={onWhatsAppText} isLabelVisible={isWide} />

          {isCanCreate ? (
            <Link
              href={salinHref(jadwal.code)}
              aria-label={isWide ? undefined : "Salin dari jadwal ini"}
              className={linkClass}
            >
              <Copy aria-hidden />
              {isWide ? "Salin dari jadwal ini" : null}
            </Link>
          ) : null}

          {isCanUpdate ? (
            <Link
              href={jadwalEditHref(jadwal.code)}
              aria-label={isWide ? undefined : "Ubah"}
              className={linkClass}
            >
              <Pencil aria-hidden />
              {isWide ? "Ubah" : null}
            </Link>
          ) : null}
        </div>,
      )}

      <div className="flex flex-wrap items-start gap-4 px-gutter">
        <div className="min-w-0 flex-[999_1_32rem]">
          <PetugasPanel slots={jadwal.detail} />
        </div>
        <div className="min-w-0 flex-[1_1_20rem]">
          <JadwalPanel jadwal={jadwal} />
        </div>
      </div>
    </div>
  );
};

"use client";

import { Pencil } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/common/control";
import { Panel } from "@/components/common/display";
import { EmptyState } from "@/components/common/feedback";
import { FormNotFound } from "@/components/common/form";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";
import { cn } from "@/lib/utils";

import { useRuangDetail } from "../api";
import { RUANG_LIST_PATH, roomMetaOf, ruangEditHref } from "../model";
import { RoomStatus } from "../ui";

import { PhotoGrid } from "./photo-grid";
import { UsageList } from "./usage-list";

const TITLE = "Ruang";

const HEADING = "mb-3 text-title font-semibold";

interface PropTypes {
  code: string;
}

export const RuangDetailScreen = (props: PropTypes) => {
  const { code } = props;

  const { isCanView, isCanUpdate } = useMenuAccess(MENU.RUANG);
  const listReturn = useListReturn(RUANG_LIST_PATH);
  const detail = useRuangDetail(isCanView ? code : undefined);
  const room = detail.data;
  const isNotFound =
    detail.error instanceof FetchError && detail.error.status === 404;

  if (!isCanView) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={domainHref(MENU.FASILITAS)} />
        <EmptyState
          title="Anda tidak memiliki akses ke Ruang"
          description="Hubungi administrator bila Anda memang seharusnya memegang akses ini."
        />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <FormNotFound
        noun="ruang"
        backHref={listReturn}
        backLabel="Kembali ke Ruang"
      />
    );
  }

  if (!room) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={listReturn} isBackPersistent />

        {detail.error ? (
          <div role="alert">
            <EmptyState
              title="Gagal memuat ruang"
              description={detail.error.message}
              action={
                <Button
                  type="button"
                  variant="outline"
                  disabled={detail.isFetching}
                  onClick={() => void detail.refetch()}
                >
                  {detail.isFetching ? "Memuat…" : "Coba lagi"}
                </Button>
              }
            />
          </div>
        ) : (
          <div
            role="status"
            aria-busy="true"
            className="flex flex-wrap items-start gap-x-6 gap-y-8 px-gutter pt-9"
          >
            <span className="grid min-w-0 flex-[1_1_20rem] grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-2">
              {Array.from({ length: 2 }, (_, index) => (
                <span
                  key={index}
                  aria-hidden
                  className="bg-skeleton aspect-video animate-pulse rounded-control"
                />
              ))}
            </span>
            <span
              aria-hidden
              className="bg-skeleton h-40 flex-[999_1_32rem] animate-pulse rounded-lg"
            />
            <span className="sr-only">Memuat ruang…</span>
          </div>
        )}
      </div>
    );
  }

  const isPhotoless = !room.mainImage && room.detailImage.length === 0;

  return (
    <div className="pb-8">
      <PageHeader
        title={room.name}
        subtitle={roomMetaOf(room)}
        backHref={listReturn}
        isBackPersistent
        action={
          isCanUpdate ? (
            <Link
              href={ruangEditHref(room.code)}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "shrink-0 cursor-pointer",
              )}
            >
              <Pencil aria-hidden />
              Ubah
            </Link>
          ) : null
        }
      />

      {room.isActive ? null : (
        <p className="text-muted-foreground flex items-center gap-1 px-gutter pb-3 text-body">
          <RoomStatus isActive={false} />
          <span>— tidak bisa dipinjam.</span>
        </p>
      )}

      <div className="flex flex-wrap items-start gap-x-6 gap-y-8 px-gutter">
        <section
          aria-labelledby="room-photos"
          className="min-w-0 flex-[1_1_20rem]"
        >
          <h2 id="room-photos" className={HEADING}>
            Foto
          </h2>
          {isPhotoless ? (
            <EmptyState title="Belum ada foto ruang" isCompact />
          ) : (
            <PhotoGrid
              mainImage={room.mainImage}
              detailImage={room.detailImage}
            />
          )}
        </section>

        <Panel
          label="Pemakaian 30 hari ke depan"
          className="flex-[999_1_32rem] px-gutter py-4"
        >
          <h2 className={HEADING}>Pemakaian 30 hari ke depan</h2>
          <UsageList code={room.code} />
        </Panel>
      </div>
    </div>
  );
};

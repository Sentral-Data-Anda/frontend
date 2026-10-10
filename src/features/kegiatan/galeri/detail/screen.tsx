"use client";

import { Pencil } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/common/control";
import { EmptyState } from "@/components/common/feedback";
import { FormNotFound } from "@/components/common/form";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";
import { cn } from "@/lib/utils";

import { useGaleriDetail } from "../api";
import {
  GALERI_LIST_PATH,
  MAX_PHOTOS,
  albumMetaOf,
  galeriEditHref,
  websiteStatusOf,
} from "../model";
import { AlbumStatus } from "../ui";

import { PhotoGrid } from "./photo-grid";

const TITLE = "Galeri";

interface PropTypes {
  code: string;
}

export const GaleriDetailScreen = (props: PropTypes) => {
  const { code } = props;

  const { isCanView, isCanUpdate } = useMenuAccess(MENU.GALERI);
  const listReturn = useListReturn(GALERI_LIST_PATH);
  const detail = useGaleriDetail(isCanView ? code : undefined);
  const album = detail.data;
  const isNotFound =
    detail.error instanceof FetchError && detail.error.status === 404;

  if (!isCanView) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={domainHref(MENU.KEGIATAN)} />
        <EmptyState
          title="Anda tidak memiliki akses ke Galeri"
          description="Hubungi administrator bila Anda memang seharusnya memegang akses ini."
        />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <FormNotFound
        noun="album"
        backHref={listReturn}
        backLabel="Kembali ke Galeri"
      />
    );
  }

  if (!album) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={listReturn} isBackPersistent />

        {detail.error ? (
          <div role="alert">
            <EmptyState
              title="Gagal memuat album"
              description={detail.error.message}
              action={
                <Button
                  type="button"
                  variant="outline"
                  disabled={detail.isFetching}
                  onClick={() => void detail.refetch()}
                  isLoading={detail.isFetching}
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
            className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-2 px-gutter pt-9"
          >
            {Array.from({ length: MAX_PHOTOS }, (_, index) => (
              <span
                key={index}
                aria-hidden
                className="bg-skeleton aspect-square animate-pulse rounded-control"
              />
            ))}
            <span className="sr-only">Memuat album…</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pb-8">
      <PageHeader
        title={album.name}
        subtitle={albumMetaOf(album)}
        backHref={listReturn}
        isBackPersistent
        action={
          isCanUpdate ? (
            <Link
              href={galeriEditHref(album.code)}
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

      <div className="flex min-h-control flex-wrap items-center gap-x-3 gap-y-1 px-gutter pb-3">
        <AlbumStatus isPublish={album.isPublish} />
        <p className="text-muted-foreground text-body">
          {websiteStatusOf(album.isPublish, album.listImage)}
        </p>
      </div>

      {album.listImage.length ? (
        <PhotoGrid photos={album.listImage} isPublish={album.isPublish} />
      ) : (
        <EmptyState
          title="Album ini belum punya foto"
          description="Tambahkan foto lewat Ubah album."
        />
      )}
    </div>
  );
};

"use client";

import { ChevronLeft, ChevronRight, Globe, X } from "lucide-react";
import { useEffect, useState, type KeyboardEvent } from "react";

import { Button } from "@/components/common/control";
import { MediaThumb } from "@/components/common/display";
import type { ServerAttachment } from "@/types/attachment";

interface PropTypes {
  photos: readonly ServerAttachment[];
  index: number | null;
  isPublish: boolean;
  onPickIndex: (index: number) => void;
  onClose: () => void;
}

export const PhotoViewer = (props: PropTypes) => {
  const { photos, index, isPublish, onPickIndex, onClose } = props;

  const [dialog, setDialog] = useState<HTMLDialogElement | null>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const photo = index === null ? undefined : photos[index];
  const position = index ?? 0;
  const isFirst = position === 0;
  const isLast = position === photos.length - 1;

  const onStep = (step: number) => {
    const next = position + step;

    if (next >= 0 && next < photos.length) onPickIndex(next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === "ArrowLeft") onStep(-1);
    if (event.key === "ArrowRight") onStep(1);
  };

  useEffect(() => {
    if (!dialog) return;

    if (photo && !dialog.open) dialog.showModal();
    if (!photo && dialog.open) dialog.close();
  }, [photo, dialog]);

  return (
    <dialog
      ref={setDialog}
      aria-label={photo ? `Foto ${photo.name}` : "Foto"}
      onClose={onClose}
      onKeyDown={onKeyDown}
      className="bg-sidebar text-sidebar-foreground backdrop:bg-sidebar/80 fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none p-0"
    >
      {photo ? (
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 px-gutter py-3">
            <p className="min-w-0 flex-1 truncate text-body font-medium">
              {photo.name}
            </p>
            <p
              aria-live="polite"
              className="text-sidebar-muted-foreground text-body tabular-nums"
            >
              {position + 1} / {photos.length}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Tutup"
              onClick={() => dialog?.close()}
              className={VIEWER_BUTTON}
            >
              <X aria-hidden />
            </Button>
          </div>

          <div className="flex min-h-0 flex-1 items-center justify-center px-gutter">
            {failedUrl === photo.url ? (
              <div className="w-full max-w-md">
                <MediaThumb
                  src={photo.url}
                  alt={photo.name}
                  size="fill"
                  ratio="video"
                />
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- URL bertanda tangan MinIO, bukan aset yang dioptimasi Next
              <img
                key={photo.url}
                src={photo.url}
                alt={photo.name}
                decoding="async"
                onError={() => setFailedUrl(photo.url)}
                className="max-h-full max-w-full rounded-control object-contain"
              />
            )}
          </div>

          <div className="flex items-center justify-between gap-3 px-gutter pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <Button
              type="button"
              variant="ghost"
              disabled={isFirst}
              onClick={() => onStep(-1)}
              className={VIEWER_BUTTON}
            >
              <ChevronLeft aria-hidden />
              Sebelumnya
            </Button>

            {photo.showOnWebsite ? (
              <p className="text-sidebar-muted-foreground flex min-w-0 items-center gap-1.5 text-caption">
                <Globe aria-hidden className="size-3.5 shrink-0" />
                <span className="truncate">
                  {isPublish
                    ? "Tampil di website"
                    : "Tampil di website sesudah album terbit"}
                </span>
              </p>
            ) : null}

            <Button
              type="button"
              variant="ghost"
              disabled={isLast}
              onClick={() => onStep(1)}
              className={VIEWER_BUTTON}
            >
              Berikutnya
              <ChevronRight aria-hidden />
            </Button>
          </div>
        </div>
      ) : null}
    </dialog>
  );
};

const VIEWER_BUTTON =
  "hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-sidebar-ring cursor-pointer";

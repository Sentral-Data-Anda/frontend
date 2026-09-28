"use client";

import { Badge } from "@/components/common/display";
import { ANNOUNCEMENT_STATUS_LABEL } from "@/lib/announcement";

import { STATUS_BADGE, statusPreviewOf } from "../model";
import type { AnnouncementBapel } from "../types";

import { useBapelOptions, type AnnouncementForm } from "./form-options";

interface PropTypes {
  form: AnnouncementForm;
  savedBapel: AnnouncementBapel | null;
}

export const StatusPreview = (props: PropTypes) => {
  const { form, savedBapel } = props;

  const [category, bapelId, publishDate, expiryDate, isPublished] = form.watch([
    "category",
    "bapelId",
    "publishDate",
    "expiryDate",
    "isPublished",
  ]);
  const bapel = useBapelOptions(bapelId, savedBapel);
  const bapelName =
    bapel.options.find((option) => option.value === bapelId)?.label ??
    "badan pelayanan";
  const preview = statusPreviewOf(
    { category, bapelId, publishDate, expiryDate, isPublished },
    bapelName,
  );

  return (
    <div
      role="status"
      aria-live="polite"
      className="border-border bg-card/60 min-h-16 rounded-control border px-3 py-2.5 text-body"
    >
      {preview ? (
        <>
          <p>
            <span className="text-muted-foreground">Setelah disimpan:</span>{" "}
            <Badge
              variant={STATUS_BADGE[preview.status]}
              className="mx-0.5 align-middle"
            >
              {ANNOUNCEMENT_STATUS_LABEL[preview.status]}
            </Badge>{" "}
            {preview.timing}
          </p>
          {preview.reach ? (
            <p className="text-muted-foreground mt-1">{preview.reach}</p>
          ) : null}
        </>
      ) : (
        <p className="text-muted-foreground">
          Isi tanggal terbit untuk melihat kapan pengumuman ini tampil.
        </p>
      )}
    </div>
  );
};

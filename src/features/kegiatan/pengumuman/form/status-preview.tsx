"use client";

import { Badge } from "@/components/common/display";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { ANNOUNCEMENT_STATUS_LABEL } from "@/lib/announcement";

import { STATUS_BADGE, statusPreviewOf } from "../model";

import { type AnnouncementForm } from "./form-options";

interface PropTypes {
  form: AnnouncementForm;
}

export const StatusPreview = (props: PropTypes) => {
  const { form } = props;

  const [category, bapelId, publishDate, expiryDate, isPublished] = form.watch([
    "category",
    "bapelId",
    "publishDate",
    "expiryDate",
    "isPublished",
  ]);
  const bapel = useDdlOptions("bapel", "id", bapelId);
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
          <p className="flex flex-wrap items-center gap-x-1.5">
            <span className="text-muted-foreground">Setelah disimpan:</span>
            <Badge variant={STATUS_BADGE[preview.status]}>
              {ANNOUNCEMENT_STATUS_LABEL[preview.status]}
            </Badge>
            <span>{preview.timing}</span>
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

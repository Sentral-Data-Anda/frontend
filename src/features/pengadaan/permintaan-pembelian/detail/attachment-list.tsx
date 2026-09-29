import { FileText } from "lucide-react";

import { MediaThumb } from "@/components/common/display";
import { isPdf } from "@/lib/attachment";
import type { ServerAttachment } from "@/types/attachment";

const TILE =
  "focus-visible:ring-ring flex min-w-0 cursor-pointer flex-col gap-1 rounded-control outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

interface PropTypes {
  attachments: readonly ServerAttachment[];
}

export const AttachmentList = (props: PropTypes) => {
  const { attachments } = props;

  return (
    <ul
      aria-label="Lampiran penawaran"
      className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-2"
    >
      {attachments.map((attachment) => (
        <li key={attachment.publicId}>
          <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Buka ${attachment.name} di tab baru`}
            className={TILE}
          >
            {isPdf(attachment.mimeType) ? (
              <span className="bg-muted text-muted-foreground hover:bg-muted/70 flex aspect-video w-full flex-col items-center justify-center gap-1 rounded-control transition-colors">
                <FileText aria-hidden className="size-6" />
                <span className="text-caption font-medium">PDF</span>
              </span>
            ) : (
              <MediaThumb
                src={attachment.url}
                alt={attachment.name}
                size="fill"
                ratio="video"
              />
            )}
            <span className="truncate text-caption" title={attachment.name}>
              {attachment.name}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
};

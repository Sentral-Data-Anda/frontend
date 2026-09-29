import { FileText } from "lucide-react";

import { MediaThumb } from "@/components/common/display";
import { isPdf } from "@/lib/attachment";
import type { ServerAttachment } from "@/types/attachment";

interface PropTypes {
  attachments: readonly ServerAttachment[];
}

export const AttachmentList = (props: PropTypes) => {
  const { attachments } = props;

  return (
    <ul
      aria-label="Nota dan surat jalan"
      className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-2"
    >
      {attachments.map((attachment) => (
        <li key={attachment.publicId}>
          <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Buka ${attachment.name} di tab baru`}
            className="group block cursor-pointer rounded-control focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {isPdf(attachment.mimeType) ? (
              <span className="bg-muted text-muted-foreground flex aspect-video w-full items-center justify-center rounded-control transition-colors group-hover:bg-accent">
                <FileText aria-hidden className="size-6" />
              </span>
            ) : (
              <MediaThumb
                src={attachment.url}
                alt={attachment.name}
                size="fill"
                ratio="video"
              />
            )}
            <span className="text-muted-foreground group-hover:text-foreground mt-1 block truncate text-caption">
              {attachment.name}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
};

import { FileText } from "lucide-react";

import { MediaThumb } from "@/components/common/display";
import { isPdf } from "@/lib/attachment";
import type { ServerAttachment } from "@/types/attachment";

const TILE =
  "focus-visible:ring-ring flex min-w-0 cursor-pointer flex-col gap-1 rounded-control outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

interface PropTypes {
  notes: readonly ServerAttachment[];
}

export const NoteList = (props: PropTypes) => {
  const { notes } = props;

  return (
    <ul
      aria-label="Nota kas keluar"
      className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-2"
    >
      {notes.map((note) => (
        <li key={note.publicId}>
          <a
            href={note.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Buka ${note.name} di tab baru`}
            className={TILE}
          >
            {isPdf(note.mimeType) ? (
              <span className="bg-muted text-muted-foreground hover:bg-muted/70 flex aspect-video w-full flex-col items-center justify-center gap-1 rounded-control transition-colors">
                <FileText aria-hidden className="size-6" />
                <span className="text-caption font-medium">PDF</span>
              </span>
            ) : (
              <MediaThumb
                src={note.url}
                alt={note.name}
                size="fill"
                ratio="video"
              />
            )}
            <span className="truncate text-caption" title={note.name}>
              {note.name}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
};

import { FileText } from "lucide-react";

import { MediaThumb } from "@/components/common/display";
import { isPdf } from "@/lib/attachment";
import type { ServerAttachment } from "@/types/attachment";

import { RECEIPT_PRIVACY } from "../model";

const TILE =
  "focus-visible:ring-ring flex min-w-0 cursor-pointer flex-col gap-1 rounded-control outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

interface PropTypes {
  receipts: readonly ServerAttachment[];
}

export const ReceiptList = (props: PropTypes) => {
  const { receipts } = props;

  return (
    <div className="space-y-3 print:hidden">
      <h2 className="text-title font-semibold">Kwitansi</h2>

      <p className="text-muted-foreground text-caption">{RECEIPT_PRIVACY}</p>

      <ul
        aria-label="Kwitansi laporan"
        className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-2"
      >
        {receipts.map((receipt) => (
          <li key={receipt.publicId}>
            <a
              href={receipt.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Buka ${receipt.name} di tab baru`}
              className={TILE}
            >
              {isPdf(receipt.mimeType) ? (
                <span className="bg-muted text-muted-foreground hover:bg-muted/70 flex aspect-video w-full flex-col items-center justify-center gap-1 rounded-control transition-colors">
                  <FileText aria-hidden className="size-6" />
                  <span className="text-caption font-medium">PDF</span>
                </span>
              ) : (
                <MediaThumb
                  src={receipt.url}
                  alt={receipt.name}
                  size="fill"
                  ratio="video"
                />
              )}
              <span className="truncate text-caption" title={receipt.name}>
                {receipt.name}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

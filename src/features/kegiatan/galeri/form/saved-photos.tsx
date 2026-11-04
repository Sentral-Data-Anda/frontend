import { X } from "lucide-react";

import { Button } from "@/components/common/control";
import { MediaThumb } from "@/components/common/display";
import type { ServerAttachment } from "@/types/attachment";

import { WebsiteMark } from "../ui";

interface PropTypes {
  photos: readonly ServerAttachment[];
  /** Absent when the view is read-only, or the album must keep every photo. */
  onRemove?: (publicId: string) => void;
}

export const SavedPhotos = (props: PropTypes) => {
  const { photos, onRemove } = props;

  return (
    <ul
      aria-label="Foto tersimpan"
      className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-2"
    >
      {photos.map((photo) => (
        <li key={photo.publicId} className="flex min-w-0 flex-col gap-1">
          <span className="relative block">
            <MediaThumb src={photo.url} alt={photo.name} size="fill" />
            {photo.showOnWebsite ? <WebsiteMark /> : null}
            {onRemove ? (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 cursor-pointer"
                aria-label={`Buang foto ${photo.name}`}
                title="Buang foto"
                onClick={() => onRemove(photo.publicId)}
              >
                <X aria-hidden />
              </Button>
            ) : null}
          </span>
          <p className="truncate text-caption" title={photo.name}>
            {photo.name}
          </p>
        </li>
      ))}
    </ul>
  );
};

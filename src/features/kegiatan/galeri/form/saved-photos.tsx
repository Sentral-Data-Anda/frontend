import { MediaThumb } from "@/components/common/display";
import type { ServerAttachment } from "@/types/attachment";

import { WebsiteMark } from "../ui";

interface PropTypes {
  photos: readonly ServerAttachment[];
}

export const SavedPhotos = (props: PropTypes) => {
  const { photos } = props;

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
          </span>
          <p className="truncate text-caption" title={photo.name}>
            {photo.name}
          </p>
        </li>
      ))}
    </ul>
  );
};

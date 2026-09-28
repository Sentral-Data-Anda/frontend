import { MediaThumb } from "@/components/common/display";
import type { ServerAttachment } from "@/types/attachment";

interface PropTypes {
  mainImage: ServerAttachment | null;
  detailImage: readonly ServerAttachment[];
}

export const PhotoGrid = (props: PropTypes) => {
  const { mainImage, detailImage } = props;

  const photos = mainImage
    ? [{ ...mainImage, name: `${mainImage.name} (foto utama)` }, ...detailImage]
    : detailImage;

  return (
    <ul
      aria-label="Foto ruang"
      className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-2"
    >
      {photos.map((photo) => (
        <li key={photo.publicId}>
          <MediaThumb
            src={photo.url}
            alt={photo.name}
            size="fill"
            ratio="video"
          />
        </li>
      ))}
    </ul>
  );
};

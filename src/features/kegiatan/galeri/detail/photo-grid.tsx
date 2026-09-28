"use client";

import { useRef, useState } from "react";

import type { ServerAttachment } from "@/types/attachment";

import { PhotoTile } from "./photo-tile";
import { PhotoViewer } from "./photo-viewer";

interface PropTypes {
  photos: readonly ServerAttachment[];
  isPublish: boolean;
}

export const PhotoGrid = (props: PropTypes) => {
  const { photos, isPublish } = props;

  const tiles = useRef<(HTMLButtonElement | null)[]>([]);
  const trigger = useRef(0);
  const [pickIndex, setPickIndex] = useState<number | null>(null);

  const onOpen = (index: number) => {
    trigger.current = index;
    setPickIndex(index);
  };

  const onClose = () => {
    setPickIndex(null);
    tiles.current[trigger.current]?.focus();
  };

  return (
    <>
      <ul
        aria-label="Foto album"
        className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-2 px-gutter"
      >
        {photos.map((photo, index) => (
          <PhotoTile
            key={photo.publicId}
            photo={photo}
            label={`Buka foto ${photo.name}, ${index + 1} dari ${photos.length}`}
            buttonRef={(node) => {
              tiles.current[index] = node;
            }}
            onOpen={() => onOpen(index)}
          />
        ))}
      </ul>

      <PhotoViewer
        photos={photos}
        index={pickIndex}
        isPublish={isPublish}
        onPickIndex={setPickIndex}
        onClose={onClose}
      />
    </>
  );
};

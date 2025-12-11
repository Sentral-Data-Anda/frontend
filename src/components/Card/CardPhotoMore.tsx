"use client";

import { Card, Image, SimpleGrid } from "@mantine/core";
import { useEffect, useState } from "react";

interface PropTypes {
  mainImage: string;
  detailImage?: string[];
}

const urlImage = process.env.NEXT_PUBLIC_FILE_URL;

export const CardPhotoMoreComponent = (props: PropTypes) => {
  const { mainImage, detailImage } = props;

  const [activeImage, setActiveImage] = useState<string>(mainImage);

  const [thumbnailImages, setThumbnailImages] = useState<string[] | undefined>(
    detailImage,
  );

  useEffect(() => {
    setActiveImage(mainImage);
    setThumbnailImages(detailImage);
  }, [mainImage, detailImage]);

  return (
    <Card radius="sm">
      <Card.Section>
        <Image
          src={`${urlImage}${activeImage}`}
          alt="main-image"
          fallbackSrc="https://placehold.co/1280x720?text=Loading"
        />
      </Card.Section>

      {thumbnailImages && thumbnailImages.length > 0 ? (
        <Card.Section mt="sm">
          <SimpleGrid cols={3}>
            {thumbnailImages.map((value: string, index: number) => (
              <Image
                style={{
                  cursor: "pointer",
                  opacity: 0.5,
                }}
                onClick={() => {
                  if (value !== activeImage) {
                    setActiveImage(value);

                    if (thumbnailImages) {
                      const newThumbnails = [...thumbnailImages];
                      const oldActiveIndex = newThumbnails.indexOf(value);
                      if (oldActiveIndex !== -1) {
                        newThumbnails[oldActiveIndex] = activeImage;
                      }
                      setThumbnailImages(newThumbnails);
                    }
                  }
                }}
                src={`${urlImage}${value}`}
                key={index}
                alt={`detail-image-${index}`}
                fallbackSrc="https://placehold.co/600x400?text=Loading"
              />
            ))}
          </SimpleGrid>
        </Card.Section>
      ) : null}
    </Card>
  );
};

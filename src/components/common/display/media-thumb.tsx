"use client";

import { ImageIcon, ImageOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface PropTypes {
  src: string | null;
  alt: string;
  size?: "sm" | "md" | "fill";
  ratio?: "square" | "video" | "photo";
  fit?: "cover" | "contain";
}

const RATIO_CLASS = {
  square: "aspect-square",
  video: "aspect-video",
  photo: "aspect-4/3",
} as const;

export const MediaThumb = (props: PropTypes) => {
  const { src, alt, size = "sm", ratio = "square", fit = "cover" } = props;

  const imageRef = useRef<HTMLImageElement>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const isFailed = src !== null && failedSrc === src;
  const Icon = isFailed ? ImageOff : ImageIcon;

  // Gambar dari HTML server bisa gagal sebelum hidrasi; onError-nya terlewat.
  useEffect(() => {
    const image = imageRef.current;

    if (image?.complete && image.naturalWidth === 0) setFailedSrc(src);
  }, [src]);

  return (
    <span
      className={cn(
        "bg-muted text-muted-foreground relative flex shrink-0 items-center justify-center overflow-hidden rounded-control",
        size === "sm" && "h-10",
        size === "md" && "h-16",
        size === "fill" && "w-full",
        RATIO_CLASS[ratio],
      )}
    >
      {src && !isFailed ? (
        // eslint-disable-next-line @next/next/no-img-element -- URL bertanda tangan MinIO, bukan aset yang dioptimasi Next
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailedSrc(src)}
          className={cn(
            "size-full",
            fit === "cover" ? "object-cover" : "object-contain",
          )}
        />
      ) : (
        <>
          <Icon aria-hidden className={size === "sm" ? "size-4" : "size-5"} />
          <span className="sr-only">
            {isFailed
              ? `Gambar ${alt} tidak dapat dimuat`
              : `${alt} tanpa gambar`}
          </span>
        </>
      )}
    </span>
  );
};

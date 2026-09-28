"use client";

import { ImageIcon, ImageOff } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

interface PropTypes {
  src: string | null;
  alt: string;
  size?: "sm" | "md" | "fill";
  ratio?: "square" | "video";
  fit?: "cover" | "contain";
}

export const MediaThumb = (props: PropTypes) => {
  const { src, alt, size = "sm", ratio = "square", fit = "cover" } = props;

  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const isFailed = src !== null && failedSrc === src;
  const Icon = isFailed ? ImageOff : ImageIcon;

  return (
    <span
      className={cn(
        "bg-muted text-muted-foreground relative flex shrink-0 items-center justify-center overflow-hidden rounded-control",
        size === "sm" && "size-10",
        size === "md" && "size-16",
        size === "fill" && "w-full",
        size === "fill" &&
          (ratio === "video" ? "aspect-video" : "aspect-square"),
      )}
    >
      {src && !isFailed ? (
        // eslint-disable-next-line @next/next/no-img-element -- URL bertanda tangan MinIO, bukan aset yang dioptimasi Next
        <img
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

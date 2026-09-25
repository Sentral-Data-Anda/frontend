import type { MetadataRoute } from "next";

import { brand } from "@/config/brand";
import { siteConfig } from "@/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    // Mengubah `id` membuat semua instalasi lama menjadi aplikasi lain.
    id: "/",

    name: siteConfig.name,
    short_name: siteConfig.shortName,

    description: siteConfig.description,

    start_url: "/",
    scope: "/",

    display: "standalone",
    display_override: ["standalone"],

    launch_handler: { client_mode: "navigate-existing" },

    background_color: brand.backgroundColor,
    theme_color: brand.themeColor.light,

    lang: "id",
    dir: "ltr",

    prefer_related_applications: false,

    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sentral Data Anda",
    short_name: "SADA",
    description: "A Progressive Web App built with Next.js",
    start_url: "/",
    display: "standalone",
    theme_color: "#ffffff",
    background_color: "#364f6b",
    icons: [
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

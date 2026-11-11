import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

import { clientEnvSchema } from "./src/lib/env-schema";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  clientEnvSchema.parse(env);

  // Satu id per build untuk URL service worker (`/sw.js?v=<id>`): BUILD_ID
  // dari CI atau Docker, lalu timestamp lokal.
  const buildId = env.BUILD_ID || `local-${Date.now()}`;
  const apiTarget = env.VITE_DEV_API_TARGET || "http://localhost:3001";
  const mediaTarget = env.VITE_DEV_MEDIA_TARGET || apiTarget;

  return {
    plugins: [
      // Sebelum react: plugin ini menulis routeTree.gen.ts dan memecah kode
      // rute sebelum JSX diubah.
      tanstackRouter({ target: "react", autoCodeSplitting: true }),
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    define: {
      __BUILD_ID__: JSON.stringify(buildId),
    },
    server: {
      port: Number(env.PORT || 3000),
      strictPort: true,
      proxy: {
        "/api": { target: apiTarget, changeOrigin: true },
        "/media": { target: mediaTarget, changeOrigin: true },
      },
    },
    preview: {
      port: Number(env.PORT || 3000),
      proxy: {
        "/api": { target: apiTarget, changeOrigin: true },
        "/media": { target: mediaTarget, changeOrigin: true },
      },
    },
    build: {
      sourcemap: false,
      // Font tidak pernah di-inline sebagai data: URI; CSP `font-src 'self'`
      // di nginx menolaknya dan subset Roboto kecil hilang diam-diam.
      assetsInlineLimit: (file: string) =>
        /\.(woff2?|ttf|otf)$/.test(file) ? false : undefined,
    },
  };
});

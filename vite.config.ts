import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/*.png"],
      manifest: {
        name: "Evolve",
        short_name: "Evolve",
        description: "How birds evolved from dinosaurs.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        // The story opens on the hero eye, so the splash stays on --ink rather than
        // flashing --bone first. Both themes land on a dark first frame this way.
        background_color: "#0e0d0b",
        theme_color: "#0e0d0b",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // The shell only. The ~17 MB of chapter photography is far too much to install
        // up front, so it is cached below as the reader scrolls past it instead.
        globPatterns: ["**/*.{js,css,html,svg,woff2}"],
        navigateFallback: "index.html",
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Safe as CacheFirst because Vite content-hashes every one of these filenames.
            urlPattern: /\.(?:avif|webp|png)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "evolve-chapters",
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});

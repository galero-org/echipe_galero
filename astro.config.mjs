// @ts-check
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

import react from "@astrojs/react";
import { VitePWA } from "vite-plugin-pwa";

import netlify from "@astrojs/netlify";

export default defineConfig({
  output: "server",

  integrations: [react(), tailwind()],
  adapter: netlify(),

  vite: {
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: "auto",
        includeAssets: ["favicon.svg"],
        manifest: {
          name: "Galero App",
          short_name: "Galero",
          description:
            "Aplicatie pentru organizarea echipelor, confirmarii si statisticilor Galero.",
          start_url: "/",
          scope: "/",
          display: "standalone",
          theme_color: "#0f172a",
          background_color: "#0b1724",
          orientation: "portrait",
          icons: [
            {
              src: "/icons/icon-192.svg",
              sizes: "192x192",
              type: "image/svg+xml",
              purpose: "any",
            },
            {
              src: "/icons/icon-512.svg",
              sizes: "512x512",
              type: "image/svg+xml",
              purpose: "any",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
        },
      }),
    ],
  },
});

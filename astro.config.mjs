// @ts-check
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

import react from "@astrojs/react";

import netlify from "@astrojs/netlify";

// https://astro.build/config
export default defineConfig({
  output: "server", // Enable server-side rendering for all pages by default

  integrations: [react(), tailwind()],
  adapter: netlify(),
});

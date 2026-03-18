import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Builds a self-contained IIFE bundle for use in non-React environments.
 * React, ReactDOM, and YTPlayer are all bundled together.
 *
 * Output:
 *   dist/yt-player.iife.js  — window.YTPlayerLib = { YTPlayer, React, ReactDOM }
 *   dist/yt-player.css      — all styles
 */
export default defineConfig({
  plugins: [react()],
  // Replace Node.js globals that React/HLS.js reference at runtime
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/iife-entry.ts"),
      name: "YTPlayerLib",
      formats: ["iife"],
      fileName: () => "yt-player.iife.js",
    },
    // React is intentionally NOT external here — bundle it all in
    rollupOptions: {
      output: {
        // Ensure CSS is emitted as yt-player.css (not style.css)
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "style.css") return "yt-player.css";
          return assetInfo.name ?? "asset";
        },
      },
    },
    outDir: "dist",
    emptyOutDir: false,
    minify: true,
    sourcemap: false,
  },
});

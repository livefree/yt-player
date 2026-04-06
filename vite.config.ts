import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// __dirname is not available in ESM; derive it from import.meta.url
const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  root: "dev",
  publicDir: resolve(__dirname, "public"),
  server: {
    open: true,
    port: 5173,
  },
  build: {
    // Output to project root dist-preview/ (not inside dev/)
    outDir: resolve(__dirname, "dist-preview"),
    emptyOutDir: true,
    rollupOptions: {
      // Multi-page: both preview and design inspector
      input: {
        main: resolve(__dirname, "dev/index.html"),
        settings: resolve(__dirname, "dev/settings.html"),
      },
    },
  },
});

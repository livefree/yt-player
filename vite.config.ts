import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: "dev",
  server: {
    open: true,
    port: 5173,
  },
});

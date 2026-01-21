import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
    middlewareMode: false,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Content-Security-Policy":
        "frame-ancestors 'self' https://accounts.google.com https://drive.google.com; " +
        "frame-src 'self' https://accounts.google.com https://drive.google.com; " +
        "connect-src 'self' https://accounts.google.com https://www.googleapis.com https://drive.google.com",
    },
  },
});

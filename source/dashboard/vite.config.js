import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Fallback resolution: if not running inside Docker network where 'api' hostname
// resolves to the backend service, prefer localhost. Users can override with VITE_API_BASE_URL.
const dockerService = "http://api:3000";
const localService = "http://localhost:3000";
const resolvedTarget =
  process.env.VITE_API_BASE_URL ||
  (process.env.DOCKER ? dockerService : localService);

console.info(`[vite] API proxy target: ${resolvedTarget}`);

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: resolvedTarget,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, "/v1"),
      },
    },
  },
  build: {
    outDir: "dist",
  },
});

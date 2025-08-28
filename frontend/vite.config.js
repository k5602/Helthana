import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  root: ".",
  build: {
    rollupOptions: {
      input: {
        main: "/index.html"
      }
    },
    outDir: "dist",
    assetsDir: "assets",
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      // Forward API calls to backend defined by env or default
      "/api": {
        target: process.env.VITE_PROXY_TARGET || "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

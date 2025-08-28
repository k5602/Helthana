import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
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
    },
    // Define global constants replaced at compile time
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV),
    },
    // Ensure environment variables are properly loaded
    envPrefix: ['VITE_'],
  }
})

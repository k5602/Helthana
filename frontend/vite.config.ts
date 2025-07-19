import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    port: 8080,
    host: true,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        // Main entry points - HTML files in root for static hosting compatibility
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        signup: resolve(__dirname, 'signup.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        prescriptions: resolve(__dirname, 'prescriptions.html'),
        vitals: resolve(__dirname, 'vitals.html'),
        reports: resolve(__dirname, 'reports.html'),
        emergency: resolve(__dirname, 'emergency.html'),
        profile: resolve(__dirname, 'profile.html'),
        services: resolve(__dirname, 'services.html'),
        about: resolve(__dirname, 'about.html'),
        sessions: resolve(__dirname, 'sessions.html'),
        'password-reset': resolve(__dirname, 'password-reset.html')
      },
      output: {
        // Ensure proper chunking for page-specific modules
        manualChunks: {
          'pages': [
            './src/pages/dashboard.js',
            './src/pages/prescriptions.js',
            './src/pages/vitals.js',
            './src/pages/reports.js',
            './src/pages/emergency.js',
            './src/pages/profile.js'
          ],
          'components': [
            './components/modal.js',
            './components/loading.js'
          ],
          'core': [
            './src/api.js',
            './src/auth.js',
            './src/ui.js',
            './src/offline.js',
            './src/localization.js'
          ]
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'components'),
      '@pages': resolve(__dirname, 'src/pages')
    }
  },
  publicDir: 'public'
})
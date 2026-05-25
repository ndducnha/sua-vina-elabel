import path from "path"
import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    base: env.VITE_BASE_PATH || '/',
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'https://api.elabel.dev.vcyber.vn',
          changeOrigin: true,
          secure: true,
          // Keep QR scan UI working when users open /api/qr/scan directly in the browser.
          // Only bypass proxy for full document navigations; XHR/fetch still go to backend API.
          bypass: (req) => {
            const acceptHeader = req.headers.accept ?? ''
            const fetchDest = req.headers['sec-fetch-dest'] ?? ''
            const isDocumentRequest =
              fetchDest === 'document' || acceptHeader.includes('text/html')

            if (isDocumentRequest) {
              return '/index.html'
            }

            return undefined
          },
        },
      },
    },
    define: {
      __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION || '1.0.0'),
      __APP_TITLE__: JSON.stringify(env.VITE_APP_TITLE || 'eLabel'),
      __ENABLE_DEBUG__: env.VITE_ENABLE_DEBUG === 'true',
      __ENABLE_ANALYTICS__: env.VITE_ENABLE_ANALYTICS === 'true',
      __API_BASE_URL__: JSON.stringify(
        env.VITE_API_BASE_URL || 'https://api.elabel.dev.vcyber.vn'
      ),
    }
  }
})

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  // Dev-only proxy for relative /api calls; the app itself calls VITE_API_URL directly.
  let proxyTarget = 'http://localhost:8000'
  try {
    if (env.VITE_API_URL) proxyTarget = new URL(env.VITE_API_URL).origin
  } catch {
    // VITE_API_URL is not an absolute URL; keep the default target
  }

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
          },
        },
      },
    },
    // Absolute base so assets also load on nested routes such as /admin/products.
    base: '/',
  }
})

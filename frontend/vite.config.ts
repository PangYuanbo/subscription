import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        {
          name: 'fix-lucide-chrome',
          setup(build) {
            // Replace chrome.js with a dummy module to avoid Windows Defender issues
            build.onResolve({ filter: /lucide-react.*chrome\.js$/ }, () => {
              return {
                path: path.resolve(__dirname, 'src/utils/dummy-chrome.js'),
                external: false
              }
            })
          },
        },
      ],
    },
  },
})
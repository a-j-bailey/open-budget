import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  main: {
    build: {
      copyPublicDir: true,
    },
  },
  preload: {},
  renderer: {
    root: 'src/renderer',
    build: {
      rollupOptions: {
        input: path.join(__dirname, 'src/renderer/index.html'),
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src/renderer'),
      },
    },
  },
})

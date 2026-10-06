import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  // 로컬에서 `vercel dev`를 따로 띄우면 /api 요청을 그쪽으로 넘긴다 (Phase 3에서 사용)
  server: { proxy: { '/api': { target: 'http://localhost:3000', changeOrigin: true } } },
})

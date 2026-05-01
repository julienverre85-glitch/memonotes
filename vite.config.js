import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ⚠️ Remplace YOUR_REPO_NAME par le nom exact de ton dépôt GitHub
export default defineConfig({
  plugins: [react()],
  base: '/memonotes/',
})

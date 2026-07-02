import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Local dev serves from '/'. The GitHub Pages workflow passes
// --base=/<repo-name>/ at build time. Switch to '/' there when a
// custom domain is attached.
export default defineConfig({
  plugins: [react()],
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves at /<repo-name>/, so set base to that.
// When we move to mlb.cognivaultlabs.com, change base to '/'.
export default defineConfig({
  plugins: [react()],
  base: '/edgefinder-mlb-pro/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
  },
})

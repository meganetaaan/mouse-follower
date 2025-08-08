import { defineConfig } from 'vite'

export default defineConfig({
  base: process.env.NODE_ENV === 'production' && process.env.GITHUB_PAGES === 'true' 
    ? '/mouse-follower/' 
    : '/',
  build: {
    outDir: 'dist-demo'
  }
})
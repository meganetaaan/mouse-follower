import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  base: process.env.NODE_ENV === 'production' && process.env.GITHUB_PAGES === 'true' 
    ? '/mouse-follower/' 
    : '/',
  build: {
    outDir: '../../dist-demo'
  },
  resolve: {
    alias: {
      '@meganetaaan/mouse-follower': resolve(__dirname, '../mouse-follower/dist/index.js')
    }
  }
})
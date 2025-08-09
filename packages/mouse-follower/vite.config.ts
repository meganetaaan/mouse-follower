import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MouseFollower',
      fileName: (format) => `mouse-follower.${format === 'es' ? 'js' : format + '.js'}`
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
        exports: 'named'
      }
    },
    sourcemap: true,
    emptyOutDir: true
  }
})
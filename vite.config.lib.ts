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
      // External dependencies that shouldn't be bundled
      external: [],
      output: {
        // Global variables to use in UMD build for externalized deps
        globals: {},
        // Use named exports to avoid default export warning
        exports: 'named'
      }
    },
    // Generate sourcemaps for better debugging
    sourcemap: true,
    // Clean dist before build
    emptyOutDir: false // Keep demo build files
  }
})
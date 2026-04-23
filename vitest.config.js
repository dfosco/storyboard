import path from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'virtual:storyboard-data-index': new URL(
        './packages/react/src/__mocks__/virtual-storyboard-data-index.js',
        import.meta.url,
      ).pathname,
      '@dfosco/storyboard-core/ui-runtime/style.css': path.resolve(__dirname, 'packages/core/src/styles/tailwind.css'),
      '@dfosco/storyboard-core/ui-runtime': path.resolve(__dirname, 'packages/core/src/ui-entry.js'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.js'],
    include: ['packages/*/src/**/*.test.{js,jsx}'],
    exclude: [
      'packages/core/src/comments/ui/authModal.test.js',
      'packages/core/src/devtools.test.js',
      'packages/core/src/canvas/__tests__/*-integration.test.js',
    ],
  },
})

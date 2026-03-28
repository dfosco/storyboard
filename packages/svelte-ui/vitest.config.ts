import { defineConfig } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [
    svelte({
      hot: false,
      extensions: ['.svelte'],
    }),
  ],
  resolve: {
    alias: {
      '@dfosco/storyboard-core': new URL(
        '../core/src/index.js',
        import.meta.url,
      ).pathname,
      '$lib': new URL(
        '../core/src/lib',
        import.meta.url,
      ).pathname,
      // Direct import for test-only helper (not in barrel export)
      '@test/modes': new URL(
        '../core/src/modes.js',
        import.meta.url,
      ).pathname,
    },
    // Ensure Svelte resolves to client-side (not SSR) in jsdom tests
    conditions: ['browser', 'svelte', 'import', 'module', 'default'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./packages/svelte-ui/vitest.setup.ts'],
    include: [
      'packages/core/src/svelte-plugin-ui/**/*.test.ts',
      'packages/core/src/comments/ui/authModal.test.js',
      'packages/core/src/devtools.test.js',
    ],
    // Ensure @testing-library/svelte .svelte.js files are processed
    server: {
      deps: {
        inline: [/@testing-library\/svelte/, /bits-ui/],
      },
    },
  },
})

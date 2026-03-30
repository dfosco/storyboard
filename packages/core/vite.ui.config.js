/**
 * Vite config for building the pre-compiled Svelte UI bundle.
 *
 * Produces dist/storyboard-ui.js + dist/storyboard-ui.css.
 * Bundles everything (Svelte runtime, bits-ui, Tailwind CSS, etc.)
 * so consumers get a self-contained JS+CSS module with no Svelte toolchain needed.
 *
 * Usage:
 *   npx vite build --config vite.ui.config.js
 *   npx vite build --config vite.ui.config.js --watch   (dev mode)
 */

import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

export default defineConfig({
  plugins: [
    tailwindcss(),
    svelte({
      compilerOptions: {
        css: 'external',
      },
    }),
  ],

  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/ui-entry.js'),
      formats: ['es'],
      fileName: () => 'storyboard-ui.js',
    },
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: false,
    cssFileName: 'storyboard-ui',
    rollupOptions: {
      // Externalize server-only and heavy optional deps
      external: [
        'node:fs',
        'node:path',
        'shiki',
        'shiki/core',
        'shiki/engine/oniguruma',
        /^shiki\/dist\//,
        /^shiki\/wasm/,
      ],
      output: {
        // Single chunk — no code splitting for the UI bundle
        inlineDynamicImports: true,
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) return 'storyboard-ui.css'
          return assetInfo.name ?? '[name].[ext]'
        },
      },
    },
    // Enable minification for production builds
    minify: 'esbuild',
    sourcemap: true,
  },

  resolve: {
    alias: {
      // Ensure internal imports resolve correctly during build
      '@dfosco/storyboard-core': path.resolve(__dirname, 'src/index.js'),
    },
  },
})

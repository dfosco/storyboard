import path from 'node:path'
import { defineConfig } from 'vitest/config'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

export default defineConfig({
  test: {
    include: ['packages/core/src/canvas/__tests__/*-integration.test.js'],
    testTimeout: 120_000,
    hookTimeout: 60_000,
    // No jsdom — these are Node-only integration tests
    environment: 'node',
    globals: true,
  },
})

import { defineConfig } from 'vitest/config'

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

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    setupFiles: ['./src/test-setup.js'],
    testTimeout: 15000,
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
  },
})

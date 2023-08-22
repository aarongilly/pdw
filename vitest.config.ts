import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // ...
    // singleThread: true
    maxThreads: 1,
    minThreads: 1,
  },
})
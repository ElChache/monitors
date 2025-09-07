import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['tests/**/*', 'design_tests/**/*', 'src/**/*.e2e.{test,spec}.{js,ts}'],
    globals: true,
    environment: 'node',
    setupFiles: ['src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/server/**/*.ts'],
      exclude: [
        'src/lib/server/**/*.test.ts',
        'src/lib/server/**/*.spec.ts',
        'src/**/*.d.ts',
        'src/**/index.ts'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['@node-rs/bcrypt']
  }
});
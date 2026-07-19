import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/domain/**/*.ts', 'src/adapters/**/*.ts'],
      thresholds: {
        // ⚠ The domain layer carries the money maths and the phone
        //   normalisation. It is held to a high bar deliberately.
        'src/domain/**/*.ts': {
          statements: 90,
          branches: 85,
          functions: 90,
          lines: 90,
        },
      },
    },
  },
  resolve: {
    alias: { '@': resolve(__dirname, './src') },
  },
});

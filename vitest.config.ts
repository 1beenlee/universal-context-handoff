/* MIT License - see LICENSE for details. */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['dist/**', 'node_modules/**'],
  },
});

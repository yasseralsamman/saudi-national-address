// SPDX-License-Identifier: MIT
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

// Vite handles .json natively but not .geojson; load .geojson as a JSON module.
export default defineConfig({
  plugins: [
    {
      name: 'geojson-as-json',
      enforce: 'pre',
      load(id: string) {
        if (id.endsWith('.geojson')) {
          return `export default ${readFileSync(id, 'utf8')}`;
        }
        return null;
      },
    },
  ],
});

// SPDX-License-Identifier: MIT
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  // Declarations are emitted by `tsc` (see the package build script): the dts
  // rollup cannot process the ambient `declare module '*.glob'` data shims.
  dts: false,
  clean: true,
  // No sourcemaps: the bundle is mostly inlined JSON, so maps add tens of MB
  // of noise with no debugging value.
  sourcemap: false,
  // The dataset is bundled into the output so consumers never fetch at runtime.
  // GeoJSON files are loaded as JSON despite their .geojson extension.
  loader: {
    '.geojson': 'json',
  },
});

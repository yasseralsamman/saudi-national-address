// SPDX-License-Identifier: MIT
//
// TopoJSON generation from a GeoJSON FeatureCollection via topojson-server.
// Quantized at 1e6 (~10cm at Saudi latitudes, ~80% smaller files).

// @ts-expect-error - topojson-server ships no bundled type declarations.
import { topology } from 'topojson-server';
import type { FeatureCollection } from './geojson.js';

const QUANTIZATION = 1e6;

/** Convert a GeoJSON FeatureCollection into a quantized TopoJSON topology. */
export function toTopoJSON(objectName: string, fc: FeatureCollection): unknown {
  return topology({ [objectName]: fc }, QUANTIZATION);
}

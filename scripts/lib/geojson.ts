// SPDX-License-Identifier: MIT
//
// GeoJSON conversion.
//
// The source `boundaries` is an array of rings, each ring an array of
// [lat, lon] pairs (the non-standard homaily order). GeoJSON requires
// [lon, lat] order, so every coordinate pair is swapped here. This is the
// whole point of having a separate GeoJSON output.
//
// Geometry-type rule:
//   - boundaries with a single top-level ring  -> Polygon
//   - boundaries with multiple top-level rings -> MultiPolygon, where each
//     top-level ring becomes one polygon's outer ring (no holes).
//
// Rings are closed defensively (first point repeated as last) because the
// source does not guarantee closed rings.

import type { Boundaries, Ring } from './load.js';

export type Position = [number, number];
export interface Polygon {
  type: 'Polygon';
  coordinates: Position[][];
}
export interface MultiPolygon {
  type: 'MultiPolygon';
  coordinates: Position[][][];
}
export type Geometry = Polygon | MultiPolygon;

export interface Feature {
  type: 'Feature';
  id: number;
  properties: Record<string, unknown>;
  geometry: Geometry;
}

export interface FeatureCollection {
  type: 'FeatureCollection';
  _generated: { source: string; version: string; generatedAt: string };
  features: Feature[];
}

/** Swap [lat, lon] -> [lon, lat] for one ring and close it defensively. */
function ringToLonLat(ring: Ring): Position[] {
  const out: Position[] = ring.map(([lat, lon]) => [lon, lat]);
  const first = out[0];
  const last = out[out.length - 1];
  if (first && last && (first[0] !== last[0] || first[1] !== last[1])) {
    out.push([first[0], first[1]]);
  }
  return out;
}

/** Convert source boundaries into a GeoJSON Polygon or MultiPolygon. */
export function toGeometry(boundaries: Boundaries): Geometry {
  if (boundaries.length === 1) {
    return { type: 'Polygon', coordinates: [ringToLonLat(boundaries[0] as Ring)] };
  }
  return {
    type: 'MultiPolygon',
    coordinates: boundaries.map((ring) => [ringToLonLat(ring)]),
  };
}

/** Build a FeatureCollection with the `_generated` provenance sibling. */
export function featureCollection(
  features: Feature[],
  generated: { source: string; version: string; generatedAt: string },
): FeatureCollection {
  return { type: 'FeatureCollection', _generated: generated, features };
}

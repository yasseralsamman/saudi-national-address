// SPDX-License-Identifier: MIT
//
// The bundled dataset. The named exports `regions` / `cities` / `districts`
// use the lite arrays (no boundaries) — most consumers never need geometry,
// and this keeps bundle size predictable. The full GeoJSON FeatureCollections
// (with [lon, lat] geometry) are exposed under explicit names.
//
// The five data files are resolved and inlined by the bundler (tsup) and by
// vitest; `tsc` does not need to type them, so each import is suppressed and
// the runtime values are cast to the hand-written types below.

// @ts-expect-error - bundled JSON, loaded by the bundler, not typed by tsc.
import citiesData from '../data/cities.lite.json' with { type: 'json' };
// @ts-expect-error - bundled GeoJSON, loaded by the bundler, not typed by tsc.
import districtsGeo from '../data/districts.geojson';
// @ts-expect-error - bundled JSON, loaded by the bundler, not typed by tsc.
import districtsData from '../data/districts.lite.json' with { type: 'json' };
// @ts-expect-error - bundled GeoJSON, loaded by the bundler, not typed by tsc.
import regionsGeo from '../data/regions.geojson';
// @ts-expect-error - bundled JSON, loaded by the bundler, not typed by tsc.
import regionsData from '../data/regions.lite.json' with { type: 'json' };
import type { City, District, GeoJSONFeatureCollection, Region } from './types.js';

export const regions = regionsData as readonly Region[];
export const cities = citiesData as readonly City[];
export const districts = districtsData as readonly District[];

export const regionsGeoJSON = regionsGeo as GeoJSONFeatureCollection;
export const districtsGeoJSON = districtsGeo as GeoJSONFeatureCollection;

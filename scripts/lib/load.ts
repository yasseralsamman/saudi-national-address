// SPDX-License-Identifier: MIT
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

/** Absolute path to the immutable source-data directory. */
export const SOURCE_DIR = resolve(here, '..', '..', 'data', 'source');
/** Absolute path to the generated-output directory. */
export const DIST_DIR = resolve(here, '..', '..', 'data', 'dist');
/** Repository root. */
export const REPO_ROOT = resolve(here, '..', '..');

/**
 * A polygon ring as it appears in the source data: an array of [lat, lon] pairs.
 * Coordinate order is [latitude, longitude] (the non-standard homaily order).
 */
export type Ring = [number, number][];
/** `boundaries` is an array of rings. */
export type Boundaries = Ring[];

export interface RawRegion {
  region_id: number;
  capital_city_id: number;
  code: string;
  name_ar: string;
  name_en: string;
  population: number | null;
  center: [number, number];
  boundaries: Boundaries;
}

export interface RawCity {
  city_id: number;
  region_id: number;
  name_ar: string;
  name_en: string;
  center: [number, number];
}

export interface RawDistrict {
  district_id: number;
  city_id: number;
  region_id: number;
  name_ar: string;
  name_en: string;
  boundaries: Boundaries;
}

export interface SourceData {
  regions: RawRegion[];
  cities: RawCity[];
  districts: RawDistrict[];
}

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(join(SOURCE_DIR, file), 'utf8')) as T;
}

/** Load the three immutable source files from `data/source/`. */
export function loadSource(): SourceData {
  return {
    regions: readJson<RawRegion[]>('regions.json'),
    cities: readJson<RawCity[]>('cities.json'),
    districts: readJson<RawDistrict[]>('districts.json'),
  };
}

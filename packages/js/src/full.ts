// SPDX-License-Identifier: MIT
//
// The FULL dataset (with boundary polygons + region population), exposed under
// the `saudi-national-address/full` subpath so that consumers who only need the
// lite data never pull the ~31 MB of geometry into their bundle.
//
//   import { districts } from 'saudi-national-address';        // lite (default)
//   import { districtsFull } from 'saudi-national-address/full'; // with boundaries
//
// Cities have no full/lite difference, so `citiesFull` is the same data as the
// lite `cities` export.

// @ts-expect-error - bundled JSON, loaded by the bundler, not typed by tsc.
import citiesData from '../data/cities.lite.json' with { type: 'json' };
// @ts-expect-error - bundled JSON, loaded by the bundler, not typed by tsc.
import districtsFullData from '../data/districts.full.json' with { type: 'json' };
// @ts-expect-error - bundled JSON, loaded by the bundler, not typed by tsc.
import regionsFullData from '../data/regions.full.json' with { type: 'json' };
import type { City, DistrictFull, RegionFull } from './types.js';

/** All 13 regions with `population` and boundary polygons. */
export const regionsFull = regionsFullData as readonly RegionFull[];
/** All 3,732 districts with boundary polygons. */
export const districtsFull = districtsFullData as readonly DistrictFull[];
/** All 4,581 cities (identical to the lite `cities` export). */
export const citiesFull = citiesData as readonly City[];

export function findRegionFull(regionId: number): RegionFull | undefined {
  return regionsFull.find((r) => r.region_id === regionId);
}

export function findCityFull(cityId: number): City | undefined {
  return citiesFull.find((c) => c.city_id === cityId);
}

export function findDistrictFull(districtId: number): DistrictFull | undefined {
  return districtsFull.find((d) => d.district_id === districtId);
}

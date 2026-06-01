// SPDX-License-Identifier: MIT
//
// Simple lookups over the lite arrays. With 13 regions / 4,581 cities /
// 3,732 districts a linear scan is sub-millisecond, so no index is built.

import { cities, districts, regions } from './data.js';
import type { City, District, Region } from './types.js';

export function findRegion(regionId: number): Region | undefined {
  return regions.find((r) => r.region_id === regionId);
}

export function findCity(cityId: number): City | undefined {
  return cities.find((c) => c.city_id === cityId);
}

export function findDistrict(districtId: number): District | undefined {
  return districts.find((d) => d.district_id === districtId);
}

export function districtsInCity(cityId: number): District[] {
  return districts.filter((d) => d.city_id === cityId);
}

export function citiesInRegion(regionId: number): City[] {
  return cities.filter((c) => c.region_id === regionId);
}

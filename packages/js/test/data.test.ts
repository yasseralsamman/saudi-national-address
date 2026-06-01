// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest';
import { cities, districts, regions } from '../src/data.js';
import { citiesInRegion, districtsInCity, findDistrict, findRegion } from '../src/lookup.js';

describe('bundled data', () => {
  it('has the expected counts', () => {
    expect(regions.length).toBe(13);
    expect(cities.length).toBe(4581);
    expect(districts.length).toBe(3732);
  });

  it('looks up region 1 (Riyadh) by id', () => {
    expect(findRegion(1)?.code).toBe('RD');
  });

  it('looks up a district by its 11-digit id', () => {
    const d = findDistrict(10100003001);
    expect(d).toBeDefined();
    expect(d?.city_id).toBe(3);
    expect(d?.region_id).toBe(1);
    expect(d?.local_seq).toBe(1);
  });

  it('lists districts in a city and cities in a region', () => {
    const inCity3 = districtsInCity(3);
    expect(inCity3.length).toBeGreaterThan(0);
    expect(inCity3.every((d) => d.city_id === 3)).toBe(true);

    const inRegion1 = citiesInRegion(1);
    expect(inRegion1.length).toBeGreaterThan(0);
    expect(inRegion1.every((c) => c.region_id === 1)).toBe(true);
  });
});

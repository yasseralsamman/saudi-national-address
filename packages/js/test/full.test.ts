// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest';
import {
  citiesFull,
  districtsFull,
  findDistrictFull,
  findRegionFull,
  regionsFull,
} from '../src/full.js';

describe('full dataset', () => {
  it('has the expected counts', () => {
    expect(regionsFull.length).toBe(13);
    expect(citiesFull.length).toBe(4581);
    expect(districtsFull.length).toBe(3732);
  });

  it('regions carry population and boundaries', () => {
    const riyadh = findRegionFull(1);
    expect(riyadh).toBeDefined();
    expect(typeof riyadh?.population).toBe('number');
    expect(Array.isArray(riyadh?.boundaries)).toBe(true);
    expect(riyadh?.boundaries.length ?? 0).toBeGreaterThan(0);
  });

  it('districts carry boundary polygons', () => {
    const d = findDistrictFull(10100003001);
    expect(d).toBeDefined();
    expect(d?.city_id).toBe(3);
    expect(Array.isArray(d?.boundaries)).toBe(true);
    expect(d?.boundaries[0]?.length ?? 0).toBeGreaterThanOrEqual(4);
  });

  it('every full district has a non-empty boundary ring', () => {
    for (const d of districtsFull) {
      expect(d.boundaries.length).toBeGreaterThan(0);
      expect(d.boundaries[0]?.length ?? 0).toBeGreaterThan(0);
    }
  });
});

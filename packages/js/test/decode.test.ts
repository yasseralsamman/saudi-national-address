// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest';
import { districts } from '../src/data.js';
import { decodeDistrictId, encodeDistrictId, isValidDistrictId } from '../src/decode.js';

// The five verified samples from DATA_REFERENCE.md §3 / README.
const SAMPLES: Array<[number, { region_id: number; city_id: number; local_seq: number }]> = [
  [10100003001, { region_id: 1, city_id: 3, local_seq: 1 }],
  [10101351033, { region_id: 1, city_id: 1351, local_seq: 33 }],
  [10103158001, { region_id: 1, city_id: 3158, local_seq: 1 }],
  [10400011038, { region_id: 4, city_id: 11, local_seq: 38 }],
  [10502167006, { region_id: 5, city_id: 2167, local_seq: 6 }],
];

describe('decodeDistrictId', () => {
  it.each(SAMPLES)('decodes %d correctly', (id, parts) => {
    expect(decodeDistrictId(id)).toEqual({ prefix: 1, ...parts });
  });
});

describe('encodeDistrictId', () => {
  it.each(SAMPLES)('encodes back to %d', (id, parts) => {
    expect(encodeDistrictId(parts.region_id, parts.city_id, parts.local_seq)).toBe(id);
  });
});

describe('round-trip over the whole dataset', () => {
  it('decodes then re-encodes every district to itself', () => {
    for (const d of districts) {
      const parts = decodeDistrictId(d.district_id);
      expect(parts.prefix).toBe(1);
      expect(parts.region_id).toBe(d.region_id);
      expect(parts.city_id).toBe(d.city_id);
      expect(parts.local_seq).toBe(d.local_seq);
      expect(encodeDistrictId(parts.region_id, parts.city_id, parts.local_seq)).toBe(d.district_id);
    }
  });

  it('treats every real district_id as valid', () => {
    for (const d of districts) {
      expect(isValidDistrictId(d.district_id)).toBe(true);
    }
  });

  it('rejects malformed ids', () => {
    expect(isValidDistrictId(123)).toBe(false);
    expect(isValidDistrictId(10100003001.5)).toBe(false);
    expect(isValidDistrictId(20100003001)).toBe(false); // prefix 2
  });
});

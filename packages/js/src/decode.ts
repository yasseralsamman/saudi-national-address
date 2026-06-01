// SPDX-License-Identifier: MIT
//
// Decoding/encoding of the 11-digit composite district_id.
// Mirrors exactly the math in DATA_REFERENCE.md §3.

import type { DistrictIdParts } from './types.js';

/**
 * Decode an 11-digit composite district_id into its parts.
 *
 * @example
 * decodeDistrictId(10100003001);
 * // → { prefix: 1, region_id: 1, city_id: 3, local_seq: 1 }
 */
export function decodeDistrictId(districtId: number): DistrictIdParts {
  return {
    prefix: Math.floor(districtId / 10_000_000_000) as 1,
    region_id: Math.floor(districtId / 100_000_000) % 100,
    city_id: Math.floor(districtId / 1_000) % 100_000,
    local_seq: districtId % 1_000,
  };
}

/**
 * Build an 11-digit composite district_id from its parts.
 *
 * @example
 * encodeDistrictId(1, 3, 1);
 * // → 10100003001
 */
export function encodeDistrictId(regionId: number, cityId: number, localSeq: number): number {
  return 1 * 10_000_000_000 + regionId * 100_000_000 + cityId * 1_000 + localSeq;
}

/**
 * Whether a number is a structurally valid Saudi district_id:
 * an integer with prefix 1, region 1..13, a positive city part, and a
 * per-city sequence in 1..999.
 */
export function isValidDistrictId(districtId: number): boolean {
  if (!Number.isInteger(districtId)) return false;
  const { prefix, region_id, city_id, local_seq } = decodeDistrictId(districtId);
  return (
    prefix === 1 &&
    region_id >= 1 &&
    region_id <= 13 &&
    city_id >= 1 &&
    local_seq >= 1 &&
    local_seq <= 999
  );
}

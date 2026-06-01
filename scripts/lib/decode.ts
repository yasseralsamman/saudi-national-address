// SPDX-License-Identifier: MIT
//
// Decoding/encoding of the 11-digit composite district_id.
// This mirrors exactly the math in DATA_REFERENCE.md §3 and is the single
// source of truth for the build pipeline. The published JS package
// (packages/js/src/decode.ts) and PHP package (packages/php/src/DistrictId.php)
// reimplement the identical math for their consumers.

export interface DistrictIdParts {
  prefix: 1;
  region_id: number;
  city_id: number;
  local_seq: number;
}

/** Decode an 11-digit composite district_id into its parts. */
export function decodeDistrictId(districtId: number): DistrictIdParts {
  return {
    prefix: Math.floor(districtId / 10_000_000_000) as 1,
    region_id: Math.floor(districtId / 100_000_000) % 100,
    city_id: Math.floor(districtId / 1_000) % 100_000,
    local_seq: districtId % 1_000,
  };
}

/** Build an 11-digit composite district_id from its parts. */
export function encodeDistrictId(regionId: number, cityId: number, localSeq: number): number {
  return 1 * 10_000_000_000 + regionId * 100_000_000 + cityId * 1_000 + localSeq;
}

/** The per-city district sequence number (`district_id % 1000`). */
export function localSeq(districtId: number): number {
  return districtId % 1_000;
}

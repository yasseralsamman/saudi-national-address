// SPDX-License-Identifier: MIT
//
// Data-integrity validation for the canonical source files.
// Implements the rules in SNA.md §8 (which derive from DATA_REFERENCE.md §5).
// Hard checks abort with a non-zero exit; soft checks log warnings only.

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodeDistrictId } from './lib/decode.js';
import { type Boundaries, loadSource } from './lib/load.js';

class ValidationError extends Error {}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new ValidationError(message);
  }
}

// Saudi Arabia bounding box plus a small margin (SNA.md §8 rule 10).
const LAT_MIN = 16;
const LAT_MAX = 33;
const LON_MIN = 34;
const LON_MAX = 56;

function eachCoord(boundaries: Boundaries, fn: (lat: number, lon: number) => void): void {
  for (const ring of boundaries) {
    for (const [lat, lon] of ring) {
      fn(lat, lon);
    }
  }
}

export function validate(): { regions: number; cities: number; districts: number } {
  // 1. JSON parse of all three source files (throws on malformed JSON).
  const { regions, cities, districts } = loadSource();

  // 2. Region count == 13.
  assert(regions.length === 13, `Expected 13 regions, found ${regions.length}.`);

  // 3. Region uniqueness: region_id unique, code unique.
  const regionById = new Map<number, (typeof regions)[number]>();
  const regionCodes = new Set<string>();
  for (const r of regions) {
    assert(!regionById.has(r.region_id), `Duplicate region_id ${r.region_id}.`);
    assert(!regionCodes.has(r.code), `Duplicate region code "${r.code}".`);
    regionById.set(r.region_id, r);
    regionCodes.add(r.code);
  }

  // 4. City FK: every city.region_id exists in regions.
  const cityById = new Map<number, (typeof cities)[number]>();
  for (const c of cities) {
    assert(
      regionById.has(c.region_id),
      `City ${c.city_id} references missing region_id ${c.region_id}.`,
    );
    assert(!cityById.has(c.city_id), `Duplicate city_id ${c.city_id}.`);
    cityById.set(c.city_id, c);
  }

  // 5. Region capital FK: capital_city_id exists in cities AND that city's
  //    region_id equals the region's region_id.
  for (const r of regions) {
    const capital = cityById.get(r.capital_city_id);
    assert(
      capital !== undefined,
      `Region ${r.region_id} capital_city_id ${r.capital_city_id} not found in cities.`,
    );
    assert(
      capital.region_id === r.region_id,
      `Region ${r.region_id} capital city ${r.capital_city_id} belongs to region ${capital.region_id}.`,
    );
  }

  // 6/7/8. District FK, ID decoding, ID uniqueness.
  const seenDistrictIds = new Set<number>();
  for (const d of districts) {
    // 6. District FK.
    const city = cityById.get(d.city_id);
    assert(
      city !== undefined,
      `District ${d.district_id} references missing city_id ${d.city_id}.`,
    );
    assert(
      regionById.has(d.region_id),
      `District ${d.district_id} references missing region_id ${d.region_id}.`,
    );
    assert(
      city.region_id === d.region_id,
      `District ${d.district_id} region_id ${d.region_id} != city ${d.city_id} region ${city.region_id}.`,
    );

    // 7. District ID decoding.
    const parts = decodeDistrictId(d.district_id);
    assert(parts.prefix === 1, `District ${d.district_id} prefix ${parts.prefix} != 1.`);
    assert(
      parts.region_id === d.region_id,
      `District ${d.district_id} decoded region ${parts.region_id} != row region_id ${d.region_id}.`,
    );
    assert(
      parts.city_id === d.city_id,
      `District ${d.district_id} decoded city ${parts.city_id} != row city_id ${d.city_id}.`,
    );

    // 8. District ID uniqueness.
    assert(!seenDistrictIds.has(d.district_id), `Duplicate district_id ${d.district_id}.`);
    seenDistrictIds.add(d.district_id);
  }

  // 11. No empty names in either language (hard check).
  const checkNames = (kind: string, id: number, ar: string, en: string): void => {
    assert(ar?.trim().length > 0, `${kind} ${id} has an empty name_ar.`);
    assert(en?.trim().length > 0, `${kind} ${id} has an empty name_en.`);
  };
  for (const r of regions) checkNames('Region', r.region_id, r.name_ar, r.name_en);
  for (const c of cities) checkNames('City', c.city_id, c.name_ar, c.name_en);
  for (const d of districts) checkNames('District', d.district_id, d.name_ar, d.name_en);

  // --- Soft checks (warnings, never abort) ---
  let warnings = 0;
  const warn = (msg: string): void => {
    warnings++;
    if (warnings <= 20) console.warn(`  warning: ${msg}`);
  };

  // 9. Polygon validity: each ring should have >= 4 points.
  const checkRings = (kind: string, id: number, boundaries: Boundaries): void => {
    for (let i = 0; i < boundaries.length; i++) {
      const ring = boundaries[i];
      if (ring.length < 4) {
        warn(`${kind} ${id} ring ${i} has only ${ring.length} points (< 4).`);
      }
    }
  };
  // 10. Coordinate bounds.
  const checkBounds = (kind: string, id: number, boundaries: Boundaries): void => {
    eachCoord(boundaries, (lat, lon) => {
      if (lat < LAT_MIN || lat > LAT_MAX || lon < LON_MIN || lon > LON_MAX) {
        warn(`${kind} ${id} coordinate [${lat}, ${lon}] is outside the Saudi bounding box.`);
      }
    });
  };
  for (const r of regions) {
    checkRings('Region', r.region_id, r.boundaries);
    checkBounds('Region', r.region_id, r.boundaries);
  }
  for (const d of districts) {
    checkRings('District', d.district_id, d.boundaries);
    checkBounds('District', d.district_id, d.boundaries);
  }

  if (warnings > 20) {
    console.warn(`  ... and ${warnings - 20} more warnings.`);
  }

  return { regions: regions.length, cities: cities.length, districts: districts.length };
}

function main(): void {
  try {
    const { regions, cities, districts } = validate();
    console.log(`OK: ${regions} regions, ${cities} cities, ${districts} districts validated.`);
    process.exit(0);
  } catch (err) {
    if (err instanceof ValidationError) {
      console.error(`VALIDATION FAILED: ${err.message}`);
    } else {
      console.error(err);
    }
    process.exit(1);
  }
}

// Run as a CLI only when invoked directly (e.g. `tsx scripts/validate.ts`),
// so build.ts can import { validate } without triggering process.exit.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}

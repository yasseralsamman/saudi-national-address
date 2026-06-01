// SPDX-License-Identifier: MIT
//
// Build pipeline entry point (SNA.md §6.1). Reads the immutable source data,
// validates it, computes derived fields, and writes every artifact in §3 to
// data/dist/, then copies the JSON-family outputs into the two packages.

import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import bbox from '@turf/bbox';
import centroid from '@turf/centroid';
import { citiesCsv, districtsCsv, regionsCsv } from './lib/csv.js';
import {
  type Feature,
  type FeatureCollection,
  featureCollection,
  toGeometry,
} from './lib/geojson.js';
import {
  type City,
  type FullDistrict,
  type FullRegion,
  type LatLon,
  type LiteDistrict,
  type LiteRegion,
  type LonLatBbox,
  districtToLite,
  regionToLite,
} from './lib/lite.js';
import { DIST_DIR, REPO_ROOT, loadSource } from './lib/load.js';
import { mysqlSql, postgresSql } from './lib/sql.js';
import { toTopoJSON } from './lib/topojson.js';
import { validate } from './validate.js';

const VERSION = '1.0.0';
// Deterministic build timestamp = the source snapshot date. Keeping this fixed
// (rather than `new Date()`) makes the build reproducible so the committed
// data/dist matches a fresh rebuild in CI (`pnpm run check:dist-clean`).
const GENERATED_AT = '2026-06-01T00:00:00.000Z';
const GENERATED = { source: 'saudi-national-address', version: VERSION, generatedAt: GENERATED_AT };

const JS_DATA_DIR = join(REPO_ROOT, 'packages', 'js', 'data');
const PHP_DATA_DIR = join(REPO_ROOT, 'packages', 'php', 'data');

const round7 = (n: number): number => Math.round(n * 1e7) / 1e7;

function computeBbox(boundaries: number[][][]): LonLatBbox {
  const [minLon, minLat, maxLon, maxLat] = bbox(toGeometry(boundaries as never));
  return [round7(minLon), round7(minLat), round7(maxLon), round7(maxLat)];
}

function computeCenter(boundaries: number[][][]): LatLon {
  const [lon, lat] = centroid(toGeometry(boundaries as never)).geometry.coordinates;
  return [round7(lat as number), round7(lon as number)]; // store as [lat, lon]
}

function writeJson(file: string, data: unknown): void {
  writeFileSync(join(DIST_DIR, file), JSON.stringify(data));
}

function writeText(file: string, text: string): void {
  writeFileSync(join(DIST_DIR, file), text);
}

function main(): void {
  mkdirSync(DIST_DIR, { recursive: true });
  mkdirSync(JS_DATA_DIR, { recursive: true });
  mkdirSync(PHP_DATA_DIR, { recursive: true });

  // Step 1 + 2: load + validate (abort on failure).
  const { regions: rawRegions, cities: rawCities, districts: rawDistricts } = loadSource();
  validate();

  // Step 3: derive fields.
  const fullRegions: FullRegion[] = rawRegions.map((r) => ({
    region_id: r.region_id,
    code: r.code,
    name_ar: r.name_ar,
    name_en: r.name_en,
    population: r.population ?? null,
    capital_city_id: r.capital_city_id,
    center: r.center, // preserved from source
    bbox: computeBbox(r.boundaries),
    boundaries: r.boundaries,
  }));

  const cities: City[] = rawCities.map((c) => ({
    city_id: c.city_id,
    region_id: c.region_id,
    name_ar: c.name_ar,
    name_en: c.name_en,
    center: c.center,
  }));

  const fullDistricts: FullDistrict[] = rawDistricts.map((d) => ({
    district_id: d.district_id,
    city_id: d.city_id,
    region_id: d.region_id,
    local_seq: d.district_id % 1000,
    name_ar: d.name_ar,
    name_en: d.name_en,
    center: computeCenter(d.boundaries),
    bbox: computeBbox(d.boundaries),
    boundaries: d.boundaries,
  }));

  const liteRegions: LiteRegion[] = fullRegions.map(regionToLite);
  const liteDistricts: LiteDistrict[] = fullDistricts.map(districtToLite);

  // Step 4: write artifacts.
  // Bare-array JSON outputs — no envelope, drop-in compatible with homaily.
  writeJson('regions.full.json', fullRegions);
  writeJson('regions.lite.json', liteRegions);
  writeJson('cities.full.json', cities);
  writeJson('cities.lite.json', cities);
  writeJson('districts.full.json', fullDistricts);
  writeJson('districts.lite.json', liteDistricts);

  // GeoJSON — [lon, lat] order; properties carry the id/name lite fields.
  const regionFeatures: Feature[] = fullRegions.map((r) => ({
    type: 'Feature',
    id: r.region_id,
    properties: {
      region_id: r.region_id,
      code: r.code,
      name_ar: r.name_ar,
      name_en: r.name_en,
      capital_city_id: r.capital_city_id,
    },
    geometry: toGeometry(r.boundaries as never),
  }));
  const districtFeatures: Feature[] = fullDistricts.map((d) => ({
    type: 'Feature',
    id: d.district_id,
    properties: {
      district_id: d.district_id,
      city_id: d.city_id,
      region_id: d.region_id,
      local_seq: d.local_seq,
      name_ar: d.name_ar,
      name_en: d.name_en,
    },
    geometry: toGeometry(d.boundaries as never),
  }));
  const regionsGeo: FeatureCollection = featureCollection(regionFeatures, GENERATED);
  const districtsGeo: FeatureCollection = featureCollection(districtFeatures, GENERATED);
  writeJson('regions.geojson', regionsGeo);
  writeJson('districts.geojson', districtsGeo);

  // TopoJSON (quantized) from the GeoJSON outputs.
  writeJson('regions.topojson', toTopoJSON('regions', regionsGeo));
  writeJson('districts.topojson', toTopoJSON('districts', districtsGeo));

  // CSV.
  writeText('regions.csv', regionsCsv(liteRegions));
  writeText('cities.csv', citiesCsv(cities));
  writeText('districts.csv', districtsCsv(liteDistricts));

  // SQL.
  writeText('mysql.sql', mysqlSql(GENERATED_AT, fullRegions, cities, liteDistricts));
  writeText('postgres.sql', postgresSql(GENERATED_AT, fullRegions, cities, liteDistricts));

  // Step 5: copy JSON-family outputs into the packages.
  // JS gets the full set of json + geojson; PHP gets only the three lite files
  // (SNA.md §10.4 — Composer download size matters more than JS bundle size).
  const jsCopies = [
    'regions.full.json',
    'regions.lite.json',
    'cities.full.json',
    'cities.lite.json',
    'districts.full.json',
    'districts.lite.json',
    'regions.geojson',
    'districts.geojson',
  ];
  for (const f of jsCopies) {
    copyFileSync(join(DIST_DIR, f), join(JS_DATA_DIR, f));
  }
  const phpCopies = ['regions.lite.json', 'cities.lite.json', 'districts.lite.json'];
  for (const f of phpCopies) {
    copyFileSync(join(DIST_DIR, f), join(PHP_DATA_DIR, f));
  }

  // Step 6: stats summary.
  console.log('Build complete.');
  console.log(`  regions:   ${fullRegions.length}`);
  console.log(`  cities:    ${cities.length}`);
  console.log(`  districts: ${fullDistricts.length}`);
  console.log(`  output:    ${DIST_DIR}`);
}

main();

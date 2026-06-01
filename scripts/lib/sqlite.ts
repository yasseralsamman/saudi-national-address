// SPDX-License-Identifier: MIT
//
// SQLite generation via better-sqlite3. Same schema as the MySQL dump
// (geometry kept as a JSON `bbox` column, no spatial types).
//
// This is a CI/release-only artifact: `scripts/build.ts` does NOT call it and
// the resulting *.sqlite file is gitignored. Run it directly with
//   pnpm tsx scripts/lib/sqlite.ts
// which writes data/dist/saudi-national-address.sqlite.

import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import type { City, FullRegion, LiteDistrict } from './lite.js';
import { DIST_DIR } from './load.js';

const SCHEMA = `
CREATE TABLE saudi_region (
  region_id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  population INTEGER,
  capital_city_id INTEGER,
  center_lat REAL,
  center_lon REAL,
  bbox TEXT
);

CREATE TABLE saudi_city (
  city_id INTEGER PRIMARY KEY,
  region_id INTEGER NOT NULL REFERENCES saudi_region (region_id),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  center_lat REAL,
  center_lon REAL
);
CREATE INDEX idx_saudi_city_region ON saudi_city (region_id);

CREATE TABLE saudi_district (
  district_id INTEGER PRIMARY KEY,
  city_id INTEGER NOT NULL REFERENCES saudi_city (city_id),
  region_id INTEGER NOT NULL REFERENCES saudi_region (region_id),
  local_seq INTEGER NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  bbox TEXT
);
CREATE INDEX idx_saudi_district_region_city ON saudi_district (region_id, city_id);
CREATE INDEX idx_saudi_district_city_seq ON saudi_district (city_id, local_seq);
`;

function readDist<T>(file: string): T {
  return JSON.parse(readFileSync(join(DIST_DIR, file), 'utf8')) as T;
}

export function buildSqlite(outPath: string): void {
  const regions = readDist<FullRegion[]>('regions.full.json');
  const cities = readDist<City[]>('cities.lite.json');
  const districts = readDist<LiteDistrict[]>('districts.lite.json');

  const db = new Database(outPath);
  db.pragma('journal_mode = WAL');
  db.exec(SCHEMA);

  const insertRegion = db.prepare(
    'INSERT INTO saudi_region (region_id, code, name_ar, name_en, population, capital_city_id, center_lat, center_lon, bbox) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  );
  const insertCity = db.prepare(
    'INSERT INTO saudi_city (city_id, region_id, name_ar, name_en, center_lat, center_lon) VALUES (?, ?, ?, ?, ?, ?)',
  );
  const insertDistrict = db.prepare(
    'INSERT INTO saudi_district (district_id, city_id, region_id, local_seq, name_ar, name_en, bbox) VALUES (?, ?, ?, ?, ?, ?, ?)',
  );

  const load = db.transaction(() => {
    for (const r of regions) {
      insertRegion.run(
        r.region_id,
        r.code,
        r.name_ar,
        r.name_en,
        r.population,
        r.capital_city_id,
        r.center[0],
        r.center[1],
        JSON.stringify(r.bbox),
      );
    }
    for (const c of cities) {
      insertCity.run(c.city_id, c.region_id, c.name_ar, c.name_en, c.center[0], c.center[1]);
    }
    for (const d of districts) {
      insertDistrict.run(
        d.district_id,
        d.city_id,
        d.region_id,
        d.local_seq,
        d.name_ar,
        d.name_en,
        JSON.stringify(d.bbox),
      );
    }
  });
  load();
  db.close();
}

function main(): void {
  const outPath = join(DIST_DIR, 'saudi-national-address.sqlite');
  buildSqlite(outPath);
  console.log(`Wrote ${outPath}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}

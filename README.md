# Saudi National Address Open Dataset

An open, developer-friendly dataset of Saudi Arabia's **13 regions, 4,581 cities, and
3,732 districts**, with the official SPL National Address **11-digit composite
`district_id`**, district boundary polygons, and a dozen ready-to-use output formats.
It is a drop-in replacement for the `homaily/Saudi-Arabia-Regions-Cities-and-Districts`
dataset, packaged for both JavaScript/TypeScript (npm) and PHP (Composer), with a static
map viewer and automated data-integrity checks.

## What's in this repo

- **Data** — one canonical source (`data/source/`) compiled into many formats under
  `data/dist/`: full + lite JSON, GeoJSON, TopoJSON, CSV, and MySQL/PostgreSQL SQL.
- **Packages** — `saudi-national-address` on npm (TypeScript, ESM + CJS) and
  `yasseralsamman/saudi-national-address` on Packagist (PHP 8.1+), both bundling the data
  so consumers never fetch over HTTP at runtime.
- **Viewer** — a single-page Leaflet map (no build step) for browsing regions and
  districts, deployable to GitHub Pages.

## Quick links

- npm: <https://www.npmjs.com/package/saudi-national-address>
- Packagist: <https://packagist.org/packages/yasseralsamman/saudi-national-address>
- Map viewer: <https://yasseralsamman.github.io/saudi-national-address/>
- Data dictionary: [`DATA_REFERENCE.md`](DATA_REFERENCE.md)

## Data formats available

All generated files live in [`data/dist/`](data/dist/) and are committed for direct
download. The bare-array JSON files (`*.full.json` / `*.lite.json`) keep the exact shape
of the upstream homaily dataset.

| File | Purpose |
|---|---|
| [`regions.full.json`](data/dist/regions.full.json) | 13 regions with `population`, `center`, `bbox`, and boundary polygons. |
| [`regions.lite.json`](data/dist/regions.lite.json) | 13 regions without geometry — ids, names, `center`, `bbox`. |
| [`cities.full.json`](data/dist/cities.full.json) | 4,581 cities (ids, names, `center`). |
| [`cities.lite.json`](data/dist/cities.lite.json) | Identical to the full file (cities have no boundaries). |
| [`districts.full.json`](data/dist/districts.full.json) | 3,732 districts with `local_seq`, `center`, `bbox`, and boundary polygons. |
| [`districts.lite.json`](data/dist/districts.lite.json) | 3,732 districts without polygons — the file most consumers want. |
| [`regions.geojson`](data/dist/regions.geojson) | Region polygons in standard GeoJSON (`[lon, lat]`). |
| [`districts.geojson`](data/dist/districts.geojson) | District polygons in standard GeoJSON (`[lon, lat]`). |
| [`regions.topojson`](data/dist/regions.topojson) | TopoJSON of the regions (quantized, ~80% smaller). |
| [`districts.topojson`](data/dist/districts.topojson) | TopoJSON of the districts (quantized). |
| [`regions.csv`](data/dist/regions.csv) | Flat region rows (`center`/`bbox` split into columns). |
| [`cities.csv`](data/dist/cities.csv) | Flat city rows. |
| [`districts.csv`](data/dist/districts.csv) | Flat district rows. |
| [`mysql.sql`](data/dist/mysql.sql) | Self-contained MySQL dump (`utf8mb4`, three tables). |
| [`postgres.sql`](data/dist/postgres.sql) | Self-contained PostgreSQL dump. |

A SQLite build (`saudi-national-address.sqlite`) is attached to each GitHub Release rather
than committed to the repository.

JSON Schemas for the three record types are in [`schemas/`](schemas/).

## Install

### JavaScript / TypeScript

```sh
npm install saudi-national-address
```

Lite by default (no geometry — small bundle):

```ts
import { districts, findDistrict, decodeDistrictId } from 'saudi-national-address';

console.log(districts.length); // 3732
findDistrict(10100003001);     // { district_id: 10100003001, city_id: 3, ... }  (no boundaries)
decodeDistrictId(10100003001); // { prefix: 1, region_id: 1, city_id: 3, local_seq: 1 }
```

Full data (boundary polygons + region `population`) from the `/full` subpath —
import it only when you need geometry, so lite-only apps never bundle it:

```ts
import { districtsFull, regionsFull, findDistrictFull } from 'saudi-national-address/full';

regionsFull[0].population;            // number
findDistrictFull(10100003001)?.boundaries; // polygon rings ([lat, lon])
```

See [`packages/js/README.md`](packages/js/README.md) for the full API.

### PHP

```sh
composer require yasseralsamman/saudi-national-address
```

Lite by default:

```php
use SaudiNationalAddress\Dataset;
use SaudiNationalAddress\DistrictId;

count(Dataset::districts());            // 3732
Dataset::findDistrict(10100003001);     // District { city_id: 3, ... }  (no boundaries)
DistrictId::decode(10100003001);        // ['prefix' => 1, 'region_id' => 1, 'city_id' => 3, 'local_seq' => 1]
```

Full data (boundary polygons + region `population`), loaded on demand:

```php
Dataset::findRegionFull(1)->population;           // int
Dataset::findDistrictFull(10100003001)->boundaries; // polygon rings ([lat, lon])
count(Dataset::districtsFull());                  // 3732, each with boundaries
```

See [`packages/php/README.md`](packages/php/README.md) for the full API.

## The 11-digit `district_id` format

`district_id` is **not** a flat sequential identifier. It is an **11-digit composite** that encodes the region, the city, and a per-city district sequence number, matching the form used by SPL's National Address API (which documents the example value `10100003001`).

### Layout

```
Position:  1   2 3   4 5 6 7 8   9 10 11
Digit:     1   0 1   0 0 0 0 3   0  0  1
Group:    [P] [ R R ][ C C C C C ][ N N N ]
```

| Group | Digits | Meaning |
|------:|-------:|---------|
| P     | 1      | Constant prefix, always `1` (KSA country marker in the SPL scheme) |
| RR    | 2      | `region_id`, zero-padded to 2 digits |
| CCCCC | 5      | `city_id`, zero-padded to 5 digits |
| NNN   | 3      | District sequence number within the city (1, 2, 3, …), zero-padded to 3 digits |

Total: 11 digits. Fits comfortably in a 64-bit integer, in JavaScript's safe integer range (`Number.MAX_SAFE_INTEGER` ≈ 9 × 10¹⁵), and in a PHP `int` on 64-bit systems.

### Verified samples (drawn directly from the dataset)

| district_id     | P | RR | CCCCC | NNN | matches `region_id` / `city_id`? |
|-----------------|---|----|-------|-----|----------------------------------|
| `10100003001`   | 1 | 01 | 00003 | 001 | region 1, city 3 ✓               |
| `10101351033`   | 1 | 01 | 01351 | 033 | region 1, city 1351 ✓            |
| `10103158001`   | 1 | 01 | 03158 | 001 | region 1, city 3158 ✓            |
| `10400011038`   | 1 | 04 | 00011 | 038 | region 4, city 11 ✓              |
| `10502167006`   | 1 | 05 | 02167 | 006 | region 5, city 2167 ✓            |

The embedded `RR` and `CCCCC` always match the row's `region_id` and `city_id`. This is enforced by the build's validation step.

### Decoding (language-agnostic)

```
prefix         = floor(district_id / 10_000_000_000)        // always 1
region_part    = floor(district_id / 100_000_000) % 100     // 2-digit region
city_part      = floor(district_id / 1_000)       % 100_000 // 5-digit city
local_seq      = district_id % 1_000                        // 3-digit sequence
```

### JavaScript / TypeScript

```ts
import { decodeDistrictId, encodeDistrictId } from 'saudi-national-address';

decodeDistrictId(10100003001);
// → { prefix: 1, region_id: 1, city_id: 3, local_seq: 1 }

encodeDistrictId(1, 3, 1);
// → 10100003001
```

### PHP

```php
use SaudiNationalAddress\DistrictId;

DistrictId::decode(10100003001);
// → ['prefix' => 1, 'region_id' => 1, 'city_id' => 3, 'local_seq' => 1]

DistrictId::encode(1, 3, 1);
// → 10100003001
```

### Why keep the long form?

The 11-digit composite is the canonical SPL-API form and round-trips losslessly to the shorter per-city sequence (`local_seq = district_id % 1000`). Storing only the short form would lose the parent IDs and require a separate join to reconstruct them. Every record in this dataset also carries `region_id` and `city_id` as explicit fields, so consumers can use whichever representation they prefer.

For the complete data dictionary, see [`DATA_REFERENCE.md`](DATA_REFERENCE.md).

## Coverage

- **13** administrative regions
- **4,581** cities
- **3,732** districts

## What's not included

- **Postal codes** — the source data does not contain per-district postal codes, and none are invented here.
- **Governorates (محافظة)** — the source data has no governorate layer.
- **A hosted lookup API** — use SPL's `api.address.gov.sa` for live address lookups.
- **A Drupal module** — not part of this dataset repository.

## Development

```sh
pnpm install
pnpm run validate   # data-integrity checks against data/source/
pnpm run build      # regenerate everything in data/dist/ and the package data/ dirs
pnpm test           # run the JS package tests
```

The PHP package is tested with:

```sh
composer install --working-dir=packages/php
./packages/php/vendor/bin/phpunit -c packages/php/phpunit.xml.dist
```

`data/dist/` is committed and CI enforces that it matches a fresh build
(`pnpm run check:dist-clean`). To correct data, edit `data/source/` and re-run
`pnpm run build` — never hand-edit `data/dist/`.

## License

- **Code** (scripts, both packages, the viewer): [MIT](LICENSE).
- **Data** (`data/source/` and `data/dist/`): [CC0-1.0](LICENSE-DATA) — a public-domain
  dedication, so no attribution is required and there is no share-alike obligation.
  Attribution is appreciated as a courtesy but not legally required.

## Acknowledgements

- The underlying region/city/district boundary data comes from the
  [`homaily/Saudi-Arabia-Regions-Cities-and-Districts`](https://github.com/homaily/Saudi-Arabia-Regions-Cities-and-Districts)
  dataset.
- The National Address standard, region codes, and the 11-digit `district_id` form are
  defined by **SPL — Saudi Post Logistics** (<https://splonline.com.sa/>), the upstream
  authority.

## Publishing & identifiers

This tree ships pre-configured for:

- GitHub owner: **yasseralsamman** (`https://github.com/yasseralsamman/saudi-national-address`)
- npm package: **saudi-national-address**
- Packagist vendor: **yasseralsamman/saudi-national-address**

To publish: push `main`, then `git tag v1.0.0 && git push --tags`. The release workflow
publishes to npm and creates the GitHub Release (with the SQLite + asset bundle), and
Packagist auto-syncs the PHP package. Enable GitHub Pages after the first `pages.yml` run.

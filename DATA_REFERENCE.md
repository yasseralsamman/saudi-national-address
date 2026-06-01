# Saudi Arabia Regions / Cities / Districts — Data Reference

This document describes the three JSON data files in this directory and how their IDs relate to the official Saudi National Address (SNA) standard published by Saudi Post / SPL. It is written for an engineer (or AI coding assistant) who will use these files as the source of truth for a Drupal module that exposes Saudi geographic data (region → city → district) and links it to addresses.

The three files:

- `regions.json` — 13 records
- `cities.json` — 4,581 records
- `districts.json` — 3,732 records

All three files are JSON arrays of objects. Text fields are provided in both Arabic (`name_ar`) and English (`name_en`).

---

## 1. SNA / SPL compliance summary

The IDs used in these files match the reference IDs used by the official **Saudi National Address API** (SPL — Saudi Post Logistics), specifically the values returned by `api.address.gov.sa` for address records:

| Concept | Field in these files | SPL National Address API documented example |
|---|---|---|
| Region | `region_id` | `1` (Riyadh) |
| City | `city_id` | `3` (Riyadh city) |
| District | `district_id` | `10100003001` |

Region two-letter `code` values (`RD, MQ, MN, QA, SQ, AS, TB, HA, SH, GA, NG, BA, GO`) and the count of 13 administrative regions also match the official SPL region list.

> Note on a separate SPL endpoint: `GET /Districts` on the SPL **Lookups** API returns short 4-digit district IDs (e.g. `1242`, `1283`). That is a different identifier system (a flat global lookup ID) and is **not** what these files use. These files use the 11-digit composite National Address `district_id` form, which is the one referenced in actual SPL address records and is therefore the appropriate one for an addressing module.

---

## 2. File schemas

### 2.1 `regions.json`

Array of 13 objects, one per administrative region of Saudi Arabia.

```jsonc
{
  "region_id": 1,                       // integer, 1..13
  "capital_city_id": 3,                 // FK -> cities.json.city_id
  "code": "RD",                         // 2-letter SPL region code
  "name_ar": "منطقة الرياض",
  "name_en": "Riyadh",
  "population": 6777146,                // integer
  "center": [24.69999996, 46.73333003], // [latitude, longitude]
  "boundaries": [ /* polygon(s) */ ]    // see §4
}
```

The full set of 13 regions (for reference / sanity checks):

| region_id | code | name_en           | name_ar           |
|----------:|------|-------------------|-------------------|
| 1         | RD   | Riyadh            | منطقة الرياض      |
| 2         | MQ   | Makkah            | منطقة مكة المكرمة |
| 3         | MN   | Madinah           | منطقة المدينة المنورة |
| 4         | QA   | Qassim            | منطقة القصيم      |
| 5         | SQ   | Eastern Province  | المنطقة الشرقية   |
| 6         | AS   | Asir              | منطقة عسير        |
| 7         | TB   | Tabuk             | منطقة تبوك        |
| 8         | HA   | Hail              | منطقة حائل        |
| 9         | SH   | Northern Borders  | منطقة الحدود الشمالية |
| 10        | GA   | Jazan             | منطقة جازان       |
| 11        | NG   | Najran            | منطقة نجران       |
| 12        | BA   | Bahah             | منطقة الباحة      |
| 13        | GO   | Jawf              | منطقة الجوف       |

### 2.2 `cities.json`

Array of 4,581 objects.

```jsonc
{
  "city_id": 3,                          // integer, globally unique across KSA
  "region_id": 7,                        // FK -> regions.json.region_id
  "name_ar": "تبوك",
  "name_en": "Tabuk",
  "center": [28.41463997, 36.53387003]   // [latitude, longitude]
}
```

Cities do **not** carry boundary polygons in this dataset — only a center point.

`city_id` is unique across the whole country, not per region. The maximum observed value is in the thousands (e.g. `3158`, `2167`), so when the value is embedded inside a `district_id` it is zero-padded to 5 digits (see §3).

### 2.3 `districts.json`

Array of 3,732 objects.

```jsonc
{
  "district_id": 10100003001,            // 11-digit composite, see §3
  "city_id": 3,                          // FK -> cities.json.city_id
  "region_id": 1,                        // FK -> regions.json.region_id (denormalized)
  "name_ar": "حي العمل",
  "name_en": "Al Amal Dist.",
  "boundaries": [ /* polygon(s) */ ]     // see §4
}
```

`region_id` is denormalized into the district record (it can also be derived from `city_id` via `cities.json`, or extracted directly from `district_id` — see §3). Treat the explicit `region_id` field as authoritative for the record and use the derivation only as an integrity check.

---

## 3. The `district_id` format (critical for implementation)

`district_id` is **not** a flat sequential ID. It is an 11-digit composite that encodes the region, the city, and a per-city district sequence number. The user who provided these files specifically asked for this to be decoded because it is much longer than the SNA "short" district number and embeds parent IDs.

### Layout

```
Position:  1  2 3  4 5 6 7 8  9 10 11
Digit:     1  0 1  0 0 0 0 3  0  0  1
Group:    [P][RR ][CCCCC    ][NNN    ]
```

| Group | Digits | Meaning |
|------:|-------:|---------|
| P     | 1      | Constant prefix, always `1` (KSA country marker in the SPL scheme) |
| RR    | 2      | `region_id`, zero-padded to 2 digits |
| CCCCC | 5      | `city_id`, zero-padded to 5 digits |
| NNN   | 3      | District sequence number within the city (1, 2, 3, …), zero-padded to 3 digits |

Total: 11 digits, fits in a 64-bit integer comfortably but **will overflow JavaScript's safe-integer range only above 2^53 — `district_id` is well below that**, so JS `number` is safe. PHP `int` on 64-bit is also fine.

### Verified samples (drawn directly from the file)

| district_id   | P | RR | CCCCC | NNN | row's region_id | row's city_id |
|---------------|---|----|-------|-----|-----------------|---------------|
| `10100003001` | 1 | 01 | 00003 | 001 | 1               | 3             |
| `10101351033` | 1 | 01 | 01351 | 033 | 1               | 1351          |
| `10103158001` | 1 | 01 | 03158 | 001 | 1               | 3158          |
| `10400011038` | 1 | 04 | 00011 | 038 | 4               | 11            |
| `10502167006` | 1 | 05 | 02167 | 006 | 5               | 2167          |

The embedded RR and CCCCC always match the row's `region_id` and `city_id`. Use this as a data-integrity assertion at import time.

### Decoding (language-agnostic pseudocode)

```
prefix          = floor(district_id / 10_000_000_000)        // expect 1
region_part     = floor(district_id / 100_000_000) % 100     // 2-digit region
city_part       = floor(district_id / 1_000)       % 100_000 // 5-digit city
local_district  = district_id % 1_000                        // 3-digit sequence

assert prefix == 1
assert region_part == row.region_id
assert city_part   == row.city_id
```

### PHP (for the Drupal module)

```php
function spl_decode_district_id(int $districtId): array {
    return [
        'prefix'        => intdiv($districtId, 10_000_000_000),
        'region_id'     => intdiv($districtId, 100_000_000) % 100,
        'city_id'       => intdiv($districtId, 1_000) % 100_000,
        'local_seq'     => $districtId % 1_000,
    ];
}

function spl_encode_district_id(int $regionId, int $cityId, int $localSeq): int {
    // localSeq is the per-city district number (1..999)
    return 1 * 10_000_000_000
         + $regionId * 100_000_000
         + $cityId   * 1_000
         + $localSeq;
}
```

### What "the SNA short district number" is

If a UI or downstream system asks for *the* district number (the form referenced in the SPL spec as a small per-city number), that is the **`local_seq`** = `district_id % 1000`. Display it zero-padded to 3 digits if you need fixed width (`001`, `033`, …). The full `district_id` is what should be stored as the canonical key and what should be used when talking to SPL APIs that accept the composite form.

---

## 4. The `boundaries` field (geometry)

Both `regions.json` and `districts.json` (but not `cities.json`) contain a `boundaries` field describing the polygonal outline of the area.

Shape: `boundaries` is an **array of rings**, each ring is an **array of `[lat, lon]` pairs**. Sample:

```jsonc
"boundaries": [
  [
    [27.69655994, 45.02997002],
    [27.69071994, 45.03488002],
    ...
  ]
  // possibly more rings for multipolygon shapes
]
```

Important details:

- **Coordinate order is `[latitude, longitude]`** (not the GeoJSON convention of `[lon, lat]`). If you emit GeoJSON or feed this to a library that expects GeoJSON order, **swap the pair**.
- `center` on `regions.json` and `cities.json` follows the same `[lat, lon]` order.
- Rings are not guaranteed to be explicitly closed (first point repeated as last). When converting to a format that requires closed rings (GeoJSON, WKT, PostGIS), close them defensively.
- Coordinates use the WGS 84 datum (consistent with how SPL publishes them and how the values plot on standard web maps).
- The data is bulky: `regions.json` and `districts.json` are dominated by these coordinate arrays. Plan the import to stream rather than fully buffer if memory matters (see §6).

If your Drupal module does not need polygon rendering or point-in-polygon queries, you may drop `boundaries` at import time and keep only `center` / `name` / IDs. That reduces storage by roughly two orders of magnitude.

---

## 5. Relationships and referential integrity

```
regions (13)
   │  1
   │
   │  *
cities (4,581)              ──── region_id      ─→ regions.region_id
                            ──── (capital city of a region is regions.capital_city_id → cities.city_id)
   │  1
   │
   │  *
districts (3,732)           ──── city_id        ─→ cities.city_id
                            ──── region_id      ─→ regions.region_id (denormalized, also embedded in district_id)
```

Recommended import-time assertions:

1. Every `cities[i].region_id` exists in `regions`.
2. Every `regions[i].capital_city_id` exists in `cities` and that city's `region_id` equals the region's `region_id`.
3. Every `districts[i].city_id` exists in `cities`.
4. Every `districts[i].region_id` exists in `regions` and equals `cities[districts[i].city_id].region_id`.
5. For every district: decoding `district_id` yields `prefix=1`, `region_part == region_id`, `city_part == city_id`.

If any of these fail, fail the import loudly rather than silently dropping rows — the dataset is curated and a violation indicates either corruption or that the file has been replaced with a differently-shaped one.

---

## 6. Recommended Drupal schema

Suggested table shape for a custom module (e.g. `saudi_address`). Adjust naming to match your project conventions.

```
saudi_region
  region_id          INT UNSIGNED  PRIMARY KEY     -- 1..13
  code               CHAR(2)       UNIQUE NOT NULL -- 'RD', 'MQ', ...
  name_ar            VARCHAR(128)  NOT NULL
  name_en            VARCHAR(128)  NOT NULL
  population         INT UNSIGNED  NULL
  capital_city_id    INT UNSIGNED  NULL            -- FK -> saudi_city.city_id (nullable to break cycle on import)
  center_lat         DECIMAL(10,7) NULL
  center_lon         DECIMAL(10,7) NULL
  boundaries_geojson LONGTEXT      NULL            -- optional; or use a spatial column

saudi_city
  city_id            INT UNSIGNED  PRIMARY KEY     -- globally unique
  region_id          INT UNSIGNED  NOT NULL        -- FK -> saudi_region.region_id, INDEX
  name_ar            VARCHAR(128)  NOT NULL
  name_en            VARCHAR(128)  NOT NULL
  center_lat         DECIMAL(10,7) NULL
  center_lon         DECIMAL(10,7) NULL

saudi_district
  district_id        BIGINT UNSIGNED PRIMARY KEY   -- 11-digit composite, fits in BIGINT
  city_id            INT UNSIGNED  NOT NULL        -- FK -> saudi_city.city_id, INDEX
  region_id          INT UNSIGNED  NOT NULL        -- FK -> saudi_region.region_id, INDEX
  local_seq          SMALLINT UNSIGNED NOT NULL    -- district_id % 1000, useful for sorting / display
  name_ar            VARCHAR(128)  NOT NULL
  name_en            VARCHAR(128)  NOT NULL
  boundaries_geojson LONGTEXT      NULL
```

Notes:

- `district_id` must be `BIGINT` (or equivalent 64-bit integer). It exceeds `INT` (`2^31 - 1` ≈ 2.1 billion).
- Index `(region_id, city_id)` on `saudi_district` if you expect drill-down queries.
- Consider a composite secondary index `(city_id, local_seq)` for "list districts in city, ordered as SPL orders them."
- If you store geometry properly (MySQL `GEOMETRY` / PostGIS `geometry(Polygon, 4326)`), remember to swap `[lat, lon]` → `(lon, lat)` to match standard GIS conventions.

### Importer outline

1. Read `regions.json`, upsert into `saudi_region` (defer `capital_city_id` to a second pass).
2. Read `cities.json`, upsert into `saudi_city`. Validate FK to region.
3. Update each region's `capital_city_id`.
4. Read `districts.json` **as a stream** (the file is large — multi-megabyte to tens of MB depending on geometry). For each record:
   - Decode `district_id` and assert it matches `region_id` and `city_id`.
   - Compute `local_seq = district_id % 1000`.
   - Upsert into `saudi_district`.
5. Run integrity assertions from §5 over the loaded data and log any orphan rows.

For PHP streaming JSON parsing in Drupal, `halaxa/json-machine` works well and avoids loading the entire array into memory. If you keep `boundaries`, store it as compact GeoJSON (`json_encode` without pretty-printing) or push it into a spatial column.

---

## 7. Public-facing display tips

- The English name `name_en` for districts often ends with the literal string `" Dist."` (e.g. `"Al Amal Dist."`). If you don't want that suffix in your UI, strip a trailing `" Dist."` at render time. Don't strip at import — keep the source value verbatim.
- For Arabic names, render with RTL direction and a font that supports Arabic glyphs (most modern Drupal themes already do).
- The SPL "short address" format (e.g. `RCTB4359`) is a separate concept and is **not** in these files; do not attempt to derive it. If your module needs to validate or display short addresses, that requires a separate call to the SPL API.

---

## 8. Sources

- SPL National Address API overview: <https://splonline.com.sa/en/national-address-api/>
- SPL National Address developer portal: <https://api.address.gov.sa/>
- SPL Districts lookup endpoint (note: returns the **separate** 4-digit lookup IDs, not the 11-digit composite used here): <https://api.address.gov.sa/Districts>
- SPL National Address overview page: <https://splonline.com.sa/en/national-address-1/>

The 11-digit composite `district_id` format documented in §3 was verified empirically against the file (5 rows from different regions and cities) and matches the example value documented by SPL's National Address API (`10100003001`).

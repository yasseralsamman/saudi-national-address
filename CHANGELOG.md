# Changelog

## v1.1.0 — 2026-06-02

- Both packages now bundle **lite and full** data; choose at runtime.
  - npm: full data (boundary polygons + region population) is available from the
    `saudi-national-address/full` subpath (`regionsFull`, `citiesFull`,
    `districtsFull`, `findRegionFull`, `findDistrictFull`). The default
    `saudi-national-address` import stays lite, so lite-only consumers don't
    bundle the geometry.
  - PHP: `Dataset::regionsFull()`, `Dataset::citiesFull()`,
    `Dataset::districtsFull()`, `Dataset::findRegionFull()`,
    `Dataset::findDistrictFull()` read the full files on demand. The PHP package
    now ships the full JSON too, so its install size is larger.
- No data changes; same 13 regions, 4,581 cities, 3,732 districts.

## v1.0.0 — 2026-06-01

Initial release.

- 13 regions, 4,581 cities, 3,732 districts.
- Source-data snapshot date: 2026-06-01.
- Outputs: JSON (full + lite), GeoJSON, TopoJSON, CSV, MySQL, PostgreSQL, SQLite (release asset).
- Packages: `saudi-national-address` (npm), `yasseralsamman/saudi-national-address` (Packagist).
- Static map viewer hosted on GitHub Pages.
- District IDs are stored in their 11-digit SPL composite form; see README for decoding.

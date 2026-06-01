// SPDX-License-Identifier: MIT
//
// CSV generation. Flat columns, one row per record, no geometry.
// Array-valued fields are split: center -> center_lat/center_lon,
// bbox -> bbox_min_lon/bbox_min_lat/bbox_max_lon/bbox_max_lat.

import { stringify } from 'csv-stringify/sync';
import type { City, LiteDistrict, LiteRegion } from './lite.js';

export function regionsCsv(regions: LiteRegion[]): string {
  const rows = regions.map((r) => ({
    region_id: r.region_id,
    code: r.code,
    name_ar: r.name_ar,
    name_en: r.name_en,
    capital_city_id: r.capital_city_id,
    center_lat: r.center[0],
    center_lon: r.center[1],
    bbox_min_lon: r.bbox[0],
    bbox_min_lat: r.bbox[1],
    bbox_max_lon: r.bbox[2],
    bbox_max_lat: r.bbox[3],
  }));
  return stringify(rows, { header: true });
}

export function citiesCsv(cities: City[]): string {
  const rows = cities.map((c) => ({
    city_id: c.city_id,
    region_id: c.region_id,
    name_ar: c.name_ar,
    name_en: c.name_en,
    center_lat: c.center[0],
    center_lon: c.center[1],
  }));
  return stringify(rows, { header: true });
}

export function districtsCsv(districts: LiteDistrict[]): string {
  const rows = districts.map((d) => ({
    district_id: d.district_id,
    city_id: d.city_id,
    region_id: d.region_id,
    local_seq: d.local_seq,
    name_ar: d.name_ar,
    name_en: d.name_en,
    center_lat: d.center[0],
    center_lon: d.center[1],
    bbox_min_lon: d.bbox[0],
    bbox_min_lat: d.bbox[1],
    bbox_max_lon: d.bbox[2],
    bbox_max_lat: d.bbox[3],
  }));
  return stringify(rows, { header: true });
}

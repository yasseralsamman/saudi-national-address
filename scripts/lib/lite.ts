// SPDX-License-Identifier: MIT
//
// Full and lite record shapes plus the full -> lite projections.
// Shapes follow SNA.md §6.2 exactly.

export type LatLon = [number, number]; // [latitude, longitude]
export type LonLatBbox = [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]

export interface FullRegion {
  region_id: number;
  code: string;
  name_ar: string;
  name_en: string;
  population: number | null;
  capital_city_id: number;
  center: LatLon;
  bbox: LonLatBbox;
  boundaries: number[][][];
}

export interface LiteRegion {
  region_id: number;
  code: string;
  name_ar: string;
  name_en: string;
  capital_city_id: number;
  center: LatLon;
  bbox: LonLatBbox;
}

export interface City {
  city_id: number;
  region_id: number;
  name_ar: string;
  name_en: string;
  center: LatLon;
}

export interface FullDistrict {
  district_id: number;
  city_id: number;
  region_id: number;
  local_seq: number;
  name_ar: string;
  name_en: string;
  center: LatLon;
  bbox: LonLatBbox;
  boundaries: number[][][];
}

export interface LiteDistrict {
  district_id: number;
  city_id: number;
  region_id: number;
  local_seq: number;
  name_ar: string;
  name_en: string;
  center: LatLon;
  bbox: LonLatBbox;
}

export function regionToLite(r: FullRegion): LiteRegion {
  return {
    region_id: r.region_id,
    code: r.code,
    name_ar: r.name_ar,
    name_en: r.name_en,
    capital_city_id: r.capital_city_id,
    center: r.center,
    bbox: r.bbox,
  };
}

export function districtToLite(d: FullDistrict): LiteDistrict {
  return {
    district_id: d.district_id,
    city_id: d.city_id,
    region_id: d.region_id,
    local_seq: d.local_seq,
    name_ar: d.name_ar,
    name_en: d.name_en,
    center: d.center,
    bbox: d.bbox,
  };
}

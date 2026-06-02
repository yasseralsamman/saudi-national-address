// SPDX-License-Identifier: MIT

/** A coordinate pair in [latitude, longitude] order (the dataset's order). */
export type LatLon = readonly [number, number];
/** A bounding box in GeoJSON order: [minLon, minLat, maxLon, maxLat]. */
export type LonLatBbox = readonly [number, number, number, number];

/** One administrative region of Saudi Arabia (lite shape). */
export interface Region {
  region_id: number;
  /** Two-letter SPL region code (e.g. "RD"). */
  code: string;
  name_ar: string;
  name_en: string;
  /** city_id of the region's capital. */
  capital_city_id: number;
  /** [latitude, longitude], preserved from source. */
  center: LatLon;
  /** [minLon, minLat, maxLon, maxLat]. */
  bbox: LonLatBbox;
}

/** One city of Saudi Arabia. Cities carry only a center point. */
export interface City {
  city_id: number;
  region_id: number;
  name_ar: string;
  name_en: string;
  /** [latitude, longitude]. */
  center: LatLon;
}

/** One district of Saudi Arabia (lite shape — no polygon boundaries). */
export interface District {
  /** 11-digit SPL composite id. See {@link decodeDistrictId}. */
  district_id: number;
  city_id: number;
  region_id: number;
  /** Per-city district sequence number (district_id % 1000). */
  local_seq: number;
  name_ar: string;
  name_en: string;
  /** [latitude, longitude], computed centroid. */
  center: LatLon;
  /** [minLon, minLat, maxLon, maxLat]. */
  bbox: LonLatBbox;
}

/** A region with population and boundary polygons (full shape). */
export interface RegionFull extends Region {
  /** Population, or null if unknown upstream. */
  population: number | null;
  /** Polygon rings as [lat, lon] pairs (source order). */
  boundaries: number[][][];
}

/** A district with boundary polygons (full shape). */
export interface DistrictFull extends District {
  /** Polygon rings as [lat, lon] pairs (source order). */
  boundaries: number[][][];
}

/** The decoded parts of an 11-digit composite district_id. */
export interface DistrictIdParts {
  prefix: 1;
  region_id: number;
  city_id: number;
  local_seq: number;
}

/** A GeoJSON Polygon or MultiPolygon geometry, coordinates in [lon, lat]. */
export interface GeoJSONGeometry {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][] | number[][][][];
}

/** A GeoJSON Feature carrying the lite id/name properties. */
export interface GeoJSONFeature {
  type: 'Feature';
  id: number;
  properties: Record<string, unknown>;
  geometry: GeoJSONGeometry;
}

/** A GeoJSON FeatureCollection with a provenance `_generated` sibling. */
export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  _generated?: { source: string; version: string; generatedAt: string };
  features: GeoJSONFeature[];
}

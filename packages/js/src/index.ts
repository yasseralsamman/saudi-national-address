// SPDX-License-Identifier: MIT

export * from './types.js';
export * from './decode.js';
export { regions, cities, districts, regionsGeoJSON, districtsGeoJSON } from './data.js';
export {
  findRegion,
  findCity,
  findDistrict,
  districtsInCity,
  citiesInRegion,
} from './lookup.js';

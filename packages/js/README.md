# saudi-national-address

Open dataset of Saudi Arabia's 13 regions, 4,581 cities, and 3,732 districts, with the
official SPL National Address **11-digit composite `district_id`**. The data is bundled
into the package, so there is no HTTP fetch at runtime. Ships as dual ESM + CJS with
TypeScript types.

## Install

```sh
npm install saudi-national-address
# or: pnpm add saudi-national-address / yarn add saudi-national-address
```

## Usage

### Use the lite data

```ts
import { regions, cities, districts } from 'saudi-national-address';

regions.length;   // 13
cities.length;    // 4581
districts.length; // 3732
```

The named exports use the **lite** records (no boundary polygons). The full GeoJSON
FeatureCollections are available as `regionsGeoJSON` and `districtsGeoJSON`.

### Look up a district by id

```ts
import { findDistrict, districtsInCity, findRegion } from 'saudi-national-address';

findDistrict(10100003001);
// → { district_id: 10100003001, city_id: 3, region_id: 1, local_seq: 1, name_ar: '…', name_en: 'Al Amal Dist.', center: [lat, lon], bbox: [...] }

findRegion(1)?.code;     // 'RD'
districtsInCity(3).length; // districts of city 3
```

### Decode a district id

```ts
import { decodeDistrictId, encodeDistrictId, isValidDistrictId } from 'saudi-national-address';

decodeDistrictId(10100003001); // { prefix: 1, region_id: 1, city_id: 3, local_seq: 1 }
encodeDistrictId(1, 3, 1);     // 10100003001
isValidDistrictId(10100003001); // true
```

## The 11-digit `district_id` format

`district_id` is **not** a flat sequential id — it is an 11-digit composite:

```
Position:  1   2 3   4 5 6 7 8   9 10 11
Group:    [P] [ R R ][ C C C C C ][ N N N ]
```

| Group | Digits | Meaning |
|------:|-------:|---------|
| P     | 1      | Constant prefix, always `1` |
| RR    | 2      | `region_id`, zero-padded to 2 digits |
| CCCCC | 5      | `city_id`, zero-padded to 5 digits |
| NNN   | 3      | per-city district sequence (`local_seq`), zero-padded to 3 digits |

So `local_seq = district_id % 1000`, and the embedded `RR` / `CCCCC` always match the
record's `region_id` / `city_id`.

## Links

- Repository & full data dictionary: <https://github.com/yasseralsamman/saudi-national-address>
  ([`DATA_REFERENCE.md`](https://github.com/yasseralsamman/saudi-national-address/blob/main/DATA_REFERENCE.md))
- PHP package: `yasseralsamman/saudi-national-address` on Packagist

## License

Code: MIT. Bundled data: CC0-1.0.

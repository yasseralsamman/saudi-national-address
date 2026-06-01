# yasseralsamman/saudi-national-address

Open dataset of Saudi Arabia's 13 regions, 4,581 cities, and 3,732 districts, with the
official SPL National Address **11-digit composite `district_id`**. The lite data is
bundled into the package, so there is no HTTP fetch at runtime. Requires PHP 8.1+.

## Install

```sh
composer require yasseralsamman/saudi-national-address
```

## Usage

### Load the data

```php
use SaudiNationalAddress\Dataset;

count(Dataset::regions());   // 13
count(Dataset::cities());    // 4581
count(Dataset::districts()); // 3732
```

`Dataset::regions()`, `cities()`, and `districts()` return arrays keyed by id, of readonly
`Region` / `City` / `District` value objects. They are read from the bundled
`*.lite.json` files on first call and cached in memory.

### Look up a record by id

```php
use SaudiNationalAddress\Dataset;

$region = Dataset::findRegion(1);
$region?->code;            // 'RD'

$district = Dataset::findDistrict(10100003001);
$district?->city_id;       // 3
$district?->local_seq;     // 1
```

### Decode a district id

```php
use SaudiNationalAddress\DistrictId;

DistrictId::decode(10100003001);
// → ['prefix' => 1, 'region_id' => 1, 'city_id' => 3, 'local_seq' => 1]

DistrictId::encode(1, 3, 1);   // 10100003001
DistrictId::isValid(10100003001); // true
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

So `local_seq = $districtId % 1000`, and the embedded `RR` / `CCCCC` always match the
record's `region_id` / `city_id`.

## Links

- Repository & full data dictionary: <https://github.com/yasseralsamman/saudi-national-address>
  ([`DATA_REFERENCE.md`](https://github.com/yasseralsamman/saudi-national-address/blob/main/DATA_REFERENCE.md))
- npm package: `saudi-national-address`

## License

Code: MIT. Bundled data: CC0-1.0.

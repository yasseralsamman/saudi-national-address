<?php

// SPDX-License-Identifier: MIT

declare(strict_types=1);

namespace SaudiNationalAddress;

use RuntimeException;

/**
 * Lazy in-memory loader for the bundled dataset.
 *
 * Both lite and full data are bundled; choose at runtime. The lite accessors
 * (regions/cities/districts) read the small `*.lite.json` files; the full
 * accessors (regionsFull/districtsFull) read the larger `*.full.json` files
 * which add region population and boundary polygons. Each file is read from the
 * package's data directory on first access and cached for the process lifetime.
 */
final class Dataset
{
    /** @var array<int,Region>|null */
    private static ?array $regions = null;
    /** @var array<int,City>|null */
    private static ?array $cities = null;
    /** @var array<int,District>|null */
    private static ?array $districts = null;
    /** @var array<int,RegionFull>|null */
    private static ?array $regionsFull = null;
    /** @var array<int,DistrictFull>|null */
    private static ?array $districtsFull = null;

    /** @return array<int,Region> region_id => Region */
    public static function regions(): array
    {
        if (self::$regions === null) {
            self::$regions = [];
            foreach (self::read('regions.lite.json') as $row) {
                $region = Region::fromArray($row);
                self::$regions[$region->region_id] = $region;
            }
        }

        return self::$regions;
    }

    /** @return array<int,City> city_id => City */
    public static function cities(): array
    {
        if (self::$cities === null) {
            self::$cities = [];
            foreach (self::read('cities.lite.json') as $row) {
                $city = City::fromArray($row);
                self::$cities[$city->city_id] = $city;
            }
        }

        return self::$cities;
    }

    /** @return array<int,District> district_id => District */
    public static function districts(): array
    {
        if (self::$districts === null) {
            self::$districts = [];
            foreach (self::read('districts.lite.json') as $row) {
                $district = District::fromArray($row);
                self::$districts[$district->district_id] = $district;
            }
        }

        return self::$districts;
    }

    /** @return array<int,RegionFull> region_id => RegionFull (with population + boundaries) */
    public static function regionsFull(): array
    {
        if (self::$regionsFull === null) {
            self::$regionsFull = [];
            foreach (self::read('regions.full.json') as $row) {
                $region = RegionFull::fromArray($row);
                self::$regionsFull[$region->region_id] = $region;
            }
        }

        return self::$regionsFull;
    }

    /**
     * Cities have no full/lite difference, so this is the same data as
     * {@see cities()}.
     *
     * @return array<int,City> city_id => City
     */
    public static function citiesFull(): array
    {
        return self::cities();
    }

    /** @return array<int,DistrictFull> district_id => DistrictFull (with boundaries) */
    public static function districtsFull(): array
    {
        if (self::$districtsFull === null) {
            self::$districtsFull = [];
            foreach (self::read('districts.full.json') as $row) {
                $district = DistrictFull::fromArray($row);
                self::$districtsFull[$district->district_id] = $district;
            }
        }

        return self::$districtsFull;
    }

    public static function findRegion(int $id): ?Region
    {
        return self::regions()[$id] ?? null;
    }

    public static function findCity(int $id): ?City
    {
        return self::cities()[$id] ?? null;
    }

    public static function findDistrict(int $id): ?District
    {
        return self::districts()[$id] ?? null;
    }

    public static function findRegionFull(int $id): ?RegionFull
    {
        return self::regionsFull()[$id] ?? null;
    }

    public static function findDistrictFull(int $id): ?DistrictFull
    {
        return self::districtsFull()[$id] ?? null;
    }

    /**
     * Read and JSON-decode one bundled data file.
     *
     * @return array<int,array<string,mixed>>
     */
    private static function read(string $file): array
    {
        $path = __DIR__ . '/../data/' . $file;
        $json = @file_get_contents($path);
        if ($json === false) {
            throw new RuntimeException("Cannot read bundled data file: {$path}");
        }

        /** @var array<int,array<string,mixed>> $decoded */
        $decoded = json_decode($json, true, 512, JSON_THROW_ON_ERROR);

        return $decoded;
    }
}

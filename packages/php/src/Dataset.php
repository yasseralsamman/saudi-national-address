<?php

// SPDX-License-Identifier: MIT

declare(strict_types=1);

namespace SaudiNationalAddress;

use RuntimeException;

/**
 * Lazy in-memory loader for the bundled lite dataset.
 *
 * The three `*.lite.json` files are read from the package's data directory on
 * first access and cached for the lifetime of the process.
 */
final class Dataset
{
    /** @var array<int,Region>|null */
    private static ?array $regions = null;
    /** @var array<int,City>|null */
    private static ?array $cities = null;
    /** @var array<int,District>|null */
    private static ?array $districts = null;

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

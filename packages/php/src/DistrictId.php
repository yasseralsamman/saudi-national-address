<?php

// SPDX-License-Identifier: MIT

declare(strict_types=1);

namespace SaudiNationalAddress;

/**
 * Helpers for the 11-digit composite district_id.
 *
 * Mirrors exactly the math in DATA_REFERENCE.md §3.
 */
final class DistrictId
{
    /**
     * Decode an 11-digit composite district_id into its parts.
     *
     * @return array{prefix:int, region_id:int, city_id:int, local_seq:int}
     */
    public static function decode(int $id): array
    {
        return [
            'prefix' => intdiv($id, 10_000_000_000),
            'region_id' => intdiv($id, 100_000_000) % 100,
            'city_id' => intdiv($id, 1_000) % 100_000,
            'local_seq' => $id % 1_000,
        ];
    }

    /** Build an 11-digit composite district_id from its parts. */
    public static function encode(int $region, int $city, int $seq): int
    {
        return 1 * 10_000_000_000
            + $region * 100_000_000
            + $city * 1_000
            + $seq;
    }

    /**
     * Whether a number is a structurally valid Saudi district_id:
     * prefix 1, region 1..13, a positive city part, and a per-city
     * sequence in 1..999.
     */
    public static function isValid(int $id): bool
    {
        $p = self::decode($id);

        return $p['prefix'] === 1
            && $p['region_id'] >= 1
            && $p['region_id'] <= 13
            && $p['city_id'] >= 1
            && $p['local_seq'] >= 1
            && $p['local_seq'] <= 999;
    }
}

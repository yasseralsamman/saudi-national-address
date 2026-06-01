<?php

// SPDX-License-Identifier: MIT

declare(strict_types=1);

namespace SaudiNationalAddress;

/** A readonly value object for one district (lite shape — no boundaries). */
final class District
{
    /**
     * @param array{0:float,1:float}                 $center [latitude, longitude]
     * @param array{0:float,1:float,2:float,3:float} $bbox   [minLon, minLat, maxLon, maxLat]
     */
    public function __construct(
        public readonly int $district_id,
        public readonly int $city_id,
        public readonly int $region_id,
        public readonly int $local_seq,
        public readonly string $name_ar,
        public readonly string $name_en,
        public readonly array $center,
        public readonly array $bbox,
    ) {
    }

    /** @param array<string,mixed> $row */
    public static function fromArray(array $row): static
    {
        return new self(
            (int) $row['district_id'],
            (int) $row['city_id'],
            (int) $row['region_id'],
            (int) $row['local_seq'],
            (string) $row['name_ar'],
            (string) $row['name_en'],
            $row['center'],
            $row['bbox'],
        );
    }
}

<?php

// SPDX-License-Identifier: MIT

declare(strict_types=1);

namespace SaudiNationalAddress;

/** A readonly value object for one region with population and boundaries (full shape). */
final class RegionFull
{
    /**
     * @param array{0:float,1:float}                 $center     [latitude, longitude]
     * @param array{0:float,1:float,2:float,3:float} $bbox       [minLon, minLat, maxLon, maxLat]
     * @param list<list<array{0:float,1:float}>>     $boundaries polygon rings as [lat, lon] pairs
     */
    public function __construct(
        public readonly int $region_id,
        public readonly string $code,
        public readonly string $name_ar,
        public readonly string $name_en,
        public readonly int $capital_city_id,
        public readonly array $center,
        public readonly array $bbox,
        public readonly ?int $population,
        public readonly array $boundaries,
    ) {
    }

    /** @param array<string,mixed> $row */
    public static function fromArray(array $row): static
    {
        return new self(
            (int) $row['region_id'],
            (string) $row['code'],
            (string) $row['name_ar'],
            (string) $row['name_en'],
            (int) $row['capital_city_id'],
            $row['center'],
            $row['bbox'],
            isset($row['population']) ? (int) $row['population'] : null,
            $row['boundaries'],
        );
    }
}

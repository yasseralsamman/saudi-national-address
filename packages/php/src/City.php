<?php

// SPDX-License-Identifier: MIT

declare(strict_types=1);

namespace SaudiNationalAddress;

/** A readonly value object for one city. */
final class City
{
    /** @param array{0:float,1:float} $center [latitude, longitude] */
    public function __construct(
        public readonly int $city_id,
        public readonly int $region_id,
        public readonly string $name_ar,
        public readonly string $name_en,
        public readonly array $center,
    ) {
    }

    /** @param array<string,mixed> $row */
    public static function fromArray(array $row): static
    {
        return new self(
            (int) $row['city_id'],
            (int) $row['region_id'],
            (string) $row['name_ar'],
            (string) $row['name_en'],
            $row['center'],
        );
    }
}

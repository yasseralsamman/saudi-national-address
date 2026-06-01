<?php

// SPDX-License-Identifier: MIT

declare(strict_types=1);

namespace SaudiNationalAddress\Tests;

use PHPUnit\Framework\TestCase;
use SaudiNationalAddress\Dataset;
use SaudiNationalAddress\DistrictId;

final class DistrictIdTest extends TestCase
{
    /** The five verified samples from DATA_REFERENCE.md §3 / README. */
    public static function samples(): array
    {
        return [
            [10100003001, 1, 3, 1],
            [10101351033, 1, 1351, 33],
            [10103158001, 1, 3158, 1],
            [10400011038, 4, 11, 38],
            [10502167006, 5, 2167, 6],
        ];
    }

    /** @dataProvider samples */
    public function testDecode(int $id, int $region, int $city, int $seq): void
    {
        $this->assertSame(
            ['prefix' => 1, 'region_id' => $region, 'city_id' => $city, 'local_seq' => $seq],
            DistrictId::decode($id),
        );
    }

    /** @dataProvider samples */
    public function testEncode(int $id, int $region, int $city, int $seq): void
    {
        $this->assertSame($id, DistrictId::encode($region, $city, $seq));
    }

    public function testRoundTripOverWholeDataset(): void
    {
        foreach (Dataset::districts() as $district) {
            $parts = DistrictId::decode($district->district_id);
            $this->assertSame(1, $parts['prefix']);
            $this->assertSame($district->region_id, $parts['region_id']);
            $this->assertSame($district->city_id, $parts['city_id']);
            $this->assertSame($district->local_seq, $parts['local_seq']);
            $this->assertSame(
                $district->district_id,
                DistrictId::encode($parts['region_id'], $parts['city_id'], $parts['local_seq']),
            );
            $this->assertTrue(DistrictId::isValid($district->district_id));
        }
    }

    public function testRejectsMalformedIds(): void
    {
        $this->assertFalse(DistrictId::isValid(123));
        $this->assertFalse(DistrictId::isValid(20100003001)); // prefix 2
    }
}

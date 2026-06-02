<?php

// SPDX-License-Identifier: MIT

declare(strict_types=1);

namespace SaudiNationalAddress\Tests;

use PHPUnit\Framework\TestCase;
use SaudiNationalAddress\Dataset;

final class DatasetTest extends TestCase
{
    public function testCounts(): void
    {
        $this->assertCount(13, Dataset::regions());
        $this->assertCount(4581, Dataset::cities());
        $this->assertCount(3732, Dataset::districts());
    }

    public function testLookupByIdReturnsExpectedRecord(): void
    {
        $region = Dataset::findRegion(1);
        $this->assertNotNull($region);
        $this->assertSame('RD', $region->code);

        $district = Dataset::findDistrict(10100003001);
        $this->assertNotNull($district);
        $this->assertSame(3, $district->city_id);
        $this->assertSame(1, $district->region_id);
        $this->assertSame(1, $district->local_seq);

        $this->assertNull(Dataset::findDistrict(99999999999));
    }

    public function testReferentialIntegrity(): void
    {
        $regions = Dataset::regions();
        $cities = Dataset::cities();

        // Every city points to a known region.
        foreach ($cities as $city) {
            $this->assertArrayHasKey($city->region_id, $regions);
        }

        // Every region's capital city exists and belongs to that region.
        foreach ($regions as $region) {
            $this->assertArrayHasKey($region->capital_city_id, $cities);
            $this->assertSame($region->region_id, $cities[$region->capital_city_id]->region_id);
        }

        // Every district points to a known city and region that agree.
        foreach (Dataset::districts() as $district) {
            $this->assertArrayHasKey($district->city_id, $cities);
            $this->assertArrayHasKey($district->region_id, $regions);
            $this->assertSame($district->region_id, $cities[$district->city_id]->region_id);
        }
    }

    public function testFullData(): void
    {
        $this->assertCount(13, Dataset::regionsFull());
        $this->assertCount(4581, Dataset::citiesFull());
        $this->assertCount(3732, Dataset::districtsFull());

        $region = Dataset::findRegionFull(1);
        $this->assertNotNull($region);
        $this->assertSame('RD', $region->code);
        $this->assertIsInt($region->population);
        $this->assertNotEmpty($region->boundaries);

        $district = Dataset::findDistrictFull(10100003001);
        $this->assertNotNull($district);
        $this->assertSame(3, $district->city_id);
        $this->assertNotEmpty($district->boundaries);
        $this->assertGreaterThanOrEqual(4, count($district->boundaries[0]));
    }
}

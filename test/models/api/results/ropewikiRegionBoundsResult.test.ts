import { describe, it, expect } from '@jest/globals';
import { Bounds } from '../../../../src/models/minimap/bounds';
import { RopewikiRegionBoundsResult } from '../../../../src/models/api/results/ropewikiRegionBoundsResult';
import { ResultType } from '../../../../src/models/api/results/result';

describe('RopewikiRegionBoundsResult', () => {
    it('constructs with Bounds and resultType', () => {
        const b = new Bounds(41, 40, -110, -112);
        const r = new RopewikiRegionBoundsResult(b);
        expect(r.result).toBe(b);
        expect(r.resultType).toBe(ResultType.RopewikiRegionBounds);
    });

    it('fromResult parses bounds object', () => {
        const r = RopewikiRegionBoundsResult.fromResult({
            north: 41,
            south: 40,
            east: -110,
            west: -112,
        });
        expect(r.result.north).toBe(41);
        expect(r.result.south).toBe(40);
    });
});

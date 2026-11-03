import { describe, it, expect } from '@jest/globals';
import {
    TRIP_REPORT_BLOCK_TYPES,
    TripReportBlock,
    TripReportBlockType,
    TripReportMapBlock,
    TripReportTextBlock,
} from '../../../../src/models';

describe('TripReportBlock.fromResult', () => {
    it('dispatches to the concrete block by blockType', () => {
        const text = TripReportTextBlock.createEmpty().withHeader('Notes');
        const map = TripReportMapBlock.createEmpty().withWaypointAppendedToActive([-109.5, 38.5]);
        const parsedText = TripReportBlock.fromResult(JSON.parse(JSON.stringify(text.toJSON())));
        const parsedMap = TripReportBlock.fromResult(JSON.parse(JSON.stringify(map.toJSON())));
        expect(parsedText).toBeInstanceOf(TripReportTextBlock);
        expect(parsedText).toEqual(text);
        expect(parsedMap).toBeInstanceOf(TripReportMapBlock);
        expect(parsedMap.toJSON()).toEqual(map.toJSON());
    });

    it('rejects non-objects and unknown block types', () => {
        expect(() => TripReportBlock.fromResult(null)).toThrow('TripReportBlock result must be an object');
        expect(() => TripReportBlock.fromResult({ blockType: 'video', id: 'v1' })).toThrow(
            'TripReportBlock.blockType must be one of [text, map]',
        );
        expect(() => TripReportBlock.fromResult({ id: 'v1' })).toThrow('TripReportBlock.blockType must be one of');
    });

    it('lists every block type', () => {
        expect([...TRIP_REPORT_BLOCK_TYPES].sort()).toEqual(Object.values(TripReportBlockType).sort());
    });
});

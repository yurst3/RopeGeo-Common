import { describe, it, expect } from '@jest/globals';
import {
    RopewikiRegionView,
    type RopewikiRegionViewRow,
} from '../../../../src/types/api/getRopewikiRegionView/ropewikiRegionView';

function baseRow(overrides: Partial<RopewikiRegionViewRow> = {}): RopewikiRegionViewRow {
    return {
        name: 'North America',
        latestRevisionDate: new Date('2024-01-15T12:00:00Z'),
        url: 'https://ropewiki.com/North_America',
        ...overrides,
    };
}

describe('RopewikiRegionView', () => {
    describe('constructor', () => {
        it('maps row fields to view properties', () => {
            const row = baseRow({
                overview: 'Overview text',
                bestMonths: ['May', 'June'],
                isMajorRegion: true,
            });
            const view = new RopewikiRegionView(row);
            expect(view.name).toBe('North America');
            expect(view.overview).toBe('Overview text');
            expect(view.bestMonths).toEqual(['May', 'June']);
            expect(view.isMajorRegion).toBe(true);
            expect(view.latestRevisionDate).toEqual(new Date('2024-01-15T12:00:00Z'));
            expect(view.externalLink).toBe('https://ropewiki.com/North_America');
        });

        it('defaults regionCount, topLevelPageCount, and pageCount to 0 when missing', () => {
            const row = baseRow();
            const view = new RopewikiRegionView(row);
            expect(view.regionCount).toBe(0);
            expect(view.topLevelPageCount).toBe(0);
            expect(view.pageCount).toBe(0);
        });

        it('defaults regionCount, topLevelPageCount, and pageCount to 0 when null', () => {
            const row = baseRow({
                rawPageCount: null,
                truePageCount: null,
                trueRegionCount: null,
            });
            const view = new RopewikiRegionView(row);
            expect(view.regionCount).toBe(0);
            expect(view.topLevelPageCount).toBe(0);
            expect(view.pageCount).toBe(0);
        });

        it('maps rawPageCount to pageCount', () => {
            const view = new RopewikiRegionView(baseRow({ rawPageCount: 42 }));
            expect(view.pageCount).toBe(42);
        });

        it('maps trueRegionCount to regionCount', () => {
            const view = new RopewikiRegionView(baseRow({ trueRegionCount: 5 }));
            expect(view.regionCount).toBe(5);
        });

        it('maps truePageCount to topLevelPageCount', () => {
            const view = new RopewikiRegionView(baseRow({ truePageCount: 10 }));
            expect(view.topLevelPageCount).toBe(10);
        });

        it('sets parentRegion to null when parentRegionId or parentRegionName is missing', () => {
            expect(new RopewikiRegionView(baseRow()).parentRegion).toBeNull();
            expect(
                new RopewikiRegionView(baseRow({ parentRegionId: 'pid-1' })).parentRegion,
            ).toBeNull();
            expect(
                new RopewikiRegionView(baseRow({ parentRegionName: 'Parent' })).parentRegion,
            ).toBeNull();
        });

        it('sets parentRegion when both parentRegionId and parentRegionName are present', () => {
            const view = new RopewikiRegionView(
                baseRow({
                    parentRegionId: 'parent-uuid',
                    parentRegionName: 'World',
                }),
            );
            expect(view.parentRegion).toEqual({ id: 'parent-uuid', name: 'World' });
        });

        it('defaults overview to null when missing', () => {
            const view = new RopewikiRegionView(baseRow());
            expect(view.overview).toBeNull();
        });

        it('defaults bestMonths to empty array when missing or not an array', () => {
            expect(new RopewikiRegionView(baseRow()).bestMonths).toEqual([]);
            expect(new RopewikiRegionView(baseRow({ bestMonths: null })).bestMonths).toEqual([]);
        });

        it('defaults isMajorRegion to false when missing or null', () => {
            expect(new RopewikiRegionView(baseRow()).isMajorRegion).toBe(false);
            expect(new RopewikiRegionView(baseRow({ isMajorRegion: null })).isMajorRegion).toBe(
                false,
            );
        });

        it('normalizes latestRevisionDate to a Date instance', () => {
            const date = new Date('2023-06-01T00:00:00Z');
            const view = new RopewikiRegionView(baseRow({ latestRevisionDate: date }));
            expect(view.latestRevisionDate).toBeInstanceOf(Date);
            expect(view.latestRevisionDate.getTime()).toBe(date.getTime());
        });
    });
});

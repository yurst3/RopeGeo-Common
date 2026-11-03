import { describe, it, expect, jest } from '@jest/globals';
import {
    TripReport,
    TripReportDates,
    TripReportDraft,
    TripReportMapBlock,
    TripReportTextBlock,
} from '../../../src/models';

const AUTHOR = { name: 'Ethan', badgeRank: 'gold' as const, badgeIcon: 'tripReport' as const };

function sampleReport(): TripReport {
    return TripReport.createDraft(AUTHOR, new Date(2026, 9, 5, 15, 30))
        .withTitle('Canyon day')
        .withDates(new TripReportDates(new Date(2026, 9, 5), new Date(2026, 9, 7)))
        .withBlockAdded(TripReportTextBlock.createEmpty().withHeader('Approach').withBody('Hot.'))
        .withBlockAdded(
            TripReportMapBlock.createEmpty().withWaypointAppendedToActive([-109.5, 38.5], 'white'),
        );
}

describe('TripReport JSON', () => {
    it('round-trips through a JSON string', () => {
        const report = sampleReport();
        const json = JSON.parse(JSON.stringify(report.toJSON()));
        const restored = TripReport.fromJSON(json);
        expect(restored.toJSON()).toEqual(report.toJSON());
        expect(restored.blocks[0]).toBeInstanceOf(TripReportTextBlock);
        expect(restored.blocks[1]).toBeInstanceOf(TripReportMapBlock);
        expect(restored.userAvatar[0].badgeRank).toBe('gold');
    });

    it('stores dates as local calendar days', () => {
        const json = sampleReport().toJSON();
        expect(json.dates).toEqual({ start: '2026-10-05', end: '2026-10-07' });
        const restored = TripReport.fromJSON(json);
        expect(restored.dates.startDate.getDate()).toBe(5);
        expect(restored.dates.endDate?.getDate()).toBe(7);
    });

    it('drops malformed blocks instead of failing the report', () => {
        const json = sampleReport().toJSON();
        const broken = { ...json, blocks: [...json.blocks, { blockType: 'video', id: 'x' }] };
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const restored = TripReport.fromJSON(broken as typeof json);
        warn.mockRestore();
        expect(restored.blocks).toHaveLength(2);
    });
});

describe('TripReport validation', () => {
    it('flags a blank title and saves titles trimmed', () => {
        const report = sampleReport();
        expect(report.isValid).toBe(true);
        expect(report.withTitle('   ').validationErrors).toEqual(['emptyTitle']);
        expect(report.withTitle('  Canyon day ').toJSON().title).toBe('Canyon day');
    });
});

describe('TripReportDraft', () => {
    it('summarizes a report and round-trips', () => {
        const report = sampleReport();
        const draft = TripReportDraft.fromTripReport(report, new Date('2026-10-08T12:00:00Z'));
        const restored = TripReportDraft.fromJSON(JSON.parse(JSON.stringify(draft.toJSON())));
        expect(restored.id).toBe(report.id);
        expect(restored.title).toBe('Canyon day');
        expect(restored.dates.isMultipleDays).toBe(true);
        expect(restored.updatedAt.toISOString()).toBe('2026-10-08T12:00:00.000Z');
    });
});

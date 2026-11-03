import { describe, it, expect } from '@jest/globals';
import { TripReportBlock, TripReportBlockType, TripReportTextBlock } from '../../../../src/models';

describe('TripReportTextBlock', () => {
    it('is a TripReportBlock with the text block type', () => {
        const block = TripReportTextBlock.createEmpty();
        expect(block).toBeInstanceOf(TripReportBlock);
        expect(block.blockType).toBe(TripReportBlockType.Text);
        expect(block.id).toMatch(/^text-/);
    });

    it('round-trips through JSON', () => {
        const block = TripReportTextBlock.createEmpty().withHeader('Approach').withBody('Hot and dry.');
        const json = JSON.parse(JSON.stringify(block.toJSON()));
        expect(json).toEqual({ blockType: 'text', id: block.id, header: 'Approach', body: 'Hot and dry.' });
        expect(TripReportTextBlock.fromResult(json)).toEqual(block);
    });

    it('reads a missing header or body as empty text', () => {
        const block = TripReportTextBlock.fromResult({ blockType: 'text', id: 't1' });
        expect(block.header).toBe('');
        expect(block.body).toBe('');
    });

    it('rejects invalid payloads', () => {
        expect(() => TripReportTextBlock.fromResult({ blockType: 'text', id: '' })).toThrow(
            'TripReportTextBlock.id must be a non-empty string',
        );
        expect(() => TripReportTextBlock.fromResult({ blockType: 'text', id: 't1', body: 3 })).toThrow(
            'TripReportTextBlock.body must be a string',
        );
        expect(() => TripReportTextBlock.fromResult({ blockType: 'map', id: 't1' })).toThrow(
            'TripReportTextBlock.blockType must be "text"',
        );
    });
});

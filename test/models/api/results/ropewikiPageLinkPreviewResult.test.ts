import { describe, it, expect } from '@jest/globals';
import { RopewikiPageLinkPreviewResult } from '../../../../src/models/api/results/ropewikiPageLinkPreviewResult';
import { LinkPreview } from '../../../../src/models/linkPreview/linkPreview';
import { ResultType } from '../../../../src/models/api/results/result';

function validLinkPreviewResult(): Record<string, unknown> {
    return {
        title: 'Page AKA B',
        description: '3A II, 2 rappels (50ft max)',
        image: {
            url: 'https://example.com/i.avif',
            height: '200',
            width: '400',
            type: 'image/avif',
            alt: 'Page AKA B',
        },
        siteName: 'RopeGeo',
        type: 'website',
    };
}

describe('RopewikiPageLinkPreviewResult', () => {
    describe('constructor', () => {
        it('sets result and resultType', () => {
            const inner = new LinkPreview('t', 'd', null, 'RopeGeo', 'website');
            const r = new RopewikiPageLinkPreviewResult(inner);
            expect(r.result).toBe(inner);
            expect(r.resultType).toBe(ResultType.RopewikiPageLinkPreview);
        });
    });

    describe('fromResult', () => {
        it('parses valid result', () => {
            const parsed = RopewikiPageLinkPreviewResult.fromResult(validLinkPreviewResult());
            expect(parsed).toBeInstanceOf(RopewikiPageLinkPreviewResult);
            expect(parsed.resultType).toBe(ResultType.RopewikiPageLinkPreview);
            expect(parsed.result).toBeInstanceOf(LinkPreview);
            expect(parsed.result.title).toBe('Page AKA B');
            expect(parsed.result.image).not.toBeNull();
            expect(parsed.result.image?.url).toBe('https://example.com/i.avif');
        });

        it('throws when inner result is invalid', () => {
            expect(() => RopewikiPageLinkPreviewResult.fromResult(null)).toThrow(
                'LinkPreview result must be a non-array object',
            );
        });
    });
});

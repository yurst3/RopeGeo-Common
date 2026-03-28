import { describe, it, expect } from '@jest/globals';
import { LinkPreview } from '../../../src/types/linkPreview/linkPreview';
import { LinkPreviewImage } from '../../../src/types/linkPreview/linkPreviewImage';

function validImage(): Record<string, unknown> {
    return {
        url: 'https://cdn.example.com/b.avif',
        height: '300',
        width: '600',
        type: 'image/avif',
        alt: 'Title here',
    };
}

function validLinkPreview(image: Record<string, unknown> | null): Record<string, unknown> {
    return {
        title: 'Cassidy Canyon AKA Cassidy Arch, Cassidy',
        description: '3A II PG13, 5 rappels (135ft max)',
        image,
        siteName: 'RopeGeo',
        type: 'website',
    };
}

describe('LinkPreview', () => {
    describe('constructor', () => {
        it('sets all properties', () => {
            const img = new LinkPreviewImage('u', '1', '2', 't', 'a');
            const lp = new LinkPreview('t', 'd', img, 'RopeGeo', 'website');
            expect(lp.title).toBe('t');
            expect(lp.description).toBe('d');
            expect(lp.image).toBe(img);
            expect(lp.siteName).toBe('RopeGeo');
            expect(lp.type).toBe('website');
        });

        it('allows null image', () => {
            const lp = new LinkPreview('t', 'd', null, 'RopeGeo', 'website');
            expect(lp.image).toBeNull();
        });
    });

    describe('fromResult', () => {
        it('parses with nested image', () => {
            const lp = LinkPreview.fromResult(validLinkPreview(validImage()));
            expect(lp).toBeInstanceOf(LinkPreview);
            expect(lp.image).toBeInstanceOf(LinkPreviewImage);
            expect(lp.title).toBe('Cassidy Canyon AKA Cassidy Arch, Cassidy');
            expect(lp.description).toBe('3A II PG13, 5 rappels (135ft max)');
            expect(lp.siteName).toBe('RopeGeo');
            expect(lp.type).toBe('website');
        });

        it('parses with null image', () => {
            const lp = LinkPreview.fromResult(validLinkPreview(null));
            expect(lp.image).toBeNull();
        });

        it('throws when result is null', () => {
            expect(() => LinkPreview.fromResult(null)).toThrow(
                'LinkPreview result must be a non-array object',
            );
        });

        it('throws when result is not an object', () => {
            expect(() => LinkPreview.fromResult([])).toThrow(
                'LinkPreview result must be a non-array object',
            );
        });

        it('throws when title is missing or not a string', () => {
            expect(() =>
                LinkPreview.fromResult({ ...validLinkPreview(null), title: 1 }),
            ).toThrow('LinkPreview.title must be a string');
            expect(() => {
                const { title: _t, ...rest } = validLinkPreview(null);
                return LinkPreview.fromResult(rest);
            }).toThrow('LinkPreview.title is required');
        });

        it('throws when image key is missing', () => {
            const { image: _i, ...rest } = validLinkPreview(null);
            expect(() => LinkPreview.fromResult(rest)).toThrow(
                'LinkPreview.image is required',
            );
        });

        it('throws when image is undefined', () => {
            expect(() =>
                LinkPreview.fromResult({ ...validLinkPreview(null), image: undefined }),
            ).toThrow('LinkPreview.image must be null or an object');
        });

        it('throws when nested image is invalid', () => {
            expect(() =>
                LinkPreview.fromResult({
                    ...validLinkPreview({ url: 'x' } as Record<string, unknown>),
                }),
            ).toThrow(/LinkPreviewImage/);
        });
    });
});

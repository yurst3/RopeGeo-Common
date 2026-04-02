import { describe, it, expect } from '@jest/globals';
import { LinkPreviewImage } from '../../../src/classes/linkPreview/linkPreviewImage';

function validImage(): Record<string, unknown> {
    return {
        url: 'https://cdn.example.com/banner.avif',
        height: '400',
        width: '800',
        type: 'image/avif',
        alt: 'Cassidy Canyon AKA Cassidy Arch, Cassidy',
    };
}

describe('LinkPreviewImage', () => {
    describe('constructor', () => {
        it('sets all properties', () => {
            const img = new LinkPreviewImage(
                'https://x/y.avif',
                '100',
                '200',
                'image/avif',
                'alt text',
            );
            expect(img.url).toBe('https://x/y.avif');
            expect(img.height).toBe('100');
            expect(img.width).toBe('200');
            expect(img.type).toBe('image/avif');
            expect(img.alt).toBe('alt text');
        });
    });

    describe('fromResult', () => {
        it('returns instance with validated string fields', () => {
            const img = LinkPreviewImage.fromResult(validImage());
            expect(img).toBeInstanceOf(LinkPreviewImage);
            expect(img.url).toBe('https://cdn.example.com/banner.avif');
            expect(img.height).toBe('400');
            expect(img.width).toBe('800');
            expect(img.type).toBe('image/avif');
            expect(img.alt).toContain('Cassidy');
        });

        it('accepts empty strings for dimensions', () => {
            const img = LinkPreviewImage.fromResult({
                ...validImage(),
                height: '',
                width: '',
            });
            expect(img.height).toBe('');
            expect(img.width).toBe('');
        });

        it('accepts any non-empty type string without validating mime', () => {
            const img = LinkPreviewImage.fromResult({
                ...validImage(),
                type: 'image/png',
            });
            expect(img.type).toBe('image/png');
        });

        it('throws when result is null', () => {
            expect(() => LinkPreviewImage.fromResult(null)).toThrow(
                'LinkPreviewImage result must be a non-array object',
            );
        });

        it('throws when result is not an object', () => {
            expect(() => LinkPreviewImage.fromResult('x')).toThrow(
                'LinkPreviewImage result must be a non-array object',
            );
            expect(() => LinkPreviewImage.fromResult(1)).toThrow(
                'LinkPreviewImage result must be a non-array object',
            );
        });

        it('throws when result is an array', () => {
            expect(() => LinkPreviewImage.fromResult([])).toThrow(
                'LinkPreviewImage result must be a non-array object',
            );
        });

        it('throws when a required field is missing', () => {
            expect(() =>
                LinkPreviewImage.fromResult({ ...validImage(), url: undefined }),
            ).toThrow('LinkPreviewImage.url must be a string');
            expect(() => {
                const { url: _u, ...rest } = validImage();
                return LinkPreviewImage.fromResult(rest);
            }).toThrow('LinkPreviewImage.url is required');
        });

        it('throws when a field is not a string', () => {
            expect(() =>
                LinkPreviewImage.fromResult({ ...validImage(), url: 123 }),
            ).toThrow('LinkPreviewImage.url must be a string');
            expect(() =>
                LinkPreviewImage.fromResult({ ...validImage(), type: true }),
            ).toThrow('LinkPreviewImage.type must be a string');
        });
    });
});

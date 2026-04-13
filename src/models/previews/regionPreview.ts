import { PageDataSource } from '../pageDataSource';
import { Preview, PreviewType, registerPreviewParser } from './preview';

export class RegionPreview extends Preview {
    readonly previewType = PreviewType.Region;
    id: string;
    name: string;
    parents: string[];
    pageCount: number;
    regionCount: number;
    imageUrl: string | null;
    source: PageDataSource;

    constructor(
        id: string,
        name: string,
        parents: string[],
        pageCount: number,
        regionCount: number,
        imageUrl: string | null,
        source: PageDataSource,
    ) {
        super();
        this.id = id;
        this.name = name;
        this.parents = parents;
        this.pageCount = pageCount;
        this.regionCount = regionCount;
        this.imageUrl = imageUrl;
        this.source = source;
    }

    /**
     * Validates result has region preview fields and applies RegionPreview.prototype.
     */
    static fromResult(result: unknown): RegionPreview {
        if (result == null || typeof result !== 'object') {
            throw new Error('RegionPreview result must be an object');
        }
        const r = result as Record<string, unknown>;
        RegionPreview.assertString(r, 'id');
        RegionPreview.assertString(r, 'name');
        RegionPreview.assertStringArray(r, 'parents');
        RegionPreview.assertNumber(r, 'pageCount');
        RegionPreview.assertNumber(r, 'regionCount');
        RegionPreview.assertNullableString(r, 'imageUrl');
        RegionPreview.assertSource(r, 'source');
        Object.setPrototypeOf(r, RegionPreview.prototype);
        return r as unknown as RegionPreview;
    }

    private static assertString(obj: Record<string, unknown>, key: string): void {
        const v = obj[key];
        if (typeof v !== 'string') {
            throw new Error(`RegionPreview.${key} must be a string, got: ${typeof v}`);
        }
    }

    private static assertNullableString(obj: Record<string, unknown>, key: string): void {
        const v = obj[key];
        if (v !== null && v !== undefined && typeof v !== 'string') {
            throw new Error(`RegionPreview.${key} must be string or null, got: ${typeof v}`);
        }
    }

    private static assertNumber(obj: Record<string, unknown>, key: string): void {
        const v = obj[key];
        if (typeof v !== 'number' || Number.isNaN(v)) {
            throw new Error(`RegionPreview.${key} must be a number, got: ${typeof v}`);
        }
    }

    private static assertStringArray(obj: Record<string, unknown>, key: string): void {
        const v = obj[key];
        if (!Array.isArray(v)) {
            throw new Error(`RegionPreview.${key} must be an array, got: ${typeof v}`);
        }
        for (let i = 0; i < v.length; i++) {
            if (typeof v[i] !== 'string') {
                throw new Error(`RegionPreview.${key}[${i}] must be a string`);
            }
        }
    }

    private static assertSource(obj: Record<string, unknown>, key: string): void {
        const v = obj[key];
        if (v !== PageDataSource.Ropewiki) {
            throw new Error(
                `RegionPreview.${key} must be PageDataSource, got: ${JSON.stringify(v)}`,
            );
        }
    }
}

registerPreviewParser(PreviewType.Region, (result) => RegionPreview.fromResult(result));

import { PageDataSource } from '../pageDataSource';
import {
    SearchParams,
    type SearchOrder,
    type SearchParamsPosition,
} from '../requestParams/searchParams';
import './registerDifficultyFilterOptionsParsers';
import { DifficultyFilterOptions } from './difficultyFilterOptions';

/**
 * Mobile search filter persisted in {@link SavedFilters}. Defaults depend on name + location
 * when constructed for a fresh slot; hydrated instances keep stored values.
 */
export class SearchFilter {
    order: SearchOrder;
    includePages: boolean;
    includeRegions: boolean;
    includeAka: boolean;
    similarityThreshold: number;
    currentPosition: SearchParamsPosition | null;
    /** Null or empty = all sources */
    source: PageDataSource[] | null;
    difficultyOptions: DifficultyFilterOptions | null;

    constructor(
        currentPosition: SearchParamsPosition | null | undefined = null,
        name: string | null | undefined = null,
    ) {
        const nameEmpty =
            name === null ||
            name === undefined ||
            name.trim() === '';
        const hasPos =
            currentPosition != null &&
            typeof currentPosition.lat === 'number' &&
            typeof currentPosition.lon === 'number' &&
            !Number.isNaN(currentPosition.lat) &&
            !Number.isNaN(currentPosition.lon);

        if (!nameEmpty) {
            this.order = 'similarity';
            this.includePages = true;
            this.includeRegions = true;
            this.includeAka = true;
        } else if (hasPos) {
            this.order = 'distance';
            this.includePages = true;
            this.includeRegions = false;
            this.includeAka = false;
        } else {
            this.order = 'quality';
            this.includePages = true;
            this.includeRegions = true;
            this.includeAka = true;
        }

        this.similarityThreshold = 0.5;
        this.currentPosition = hasPos
            ? { lat: currentPosition!.lat, lon: currentPosition!.lon }
            : null;
        this.source = null;
        this.difficultyOptions = null;
    }

    setOrder(order: SearchOrder): void {
        this.order = order;
    }

    setIncludePages(v: boolean): void {
        if (!v && this.difficultyOptions != null) {
            throw new Error(
                'Cannot set include-pages false while difficulty filter is set; clear difficulty first',
            );
        }
        this.includePages = v;
    }

    setIncludeRegions(v: boolean): void {
        this.includeRegions = v;
    }

    setIncludeAka(v: boolean): void {
        this.includeAka = v;
    }

    setSimilarityThreshold(v: number): void {
        if (typeof v !== 'number' || Number.isNaN(v) || v < 0 || v > 1) {
            throw new Error('similarityThreshold must be between 0 and 1');
        }
        this.similarityThreshold = v;
    }

    setCurrentPosition(pos: SearchParamsPosition | null): void {
        this.currentPosition = pos;
    }

    setSource(source: PageDataSource[] | null): void {
        this.source =
            source == null || source.length === 0 ? null : [...source];
    }

    setDifficultyOptions(opts: DifficultyFilterOptions | null): void {
        this.difficultyOptions = opts;
        if (opts != null) {
            this.includePages = true;
        }
    }

    toSearchParams(options: {
        name: string;
        limit: number;
        cursorEncoded?: string;
    }): SearchParams {
        const nameNorm = options.name.trim();
        const diff =
            this.difficultyOptions !== null
                ? this.difficultyOptions.toDifficultyParams()
                : null;
        return new SearchParams(
            nameNorm,
            this.similarityThreshold,
            this.includePages,
            this.includeRegions,
            this.includeAka,
            this.order,
            options.limit,
            options.cursorEncoded,
            this.currentPosition,
            this.source,
            diff != null && diff.isActive() ? diff : null,
        );
    }

    toJSON(): Record<string, unknown> {
        return {
            order: this.order,
            includePages: this.includePages,
            includeRegions: this.includeRegions,
            includeAka: this.includeAka,
            similarityThreshold: this.similarityThreshold,
            currentPosition: this.currentPosition,
            source: this.source,
            difficultyOptions:
                this.difficultyOptions !== null
                    ? this.difficultyOptions.toJSON()
                    : null,
        };
    }

    toString(): string {
        return JSON.stringify(this.toJSON());
    }

    static fromJsonString(json: string): SearchFilter {
        let parsed: unknown;
        try {
            parsed = JSON.parse(json);
        } catch (e) {
            throw new Error(
                `SearchFilter.fromJsonString: invalid JSON: ${e instanceof Error ? e.message : String(e)}`,
            );
        }
        return SearchFilter.fromJSON(parsed);
    }

    static fromJSON(parsed: unknown): SearchFilter {
        if (parsed == null || typeof parsed !== 'object') {
            throw new Error('SearchFilter must be a JSON object');
        }
        const o = parsed as Record<string, unknown>;
        const f = new SearchFilter(null, null);
        f.order = SearchFilter.parseOrder(o.order);
        f.includePages = Boolean(o.includePages);
        f.includeRegions = Boolean(o.includeRegions);
        f.includeAka = Boolean(o.includeAka);
        f.similarityThreshold = Number(o.similarityThreshold);
        if (
            typeof f.similarityThreshold !== 'number' ||
            Number.isNaN(f.similarityThreshold)
        ) {
            f.similarityThreshold = 0.5;
        }
        f.currentPosition = SearchFilter.parsePosition(o.currentPosition);
        f.source = SearchFilter.parseSource(o.source);
        if (o.difficultyOptions != null && typeof o.difficultyOptions === 'object') {
            f.difficultyOptions = DifficultyFilterOptions.fromResult(o.difficultyOptions);
        } else {
            f.difficultyOptions = null;
        }
        return f;
    }

    private static parseOrder(v: unknown): SearchOrder {
        if (v === 'similarity' || v === 'quality' || v === 'distance') {
            return v;
        }
        throw new Error(`Invalid SearchFilter.order: ${JSON.stringify(v)}`);
    }

    private static parsePosition(v: unknown): SearchParamsPosition | null {
        if (v === null || v === undefined) return null;
        if (typeof v !== 'object') {
            throw new Error('SearchFilter.currentPosition must be an object or null');
        }
        const p = v as Record<string, unknown>;
        const lat = Number(p.lat);
        const lon = Number(p.lon);
        if (Number.isNaN(lat) || Number.isNaN(lon)) {
            return null;
        }
        return { lat, lon };
    }

    private static parseSource(v: unknown): PageDataSource[] | null {
        if (v === null || v === undefined) return null;
        if (!Array.isArray(v)) {
            throw new Error('SearchFilter.source must be array or null');
        }
        const out: PageDataSource[] = [];
        for (const item of v) {
            if (typeof item !== 'string') {
                throw new Error('SearchFilter.source entries must be strings');
            }
            if (!Object.values(PageDataSource).includes(item as PageDataSource)) {
                throw new Error(`Invalid PageDataSource: ${JSON.stringify(item)}`);
            }
            if (!out.includes(item as PageDataSource)) {
                out.push(item as PageDataSource);
            }
        }
        return out.length === 0 ? null : out;
    }
}

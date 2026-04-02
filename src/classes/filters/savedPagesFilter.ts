import './registerDifficultyFilterOptionsParsers';
import { DifficultyFilterOptions } from './difficultyFilterOptions';

export type SavedPagesOrder = 'newest' | 'oldest';

/**
 * Client-side filter for saved pages list (no `/search` API).
 */
export class SavedPagesFilter {
    name: string | null;
    includeAka: boolean;
    order: SavedPagesOrder;
    difficultyOptions: DifficultyFilterOptions | null;

    constructor(
        name: string | null = null,
        includeAka = true,
        order: SavedPagesOrder = 'newest',
        difficultyOptions: DifficultyFilterOptions | null = null,
    ) {
        this.name = name;
        this.includeAka = includeAka;
        this.order = order;
        this.difficultyOptions = difficultyOptions;
    }

    static defaultFilter(): SavedPagesFilter {
        return new SavedPagesFilter(null, true, 'newest', null);
    }

    setName(v: string | null): void {
        this.name =
            v === null || v === undefined || v.trim() === '' ? null : v.trim();
    }

    setIncludeAka(v: boolean): void {
        this.includeAka = v;
    }

    setOrder(v: SavedPagesOrder): void {
        this.order = v;
    }

    setDifficultyOptions(opts: DifficultyFilterOptions | null): void {
        this.difficultyOptions = opts;
    }

    toJSON(): Record<string, unknown> {
        return {
            name: this.name,
            includeAka: this.includeAka,
            order: this.order,
            difficultyOptions:
                this.difficultyOptions !== null
                    ? this.difficultyOptions.toJSON()
                    : null,
        };
    }

    toString(): string {
        return JSON.stringify(this.toJSON());
    }

    static fromJsonString(json: string): SavedPagesFilter {
        let parsed: unknown;
        try {
            parsed = JSON.parse(json);
        } catch (e) {
            throw new Error(
                `SavedPagesFilter.fromJsonString: invalid JSON: ${e instanceof Error ? e.message : String(e)}`,
            );
        }
        return SavedPagesFilter.fromJSON(parsed);
    }

    static fromJSON(parsed: unknown): SavedPagesFilter {
        if (parsed == null || typeof parsed !== 'object') {
            throw new Error('SavedPagesFilter must be a JSON object');
        }
        const o = parsed as Record<string, unknown>;
        const name =
            o.name === null || o.name === undefined
                ? null
                : String(o.name).trim() === ''
                  ? null
                  : String(o.name).trim();
        const includeAka =
            o.includeAka === undefined ? true : Boolean(o.includeAka);
        const order = SavedPagesFilter.parseOrder(o.order);
        let difficultyOptions: DifficultyFilterOptions | null = null;
        if (o.difficultyOptions != null && typeof o.difficultyOptions === 'object') {
            difficultyOptions = DifficultyFilterOptions.fromResult(o.difficultyOptions);
        }
        return new SavedPagesFilter(name, includeAka, order, difficultyOptions);
    }

    private static parseOrder(v: unknown): SavedPagesOrder {
        if (v === 'newest' || v === 'oldest') return v;
        throw new Error(`Invalid SavedPagesFilter.order: ${JSON.stringify(v)}`);
    }
}

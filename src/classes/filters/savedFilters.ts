import { RouteFilter } from './routeFilter';
import { SearchFilter } from './searchFilter';
import { SavedPagesFilter } from './savedPagesFilter';

/**
 * Persisted filter slots for Explore, Search, and Saved screens.
 * Legacy JSON key `saved` (SearchFilter) is ignored on load.
 */
export class SavedFilters {
    explore: RouteFilter | null;
    search: SearchFilter | null;
    savedPages: SavedPagesFilter | null;

    constructor(
        explore: RouteFilter | null = null,
        search: SearchFilter | null = null,
        savedPages: SavedPagesFilter | null = null,
    ) {
        this.explore = explore;
        this.search = search;
        this.savedPages = savedPages;
    }

    toJSON(): Record<string, unknown> {
        return {
            explore: this.explore !== null ? this.explore.toJSON() : null,
            search: this.search !== null ? this.search.toJSON() : null,
            savedPages:
                this.savedPages !== null ? this.savedPages.toJSON() : null,
        };
    }

    toString(): string {
        return JSON.stringify(this.toJSON());
    }

    static fromJsonString(json: string): SavedFilters {
        let parsed: unknown;
        try {
            parsed = JSON.parse(json);
        } catch (e) {
            throw new Error(
                `SavedFilters.fromJsonString: invalid JSON: ${e instanceof Error ? e.message : String(e)}`,
            );
        }
        return SavedFilters.fromJSON(parsed);
    }

    static fromJSON(parsed: unknown): SavedFilters {
        if (parsed == null || typeof parsed !== 'object') {
            throw new Error('SavedFilters must be a JSON object');
        }
        const o = parsed as Record<string, unknown>;
        // Legacy `saved` slot (SearchFilter for Saved screen) is dropped per mobile_filter_persistence plan.
        let explore: RouteFilter | null = null;
        if (o.explore != null && typeof o.explore === 'object') {
            explore = RouteFilter.fromJSON(o.explore);
        }
        let search: SearchFilter | null = null;
        if (o.search != null && typeof o.search === 'object') {
            search = SearchFilter.fromJSON(o.search);
        }
        let savedPages: SavedPagesFilter | null = null;
        if (o.savedPages != null && typeof o.savedPages === 'object') {
            savedPages = SavedPagesFilter.fromJSON(o.savedPages);
        }
        return new SavedFilters(explore, search, savedPages);
    }
}

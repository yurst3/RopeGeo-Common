import { MiniMapType } from './miniMapType';

const API_MINI_MAP_TYPES: ReadonlySet<string> = new Set([
    MiniMapType.Page,
    MiniMapType.Region,
    MiniMapType.CenteredRegion,
]);
const miniMapParsers = new Map<MiniMapType, (result: unknown) => MiniMap>();

export function registerMiniMapParser(
    miniMapType: MiniMapType,
    parse: (result: unknown) => MiniMap,
): void {
    miniMapParsers.set(miniMapType, parse);
}

/**
 * Base type for region/page minimap payloads. Use {@link MiniMap.fromResult} to parse API `miniMapType` values.
 */
export abstract class MiniMap {
    abstract readonly miniMapType: MiniMapType;
    readonly title: string;

    protected constructor(title: string) {
        MiniMap.assertNonEmptyTitle(title, 'MiniMap.title');
        this.title = title;
    }

    static assertNonEmptyTitle(value: unknown, context: string): string {
        if (typeof value !== 'string' || value.trim().length === 0) {
            throw new Error(`${context} must be a non-empty string`);
        }
        return value;
    }

    /**
     * Validates `miniMapType` and delegates to the matching API minimap parser.
     */
    static fromResult(result: unknown): MiniMap {
        if (result == null || typeof result !== 'object') {
            throw new Error('MiniMap result must be an object');
        }
        const r = result as Record<string, unknown>;
        const t = r.miniMapType;
        if (typeof t !== 'string') {
            throw new Error(
                `MiniMap.miniMapType must be a string, got: ${JSON.stringify(t)}`,
            );
        }
        if (!API_MINI_MAP_TYPES.has(t)) {
            throw new Error(
                `MiniMap.miniMapType must be one of [${[...API_MINI_MAP_TYPES].join(', ')}], got: ${JSON.stringify(t)}`,
            );
        }
        const parser = miniMapParsers.get(t as MiniMapType);
        if (parser === undefined) {
            throw new Error(
                `No MiniMap parser registered for miniMapType ${JSON.stringify(t)}`,
            );
        }
        return parser(result);
    }
}

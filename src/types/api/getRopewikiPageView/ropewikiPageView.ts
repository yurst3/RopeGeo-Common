import { Difficulty } from '../../difficulty';
import { PermitStatus } from '../../permitStatus';
import { BetaSection } from '../../betaSections/betaSection';
import { BetaSectionImage } from '../../betaSections/betaSectionImage';
import { MiniMap } from '../../minimap/miniMap';
import { PageMiniMap } from '../../minimap/pageMiniMap';

type MinMax = { min: number; max: number };

/**
 * Response type for GET getRopewikiPageView (full page view).
 */
export class RopewikiPageView {
    pageId: string;
    name: string;
    aka: string[];
    url: string;
    quality: number;
    userVotes: number;
    regions: { name: string; id: string }[];
    difficulty: Difficulty;
    permit: PermitStatus | null;
    rappelCount: MinMax | number | null;
    jumps: number | null;
    vehicle: string | null;
    rappelLongest: number | null;
    shuttleTime: number | null;
    overallLength: number | null;
    descentLength: number | null;
    exitLength: number | null;
    approachLength: number | null;
    overallTime: MinMax | number | null;
    approachTime: MinMax | number | null;
    descentTime: MinMax | number | null;
    exitTime: MinMax | number | null;
    approachElevGain: number | null;
    descentElevGain: number | null;
    exitElevGain: number | null;
    months: string[];
    latestRevisionDate: Date;
    bannerImage: BetaSectionImage | null;
    betaSections: BetaSection[];
    /** Minimap for the page route (tiles template + bounds when present), or null. */
    miniMap: MiniMap | null;

    constructor(
        pageId: string,
        name: string,
        aka: string[],
        url: string,
        quality: number,
        userVotes: number,
        regions: { name: string; id: string }[],
        difficulty: Difficulty,
        permit: PermitStatus | null,
        rappelCount: MinMax | number | null,
        jumps: number | null,
        vehicle: string | null,
        rappelLongest: number | null,
        shuttleTime: number | null,
        overallLength: number | null,
        descentLength: number | null,
        exitLength: number | null,
        approachLength: number | null,
        overallTime: MinMax | number | null,
        approachTime: MinMax | number | null,
        descentTime: MinMax | number | null,
        exitTime: MinMax | number | null,
        approachElevGain: number | null,
        descentElevGain: number | null,
        exitElevGain: number | null,
        months: string[],
        latestRevisionDate: Date,
        bannerImage: BetaSectionImage | null,
        betaSections: BetaSection[],
        miniMap: MiniMap | null,
    ) {
        this.pageId = pageId;
        this.name = name;
        this.aka = Array.isArray(aka) ? aka.slice() : [];
        this.url = url;
        this.quality = quality;
        this.userVotes = userVotes;
        this.regions = Array.isArray(regions) ? regions.slice() : [];
        this.difficulty = difficulty;
        this.permit = permit;
        this.rappelCount = rappelCount;
        this.jumps = jumps;
        this.vehicle = vehicle;
        this.rappelLongest = rappelLongest;
        this.shuttleTime = shuttleTime;
        this.overallLength = overallLength;
        this.descentLength = descentLength;
        this.exitLength = exitLength;
        this.approachLength = approachLength;
        this.overallTime = overallTime;
        this.approachTime = approachTime;
        this.descentTime = descentTime;
        this.exitTime = exitTime;
        this.approachElevGain = approachElevGain;
        this.descentElevGain = descentElevGain;
        this.exitElevGain = exitElevGain;
        this.months = Array.isArray(months) ? months.slice() : [];
        this.latestRevisionDate = new Date(latestRevisionDate);
        this.bannerImage = bannerImage;
        this.betaSections = Array.isArray(betaSections) ? betaSections : [];
        this.miniMap = miniMap;
    }

    /**
     * Validates result has RopewikiPageView fields and returns a RopewikiPageView instance.
     */
    static fromResult(result: unknown): RopewikiPageView {
        if (result == null || typeof result !== 'object') {
            throw new Error('RopewikiPageView result must be an object');
        }
        const r = result as Record<string, unknown>;
        RopewikiPageView.assertString(r, 'pageId');
        RopewikiPageView.assertString(r, 'name');
        RopewikiPageView.assertStringArray(r, 'aka');
        RopewikiPageView.assertString(r, 'url');
        RopewikiPageView.assertNumber(r, 'quality');
        RopewikiPageView.assertNumber(r, 'userVotes');
        RopewikiPageView.assertRegionsArray(r, 'regions');
        RopewikiPageView.assertDifficulty(r, 'difficulty');
        RopewikiPageView.assertPermit(r, 'permit');
        RopewikiPageView.assertRappelCount(r, 'rappelCount');
        RopewikiPageView.assertNullableNumber(r, 'jumps');
        RopewikiPageView.assertNullableString(r, 'vehicle');
        RopewikiPageView.assertNullableNumber(r, 'rappelLongest');
        RopewikiPageView.assertNullableNumber(r, 'shuttleTime');
        RopewikiPageView.assertNullableNumber(r, 'overallLength');
        RopewikiPageView.assertNullableNumber(r, 'descentLength');
        RopewikiPageView.assertNullableNumber(r, 'exitLength');
        RopewikiPageView.assertNullableNumber(r, 'approachLength');
        RopewikiPageView.assertMinMaxOrNumber(r, 'overallTime');
        RopewikiPageView.assertMinMaxOrNumber(r, 'approachTime');
        RopewikiPageView.assertMinMaxOrNumber(r, 'descentTime');
        RopewikiPageView.assertMinMaxOrNumber(r, 'exitTime');
        RopewikiPageView.assertNullableNumber(r, 'approachElevGain');
        RopewikiPageView.assertNullableNumber(r, 'descentElevGain');
        RopewikiPageView.assertNullableNumber(r, 'exitElevGain');
        RopewikiPageView.assertStringArray(r, 'months');
        RopewikiPageView.assertIso8601DateString(r, 'latestRevisionDate');
        RopewikiPageView.assertNullableBannerImage(r, 'bannerImage');
        RopewikiPageView.assertBetaSectionsArray(r, 'betaSections');
        RopewikiPageView.assertNullableMiniMap(r, 'miniMap');

        (r as Record<string, unknown>).latestRevisionDate = new Date(
            r.latestRevisionDate as string,
        );
        (r as Record<string, unknown>).difficulty = new Difficulty(
            (r.difficulty as Record<string, unknown>).technical as string | null,
            (r.difficulty as Record<string, unknown>).water as string | null,
            (r.difficulty as Record<string, unknown>).time as string | null,
            (r.difficulty as Record<string, unknown>).risk as string | null,
        );
        if (r.miniMap != null && r.miniMap !== undefined) {
            (r as Record<string, unknown>).miniMap = PageMiniMap.fromResult(r.miniMap);
        } else {
            (r as Record<string, unknown>).miniMap = null;
        }
        Object.setPrototypeOf(r, RopewikiPageView.prototype);
        return r as unknown as RopewikiPageView;
    }

    private static assertString(obj: Record<string, unknown>, key: string): void {
        const v = obj[key];
        if (typeof v !== 'string') {
            throw new Error(
                `RopewikiPageView.${key} must be a string, got: ${typeof v}`,
            );
        }
    }

    private static assertNullableString(
        obj: Record<string, unknown>,
        key: string,
    ): void {
        const v = obj[key];
        if (v !== null && v !== undefined && typeof v !== 'string') {
            throw new Error(
                `RopewikiPageView.${key} must be string or null, got: ${typeof v}`,
            );
        }
    }

    private static assertNullableMiniMap(
        obj: Record<string, unknown>,
        key: string,
    ): void {
        const v = obj[key];
        if (v === null || v === undefined) return;
        if (typeof v !== 'object') {
            throw new Error(
                `RopewikiPageView.${key} must be a PageMiniMap object or null, got: ${typeof v}`,
            );
        }
    }

    private static assertNumber(obj: Record<string, unknown>, key: string): void {
        const v = obj[key];
        if (typeof v !== 'number' || Number.isNaN(v)) {
            throw new Error(
                `RopewikiPageView.${key} must be a number, got: ${typeof v}`,
            );
        }
    }

    private static assertNullableNumber(
        obj: Record<string, unknown>,
        key: string,
    ): void {
        const v = obj[key];
        if (v !== null && v !== undefined && (typeof v !== 'number' || Number.isNaN(v))) {
            throw new Error(
                `RopewikiPageView.${key} must be a number or null, got: ${typeof v}`,
            );
        }
    }

    private static assertStringArray(
        obj: Record<string, unknown>,
        key: string,
    ): void {
        const v = obj[key];
        if (!Array.isArray(v)) {
            throw new Error(
                `RopewikiPageView.${key} must be an array, got: ${typeof v}`,
            );
        }
        for (let i = 0; i < v.length; i++) {
            if (typeof v[i] !== 'string') {
                throw new Error(
                    `RopewikiPageView.${key}[${i}] must be a string`,
                );
            }
        }
    }

    private static assertRegionsArray(
        obj: Record<string, unknown>,
        key: string,
    ): void {
        const v = obj[key];
        if (!Array.isArray(v)) {
            throw new Error(
                `RopewikiPageView.${key} must be an array, got: ${typeof v}`,
            );
        }
        for (let i = 0; i < v.length; i++) {
            const item = v[i];
            if (item == null || typeof item !== 'object') {
                throw new Error(
                    `RopewikiPageView.${key}[${i}] must be an object with id and name`,
                );
            }
            const o = item as Record<string, unknown>;
            if (typeof o.id !== 'string') {
                throw new Error(
                    `RopewikiPageView.${key}[${i}].id must be a string, got: ${typeof o.id}`,
                );
            }
            if (typeof o.name !== 'string') {
                throw new Error(
                    `RopewikiPageView.${key}[${i}].name must be a string, got: ${typeof o.name}`,
                );
            }
        }
    }

    private static assertDifficulty(
        obj: Record<string, unknown>,
        key: string,
    ): void {
        const v = obj[key];
        if (v == null || typeof v !== 'object') {
            throw new Error(
                `RopewikiPageView.${key} must be an object, got: ${typeof v}`,
            );
        }
        const d = v as Record<string, unknown>;
        if (d.technical !== null && d.technical !== undefined && typeof d.technical !== 'string') {
            throw new Error(`RopewikiPageView.${key}.technical must be string or null`);
        }
        if (d.water !== null && d.water !== undefined && typeof d.water !== 'string') {
            throw new Error(`RopewikiPageView.${key}.water must be string or null`);
        }
        if (d.time !== null && d.time !== undefined && typeof d.time !== 'string') {
            throw new Error(`RopewikiPageView.${key}.time must be string or null`);
        }
        if (d.risk !== null && d.risk !== undefined && typeof d.risk !== 'string') {
            throw new Error(`RopewikiPageView.${key}.risk must be string or null`);
        }
    }

    private static assertPermit(obj: Record<string, unknown>, key: string): void {
        const v = obj[key];
        if (v === null || v === undefined) return;
        if (typeof v !== 'string') {
            throw new Error(
                `RopewikiPageView.${key} must be PermitStatus or null, got: ${typeof v}`,
            );
        }
        const values = Object.values(PermitStatus);
        if (!values.includes(v as PermitStatus)) {
            throw new Error(
                `RopewikiPageView.${key} must be one of [${values.join(', ')}] or null, got: ${v}`,
            );
        }
    }

    private static assertRappelCount(
        obj: Record<string, unknown>,
        key: string,
    ): void {
        const v = obj[key];
        if (v === null || v === undefined) return;
        if (typeof v === 'number') {
            if (Number.isNaN(v)) {
                throw new Error(`RopewikiPageView.${key} must be a number or min/max object or null`);
            }
            return;
        }
        if (typeof v === 'object' && v !== null && 'min' in v && 'max' in v) {
            const o = v as Record<string, unknown>;
            if (typeof o.min !== 'number' || Number.isNaN(o.min as number)) {
                throw new Error(`RopewikiPageView.${key}.min must be a number`);
            }
            if (typeof o.max !== 'number' || Number.isNaN(o.max as number)) {
                throw new Error(`RopewikiPageView.${key}.max must be a number`);
            }
            return;
        }
        throw new Error(
            `RopewikiPageView.${key} must be number or { min, max } or null, got: ${typeof v}`,
        );
    }

    private static assertMinMaxOrNumber(
        obj: Record<string, unknown>,
        key: string,
    ): void {
        RopewikiPageView.assertRappelCount(obj, key);
    }

    private static assertIso8601DateString(
        obj: Record<string, unknown>,
        key: string,
    ): void {
        const v = obj[key];
        if (typeof v !== 'string') {
            throw new Error(
                `RopewikiPageView.${key} must be an ISO 8601 date string, got: ${typeof v}`,
            );
        }
        const date = new Date(v);
        if (Number.isNaN(date.getTime())) {
            throw new Error(
                `RopewikiPageView.${key} must be a valid ISO 8601 date string, got: ${v}`,
            );
        }
    }

    private static assertNullableBannerImage(
        obj: Record<string, unknown>,
        key: string,
    ): void {
        const v = obj[key];
        if (v === null || v === undefined) return;
        if (typeof v !== 'object') {
            throw new Error(
                `RopewikiPageView.${key} must be BetaSectionImage or null, got: ${typeof v}`,
            );
        }
        const parsed = BetaSectionImage.fromResponseBody(v);
        (obj as Record<string, unknown>)[key] = parsed;
    }

    private static assertBetaSectionsArray(
        obj: Record<string, unknown>,
        key: string,
    ): void {
        const v = obj[key];
        if (!Array.isArray(v)) {
            throw new Error(
                `RopewikiPageView.${key} must be an array, got: ${typeof v}`,
            );
        }
        (obj as Record<string, unknown>)[key] = v.map((item) =>
            BetaSection.fromResponseBody(item),
        );
    }
}

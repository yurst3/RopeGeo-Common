import '../difficulty/registerDifficultyParsers';
import { Difficulty } from '../difficulty/difficulty';
import { PermitStatus } from '../permitStatus';
import { FetchType } from '../fetchType';
import { RouteType } from '../routes/routeType';
import { PageViewType } from './pageViewType';

type MinMax = { min: number; max: number };
const ropewikiPageViewParsers = new Map<FetchType, (result: unknown) => RopewikiPageView>();

export function registerRopewikiPageViewParser(
    fetchType: FetchType,
    parse: (result: unknown) => RopewikiPageView,
): void {
    ropewikiPageViewParsers.set(fetchType, parse);
}

export abstract class RopewikiPageView {
    abstract readonly fetchType: FetchType;
    readonly pageViewType = PageViewType.Ropewiki;
    id: string;
    routeType: RouteType;
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
    coordinates: { lat: number; lon: number } | null;

    protected constructor(
        id: string,
        routeType: RouteType,
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
        coordinates: { lat: number; lon: number } | null,
    ) {
        this.id = id;
        this.routeType = routeType;
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
        this.coordinates =
            coordinates != null
                ? { lat: coordinates.lat, lon: coordinates.lon }
                : null;
    }

    static fromResult(result: unknown, fetchType?: FetchType): RopewikiPageView {
        if (result == null || typeof result !== 'object') {
            throw new Error('RopewikiPageView result must be an object');
        }
        const r = result as Record<string, unknown>;
        const resolvedFetchType = fetchType ?? r.fetchType;
        if (resolvedFetchType !== 'online' && resolvedFetchType !== 'offline') {
            throw new Error(
                `RopewikiPageView.fetchType must be "online" or "offline", got: ${JSON.stringify(r.fetchType)}`,
            );
        }
        const parser = ropewikiPageViewParsers.get(resolvedFetchType);
        if (parser == null) {
            throw new Error(
                `No RopewikiPageView parser registered for fetchType ${JSON.stringify(resolvedFetchType)}`,
            );
        }
        return parser(result);
    }

    protected static validateCommonFields(r: Record<string, unknown>, expectedFetchType: FetchType, context: string): void {
        RopewikiPageView.assertString(r, 'id');
        RopewikiPageView.assertRouteType(r, 'routeType');
        RopewikiPageView.assertPageViewType(r, 'pageViewType');
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
        RopewikiPageView.assertNullableCoordinates(r, 'coordinates');
        if (r.fetchType !== expectedFetchType) {
            throw new Error(
                `${context}.fetchType must be "${expectedFetchType}", got: ${JSON.stringify(r.fetchType)}`,
            );
        }
        r.latestRevisionDate = new Date(r.latestRevisionDate as string);
        r.difficulty = Difficulty.fromResult(r.difficulty);
    }

    private static assertPageViewType(obj: Record<string, unknown>, key: string): void {
        const v = obj[key];
        if (v !== PageViewType.Ropewiki) {
            throw new Error(`${obj}.${key} must be "${PageViewType.Ropewiki}"`);
        }
    }

    private static assertRouteType(obj: Record<string, unknown>, key: string): void {
        const v = obj[key];
        if (typeof v !== 'string' || !Object.values(RouteType).includes(v as RouteType)) {
            throw new Error(`RopewikiPageView.${key} must be a valid RouteType`);
        }
    }

    protected static assertString(obj: Record<string, unknown>, key: string): void {
        const v = obj[key];
        if (typeof v !== 'string') {
            throw new Error(`RopewikiPageView.${key} must be a string, got: ${typeof v}`);
        }
    }

    protected static assertNullableString(
        obj: Record<string, unknown>,
        key: string,
    ): void {
        const v = obj[key];
        if (v !== null && v !== undefined && typeof v !== 'string') {
            throw new Error(`RopewikiPageView.${key} must be string or null, got: ${typeof v}`);
        }
    }

    protected static parseCoordinateComponent(value: unknown): number | null {
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value;
        }
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed === '') return null;
            const n = Number(trimmed);
            if (Number.isFinite(n)) return n;
        }
        return null;
    }

    protected static assertNullableCoordinates(
        obj: Record<string, unknown>,
        key: string,
    ): void {
        const v = obj[key];
        if (v === null || v === undefined) {
            (obj as Record<string, unknown>)[key] = null;
            return;
        }
        if (typeof v !== 'object' || v === null || Array.isArray(v)) {
            throw new Error(
                `RopewikiPageView.${key} must be { lat, lon } or null, got: ${typeof v}`,
            );
        }
        const o = v as Record<string, unknown>;
        const lat = RopewikiPageView.parseCoordinateComponent(o.lat);
        const lon = RopewikiPageView.parseCoordinateComponent(o.lon);
        if (lat === null || lon === null) {
            throw new Error(
                `RopewikiPageView.${key}.lat and .lon must be finite numbers or numeric strings`,
            );
        }
        (obj as Record<string, unknown>)[key] = { lat, lon };
    }

    protected static assertNumber(obj: Record<string, unknown>, key: string): void {
        const v = obj[key];
        if (typeof v !== 'number' || Number.isNaN(v)) {
            throw new Error(`RopewikiPageView.${key} must be a number, got: ${typeof v}`);
        }
    }

    protected static assertNullableNumber(
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

    protected static assertStringArray(
        obj: Record<string, unknown>,
        key: string,
    ): void {
        const v = obj[key];
        if (!Array.isArray(v)) {
            throw new Error(`RopewikiPageView.${key} must be an array, got: ${typeof v}`);
        }
        for (let i = 0; i < v.length; i++) {
            if (typeof v[i] !== 'string') {
                throw new Error(`RopewikiPageView.${key}[${i}] must be a string`);
            }
        }
    }

    protected static assertRegionsArray(
        obj: Record<string, unknown>,
        key: string,
    ): void {
        const v = obj[key];
        if (!Array.isArray(v)) {
            throw new Error(`RopewikiPageView.${key} must be an array, got: ${typeof v}`);
        }
        for (let i = 0; i < v.length; i++) {
            const item = v[i];
            if (item == null || typeof item !== 'object') {
                throw new Error(`RopewikiPageView.${key}[${i}] must be an object with id and name`);
            }
            const o = item as Record<string, unknown>;
            if (typeof o.id !== 'string') {
                throw new Error(`RopewikiPageView.${key}[${i}].id must be a string, got: ${typeof o.id}`);
            }
            if (typeof o.name !== 'string') {
                throw new Error(`RopewikiPageView.${key}[${i}].name must be a string, got: ${typeof o.name}`);
            }
        }
    }

    protected static assertDifficulty(
        obj: Record<string, unknown>,
        key: string,
    ): void {
        const v = obj[key];
        if (v == null || typeof v !== 'object') {
            throw new Error(`RopewikiPageView.${key} must be an object, got: ${typeof v}`);
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
        if (
            d.additionalRisk !== null &&
            d.additionalRisk !== undefined &&
            typeof d.additionalRisk !== 'string'
        ) {
            throw new Error(`RopewikiPageView.${key}.additionalRisk must be string or null`);
        }
    }

    protected static assertPermit(obj: Record<string, unknown>, key: string): void {
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

    protected static assertRappelCount(
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

    protected static assertMinMaxOrNumber(
        obj: Record<string, unknown>,
        key: string,
    ): void {
        RopewikiPageView.assertRappelCount(obj, key);
    }

    protected static assertIso8601DateString(
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
}


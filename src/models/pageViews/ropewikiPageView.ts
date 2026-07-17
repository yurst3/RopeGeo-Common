import '../difficulty/registerDifficultyRatingParsers';
import {
    DifficultyRating,
    resolveDifficultyRatingFromRecord,
} from '../difficulty/difficultyRating';
import { PermitStatus } from '../permitStatus';
import { RopewikiVehicleType } from '../ropewikiVehicleType';
import { FetchType } from '../fetchType';
import { RouteType } from '../routes/routeType';
import { PageViewType } from './pageViewType';
import { MinMax } from '../measurements/minMax';
import {
    FEET,
    LengthMeasurement,
    MILES,
} from '../measurements/lengthMeasurement';
import {
    HOURS,
    MINUTES,
    TimeMeasurement,
    TimeMeasurementUnit,
} from '../measurements/timeMeasurement';

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
    difficultyRating: DifficultyRating;
    permit: PermitStatus | null;
    rappelCount: MinMax<number> | number | null;
    jumps: number | null;
    vehicle: RopewikiVehicleType | null;
    rappelLongest: LengthMeasurement | null;
    shuttleTime: TimeMeasurement | null;
    overallLength: LengthMeasurement | null;
    descentLength: LengthMeasurement | null;
    exitLength: LengthMeasurement | null;
    approachLength: LengthMeasurement | null;
    overallTime: TimeMeasurement | MinMax<TimeMeasurement> | null;
    approachTime: TimeMeasurement | MinMax<TimeMeasurement> | null;
    descentTime: TimeMeasurement | MinMax<TimeMeasurement> | null;
    exitTime: TimeMeasurement | MinMax<TimeMeasurement> | null;
    approachElevGain: LengthMeasurement | null;
    descentElevGain: LengthMeasurement | null;
    exitElevGain: LengthMeasurement | null;
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
        difficultyRating: DifficultyRating,
        permit: PermitStatus | null,
        rappelCount: MinMax<number> | number | null,
        jumps: number | null,
        vehicle: RopewikiVehicleType | null,
        rappelLongest: LengthMeasurement | null,
        shuttleTime: TimeMeasurement | null,
        overallLength: LengthMeasurement | null,
        descentLength: LengthMeasurement | null,
        exitLength: LengthMeasurement | null,
        approachLength: LengthMeasurement | null,
        overallTime: TimeMeasurement | MinMax<TimeMeasurement> | null,
        approachTime: TimeMeasurement | MinMax<TimeMeasurement> | null,
        descentTime: TimeMeasurement | MinMax<TimeMeasurement> | null,
        exitTime: TimeMeasurement | MinMax<TimeMeasurement> | null,
        approachElevGain: LengthMeasurement | null,
        descentElevGain: LengthMeasurement | null,
        exitElevGain: LengthMeasurement | null,
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
        this.difficultyRating = difficultyRating;
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
        RopewikiPageView.assertDifficultyRating(r);
        RopewikiPageView.assertPermit(r, 'permit');
        RopewikiPageView.assertRappelCount(r, 'rappelCount');
        RopewikiPageView.assertNullableNumber(r, 'jumps');
        RopewikiPageView.assertVehicle(r, 'vehicle');
        RopewikiPageView.assertStringArray(r, 'months');
        RopewikiPageView.assertIso8601DateString(r, 'latestRevisionDate');
        RopewikiPageView.assertNullableCoordinates(r, 'coordinates');
        if (r.fetchType !== expectedFetchType) {
            throw new Error(
                `${context}.fetchType must be "${expectedFetchType}", got: ${JSON.stringify(r.fetchType)}`,
            );
        }
        r.latestRevisionDate = new Date(r.latestRevisionDate as string);
        r.difficultyRating = DifficultyRating.fromResult(
            resolveDifficultyRatingFromRecord(r),
        );
        RopewikiPageView.hydrateMeasurementFields(r);
    }

    /**
     * Converts the raw length/time fields on a wire record into {@link LengthMeasurement} /
     * {@link TimeMeasurement} (and {@link MinMax}) instances in place. Accepts legacy bare numbers
     * and `{ min, max }` ranges (tagged with each field's canonical source unit) as well as the
     * serialized measurement object shapes, so parsing round-trips through {@link Measurement#toJSON}.
     */
    private static hydrateMeasurementFields(r: Record<string, unknown>): void {
        r.rappelCount = RopewikiPageView.coerceRappelCount(r.rappelCount);
        r.rappelLongest = LengthMeasurement.coerce(r.rappelLongest, FEET);
        r.overallLength = LengthMeasurement.coerce(r.overallLength, MILES);
        r.descentLength = LengthMeasurement.coerce(r.descentLength, MILES);
        r.exitLength = LengthMeasurement.coerce(r.exitLength, MILES);
        r.approachLength = LengthMeasurement.coerce(r.approachLength, MILES);
        r.approachElevGain = LengthMeasurement.coerce(r.approachElevGain, FEET);
        r.descentElevGain = LengthMeasurement.coerce(r.descentElevGain, FEET);
        r.exitElevGain = LengthMeasurement.coerce(r.exitElevGain, FEET);
        r.shuttleTime = TimeMeasurement.coerce(r.shuttleTime, MINUTES);
        r.overallTime = RopewikiPageView.coerceTimeOrRange(r.overallTime, HOURS);
        r.approachTime = RopewikiPageView.coerceTimeOrRange(r.approachTime, HOURS);
        r.descentTime = RopewikiPageView.coerceTimeOrRange(r.descentTime, HOURS);
        r.exitTime = RopewikiPageView.coerceTimeOrRange(r.exitTime, HOURS);
    }

    protected static coerceRappelCount(
        value: unknown,
    ): MinMax<number> | number | null {
        if (value == null) return null;
        if (value instanceof MinMax) return value as MinMax<number>;
        if (typeof value === 'number') return value;
        if (typeof value === 'object') {
            const o = value as Record<string, unknown>;
            if (typeof o.min === 'number' && typeof o.max === 'number') {
                return new MinMax<number>(o.min, o.max);
            }
        }
        throw new Error(
            'RopewikiPageView.rappelCount must be a number, { min, max }, or null',
        );
    }

    protected static coerceTimeOrRange(
        value: unknown,
        defaultUnit: TimeMeasurementUnit,
    ): TimeMeasurement | MinMax<TimeMeasurement> | null {
        if (value == null) return null;
        if (value instanceof TimeMeasurement) return value;
        if (value instanceof MinMax) return value as MinMax<TimeMeasurement>;
        if (typeof value === 'number') {
            return TimeMeasurement.coerce(value, defaultUnit);
        }
        if (typeof value === 'object') {
            const o = value as Record<string, unknown>;
            if ('min' in o && 'max' in o) {
                const min = TimeMeasurement.coerce(o.min, defaultUnit);
                const max = TimeMeasurement.coerce(o.max, defaultUnit);
                if (min == null || max == null) {
                    throw new Error(
                        'RopewikiPageView time range min/max must not be null',
                    );
                }
                return new MinMax<TimeMeasurement>(min, max);
            }
            return TimeMeasurement.fromResult(value);
        }
        throw new Error(
            'RopewikiPageView time field must be a number, { min, max }, measurement object, or null',
        );
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

    protected static rejectLegacyTopLevelMapDataId(
        r: Record<string, unknown>,
        context: string,
    ): void {
        if ('mapDataId' in r) {
            throw new Error(
                `${context} must not include top-level mapDataId; set mapDataId on page minimaps instead`,
            );
        }
    }

    protected static assertUniqueBetaSectionIds(
        sections: { id: string | null }[],
        context: string,
    ): void {
        const seen = new Set<string>();
        for (const section of sections) {
            if (section.id == null) continue;
            if (seen.has(section.id)) {
                throw new Error(
                    `Duplicate beta-section id in ${context}: ${section.id}`,
                );
            }
            seen.add(section.id);
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

    protected static assertDifficultyRating(r: Record<string, unknown>): void {
        const v = resolveDifficultyRatingFromRecord(r);
        if (v == null || typeof v !== 'object') {
            throw new Error(
                `RopewikiPageView.difficultyRating must be an object, got: ${typeof v}`,
            );
        }
        const d = v as Record<string, unknown>;
        if (d.technical !== null && d.technical !== undefined && typeof d.technical !== 'string') {
            throw new Error('RopewikiPageView.difficultyRating.technical must be string or null');
        }
        if (d.water !== null && d.water !== undefined && typeof d.water !== 'string') {
            throw new Error('RopewikiPageView.difficultyRating.water must be string or null');
        }
        if (d.time !== null && d.time !== undefined && typeof d.time !== 'string') {
            throw new Error('RopewikiPageView.difficultyRating.time must be string or null');
        }
        if (
            d.additionalRisk !== null &&
            d.additionalRisk !== undefined &&
            typeof d.additionalRisk !== 'string'
        ) {
            throw new Error(
                'RopewikiPageView.difficultyRating.additionalRisk must be string or null',
            );
        }
    }

    protected static assertVehicle(obj: Record<string, unknown>, key: string): void {
        const v = obj[key];
        if (v === null || v === undefined) return;
        if (typeof v !== 'string') {
            throw new Error(
                `RopewikiPageView.${key} must be RopewikiVehicleType or null, got: ${typeof v}`,
            );
        }
        const values = Object.values(RopewikiVehicleType);
        if (!values.includes(v as RopewikiVehicleType)) {
            throw new Error(
                `RopewikiPageView.${key} must be one of [${values.join(', ')}] or null, got: ${v}`,
            );
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


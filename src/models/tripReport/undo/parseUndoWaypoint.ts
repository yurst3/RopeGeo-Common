import { roundWaypoint, type TripReportWaypoint } from '../tripReportLineSegment';

/** Validates a stored `[lng, lat]` and rounds it to waypoint precision. */
export function parseUndoWaypoint(value: unknown, context: string): TripReportWaypoint {
    if (
        !Array.isArray(value) ||
        value.length < 2 ||
        typeof value[0] !== 'number' ||
        typeof value[1] !== 'number' ||
        !Number.isFinite(value[0]) ||
        !Number.isFinite(value[1])
    ) {
        throw new Error(`${context} must be [lng, lat], got: ${JSON.stringify(value)}`);
    }
    return roundWaypoint([value[0], value[1]]);
}

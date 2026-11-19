import { AddMarkerUndoChange } from './addMarkerUndoChange';
import { AddSegmentUndoChange } from './addSegmentUndoChange';
import { AddWaypointUndoChange } from './addWaypointUndoChange';
import { ImportMapFileUndoChange } from './importMapFileUndoChange';
import type { MapBlockUndoChange } from './mapBlockUndoChange';
import { MoveMarkerUndoChange } from './moveMarkerUndoChange';
import { MoveWaypointUndoChange } from './moveWaypointUndoChange';
import { RemoveMarkerUndoChange } from './removeMarkerUndoChange';
import { RemoveSegmentUndoChange } from './removeSegmentUndoChange';
import { RemoveWaypointUndoChange } from './removeWaypointUndoChange';
import { SplitSegmentUndoChange } from './splitSegmentUndoChange';

/** Dispatches a stored undo JSON object to the matching concrete {@link MapBlockUndoChange}. */
export function parseMapBlockUndoChange(result: unknown): MapBlockUndoChange {
    if (result == null || typeof result !== 'object' || Array.isArray(result)) {
        throw new Error('MapBlockUndoChange result must be an object');
    }
    const type = (result as { type?: unknown }).type;
    switch (type) {
        case 'addSegment':
            return AddSegmentUndoChange.fromResult(result);
        case 'removeSegment':
            return RemoveSegmentUndoChange.fromResult(result);
        case 'addMarker':
            return AddMarkerUndoChange.fromResult(result);
        case 'removeMarker':
            return RemoveMarkerUndoChange.fromResult(result);
        case 'moveMarker':
            return MoveMarkerUndoChange.fromResult(result);
        case 'moveWaypoint':
            return MoveWaypointUndoChange.fromResult(result);
        case 'addWaypoint':
            return AddWaypointUndoChange.fromResult(result);
        case 'removeWaypoint':
            return RemoveWaypointUndoChange.fromResult(result);
        case 'splitSegment':
            return SplitSegmentUndoChange.fromResult(result);
        case 'importMapFile':
            return ImportMapFileUndoChange.fromResult(result);
        default:
            throw new Error(`Unknown MapBlockUndoChange.type: ${JSON.stringify(type)}`);
    }
}

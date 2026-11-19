import type { AddMarkerUndoChangeJson } from './addMarkerUndoChange';
import type { AddSegmentUndoChangeJson } from './addSegmentUndoChange';
import type { AddWaypointUndoChangeJson } from './addWaypointUndoChange';
import type { ImportMapFileUndoChangeJson } from './importMapFileUndoChange';
import type { MoveMarkerUndoChangeJson } from './moveMarkerUndoChange';
import type { MoveWaypointUndoChangeJson } from './moveWaypointUndoChange';
import type { RemoveMarkerUndoChangeJson } from './removeMarkerUndoChange';
import type { RemoveSegmentUndoChangeJson } from './removeSegmentUndoChange';
import type { RemoveWaypointUndoChangeJson } from './removeWaypointUndoChange';
import type { SplitSegmentUndoChangeJson } from './splitSegmentUndoChange';

export type MapBlockUndoChangeJson =
    | AddSegmentUndoChangeJson
    | RemoveSegmentUndoChangeJson
    | AddMarkerUndoChangeJson
    | RemoveMarkerUndoChangeJson
    | MoveMarkerUndoChangeJson
    | MoveWaypointUndoChangeJson
    | AddWaypointUndoChangeJson
    | RemoveWaypointUndoChangeJson
    | SplitSegmentUndoChangeJson
    | ImportMapFileUndoChangeJson;

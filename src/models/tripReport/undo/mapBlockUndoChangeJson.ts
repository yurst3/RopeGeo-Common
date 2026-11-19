import type { AddMarkerUndoChangeJson } from './addMarkerUndoChange';
import type { AddSegmentUndoChangeJson } from './addSegmentUndoChange';
import type { ImportMapFileUndoChangeJson } from './importMapFileUndoChange';
import type { MoveMarkerUndoChangeJson } from './moveMarkerUndoChange';
import type { MoveWaypointUndoChangeJson } from './moveWaypointUndoChange';
import type { RemoveMarkerUndoChangeJson } from './removeMarkerUndoChange';
import type { RemoveSegmentUndoChangeJson } from './removeSegmentUndoChange';

export type MapBlockUndoChangeJson =
    | AddSegmentUndoChangeJson
    | RemoveSegmentUndoChangeJson
    | AddMarkerUndoChangeJson
    | RemoveMarkerUndoChangeJson
    | MoveMarkerUndoChangeJson
    | MoveWaypointUndoChangeJson
    | ImportMapFileUndoChangeJson;

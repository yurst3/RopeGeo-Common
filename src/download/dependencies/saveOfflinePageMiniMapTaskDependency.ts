import type { DownloadTaskDependency } from '../types';

export class SaveOfflinePageMiniMapTaskDependency implements DownloadTaskDependency {
    readonly dependencyKind = 'saveOfflinePageMiniMap' as const;
    readonly offlineMiniMapWire: Record<string, unknown>;

    constructor(offlineMiniMapWire: Record<string, unknown>) {
        this.offlineMiniMapWire = offlineMiniMapWire;
    }

    toStoredState(): unknown {
        return {
            dependencyKind: this.dependencyKind,
            offlineMiniMapWire: this.offlineMiniMapWire,
        };
    }

    static fromStoredState(raw: unknown): SaveOfflinePageMiniMapTaskDependency {
        if (raw == null || typeof raw !== 'object') {
            throw new Error('SaveOfflinePageMiniMapTaskDependency must be an object');
        }
        const value = raw as Record<string, unknown>;
        if (value.offlineMiniMapWire == null || typeof value.offlineMiniMapWire !== 'object') {
            throw new Error('SaveOfflinePageMiniMapTaskDependency.offlineMiniMapWire must be an object');
        }
        return new SaveOfflinePageMiniMapTaskDependency(
            value.offlineMiniMapWire as Record<string, unknown>,
        );
    }
}

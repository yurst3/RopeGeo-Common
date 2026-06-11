import { Bounds } from '../../models/minimap/bounds';
import type { DownloadTaskDependency } from '../types';

export class FetchMapboxPackTaskDependency implements DownloadTaskDependency {
    readonly dependencyKind = 'fetchMapboxPack' as const;
    readonly bounds: Bounds;

    constructor(bounds: Bounds) {
        this.bounds = bounds;
    }

    toStoredState(): unknown {
        return {
            dependencyKind: this.dependencyKind,
            bounds: this.bounds,
        };
    }

    static fromStoredState(raw: unknown): FetchMapboxPackTaskDependency {
        if (raw == null || typeof raw !== 'object') {
            throw new Error('FetchMapboxPackTaskDependency must be an object');
        }
        const value = raw as Record<string, unknown>;
        return new FetchMapboxPackTaskDependency(Bounds.fromResult(value.bounds));
    }
}

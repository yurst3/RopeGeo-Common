import type { DownloadTaskDependency } from '../types';

export class SaveOfflinePageViewTaskDependency implements DownloadTaskDependency {
    readonly dependencyKind = 'saveOfflinePageView' as const;
    readonly onlineViewWire: Record<string, unknown>;

    constructor(onlineViewWire: Record<string, unknown>) {
        this.onlineViewWire = onlineViewWire;
    }

    static fromView(view: { toPlain(): Record<string, unknown> }): SaveOfflinePageViewTaskDependency {
        return new SaveOfflinePageViewTaskDependency(view.toPlain());
    }

    toStoredState(): unknown {
        return {
            dependencyKind: this.dependencyKind,
            onlineViewWire: this.onlineViewWire,
        };
    }

    static fromStoredState(raw: unknown): SaveOfflinePageViewTaskDependency {
        if (raw == null || typeof raw !== 'object') {
            throw new Error('SaveOfflinePageViewTaskDependency must be an object');
        }
        const value = raw as Record<string, unknown>;
        if (value.onlineViewWire == null || typeof value.onlineViewWire !== 'object') {
            throw new Error('SaveOfflinePageViewTaskDependency.onlineViewWire must be an object');
        }
        return new SaveOfflinePageViewTaskDependency(value.onlineViewWire as Record<string, unknown>);
    }
}

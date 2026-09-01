import { DownloadDependencyKeys } from '../dependencies/downloadDependencyKeys';
import { FetchMapboxPackTaskDependency } from '../dependencies/fetchMapboxPackTaskDependency';
import { MAPBOX_STYLE_KEYS, type MapboxStyleKey } from '../mapboxStyleKey';
import type { DownloadJobContext, DownloadPlatformHarness, DownloadTaskStoredState, TaskTickResult } from '../types';
import { DownloadTask } from './abstractDownloadTask';

export class FetchMapboxPackTask extends DownloadTask {
    readonly taskKind = 'fetchMapboxPack';
    readonly dependencyKeys = [DownloadDependencyKeys.FetchMapboxPack] as const;
    readonly styleKey: MapboxStyleKey;
    total: number;
    private started: boolean;

    constructor(styleKey: MapboxStyleKey, completed = 0, total = 100, started = false) {
        super(completed);
        this.styleKey = styleKey;
        this.total = total;
        this.started = started;
    }

    async runTick(
        ctx: DownloadJobContext,
        platformHarness: DownloadPlatformHarness,
        _signal: AbortSignal,
    ): Promise<TaskTickResult> {
        this.requireAllDependencies(ctx);
        const dep = this.requireDependency<FetchMapboxPackTaskDependency>(
            ctx,
            DownloadDependencyKeys.FetchMapboxPack,
        );

        if (!this.started) {
            await platformHarness.mapbox.deletePack(ctx.pageId, this.styleKey);
            await platformHarness.mapbox.startPack({
                pageId: ctx.pageId,
                styleKey: this.styleKey,
                styleUrl: ctx.config.mapboxStyleUrls[this.styleKey],
                bounds: dep.bounds,
            });
            this.started = true;
        }

        const progress = await platformHarness.mapbox.getPackProgress(ctx.pageId, this.styleKey);
        const clamped = Math.max(0, Math.min(100, progress));
        this.completed = Math.round(clamped);
        return { done: this.completed >= this.total };
    }

    toStoredState(): DownloadTaskStoredState {
        return {
            taskKind: this.taskKind,
            styleKey: this.styleKey,
            completed: this.completed,
            total: this.total,
            started: this.started,
        };
    }

    static fromStoredState(raw: unknown): FetchMapboxPackTask {
        const value = raw as DownloadTaskStoredState & {
            styleKey?: unknown;
            started?: unknown;
        };
        const styleKey = value.styleKey;
        if (styleKey !== 'standard' && styleKey !== 'satellite') {
            throw new Error(
                `FetchMapboxPackTask styleKey must be "standard" or "satellite", got ${String(styleKey)}`,
            );
        }
        return new FetchMapboxPackTask(
            styleKey,
            value.completed,
            value.total,
            value.started === true,
        );
    }
}

/** One pack download task per basemap style (standard + satellite). */
export function createMapboxPackTasks(): FetchMapboxPackTask[] {
    return MAPBOX_STYLE_KEYS.map((styleKey) => new FetchMapboxPackTask(styleKey));
}

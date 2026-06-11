import { DownloadDependencyKeys } from '../dependencies/downloadDependencyKeys';
import { FetchMapboxPackTaskDependency } from '../dependencies/fetchMapboxPackTaskDependency';
import type { DownloadJobContext, DownloadPlatformHarness, DownloadTaskStoredState, TaskTickResult } from '../types';
import { DownloadTask } from './abstractDownloadTask';

export class FetchMapboxPackTask extends DownloadTask {
    readonly taskKind = 'fetchMapboxPack';
    readonly dependencyKeys = [DownloadDependencyKeys.FetchMapboxPack] as const;
    total: number;
    private started: boolean;

    constructor(completed = 0, total = 100, started = false) {
        super(completed);
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
            await platformHarness.mapbox.deletePack(ctx.pageId);
            await platformHarness.mapbox.startPack({
                pageId: ctx.pageId,
                styleUrl: ctx.config.mapboxStyleUrl,
                bounds: dep.bounds,
            });
            this.started = true;
        }

        const progress = await platformHarness.mapbox.getPackProgress(ctx.pageId);
        const clamped = Math.max(0, Math.min(100, progress));
        this.completed = Math.round(clamped);
        return { done: this.completed >= this.total };
    }

    toStoredState(): DownloadTaskStoredState {
        return {
            taskKind: this.taskKind,
            completed: this.completed,
            total: this.total,
            started: this.started,
        };
    }

    static fromStoredState(raw: unknown): FetchMapboxPackTask {
        const value = raw as DownloadTaskStoredState & { started?: unknown };
        return new FetchMapboxPackTask(
            value.completed,
            value.total,
            value.started === true,
        );
    }
}

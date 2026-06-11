import type {
    DownloadJobContext,
    DownloadPlatformHarness,
    DownloadTaskDependency,
    DownloadTaskStoredState,
    TaskTickResult,
} from '../types';

export abstract class DownloadTask {
    completed: number;
    abstract total: number;
    abstract readonly taskKind: string;
    abstract readonly dependencyKeys: readonly string[];

    constructor(completed = 0) {
        this.completed = completed;
    }

    protected requireDependency<T extends DownloadTaskDependency>(
        ctx: DownloadJobContext,
        key: string,
    ): T {
        const dep = ctx.taskDependencies[key];
        if (dep == null) {
            throw new Error(`${this.constructor.name}: missing dependency "${key}"`);
        }
        return dep as T;
    }

    protected requireAllDependencies(ctx: DownloadJobContext): void {
        for (const key of this.dependencyKeys) {
            if (ctx.taskDependencies[key] == null) {
                throw new Error(`${this.constructor.name}: missing dependency "${key}"`);
            }
        }
    }

    abstract runTick(
        ctx: DownloadJobContext,
        platformHarness: DownloadPlatformHarness,
        signal: AbortSignal,
    ): Promise<TaskTickResult>;

    abstract toStoredState(): DownloadTaskStoredState;
}

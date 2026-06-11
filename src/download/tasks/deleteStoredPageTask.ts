import type { DownloadJobContext } from '../types';
import type { DownloadPlatformHarness } from '../types';
import { DownloadTask } from './abstractDownloadTask';
import type { DownloadTaskStoredState, TaskTickResult } from '../types';

export class DeleteStoredPageTask extends DownloadTask {
    readonly taskKind = 'deleteStoredPage';
    readonly dependencyKeys: readonly string[] = [];
    total: number;

    constructor(completed = 0, total = 1) {
        super(completed);
        this.total = total;
    }

    async runTick(
        ctx: DownloadJobContext,
        platformHarness: DownloadPlatformHarness,
        _signal: AbortSignal,
    ): Promise<TaskTickResult> {
        if (this.completed >= this.total) {
            return { done: true };
        }
        await platformHarness.deletePageBundle(ctx.pageId);
        this.completed = this.total;
        return { done: true };
    }

    toStoredState(): DownloadTaskStoredState {
        return {
            taskKind: this.taskKind,
            completed: this.completed,
            total: this.total,
        };
    }

    static fromStoredState(raw: unknown): DeleteStoredPageTask {
        const value = raw as DownloadTaskStoredState;
        return new DeleteStoredPageTask(value.completed, value.total);
    }
}

import type { DownloadJobContext, DownloadPlatformHarness } from './types';
import type { DownloadTask } from './tasks/abstractDownloadTask';
import { hydrateDownloadTaskFromStoredState } from './helpers/downloadTaskRegistry';

export class DownloadPhase {
    readonly title: string;
    readonly tasks: DownloadTask[];

    constructor(args: { title: string; tasks: DownloadTask[] }) {
        this.title = args.title;
        this.tasks = args.tasks;
    }

    get progressPercent(): number {
        const total = this.tasks.reduce((sum, task) => sum + task.total, 0);
        if (total === 0) {
            return 1;
        }
        const completed = this.tasks.reduce((sum, task) => sum + task.completed, 0);
        return Math.max(0, Math.min(1, completed / total));
    }

    async runTick(
        ctx: DownloadJobContext,
        platformHarness: DownloadPlatformHarness,
        signal: AbortSignal,
    ): Promise<boolean> {
        await Promise.all(
            this.tasks.map((task) => task.runTick(ctx, platformHarness, signal)),
        );
        return this.tasks.every((task) => task.completed >= task.total);
    }

    toStoredState(): { title: string; taskStates: unknown[] } {
        return {
            title: this.title,
            taskStates: this.tasks.map((task) => task.toStoredState()),
        };
    }

    static fromStoredState(raw: unknown): DownloadPhase {
        if (raw == null || typeof raw !== 'object') {
            throw new Error('DownloadPhase stored state must be an object');
        }
        const value = raw as Record<string, unknown>;
        if (typeof value.title !== 'string') {
            throw new Error('DownloadPhase.title must be a string');
        }
        if (!Array.isArray(value.taskStates)) {
            throw new Error('DownloadPhase.taskStates must be an array');
        }
        const tasks = value.taskStates.map((taskState) =>
            hydrateDownloadTaskFromStoredState(taskState),
        );
        return new DownloadPhase({ title: value.title, tasks });
    }
}

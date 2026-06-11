import { httpRequest } from '../../helpers/httpRequest';
import '../../models/api/results/registerAllResultParsers';
import { Result } from '../../models/api/results/result';
import { OnlineRopewikiPageView } from '../../models/pageViews/onlineRopewikiPageView';
import { DownloadDependencyKeys } from '../dependencies/downloadDependencyKeys';
import { FetchPageJsonTaskDependency } from '../dependencies/fetchPageJsonTaskDependency';
import type { DownloadJobContext, DownloadPlatformHarness, DownloadTaskStoredState, TaskTickResult } from '../types';
import { planDownloadPhases } from '../helpers/planDownloadPhases';
import { seedConsumerDependencies } from '../helpers/seedConsumerDependencies';
import { DownloadTask } from './abstractDownloadTask';

function unwrapData(value: unknown): unknown {
    if (
        value != null &&
        typeof value === 'object' &&
        'data' in value &&
        (value as { data: unknown }).data != null
    ) {
        return (value as { data: unknown }).data;
    }
    return value;
}

export class FetchPageJsonTask extends DownloadTask {
    readonly taskKind = 'fetchPageJson';
    readonly dependencyKeys = [DownloadDependencyKeys.FetchPageJson] as const;
    total: number;

    constructor(completed = 0, total = 1) {
        super(completed);
        this.total = total;
    }

    async runTick(
        ctx: DownloadJobContext,
        _platformHarness: DownloadPlatformHarness,
        signal: AbortSignal,
    ): Promise<TaskTickResult> {
        this.requireAllDependencies(ctx);
        if (this.completed >= this.total) {
            return { done: true };
        }

        const dep = this.requireDependency<FetchPageJsonTaskDependency>(
            ctx,
            DownloadDependencyKeys.FetchPageJson,
        );
        const response = await httpRequest(
            dep.pageUrl,
            5,
            signal,
            { method: 'GET', headers: { Accept: 'application/json' } },
            false,
        );
        const text = await response.text();
        const parsedResponse = Result.fromResponseBody(unwrapData(JSON.parse(text) as unknown));
        const view = parsedResponse.result as OnlineRopewikiPageView;
        const appendedPhases = planDownloadPhases(view);
        ctx.appendPhases(appendedPhases);
        const seeded = seedConsumerDependencies(
            view,
            appendedPhases.flatMap((phase) => phase.tasks),
        );
        for (const [key, dependency] of Object.entries(seeded)) {
            ctx.setDependency(key, dependency);
        }

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

    static fromStoredState(raw: unknown): FetchPageJsonTask {
        const value = raw as DownloadTaskStoredState;
        return new FetchPageJsonTask(value.completed, value.total);
    }
}

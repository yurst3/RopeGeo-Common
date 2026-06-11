import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { DownloadJob } from '../../src/download/downloadJob';
import { DownloadPhase } from '../../src/download/downloadPhase';
import { buildDeleteStoredPagePhase } from '../../src/download/helpers/downloadPhaseTitles';
import { InvalidDownloadJobStoredStateError } from '../../src/download/errors';
import { PageViewType } from '../../src/models/pageViews/pageViewType';
import {
    DownloadTask,
} from '../../src/download/tasks/abstractDownloadTask';
import type {
    DownloadJobContext,
    DownloadPlatformHarness,
    DownloadTaskStoredState,
    TaskTickResult,
} from '../../src/download/types';
import {
    createMockPlatformHarness,
    downloadConfig,
    PAGE_ID,
} from './helpers/mockPlatformHarness';

class FailingTask extends DownloadTask {
    readonly taskKind = 'failing';
    readonly dependencyKeys: readonly string[] = [];
    total = 1;

    async runTick(): Promise<TaskTickResult> {
        throw new Error('tick failed');
    }

    toStoredState(): DownloadTaskStoredState {
        return { taskKind: this.taskKind, completed: this.completed, total: this.total };
    }
}

class SlowTask extends DownloadTask {
    readonly taskKind = 'slow';
    readonly dependencyKeys: readonly string[] = [];
    total = 2;

    async runTick(): Promise<TaskTickResult> {
        this.completed += 1;
        return { done: this.completed >= this.total };
    }

    toStoredState(): DownloadTaskStoredState {
        return { taskKind: this.taskKind, completed: this.completed, total: this.total };
    }
}

function minimalJob(phases: DownloadPhase[] = [buildDeleteStoredPagePhase()]): DownloadJob {
    return new DownloadJob({
        pageId: PAGE_ID,
        pageViewType: PageViewType.Ropewiki,
        config: downloadConfig,
        phases,
    });
}

describe('DownloadJob', () => {
    let harness: DownloadPlatformHarness;

    beforeEach(() => {
        harness = createMockPlatformHarness();
    });

    it('runs ticks through phases until success', async () => {
        const job = minimalJob([
            new DownloadPhase({ title: 'slow', tasks: [new SlowTask()] }),
        ]);
        const signal = new AbortController().signal;

        await job.runTick(harness, signal);
        expect(job.state).toBe('running');
        expect(job.currentPhaseIndex).toBe(0);

        await job.runTick(harness, signal);
        expect(job.state).toBe('success');
        expect(job.currentPhaseIndex).toBe(1);
    });

    it('appendPhases increases displayTotal and notifies onChange', () => {
        const job = minimalJob();
        const onChange = jest.fn();
        job.setOnChange(onChange);

        const extraPhase = new DownloadPhase({
            title: 'extra',
            tasks: [new SlowTask()],
        });
        job.appendPhases([extraPhase]);

        expect(job.phases).toHaveLength(2);
        expect(job.toUISnapshot().displayTotal).toBe(2);
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('appendPhases with empty array is a no-op', () => {
        const job = minimalJob();
        const onChange = jest.fn();
        job.setOnChange(onChange);
        job.appendPhases([]);
        expect(onChange).not.toHaveBeenCalled();
    });

    it('abort sets cancelled state', () => {
        const job = minimalJob();
        job.abort();
        expect(job.state).toBe('cancelled');
        expect(job.errorMessage).toBeNull();
    });

    it('abort is ignored when already successful', async () => {
        const job = minimalJob();
        await job.runTick(harness, new AbortController().signal);
        job.abort();
        expect(job.state).toBe('success');
    });

    it('sets error state when a phase tick throws', async () => {
        const job = minimalJob([
            new DownloadPhase({ title: 'fail', tasks: [new FailingTask()] }),
        ]);
        await expect(job.runTick(harness, new AbortController().signal)).rejects.toThrow('tick failed');
        expect(job.state).toBe('error');
        expect(job.errorMessage).toBe('tick failed');
    });

    it('calls config.onProgress when state changes', async () => {
        const onProgress = jest.fn();
        const job = new DownloadJob({
            pageId: PAGE_ID,
            pageViewType: PageViewType.Ropewiki,
            config: { ...downloadConfig, onProgress },
            phases: [buildDeleteStoredPagePhase()],
        });
        await job.runTick(harness, new AbortController().signal);
        expect(onProgress).toHaveBeenCalled();
        const snapshot = onProgress.mock.calls[0]![0] as { pageId: string; state: string };
        expect(snapshot.pageId).toBe(PAGE_ID);
        expect(snapshot.state).toBe('success');
    });

    it('round-trips through stored state', async () => {
        const job = minimalJob();
        await job.runTick(harness, new AbortController().signal);
        const restored = DownloadJob.fromStoredState(job.toStoredState());
        expect(restored.pageId).toBe(job.pageId);
        expect(restored.state).toBe(job.state);
        expect(restored.phases.length).toBe(job.phases.length);
        expect(restored.currentPhaseIndex).toBe(job.currentPhaseIndex);
    });

    it('fromStoredState throws InvalidDownloadJobStoredStateError for invalid input', () => {
        expect(() => DownloadJob.fromStoredState(null)).toThrow(InvalidDownloadJobStoredStateError);
        expect(() => DownloadJob.fromStoredState({ pageId: '' })).toThrow(InvalidDownloadJobStoredStateError);
        expect(() =>
            DownloadJob.fromStoredState({
                pageId: PAGE_ID,
                pageViewType: PageViewType.Ropewiki,
                savedAt: downloadConfig.savedAt,
                mapboxStyleUrl: downloadConfig.mapboxStyleUrl,
                webScraperBaseUrl: downloadConfig.webScraperBaseUrl,
                state: 'invalid-state',
                currentPhaseIndex: 0,
                phases: [buildDeleteStoredPagePhase().toStoredState()],
                taskDependencies: {},
            }),
        ).toThrow(InvalidDownloadJobStoredStateError);
    });
});

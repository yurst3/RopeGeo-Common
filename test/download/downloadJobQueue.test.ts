import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { DownloadJob } from '../../src/download/downloadJob';
import { DownloadJobQueue } from '../../src/download/downloadJobQueue';
import { buildDeleteStoredPagePhase } from '../../src/download/helpers/downloadPhaseTitles';
import type { DownloadJobUISnapshot } from '../../src/download/types';
import type { DownloadJobQueueStoredState } from '../../src/download/types';
import { InvalidDownloadJobStoredStateError } from '../../src/download/errors';
import { PageViewType } from '../../src/models/pageViews/pageViewType';
import {
    createMockPlatformHarness,
    downloadConfig,
    PAGE_ID,
    resetDownloadJobQueueSingleton,
} from './helpers/mockPlatformHarness';

function deleteOnlyJob(): DownloadJob {
    return new DownloadJob({
        pageId: PAGE_ID,
        pageViewType: PageViewType.Ropewiki,
        config: downloadConfig,
        phases: [buildDeleteStoredPagePhase()],
    });
}

describe('DownloadJobQueue', () => {
    beforeEach(() => {
        resetDownloadJobQueueSingleton();
    });

    it('enqueue adds job and notifies subscribers', () => {
        const harness = createMockPlatformHarness();
        const queue = DownloadJobQueue.getInstance(harness);
        const listener = jest.fn<(snapshots: Record<string, DownloadJobUISnapshot>) => void>();
        queue.subscribe(listener);

        queue.enqueue(deleteOnlyJob());
        expect(listener).toHaveBeenCalled();
        const snapshots = listener.mock.calls[listener.mock.calls.length - 1]![0];
        expect(snapshots[PAGE_ID]?.state).toBe('queued');
    });

    it('does not enqueue duplicate job when one is already queued or running', () => {
        const harness = createMockPlatformHarness();
        const queue = DownloadJobQueue.getInstance(harness);
        queue.enqueue(deleteOnlyJob());
        const listener = jest.fn();
        queue.subscribe(listener);
        queue.enqueue(deleteOnlyJob());
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('abort removes job and persists empty store', async () => {
        const harness = createMockPlatformHarness();
        const queue = DownloadJobQueue.getInstance(harness);
        queue.enqueue(deleteOnlyJob());
        queue.abort(PAGE_ID);
        expect(queue.getSnapshots()[PAGE_ID]).toBeUndefined();
        await Promise.resolve();
        expect(harness.saveJobStore).toHaveBeenCalled();
    });

    it('runForegroundTicksWhileActive completes delete-only job', async () => {
        const harness = createMockPlatformHarness();
        const queue = DownloadJobQueue.getInstance(harness);
        const onSuccess = jest.fn<(job: DownloadJob) => Promise<void>>().mockResolvedValue(undefined);
        queue.enqueue(deleteOnlyJob(), onSuccess);

        await queue.runForegroundTicksWhileActive();

        expect(harness.deletePageBundle).toHaveBeenCalledWith(PAGE_ID);
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(queue.getSnapshots()[PAGE_ID]).toBeUndefined();
    });

    it('restoreFromStorage hydrates valid jobs and re-persists cleaned store', async () => {
        const harness = createMockPlatformHarness();
        const job = deleteOnlyJob();
        harness.loadJobStore = jest.fn(async () => ({
            queueOrder: [PAGE_ID],
            jobs: { [PAGE_ID]: job.toStoredState() },
        }));

        const queue = DownloadJobQueue.getInstance(harness);
        await queue.restoreFromStorage();

        expect(queue.getSnapshots()[PAGE_ID]?.state).toBe('queued');
        expect(harness.saveJobStore).toHaveBeenCalled();
    });

    it('restoreFromStorage prunes invalid jobs and reports page ids', async () => {
        const harness = createMockPlatformHarness();
        harness.loadJobStore = jest.fn(async (): Promise<DownloadJobQueueStoredState> => ({
            queueOrder: [PAGE_ID, 'other-page'],
            jobs: {
                [PAGE_ID]: { invalid: true } as unknown as DownloadJobQueueStoredState['jobs'][string],
                'other-page': deleteOnlyJob().toStoredState(),
            },
        }));

        const queue = DownloadJobQueue.getInstance(harness);
        await queue.restoreFromStorage();

        const invalidIds = queue.consumeInvalidStoredDownloadPageIds();
        expect(invalidIds).toContain(PAGE_ID);
        expect(queue.getSnapshots()[PAGE_ID]).toBeUndefined();
        expect(queue.getSnapshots()['other-page']?.state).toBe('queued');
    });

    it('restoreFromStorage skips success and cancelled jobs', async () => {
        const harness = createMockPlatformHarness();
        const successJob = deleteOnlyJob();
        successJob.state = 'success';
        const cancelledJob = new DownloadJob({
            pageId: 'cancelled-page',
            pageViewType: PageViewType.Ropewiki,
            config: downloadConfig,
            phases: [buildDeleteStoredPagePhase()],
            state: 'cancelled',
        });

        harness.loadJobStore = jest.fn(async () => ({
            queueOrder: [PAGE_ID, 'cancelled-page'],
            jobs: {
                [PAGE_ID]: successJob.toStoredState(),
                'cancelled-page': cancelledJob.toStoredState(),
            },
        }));

        const queue = DownloadJobQueue.getInstance(harness);
        await queue.restoreFromStorage();

        expect(Object.keys(queue.getSnapshots())).toHaveLength(0);
    });

    it('runSingleBackgroundTick runs one tick for active job', async () => {
        const harness = createMockPlatformHarness();
        const queue = DownloadJobQueue.getInstance(harness);
        queue.enqueue(deleteOnlyJob());

        await queue.runSingleBackgroundTick();

        expect(harness.deletePageBundle).toHaveBeenCalledWith(PAGE_ID);
        expect(queue.getSnapshots()[PAGE_ID]).toBeUndefined();
    });
});

describe('InvalidDownloadJobStoredStateError', () => {
    it('carries optional pageId', () => {
        const error = new InvalidDownloadJobStoredStateError('bad state', PAGE_ID);
        expect(error.pageId).toBe(PAGE_ID);
        expect(error.name).toBe('InvalidDownloadJobStoredStateError');
    });
});

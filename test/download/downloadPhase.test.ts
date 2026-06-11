import { describe, it, expect } from '@jest/globals';
import { PageViewType } from '../../src/models/pageViews/pageViewType';
import { DownloadPhase } from '../../src/download/downloadPhase';
import { DeleteStoredPageTask } from '../../src/download/tasks/deleteStoredPageTask';
import { FetchMapboxPackTask } from '../../src/download/tasks/fetchMapboxPackTask';
import { createMockPlatformHarness } from './helpers/mockPlatformHarness';

describe('DownloadPhase', () => {
    it('computes progressPercent from task completed/total sums', () => {
        const mapboxTask = new FetchMapboxPackTask(50, 100, true);
        const phase = new DownloadPhase({
            title: 'mapbox',
            tasks: [mapboxTask],
        });
        expect(phase.progressPercent).toBe(0.5);
    });

    it('returns progressPercent 1 when total is 0', () => {
        const phase = new DownloadPhase({
            title: 'empty',
            tasks: [new FetchMapboxPackTask(0, 0, false)],
        });
        expect(phase.progressPercent).toBe(1);
    });

    it('runTick runs all tasks in parallel and returns done when all complete', async () => {
        const harness = createMockPlatformHarness();
        harness.mapbox.getPackProgress = async () => 100;
        const phase = new DownloadPhase({
            title: 'delete',
            tasks: [new DeleteStoredPageTask()],
        });
        const ctx = {
            pageId: 'page-1',
            pageViewType: PageViewType.Ropewiki,
            config: { savedAt: 1, mapboxStyleUrl: 'mapbox://x', webScraperBaseUrl: 'https://api/' },
            taskDependencies: {},
            getDependency: () => {
                throw new Error('not used');
            },
            setDependency: () => undefined,
            appendPhases: () => undefined,
        };
        const done = await phase.runTick(ctx, harness, new AbortController().signal);
        expect(done).toBe(true);
        expect(harness.deletePageBundle).toHaveBeenCalledWith('page-1');
    });

    it('round-trips through stored state', () => {
        const phase = new DownloadPhase({
            title: 'Deleting stored page',
            tasks: [new DeleteStoredPageTask()],
        });
        const restored = DownloadPhase.fromStoredState(phase.toStoredState());
        expect(restored.title).toBe(phase.title);
        expect(restored.tasks[0]?.taskKind).toBe('deleteStoredPage');
    });
});

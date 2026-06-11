import { describe, it, expect, jest } from '@jest/globals';
import { Bounds } from '../../../src/models/minimap/bounds';
import { DownloadDependencyKeys } from '../../../src/download/dependencies/downloadDependencyKeys';
import { PageViewType } from '../../../src/models/pageViews/pageViewType';
import { FetchMapboxPackTaskDependency } from '../../../src/download/dependencies/fetchMapboxPackTaskDependency';
import { FetchMapboxPackTask } from '../../../src/download/tasks/fetchMapboxPackTask';
import type { DownloadJobContext } from '../../../src/download/types';
import { createMockPlatformHarness, downloadConfig, PAGE_ID } from '../helpers/mockPlatformHarness';

describe('FetchMapboxPackTask', () => {
    it('starts pack on first tick and completes when progress reaches 100', async () => {
        let progress = 40;
        const harness = createMockPlatformHarness();
        harness.mapbox.getPackProgress = jest.fn(async () => progress);
        const bounds = Bounds.fromResult({ north: 1, south: 0, east: 1, west: 0 });
        const deps: DownloadJobContext['taskDependencies'] = {
            [DownloadDependencyKeys.FetchMapboxPack]: new FetchMapboxPackTaskDependency(bounds),
        };
        const ctx: DownloadJobContext = {
            pageId: PAGE_ID,
            pageViewType: PageViewType.Ropewiki,
            config: downloadConfig,
            taskDependencies: deps,
            getDependency: (key) => deps[key]!,
            setDependency: (key, dep) => {
                deps[key] = dep;
            },
            appendPhases: () => undefined,
        };
        const task = new FetchMapboxPackTask();
        const signal = new AbortController().signal;

        const first = await task.runTick(ctx, harness, signal);
        expect(first.done).toBe(false);
        expect(harness.mapbox.deletePack).toHaveBeenCalledWith(PAGE_ID);
        expect(harness.mapbox.startPack).toHaveBeenCalledWith({
            pageId: PAGE_ID,
            styleUrl: downloadConfig.mapboxStyleUrl,
            bounds,
        });

        progress = 100;
        const second = await task.runTick(ctx, harness, signal);
        expect(second.done).toBe(true);
        expect(task.completed).toBe(100);
    });

    it('round-trips started flag through stored state', () => {
        const task = new FetchMapboxPackTask(50, 100, true);
        const restored = FetchMapboxPackTask.fromStoredState(task.toStoredState());
        expect(restored.completed).toBe(50);
        expect(restored.total).toBe(100);
    });
});

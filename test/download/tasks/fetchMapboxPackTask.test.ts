import { describe, it, expect, jest } from '@jest/globals';
import { Bounds } from '../../../src/models/minimap/bounds';
import { DownloadDependencyKeys } from '../../../src/download/dependencies/downloadDependencyKeys';
import { PageViewType } from '../../../src/models/pageViews/pageViewType';
import { FetchMapboxPackTaskDependency } from '../../../src/download/dependencies/fetchMapboxPackTaskDependency';
import { FetchMapboxPackTask } from '../../../src/download/tasks/fetchMapboxPackTask';
import type { DownloadJobContext } from '../../../src/download/types';
import { createMockPlatformHarness, downloadConfig, PAGE_ID } from '../helpers/mockPlatformHarness';

function createContext(deps: DownloadJobContext['taskDependencies']): DownloadJobContext {
    return {
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
}

describe('FetchMapboxPackTask', () => {
    it('starts pack on first tick and completes when progress reaches 100', async () => {
        let progress = 40;
        const harness = createMockPlatformHarness();
        harness.mapbox.getPackProgress = jest.fn(async () => progress);
        const bounds = Bounds.fromResult({ north: 1, south: 0, east: 1, west: 0 });
        const deps: DownloadJobContext['taskDependencies'] = {
            [DownloadDependencyKeys.FetchMapboxPack]: new FetchMapboxPackTaskDependency(bounds),
        };
        const ctx = createContext(deps);
        const task = new FetchMapboxPackTask('standard');
        const signal = new AbortController().signal;

        const first = await task.runTick(ctx, harness, signal);
        expect(first.done).toBe(false);
        expect(harness.mapbox.deletePack).toHaveBeenCalledWith(PAGE_ID, 'standard');
        expect(harness.mapbox.startPack).toHaveBeenCalledWith({
            pageId: PAGE_ID,
            styleKey: 'standard',
            styleUrl: downloadConfig.mapboxStyleUrls.standard,
            bounds,
        });

        progress = 100;
        const second = await task.runTick(ctx, harness, signal);
        expect(second.done).toBe(true);
        expect(task.completed).toBe(100);
    });

    it('uses the satellite style URL for satellite styleKey', async () => {
        const harness = createMockPlatformHarness();
        harness.mapbox.getPackProgress = jest.fn(async () => 100);
        const bounds = Bounds.fromResult({ north: 1, south: 0, east: 1, west: 0 });
        const deps: DownloadJobContext['taskDependencies'] = {
            [DownloadDependencyKeys.FetchMapboxPack]: new FetchMapboxPackTaskDependency(bounds),
        };
        const task = new FetchMapboxPackTask('satellite');
        await task.runTick(createContext(deps), harness, new AbortController().signal);
        expect(harness.mapbox.startPack).toHaveBeenCalledWith({
            pageId: PAGE_ID,
            styleKey: 'satellite',
            styleUrl: downloadConfig.mapboxStyleUrls.satellite,
            bounds,
        });
    });

    it('round-trips styleKey and started flag through stored state', () => {
        const task = new FetchMapboxPackTask('satellite', 50, 100, true);
        const restored = FetchMapboxPackTask.fromStoredState(task.toStoredState());
        expect(restored.styleKey).toBe('satellite');
        expect(restored.completed).toBe(50);
        expect(restored.total).toBe(100);
    });
});

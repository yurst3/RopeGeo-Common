import { describe, it, expect } from '@jest/globals';
import '../helpers/preloadDownloadTasks';
import { MiniMapType } from '../../../src/models/minimap/abstract/miniMapType';
import { DownloadDependencyKeys } from '../../../src/download/dependencies/downloadDependencyKeys';
import { SaveOfflinePageViewTaskDependency } from '../../../src/download/dependencies/saveOfflinePageViewTaskDependency';
import { OnlineRopewikiPageView } from '../../../src/models/pageViews/onlineRopewikiPageView';
import { PageViewType } from '../../../src/models/pageViews/pageViewType';
import type { DownloadJobContext } from '../../../src/download/types';
import { SaveOfflinePageTask } from '../../../src/download/tasks/saveOfflinePageTask';
import {
    createMockPlatformHarness,
    downloadConfig,
    PAGE_ID,
} from '../helpers/mockPlatformHarness';

function minimalOnlineViewWire(): Record<string, unknown> {
    return {
        id: PAGE_ID,
        routeType: 'Canyon',
        pageViewType: 'ropewiki',
        fetchType: 'online',
        name: 'Test Page',
        aka: [],
        url: 'https://ropewiki.com/page',
        quality: 4,
        userVotes: 10,
        regions: [{ id: 'a1b2c3d4-e29b-41d4-a716-446655440099', name: 'Region' }],
        difficulty: { technical: null, water: null, time: null, additionalRisk: null },
        permit: null,
        rappelCount: null,
        jumps: null,
        vehicle: null,
        rappelLongest: null,
        shuttleTime: null,
        overallLength: null,
        descentLength: null,
        exitLength: null,
        approachLength: null,
        overallTime: null,
        approachTime: null,
        descentTime: null,
        exitTime: null,
        approachElevGain: null,
        descentElevGain: null,
        exitElevGain: null,
        months: [],
        latestRevisionDate: '2024-01-01T00:00:00.000Z',
        mapDataId: null,
        bannerImage: null,
        betaSections: [],
        miniMap: null,
        coordinates: null,
    };
}

describe('SaveOfflinePageTask', () => {
    it('writes offline page JSON and sets route previews', async () => {
        const harness = createMockPlatformHarness();
        const view = OnlineRopewikiPageView.fromResult(minimalOnlineViewWire());
        const deps: DownloadJobContext['taskDependencies'] = {
            [DownloadDependencyKeys.SaveOfflinePageView]: SaveOfflinePageViewTaskDependency.fromView(view),
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
        const task = new SaveOfflinePageTask([DownloadDependencyKeys.SaveOfflinePageView]);
        const result = await task.runTick(ctx, harness, new AbortController().signal);

        expect(result.done).toBe(true);
        expect(harness.writeTextFile).toHaveBeenCalledWith(
            harness.paths.pageJson(PAGE_ID),
            expect.stringContaining('"fetchType":"offline"'),
        );
        expect(harness.setRoutePreviewsForPage).toHaveBeenCalledWith(
            PAGE_ID,
            expect.arrayContaining([expect.objectContaining({ id: PAGE_ID })]),
        );
    });

    it('round-trips dependency keys through stored state', () => {
        const keys = [DownloadDependencyKeys.SaveOfflinePageView];
        const task = new SaveOfflinePageTask(keys);
        const restored = SaveOfflinePageTask.fromStoredState(task.toStoredState());
        expect(restored.dependencyKeys).toEqual(keys);
    });
});

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('../../../src/helpers/httpRequest', () => ({
    httpRequest: jest.fn(),
}));

import '../helpers/preloadDownloadTasks';
import { MiniMapType } from '../../../src/models/minimap/abstract/miniMapType';
import { DownloadDependencyKeys } from '../../../src/download/dependencies/downloadDependencyKeys';
import { FetchPageJsonTaskDependency } from '../../../src/download/dependencies/fetchPageJsonTaskDependency';
import { FetchPageJsonTask } from '../../../src/download/tasks/fetchPageJsonTask';
import { PageViewType } from '../../../src/models/pageViews/pageViewType';
import type { DownloadJobContext } from '../../../src/download/types';
import {
    createMockPlatformHarness,
    downloadConfig,
    MAP_DATA_ID,
    PAGE_ID,
} from '../helpers/mockPlatformHarness';
import { httpRequest } from '../../../src/helpers/httpRequest';

const mockHttpRequest = jest.mocked(httpRequest);

function pageJson(): Record<string, unknown> {
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
        mapDataId: MAP_DATA_ID,
        bannerImage: null,
        betaSections: [],
        miniMap: {
            miniMapType: MiniMapType.Page,
            fetchType: 'online',
            title: 'Map',
            polyLineLayerId: 'PolyLines',
            pointLayerId: 'Points',
            onlineTilesTemplate: 'https://x/{z}/{x}/{y}.pbf',
            bounds: { north: 1, south: 0, east: 1, west: 0 },
            tileCount: 0,
            tileTotalBytes: 0,
        },
        coordinates: null,
    };
}

describe('FetchPageJsonTask', () => {
    beforeEach(() => {
        mockHttpRequest.mockReset();
    });

    it('fetches page JSON, appends phases, and seeds dependencies', async () => {
        mockHttpRequest.mockResolvedValue({
            text: async () =>
                JSON.stringify({
                    resultType: 'ropewikiPageView',
                    result: pageJson(),
                }),
        } as Response);

        const harness = createMockPlatformHarness();
        const appendedPhases: unknown[] = [];
        const deps: DownloadJobContext['taskDependencies'] = {
            [DownloadDependencyKeys.FetchPageJson]: new FetchPageJsonTaskDependency(
                PAGE_ID,
                PageViewType.Ropewiki,
                'https://api.example.com/ropewiki/page/' + PAGE_ID,
            ),
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
            appendPhases: (phases) => {
                appendedPhases.push(...phases);
            },
        };
        const task = new FetchPageJsonTask();
        const result = await task.runTick(ctx, harness, new AbortController().signal);

        expect(result.done).toBe(true);
        expect(mockHttpRequest).toHaveBeenCalledWith(
            expect.stringContaining(PAGE_ID),
            5,
            expect.any(AbortSignal),
            expect.objectContaining({ method: 'GET' }),
            false,
        );
        expect(appendedPhases.length).toBeGreaterThan(0);
        expect(deps[DownloadDependencyKeys.SaveOfflinePageView]).toBeDefined();
    });

    it('round-trips stored state', () => {
        const task = new FetchPageJsonTask(1, 1);
        const restored = FetchPageJsonTask.fromStoredState(task.toStoredState());
        expect(restored.completed).toBe(1);
        expect(restored.total).toBe(1);
    });
});

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('../../../src/download/helpers/downloadHttpRequest', () => ({
    downloadHttpRequest: jest.fn(),
}));

import '../helpers/preloadDownloadTasks';
import { RoutesParams } from '../../../src/models/api/params/routesParams';
import { PaginationResultType } from '../../../src/models/api/results/paginationResults';
import { RouteType } from '../../../src/models/routes/routeType';
import { DownloadDependencyKeys } from '../../../src/download/dependencies/downloadDependencyKeys';
import { FetchRegionRouteListTaskDependency } from '../../../src/download/dependencies/fetchRegionRouteListTaskDependency';
import { SaveOfflinePageMiniMapTaskDependency } from '../../../src/download/dependencies/saveOfflinePageMiniMapTaskDependency';
import { FetchRegionRouteListTask } from '../../../src/download/tasks/fetchRegionRouteListTask';
import { PageViewType } from '../../../src/models/pageViews/pageViewType';
import type { DownloadJobContext } from '../../../src/download/types';
import {
    createMockPlatformHarness,
    downloadConfig,
    PAGE_ID,
    REGION_ID,
} from '../helpers/mockPlatformHarness';
import { downloadHttpRequest } from '../../../src/download/helpers/downloadHttpRequest';

const mockDownloadHttpRequest = jest.mocked(downloadHttpRequest);

function routeFeature(id: string): Record<string, unknown> {
    return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [-111.5, 40.1] },
        properties: { id, name: `Route ${id}`, type: RouteType.Canyon },
    };
}

function routesResponse(features: Record<string, unknown>[], total = features.length): Response {
    return {
        text: async () =>
            JSON.stringify({
                resultType: PaginationResultType.Route,
                results: features,
                total,
                page: 1,
            }),
    } as Response;
}

describe('FetchRegionRouteListTask', () => {
    beforeEach(() => {
        mockDownloadHttpRequest.mockReset();
    });

    it('completes immediately when routeCount is 0', async () => {
        const harness = createMockPlatformHarness();
        const routesParams = RoutesParams.fromResult(
            { region: { id: REGION_ID, name: 'Region', source: 'ropewiki' }, limit: 50 },
            true,
        );
        const deps: DownloadJobContext['taskDependencies'] = {
            [DownloadDependencyKeys.FetchRegionRouteList]: new FetchRegionRouteListTaskDependency({
                routesParams,
                routeCount: 0,
                totalBytes: 0,
                regionId: REGION_ID,
                centeredRouteId: PAGE_ID,
                miniMapTitle: 'Routes',
            }),
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
        const task = new FetchRegionRouteListTask(0);
        const result = await task.runTick(ctx, harness, new AbortController().signal);
        expect(result.done).toBe(true);
        expect(mockDownloadHttpRequest).not.toHaveBeenCalled();
        expect(harness.writeTextFile).toHaveBeenCalled();
        expect(deps[DownloadDependencyKeys.SaveOfflinePageMiniMap]).toBeDefined();
    });

    it('fetches routes and writes geojson for centered region minimap', async () => {
        mockDownloadHttpRequest.mockResolvedValue(routesResponse([routeFeature('route-1')]));
        const harness = createMockPlatformHarness();
        const routesParams = RoutesParams.fromResult(
            { region: { id: REGION_ID, name: 'Region', source: 'ropewiki' }, limit: 50 },
            true,
        );
        const deps: DownloadJobContext['taskDependencies'] = {
            [DownloadDependencyKeys.FetchRegionRouteList]: new FetchRegionRouteListTaskDependency({
                routesParams,
                routeCount: 1,
                totalBytes: 500,
                regionId: REGION_ID,
                centeredRouteId: PAGE_ID,
                miniMapTitle: 'Routes',
            }),
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
        const task = new FetchRegionRouteListTask(1);
        const result = await task.runTick(ctx, harness, new AbortController().signal);
        expect(result.done).toBe(true);
        expect(mockDownloadHttpRequest).toHaveBeenCalledTimes(1);
        const miniMapDep = deps[DownloadDependencyKeys.SaveOfflinePageMiniMap] as SaveOfflinePageMiniMapTaskDependency;
        expect(miniMapDep.offlineMiniMapWire.miniMapType).toBe('centeredRegion');
    });
});

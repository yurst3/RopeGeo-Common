import { downloadHttpRequest } from '../helpers/downloadHttpRequest';
import '../../models/api/results/registerAllResultParsers';
import { PaginationResults } from '../../models/api/results/paginationResults';
import { RoutesGeojson } from '../../models/api/results/routeGeojson';
import { OfflineRegionMiniMap } from '../../models/minimap/concrete/offlineRegionMiniMap';
import { OnlineCenteredRegionMiniMap } from '../../models/minimap/concrete/onlineCenteredRegionMiniMap';
import { RouteGeoJsonFeature } from '../../models/routes/routeGeoJsonFeature';
import { DownloadDependencyKeys } from '../dependencies/downloadDependencyKeys';
import { FetchRegionRouteListTaskDependency } from '../dependencies/fetchRegionRouteListTaskDependency';
import { SaveOfflinePageMiniMapTaskDependency } from '../dependencies/saveOfflinePageMiniMapTaskDependency';
import { REGION_PAGES_PER_CHUNK } from '../helpers/downloadConstants';
import type { DownloadJobContext, DownloadPlatformHarness, DownloadTaskStoredState, TaskTickResult } from '../types';
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

export class FetchRegionRouteListTask extends DownloadTask {
    readonly taskKind = 'fetchRegionRouteList';
    readonly dependencyKeys = [DownloadDependencyKeys.FetchRegionRouteList] as const;
    total: number;

    constructor(total: number, completed = 0) {
        super(completed);
        this.total = total;
    }

    async runTick(
        ctx: DownloadJobContext,
        platformHarness: DownloadPlatformHarness,
        signal: AbortSignal,
    ): Promise<TaskTickResult> {
        this.requireAllDependencies(ctx);
        const dep = this.requireDependency<FetchRegionRouteListTaskDependency>(
            ctx,
            DownloadDependencyKeys.FetchRegionRouteList,
        );

        if (dep.routeCount === 0) {
            this.completed = 0;
            await this.publishMiniMap(ctx, platformHarness, dep, []);
            return { done: true };
        }

        const firstPage = await this.fetchPage(ctx, dep, 1, signal);
        const byPage = new Map<number, RouteGeoJsonFeature[]>([[1, firstPage.results]]);
        const total = firstPage.total;
        const lastPage = Math.max(1, Math.ceil(total / dep.routesParams.limit));

        for (let page = 2; page <= lastPage; page += REGION_PAGES_PER_CHUNK) {
            const chunk: number[] = [];
            for (
                let current = page;
                current < page + REGION_PAGES_PER_CHUNK && current <= lastPage;
                current += 1
            ) {
                chunk.push(current);
            }
            const results = await Promise.all(
                chunk.map((pageNumber) => this.fetchPage(ctx, dep, pageNumber, signal)),
            );
            results.forEach((result, index) => {
                byPage.set(chunk[index], result.results);
            });
        }

        const features = [...byPage.keys()]
            .sort((a, b) => a - b)
            .flatMap((pageNumber) => byPage.get(pageNumber) ?? []);
        this.total = Math.max(this.total, total);
        this.completed = Math.min(features.length, this.total);
        await this.publishMiniMap(ctx, platformHarness, dep, features);
        return { done: true };
    }

    private async publishMiniMap(
        ctx: DownloadJobContext,
        platformHarness: DownloadPlatformHarness,
        dep: FetchRegionRouteListTaskDependency,
        features: RouteGeoJsonFeature[],
    ): Promise<void> {
        const destPath = platformHarness.paths.regionGeojson(ctx.pageId, dep.regionId);
        await platformHarness.ensureParentDir(destPath);
        const geojson = new RoutesGeojson(features);
        await platformHarness.writeTextFile(
            destPath,
            JSON.stringify({ type: geojson.type, features: geojson.features }),
        );

        const offlineMiniMapWire =
            dep.centeredRouteId != null
                ? new OnlineCenteredRegionMiniMap(
                      dep.routesParams,
                      dep.centeredRouteId,
                      dep.miniMapTitle,
                      dep.routeCount,
                      dep.totalBytes,
                  )
                      .toOffline(destPath)
                      .toPlain()
                : new OfflineRegionMiniMap(destPath, null, dep.miniMapTitle).toPlain();
        ctx.setDependency(
            DownloadDependencyKeys.SaveOfflinePageMiniMap,
            new SaveOfflinePageMiniMapTaskDependency(offlineMiniMapWire),
        );
    }

    private async fetchPage(
        ctx: DownloadJobContext,
        dep: FetchRegionRouteListTaskDependency,
        page: number,
        signal: AbortSignal,
    ): Promise<{ results: RouteGeoJsonFeature[]; total: number }> {
        const params = dep.routesParams.withPage(page);
        const query = params.toQueryString();
        const url = new URL(query.length > 0 ? `/routes?${query}` : '/routes', ctx.config.webScraperBaseUrl);
        const response = await downloadHttpRequest(url.toString(), signal, {
            method: 'GET',
            headers: { Accept: 'application/json' },
        });
        const text = await response.text();
        const parsed = PaginationResults.fromResponseBody(unwrapData(JSON.parse(text) as unknown));
        const results = parsed.results.map((item) => RouteGeoJsonFeature.fromResult(item));
        return { results, total: parsed.total };
    }

    toStoredState(): DownloadTaskStoredState {
        return {
            taskKind: this.taskKind,
            completed: this.completed,
            total: this.total,
        };
    }

    static fromStoredState(raw: unknown): FetchRegionRouteListTask {
        const value = raw as DownloadTaskStoredState;
        return new FetchRegionRouteListTask(value.total, value.completed);
    }
}

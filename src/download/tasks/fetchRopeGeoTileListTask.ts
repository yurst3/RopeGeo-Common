import { httpRequest } from '../../helpers/httpRequest';
import '../../models/api/results/registerAllResultParsers';
import { PaginationResults } from '../../models/api/results/paginationResults';
import { DownloadDependencyKeys } from '../dependencies/downloadDependencyKeys';
import { FetchRopeGeoTileFilesTaskDependency } from '../dependencies/fetchRopeGeoTileFilesTaskDependency';
import { FetchRopeGeoTileListTaskDependency } from '../dependencies/fetchRopeGeoTileListTaskDependency';
import { LIST_HTTP_BATCH_SIZE } from '../helpers/downloadConstants';
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

type TileListPage = {
    urls: string[];
    total: number;
    totalBytes: number;
};

export class FetchRopeGeoTileListTask extends DownloadTask {
    readonly taskKind = 'fetchRopeGeoTileList';
    readonly dependencyKeys = [DownloadDependencyKeys.FetchRopeGeoTileList] as const;
    total: number;

    constructor(total: number, completed = 0) {
        super(completed);
        this.total = total;
    }

    async runTick(
        ctx: DownloadJobContext,
        _platformHarness: DownloadPlatformHarness,
        signal: AbortSignal,
    ): Promise<TaskTickResult> {
        this.requireAllDependencies(ctx);
        const dep = this.requireDependency<FetchRopeGeoTileListTaskDependency>(
            ctx,
            DownloadDependencyKeys.FetchRopeGeoTileList,
        );

        if (dep.tileCount === 0) {
            this.completed = 0;
            ctx.setDependency(
                DownloadDependencyKeys.FetchRopeGeoTileFiles,
                new FetchRopeGeoTileFilesTaskDependency({
                    mapDataId: dep.mapDataId,
                    tileUrls: [],
                    tileTotalBytes: dep.tileTotalBytes,
                    pageMiniMapWire: dep.pageMiniMapWire,
                }),
            );
            return { done: true };
        }

        const firstPage = await this.fetchPage(ctx, dep, 1, signal);
        const pageMap = new Map<number, TileListPage>([[1, firstPage]]);
        const lastPage = Math.max(1, Math.ceil(firstPage.total / dep.listPageLimit));

        for (let page = 2; page <= lastPage; page += LIST_HTTP_BATCH_SIZE) {
            const chunkPages: number[] = [];
            for (
                let current = page;
                current < page + LIST_HTTP_BATCH_SIZE && current <= lastPage;
                current += 1
            ) {
                chunkPages.push(current);
            }
            const results = await Promise.all(
                chunkPages.map((pageNumber) => this.fetchPage(ctx, dep, pageNumber, signal)),
            );
            results.forEach((result, index) => {
                pageMap.set(chunkPages[index], result);
            });
        }

        const sortedPages = [...pageMap.keys()].sort((a, b) => a - b);
        const urls = sortedPages.flatMap((pageNumber) => pageMap.get(pageNumber)?.urls ?? []);
        this.total = Math.max(this.total, firstPage.total);
        this.completed = Math.min(urls.length, this.total);

        ctx.setDependency(
            DownloadDependencyKeys.FetchRopeGeoTileFiles,
            new FetchRopeGeoTileFilesTaskDependency({
                mapDataId: dep.mapDataId,
                tileUrls: urls,
                tileTotalBytes: firstPage.totalBytes,
                pageMiniMapWire: dep.pageMiniMapWire,
            }),
        );
        return { done: true };
    }

    private async fetchPage(
        ctx: DownloadJobContext,
        dep: FetchRopeGeoTileListTaskDependency,
        page: number,
        signal: AbortSignal,
    ): Promise<TileListPage> {
        const url = new URL(
            `/mapdata/${encodeURIComponent(dep.mapDataId)}/tiles`,
            ctx.config.webScraperBaseUrl,
        );
        url.searchParams.set('page', String(page));
        url.searchParams.set('limit', String(dep.listPageLimit));
        const response = await httpRequest(
            url.toString(),
            5,
            signal,
            { method: 'GET', headers: { Accept: 'application/json' } },
            false,
        );
        const text = await response.text();
        const parsedBody = unwrapData(JSON.parse(text) as unknown);
        const pageResult = PaginationResults.fromResponseBody(parsedBody);
        const urls = pageResult.results.map((item) => {
            if (typeof item !== 'string') {
                throw new Error('Map data tile list response contains non-string tile URL');
            }
            return item;
        });
        return {
            urls,
            total: pageResult.total,
            totalBytes: pageResult.totalBytes ?? dep.tileTotalBytes,
        };
    }

    toStoredState(): DownloadTaskStoredState {
        return {
            taskKind: this.taskKind,
            completed: this.completed,
            total: this.total,
        };
    }

    static fromStoredState(raw: unknown): FetchRopeGeoTileListTask {
        const value = raw as DownloadTaskStoredState;
        return new FetchRopeGeoTileListTask(value.total, value.completed);
    }
}

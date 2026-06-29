import { MiniMapType } from '../../models/minimap/abstract/miniMapType';
import { OfflinePageMiniMap } from '../../models/minimap/concrete/offlinePageMiniMap';
import { OfflineRopewikiPageView } from '../../models/pageViews/offlineRopewikiPageView';
import { DownloadDependencyKeys } from '../dependencies/downloadDependencyKeys';
import { FetchDownloadFolderTaskDependency } from '../dependencies/fetchDownloadFolderTaskDependency';
import type { DownloadJobContext, DownloadPlatformHarness, DownloadTaskStoredState, TaskTickResult } from '../types';
import { DownloadTask } from './abstractDownloadTask';

export class FetchDownloadFolderTask extends DownloadTask {
    readonly taskKind = 'fetchDownloadFolder';
    readonly dependencyKeys = [DownloadDependencyKeys.FetchDownloadFolder] as const;
    total: number;

    constructor(completed = 0, total = 1) {
        super(completed);
        this.total = total;
    }

    async runTick(
        ctx: DownloadJobContext,
        platformHarness: DownloadPlatformHarness,
        _signal: AbortSignal,
    ): Promise<TaskTickResult> {
        this.requireAllDependencies(ctx);
        if (this.completed >= this.total) {
            return { done: true };
        }

        const dep = this.requireDependency<FetchDownloadFolderTaskDependency>(
            ctx,
            DownloadDependencyKeys.FetchDownloadFolder,
        );

        await this.downloadExtractAndHydrate(ctx, platformHarness, dep);
        if (!dep.parallelMapbox) {
            await this.maybeAppendMapboxPhaseAfterExtract(ctx, platformHarness);
        }
        this.completed = this.total;
        return { done: true };
    }

    private async downloadExtractAndHydrate(
        ctx: DownloadJobContext,
        platformHarness: DownloadPlatformHarness,
        dep: FetchDownloadFolderTaskDependency,
    ): Promise<void> {
        const pageRoot = platformHarness.paths.pageRoot(ctx.pageId);
        const zipPath = platformHarness.paths.zipTemp(ctx.pageId);
        await platformHarness.downloadFile({
            url: dep.downloadFolderUrl,
            destPath: zipPath,
            background: true,
        });
        await platformHarness.extractZipArchive({ zipPath, destRoot: pageRoot });
        const jsonPath = platformHarness.paths.pageJson(ctx.pageId);
        const rawJson = await platformHarness.readTextFile(jsonPath);
        const offlineView = OfflineRopewikiPageView.fromResult(
            JSON.parse(rawJson) as unknown,
            pageRoot,
        );
        await platformHarness.writeTextFile(jsonPath, JSON.stringify(offlineView));
        await platformHarness.setRoutePreviewsForPage(ctx.pageId, [offlineView.toPagePreview()]);
    }

    private async maybeAppendMapboxPhaseAfterExtract(
        ctx: DownloadJobContext,
        platformHarness: DownloadPlatformHarness,
    ): Promise<void> {
        const jsonPath = platformHarness.paths.pageJson(ctx.pageId);
        const jsonText = await platformHarness.readTextFile(jsonPath);
        const offlineView = OfflineRopewikiPageView.fromResult(JSON.parse(jsonText) as unknown);
        const miniMap = offlineView.miniMap;
        if (miniMap == null || miniMap.miniMapType !== MiniMapType.Page) {
            return;
        }
        const pageMiniMap = miniMap as OfflinePageMiniMap;
        const [
            { DownloadPhase },
            { FetchMapboxPackTask },
            { FetchMapboxPackTaskDependency },
            { titleForPhase },
        ] = await Promise.all([
            import('../downloadPhase'),
            import('./fetchMapboxPackTask'),
            import('../dependencies/fetchMapboxPackTaskDependency'),
            import('../helpers/downloadPhaseTitles'),
        ]);
        const mapboxTask = new FetchMapboxPackTask();
        ctx.appendPhases([
            new DownloadPhase({
                title: titleForPhase([mapboxTask]),
                tasks: [mapboxTask],
            }),
        ]);
        ctx.setDependency(
            DownloadDependencyKeys.FetchMapboxPack,
            new FetchMapboxPackTaskDependency(pageMiniMap.bounds),
        );
    }

    toStoredState(): DownloadTaskStoredState {
        return {
            taskKind: this.taskKind,
            completed: this.completed,
            total: this.total,
        };
    }

    static fromStoredState(raw: unknown): FetchDownloadFolderTask {
        const value = raw as DownloadTaskStoredState;
        return new FetchDownloadFolderTask(value.completed, value.total);
    }
}

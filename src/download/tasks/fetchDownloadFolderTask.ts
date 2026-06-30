import { PageView } from '../../models/pageViews/pageView';
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

        await this.downloadExtractAndConvert(ctx, platformHarness, dep);
        if (!dep.parallelMapbox) {
            await this.maybeAppendMapboxPhaseAfterExtract(ctx, platformHarness);
        }
        this.completed = this.total;
        return { done: true };
    }

    private async downloadExtractAndConvert(
        ctx: DownloadJobContext,
        platformHarness: DownloadPlatformHarness,
        _dep: FetchDownloadFolderTaskDependency,
    ): Promise<void> {
        const pageRoot = platformHarness.paths.pageRoot(ctx.pageId);
        const zipPath = platformHarness.paths.zipTemp(ctx.pageId);
        await platformHarness.downloadFile({
            url: _dep.downloadFolderUrl,
            destPath: zipPath,
            background: true,
        });
        await platformHarness.extractZipArchive({ zipPath, destRoot: pageRoot });
        const jsonPath = platformHarness.paths.pageJson(ctx.pageId);
        const rawJson = await platformHarness.readTextFile(jsonPath);
        const onlineView = PageView.fromResult(JSON.parse(rawJson) as unknown);
        const offlineView = await onlineView.toOfflineFromExtractedBundle(pageRoot, platformHarness);
        await platformHarness.writeTextFile(jsonPath, JSON.stringify(offlineView));
        await platformHarness.setRoutePreviewsForPage(ctx.pageId, [
            offlineView.toPagePreview(),
        ]);
    }

    private async maybeAppendMapboxPhaseAfterExtract(
        ctx: DownloadJobContext,
        platformHarness: DownloadPlatformHarness,
    ): Promise<void> {
        const jsonPath = platformHarness.paths.pageJson(ctx.pageId);
        const jsonText = await platformHarness.readTextFile(jsonPath);
        const offlineView = PageView.fromOfflineResult(JSON.parse(jsonText) as unknown);
        const bounds = offlineView.getMapboxPackBounds();
        if (bounds == null) {
            return;
        }
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
            new FetchMapboxPackTaskDependency(bounds),
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

import { ImageVersions } from '../../models/mobile/imageVersions';
import { MiniMapType } from '../../models/minimap/abstract/miniMapType';
import { OfflineCenteredRegionMiniMap } from '../../models/minimap/concrete/offlineCenteredRegionMiniMap';
import { OfflinePageMiniMap } from '../../models/minimap/concrete/offlinePageMiniMap';
import { OnlineRopewikiPageView } from '../../models/pageViews/onlineRopewikiPageView';
import { DownloadDependencyKeys } from '../dependencies/downloadDependencyKeys';
import { SaveOfflinePageImagesTaskDependency } from '../dependencies/saveOfflinePageImagesTaskDependency';
import { SaveOfflinePageMiniMapTaskDependency } from '../dependencies/saveOfflinePageMiniMapTaskDependency';
import { SaveOfflinePageViewTaskDependency } from '../dependencies/saveOfflinePageViewTaskDependency';
import type { DownloadJobContext, DownloadPlatformHarness, DownloadTaskStoredState, TaskTickResult } from '../types';
import { DownloadTask } from './abstractDownloadTask';

export class SaveOfflinePageTask extends DownloadTask {
    readonly taskKind = 'saveOfflinePage';
    total: number;
    readonly dependencyKeys: readonly string[];

    constructor(dependencyKeys: readonly string[], completed = 0, total = 1) {
        super(completed);
        this.dependencyKeys = dependencyKeys;
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

        const viewDep = this.requireDependency<SaveOfflinePageViewTaskDependency>(
            ctx,
            DownloadDependencyKeys.SaveOfflinePageView,
        );
        const onlineView = OnlineRopewikiPageView.fromResult(viewDep.onlineViewWire);
        const downloadedImages = this.getDownloadedImages(ctx);
        const offlineMiniMap = this.getOfflineMiniMapIfPresent(ctx);
        const offlineView = onlineView.toOffline(downloadedImages, offlineMiniMap);

        const pageJsonPath = platformHarness.paths.pageJson(ctx.pageId);
        await platformHarness.ensureParentDir(pageJsonPath);
        await platformHarness.writeTextFile(pageJsonPath, JSON.stringify(offlineView));
        await platformHarness.setRoutePreviewsForPage(ctx.pageId, [offlineView.toPagePreview()]);

        this.completed = this.total;
        return { done: true };
    }

    private getDownloadedImages(
        ctx: DownloadJobContext,
    ): Record<string, ImageVersions> {
        if (!this.dependencyKeys.includes(DownloadDependencyKeys.SaveOfflinePageImages)) {
            return {};
        }
        const dep = this.requireDependency<SaveOfflinePageImagesTaskDependency>(
            ctx,
            DownloadDependencyKeys.SaveOfflinePageImages,
        );
        const out: Record<string, ImageVersions> = {};
        for (const [imageId, versions] of Object.entries(dep.downloadedImages)) {
            out[imageId] = ImageVersions.fromResult(versions);
        }
        return out;
    }

    private getOfflineMiniMapIfPresent(
        ctx: DownloadJobContext,
    ): OfflinePageMiniMap | OfflineCenteredRegionMiniMap | null {
        if (!this.dependencyKeys.includes(DownloadDependencyKeys.SaveOfflinePageMiniMap)) {
            return null;
        }
        const dep = this.requireDependency<SaveOfflinePageMiniMapTaskDependency>(
            ctx,
            DownloadDependencyKeys.SaveOfflinePageMiniMap,
        );
        const miniMapType = dep.offlineMiniMapWire.miniMapType;
        if (miniMapType === MiniMapType.Page) {
            return OfflinePageMiniMap.fromResult(dep.offlineMiniMapWire);
        }
        if (miniMapType === MiniMapType.CenteredRegion) {
            return OfflineCenteredRegionMiniMap.fromResult(dep.offlineMiniMapWire);
        }
        throw new Error('SaveOfflinePageTask: unsupported offline minimap wire payload');
    }

    toStoredState(): DownloadTaskStoredState {
        return {
            taskKind: this.taskKind,
            completed: this.completed,
            total: this.total,
            dependencyKeys: [...this.dependencyKeys],
        };
    }

    static fromStoredState(raw: unknown): SaveOfflinePageTask {
        const value = raw as DownloadTaskStoredState & { dependencyKeys?: unknown };
        if (!Array.isArray(value.dependencyKeys) || value.dependencyKeys.some((key) => typeof key !== 'string')) {
            throw new Error('SaveOfflinePageTask.dependencyKeys must be string[]');
        }
        return new SaveOfflinePageTask(value.dependencyKeys as string[], value.completed, value.total);
    }
}

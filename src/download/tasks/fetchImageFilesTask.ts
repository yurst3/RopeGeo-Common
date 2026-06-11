import { ImageVersion } from '../../models/mobile/imageVersions';
import { DownloadDependencyKeys } from '../dependencies/downloadDependencyKeys';
import { FetchImageFilesTaskDependency } from '../dependencies/fetchImageFilesTaskDependency';
import { SaveOfflinePageImagesTaskDependency } from '../dependencies/saveOfflinePageImagesTaskDependency';
import { TILE_FILE_BATCH_SIZE } from '../helpers/downloadConstants';
import type {
    DownloadJobContext,
    DownloadPlatformHarness,
    DownloadTaskStoredState,
    FetchImageFilesSlot,
    TaskTickResult,
} from '../types';
import { DownloadTask } from './abstractDownloadTask';

function extFromUrl(url: string): string {
    try {
        const pathname = new URL(url).pathname;
        const dot = pathname.lastIndexOf('.');
        if (dot >= 0 && dot < pathname.length - 1) {
            return pathname.slice(dot);
        }
    } catch {
        // Ignore URL parse failures and use fallback extension.
    }
    return '.bin';
}

type StoredDownloadedImages = Record<string, Partial<Record<ImageVersion, string | null>>>;

export class FetchImageFilesTask extends DownloadTask {
    readonly taskKind = 'fetchImageFiles';
    readonly dependencyKeys = [DownloadDependencyKeys.FetchImageFiles] as const;
    total: number;
    private cursor: number;
    private downloadedImages: StoredDownloadedImages;

    constructor(args: { total: number; completed?: number; cursor?: number; downloadedImages?: StoredDownloadedImages }) {
        super(args.completed ?? 0);
        this.total = args.total;
        this.cursor = args.cursor ?? 0;
        this.downloadedImages = args.downloadedImages ?? {};
    }

    async runTick(
        ctx: DownloadJobContext,
        platformHarness: DownloadPlatformHarness,
        signal: AbortSignal,
    ): Promise<TaskTickResult> {
        this.requireAllDependencies(ctx);
        const dep = this.requireDependency<FetchImageFilesTaskDependency>(
            ctx,
            DownloadDependencyKeys.FetchImageFiles,
        );

        if (this.total === 0 || dep.slots.length === 0) {
            this.completed = 0;
            ctx.setDependency(
                DownloadDependencyKeys.SaveOfflinePageImages,
                new SaveOfflinePageImagesTaskDependency({}),
            );
            return { done: true };
        }

        const end = Math.min(dep.slots.length, this.cursor + TILE_FILE_BATCH_SIZE);
        for (let i = this.cursor; i < end; i += 1) {
            if (signal.aborted) {
                break;
            }
            const slot = dep.slots[i];
            this.downloadedImages[slot.imageId] = await this.downloadSlot(
                ctx,
                platformHarness,
                slot,
            );
            this.completed += 1;
        }
        this.cursor = end;

        if (this.completed >= this.total) {
            ctx.setDependency(
                DownloadDependencyKeys.SaveOfflinePageImages,
                new SaveOfflinePageImagesTaskDependency(this.downloadedImages),
            );
            return { done: true };
        }
        return { done: false };
    }

    private async downloadSlot(
        ctx: DownloadJobContext,
        platformHarness: DownloadPlatformHarness,
        slot: FetchImageFilesSlot,
    ): Promise<Partial<Record<ImageVersion, string | null>>> {
        const output: Partial<Record<ImageVersion, string | null>> = {};
        const downloadVersion = async (
            version: ImageVersion,
            url: string | null | undefined,
        ): Promise<void> => {
            if (url == null || url.length === 0) {
                output[version] = null;
                return;
            }
            const destPath = platformHarness.paths.imageDest(
                ctx.pageId,
                slot.imageId,
                version,
                extFromUrl(url),
            );
            await platformHarness.ensureParentDir(destPath);
            await platformHarness.downloadFile({
                url,
                destPath,
                background: true,
            });
            output[version] = destPath;
        };

        await downloadVersion(ImageVersion.preview, slot.versions.preview);
        await downloadVersion(ImageVersion.banner, slot.versions.banner);
        await downloadVersion(ImageVersion.full, slot.versions.full);
        return output;
    }

    toStoredState(): DownloadTaskStoredState {
        return {
            taskKind: this.taskKind,
            completed: this.completed,
            total: this.total,
            cursor: this.cursor,
            downloadedImages: this.downloadedImages,
        };
    }

    static fromStoredState(raw: unknown): FetchImageFilesTask {
        const value = raw as DownloadTaskStoredState & {
            cursor?: unknown;
            downloadedImages?: unknown;
        };
        return new FetchImageFilesTask({
            total: value.total,
            completed: value.completed,
            cursor: typeof value.cursor === 'number' ? value.cursor : 0,
            downloadedImages:
                value.downloadedImages != null && typeof value.downloadedImages === 'object'
                    ? (value.downloadedImages as StoredDownloadedImages)
                    : {},
        });
    }
}

import type { ImageVersion } from '../models/mobile/imageVersions';
import type { Bounds } from '../models/minimap/bounds';
import type { OfflinePagePreview } from '../models/previews/offlinePagePreview';
import type { PageViewType } from '../models/pageViews/pageViewType';
import type { DownloadPhase } from './downloadPhase';
import type { MapboxStyleKey, MapboxStyleUrls } from './mapboxStyleKey';

export type { MapboxStyleKey, MapboxStyleUrls } from './mapboxStyleKey';
export { MAPBOX_STYLE_KEYS } from './mapboxStyleKey';

export interface DownloadTaskDependency {
    readonly dependencyKind: string;
    toStoredState(): unknown;
}

export type DownloadJobUIState =
    | 'queued'
    | 'running'
    | 'success'
    | 'error'
    | 'cancelled';

export type DownloadJobUISnapshot = {
    pageId: string;
    state: DownloadJobUIState;
    phaseTitle: string;
    phaseProgress: number;
    displayStep: number;
    displayTotal: number;
    errorMessage: string | null;
};

export type DownloadJobConfig = {
    savedAt: number;
    mapboxStyleUrls: MapboxStyleUrls;
    webScraperBaseUrl: string;
    onProgress?: (snapshot: DownloadJobUISnapshot) => void;
};

export type DownloadJobContext = {
    pageId: string;
    pageViewType: PageViewType;
    config: DownloadJobConfig;
    taskDependencies: Record<string, DownloadTaskDependency>;
    getDependency(key: string): DownloadTaskDependency;
    setDependency(key: string, dep: DownloadTaskDependency): void;
    appendPhases(phases: DownloadPhase[]): void;
    /** Emits a UI progress update while a task is still running its current tick. */
    notifyProgress(): void;
};

export type DownloadJobStoredState = {
    pageId: string;
    pageViewType: PageViewType;
    savedAt: number;
    mapboxStyleUrls: MapboxStyleUrls;
    webScraperBaseUrl: string;
    state: DownloadJobUIState;
    currentPhaseIndex: number;
    phases: Array<{ title: string; taskStates: unknown[] }>;
    taskDependencies: Record<string, unknown>;
    errorMessage: string | null;
};

export type DownloadJobQueueStoredState = {
    queueOrder: string[];
    jobs: Record<string, DownloadJobStoredState>;
};

export type DownloadPlatformHarness = {
    downloadFile(args: {
        url: string;
        destPath: string;
        background: boolean;
        /** Normalized download progress in [0, 1], when supported by the platform harness. */
        onProgress?: (fraction: number) => void;
    }): Promise<void>;
    fileExists(path: string): Promise<{ exists: boolean; size?: number }>;
    readTextFile(path: string): Promise<string>;
    writeTextFile(path: string, content: string): Promise<void>;
    ensureParentDir(filePath: string): Promise<void>;
    deletePageBundle(pageId: string): Promise<void>;
    gunzipTileIfNeeded(path: string): Promise<void>;
    extractZipArchive(args: { zipPath: string; destRoot: string }): Promise<void>;
    paths: {
        pageRoot(pageId: string): string;
        pageJson(pageId: string): string;
        pageJsonTemp(pageId: string): string;
        zipTemp(pageId: string): string;
        imageDest(pageId: string, imageId: string, slot: string, ext: string): string;
        tileDest(pageId: string, relativePath: string): string;
        regionGeojson(pageId: string, regionId: string): string;
    };
    mapbox: {
        startPack(args: {
            pageId: string;
            styleKey: MapboxStyleKey;
            styleUrl: string;
            bounds: Bounds;
        }): Promise<void>;
        getPackProgress(pageId: string, styleKey: MapboxStyleKey): Promise<number>;
        deletePack(pageId: string, styleKey: MapboxStyleKey): Promise<void>;
    };
    loadJobStore(): Promise<DownloadJobQueueStoredState | null>;
    saveJobStore(queueStoredState: DownloadJobQueueStoredState): Promise<void>;
    setRoutePreviewsForPage(
        pageId: string,
        previews: OfflinePagePreview[],
    ): Promise<void>;
};

export type TaskTickResult = { done: boolean };

export type DownloadTaskStoredState = {
    taskKind: string;
    completed: number;
    total: number;
    [key: string]: unknown;
};

export type FetchImageFilesSlot = {
    imageId: string;
    versions: {
        preview?: string | null;
        banner?: string | null;
        full?: string | null;
    };
};

export type DownloadedImageVersions = Partial<Record<ImageVersion, string | null>>;

export type PendingFileTransfer = {
    key: string;
    url: string;
    destPath: string;
    background: boolean;
    enqueued: boolean;
    done: boolean;
};

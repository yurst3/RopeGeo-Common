import type { ImageVersion } from '../models/mobile/imageVersions';
import type { Bounds } from '../models/minimap/bounds';
import type { OfflinePagePreview } from '../models/previews/offlinePagePreview';
import type { PageViewType } from '../models/pageViews/pageViewType';
import type { DownloadPhase } from './downloadPhase';

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
    mapboxStyleUrl: string;
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
};

export type DownloadJobStoredState = {
    pageId: string;
    pageViewType: PageViewType;
    savedAt: number;
    mapboxStyleUrl: string;
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
    }): Promise<void>;
    fileExists(path: string): Promise<{ exists: boolean; size?: number }>;
    readTextFile(path: string): Promise<string>;
    writeTextFile(path: string, content: string): Promise<void>;
    ensureParentDir(filePath: string): Promise<void>;
    deletePageBundle(pageId: string): Promise<void>;
    gunzipTileIfNeeded(path: string): Promise<void>;
    paths: {
        pageRoot(pageId: string): string;
        pageJson(pageId: string): string;
        pageJsonTemp(pageId: string): string;
        imageDest(pageId: string, imageId: string, slot: string, ext: string): string;
        tileDest(pageId: string, relativePath: string): string;
        regionGeojson(pageId: string, regionId: string): string;
    };
    mapbox: {
        startPack(args: {
            pageId: string;
            styleUrl: string;
            bounds: Bounds;
        }): Promise<void>;
        getPackProgress(pageId: string): Promise<number>;
        deletePack(pageId: string): Promise<void>;
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

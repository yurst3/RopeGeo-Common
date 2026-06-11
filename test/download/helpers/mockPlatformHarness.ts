import { jest } from '@jest/globals';
import { DownloadJobQueue } from '../../../src/download/downloadJobQueue';
import type { DownloadJobQueueStoredState, DownloadPlatformHarness } from '../../../src/download/types';

export const PAGE_ID = '38f5c3fa-7248-41ed-815e-8b9e6aae5d61';
export const REGION_ID = 'a1b2c3d4-e29b-41d4-a716-446655440099';
export const MAP_DATA_ID = '550e8400-e29b-41d4-a716-446655440002';
export const IMAGE_ID_A = '550e8400-e29b-41d4-a716-446655440000';

export const downloadConfig = {
    savedAt: 1_700_000_000_000,
    mapboxStyleUrl: 'mapbox://styles/example',
    webScraperBaseUrl: 'https://api.example.com/',
};

export function createMockPlatformHarness(
    overrides: Partial<DownloadPlatformHarness> = {},
): DownloadPlatformHarness & {
    deletePageBundle: jest.Mock<(pageId: string) => Promise<void>>;
    downloadFile: jest.Mock<(args: { url: string; destPath: string; background: boolean }) => Promise<void>>;
    saveJobStore: jest.Mock<(state: DownloadJobQueueStoredState) => Promise<void>>;
} {
    const deletePageBundle = jest.fn<(pageId: string) => Promise<void>>().mockResolvedValue(undefined);
    const downloadFile = jest
        .fn<(args: { url: string; destPath: string; background: boolean }) => Promise<void>>()
        .mockResolvedValue(undefined);
    const saveJobStore = jest
        .fn<(state: DownloadJobQueueStoredState) => Promise<void>>()
        .mockResolvedValue(undefined);

    const harness: DownloadPlatformHarness = {
        downloadFile,
        fileExists: jest.fn(async () => ({ exists: false })),
        readTextFile: jest.fn(async () => ''),
        writeTextFile: jest.fn(async () => undefined),
        ensureParentDir: jest.fn(async () => undefined),
        deletePageBundle,
        gunzipTileIfNeeded: jest.fn(async () => undefined),
        paths: {
            pageRoot: (pageId) => `/pages/${pageId}`,
            pageJson: (pageId) => `/pages/${pageId}/page.json`,
            pageJsonTemp: (pageId) => `/pages/${pageId}/page.json.tmp`,
            imageDest: (pageId, imageId, slot, ext) =>
                `/pages/${pageId}/images/${imageId}/${slot}${ext}`,
            tileDest: (pageId, relativePath) => `/pages/${pageId}/tiles/${relativePath}`,
            regionGeojson: (pageId, regionId) => `/pages/${pageId}/routes/${regionId}.geojson`,
        },
        mapbox: {
            startPack: jest.fn(async () => undefined),
            getPackProgress: jest.fn(async () => 100),
            deletePack: jest.fn(async () => undefined),
        },
        loadJobStore: jest.fn(async () => null),
        saveJobStore,
        setRoutePreviewsForPage: jest.fn(async () => undefined),
        ...overrides,
    };

    return Object.assign(harness, { deletePageBundle, downloadFile, saveJobStore });
}

export function resetDownloadJobQueueSingleton(): void {
    (DownloadJobQueue as unknown as { instance: DownloadJobQueue | null }).instance = null;
}

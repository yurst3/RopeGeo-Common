export const DownloadDependencyKeys = {
    FetchPageJson: 'fetchPageJson',
    FetchDownloadFolder: 'fetchDownloadFolder',
    FetchImageFiles: 'fetchImageFiles',
    FetchMapboxPack: 'fetchMapboxPack',
    FetchRopeGeoTileList: 'fetchRopeGeoTileList',
    FetchRopeGeoTileFiles: 'fetchRopeGeoTileFiles',
    FetchRegionRouteList: 'fetchRegionRouteList',
    SaveOfflinePageView: 'saveOfflinePageView',
    SaveOfflinePageImages: 'saveOfflinePageImages',
    SaveOfflinePageMiniMap: 'saveOfflinePageMiniMap',
} as const;

export type DownloadDependencyKey =
    (typeof DownloadDependencyKeys)[keyof typeof DownloadDependencyKeys];

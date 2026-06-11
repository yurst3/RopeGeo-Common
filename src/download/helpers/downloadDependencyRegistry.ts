import type { DownloadTaskDependency } from '../types';
import { FetchImageFilesTaskDependency } from '../dependencies/fetchImageFilesTaskDependency';
import { FetchMapboxPackTaskDependency } from '../dependencies/fetchMapboxPackTaskDependency';
import { FetchPageJsonTaskDependency } from '../dependencies/fetchPageJsonTaskDependency';
import { FetchRegionRouteListTaskDependency } from '../dependencies/fetchRegionRouteListTaskDependency';
import { FetchRopeGeoTileFilesTaskDependency } from '../dependencies/fetchRopeGeoTileFilesTaskDependency';
import { FetchRopeGeoTileListTaskDependency } from '../dependencies/fetchRopeGeoTileListTaskDependency';
import { SaveOfflinePageImagesTaskDependency } from '../dependencies/saveOfflinePageImagesTaskDependency';
import { SaveOfflinePageMiniMapTaskDependency } from '../dependencies/saveOfflinePageMiniMapTaskDependency';
import { SaveOfflinePageViewTaskDependency } from '../dependencies/saveOfflinePageViewTaskDependency';

type DependencyParser = (raw: unknown) => DownloadTaskDependency;

const dependencyParsers: Record<string, DependencyParser> = {
    fetchPageJson: FetchPageJsonTaskDependency.fromStoredState,
    fetchImageFiles: FetchImageFilesTaskDependency.fromStoredState,
    fetchMapboxPack: FetchMapboxPackTaskDependency.fromStoredState,
    fetchRopeGeoTileList: FetchRopeGeoTileListTaskDependency.fromStoredState,
    fetchRopeGeoTileFiles: FetchRopeGeoTileFilesTaskDependency.fromStoredState,
    fetchRegionRouteList: FetchRegionRouteListTaskDependency.fromStoredState,
    saveOfflinePageView: SaveOfflinePageViewTaskDependency.fromStoredState,
    saveOfflinePageImages: SaveOfflinePageImagesTaskDependency.fromStoredState,
    saveOfflinePageMiniMap: SaveOfflinePageMiniMapTaskDependency.fromStoredState,
};

export function hydrateTaskDependencyFromStoredState(raw: unknown): DownloadTaskDependency {
    if (raw == null || typeof raw !== 'object') {
        throw new Error('Task dependency must be an object');
    }
    const value = raw as Record<string, unknown>;
    const kind = value.dependencyKind;
    if (typeof kind !== 'string') {
        throw new Error('Task dependency dependencyKind must be a string');
    }
    const parser = dependencyParsers[kind];
    if (parser == null) {
        throw new Error(`Unknown task dependency kind "${kind}"`);
    }
    return parser(raw);
}

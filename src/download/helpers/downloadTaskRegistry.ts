import { InvalidDownloadJobStoredStateError } from '../errors';
import type { DownloadTask } from '../tasks/abstractDownloadTask';
import type { DownloadTaskStoredState } from '../types';
import { DeleteStoredPageTask } from '../tasks/deleteStoredPageTask';
import { FetchImageFilesTask } from '../tasks/fetchImageFilesTask';
import { FetchMapboxPackTask } from '../tasks/fetchMapboxPackTask';
import { FetchPageJsonTask } from '../tasks/fetchPageJsonTask';
import { FetchRegionRouteListTask } from '../tasks/fetchRegionRouteListTask';
import { FetchRopeGeoTileFilesTask } from '../tasks/fetchRopeGeoTileFilesTask';
import { FetchRopeGeoTileListTask } from '../tasks/fetchRopeGeoTileListTask';
import { SaveOfflinePageTask } from '../tasks/saveOfflinePageTask';

type TaskParser = (raw: unknown) => DownloadTask;

const taskParsers: Record<string, TaskParser> = {
    deleteStoredPage: DeleteStoredPageTask.fromStoredState,
    fetchPageJson: FetchPageJsonTask.fromStoredState,
    fetchImageFiles: FetchImageFilesTask.fromStoredState,
    fetchMapboxPack: FetchMapboxPackTask.fromStoredState,
    fetchRopeGeoTileList: FetchRopeGeoTileListTask.fromStoredState,
    fetchRopeGeoTileFiles: FetchRopeGeoTileFilesTask.fromStoredState,
    fetchRegionRouteList: FetchRegionRouteListTask.fromStoredState,
    saveOfflinePage: SaveOfflinePageTask.fromStoredState,
};

export function hydrateDownloadTaskFromStoredState(raw: unknown): DownloadTask {
    if (raw == null || typeof raw !== 'object') {
        throw new InvalidDownloadJobStoredStateError(
            'Download task state must be an object',
        );
    }
    const value = raw as DownloadTaskStoredState;
    if (typeof value.taskKind !== 'string') {
        throw new InvalidDownloadJobStoredStateError(
            'Download task state taskKind must be a string',
        );
    }
    const parser = taskParsers[value.taskKind];
    if (parser == null) {
        throw new InvalidDownloadJobStoredStateError(
            `Unknown task kind "${value.taskKind}"`,
        );
    }
    return parser(raw);
}

import { DownloadPhase } from '../downloadPhase';
import { DeleteStoredPageTask } from '../tasks/deleteStoredPageTask';
import { FetchImageFilesTask } from '../tasks/fetchImageFilesTask';
import { FetchMapboxPackTask } from '../tasks/fetchMapboxPackTask';
import { FetchPageJsonTask } from '../tasks/fetchPageJsonTask';
import { FetchRegionRouteListTask } from '../tasks/fetchRegionRouteListTask';
import { FetchRopeGeoTileFilesTask } from '../tasks/fetchRopeGeoTileFilesTask';
import { SaveOfflinePageTask } from '../tasks/saveOfflinePageTask';
import type { DownloadTask } from '../tasks/abstractDownloadTask';

export function titleForPhase(tasks: DownloadTask[]): string {
    if (tasks.length === 1 && tasks[0] instanceof DeleteStoredPageTask) {
        return 'Deleting stored page';
    }
    if (tasks.length === 1 && tasks[0] instanceof FetchPageJsonTask) {
        return 'Downloading page';
    }
    if (tasks.some((task) => task instanceof FetchRopeGeoTileFilesTask)) {
        return 'Downloading map data';
    }
    if (tasks.some((task) => task instanceof SaveOfflinePageTask)) {
        return 'Saving page';
    }
    const imageTask = tasks.find((task) => task instanceof FetchImageFilesTask);
    if (imageTask instanceof FetchImageFilesTask && imageTask.total > 0) {
        return 'Downloading Media';
    }
    if (tasks.some((task) => task instanceof FetchRegionRouteListTask)) {
        return 'Downloading local routes';
    }
    if (tasks.some((task) => task instanceof FetchMapboxPackTask)) {
        return 'Downloading Mapbox Pack';
    }
    return 'Downloading page';
}

export function buildDeleteStoredPagePhase(): DownloadPhase {
    const task = new DeleteStoredPageTask();
    return new DownloadPhase({
        title: titleForPhase([task]),
        tasks: [task],
    });
}

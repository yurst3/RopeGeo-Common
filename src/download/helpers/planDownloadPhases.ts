import { MiniMapType } from '../../models/minimap/abstract/miniMapType';
import { OnlineCenteredRegionMiniMap } from '../../models/minimap/concrete/onlineCenteredRegionMiniMap';
import { OnlinePageMiniMap } from '../../models/minimap/concrete/onlinePageMiniMap';
import { OnlineRopewikiPageView } from '../../models/pageViews/onlineRopewikiPageView';
import { DownloadDependencyKeys } from '../dependencies/downloadDependencyKeys';
import { titleForPhase } from './downloadPhaseTitles';
import { DownloadPhase } from '../downloadPhase';
import { FetchImageFilesTask } from '../tasks/fetchImageFilesTask';
import { FetchMapboxPackTask } from '../tasks/fetchMapboxPackTask';
import { FetchRegionRouteListTask } from '../tasks/fetchRegionRouteListTask';
import { FetchRopeGeoTileFilesTask } from '../tasks/fetchRopeGeoTileFilesTask';
import { FetchRopeGeoTileListTask } from '../tasks/fetchRopeGeoTileListTask';
import { SaveOfflinePageTask } from '../tasks/saveOfflinePageTask';
import type { DownloadTask } from '../tasks/abstractDownloadTask';

export function planDownloadPhases(view: OnlineRopewikiPageView): DownloadPhase[] {
    const phases: DownloadPhase[] = [];
    const firstPhaseTasks: DownloadTask[] = [];

    const imagesDependency = view.getFetchImagesTaskDependency();
    const hasImages = imagesDependency.slots.length > 0;
    if (hasImages) {
        firstPhaseTasks.push(new FetchImageFilesTask({ total: imagesDependency.slots.length }));
    }

    const miniMap = view.miniMap;
    let hasTileFilesTask = false;
    let hasRegionRoutesTask = false;

    if (miniMap != null && miniMap.fetchType === 'online') {
        if (miniMap.miniMapType === MiniMapType.Page) {
            const pageMiniMap = miniMap as OnlinePageMiniMap;
            firstPhaseTasks.push(new FetchMapboxPackTask());
            if (pageMiniMap.tileCount > 0) {
                firstPhaseTasks.push(new FetchRopeGeoTileListTask(pageMiniMap.tileCount));
                hasTileFilesTask = true;
            }
        } else if (miniMap.miniMapType === MiniMapType.CenteredRegion) {
            const centeredMiniMap = miniMap as OnlineCenteredRegionMiniMap;
            if (centeredMiniMap.routeCount > 0) {
                firstPhaseTasks.push(new FetchRegionRouteListTask(centeredMiniMap.routeCount));
                hasRegionRoutesTask = true;
            }
        }
    }

    if (firstPhaseTasks.length > 0) {
        phases.push(
            new DownloadPhase({
                title: titleForPhase(firstPhaseTasks),
                tasks: firstPhaseTasks,
            }),
        );
    }

    if (hasTileFilesTask) {
        const pageMiniMap = miniMap as OnlinePageMiniMap;
        const tileFilesTask = new FetchRopeGeoTileFilesTask(pageMiniMap.tileCount);
        phases.push(
            new DownloadPhase({
                title: titleForPhase([tileFilesTask]),
                tasks: [tileFilesTask],
            }),
        );
    }

    const saveDependencyKeys: string[] = [DownloadDependencyKeys.SaveOfflinePageView];
    if (hasImages) {
        saveDependencyKeys.push(DownloadDependencyKeys.SaveOfflinePageImages);
    }
    if (hasTileFilesTask || hasRegionRoutesTask) {
        saveDependencyKeys.push(DownloadDependencyKeys.SaveOfflinePageMiniMap);
    }
    const saveTask = new SaveOfflinePageTask(saveDependencyKeys);
    phases.push(
        new DownloadPhase({
            title: titleForPhase([saveTask]),
            tasks: [saveTask],
        }),
    );

    return phases;
}

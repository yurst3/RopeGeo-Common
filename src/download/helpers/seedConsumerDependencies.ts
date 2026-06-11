import { MiniMapType } from '../../models/minimap/abstract/miniMapType';
import { OnlineCenteredRegionMiniMap } from '../../models/minimap/concrete/onlineCenteredRegionMiniMap';
import { OnlinePageMiniMap } from '../../models/minimap/concrete/onlinePageMiniMap';
import { OnlineRopewikiPageView } from '../../models/pageViews/onlineRopewikiPageView';
import { DownloadDependencyKeys } from '../dependencies/downloadDependencyKeys';
import { FetchMapboxPackTaskDependency } from '../dependencies/fetchMapboxPackTaskDependency';
import { FetchRopeGeoTileListTaskDependency } from '../dependencies/fetchRopeGeoTileListTaskDependency';
import { FetchRegionRouteListTaskDependency } from '../dependencies/fetchRegionRouteListTaskDependency';
import { SaveOfflinePageViewTaskDependency } from '../dependencies/saveOfflinePageViewTaskDependency';
import { TILE_LIST_PAGE_LIMIT } from './downloadConstants';
import type { DownloadTaskDependency } from '../types';
import { FetchImageFilesTask } from '../tasks/fetchImageFilesTask';
import { FetchMapboxPackTask } from '../tasks/fetchMapboxPackTask';
import { FetchRegionRouteListTask } from '../tasks/fetchRegionRouteListTask';
import { FetchRopeGeoTileListTask } from '../tasks/fetchRopeGeoTileListTask';
import { SaveOfflinePageTask } from '../tasks/saveOfflinePageTask';
import type { DownloadTask } from '../tasks/abstractDownloadTask';

export function seedConsumerDependencies(
    view: OnlineRopewikiPageView,
    tasks: DownloadTask[],
): Record<string, DownloadTaskDependency> {
    const dependencies: Record<string, DownloadTaskDependency> = {};
    const miniMap = view.miniMap;

    for (const task of tasks) {
        if (task instanceof FetchImageFilesTask) {
            dependencies[DownloadDependencyKeys.FetchImageFiles] =
                view.getFetchImagesTaskDependency();
            continue;
        }

        if (task instanceof FetchMapboxPackTask) {
            if (
                miniMap != null &&
                miniMap.fetchType === 'online' &&
                miniMap.miniMapType === MiniMapType.Page
            ) {
                dependencies[DownloadDependencyKeys.FetchMapboxPack] =
                    new FetchMapboxPackTaskDependency((miniMap as OnlinePageMiniMap).bounds);
            }
            continue;
        }

        if (task instanceof FetchRopeGeoTileListTask) {
            if (
                miniMap != null &&
                miniMap.fetchType === 'online' &&
                miniMap.miniMapType === MiniMapType.Page &&
                view.mapDataId != null
            ) {
                const pageMiniMap = miniMap as OnlinePageMiniMap;
                dependencies[DownloadDependencyKeys.FetchRopeGeoTileList] =
                    new FetchRopeGeoTileListTaskDependency({
                        mapDataId: view.mapDataId,
                        tileCount: pageMiniMap.tileCount,
                        tileTotalBytes: pageMiniMap.tileTotalBytes,
                        listPageLimit: TILE_LIST_PAGE_LIMIT,
                        pageMiniMapWire: JSON.parse(JSON.stringify(pageMiniMap)) as Record<
                            string,
                            unknown
                        >,
                    });
            }
            continue;
        }

        if (task instanceof FetchRegionRouteListTask) {
            if (
                miniMap != null &&
                miniMap.fetchType === 'online' &&
                miniMap.miniMapType === MiniMapType.CenteredRegion
            ) {
                const centeredMiniMap = miniMap as OnlineCenteredRegionMiniMap;
                const regionId = centeredMiniMap.routesParams.region?.id ?? '';
                if (regionId.length > 0) {
                    dependencies[DownloadDependencyKeys.FetchRegionRouteList] =
                        new FetchRegionRouteListTaskDependency({
                            routesParams: centeredMiniMap.routesParams,
                            routeCount: centeredMiniMap.routeCount,
                            totalBytes: centeredMiniMap.totalBytes,
                            regionId,
                            centeredRouteId: centeredMiniMap.centeredRouteId,
                            miniMapTitle: centeredMiniMap.title,
                        });
                }
            }
            continue;
        }

        if (task instanceof SaveOfflinePageTask) {
            dependencies[DownloadDependencyKeys.SaveOfflinePageView] =
                SaveOfflinePageViewTaskDependency.fromView(view);
        }
    }

    return dependencies;
}

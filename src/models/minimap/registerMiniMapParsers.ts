import { CenteredRegionMiniMap } from './abstract/centeredRegionMiniMap';
import { registerMiniMapParser } from './abstract/miniMap';
import { MiniMapType } from './abstract/miniMapType';
import { PageMiniMap } from './abstract/pageMiniMap';
import { RegionMiniMap } from './abstract/regionMiniMap';
import './concrete/offlineCenteredRegionMiniMap';
import './concrete/offlinePageMiniMap';
import './concrete/offlineRegionMiniMap';
import './concrete/onlineCenteredRegionMiniMap';
import './concrete/onlinePageMiniMap';
import './concrete/onlineRegionMiniMap';

registerMiniMapParser(MiniMapType.Region, (r) => RegionMiniMap.fromResult(r));
registerMiniMapParser(MiniMapType.Page, (r) => PageMiniMap.fromResult(r));
registerMiniMapParser(MiniMapType.CenteredRegion, (r) => CenteredRegionMiniMap.fromResult(r));

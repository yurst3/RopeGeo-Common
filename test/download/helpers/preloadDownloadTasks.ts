/**
 * Pre-load download task modules and result parsers before tests import model code
 * that pulls in DownloadJob (avoids partial downloadTaskRegistry during circular imports).
 */
import '../../../src/models/pageViews/registerPageViewParsers';
import '../../../src/models/betaSections/registerBetaSectionParsers';
import '../../../src/models/minimap/registerMiniMapParsers';
import '../../../src/models/api/results/registerAllResultParsers';

import '../../../src/download/tasks/deleteStoredPageTask';
import '../../../src/download/tasks/fetchImageFilesTask';
import '../../../src/download/tasks/fetchMapboxPackTask';
import '../../../src/download/tasks/fetchRopeGeoTileListTask';
import '../../../src/download/tasks/fetchRopeGeoTileFilesTask';
import '../../../src/download/tasks/fetchRegionRouteListTask';
import '../../../src/download/tasks/saveOfflinePageTask';
import '../../../src/download/tasks/fetchPageJsonTask';

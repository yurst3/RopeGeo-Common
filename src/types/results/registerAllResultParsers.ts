/**
 * Side-effect imports so each API result module registers its parser with the base
 * `fromResponseBody` routers. Import this entry first from the package barrel so
 * registration is guaranteed even when a bundler tree-shakes unused re-exports.
 */
import '../api/getRopewikiPageView/ropewikiPageViewResult';
import '../api/getRopewikiRegionView/ropewikiRegionViewResult';
import '../api/getRoutes/routesGeojsonResult';
import '../api/getRoutePreview/routePreviewResult';
import '../api/search/searchResults';
import '../api/getRopewikiRegionPreviews/ropewikiRegionPreviewsResult';
import '../api/getRopewikiRegionImages/ropewikiRegionImagesResult';
import '../api/listMapDataTileKeys/mapDataTileKeysResults';

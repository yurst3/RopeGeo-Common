/**
 * Side-effect imports so each API result module registers its parser with the base
 * `fromResponseBody` routers. Import this entry first from the package barrel so
 * registration is guaranteed even when a bundler tree-shakes unused re-exports.
 */
import './ropewikiPageViewResult';
import './ropewikiPageLinkPreviewResult';
import './ropewikiRegionViewResult';
import './routeResult';
import './ropewikiRegionBoundsResult';
import './routePreviewResult';
import './searchResults';
import './ropewikiRegionPreviewsResult';
import './ropewikiRegionImagesResult';
import './mapDataTileKeysResults';

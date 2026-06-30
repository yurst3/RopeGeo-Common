import { PagePreview } from '../previews/pagePreview';
import type { OfflinePagePreview } from '../previews/offlinePagePreview';
import { RouteType } from '../routes/routeType';
import type { Bounds } from '../minimap/bounds';
import { PageViewType } from './pageViewType';

export interface OfflinePageView {
    readonly fetchType: 'offline';
    readonly id: string;
    readonly routeType: RouteType;
    readonly pageViewType: PageViewType;
    toPagePreview(): OfflinePagePreview;
    /** Bounds for Mapbox offline pack when this page uses a page minimap; otherwise null. */
    getMapboxPackBounds(): Bounds | null;
}


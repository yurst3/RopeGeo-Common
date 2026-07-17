import { PagePreview } from '../previews/pagePreview';
import type { OfflinePagePreview } from '../previews/offlinePagePreview';
import { RouteType } from '../routes/routeType';
import type { Bounds } from '../minimap/bounds';
import { PageViewType } from './pageViewType';
import type { OfflineBetaSection } from '../betaSections/offlineBetaSection';
import type { OfflineBetaSectionImage } from '../betaSections/offlineBetaSectionImage';

export type OfflineBetaSectionLookupEntry = {
    /** Null for page-level images, which use the empty relevant-context key. */
    section: OfflineBetaSection | null;
    imagesById: Record<string, OfflineBetaSectionImage>;
};

/** Relevant-context lookup keyed by beta-section id (`""` for page-level images). */
export type OfflineBetaSectionLookup = Record<string, OfflineBetaSectionLookupEntry>;

export interface OfflinePageView {
    readonly fetchType: 'offline';
    readonly id: string;
    readonly routeType: RouteType;
    readonly pageViewType: PageViewType;
    toBetaSectionLookup(): OfflineBetaSectionLookup;
    toPagePreview(): OfflinePagePreview;
    /** Bounds for Mapbox offline pack when this page uses a page minimap; otherwise null. */
    getMapboxPackBounds(): Bounds | null;
}

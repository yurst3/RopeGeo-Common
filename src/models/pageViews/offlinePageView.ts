import { PagePreview } from '../previews/pagePreview';
import type { OfflinePagePreview } from '../previews/offlinePagePreview';
import { RouteType } from '../routes/routeType';
import type { Bounds } from '../minimap/bounds';
import { PageViewType } from './pageViewType';
import type { OfflineBetaSection } from '../betaSections/offlineBetaSection';
import type { OfflineBetaSectionImage } from '../betaSections/offlineBetaSectionImage';

/** Relevant-context section lookup keyed by non-null beta-section id. */
export type OfflineBetaSectionLookup = Record<string, OfflineBetaSection>;

export type OfflineImageLookupEntry = {
    image: OfflineBetaSectionImage;
    /** Omitted for page-level banner images. */
    betaSectionId?: string;
};

/** Image id → image (+ optional owning beta section). */
export type OfflineImageLookup = Record<string, OfflineImageLookupEntry>;

export interface OfflinePageView {
    readonly fetchType: 'offline';
    readonly id: string;
    readonly routeType: RouteType;
    readonly pageViewType: PageViewType;
    toBetaSectionLookup(): OfflineBetaSectionLookup;
    toImageLookup(): OfflineImageLookup;
    toPagePreview(): OfflinePagePreview;
    /** Bounds for Mapbox offline pack when this page uses a page minimap; otherwise null. */
    getMapboxPackBounds(): Bounds | null;
}

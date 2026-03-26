import { BetaSectionImage } from '../betaSections/betaSectionImage';
import { PagePreview } from '../previews/pagePreview';
import { RouteType } from '../routes/route';
import { RopewikiPageView } from '../api/getRopewikiPageView/ropewikiPageView';
import { ImageVersions } from './imageVersions';

const STORAGE_KEYS = ['preview', 'routeType', 'savedAt'] as const;

function assertRouteType(value: unknown): asserts value is RouteType {
    if (typeof value !== 'string' || !Object.values(RouteType).includes(value as RouteType)) {
        throw new Error(`SavedPage.routeType must be RouteType, got: ${JSON.stringify(value)}`);
    }
}

function assertFiniteNumber(value: unknown, name: string): asserts value is number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error(`SavedPage.${name} must be a finite number`);
    }
}

function pagePreviewToPlain(p: PagePreview): Record<string, unknown> {
    return {
        id: p.id,
        source: p.source,
        imageUrl: p.imageUrl,
        rating: p.rating,
        ratingCount: p.ratingCount,
        title: p.title,
        regions: p.regions,
        aka: p.aka,
        difficulty: {
            technical: p.difficulty.technical,
            water: p.difficulty.water,
            time: p.difficulty.time,
            risk: p.difficulty.risk,
        },
        mapData: p.mapData,
        externalLink: p.externalLink,
        permit: p.permit,
    };
}

/**
 * A saved Ropewiki page row (preview + route type + metadata).
 * `toString()` returns JSON for persistence.
 */
export class SavedPage {
    readonly preview: PagePreview;

    readonly routeType: RouteType;

    readonly savedAt: number;

    readonly downloadedPageView: string | null;

    readonly downloadedImages: Record<string, ImageVersions> | null;

    readonly downloadedMapData: string | null;

    constructor(
        preview: PagePreview,
        routeType: RouteType,
        savedAt: number,
        downloadedPageView: string | null = null,
        downloadedImages: Record<string, ImageVersions> | null = null,
        downloadedMapData: string | null = null,
    ) {
        this.preview = preview;
        this.routeType = routeType;
        this.savedAt = savedAt;
        this.downloadedPageView = downloadedPageView;
        this.downloadedImages = downloadedImages;
        this.downloadedMapData = downloadedMapData;
    }

    static fromJsonString(jsonString: string): SavedPage {
        let parsed: unknown;
        try {
            parsed = JSON.parse(jsonString);
        } catch (e) {
            throw new Error(
                `SavedPage.fromJsonString: invalid JSON: ${e instanceof Error ? e.message : String(e)}`,
            );
        }
        if (parsed == null || typeof parsed !== 'object') {
            throw new Error('SavedPage.fromJsonString: top-level value must be an object');
        }
        const o = parsed as Record<string, unknown>;
        for (const key of STORAGE_KEYS) {
            if (!(key in o)) {
                throw new Error(`SavedPage.fromJsonString: missing key "${key}"`);
            }
        }
        assertRouteType(o.routeType);
        assertFiniteNumber(o.savedAt, 'savedAt');
        const preview = PagePreview.fromResult(o.preview);
        const downloadedPageView =
            'downloadedPageView' in o && o.downloadedPageView != null
                ? String(o.downloadedPageView)
                : null;
        const downloadedImages = SavedPage.parseDownloadedImages(o.downloadedImages);
        const downloadedMapData =
            'downloadedMapData' in o && o.downloadedMapData != null
                ? String(o.downloadedMapData)
                : null;
        return new SavedPage(
            preview,
            o.routeType,
            o.savedAt as number,
            downloadedPageView,
            downloadedImages,
            downloadedMapData,
        );
    }

    /**
     * Builds a SavedPage from API data when the user saves from a page screen.
     * @param apiPageId RopewikiPage uuid (same as route `/ropewiki/page/{id}`).
     */
    static fromRopewikiPageView(
        data: RopewikiPageView,
        routeType: RouteType,
        apiPageId: string,
    ): SavedPage {
        return new SavedPage(
            data.toPagePreview(apiPageId),
            routeType,
            Date.now(),
        );
    }

    /**
     * Rewrites banner/beta image URLs to local `file://` URIs using this saved page's downloaded image paths.
     */
    applyDownloadedImagesToPageView(data: RopewikiPageView): RopewikiPageView {
        if (this.downloadedImages == null) return data;
        const bannerImage =
            data.bannerImage != null
                ? SavedPage.patchBetaImage(data.bannerImage, this.downloadedImages[data.bannerImage.id])
                : null;
        const betaSections = data.betaSections.map((sec) => ({
            ...sec,
            images: sec.images.map((im) =>
                SavedPage.patchBetaImage(im, this.downloadedImages?.[im.id]),
            ),
        }));
        return new RopewikiPageView(
            data.name,
            data.aka,
            data.url,
            data.quality,
            data.userVotes,
            data.regions,
            data.difficulty,
            data.permit,
            data.rappelCount,
            data.jumps,
            data.vehicle,
            data.rappelLongest,
            data.shuttleTime,
            data.overallLength,
            data.descentLength,
            data.exitLength,
            data.approachLength,
            data.overallTime,
            data.approachTime,
            data.descentTime,
            data.exitTime,
            data.approachElevGain,
            data.descentElevGain,
            data.exitElevGain,
            data.months,
            data.latestRevisionDate,
            bannerImage,
            betaSections,
            data.miniMap,
        );
    }

    toString(): string {
        const imagesPlain =
            this.downloadedImages == null
                ? null
                : Object.fromEntries(
                    Object.entries(this.downloadedImages).map(([id, iv]) => [id, iv.toPlain()]),
                );
        return JSON.stringify({
            preview: pagePreviewToPlain(this.preview),
            routeType: this.routeType,
            savedAt: this.savedAt,
            downloadedPageView: this.downloadedPageView,
            downloadedImages: imagesPlain,
            downloadedMapData: this.downloadedMapData,
        });
    }

    private static parseDownloadedImages(raw: unknown): Record<string, ImageVersions> | null {
        if (raw == null) return null;
        if (typeof raw !== 'object') {
            throw new Error('SavedPage.downloadedImages must be an object or null');
        }
        const out: Record<string, ImageVersions> = {};
        for (const [k, v] of Object.entries(raw)) {
            if (typeof v === 'string') {
                out[k] = new ImageVersions(null, v, null);
                continue;
            }
            out[k] = ImageVersions.fromResult(v);
        }
        return out;
    }

    private static toDisplayUri(localPath: string): string {
        if (localPath.startsWith('file://')) {
            return localPath;
        }
        return localPath.startsWith('/') ? `file://${localPath}` : `file:///${localPath}`;
    }

    private static patchBetaImage(
        img: BetaSectionImage,
        iv: ImageVersions | undefined,
    ): BetaSectionImage {
        if (iv == null) return img;
        return BetaSectionImage.fromResult({
            order: img.order,
            id: img.id,
            bannerUrl: iv.banner != null ? SavedPage.toDisplayUri(iv.banner) : img.bannerUrl,
            fullUrl: iv.full != null ? SavedPage.toDisplayUri(iv.full) : img.fullUrl,
            linkUrl: img.linkUrl,
            caption: img.caption,
            latestRevisionDate: img.latestRevisionDate.toISOString(),
            downloadBytes: img.downloadBytes,
        });
    }
}

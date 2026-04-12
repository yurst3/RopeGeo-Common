import { BetaSectionImage } from '../betaSections/betaSectionImage';
import { AcaDifficulty } from '../difficulty/acaDifficulty';
import { DownloadedCenteredRegionMiniMap } from '../minimap/downloadedCenteredRegionMiniMap';
import { DownloadedPageMiniMap } from '../minimap/downloadedPageMiniMap';
import { MiniMapType } from '../minimap/miniMapType';
import { PagePreview } from '../previews/pagePreview';
import { RouteType } from '../routes/route';
import { RopewikiPageView } from '../api/endpoints/ropewikiPageView';
import { ImageVersion, ImageVersions } from './imageVersions';

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
    const diffPlain =
        p.difficulty instanceof AcaDifficulty
            ? {
                  difficultyType: p.difficulty.difficultyType,
                  technical: p.difficulty.technical,
                  water: p.difficulty.water,
                  time: p.difficulty.time,
                  additionalRisk: p.difficulty.additionalRisk,
                  effectiveRisk: p.difficulty.effectiveRisk,
              }
            : {
                  difficultyType: p.difficulty.difficultyType,
              };
    return {
        id: p.id,
        source: p.source,
        imageUrl: p.imageUrl,
        rating: p.rating,
        ratingCount: p.ratingCount,
        title: p.title,
        regions: p.regions,
        aka: p.aka,
        difficulty: diffPlain,
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

    readonly downloadedMiniMap: DownloadedPageMiniMap | DownloadedCenteredRegionMiniMap | null;

    constructor(
        preview: PagePreview,
        routeType: RouteType,
        savedAt: number,
        downloadedPageView: string | null = null,
        downloadedImages: Record<string, ImageVersions> | null = null,
        downloadedMiniMap: DownloadedPageMiniMap | DownloadedCenteredRegionMiniMap | null = null,
    ) {
        this.preview = preview;
        this.routeType = routeType;
        this.savedAt = savedAt;
        this.downloadedPageView = downloadedPageView;
        this.downloadedImages = downloadedImages;
        this.downloadedMiniMap = downloadedMiniMap;
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
        if ('downloadedMapData' in o && o.downloadedMapData != null) {
            throw new Error(
                'SavedPage: legacy key "downloadedMapData" is no longer supported; re-download the page',
            );
        }
        const downloadedPageView =
            'downloadedPageView' in o && o.downloadedPageView != null
                ? String(o.downloadedPageView)
                : null;
        const downloadedImages = SavedPage.parseDownloadedImages(o.downloadedImages);
        const downloadedMiniMap = SavedPage.parseDownloadedMiniMap(o.downloadedMiniMap);
        return new SavedPage(
            preview,
            o.routeType,
            o.savedAt as number,
            downloadedPageView,
            downloadedImages,
            downloadedMiniMap,
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
            data.coordinates,
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
            downloadedMiniMap:
                this.downloadedMiniMap == null ? null : this.downloadedMiniMap.toPlain(),
        });
    }

    private static parseDownloadedMiniMap(
        raw: unknown,
    ): DownloadedPageMiniMap | DownloadedCenteredRegionMiniMap | null {
        if (raw == null || raw === undefined) return null;
        if (typeof raw !== 'object') {
            throw new Error('SavedPage.downloadedMiniMap must be an object or null');
        }
        const o = raw as Record<string, unknown>;
        const t = o.miniMapType;
        if (t === MiniMapType.DownloadedTilesTemplate) {
            return DownloadedPageMiniMap.fromResult(raw);
        }
        if (t === MiniMapType.DownloadedCenteredGeojson) {
            return DownloadedCenteredRegionMiniMap.fromResult(raw);
        }
        throw new Error(
            `SavedPage.downloadedMiniMap: unsupported miniMapType ${JSON.stringify(t)}`,
        );
    }

    private static parseDownloadedImages(raw: unknown): Record<string, ImageVersions> | null {
        if (raw == null) return null;
        if (typeof raw !== 'object') {
            throw new Error('SavedPage.downloadedImages must be an object or null');
        }
        const out: Record<string, ImageVersions> = {};
        for (const [k, v] of Object.entries(raw)) {
            if (typeof v === 'string') {
                out[k] = new ImageVersions({ [ImageVersion.banner]: v });
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
            bannerUrl:
                iv[ImageVersion.banner] != null
                    ? SavedPage.toDisplayUri(iv[ImageVersion.banner]!)
                    : img.bannerUrl,
            fullUrl:
                iv[ImageVersion.full] != null
                    ? SavedPage.toDisplayUri(iv[ImageVersion.full]!)
                    : img.fullUrl,
            linkUrl: img.linkUrl,
            caption: img.caption,
            latestRevisionDate: img.latestRevisionDate.toISOString(),
            downloadBytes: img.downloadBytes,
        });
    }
}

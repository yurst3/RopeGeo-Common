import { BetaSection } from '../betaSections/betaSection';
import { OfflineBetaSection } from '../betaSections/offlineBetaSection';
import { OfflineBetaSectionImage } from '../betaSections/offlineBetaSectionImage';
import { MiniMapType } from '../minimap/abstract/miniMapType';
import { OfflineCenteredRegionMiniMap } from '../minimap/concrete/offlineCenteredRegionMiniMap';
import { OfflinePageMiniMap } from '../minimap/concrete/offlinePageMiniMap';
import { OfflinePagePreview } from '../previews/offlinePagePreview';
import { PageDataSource } from '../pageDataSource';
import { OfflinePageView } from './offlinePageView';
import { registerRopewikiPageViewParser, RopewikiPageView } from './ropewikiPageView';
import { RouteType } from '../routes/routeType';

export class OfflineRopewikiPageView extends RopewikiPageView implements OfflinePageView {
    readonly fetchType = 'offline' as const;
    bannerImage: OfflineBetaSectionImage | null;
    betaSections: OfflineBetaSection[];
    miniMap: OfflinePageMiniMap | OfflineCenteredRegionMiniMap | null;

    constructor(
        id: string,
        routeType: RouteType,
        name: string,
        aka: string[],
        url: string,
        quality: number,
        userVotes: number,
        regions: { name: string; id: string }[],
        difficulty: import('../difficulty/difficulty').Difficulty,
        permit: import('../permitStatus').PermitStatus | null,
        rappelCount: { min: number; max: number } | number | null,
        jumps: number | null,
        vehicle: string | null,
        rappelLongest: number | null,
        shuttleTime: number | null,
        overallLength: number | null,
        descentLength: number | null,
        exitLength: number | null,
        approachLength: number | null,
        overallTime: { min: number; max: number } | number | null,
        approachTime: { min: number; max: number } | number | null,
        descentTime: { min: number; max: number } | number | null,
        exitTime: { min: number; max: number } | number | null,
        approachElevGain: number | null,
        descentElevGain: number | null,
        exitElevGain: number | null,
        months: string[],
        latestRevisionDate: Date,
        bannerImage: OfflineBetaSectionImage | null,
        betaSections: OfflineBetaSection[],
        miniMap: OfflinePageMiniMap | OfflineCenteredRegionMiniMap | null,
        coordinates: { lat: number; lon: number } | null,
    ) {
        super(
            id,
            routeType,
            name,
            aka,
            url,
            quality,
            userVotes,
            regions,
            difficulty,
            permit,
            rappelCount,
            jumps,
            vehicle,
            rappelLongest,
            shuttleTime,
            overallLength,
            descentLength,
            exitLength,
            approachLength,
            overallTime,
            approachTime,
            descentTime,
            exitTime,
            approachElevGain,
            descentElevGain,
            exitElevGain,
            months,
            latestRevisionDate,
            coordinates,
        );
        this.bannerImage = bannerImage;
        this.betaSections = betaSections;
        this.miniMap = miniMap;
    }

    toPagePreview(): OfflinePagePreview {
        const mapData =
            this.miniMap != null && this.miniMap.miniMapType === MiniMapType.Page
                ? (this.miniMap as OfflinePageMiniMap).layerId
                : null;
        return new OfflinePagePreview(
            this.id,
            PageDataSource.Ropewiki,
            this.bannerImage?.downloadedBannerPath ?? null,
            this.quality,
            this.userVotes,
            this.name,
            this.regions.map((region) => region.name),
            this.aka,
            this.difficulty,
            mapData,
            this.url,
            this.permit,
        );
    }

    static fromResult(result: unknown): OfflineRopewikiPageView {
        if (result == null || typeof result !== 'object') {
            throw new Error('OfflineRopewikiPageView result must be an object');
        }
        const r = result as Record<string, unknown>;
        RopewikiPageView.validateCommonFields(r, 'offline', 'OfflineRopewikiPageView');
        r.bannerImage =
            r.bannerImage == null
                ? null
                : OfflineBetaSectionImage.fromResult(r.bannerImage);
        if (!Array.isArray(r.betaSections)) {
            throw new Error(
                `OfflineRopewikiPageView.betaSections must be an array, got: ${typeof r.betaSections}`,
            );
        }
        r.betaSections = r.betaSections.map((item) => BetaSection.fromResponseBody(item, 'offline'));

        if (r.miniMap == null) {
            r.miniMap = null;
        } else if (typeof r.miniMap === 'object') {
            const mm = r.miniMap as Record<string, unknown>;
            if (mm.miniMapType === MiniMapType.Page && mm.fetchType === 'offline') {
                r.miniMap = OfflinePageMiniMap.fromResult(r.miniMap);
            } else if (mm.miniMapType === MiniMapType.CenteredRegion && mm.fetchType === 'offline') {
                r.miniMap = OfflineCenteredRegionMiniMap.fromResult(r.miniMap);
            } else {
                throw new Error(
                    `OfflineRopewikiPageView.miniMap must be offline page/centered minimap, got ${JSON.stringify(mm.miniMapType)}`,
                );
            }
        } else {
            throw new Error(
                `OfflineRopewikiPageView.miniMap must be object or null, got: ${typeof r.miniMap}`,
            );
        }

        Object.setPrototypeOf(r, OfflineRopewikiPageView.prototype);
        return r as unknown as OfflineRopewikiPageView;
    }
}

registerRopewikiPageViewParser('offline', (result) =>
    OfflineRopewikiPageView.fromResult(result),
);


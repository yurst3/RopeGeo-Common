import { BetaSection } from '../betaSections/betaSection';
import { OfflineBetaSection } from '../betaSections/offlineBetaSection';
import { OnlineBetaSection } from '../betaSections/onlineBetaSection';
import { OnlineBetaSectionImage } from '../betaSections/onlineBetaSectionImage';
import { DownloadBytes } from '../betaSections/downloadBytes';
import { MiniMapType } from '../minimap/abstract/miniMapType';
import { OnlineCenteredRegionMiniMap } from '../minimap/concrete/onlineCenteredRegionMiniMap';
import { OnlinePageMiniMap } from '../minimap/concrete/onlinePageMiniMap';
import { OfflineCenteredRegionMiniMap } from '../minimap/concrete/offlineCenteredRegionMiniMap';
import { OfflinePageMiniMap } from '../minimap/concrete/offlinePageMiniMap';
import { SavedPage } from '../mobile/savedPage';
import { ImageVersion, ImageVersions } from '../mobile/imageVersions';
import { OfflinePagePreview } from '../previews/offlinePagePreview';
import { OnlinePagePreview } from '../previews/onlinePagePreview';
import { PageDataSource } from '../pageDataSource';
import { OfflineRopewikiPageView } from './offlineRopewikiPageView';
import { OnlinePageView } from './onlinePageView';
import { registerRopewikiPageViewParser, RopewikiPageView } from './ropewikiPageView';
import { RouteType } from '../routes/routeType';
import { PageViewType } from './pageViewType';

export class OnlineRopewikiPageView extends RopewikiPageView implements OnlinePageView {
    readonly fetchType = 'online' as const;
    bannerImage: OnlineBetaSectionImage | null;
    betaSections: OnlineBetaSection[];
    miniMap: OnlinePageMiniMap | OnlineCenteredRegionMiniMap | null;

    constructor(
        id: string,
        routeType: RouteType,
        name: string,
        aka: string[],
        url: string,
        quality: number,
        userVotes: number,
        regions: { name: string; id: string }[],
        difficultyRating: import('../difficulty/difficultyRating').DifficultyRating,
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
        bannerImage: OnlineBetaSectionImage | null,
        betaSections: OnlineBetaSection[],
        mapDataId: string | null,
        miniMap: OnlinePageMiniMap | OnlineCenteredRegionMiniMap | null,
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
            difficultyRating,
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
            mapDataId,
            coordinates,
        );
        this.bannerImage = bannerImage;
        this.betaSections = betaSections;
        this.miniMap = miniMap;
    }

    getImageIdsToDownload(): Array<[string, DownloadBytes]> {
        const tuples: Array<[string, DownloadBytes]> = [];
        const collect = (image: OnlineBetaSectionImage): void => {
            if (image.downloadBytes != null) {
                tuples.push([image.id, image.downloadBytes]);
            }
        };
        if (this.bannerImage != null) {
            collect(this.bannerImage);
        }
        for (const section of this.betaSections) {
            for (const image of section.images) {
                collect(image);
            }
        }
        return tuples;
    }

    toOffline(
        downloadedImageVersions: Record<string, ImageVersions>,
        downloadedMiniMap?: OfflinePageMiniMap | OfflineCenteredRegionMiniMap | null,
    ): OfflineRopewikiPageView {
        const getVersions = (id: string): ImageVersions => {
            const versions = downloadedImageVersions[id];
            if (versions == null) {
                return new ImageVersions({});
            }
            return versions;
        };

        const toOfflineImage = (image: OnlineBetaSectionImage) =>
            image.toOffline(
                getVersions(image.id)[ImageVersion.banner] ?? null,
                getVersions(image.id)[ImageVersion.full] ?? null,
            );

        const offlineBannerImage = this.bannerImage == null ? null : toOfflineImage(this.bannerImage);
        const offlineSections = this.betaSections.map(
            (section) =>
                new OfflineBetaSection(
                    section.order,
                    section.title,
                    section.text,
                    section.latestRevisionDate,
                    section.images.map((image) => toOfflineImage(image)),
                ),
        );

        let offlineMiniMap: OfflinePageMiniMap | OfflineCenteredRegionMiniMap | null = null;
        if (this.miniMap != null) {
            if (downloadedMiniMap == null) {
                throw new Error('OnlineRopewikiPageView.toOffline requires downloadedMiniMap when miniMap exists');
            }
            offlineMiniMap = downloadedMiniMap;
        }

        return new OfflineRopewikiPageView(
            this.id,
            this.routeType,
            this.name,
            this.aka,
            this.url,
            this.quality,
            this.userVotes,
            this.regions,
            this.difficultyRating,
            this.permit,
            this.rappelCount,
            this.jumps,
            this.vehicle,
            this.rappelLongest,
            this.shuttleTime,
            this.overallLength,
            this.descentLength,
            this.exitLength,
            this.approachLength,
            this.overallTime,
            this.approachTime,
            this.descentTime,
            this.exitTime,
            this.approachElevGain,
            this.descentElevGain,
            this.exitElevGain,
            this.months,
            this.latestRevisionDate,
            offlineBannerImage,
            offlineSections,
            this.mapDataId,
            offlineMiniMap,
            this.coordinates,
        );
    }

    toPagePreview(): OnlinePagePreview {
        const mapData =
            this.miniMap != null && this.miniMap.miniMapType === MiniMapType.Page
                ? this.mapDataId
                : null;
        return new OnlinePagePreview(
            this.id,
            PageDataSource.Ropewiki,
            this.bannerImage?.bannerUrl ?? null,
            this.quality,
            this.userVotes,
            this.name,
            this.regions.map((region) => region.name),
            this.aka,
            this.difficultyRating,
            mapData,
            this.url,
            this.permit,
        );
    }

    toSavedPage(): SavedPage {
        return new SavedPage(this.toPagePreview(), Date.now(), null);
    }

    static fromResult(result: unknown): OnlineRopewikiPageView {
        if (result == null || typeof result !== 'object') {
            throw new Error('OnlineRopewikiPageView result must be an object');
        }
        const r = result as Record<string, unknown>;
        RopewikiPageView.validateCommonFields(r, 'online', 'OnlineRopewikiPageView');
        r.bannerImage =
            r.bannerImage == null
                ? null
                : OnlineBetaSectionImage.fromResult(r.bannerImage);
        if (!Array.isArray(r.betaSections)) {
            throw new Error(
                `OnlineRopewikiPageView.betaSections must be an array, got: ${typeof r.betaSections}`,
            );
        }
        r.betaSections = r.betaSections.map((item) => BetaSection.fromResponseBody(item, 'online'));

        if (r.miniMap == null) {
            r.miniMap = null;
        } else if (typeof r.miniMap === 'object') {
            const mm = r.miniMap as Record<string, unknown>;
            if (mm.miniMapType === MiniMapType.Page && mm.fetchType === 'online') {
                r.miniMap = OnlinePageMiniMap.fromResult(r.miniMap);
            } else if (mm.miniMapType === MiniMapType.CenteredRegion && mm.fetchType === 'online') {
                r.miniMap = OnlineCenteredRegionMiniMap.fromResult(r.miniMap);
            } else {
                throw new Error(
                    `OnlineRopewikiPageView.miniMap must be online page/centered minimap, got ${JSON.stringify(mm.miniMapType)}`,
                );
            }
        } else {
            throw new Error(
                `OnlineRopewikiPageView.miniMap must be object or null, got: ${typeof r.miniMap}`,
            );
        }

        Object.setPrototypeOf(r, OnlineRopewikiPageView.prototype);
        return r as unknown as OnlineRopewikiPageView;
    }
}

registerRopewikiPageViewParser('online', (result) =>
    OnlineRopewikiPageView.fromResult(result),
);


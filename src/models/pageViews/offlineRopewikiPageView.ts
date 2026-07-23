import { BetaSection } from '../betaSections/betaSection';
import { OfflineBetaSection } from '../betaSections/offlineBetaSection';
import { OfflineBetaSectionImage } from '../betaSections/offlineBetaSectionImage';
import { MiniMapType } from '../minimap/abstract/miniMapType';
import { OfflineCenteredRegionMiniMap } from '../minimap/concrete/offlineCenteredRegionMiniMap';
import { OfflinePageMiniMap } from '../minimap/concrete/offlinePageMiniMap';
import { OfflinePagePreview } from '../previews/offlinePagePreview';
import { PageDataSource } from '../pageDataSource';
import {
    type OfflineBetaSectionLookup,
    type OfflineImageLookup,
    OfflinePageView,
} from './offlinePageView';
import { registerOfflinePageViewParser } from './pageView';
import { registerRopewikiPageViewParser, RopewikiPageView } from './ropewikiPageView';
import { RouteType } from '../routes/routeType';
import { RopewikiVehicleType } from '../ropewikiVehicleType';
import { PageViewType } from './pageViewType';
import { hydrateOfflinePageWirePaths } from '../../helpers/hydrateOfflinePageWirePaths';
import { MinMax } from '../measurements/minMax';
import { LengthMeasurement } from '../measurements/lengthMeasurement';
import { TimeMeasurement } from '../measurements/timeMeasurement';
import { keyBy } from 'lodash';

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
        difficultyRating: import('../difficulty/difficultyRating').DifficultyRating,
        permit: import('../permitStatus').PermitStatus | null,
        rappelCount: MinMax<number> | number | null,
        jumps: number | null,
        vehicle: RopewikiVehicleType | null,
        rappelLongest: LengthMeasurement | null,
        shuttleTime: TimeMeasurement | null,
        overallLength: LengthMeasurement | null,
        descentLength: LengthMeasurement | null,
        exitLength: LengthMeasurement | null,
        approachLength: LengthMeasurement | null,
        overallTime: TimeMeasurement | MinMax<TimeMeasurement> | null,
        approachTime: TimeMeasurement | MinMax<TimeMeasurement> | null,
        descentTime: TimeMeasurement | MinMax<TimeMeasurement> | null,
        exitTime: TimeMeasurement | MinMax<TimeMeasurement> | null,
        approachElevGain: LengthMeasurement | null,
        descentElevGain: LengthMeasurement | null,
        exitElevGain: LengthMeasurement | null,
        months: string[],
        latestRevisionDate: Date,
        bannerImage: OfflineBetaSectionImage | null,
        betaSections: OfflineBetaSection[],
        miniMap: OfflinePageMiniMap | OfflineCenteredRegionMiniMap | null,
        coordinates: { lat: number; lon: number } | null,
        authors: string[] | null = null,
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
            coordinates,
            authors,
        );
        this.bannerImage = bannerImage;
        this.betaSections = betaSections;
        this.miniMap = miniMap;
    }

    toBetaSectionLookup(): OfflineBetaSectionLookup {
        const identifiedSections = this.betaSections.filter(
            (section): section is OfflineBetaSection & { id: string } =>
                section.id != null,
        );
        return keyBy(identifiedSections, (section) => section.id);
    }

    toImageLookup(): OfflineImageLookup {
        const lookup: OfflineImageLookup = {};
        for (const section of this.betaSections) {
            if (section.id == null) continue;
            for (const image of section.images) {
                lookup[image.id] = { image, betaSectionId: section.id };
            }
        }
        if (this.bannerImage != null) {
            lookup[this.bannerImage.id] = { image: this.bannerImage };
        }
        return lookup;
    }

    toPagePreview(): OfflinePagePreview {
        const mapData =
            this.miniMap != null && this.miniMap.miniMapType === MiniMapType.Page
                ? (this.miniMap as OfflinePageMiniMap).mapDataId
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
            this.difficultyRating,
            mapData,
            this.url,
            this.permit,
        );
    }

    getMapboxPackBounds(): import('../minimap/bounds').Bounds | null {
        if (this.miniMap != null && this.miniMap.miniMapType === MiniMapType.Page) {
            return (this.miniMap as OfflinePageMiniMap).getBounds();
        }
        return null;
    }

    static fromResult(result: unknown, pageRoot?: string | null): OfflineRopewikiPageView {
        if (result == null || typeof result !== 'object') {
            throw new Error('OfflineRopewikiPageView result must be an object');
        }
        const r = result as Record<string, unknown>;
        RopewikiPageView.validateCommonFields(r, 'offline', 'OfflineRopewikiPageView');
        RopewikiPageView.rejectLegacyTopLevelMapDataId(r, 'OfflineRopewikiPageView');
        if (pageRoot != null && pageRoot.length > 0) {
            hydrateOfflinePageWirePaths(pageRoot, r);
        }
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
        RopewikiPageView.assertUniqueBetaSectionIds(
            r.betaSections as OfflineBetaSection[],
            'OfflineRopewikiPageView',
        );

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

registerRopewikiPageViewParser('offline', (result) => OfflineRopewikiPageView.fromResult(result));
registerOfflinePageViewParser(PageViewType.Ropewiki, (result, pageRoot) =>
    OfflineRopewikiPageView.fromResult(result, pageRoot),
);

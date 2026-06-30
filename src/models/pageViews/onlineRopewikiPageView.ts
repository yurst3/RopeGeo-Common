import { BetaSection } from '../betaSections/betaSection';
import { OfflineBetaSection } from '../betaSections/offlineBetaSection';
import { OnlineBetaSection } from '../betaSections/onlineBetaSection';
import { OnlineBetaSectionImage } from '../betaSections/onlineBetaSectionImage';
import { MiniMapType } from '../minimap/abstract/miniMapType';
import { OnlineCenteredRegionMiniMap } from '../minimap/concrete/onlineCenteredRegionMiniMap';
import { OnlinePageMiniMap } from '../minimap/concrete/onlinePageMiniMap';
import { OfflineCenteredRegionMiniMap } from '../minimap/concrete/offlineCenteredRegionMiniMap';
import { OfflinePageMiniMap } from '../minimap/concrete/offlinePageMiniMap';
import { SavedPage } from '../mobile/savedPage';
import { ImageVersion, ImageVersions } from '../mobile/imageVersions';
import { OnlinePagePreview } from '../previews/onlinePagePreview';
import { PageDataSource } from '../pageDataSource';
import { OfflineRopewikiPageView } from './offlineRopewikiPageView';
import { OnlinePageView } from './onlinePageView';
import { registerOnlinePageViewParser } from './pageView';
import { registerRopewikiPageViewParser, RopewikiPageView } from './ropewikiPageView';
import { RouteType } from '../routes/routeType';
import { RopewikiVehicleType } from '../ropewikiVehicleType';
import { PageViewType } from './pageViewType';
import { buildDeleteStoredPagePhase, titleForPhase } from '../../download/helpers/downloadPhaseTitles';
import { DownloadJob } from '../../download/downloadJob';
import { DownloadPhase } from '../../download/downloadPhase';
import type {
    DownloadJobConfig,
    DownloadPlatformHarness,
    DownloadTaskDependency,
    FetchImageFilesSlot,
} from '../../download/types';
import { FetchImageFilesTaskDependency } from '../../download/dependencies/fetchImageFilesTaskDependency';
import { DownloadDependencyKeys } from '../../download/dependencies/downloadDependencyKeys';
import { FetchDownloadFolderTask } from '../../download/tasks/fetchDownloadFolderTask';
import { FetchDownloadFolderTaskDependency } from '../../download/dependencies/fetchDownloadFolderTaskDependency';
import { FetchImageFilesTask } from '../../download/tasks/fetchImageFilesTask';
import { FetchMapboxPackTask } from '../../download/tasks/fetchMapboxPackTask';
import { FetchMapboxPackTaskDependency } from '../../download/dependencies/fetchMapboxPackTaskDependency';
import { FetchRegionRouteListTask } from '../../download/tasks/fetchRegionRouteListTask';
import { FetchRegionRouteListTaskDependency } from '../../download/dependencies/fetchRegionRouteListTaskDependency';
import { FetchRopeGeoTileFilesTask } from '../../download/tasks/fetchRopeGeoTileFilesTask';
import { FetchRopeGeoTileListTask } from '../../download/tasks/fetchRopeGeoTileListTask';
import { FetchRopeGeoTileListTaskDependency } from '../../download/dependencies/fetchRopeGeoTileListTaskDependency';
import { SaveOfflinePageTask } from '../../download/tasks/saveOfflinePageTask';
import { SaveOfflinePageViewTaskDependency } from '../../download/dependencies/saveOfflinePageViewTaskDependency';
import { TILE_LIST_PAGE_LIMIT } from '../../download/helpers/downloadConstants';
import type { DownloadTask } from '../../download/tasks/abstractDownloadTask';
import {
    imageFileRelativePath,
    joinPageRootUri,
    offlineTilesTemplateRelative,
    regionRoutesGeojsonRelativePath,
} from '../../helpers/offlinePageBundlePaths';
import type { OfflinePageView } from './offlinePageView';

export class OnlineRopewikiPageView extends RopewikiPageView implements OnlinePageView {
    readonly fetchType = 'online' as const;
    bannerImage: OnlineBetaSectionImage | null;
    betaSections: OnlineBetaSection[];
    miniMap: OnlinePageMiniMap | OnlineCenteredRegionMiniMap | null;
    downloadFolder: string | null;

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
        vehicle: RopewikiVehicleType | null,
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
        miniMap: OnlinePageMiniMap | OnlineCenteredRegionMiniMap | null,
        coordinates: { lat: number; lon: number } | null,
        downloadFolder: string | null = null,
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
        );
        this.bannerImage = bannerImage;
        this.betaSections = betaSections;
        this.miniMap = miniMap;
        this.downloadFolder = downloadFolder;
    }

    planDownloadPhases(): DownloadPhase[] {
        if (this.hasBundleDownloadFolder()) {
            return this.planBundleDownloadPhases();
        }
        return this.planLegacyDownloadPhases();
    }

    getDependenciesForPhases(phases: DownloadPhase[]): Record<string, DownloadTaskDependency> {
        const dependencies: Record<string, DownloadTaskDependency> = {};
        const tasks = phases.flatMap((phase) => phase.tasks);
        const miniMap = this.miniMap;

        for (const task of tasks) {
            if (task instanceof FetchDownloadFolderTask) {
                if (this.hasBundleDownloadFolder()) {
                    dependencies[DownloadDependencyKeys.FetchDownloadFolder] =
                        new FetchDownloadFolderTaskDependency({
                            downloadFolderUrl: this.downloadFolder!,
                            parallelMapbox: this.needsParallelMapboxForBundle(),
                        });
                }
                continue;
            }

            if (task instanceof FetchImageFilesTask) {
                dependencies[DownloadDependencyKeys.FetchImageFiles] =
                    this.buildFetchImagesTaskDependency();
                continue;
            }

            if (task instanceof FetchMapboxPackTask) {
                const bounds = miniMap?.getBounds() ?? null;
                if (
                    miniMap != null &&
                    miniMap.fetchType === 'online' &&
                    miniMap.miniMapType === MiniMapType.Page &&
                    bounds != null
                ) {
                    dependencies[DownloadDependencyKeys.FetchMapboxPack] =
                        new FetchMapboxPackTaskDependency(bounds);
                }
                continue;
            }

            if (task instanceof FetchRopeGeoTileListTask) {
                if (
                    miniMap != null &&
                    miniMap.fetchType === 'online' &&
                    miniMap.miniMapType === MiniMapType.Page
                ) {
                    const pageMiniMap = miniMap as OnlinePageMiniMap;
                    if (pageMiniMap.mapDataId != null) {
                        dependencies[DownloadDependencyKeys.FetchRopeGeoTileList] =
                            new FetchRopeGeoTileListTaskDependency({
                                mapDataId: pageMiniMap.mapDataId,
                                tileCount: pageMiniMap.tileCount,
                                tileTotalBytes: pageMiniMap.tileTotalBytes,
                                listPageLimit: TILE_LIST_PAGE_LIMIT,
                                pageMiniMapWire: JSON.parse(JSON.stringify(pageMiniMap)) as Record<
                                    string,
                                    unknown
                                >,
                            });
                    }
                }
                continue;
            }

            if (task instanceof FetchRegionRouteListTask) {
                if (
                    miniMap != null &&
                    miniMap.fetchType === 'online' &&
                    miniMap.miniMapType === MiniMapType.CenteredRegion
                ) {
                    const centeredMiniMap = miniMap as OnlineCenteredRegionMiniMap;
                    const regionId = centeredMiniMap.routesParams.region?.id ?? '';
                    if (regionId.length > 0) {
                        dependencies[DownloadDependencyKeys.FetchRegionRouteList] =
                            new FetchRegionRouteListTaskDependency({
                                routesParams: centeredMiniMap.routesParams,
                                routeCount: centeredMiniMap.routeCount,
                                totalBytes: centeredMiniMap.totalBytes,
                                regionId,
                                centeredRouteId: centeredMiniMap.centeredRouteId,
                                miniMapTitle: centeredMiniMap.title,
                            });
                    }
                }
                continue;
            }

            if (task instanceof SaveOfflinePageTask) {
                dependencies[DownloadDependencyKeys.SaveOfflinePageView] =
                    SaveOfflinePageViewTaskDependency.fromView(this);
            }
        }

        return dependencies;
    }

    async toOfflineFromExtractedBundle(
        pageRoot: string,
        platformHarness: DownloadPlatformHarness,
    ): Promise<OfflinePageView> {
        const downloadedImageVersions = await this.resolveImageVersionsFromExtractedBundle(
            pageRoot,
            platformHarness,
        );
        const offlineMiniMap = this.resolveOfflineMiniMapFromExtractedBundle(pageRoot);
        return this.toOffline(downloadedImageVersions, offlineMiniMap);
    }

    toDownloadJob(config: DownloadJobConfig): DownloadJob {
        const allPhases = [buildDeleteStoredPagePhase(), ...this.planDownloadPhases()];
        return new DownloadJob({
            pageId: this.id,
            pageViewType: this.pageViewType,
            config,
            phases: allPhases,
            taskDependencies: this.getDependenciesForPhases(allPhases),
        });
    }

    toPlain(): Record<string, unknown> {
        return JSON.parse(
            JSON.stringify(this, (_key, value) =>
                value instanceof Date ? value.toISOString() : value,
            ),
        ) as Record<string, unknown>;
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
            offlineMiniMap,
            this.coordinates,
        );
    }

    toPagePreview(): OnlinePagePreview {
        const mapData =
            this.miniMap != null && this.miniMap.miniMapType === MiniMapType.Page
                ? (this.miniMap as OnlinePageMiniMap).mapDataId
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
            this.downloadFolder,
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
        RopewikiPageView.rejectLegacyTopLevelMapDataId(r, 'OnlineRopewikiPageView');
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

        if (r.downloadFolder !== undefined && r.downloadFolder !== null) {
            if (typeof r.downloadFolder !== 'string') {
                throw new Error(
                    `OnlineRopewikiPageView.downloadFolder must be string or null, got: ${typeof r.downloadFolder}`,
                );
            }
        } else {
            r.downloadFolder = null;
        }

        Object.setPrototypeOf(r, OnlineRopewikiPageView.prototype);
        return r as unknown as OnlineRopewikiPageView;
    }

    private hasBundleDownloadFolder(): boolean {
        return this.downloadFolder != null && this.downloadFolder.length > 0;
    }

    private needsParallelMapboxForBundle(): boolean {
        const miniMap = this.miniMap;
        return (
            miniMap != null &&
            miniMap.fetchType === 'online' &&
            miniMap.miniMapType === MiniMapType.Page
        );
    }

    private planBundleDownloadPhases(): DownloadPhase[] {
        const tasks: DownloadTask[] = [new FetchDownloadFolderTask()];
        if (this.needsParallelMapboxForBundle()) {
            tasks.push(new FetchMapboxPackTask());
        }
        return [
            new DownloadPhase({
                title: titleForPhase(tasks),
                tasks,
            }),
        ];
    }

    private planLegacyDownloadPhases(): DownloadPhase[] {
        const phases: DownloadPhase[] = [];
        const firstPhaseTasks: DownloadTask[] = [];

        const imagesDependency = this.buildFetchImagesTaskDependency();
        const hasImages = imagesDependency.slots.length > 0;
        if (hasImages) {
            firstPhaseTasks.push(new FetchImageFilesTask({ total: imagesDependency.slots.length }));
        }

        const miniMap = this.miniMap;
        let hasTileFilesTask = false;
        let hasRegionRoutesTask = false;

        if (miniMap != null && miniMap.fetchType === 'online') {
            if (miniMap.miniMapType === MiniMapType.Page) {
                const pageMiniMap = miniMap as OnlinePageMiniMap;
                firstPhaseTasks.push(new FetchMapboxPackTask());
                if (pageMiniMap.tileCount > 0) {
                    firstPhaseTasks.push(new FetchRopeGeoTileListTask(pageMiniMap.tileCount));
                    hasTileFilesTask = true;
                }
            } else if (miniMap.miniMapType === MiniMapType.CenteredRegion) {
                const centeredMiniMap = miniMap as OnlineCenteredRegionMiniMap;
                if (centeredMiniMap.routeCount > 0) {
                    firstPhaseTasks.push(new FetchRegionRouteListTask(centeredMiniMap.routeCount));
                    hasRegionRoutesTask = true;
                }
            }
        }

        if (firstPhaseTasks.length > 0) {
            phases.push(
                new DownloadPhase({
                    title: titleForPhase(firstPhaseTasks),
                    tasks: firstPhaseTasks,
                }),
            );
        }

        if (hasTileFilesTask) {
            const pageMiniMap = miniMap as OnlinePageMiniMap;
            const tileFilesTask = new FetchRopeGeoTileFilesTask(pageMiniMap.tileCount);
            phases.push(
                new DownloadPhase({
                    title: titleForPhase([tileFilesTask]),
                    tasks: [tileFilesTask],
                }),
            );
        }

        const saveDependencyKeys: string[] = [DownloadDependencyKeys.SaveOfflinePageView];
        if (hasImages) {
            saveDependencyKeys.push(DownloadDependencyKeys.SaveOfflinePageImages);
        }
        if (hasTileFilesTask || hasRegionRoutesTask) {
            saveDependencyKeys.push(DownloadDependencyKeys.SaveOfflinePageMiniMap);
        }
        const saveTask = new SaveOfflinePageTask(saveDependencyKeys);
        phases.push(
            new DownloadPhase({
                title: titleForPhase([saveTask]),
                tasks: [saveTask],
            }),
        );

        return phases;
    }

    private buildFetchImagesTaskDependency(): FetchImageFilesTaskDependency {
        const slots: FetchImageFilesSlot[] = [];
        const collect = (image: OnlineBetaSectionImage): void => {
            const versions: FetchImageFilesSlot['versions'] = {
                preview: image.bannerUrl,
                banner: image.bannerUrl,
                full: image.fullUrl,
            };
            const hasDownloadableVersion =
                (versions.preview != null && versions.preview.length > 0) ||
                (versions.banner != null && versions.banner.length > 0) ||
                (versions.full != null && versions.full.length > 0);
            if (hasDownloadableVersion) {
                slots.push({
                    imageId: image.id,
                    versions,
                });
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
        return new FetchImageFilesTaskDependency(slots);
    }

    private async resolveImageVersionsFromExtractedBundle(
        pageRoot: string,
        platformHarness: DownloadPlatformHarness,
    ): Promise<Record<string, ImageVersions>> {
        const dependency = this.buildFetchImagesTaskDependency();
        const downloadedImageVersions: Record<string, ImageVersions> = {};

        for (const slot of dependency.slots) {
            const resolveVersion = async (
                version: ImageVersion.banner | ImageVersion.full,
                url: string | null | undefined,
            ): Promise<string | null> => {
                if (url == null || url.length === 0) {
                    return null;
                }
                const relativePath = imageFileRelativePath(slot.imageId, version, '.avif');
                const absolutePath = joinPageRootUri(pageRoot, relativePath);
                const info = await platformHarness.fileExists(absolutePath);
                return info.exists ? absolutePath : null;
            };

            downloadedImageVersions[slot.imageId] = new ImageVersions({
                banner: await resolveVersion(ImageVersion.banner, slot.versions.banner),
                full: await resolveVersion(ImageVersion.full, slot.versions.full),
            });
        }

        return downloadedImageVersions;
    }

    private resolveOfflineMiniMapFromExtractedBundle(
        pageRoot: string,
    ): OfflinePageMiniMap | OfflineCenteredRegionMiniMap | null {
        const miniMap = this.miniMap;
        if (miniMap == null || miniMap.fetchType !== 'online') {
            return null;
        }

        if (miniMap.miniMapType === MiniMapType.Page) {
            const pageMiniMap = miniMap as OnlinePageMiniMap;
            if (pageMiniMap.mapDataId == null) {
                throw new Error(
                    'OnlineRopewikiPageView bundle extract requires mapDataId on page minimap',
                );
            }
            const absoluteTemplate = joinPageRootUri(
                pageRoot,
                offlineTilesTemplateRelative(pageMiniMap.mapDataId),
            );
            return pageMiniMap.toOffline(absoluteTemplate);
        }

        if (miniMap.miniMapType === MiniMapType.CenteredRegion) {
            const centeredMiniMap = miniMap as OnlineCenteredRegionMiniMap;
            const regionId = centeredMiniMap.routesParams.region?.id ?? '';
            if (regionId.length === 0) {
                throw new Error(
                    'OnlineRopewikiPageView bundle extract requires region id on centered minimap',
                );
            }
            const absoluteGeojson = joinPageRootUri(
                pageRoot,
                regionRoutesGeojsonRelativePath(regionId),
            );
            return centeredMiniMap.toOffline(absoluteGeojson);
        }

        return null;
    }
}

registerRopewikiPageViewParser('online', (result) => OnlineRopewikiPageView.fromResult(result));
registerOnlinePageViewParser(PageViewType.Ropewiki, (result) => OnlineRopewikiPageView.fromResult(result));

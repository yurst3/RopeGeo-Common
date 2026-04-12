import { Bounds } from './bounds';
import { MiniMap } from './miniMap';
import { MiniMapType } from './miniMapType';

/**
 * Client-persisted page minimap: local vector tile template (e.g. `file://` with `{z}/{x}/{y}`).
 */
export class DownloadedPageMiniMap extends MiniMap {
    readonly miniMapType = MiniMapType.DownloadedTilesTemplate;
    layerId: string;
    downloadedTilesTemplate: string;
    bounds: Bounds;

    constructor(
        layerId: string,
        downloadedTilesTemplate: string,
        bounds: Bounds,
        title: string,
    ) {
        super(title);
        this.layerId = layerId;
        this.downloadedTilesTemplate = downloadedTilesTemplate;
        this.bounds = bounds;
    }

    /** Plain object for JSON persistence (matches {@link DownloadedPageMiniMap.fromResult}). */
    toPlain(): Record<string, unknown> {
        return {
            miniMapType: this.miniMapType,
            layerId: this.layerId,
            downloadedTilesTemplate: this.downloadedTilesTemplate,
            bounds: {
                north: this.bounds.north,
                south: this.bounds.south,
                east: this.bounds.east,
                west: this.bounds.west,
            },
            title: this.title,
        };
    }

    static fromResult(result: unknown): DownloadedPageMiniMap {
        if (result == null || typeof result !== 'object') {
            throw new Error('DownloadedPageMiniMap result must be an object');
        }
        const r = result as Record<string, unknown>;
        if (r.miniMapType !== MiniMapType.DownloadedTilesTemplate) {
            throw new Error(
                `DownloadedPageMiniMap.miniMapType must be "${MiniMapType.DownloadedTilesTemplate}", got: ${JSON.stringify(r.miniMapType)}`,
            );
        }
        const title = MiniMap.assertNonEmptyTitle(r.title, 'DownloadedPageMiniMap.title');
        const layerId = r.layerId;
        if (typeof layerId !== 'string' || layerId.length === 0) {
            throw new Error(
                `DownloadedPageMiniMap.layerId must be a non-empty string, got: ${typeof layerId}`,
            );
        }
        const downloadedTilesTemplate = r.downloadedTilesTemplate;
        if (typeof downloadedTilesTemplate !== 'string') {
            throw new Error(
                `DownloadedPageMiniMap.downloadedTilesTemplate must be a string, got: ${typeof downloadedTilesTemplate}`,
            );
        }
        if (
            !downloadedTilesTemplate.includes('{z}') ||
            !downloadedTilesTemplate.includes('{x}') ||
            !downloadedTilesTemplate.includes('{y}')
        ) {
            throw new Error(
                `DownloadedPageMiniMap.downloadedTilesTemplate must contain {z}, {x}, and {y} placeholders, got: ${downloadedTilesTemplate}`,
            );
        }
        const bounds = Bounds.fromResult(r.bounds);
        return new DownloadedPageMiniMap(layerId, downloadedTilesTemplate, bounds, title);
    }
}

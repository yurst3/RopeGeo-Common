import { ImageVersion } from '../../models/mobile/imageVersions';
import type { DownloadedImageVersions, DownloadTaskDependency } from '../types';

export class SaveOfflinePageImagesTaskDependency implements DownloadTaskDependency {
    readonly dependencyKind = 'saveOfflinePageImages' as const;
    readonly downloadedImages: Record<string, DownloadedImageVersions>;

    constructor(downloadedImages: Record<string, DownloadedImageVersions>) {
        this.downloadedImages = downloadedImages;
    }

    toStoredState(): unknown {
        return {
            dependencyKind: this.dependencyKind,
            downloadedImages: this.downloadedImages,
        };
    }

    static fromStoredState(raw: unknown): SaveOfflinePageImagesTaskDependency {
        if (raw == null || typeof raw !== 'object') {
            throw new Error('SaveOfflinePageImagesTaskDependency must be an object');
        }
        const value = raw as Record<string, unknown>;
        if (value.downloadedImages == null || typeof value.downloadedImages !== 'object') {
            throw new Error('SaveOfflinePageImagesTaskDependency.downloadedImages must be an object');
        }
        const downloadedImages: Record<string, DownloadedImageVersions> = {};
        for (const [imageId, versionsRaw] of Object.entries(value.downloadedImages as Record<string, unknown>)) {
            if (versionsRaw == null || typeof versionsRaw !== 'object') {
                throw new Error(`SaveOfflinePageImagesTaskDependency.downloadedImages.${imageId} invalid`);
            }
            const versionsRecord = versionsRaw as Record<string, unknown>;
            const versions: DownloadedImageVersions = {};
            for (const key of Object.values(ImageVersion)) {
                const maybe = versionsRecord[key];
                if (maybe !== undefined && maybe !== null && typeof maybe !== 'string') {
                    throw new Error(
                        `SaveOfflinePageImagesTaskDependency.downloadedImages.${imageId}.${key} invalid`,
                    );
                }
                if (maybe !== undefined) {
                    versions[key] = maybe as string | null;
                }
            }
            downloadedImages[imageId] = versions;
        }
        return new SaveOfflinePageImagesTaskDependency(downloadedImages);
    }
}

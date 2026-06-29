import type { DownloadTaskDependency } from '../types';

export class FetchDownloadFolderTaskDependency implements DownloadTaskDependency {
    readonly dependencyKind = 'fetchDownloadFolder' as const;
    readonly downloadFolderUrl: string;
    /** When true, Mapbox runs in parallel with this task (explore path with page minimap). */
    readonly parallelMapbox: boolean;

    constructor(args: {
        downloadFolderUrl: string;
        parallelMapbox?: boolean;
    }) {
        this.downloadFolderUrl = args.downloadFolderUrl;
        this.parallelMapbox = args.parallelMapbox ?? false;
    }

    toStoredState(): unknown {
        return {
            dependencyKind: this.dependencyKind,
            downloadFolderUrl: this.downloadFolderUrl,
            parallelMapbox: this.parallelMapbox,
        };
    }

    static fromStoredState(raw: unknown): FetchDownloadFolderTaskDependency {
        if (raw == null || typeof raw !== 'object') {
            throw new Error('FetchDownloadFolderTaskDependency must be an object');
        }
        const value = raw as Record<string, unknown>;
        if (typeof value.downloadFolderUrl !== 'string' || value.downloadFolderUrl.length === 0) {
            throw new Error('FetchDownloadFolderTaskDependency.downloadFolderUrl must be a non-empty string');
        }
        return new FetchDownloadFolderTaskDependency({
            downloadFolderUrl: value.downloadFolderUrl,
            parallelMapbox: value.parallelMapbox === true,
        });
    }
}

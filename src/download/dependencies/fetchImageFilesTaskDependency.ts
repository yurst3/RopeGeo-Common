import type { DownloadTaskDependency, FetchImageFilesSlot } from '../types';

export class FetchImageFilesTaskDependency implements DownloadTaskDependency {
    readonly dependencyKind = 'fetchImageFiles' as const;
    readonly slots: FetchImageFilesSlot[];

    constructor(slots: FetchImageFilesSlot[]) {
        this.slots = slots;
    }

    toStoredState(): unknown {
        return {
            dependencyKind: this.dependencyKind,
            slots: this.slots,
        };
    }

    static fromStoredState(raw: unknown): FetchImageFilesTaskDependency {
        if (raw == null || typeof raw !== 'object') {
            throw new Error('FetchImageFilesTaskDependency must be an object');
        }
        const value = raw as Record<string, unknown>;
        if (!Array.isArray(value.slots)) {
            throw new Error('FetchImageFilesTaskDependency.slots must be an array');
        }
        const slots: FetchImageFilesSlot[] = value.slots.map((entry, index) => {
            if (entry == null || typeof entry !== 'object') {
                throw new Error(`FetchImageFilesTaskDependency.slots[${index}] must be an object`);
            }
            const slot = entry as Record<string, unknown>;
            if (typeof slot.imageId !== 'string' || slot.imageId.length === 0) {
                throw new Error(`FetchImageFilesTaskDependency.slots[${index}].imageId invalid`);
            }
            const rawVersions = slot.versions;
            if (rawVersions == null || typeof rawVersions !== 'object') {
                throw new Error(`FetchImageFilesTaskDependency.slots[${index}].versions invalid`);
            }
            const versionsRecord = rawVersions as Record<string, unknown>;
            const versions: FetchImageFilesSlot['versions'] = {};
            for (const key of ['preview', 'banner', 'full'] as const) {
                const item = versionsRecord[key];
                if (item !== undefined && item !== null && typeof item !== 'string') {
                    throw new Error(
                        `FetchImageFilesTaskDependency.slots[${index}].versions.${key} invalid`,
                    );
                }
                if (item !== undefined) {
                    versions[key] = item as string | null;
                }
            }
            return { imageId: slot.imageId, versions };
        });
        return new FetchImageFilesTaskDependency(slots);
    }
}

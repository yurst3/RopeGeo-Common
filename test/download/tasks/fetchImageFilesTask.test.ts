import { describe, it, expect } from '@jest/globals';
import { ImageVersion } from '../../../src/models/mobile/imageVersions';
import { DownloadDependencyKeys } from '../../../src/download/dependencies/downloadDependencyKeys';
import { FetchImageFilesTaskDependency } from '../../../src/download/dependencies/fetchImageFilesTaskDependency';
import { FetchImageFilesTask } from '../../../src/download/tasks/fetchImageFilesTask';
import { IMAGE_FILE_BATCH_SIZE } from '../../../src/download/helpers/downloadConstants';
import { PageViewType } from '../../../src/models/pageViews/pageViewType';
import type { DownloadJobContext } from '../../../src/download/types';
import {
    createMockPlatformHarness,
    downloadConfig,
    IMAGE_ID_A,
    PAGE_ID,
} from '../helpers/mockPlatformHarness';

function createContext(taskDependencies: DownloadJobContext['taskDependencies']): DownloadJobContext {
    return {
        pageId: PAGE_ID,
        pageViewType: PageViewType.Ropewiki,
        config: downloadConfig,
        taskDependencies,
        getDependency: (key) => taskDependencies[key]!,
        setDependency: (key, dep) => {
            taskDependencies[key] = dep;
        },
        appendPhases: () => undefined,
    };
}

describe('FetchImageFilesTask', () => {
    it('completes immediately with empty slots and seeds save dependency', async () => {
        const harness = createMockPlatformHarness();
        const deps: DownloadJobContext['taskDependencies'] = {
            [DownloadDependencyKeys.FetchImageFiles]: new FetchImageFilesTaskDependency([]),
        };
        const ctx = createContext(deps);
        const task = new FetchImageFilesTask({ total: 0 });
        const result = await task.runTick(ctx, harness, new AbortController().signal);
        expect(result.done).toBe(true);
        expect(deps[DownloadDependencyKeys.SaveOfflinePageImages]).toBeDefined();
        expect(harness.downloadFile).not.toHaveBeenCalled();
    });

    it('downloads image versions in batches', async () => {
        const harness = createMockPlatformHarness();
        const slots = Array.from({ length: IMAGE_FILE_BATCH_SIZE + 1 }, (_, i) => ({
            imageId: `img-${i}`,
            versions: {
                banner: `https://example.com/${i}.avif`,
                full: `https://example.com/${i}-full.avif`,
            },
        }));
        const deps: DownloadJobContext['taskDependencies'] = {
            [DownloadDependencyKeys.FetchImageFiles]: new FetchImageFilesTaskDependency(slots),
        };
        const ctx = createContext(deps);
        const task = new FetchImageFilesTask({ total: slots.length });
        const signal = new AbortController().signal;

        const first = await task.runTick(ctx, harness, signal);
        expect(first.done).toBe(false);
        expect(task.completed).toBe(IMAGE_FILE_BATCH_SIZE);
        expect(harness.downloadFile).toHaveBeenCalledTimes(IMAGE_FILE_BATCH_SIZE * 2);

        const second = await task.runTick(ctx, harness, signal);
        expect(second.done).toBe(true);
        expect(deps[DownloadDependencyKeys.SaveOfflinePageImages]).toBeDefined();
    });

    it('round-trips stored state with cursor and downloaded images', () => {
        const task = new FetchImageFilesTask({
            total: 2,
            completed: 1,
            cursor: 1,
            downloadedImages: {
                [IMAGE_ID_A]: { [ImageVersion.banner]: '/tmp/b.avif' },
            },
        });
        const restored = FetchImageFilesTask.fromStoredState(task.toStoredState());
        expect(restored.total).toBe(2);
        expect(restored.completed).toBe(1);
    });
});

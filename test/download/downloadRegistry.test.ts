import { describe, it, expect } from '@jest/globals';
import { hydrateTaskDependencyFromStoredState } from '../../src/download/helpers/downloadDependencyRegistry';
import { hydrateDownloadTaskFromStoredState } from '../../src/download/helpers/downloadTaskRegistry';
import { InvalidDownloadJobStoredStateError } from '../../src/download/errors';
import { FetchImageFilesTaskDependency } from '../../src/download/dependencies/fetchImageFilesTaskDependency';
import { DeleteStoredPageTask } from '../../src/download/tasks/deleteStoredPageTask';
import { FetchImageFilesTask } from '../../src/download/tasks/fetchImageFilesTask';

describe('downloadDependencyRegistry', () => {
    it('hydrates known dependency kinds', () => {
        const dep = new FetchImageFilesTaskDependency([
            { imageId: 'img-1', versions: { banner: 'https://example.com/b.avif' } },
        ]);
        const restored = hydrateTaskDependencyFromStoredState(dep.toStoredState());
        expect(restored.dependencyKind).toBe('fetchImageFiles');
    });

    it('throws for unknown dependency kind', () => {
        expect(() =>
            hydrateTaskDependencyFromStoredState({ dependencyKind: 'unknown', foo: 1 }),
        ).toThrow('Unknown task dependency kind');
    });

    it('throws for invalid stored shape', () => {
        expect(() => hydrateTaskDependencyFromStoredState(null)).toThrow(
            'Task dependency must be an object',
        );
    });
});

describe('downloadTaskRegistry', () => {
    it('hydrates known task kinds', () => {
        const task = new DeleteStoredPageTask();
        const restored = hydrateDownloadTaskFromStoredState(task.toStoredState());
        expect(restored.taskKind).toBe('deleteStoredPage');
    });

    it('hydrates fetchImageFiles with extra fields', () => {
        const task = new FetchImageFilesTask({ total: 2, completed: 1, cursor: 1 });
        const restored = hydrateDownloadTaskFromStoredState(task.toStoredState());
        expect(restored.taskKind).toBe('fetchImageFiles');
        expect(restored.total).toBe(2);
    });

    it('throws InvalidDownloadJobStoredStateError for unknown task kind', () => {
        expect(() =>
            hydrateDownloadTaskFromStoredState({
                taskKind: 'unknown',
                completed: 0,
                total: 1,
            }),
        ).toThrow(InvalidDownloadJobStoredStateError);
    });
});

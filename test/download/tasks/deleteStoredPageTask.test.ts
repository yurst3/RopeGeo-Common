import { describe, it, expect, jest } from '@jest/globals';
import { DeleteStoredPageTask } from '../../../src/download/tasks/deleteStoredPageTask';
import type { DownloadJobContext } from '../../../src/download/types';
import type { DownloadPlatformHarness } from '../../../src/download/types';

describe('DeleteStoredPageTask', () => {
    it('deletes the page bundle once and completes', async () => {
        const deletePageBundle = jest.fn<(pageId: string) => Promise<void>>().mockResolvedValue(undefined);
        const harness = { deletePageBundle } as unknown as DownloadPlatformHarness;
        const ctx = {
            pageId: 'page-123',
        } as DownloadJobContext;
        const task = new DeleteStoredPageTask();
        const signal = new AbortController().signal;

        const first = await task.runTick(ctx, harness, signal);
        expect(first.done).toBe(true);
        expect(deletePageBundle).toHaveBeenCalledWith('page-123');

        const second = await task.runTick(ctx, harness, signal);
        expect(second.done).toBe(true);
        expect(deletePageBundle).toHaveBeenCalledTimes(1);
    });
});
